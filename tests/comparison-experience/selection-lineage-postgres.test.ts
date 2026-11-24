import { seededFirmLists } from "@/fixtures/firm-lists";
import { withFirmLists } from "../firm-lists/with-firm-lists";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Prisma } from "../../.generated/prisma/client";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { getPrismaClient, disconnectPrismaClientForTests } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import { RunHistoricalEconomicsEnrichment } from "@/modules/economics/application/run-historical-economics-enrichment";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import {
  PrismaComparisonRunRepository,
  type PrismaComparisonRunDatabase,
} from "@/repositories/prisma/prisma-comparison-run-repository";
import {
  PrismaEconomicsObservationRepository,
  type PrismaEconomicsObservationDatabase,
} from "@/repositories/prisma/prisma-economics-observation-repository";
import {
  PrismaEconomicsEnrichmentRunRepository,
  type PrismaEconomicsEnrichmentDatabase,
} from "@/repositories/prisma/prisma-economics-enrichment-run-repository";
import { evidenceSourceKey } from "@/modules/evidence-panel/application/get-evidence-panel";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import {
  comparisonHref,
  parseComparisonRouteSearch,
} from "@/modules/comparison-experience/route-state";

const baseUrl = process.env.DATABASE_URL;
const pgDescribe = baseUrl ? describe.sequential : describe.skip;
const SECRET = "stage9-lineage-regression-only-signing-secret-32-bytes";
const PROJECT = "PRJ-XINYI-026";
let admin: Client;
let sql: Client;
let dbName: string;
let context: RuntimeContext;
let outsider: RuntimeContext;
let structural: Stage4ComparisonResult;
let initial: Stage5EconomicsResult;
let initialReceipt: string;
const issued: string[] = [];
const runs: Stage5EconomicsResult[] = [];
const originalRows: Record<string, unknown[]> = {};
function fresh() {
  return { ...context, requestId: randomUUID() };
}
async function actor(membership: string) {
  const repository = new PrismaDemoSessionRepository(
    getPrismaClient() as unknown as PrismaDemoSessionDatabase,
  );
  const issuedSession = await new DemoSessionService(repository, SECRET).issueForMembership(
    membership,
    { locale: "en", ttlSeconds: 1800 },
  );
  if (!issuedSession) throw new Error("QA_SESSION_REQUIRED");
  issued.push(issuedSession.sessionId);
  const result = await new SignedDemoIdentityContext(repository, SECRET).resolve(
    new Request("https://stridebrain.test/en/projects", {
      headers: { cookie: issuedSession.setCookie.split(";")[0]! },
    }),
  );
  if (!result) throw new Error("QA_CONTEXT_REQUIRED");
  return withFirmLists(result);
}
async function snapshot(table: string) {
  return (await sql.query(`SELECT to_jsonb(t) AS row FROM "${table}" t ORDER BY "id"`)).rows.map(
    (x) => x.row as Record<string, unknown>,
  );
}
async function verifyOriginal() {
  for (const [table, rows] of Object.entries(originalRows)) {
    const current = await snapshot(table);
    for (const old of rows) {
      const found = current.find((x) => x.id === (old as { id: string }).id);
      expect(found).toBeDefined();
      if (table === "ComparisonClaim") {
        const { enrichmentRunId, ...unchanged } = found!;
        expect(unchanged).toEqual(old);
        expect(enrichmentRunId).toBe(initial.run.id);
      } else expect(found).toEqual(old);
    }
  }
}
async function enrich(keys: readonly string[]) {
  const result = await createComparisonServices().runEconomics.execute(
    fresh(),
    structural.run.id,
    keys,
  );
  expect("result" in result).toBe(true);
  if (!("result" in result)) throw new Error(`ECONOMICS_${result.kind}`);
  runs.push(result.result);
  return result.result;
}
async function verifyLineage(result: Stage5EconomicsResult, selected: readonly string[]) {
  const services = createComparisonServices();
  expect(result.selectedProjectKeys).toEqual(selected);
  expect(result.run.comparisonRunId).toBe(structural.run.id);
  const reopened = await services.getEconomics.execute(fresh(), result.run.id);
  expect(reopened).toEqual(result);
  const columns = buildComparisonExperience({
    catalog: seededFirmLists,
    stage4: structural,
    economics: result,
    locale: "zh-TW",
    requestedSelectedProjectKeys: ["PRJ-FOREIGN"],
  });
  expect(columns.route.selectedProjectKeys).toEqual(selected);
  expect(columns.initialSelectedProjectKeys).toEqual(selected);
  const url = new URL(comparisonHref("zh-TW", PROJECT, columns.route), "http://localhost");
  const route = parseComparisonRouteSearch(Object.fromEntries(url.searchParams));
  expect(route.economicsRunId).toBe(result.run.id);
  expect(route.selectedProjectKeys).toEqual(selected);
  const persisted = await getPrismaClient().comparisonClaim.findMany({
    where: { enrichmentRunId: result.run.id },
  });
  expect(persisted.map((x) => x.claimKey).sort()).toEqual(
    result.claims.map((x) => x.claimKey).sort(),
  );
  expect(
    persisted.every(
      (x) => x.organizationId === context.organizationId && x.comparisonRunId === structural.run.id,
    ),
  ).toBe(true);
  // Bundles inherit ownership from the exact enrichment snapshot; no new field is required.
  for (const bundle of result.evidenceBundles) {
    expect(result.claims.some((x) => x.claimKey === bundle.claimKey)).toBe(true);
    const panel = await services.getEvidencePanel.execute(
      fresh(),
      {
        mode: "CLAIM",
        comparisonRunId: structural.run.id,
        enrichmentRunId: result.run.id,
        claimKey: bundle.claimKey,
      },
      "zh-TW",
    );
    expect(panel.kind).toBe("READY");
    if (panel.kind === "READY") {
      expect(panel.view.context).toMatchObject({
        enrichmentRunId: result.run.id,
        comparisonRunId: structural.run.id,
      });
      expect(panel.view.claim?.claimKey).toBe(bundle.claimKey);
      expect(panel.view.sources.map((source) => source.sourceKey).sort()).toEqual(
        bundle.sources
          .map((source) => evidenceSourceKey(structural.run.id, source.referenceId))
          .sort(),
      );
      expect(
        panel.view.sources.every(
          (source) =>
            "enrichmentRunId" in source.sourceSelection &&
            source.sourceSelection.enrichmentRunId === result.run.id,
        ),
      ).toBe(true);
    }
  }
  const proposal = await createInternalReviewServices().prepare(fresh(), {
    projectKey: PROJECT,
    comparisonRunId: structural.run.id,
    enrichmentRunId: result.run.id,
    locale: "en",
  });
  // A smaller selection yields actual-history gaps, which are now themselves reviewable.
  expect(proposal.kind).toBe("PREPARED");
  if (proposal.kind === "PREPARED") {
    expect(proposal.proposal.enrichmentRunId).toBe(result.run.id);
    expect(proposal.proposal.returnContext.selectedProjectKeys).toEqual(selected);
  }
  await verifyOriginal();
  const rank = await services.getComparison.execute(fresh(), structural.run.id);
  expect(rank.kind).toBe("COMPLETE");
  if (rank.kind === "COMPLETE") expect(rank.result).toEqual(structural);
}
pgDescribe("Stage9 real PostgreSQL selection lineage and populated upgrade", () => {
  beforeAll(async () => {
    admin = new Client({ connectionString: baseUrl });
    await admin.connect();
    dbName = `stridebrain_s9_lineage_${randomUUID().replaceAll("-", "")}`;
    await admin.query(`CREATE DATABASE "${dbName}"`);
    const uri = new URL(baseUrl!);
    uri.pathname = "/" + dbName;
    process.env.DATABASE_URL = uri.toString();
    await disconnectPrismaClientForTests();
    sql = new Client({ connectionString: uri.toString() });
    await sql.connect();
    for (const dir of readdirSync("prisma/migrations")
      .filter((x) => /^000[1-8]_/.test(x))
      .sort())
      await sql.query(readFileSync(`prisma/migrations/${dir}/migration.sql`, "utf8"));
    // Independent document columns/triggers are required by today's seed and Prisma client.
    // The migration under test remains withheld until its populated-upgrade assertions.
    await sql.query(
      readFileSync("prisma/migrations/20261122090000_quote_issue/migration.sql", "utf8"),
    );
    for (const name of [
      "horizon-atelier",
      "stage2-authorization",
      "stage4-comparison",
      "stage5-economics",
    ])
      await sql.query(readFileSync(`prisma/fixtures/${name}.sql`, "utf8"));
    // This test deliberately withholds 0009 to exercise its populated upgrade.
    // Install the independent Jobs columns required by the current application,
    // and prove their additive migration preserves already-seeded projects.
    const beforeJobs = await snapshot("Project");
    await sql.query(
      readFileSync("prisma/migrations/20261121060000_project_jobs/migration.sql", "utf8"),
    );
    await sql.query(
      readFileSync(
        "prisma/migrations/20261121170000_internal_review_policy_2/migration.sql",
        "utf8",
      ),
    );
    // Independent claim metadata columns are needed by the current adapter.
    await sql.query(
      'ALTER TABLE "ComparisonClaim" ADD COLUMN "categoryId" TEXT, ADD COLUMN "originalClaimKey" TEXT',
    );
    const afterJobs = await snapshot("Project");
    expect(
      afterJobs.map(({ commercialCategoryIds, ...row }) => {
        expect(commercialCategoryIds).toEqual([]);
        return row;
      }),
    ).toEqual(beforeJobs);
    for (const independent of [
      "20261124010000_client_details_and_firm_preferences",
      "20261124011000_firm_job_types_and_units",
      "20261124012000_firm_work_categories",
    ])
      await sql.query(readFileSync(`prisma/migrations/${independent}/migration.sql`, "utf8"));
    context = await actor("membership_horizon_mei");
    outsider = await actor("membership_northern_owner");
    const comparison = await createComparisonServices().runComparison.execute(fresh(), PROJECT);
    if (comparison.kind !== "COMPLETE") throw new Error("STRUCTURAL_REQUIRED");
    structural = comparison.result;
    expect(structural.matches.map((x) => x.displayScore)).toEqual([88, 81, 79, 71, 69, 63]);
    const database = getPrismaClient();
    // Reproduce the pre-0009 writer: same immutable snapshot/decisions, claims without the new owner column.
    const legacy: PrismaEconomicsEnrichmentDatabase = {
      economicsEnrichmentRun: { findFirst: async () => null },
      $transaction: (work) =>
        database.$transaction(async (tx) =>
          work({
            economicsEnrichmentRun: {
              create: (args) =>
                tx.economicsEnrichmentRun.create(args as Prisma.EconomicsEnrichmentRunCreateArgs),
            },
            comparisonClaim: {
              createMany: (args) => {
                const data = (args as { data: Prisma.ComparisonClaimCreateManyInput[] }).data.map(
                  (claim) => {
                    const legacyClaim = { ...claim };
                    delete legacyClaim.enrichmentRunId;
                    return legacyClaim;
                  },
                );
                return tx.comparisonClaim.createMany({ data });
              },
            },
          }),
        ),
    };
    const service = new RunHistoricalEconomicsEnrichment(
      new PrismaComparisonRunRepository(database as unknown as PrismaComparisonRunDatabase),
      new PrismaEconomicsObservationRepository(
        database as unknown as PrismaEconomicsObservationDatabase,
      ),
      new PrismaEconomicsEnrichmentRunRepository(legacy),
    );
    const economics = await service.execute(
      fresh(),
      structural.run.id,
      structural.defaultSelectedProjectKeys,
    );
    if (!("result" in economics)) throw new Error(`LEGACY_${economics.kind}`);
    initial = economics.result;
    const reviews = createInternalReviewServices();
    const prepared = await reviews.prepare(fresh(), {
      projectKey: PROJECT,
      comparisonRunId: structural.run.id,
      enrichmentRunId: initial.run.id,
      locale: "en",
    });
    if (prepared.kind !== "PREPARED") throw new Error(`LEGACY_${prepared.kind}`);
    const p = prepared.proposal;
    const confirmed = await reviews.confirm(fresh(), {
      version: "internal-review-command.v1",
      proposalKey: p.businessKey,
      title: p.title,
      rationale: p.rationale,
      assigneeKey: p.suggestedAssigneeKey,
      dueDate: p.suggestedDueDate,
      confirmation: true,
      idempotencyKey: p.idempotencyKey,
      locale: "en",
    });
    if (confirmed.kind !== "CREATED") throw new Error(`LEGACY_${confirmed.kind}`);
    initialReceipt = confirmed.receipt.businessKey;
    for (const table of [
      "ComparisonRun",
      "ComparisonCandidate",
      "ComparisonFactor",
      "EconomicsEnrichmentRun",
      "EconomicsObservationDecision",
      "ComparisonClaim",
      "ProposedAction",
      "Action",
      "InternalReviewReceipt",
      "AuditEvent",
    ])
      originalRows[table] = await snapshot(table);
  }, 30000);
  afterAll(async () => {
    if (sql) {
      if (issued.length)
        await sql.query('UPDATE "DemoSession" SET "revokedAt"=now() WHERE "id" = ANY($1::text[])', [
          issued,
        ]);
      await sql.end();
    }
    await disconnectPrismaClientForTests();
    if (baseUrl) process.env.DATABASE_URL = baseUrl;
    if (admin) {
      if (dbName?.startsWith("stridebrain_s9_lineage_"))
        await admin.query(`DROP DATABASE "${dbName}" WITH (FORCE)`);
      await admin.end();
    }
  });
  it.each([
    {
      name: "snapshot run identity",
      path: "{result,run,id}",
      value: '"wrong-run"',
      error: "ECONOMICS_SNAPSHOT_IDENTITY_MISMATCH",
    },
    {
      name: "snapshot comparison identity",
      path: "{result,run,comparisonRunId}",
      value: '"wrong-comparison"',
      error: "ECONOMICS_SNAPSHOT_IDENTITY_MISMATCH",
    },
    {
      name: "snapshot shape",
      path: "{result,claims}",
      value: "{}",
      error: "ECONOMICS_SNAPSHOT_IDENTITY_MISMATCH",
    },
    {
      name: "claim content",
      path: "{result,claims,0,titleEn}",
      value: '"wrong-content"',
      error: "ECONOMICS_CLAIM_SNAPSHOT_MISMATCH",
    },
    { name: "missing stored claim", error: "ECONOMICS_PERSISTED_CLAIM_MISSING" },
    { name: "duplicate snapshot claim", error: "AMBIGUOUS_ECONOMICS_CLAIM_OWNER" },
    {
      name: "unowned stored claim",
      path: "{result,claims}",
      value: "[]",
      error: "ECONOMICS_CLAIM_OWNER_MISSING",
    },
  ])("fails closed for $name without changing historical payloads", async (check) => {
    await sql.query("BEGIN");
    try {
      if ("path" in check)
        await sql.query(
          'UPDATE "EconomicsEnrichmentRun" SET "resultSnapshot"=jsonb_set("resultSnapshot",$1::text[],$2::jsonb) WHERE "id"=$3',
          [check.path, check.value, initial.run.id],
        );
      else if (check.name === "missing stored claim")
        await sql.query('DELETE FROM "ComparisonClaim" WHERE "claimKey"=$1', [
          initial.claims[0]!.claimKey,
        ]);
      else
        await sql.query(
          `UPDATE "EconomicsEnrichmentRun" SET "resultSnapshot"=jsonb_set("resultSnapshot",'{result,claims}', ("resultSnapshot" #> '{result,claims}') || ("resultSnapshot" #> '{result,claims,0}')) WHERE "id"=$1`,
          [initial.run.id],
        );
      await expect(
        sql.query(
          readFileSync(
            "prisma/migrations/0009_stage9_economics_selection_lineage/migration.sql",
            "utf8",
          ),
        ),
      ).rejects.toThrow(check.error);
    } finally {
      await sql.query("ROLLBACK");
    }
    for (const [table, rows] of Object.entries(originalRows))
      expect(await snapshot(table)).toEqual(rows);
    expect(
      (
        await sql.query(
          "SELECT count(*)::int AS count FROM information_schema.columns WHERE table_name='ComparisonClaim' AND column_name='enrichmentRunId'",
        )
      ).rows[0].count,
    ).toBe(0);
  });
  it("upgrades populated history without rewriting any old snapshot/claim content/action/receipt", async () => {
    await sql.query(
      readFileSync(
        "prisma/migrations/0009_stage9_economics_selection_lineage/migration.sql",
        "utf8",
      ),
    );
    await verifyOriginal();
    expect(
      (await createInternalReviewServices().getReceipt(fresh(), initialReceipt, "en")).kind,
    ).toBe("AVAILABLE");
    expect(await createComparisonServices().getEconomics.execute(fresh(), initial.run.id)).toEqual(
      initial,
    );
  });
  it.each([
    { name: "ABC→AB", indexes: [0, 1] },
    { name: "AB→AC", indexes: [0, 2] },
    { name: "AC→ABC", indexes: [0, 1, 2] },
    { name: "ABC→DEF", indexes: [3, 4, 5] },
    { name: "one", indexes: [0] },
    { name: "ABC→AB→ABC intermediate", indexes: [0, 1] },
    { name: "ABC→AB→ABC final", indexes: [0, 1, 2] },
  ])(
    "persists and reopens $name with exact evidence/proposal lineage",
    async ({ indexes }) => {
      const keys = indexes.map((i) => structural.matches[i]!.project.projectKey);
      const result = await enrich([...keys].reverse());
      expect(result.run.id).not.toBe(initial.run.id);
      expect(new Set([initial.run.id, ...runs.map((x) => x.run.id)]).size).toBe(runs.length + 1);
      await verifyLineage(result, keys);
    },
    30000,
  );
  it("keeps A1, B and A2 independently reopenable even when A fingerprints match", async () => {
    const a2 = runs.at(-1)!;
    expect(a2.selectedProjectKeys).toEqual(initial.selectedProjectKeys);
    expect(a2.run.id).not.toBe(initial.run.id);
    expect(a2.run.inputFingerprint).toBe(initial.run.inputFingerprint);
    for (const result of [initial, ...runs])
      expect(await createComparisonServices().getEconomics.execute(fresh(), result.run.id)).toEqual(
        result,
      );
  });
  it.each([
    { name: "zero", keys: [] },
    { name: "over maximum", keys: [0, 1, 2, 3] },
    { name: "foreign", keys: ["PRJ-NORTH-001"] },
    { name: "mixed unauthorized", keys: [0, "PRJ-NORTH-001"] },
  ])("rejects $name without economics/claim/decision writes", async ({ keys }) => {
    const before = await Promise.all([
      getPrismaClient().economicsEnrichmentRun.count(),
      getPrismaClient().comparisonClaim.count(),
      getPrismaClient().economicsObservationDecision.count(),
    ]);
    const result = await createComparisonServices().runEconomics.execute(
      fresh(),
      structural.run.id,
      keys.map((x) => (typeof x === "number" ? structural.matches[x]!.project.projectKey : x)),
    );
    expect(result.kind).toBe("UNAVAILABLE");
    expect(
      await Promise.all([
        getPrismaClient().economicsEnrichmentRun.count(),
        getPrismaClient().comparisonClaim.count(),
        getPrismaClient().economicsObservationDecision.count(),
      ]),
    ).toEqual(before);
  });
  it("keeps explicit concurrent/repeated submissions isolated without inventing global deduplication", async () => {
    const keys = structural.defaultSelectedProjectKeys;
    const before = await getPrismaClient().economicsEnrichmentRun.count();
    const pair = await Promise.all([enrich(keys), enrich(keys)]);
    expect(pair[0]!.run.id).not.toBe(pair[1]!.run.id);
    expect(await getPrismaClient().economicsEnrichmentRun.count()).toBe(before + 2);
    for (const result of pair) await verifyLineage(result, keys);
  }, 30000);
  it("rejects cross-tenant reads and mismatched comparison/economics evidence/proposals", async () => {
    const services = createComparisonServices();
    expect(await services.getEconomics.execute(outsider, initial.run.id)).toBeNull();
    expect(
      (
        await services.runEconomics.execute(
          outsider,
          structural.run.id,
          initial.selectedProjectKeys,
        )
      ).kind,
    ).toBe("UNAVAILABLE");
    const other = await services.runComparison.execute(fresh(), PROJECT);
    if (other.kind !== "COMPLETE") throw new Error("OTHER_REQUIRED");
    expect(
      (
        await services.getEvidencePanel.execute(
          fresh(),
          {
            mode: "CLAIM",
            comparisonRunId: other.result.run.id,
            enrichmentRunId: initial.run.id,
            claimKey: initial.claims[0]!.claimKey,
          },
          "en",
        )
      ).kind,
    ).toBe("UNAVAILABLE");
    expect(
      (
        await createInternalReviewServices().prepare(fresh(), {
          projectKey: PROJECT,
          comparisonRunId: other.result.run.id,
          enrichmentRunId: initial.run.id,
          locale: "en",
        })
      ).kind,
    ).not.toBe("PREPARED");
  });
  it("enforces per-enrichment uniqueness and tenant/comparison claim ownership in PostgreSQL", async () => {
    const source = (await getPrismaClient().comparisonClaim.findFirst({
      where: { enrichmentRunId: initial.run.id },
    }))!;
    await expect(
      getPrismaClient().comparisonClaim.create({
        data: { ...source, id: randomUUID(), value: source.value as Prisma.InputJsonValue },
      }),
    ).rejects.toThrow();
    await expect(
      getPrismaClient().comparisonClaim.create({
        data: {
          ...source,
          id: randomUUID(),
          claimKey: "BAD-LINEAGE",
          organizationId: outsider.organizationId,
          value: source.value as Prisma.InputJsonValue,
        },
      }),
    ).rejects.toThrow();
    await expect(
      getPrismaClient().comparisonClaim.create({
        data: {
          ...source,
          id: randomUUID(),
          claimKey: "BAD-LINEAGE",
          comparisonRunId: "missing-comparison",
          value: source.value as Prisma.InputJsonValue,
        },
      }),
    ).rejects.toThrow();
    await verifyOriginal();
  });
});
