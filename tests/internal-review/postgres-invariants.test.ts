import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EvidencePanel } from "@/components/evidence/evidence-panel";
import { evidenceSourceKey } from "@/modules/evidence-panel/application/get-evidence-panel";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/prisma/client";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { disconnectPrismaClientForTests, getPrismaClient } from "@/lib/server/prisma";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import type {
  ConfirmInternalReviewInput,
  ProposedActionDTO,
  ProposalContent,
} from "@/modules/internal-review/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { PrismaInternalReviewRepository } from "@/repositories/prisma/prisma-internal-review-repository";
import type { InternalReviewTransaction } from "@/repositories/ports/internal-review-repository";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe.sequential : describe.skip;
const SECRET = "independent-stage8-test-session-signing-secret-32-bytes";
const PROJECT = "PRJ-XINYI-026";
const PROJECT_ID = "prj_xinyi_026";
const ORG = "org_horizon";
const TEST_DB_PREFIX = "stridebrain_sb029_eval_";
const CHECKPOINTS = [
  "AFTER_ACTION",
  "AFTER_EVIDENCE",
  "AFTER_AUDIT",
  "AFTER_CONSUMPTION",
  "AFTER_RECEIPT",
  "BEFORE_COMMIT",
] as const;

type Services = ReturnType<typeof createInternalReviewServices>;
type Row = Record<string, unknown>;
type Actor = Readonly<{ context: RuntimeContext; cookie: string }>;
type Prepared = Readonly<{
  actor: Actor;
  proposal: ProposedActionDTO;
  comparisonRunId: string;
  enrichmentRunId: string;
}>;
type SourceTable =
  | "Project"
  | "QuoteVersion"
  | "ComparisonRun"
  | "EconomicsEnrichmentRun"
  | "EvidenceReference"
  | "Document"
  | "Membership"
  | "Person"
  | "ProjectAssignment"
  | "ProposedAction"
  | "DemoSession";

let administrator: PrismaClient;
let testDatabaseName: string;
let testDatabaseUrl: string;
let database: PrismaClient;
let queryLog: Array<Readonly<{ query: string; duration: number; parameters: string }>> = [];
const performanceEvidence: Record<string, unknown> = {};
const executeTransaction = PrismaInternalReviewRepository.prototype.transaction;

function fresh(context: RuntimeContext): RuntimeContext {
  return { ...context, requestId: randomUUID() };
}

function sessionRepository(): PrismaDemoSessionRepository {
  return new PrismaDemoSessionRepository(database as unknown as PrismaDemoSessionDatabase);
}

async function actor(membership = "membership_horizon_mei", locale: Locale = "en"): Promise<Actor> {
  const repository = sessionRepository();
  const issued = await new DemoSessionService(repository, SECRET).issueForMembership(membership, {
    locale,
    ttlSeconds: 86_400,
  });
  expect(issued).not.toBeNull();
  if (!issued) throw new Error("TEST_SESSION_NOT_ISSUED");
  const cookie = issued.setCookie.split(";")[0]!;
  const context = await new SignedDemoIdentityContext(repository, SECRET).resolve(
    new Request("https://stridebrain.test/en/projects/PRJ-XINYI-026", { headers: { cookie } }),
  );
  expect(context).not.toBeNull();
  if (!context) throw new Error("TEST_SESSION_NOT_RESOLVED");
  return { context, cookie };
}

async function pair(currentActor: Actor) {
  const comparisons = createComparisonServices();
  const context = fresh(currentActor.context);
  const comparison = await comparisons.runComparison.execute(context, PROJECT);
  if (comparison.kind !== "COMPLETE") throw new Error(`TEST_COMPARISON_${comparison.kind}`);
  const economics = await comparisons.runEconomics.execute(
    context,
    comparison.result.run.id,
    comparison.result.defaultSelectedProjectKeys,
  );
  if (!("result" in economics)) throw new Error(`TEST_ECONOMICS_${economics.kind}`);
  return {
    projectKey: PROJECT,
    comparisonRunId: comparison.result.run.id,
    enrichmentRunId: economics.result.run.id,
    locale: "en" as const,
    returnContext: {
      selectedProjectKeys: economics.result.selectedProjectKeys,
      evidenceSelection: {
        mode: "CLAIM" as const,
        comparisonRunId: comparison.result.run.id,
        enrichmentRunId: economics.result.run.id,
        claimKey: "XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      },
      evidenceReturnId: "internal-review-trigger",
    },
  };
}

async function prepared(
  currentActor?: Actor,
  services: Services = createInternalReviewServices(),
): Promise<Prepared> {
  const user = currentActor ?? (await actor());
  const input = await pair(user);
  const result = await services.prepare(fresh(user.context), input);
  expect(result.kind).toBe("PREPARED");
  if (result.kind !== "PREPARED") throw new Error(`TEST_PREPARE_${result.kind}`);
  return { actor: user, proposal: result.proposal, ...input };
}

function command(proposal: ProposedActionDTO): ConfirmInternalReviewInput {
  return {
    version: "internal-review-command.v1",
    proposalKey: proposal.businessKey,
    title: proposal.title,
    rationale: proposal.rationale,
    assigneeKey: proposal.suggestedAssigneeKey,
    dueDate: proposal.suggestedDueDate,
    confirmation: true,
    idempotencyKey: proposal.idempotencyKey,
    locale: proposal.locale,
  };
}

async function row(table: string, id: string): Promise<Row> {
  const rows = await database.$queryRawUnsafe<Array<{ record: Row }>>(
    `SELECT to_jsonb(record) AS record FROM "${table}" record WHERE "id" = $1`,
    id,
  );
  if (!rows[0]) throw new Error(`TEST_ROW_MISSING_${table}`);
  return rows[0].record;
}

async function proposalRow(key: string): Promise<Row> {
  const rows = await database.$queryRawUnsafe<Array<{ record: Row }>>(
    'SELECT to_jsonb(p) AS record FROM "ProposedAction" p WHERE "organizationId" = $1 AND "businessKey" = $2',
    ORG,
    key,
  );
  if (!rows[0]) throw new Error("TEST_PROPOSAL_ROW_MISSING");
  return rows[0].record;
}

async function patch(table: SourceTable, id: string, values: Row): Promise<() => Promise<void>> {
  const original = await row(table, id);
  const columns = Object.keys(values);
  const assignments = columns
    .map(
      (column) =>
        `"${column}" = (SELECT "${column}" FROM jsonb_populate_record(NULL::"${table}", $2::jsonb))`,
    )
    .join(", ");
  const sql = `UPDATE "${table}" SET ${assignments} WHERE "id" = $1`;
  await database.$executeRawUnsafe(sql, id, JSON.stringify(values));
  return async () => {
    await database.$executeRawUnsafe(sql, id, JSON.stringify(original));
  };
}

async function counts() {
  const result = await database.$queryRawUnsafe<
    Array<{ actions: number; audits: number; receipts: number; consumed: number }>
  >(`SELECT
    (SELECT count(*)::int FROM "Action") AS actions,
    (SELECT count(*)::int FROM "AuditEvent") AS audits,
    (SELECT count(*)::int FROM "InternalReviewReceipt") AS receipts,
    (SELECT count(*)::int FROM "ProposedAction" WHERE status = 'CONFIRMED') AS consumed`);
  return result[0]!;
}

async function evidenceId(proposal: ProposedActionDTO): Promise<string> {
  const stored = await proposalRow(proposal.businessKey);
  const references = stored.evidenceReferenceIds as string[];
  expect(references.length).toBeGreaterThan(0);
  return references[0]!;
}

async function requiredDocument(proposal: ProposedActionDTO) {
  const stored = await proposalRow(proposal.businessKey);
  const rows = await database.$queryRawUnsafe<
    Array<{ referenceId: string; versionId: string; documentId: string }>
  >(
    `SELECT e.id AS "referenceId", v.id AS "versionId", v."documentId"
     FROM "EvidenceReference" e JOIN "DocumentVersion" v ON v.id=e."documentVersionId"
     WHERE e.id=ANY($1::text[]) ORDER BY e.id LIMIT 1`,
    stored.evidenceReferenceIds as string[],
  );
  expect(rows).toHaveLength(1);
  return rows[0]!;
}

async function deny(capability: string, membershipId = "membership_horizon_mei") {
  const id = `test_deny_${randomUUID()}`;
  const previous = await database.$queryRawUnsafe<Array<{ id: string; effect: string }>>(
    'SELECT "id", "effect" FROM "MembershipCapabilityGrant" WHERE "organizationId" = $1 AND "membershipId" = $2 AND "capability" = $3',
    ORG,
    membershipId,
    capability,
  );
  if (previous[0]) {
    await database.$executeRawUnsafe(
      "UPDATE \"MembershipCapabilityGrant\" SET effect = 'DENY' WHERE id = $1",
      previous[0].id,
    );
    return async () => {
      await database.$executeRawUnsafe(
        'UPDATE "MembershipCapabilityGrant" SET effect = $2::"CapabilityEffect" WHERE id = $1',
        previous[0]!.id,
        previous[0]!.effect,
      );
    };
  }
  await database.$executeRawUnsafe(
    `INSERT INTO "MembershipCapabilityGrant" ("id","organizationId","membershipId","capability","effect","createdAt","updatedAt")
      VALUES ($1,$2,$3,$4,'DENY',NOW(),NOW())`,
    id,
    ORG,
    membershipId,
    capability,
  );
  return async () => {
    await database.$executeRawUnsafe('DELETE FROM "MembershipCapabilityGrant" WHERE id = $1', id);
  };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function distribution(samples: readonly number[]) {
  const ordered = [...samples].sort((a, b) => a - b);
  return {
    samples: ordered.length,
    p50: ordered[Math.ceil(ordered.length * 0.5) - 1]!,
    p95: ordered[Math.ceil(ordered.length * 0.95) - 1]!,
    max: ordered.at(-1)!,
  };
}

describePostgres("Stage 8 independent PostgreSQL invariants", () => {
  beforeAll(async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_REQUIRED");
    administrator = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    testDatabaseName = `${TEST_DB_PREFIX}${randomUUID().replaceAll("-", "")}`;
    if (!/^stridebrain_sb029_eval_[a-f0-9]{32}$/.test(testDatabaseName)) {
      throw new Error("UNSAFE_TEST_DATABASE_NAME");
    }
    await administrator.$executeRawUnsafe(`CREATE DATABASE "${testDatabaseName}"`);
    const isolatedUrl = new URL(databaseUrl);
    isolatedUrl.pathname = `/${testDatabaseName}`;
    testDatabaseUrl = isolatedUrl.toString();
    const environment = { ...process.env, DATABASE_URL: testDatabaseUrl };
    for (const script of ["db:migrate", "db:seed", "db:verify"]) {
      execFileSync("npm", ["run", script], {
        cwd: process.cwd(),
        env: environment,
        stdio: "pipe",
        timeout: 90_000,
      });
    }
    process.env.DATABASE_URL = testDatabaseUrl;
    await disconnectPrismaClientForTests();
    const instrumented = new PrismaClient({
      adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
      log: [{ emit: "event", level: "query" }],
    });
    instrumented.$on("query", (event) => {
      queryLog.push({ query: event.query, duration: event.duration, parameters: event.params });
    });
    (globalThis as typeof globalThis & { __stridebrainPrisma?: PrismaClient }).__stridebrainPrisma =
      instrumented;
    database = getPrismaClient();
    if (process.env.STAGE8_DIAGNOSTICS === "1") {
      PrismaInternalReviewRepository.prototype.transaction = async function <T>(
        this: PrismaInternalReviewRepository,
        work: (transaction: InternalReviewTransaction) => Promise<T>,
      ): Promise<T> {
        try {
          return (await executeTransaction.call(this, work)) as T;
        } catch (error) {
          console.error(
            "STAGE8_INDEPENDENT_TRANSACTION_ERROR",
            error instanceof Error ? error.message : String(error),
          );
          throw error;
        }
      };
    }
  }, 180_000);

  afterAll(async () => {
    PrismaInternalReviewRepository.prototype.transaction = executeTransaction;
    const output = process.env.STAGE8_PERFORMANCE_OUTPUT;
    if (output && Object.keys(performanceEvidence).length) {
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, JSON.stringify(performanceEvidence, null, 2) + "\n");
    }
    await disconnectPrismaClientForTests();
    if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
    if (administrator && /^stridebrain_sb029_eval_[a-f0-9]{32}$/.test(testDatabaseName ?? "")) {
      await administrator.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS "${testDatabaseName}" WITH (FORCE)`,
      );
      await administrator.$disconnect();
    }
  }, 30_000);

  it.each([
    ["Project Manager/Estimator", "membership_horizon_mei"],
    ["Financial Reviewer", "membership_horizon_finance"],
    ["Organization Admin", "membership_horizon_admin"],
  ])(
    "prepares and creates the verified canonical action as %s",
    async (_role, membership) => {
      const fixture = await prepared(await actor(membership));
      expect(fixture.proposal.title).toBe(
        "Validate imported-stone and lighting assumptions for Xinyi quote v3",
      );
      const statements = fixture.proposal.mandatoryStatements.map((item) => item.text).join(" ");
      expect(statements).toMatch(/18\.4/);
      expect(statements).toMatch(/9\.4/);
      expect(statements).toMatch(/2/);
      expect(statements).toMatch(/3/);
      expect(statements.toLowerCase()).toMatch(/programme|program/);
      expect(fixture.proposal.warnings.length).toBeGreaterThan(0);
      const before = await counts();
      const created = await createInternalReviewServices().confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      expect(created.kind).toBe("CREATED");
      if (created.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
      expect(created.receipt.status).toBe("OPEN");
      expect(created.receipt.comparisonRunId).toBe(fixture.comparisonRunId);
      expect(created.receipt.enrichmentRunId).toBe(fixture.enrichmentRunId);
      expect(created.receipt.evidenceCount).toBeGreaterThan(0);
      expect(created.receipt.returnContext).toEqual(fixture.proposal.returnContext);
      expect(await counts()).toEqual({
        actions: before.actions + 1,
        audits: before.audits + 1,
        receipts: before.receipts + 1,
        consumed: before.consumed + 1,
      });
      expect((await proposalRow(fixture.proposal.businessKey)).status).toBe("CONFIRMED");
    },
    30_000,
  );

  it("checks current run-pair entry eligibility without persisting proposals or comparison runs", async () => {
    const user = await actor();
    const input = await pair(user);
    const services = createInternalReviewServices();
    const snapshotCounts = () =>
      database.$queryRawUnsafe<
        Array<{ proposals: number; comparisons: number; enrichments: number }>
      >(
        `SELECT (SELECT count(*)::int FROM "ProposedAction") AS proposals,
         (SELECT count(*)::int FROM "ComparisonRun") AS comparisons,
         (SELECT count(*)::int FROM "EconomicsEnrichmentRun") AS enrichments`,
      );
    const before = await snapshotCounts();
    const businessBefore = await counts();
    expect(await services.canPrepare(fresh(user.context), PROJECT, input)).toBe(true);
    expect(await services.canPrepare(fresh(user.context), PROJECT)).toBe(false);
    expect(
      await services.canPrepare(fresh(user.context), PROJECT, {
        ...input,
        enrichmentRunId: `missing_${randomUUID()}`,
      }),
    ).toBe(false);
    const restoreCapability = await deny("evidence:read");
    try {
      expect(await services.canPrepare(fresh(user.context), PROJECT, input)).toBe(false);
    } finally {
      await restoreCapability();
    }
    const restoreSource = await patch("Project", PROJECT_ID, { programmeWeeks: 15 });
    try {
      expect(await services.canPrepare(fresh(user.context), PROJECT, input)).toBe(false);
    } finally {
      await restoreSource();
    }
    expect(await snapshotCounts()).toEqual(before);
    expect(await counts()).toEqual(businessBefore);
  }, 30_000);

  it.each([
    ["en", "authorityState", "OBSERVED"],
    ["zh-TW", "authorityState", "OBSERVED"],
    ["en", "supportedValue", { amount: "12345.00" }],
    ["zh-TW", "supportedValue", { amount: "12345.00" }],
  ] as const)(
    "keeps a %s saved claim inspectable with a named %s change and rejects new writes",
    async (locale, field, value) => {
      const fixture = await prepared(await actor("membership_horizon_mei", locale));
      const services = createComparisonServices();
      const reviews = createInternalReviewServices();
      const structural = await services.getComparison.execute(
        fixture.actor.context,
        fixture.comparisonRunId,
      );
      const economics = await services.getEconomics.execute(
        fixture.actor.context,
        fixture.enrichmentRunId,
      );
      if (structural.kind !== "COMPLETE" || !economics) throw new Error("TEST_SAVED_PAIR_REQUIRED");
      const snapshot = JSON.stringify({
        comparison: await row("ComparisonRun", fixture.comparisonRunId),
        economics: await row("EconomicsEnrichmentRun", fixture.enrichmentRunId),
      });
      expect(
        (await services.getFreshness.check(fixture.actor.context, structural.result, economics))
          .state,
      ).toBe("CURRENT");
      const ref = "evid_cost_cl_nanjing_023_v1_3";
      const original = await row("EvidenceReference", ref);
      const restore = await patch("EvidenceReference", ref, { [field]: value });
      const before = await counts();
      const proposalCount = await database.proposedAction.count();
      const runCount = await database.comparisonRun.count();
      const enrichmentCount = await database.economicsEnrichmentRun.count();
      try {
        const freshness = await services.getFreshness.check(
          fixture.actor.context,
          structural.result,
          economics,
        );
        expect(freshness.state).toBe("STALE");
        expect(freshness.changedSources).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sourceKey: evidenceSourceKey(fixture.comparisonRunId, ref),
              projectNameZhTw: "南京品牌體驗中心",
              reasons: expect.arrayContaining([
                field === "authorityState" ? "AUTHORITY" : "SOURCE_DETAILS",
              ]),
            }),
          ]),
        );
        const claim = {
          mode: "CLAIM" as const,
          comparisonRunId: fixture.comparisonRunId,
          enrichmentRunId: fixture.enrichmentRunId,
          claimKey: "XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
        };
        for (const selection of [
          claim,
          {
            ...claim,
            mode: "SOURCE" as const,
            sourceKey: evidenceSourceKey(fixture.comparisonRunId, ref),
          },
        ]) {
          const panel = await services.getEvidencePanel.execute(
            fixture.actor.context,
            selection,
            locale,
            freshness,
          );
          expect(panel.kind).toBe("READY");
          if (panel.kind !== "READY") throw new Error("TEST_INSPECTABLE_SAVED_PANEL_REQUIRED");
          expect(panel.view.context.stale).toBe(true);
          const html = renderToStaticMarkup(
            createElement(EvidencePanel, {
              outcome: panel,
              locale,
              onClose: () => {},
              onNavigate: () => {},
            }),
          );
          expect(html).toContain(locale === "en" ? "This result is stale" : "此比較結果已過時");
          expect(html).toContain(locale === "en" ? "Re-run comparison" : "重新比較");
          expect(html).toContain(locale === "en" ? "Nanjing Brand Experience" : "南京品牌體驗中心");
          if (selection.mode === "CLAIM") expect(html).toContain("+18.4%");
        }
        expect(await reviews.canPrepare(fixture.actor.context, PROJECT, fixture)).toBe(false);
        expect(
          (
            await reviews.prepare(fixture.actor.context, {
              projectKey: PROJECT,
              comparisonRunId: fixture.comparisonRunId,
              enrichmentRunId: fixture.enrichmentRunId,
              locale,
            })
          ).kind,
        ).toBe("PROPOSAL_STALE");
        expect((await reviews.confirm(fixture.actor.context, command(fixture.proposal))).kind).toBe(
          "STALE_COMPARISON",
        );
        expect(await counts()).toEqual(before);
        expect(await database.proposedAction.count()).toBe(proposalCount);
        expect(await database.comparisonRun.count()).toBe(runCount);
        expect(await database.economicsEnrichmentRun.count()).toBe(enrichmentCount);
        expect(
          JSON.stringify({
            comparison: await row("ComparisonRun", fixture.comparisonRunId),
            economics: await row("EconomicsEnrichmentRun", fixture.enrichmentRunId),
          }),
        ).toBe(snapshot);
        // The existing explicit re-run flow creates a distinct current result and leaves the old one intact.
        if (field === "authorityState") {
          const rerun = await pair(fixture.actor);
          expect(rerun.comparisonRunId).not.toBe(fixture.comparisonRunId);
          const newComparison = await services.getComparison.execute(
            fixture.actor.context,
            rerun.comparisonRunId,
          );
          const newEconomics = await services.getEconomics.execute(
            fixture.actor.context,
            rerun.enrichmentRunId,
          );
          if (newComparison.kind !== "COMPLETE" || !newEconomics)
            throw new Error("TEST_NEW_PAIR_REQUIRED");
          expect(
            (
              await services.getFreshness.check(
                fixture.actor.context,
                newComparison.result,
                newEconomics,
              )
            ).state,
          ).toBe("CURRENT");
          expect(
            (await services.getFreshness.check(fixture.actor.context, structural.result, economics))
              .state,
          ).toBe("STALE");
          expect(await counts()).toEqual(before);
        }
      } finally {
        await restore();
      }
      expect(await row("EvidenceReference", ref)).toEqual(original);
      expect(
        (await services.getFreshness.check(fixture.actor.context, structural.result, economics))
          .state,
      ).toBe("CURRENT");
    },
    30_000,
  );

  it("does not identify a changed source after access to it is withdrawn", async () => {
    const fixture = await prepared();
    const services = createComparisonServices();
    const structural = await services.getComparison.execute(
      fixture.actor.context,
      fixture.comparisonRunId,
    );
    const economics = await services.getEconomics.execute(
      fixture.actor.context,
      fixture.enrichmentRunId,
    );
    if (structural.kind !== "COMPLETE" || !economics) throw new Error("TEST_SAVED_PAIR_REQUIRED");
    const restore = await patch("EvidenceReference", "evid_cost_cl_nanjing_023_v1_3", {
      dataClassification: "TENANT_RESTRICTED",
    });
    try {
      const freshness = await services.getFreshness.check(
        fixture.actor.context,
        structural.result,
        economics,
      );
      expect(freshness.state).toBe("UNVERIFIED");
      expect(freshness.changedSources).toEqual([]);
      const panel = await services.getEvidencePanel.execute(
        fixture.actor.context,
        {
          mode: "CLAIM",
          comparisonRunId: fixture.comparisonRunId,
          enrichmentRunId: fixture.enrichmentRunId,
          claimKey: "XINYI_IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
        },
        "en",
        freshness,
      );
      expect(panel.kind).toBe("ACCESS_CHANGED");
    } finally {
      await restore();
    }
  }, 30_000);

  it("reopens one deterministic proposal and localized review without creating an action", async () => {
    const user = await actor();
    const input = await pair(user);
    const services = createInternalReviewServices();
    const before = await counts();
    const results = await Promise.all([
      services.prepare(fresh(user.context), input),
      services.prepare(fresh(user.context), input),
    ]);
    expect(results.map((result) => result.kind)).toEqual(["PREPARED", "PREPARED"]);
    if (results[0]?.kind !== "PREPARED" || results[1]?.kind !== "PREPARED") {
      throw new Error("TEST_PROPOSALS_REQUIRED");
    }
    expect(results[0].proposal.businessKey).toBe(results[1].proposal.businessKey);
    const chinese = await services.reopenProposal(
      fresh(user.context),
      results[0].proposal.businessKey,
      "zh-TW",
    );
    expect(chinese.kind).toBe("PREPARED");
    if (chinese.kind !== "PREPARED") throw new Error("TEST_LOCALIZED_PROPOSAL_REQUIRED");
    expect(chinese.proposal.title).toContain("進口石材");
    expect(chinese.proposal.mandatoryStatements.map((item) => item.key)).toEqual(
      results[0].proposal.mandatoryStatements.map((item) => item.key),
    );
    expect(chinese.proposal.idempotencyKey).toBe(results[0].proposal.idempotencyKey);
    expect(await counts()).toEqual(before);
  }, 30_000);

  it("denies Viewer direct proposal/create/reopen/list before sensitive reads", async () => {
    const fixture = await prepared();
    const viewer = await actor("membership_horizon_viewer");
    const services = createInternalReviewServices();
    const before = await counts();
    queryLog = [];
    const preparation = await services.prepare(fresh(viewer.context), {
      projectKey: PROJECT,
      comparisonRunId: fixture.comparisonRunId,
      enrichmentRunId: fixture.enrichmentRunId,
      locale: "en",
    });
    const reopen = await services.reopenProposal(
      fresh(viewer.context),
      fixture.proposal.businessKey,
      "en",
    );
    const confirmation = await services.confirm(fresh(viewer.context), command(fixture.proposal));
    const list = await services.listProjectActions(fresh(viewer.context), PROJECT, "en");
    const sensitiveReads = queryLog.filter((entry) =>
      /SELECT[\s\S]*(?:"ProposedAction"|"Action"|"EvidenceReference"|"EconomicsEnrichmentRun")/i.test(
        entry.query,
      ),
    );
    expect(preparation.kind).toBe("PROPOSAL_NOT_AUTHORIZED");
    expect(reopen.kind).toBe("PROPOSAL_NOT_AUTHORIZED");
    expect(confirmation.kind).toBe("ACTION_NOT_AUTHORIZED");
    expect(list.kind).toBe("ACTION_NOT_AUTHORIZED");
    expect(sensitiveReads).toEqual([]);
    const output = JSON.stringify([preparation, reopen, confirmation, list]);
    expect(output).not.toContain(fixture.proposal.title);
    expect(output).not.toContain(fixture.proposal.businessKey);
    expect(output).not.toMatch(/evidenceCount|assignee|source|18\.4/);
    expect(await counts()).toEqual(before);
  }, 30_000);

  it("rejects cross-organization project/run/enrichment/proposal/receipt selectors neutrally", async () => {
    const fixture = await prepared();
    const outsider = await actor("membership_northern_owner");
    const services = createInternalReviewServices();
    const before = await counts();
    const input = {
      projectKey: PROJECT,
      comparisonRunId: fixture.comparisonRunId,
      enrichmentRunId: fixture.enrichmentRunId,
      locale: "en" as const,
    };
    const foreign = await services.prepare(fresh(outsider.context), input);
    const missing = await services.prepare(fresh(outsider.context), {
      ...input,
      projectKey: "PRJ-NONEXISTENT",
      comparisonRunId: "missing-run",
      enrichmentRunId: "missing-economics",
    });
    expect(foreign.kind).toBe(missing.kind);
    expect(foreign.kind).not.toBe("PREPARED");
    const denied = await services.confirm(fresh(outsider.context), command(fixture.proposal));
    expect(denied.kind).toBe("ACTION_NOT_AUTHORIZED");
    const unavailable = await services.getReceipt(
      fresh(outsider.context),
      fixture.proposal.businessKey,
      "en",
    );
    expect(unavailable.kind).toBe("ACTION_NOT_AUTHORIZED");
    expect(JSON.stringify([foreign, missing, denied, unavailable])).not.toMatch(
      /Xinyi|信義|evidence_|membership_horizon/,
    );
    expect(await counts()).toEqual(before);
  }, 30_000);

  it.each([
    ["title", "The supplier is overcharging by 30%"],
    ["title", ""],
    ["title", "x".repeat(201)],
    ["rationale", "The accelerated programme caused a 20% premium"],
    ["rationale", ""],
    ["rationale", "x".repeat(501)],
    ["dueDate", "2027-02-30"],
    ["dueDate", "2000-01-01"],
    ["dueDate", "9999-12-31"],
    ["confirmation", false],
  ] as const)(
    "rejects invalid %s without consuming a proposal",
    async (field, value) => {
      const fixture = await prepared();
      const before = await counts();
      const result = await createInternalReviewServices().confirm(fresh(fixture.actor.context), {
        ...command(fixture.proposal),
        [field]: value,
      });
      expect(result.kind).toBe("VALIDATION_FAILED");
      expect(await counts()).toEqual(before);
      expect((await proposalRow(fixture.proposal.businessKey)).status).toBe("PREPARED");
    },
    30_000,
  );

  it("preserves mandatory statements when bounded title and rationale alternatives are selected", async () => {
    const fixture = await prepared();
    const alternate = {
      ...command(fixture.proposal),
      title: fixture.proposal.titleOptions[1]!.text,
      rationale: fixture.proposal.rationaleOptions[1]!.text,
      dueDate: null,
      assigneeKey: null,
    };
    const result = await createInternalReviewServices().confirm(
      fresh(fixture.actor.context),
      alternate,
    );
    expect(result.kind).toBe("CREATED");
    if (result.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
    expect(result.receipt.title).toBe(alternate.title);
    expect(result.receipt.dueDate).toBeNull();
    expect(result.receipt.assigneeDisplayName).toBeNull();
    for (const statement of fixture.proposal.mandatoryStatements) {
      expect(result.receipt.rationale).toContain(statement.text);
    }
    for (const warning of fixture.proposal.warnings) {
      expect(result.receipt.rationale).toContain(warning.text);
    }
  }, 30_000);

  it.each([
    ["comparison input", "ComparisonRun", "inputFingerprint"],
    ["comparison policy", "ComparisonRun", "policyVersion"],
    ["comparison calculation", "ComparisonRun", "calculationVersion"],
    ["economics source", "EconomicsEnrichmentRun", "sourceFingerprint"],
    ["economics input", "EconomicsEnrichmentRun", "inputFingerprint"],
    ["economics permission", "EconomicsEnrichmentRun", "permissionFingerprint"],
    ["economics structural", "EconomicsEnrichmentRun", "structuralResultFingerprint"],
    ["economics policy", "EconomicsEnrichmentRun", "authorityPolicyVersion"],
    ["economics calculation", "EconomicsEnrichmentRun", "calculationVersion"],
  ] as const)(
    "rejects changed %s at confirmation",
    async (_label, table, field) => {
      const fixture = await prepared();
      const id = table === "ComparisonRun" ? fixture.comparisonRunId : fixture.enrichmentRunId;
      const restore = await patch(table, id, { [field]: "tampered-independent-test" });
      try {
        const before = await counts();
        const result = await createInternalReviewServices().confirm(
          fresh(fixture.actor.context),
          command(fixture.proposal),
        );
        expect(result.kind).toBe("STALE_COMPARISON");
        expect(await counts()).toEqual(before);
        expect((await proposalRow(fixture.proposal.businessKey)).status).toBe("PREPARED");
      } finally {
        await restore();
      }
    },
    30_000,
  );

  it.each(["ComparisonRun", "EconomicsEnrichmentRun"] as const)(
    "rejects tampered immutable %s result snapshots",
    async (table) => {
      const fixture = await prepared();
      const id = table === "ComparisonRun" ? fixture.comparisonRunId : fixture.enrichmentRunId;
      const original = await row(table, id);
      const snapshot = structuredClone(original.resultSnapshot) as Record<string, unknown>;
      const result = snapshot.result as Record<string, unknown>;
      const run = result.run as Record<string, unknown>;
      run.inputFingerprint = "tampered-immutable-result";
      const restore = await patch(table, id, { resultSnapshot: snapshot });
      try {
        const before = await counts();
        const result = await createInternalReviewServices().confirm(
          fresh(fixture.actor.context),
          command(fixture.proposal),
        );
        expect(result.kind).toBe("STALE_COMPARISON");
        expect(await counts()).toEqual(before);
      } finally {
        await restore();
      }
    },
    30_000,
  );

  it.each(["source", "permission"])(
    "rejects the comparison %s fingerprint changing",
    async (key) => {
      const fixture = await prepared();
      const original = await row("ComparisonRun", fixture.comparisonRunId);
      const snapshot = structuredClone(original.resultSnapshot) as Record<string, unknown>;
      (snapshot.fingerprints as Record<string, unknown>)[key] = "changed-comparison-fingerprint";
      const restore = await patch("ComparisonRun", fixture.comparisonRunId, {
        resultSnapshot: snapshot,
      });
      try {
        const before = await counts();
        expect(
          (
            await createInternalReviewServices().confirm(
              fresh(fixture.actor.context),
              command(fixture.proposal),
            )
          ).kind,
        ).toBe("STALE_COMPARISON");
        expect(await counts()).toEqual(before);
      } finally {
        await restore();
      }
    },
    30_000,
  );

  it.each([
    ["project state", "status", "CLOSED"],
    ["project record", "updatedAt", "2030-01-01T00:00:00.000Z"],
    ["project deletion", "deletedAt", "2026-01-01T00:00:00.000Z"],
    ["programme", "programmeWeeks", "15.00"],
  ] as const)(
    "rejects changed %s without an action",
    async (_label, field, value) => {
      const fixture = await prepared();
      const restore = await patch("Project", PROJECT_ID, {
        [field]: value,
        ...(field === "status" ? { completedAt: new Date().toISOString().slice(0, 10) } : {}),
      });
      try {
        const before = await counts();
        const result = await createInternalReviewServices().confirm(
          fresh(fixture.actor.context),
          command(fixture.proposal),
        );
        expect(["STALE_COMPARISON", "ACTION_NOT_AUTHORIZED"]).toContain(result.kind);
        expect(await counts()).toEqual(before);
      } finally {
        await restore();
      }
    },
    30_000,
  );

  it("rejects an active quotation version change", async () => {
    const fixture = await prepared();
    const comparison = await row("ComparisonRun", fixture.comparisonRunId);
    const restore = await patch("QuoteVersion", String(comparison.activeQuoteVersionId), {
      versionNumber: 99,
    });
    try {
      const before = await counts();
      const result = await createInternalReviewServices().confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      expect(result.kind).toBe("STALE_COMPARISON");
      expect(await counts()).toEqual(before);
    } finally {
      await restore();
    }
  }, 30_000);

  it.each([
    ["locator", { field: "unrelated-field" }],
    ["supportedValue", { amount: "999999.00" }],
    ["dataClassification", "TENANT_RESTRICTED"],
    ["organizationId", "org_northern"],
    ["authorityState", "OBSERVED"],
    ["authorityState", "SUPERSEDED"],
    ["staleAt", "2000-01-01"],
    ["subjectId", "prj_north_001"],
  ] as const)(
    "rejects required evidence %s mutation",
    async (field, value) => {
      const fixture = await prepared();
      const reference = await evidenceId(fixture.proposal);
      const restore = await patch("EvidenceReference", reference, { [field]: value });
      try {
        const before = await counts();
        const result = await createInternalReviewServices().confirm(
          fresh(fixture.actor.context),
          command(fixture.proposal),
        );
        expect(["EVIDENCE_UNAVAILABLE", "STALE_COMPARISON"]).toContain(result.kind);
        expect(await counts()).toEqual(before);
      } finally {
        await restore();
      }
    },
    30_000,
  );

  it("rejects a changed locator that predates proposal preparation", async () => {
    const fixture = await prepared();
    const reference = await evidenceId(fixture.proposal);
    const restore = await patch("EvidenceReference", reference, {
      locator: { field: "changed-before-open" },
    });
    try {
      const result = await createInternalReviewServices().prepare(fresh(fixture.actor.context), {
        projectKey: PROJECT,
        comparisonRunId: fixture.comparisonRunId,
        enrichmentRunId: fixture.enrichmentRunId,
        locale: "en",
      });
      expect(result.kind).not.toBe("PREPARED");
      expect(["PROPOSAL_STALE", "PROPOSAL_UNAVAILABLE"]).toContain(result.kind);
    } finally {
      await restore();
    }
  }, 30_000);

  it("rejects a newly inserted open conflict on required evidence", async () => {
    const fixture = await prepared();
    const stored = await proposalRow(fixture.proposal.businessKey);
    const references = stored.evidenceReferenceIds as string[];
    const conflictId = `test_conflict_${randomUUID()}`;
    await database.$executeRawUnsafe(
      `INSERT INTO "EvidenceConflict" ("id","organizationId","conflictKey","primaryEvidenceId","conflictingEvidenceId","status","createdAt","updatedAt")
        VALUES ($1,$2,$1,$3,$4,'OPEN',NOW(),NOW())`,
      conflictId,
      ORG,
      references[0],
      references[1],
    );
    try {
      const before = await counts();
      const result = await createInternalReviewServices().confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      expect(["EVIDENCE_UNAVAILABLE", "STALE_COMPARISON"]).toContain(result.kind);
      expect(await counts()).toEqual(before);
    } finally {
      await database.$executeRawUnsafe('DELETE FROM "EvidenceConflict" WHERE id=$1', conflictId);
    }
  }, 30_000);

  it("rejects a required source crossing its stale date without a source edit or proposal expiry", async () => {
    const original = await prepared();
    const reference = await evidenceId(original.proposal);
    const nextMidnight = new Date();
    nextMidnight.setUTCHours(24, 0, 0, 0);
    const staleDate = nextMidnight.toISOString().slice(0, 10);
    const restore = await patch("EvidenceReference", reference, { staleAt: staleDate });
    try {
      const prepareAt = new Date(nextMidnight.getTime() - 10 * 60_000);
      const service = createInternalReviewServices({ clock: () => prepareAt });
      const fixture = await prepared(await actor(), service);
      const confirmAt = new Date(nextMidnight.getTime() + 1);
      expect(confirmAt.getTime()).toBeLessThan(new Date(fixture.proposal.expiresAt).getTime());
      const before = await counts();
      const result = await createInternalReviewServices({ clock: () => confirmAt }).confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      expect(result.kind).toBe("EVIDENCE_UNAVAILABLE");
      expect(await counts()).toEqual(before);
    } finally {
      await restore();
    }
  }, 30_000);

  it("rejects quote validity crossing organization-local midnight without changing the quote", async () => {
    const initial = await prepared();
    const comparison = await row("ComparisonRun", initial.comparisonRunId);
    const localDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const nextMidnight = new Date(`${localDay}T00:00:00+08:00`);
    nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
    const restore = await patch("QuoteVersion", String(comparison.activeQuoteVersionId), {
      validUntil: localDay,
    });
    try {
      const prepareAt = new Date(nextMidnight.getTime() - 10 * 60_000);
      const fixture = await prepared(
        await actor(),
        createInternalReviewServices({ clock: () => prepareAt }),
      );
      const confirmAt = new Date(nextMidnight.getTime() + 1);
      expect(confirmAt.getTime()).toBeLessThan(new Date(fixture.proposal.expiresAt).getTime());
      const before = await counts();
      const outcome = await createInternalReviewServices({ clock: () => confirmAt }).confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      expect(outcome.kind).toBe("STALE_COMPARISON");
      expect(await counts()).toEqual(before);
    } finally {
      await restore();
    }
  }, 30_000);

  it.each([
    "action:internal-review:create",
    "action:internal-review:propose",
    "commercial:actual-read",
    "evidence:read",
  ])(
    "re-resolves current %s denial from the signed session at confirmation",
    async (capability) => {
      const fixture = await prepared();
      const restore = await deny(capability);
      try {
        const before = await counts();
        const result = await createInternalReviewServices().confirm(
          fresh(fixture.actor.context),
          command(fixture.proposal),
        );
        expect(["ACTION_NOT_AUTHORIZED", "EVIDENCE_UNAVAILABLE", "STALE_COMPARISON"]).toContain(
          result.kind,
        );
        expect(await counts()).toEqual(before);
      } finally {
        await restore();
      }
    },
    30_000,
  );

  it.each([
    ["Membership", "membership_horizon_mei", "active", false],
    ["Person", "person_horizon_mei", "active", false],
    ["Membership", "membership_horizon_mei", "role", "VIEWER"],
  ] as const)(
    "rejects changed actor %s.%s",
    async (table, id, field, value) => {
      const fixture = await prepared();
      const restore = await patch(table, id, { [field]: value });
      try {
        const before = await counts();
        const result = await createInternalReviewServices().confirm(
          fresh(fixture.actor.context),
          command(fixture.proposal),
        );
        expect(result.kind).toBe("ACTION_NOT_AUTHORIZED");
        expect(await counts()).toEqual(before);
      } finally {
        await restore();
      }
    },
    30_000,
  );

  it("rejects session revocation and lost action assignment using the previously resolved context", async () => {
    const fixture = await prepared();
    expect(fixture.actor.context.sessionId).toBeTruthy();
    const restoreSession = await patch("DemoSession", fixture.actor.context.sessionId!, {
      revokedAt: new Date().toISOString(),
    });
    try {
      expect(
        (
          await createInternalReviewServices().confirm(
            fresh(fixture.actor.context),
            command(fixture.proposal),
          )
        ).kind,
      ).toBe("ACTION_NOT_AUTHORIZED");
    } finally {
      await restoreSession();
    }
    const assignments = await database.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM "ProjectAssignment" WHERE "projectId"=$1 AND "membershipId"=$2',
      PROJECT_ID,
      fixture.actor.context.membershipId,
    );
    const restoreAssignment = await patch("ProjectAssignment", assignments[0]!.id, {
      canCreateAction: false,
    });
    try {
      expect(
        (
          await createInternalReviewServices().confirm(
            fresh(fixture.actor.context),
            command(fixture.proposal),
          )
        ).kind,
      ).toBe("ACTION_NOT_AUTHORIZED");
    } finally {
      await restoreAssignment();
    }
  }, 30_000);

  it("rejects foreign assignees and an assignee whose eligibility changes", async () => {
    const fixture = await prepared();
    const services = createInternalReviewServices();
    const before = await counts();
    const foreign = await services.confirm(fresh(fixture.actor.context), {
      ...command(fixture.proposal),
      assigneeKey: "membership_northern_owner",
    });
    expect(foreign.kind).toBe("ASSIGNEE_UNAVAILABLE");
    const restore = await patch("Membership", "membership_horizon_finance", { active: false });
    try {
      const unavailable = await services.confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      expect(unavailable.kind).toBe("ASSIGNEE_UNAVAILABLE");
      expect(await counts()).toEqual(before);
    } finally {
      await restore();
    }
  }, 30_000);

  it("allows only the stored default without action:assign and exposes no alternate people", async () => {
    const restore = await deny("action:assign");
    try {
      const fixture = await prepared(await actor());
      expect(fixture.proposal.canAssign).toBe(false);
      expect(
        fixture.proposal.assignees.every(
          (candidate) => candidate.key === fixture.proposal.suggestedAssigneeKey,
        ),
      ).toBe(true);
      const services = createInternalReviewServices();
      const changed = await services.confirm(fresh(fixture.actor.context), {
        ...command(fixture.proposal),
        assigneeKey: "membership_horizon_admin",
      });
      expect(changed.kind).toBe("ASSIGNEE_UNAVAILABLE");
      expect(
        (await services.confirm(fresh(fixture.actor.context), command(fixture.proposal))).kind,
      ).toBe("CREATED");
    } finally {
      await restore();
    }
  }, 30_000);

  it("rejects expiry at the boundary, direct proposal alteration and a non-server-issued key", async () => {
    const fixture = await prepared();
    const atExpiry = createInternalReviewServices({
      clock: () => new Date(fixture.proposal.expiresAt),
    });
    const before = await counts();
    expect(
      (await atExpiry.confirm(fresh(fixture.actor.context), command(fixture.proposal))).kind,
    ).toBe("PROPOSAL_EXPIRED");
    const services = createInternalReviewServices();
    const unknownKey = await services.confirm(fresh(fixture.actor.context), {
      ...command(fixture.proposal),
      idempotencyKey: randomUUID(),
    });
    expect(unknownKey.kind).toBe("IDEMPOTENCY_CONFLICT");
    const stored = await proposalRow(fixture.proposal.businessKey);
    await expect(
      database.$executeRawUnsafe(
        "UPDATE \"ProposedAction\" SET status='CANCELLED' WHERE id=$1",
        stored.id,
      ),
    ).rejects.toThrow();
    expect(await counts()).toEqual(before);
  }, 30_000);

  it("replays the same durable receipt after expiry/source change but rejects payload changes", async () => {
    const fixture = await prepared();
    const services = createInternalReviewServices();
    const input = command(fixture.proposal);
    const created = await services.confirm(fresh(fixture.actor.context), input);
    expect(created.kind).toBe("CREATED");
    if (created.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
    const before = await counts();
    for (const changed of [
      { title: fixture.proposal.titleOptions[1]!.text },
      { rationale: fixture.proposal.rationaleOptions[1]!.text },
      { dueDate: null },
      { assigneeKey: null },
    ]) {
      expect(
        (await services.confirm(fresh(fixture.actor.context), { ...input, ...changed })).kind,
      ).toBe("IDEMPOTENCY_CONFLICT");
    }
    const restore = await patch("Project", PROJECT_ID, { programmeWeeks: "15.00" });
    try {
      const late = createInternalReviewServices({
        clock: () => new Date(new Date(fixture.proposal.expiresAt).getTime() + 1),
      });
      const replay = await late.confirm(fresh(fixture.actor.context), input);
      expect(replay.kind).toBe("IDEMPOTENT_REPLAY");
      if (replay.kind !== "IDEMPOTENT_REPLAY") throw new Error("TEST_RECEIPT_REQUIRED");
      expect(replay.receipt).toEqual(created.receipt);
      const reopened = await services.getReceipt(
        fresh(fixture.actor.context),
        created.receipt.businessKey,
        "en",
      );
      expect(reopened.kind).toBe("AVAILABLE");
      expect(await counts()).toEqual(before);
    } finally {
      await restore();
    }
  }, 30_000);

  it("serializes concurrent identical confirmations to one action and durable receipt", async () => {
    const fixture = await prepared();
    const before = await counts();
    const services = createInternalReviewServices();
    const outcomes = await Promise.all(
      Array.from({ length: 6 }, () =>
        services.confirm(fresh(fixture.actor.context), command(fixture.proposal)),
      ),
    );
    expect(outcomes.filter((outcome) => outcome.kind === "CREATED")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.kind === "IDEMPOTENT_REPLAY")).toHaveLength(5);
    const keys = outcomes.flatMap((outcome) =>
      "receipt" in outcome ? [outcome.receipt.businessKey] : [],
    );
    expect(new Set(keys).size).toBe(1);
    expect(await counts()).toEqual({
      actions: before.actions + 1,
      audits: before.audits + 1,
      receipts: before.receipts + 1,
      consumed: before.consumed + 1,
    });
    const wrongKey = await services.confirm(fresh(fixture.actor.context), {
      ...command(fixture.proposal),
      idempotencyKey: randomUUID(),
    });
    expect(["IDEMPOTENCY_CONFLICT", "PROPOSAL_ALREADY_CONSUMED"]).toContain(wrongKey.kind);
  }, 30_000);

  it("rejects competing same-key different-payload confirmation without a second action", async () => {
    const fixture = await prepared();
    const before = await counts();
    const services = createInternalReviewServices();
    const outcomes = await Promise.all([
      services.confirm(fresh(fixture.actor.context), command(fixture.proposal)),
      services.confirm(fresh(fixture.actor.context), {
        ...command(fixture.proposal),
        title: fixture.proposal.titleOptions[1]!.text,
      }),
    ]);
    expect(outcomes.map((outcome) => outcome.kind).sort()).toEqual([
      "CREATED",
      "IDEMPOTENCY_CONFLICT",
    ]);
    expect((await counts()).actions).toBe(before.actions + 1);
  }, 30_000);

  it.each(CHECKPOINTS)(
    "rolls back every record after injected %s failure",
    async (checkpoint) => {
      const fixture = await prepared();
      const before = await counts();
      let injected = false;
      const services = createInternalReviewServices({
        checkpoint: (step) => {
          if (step === checkpoint) {
            injected = true;
            throw new Error("INDEPENDENT_INJECTED_TRANSACTION_FAILURE");
          }
        },
      });
      const result = await services.confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      expect(injected).toBe(true);
      expect(result.kind).toBe("ACTION_CREATE_FAILED");
      expect(await counts()).toEqual(before);
      const proposal = await proposalRow(fixture.proposal.businessKey);
      expect(proposal.status).toBe("PREPARED");
      expect(proposal.consumedAt).toBeNull();
    },
    30_000,
  );

  it("observes a source writer committed before the confirmation lock boundary", async () => {
    const fixture = await prepared();
    const original = await row("Project", PROJECT_ID);
    const writer = new PrismaClient({
      adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
    });
    const updated = deferred();
    const releaseWriter = deferred();
    const transaction = writer.$transaction(
      async (connection) => {
        await connection.$executeRawUnsafe(
          'UPDATE "Project" SET "programmeWeeks"=15 WHERE id=$1',
          PROJECT_ID,
        );
        updated.resolve();
        await releaseWriter.promise;
      },
      { timeout: 10_000 },
    );
    await updated.promise;
    const confirmation = createInternalReviewServices().confirm(
      fresh(fixture.actor.context),
      command(fixture.proposal),
    );
    try {
      await expect
        .poll(
          async () => {
            const waiting = await administrator.$queryRawUnsafe<Array<{ count: number }>>(
              `SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname=$1 AND wait_event_type='Lock' AND query ILIKE '%LOCK TABLE%'`,
              testDatabaseName,
            );
            return waiting[0]!.count;
          },
          { timeout: 1_500, interval: 25 },
        )
        .toBeGreaterThan(0);
      releaseWriter.resolve();
      await transaction;
      const outcome = await confirmation;
      expect(outcome.kind).toBe("STALE_COMPARISON");
      expect((await proposalRow(fixture.proposal.businessKey)).status).toBe("PREPARED");
    } finally {
      releaseWriter.resolve();
      await transaction;
      await confirmation;
      await database.$executeRawUnsafe(
        'UPDATE "Project" SET "programmeWeeks"=$2::numeric WHERE id=$1',
        PROJECT_ID,
        String(original.programmeWeeks),
      );
      await writer.$disconnect();
    }
  }, 30_000);

  it("blocks a source mutation arriving after authoritative locks until the action commits", async () => {
    const fixture = await prepared();
    const original = await row("Project", PROJECT_ID);
    const writer = new PrismaClient({
      adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
    });
    const actionWritten = deferred();
    const releaseAction = deferred();
    const services = createInternalReviewServices({
      checkpoint: async (step) => {
        if (step === "AFTER_ACTION") {
          actionWritten.resolve();
          await releaseAction.promise;
        }
      },
    });
    const confirmation = services.confirm(fresh(fixture.actor.context), command(fixture.proposal));
    await actionWritten.promise;
    let writerCompleted = false;
    const mutation = writer
      .$executeRawUnsafe('UPDATE "Project" SET "programmeWeeks"=15 WHERE id=$1', PROJECT_ID)
      .then(() => {
        writerCompleted = true;
      });
    try {
      await expect
        .poll(
          async () => {
            const waiting = await administrator.$queryRawUnsafe<Array<{ count: number }>>(
              `SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname=$1 AND wait_event_type='Lock' AND query ILIKE '%UPDATE "Project"%'`,
              testDatabaseName,
            );
            return waiting[0]!.count;
          },
          { timeout: 1_500, interval: 25 },
        )
        .toBeGreaterThan(0);
      expect(writerCompleted).toBe(false);
      releaseAction.resolve();
      expect((await confirmation).kind).toBe("CREATED");
      await mutation;
      expect(writerCompleted).toBe(true);
    } finally {
      releaseAction.resolve();
      await confirmation;
      await mutation;
      await database.$executeRawUnsafe(
        'UPDATE "Project" SET "programmeWeeks"=$2::numeric WHERE id=$1',
        PROJECT_ID,
        String(original.programmeWeeks),
      );
      await writer.$disconnect();
    }
  }, 30_000);

  it("reconstructs the successful audit and protects action, proposal and receipt invariants in SQL", async () => {
    const fixture = await prepared();
    const request = fresh(fixture.actor.context);
    const input = {
      ...command(fixture.proposal),
      title: fixture.proposal.titleOptions[1]!.text,
      rationale: fixture.proposal.rationaleOptions[1]!.text,
    };
    const result = await createInternalReviewServices().confirm(request, input);
    expect(result.kind).toBe("CREATED");
    if (result.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
    const actions = await database.$queryRawUnsafe<Array<{ record: Row }>>(
      'SELECT to_jsonb(a) AS record FROM "Action" a WHERE "businessKey"=$1 AND "organizationId"=$2',
      result.receipt.businessKey,
      ORG,
    );
    const actionRow = actions[0]!.record;
    const audits = await database.$queryRawUnsafe<Array<{ record: Row }>>(
      'SELECT to_jsonb(a) AS record FROM "AuditEvent" a WHERE "actionId"=$1',
      actionRow.id,
    );
    expect(audits).toHaveLength(1);
    const event = audits[0]!.record;
    const payload = event.payload as Record<string, unknown>;
    expect(payload).toMatchObject({
      version: "internal-review-audit.v1",
      actor: { userId: request.userId, membershipId: request.membershipId },
      organizationId: ORG,
      projectId: PROJECT_ID,
      projectKey: PROJECT,
      proposalKey: fixture.proposal.businessKey,
      actionKey: result.receipt.businessKey,
      comparisonRunId: fixture.comparisonRunId,
      enrichmentRunId: fixture.enrichmentRunId,
      requestId: request.requestId,
      correlationId: request.requestId,
      idempotencyKey: input.idempotencyKey,
      result: "SUCCESS",
    });
    expect(payload.original).toMatchObject({
      title: { en: fixture.proposal.title },
      dueDate: fixture.proposal.suggestedDueDate,
    });
    expect(payload.final).toMatchObject({
      title: { en: input.title },
      rationale: { en: result.receipt.rationale },
      dueDate: input.dueDate,
      assigneeMembershipId: "membership_horizon_finance",
    });
    expect(payload.policyVersions).toMatchObject({ action: "INTERNAL-REVIEW-ACTION-1.0" });
    expect(payload.evidenceReferenceIds).toEqual(actionRow.evidenceReferenceIds);
    const proposal = await proposalRow(fixture.proposal.businessKey);
    const content = proposal.contentSnapshot as ProposalContent;
    expect(payload.claimKeys).toEqual(content.claims.map((claim) => claim.claimKey));
    expect(typeof payload.timestamp).toBe("string");
    expect(payload.fingerprints).toBeTruthy();
    expect(actionRow.evidenceSnapshot).toBeTruthy();
    await expect(
      database.$executeRawUnsafe(
        "UPDATE \"AuditEvent\" SET result='ALTERED' WHERE id=$1",
        event.id,
      ),
    ).rejects.toThrow();
    await expect(
      database.$executeRawUnsafe('DELETE FROM "AuditEvent" WHERE id=$1', event.id),
    ).rejects.toThrow();
    await expect(
      database.$executeRawUnsafe("UPDATE \"Action\" SET title='ALTERED' WHERE id=$1", actionRow.id),
    ).rejects.toThrow();
    const duplicate = {
      ...actionRow,
      id: `duplicate_${randomUUID()}`,
      businessKey: `duplicate_${randomUUID()}`,
    };
    await expect(
      database.$executeRawUnsafe(
        'INSERT INTO "Action" SELECT (jsonb_populate_record(NULL::"Action",$1::jsonb)).*',
        JSON.stringify(duplicate),
      ),
    ).rejects.toThrow();
    const foreign = {
      ...actionRow,
      id: `foreign_${randomUUID()}`,
      businessKey: `foreign_${randomUUID()}`,
      organizationId: "org_northern",
    };
    await expect(
      database.$executeRawUnsafe(
        'INSERT INTO "Action" SELECT (jsonb_populate_record(NULL::"Action",$1::jsonb)).*',
        JSON.stringify(foreign),
      ),
    ).rejects.toThrow();
    const receipts = await database.$queryRawUnsafe<Array<{ record: Row }>>(
      'SELECT to_jsonb(r) AS record FROM "InternalReviewReceipt" r WHERE "actionId"=$1',
      actionRow.id,
    );
    expect(receipts).toHaveLength(1);
    await expect(
      database.$executeRawUnsafe(
        'UPDATE "InternalReviewReceipt" SET "payloadFingerprint"=\'ALTERED\' WHERE id=$1',
        receipts[0]!.record.id,
      ),
    ).rejects.toThrow();
  }, 30_000);

  it("shows a durable action in both Actions and Project Workspace and reopens it in Chinese", async () => {
    const fixture = await prepared();
    const services = createInternalReviewServices();
    const created = await services.confirm(fresh(fixture.actor.context), command(fixture.proposal));
    if (created.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
    const list = await services.listProjectActions(fresh(fixture.actor.context), PROJECT, "en");
    expect(list.kind).toBe("AVAILABLE");
    if (list.kind !== "AVAILABLE") throw new Error("TEST_ACTION_LIST_REQUIRED");
    expect(list.actions.some((action) => action.businessKey === created.receipt.businessKey)).toBe(
      true,
    );
    const workspace = await createProjectWorkspaceService().execute(
      fresh(fixture.actor.context),
      PROJECT,
    );
    expect(workspace.kind).toBe("AVAILABLE");
    if (workspace.kind !== "AVAILABLE") throw new Error("TEST_WORKSPACE_REQUIRED");
    expect(
      workspace.workspace.openActions.some(
        (action) => action.actionKey === created.receipt.businessKey,
      ),
    ).toBe(true);
    const receipt = await services.getReceipt(
      fresh(fixture.actor.context),
      created.receipt.businessKey,
      "zh-TW",
    );
    expect(receipt.kind).toBe("AVAILABLE");
    if (receipt.kind !== "AVAILABLE") throw new Error("TEST_RECEIPT_REQUIRED");
    expect(receipt.receipt.title).toContain("進口石材");
    expect(receipt.receipt.returnContext).toEqual(created.receipt.returnContext);
    expect(receipt.receipt.businessKey).toBe(created.receipt.businessKey);
  }, 30_000);

  it.each(["commercial:actual-read", "evidence:read", "action:internal-review:create"])(
    "hides receipt, replay and workspace titles after a non-Viewer %s downgrade",
    async (capability) => {
      const fixture = await prepared();
      const services = createInternalReviewServices();
      const created = await services.confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      if (created.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
      const restore = await deny(capability);
      try {
        queryLog = [];
        const receipt = await services.getReceipt(
          fresh(fixture.actor.context),
          created.receipt.businessKey,
          "en",
        );
        const replay = await services.confirm(
          fresh(fixture.actor.context),
          command(fixture.proposal),
        );
        const list = await services.listProjectActions(fresh(fixture.actor.context), PROJECT, "en");
        expect(receipt.kind).toBe("ACTION_NOT_AUTHORIZED");
        expect(replay.kind).toBe("ACTION_NOT_AUTHORIZED");
        expect(list.kind).toBe("ACTION_NOT_AUTHORIZED");
        expect(queryLog.filter((entry) => /SELECT[\s\S]*"Action"/i.test(entry.query))).toEqual([]);
        const current = await new SignedDemoIdentityContext(sessionRepository(), SECRET).resolve(
          new Request("https://stridebrain.test", { headers: { cookie: fixture.actor.cookie } }),
        );
        if (!current) throw new Error("TEST_DOWNGRADED_CONTEXT_REQUIRED");
        const workspace = await createProjectWorkspaceService().execute(current, PROJECT);
        expect(workspace.kind).toBe("AVAILABLE");
        if (workspace.kind !== "AVAILABLE") throw new Error("TEST_WORKSPACE_REQUIRED");
        expect(workspace.workspace.openActions).toEqual([]);
        expect(
          JSON.stringify([receipt, replay, list, workspace.workspace.openActions]),
        ).not.toContain(created.receipt.title);
      } finally {
        await restore();
      }
    },
    30_000,
  );

  it("hides a committed action when required evidence becomes tenant-restricted", async () => {
    const fixture = await prepared();
    const services = createInternalReviewServices();
    const created = await services.confirm(fresh(fixture.actor.context), command(fixture.proposal));
    if (created.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
    const restore = await patch("EvidenceReference", await evidenceId(fixture.proposal), {
      dataClassification: "TENANT_RESTRICTED",
    });
    try {
      queryLog = [];
      const receipt = await services.getReceipt(
        fresh(fixture.actor.context),
        created.receipt.businessKey,
        "en",
      );
      expect(receipt.kind).toBe("ACTION_NOT_AUTHORIZED");
      const detailedActionReads = queryLog.filter((entry) =>
        /SELECT[\s\S]*"contentSnapshot"[\s\S]*FROM[\s\S]*"Action"/i.test(entry.query),
      );
      expect(detailedActionReads).toEqual([]);
      const list = await services.listProjectActions(fresh(fixture.actor.context), PROJECT, "en");
      expect(JSON.stringify(list)).not.toContain(created.receipt.businessKey);
      expect(JSON.stringify(list)).not.toContain(created.receipt.title);
    } finally {
      await restore();
    }
  }, 30_000);

  it.each(["unassigned", "missing", "foreign", "deleted"] as const)(
    "denies a committed action whose required document has a %s project owner",
    async (variant) => {
      const fixture = await prepared();
      const services = createInternalReviewServices();
      const created = await services.confirm(
        fresh(fixture.actor.context),
        command(fixture.proposal),
      );
      if (created.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
      const document = await requiredDocument(fixture.proposal);
      const unassignedProject = "prj_hist_001";
      expect(fixture.actor.context.assignedProjectIds?.has(unassignedProject)).toBe(false);
      const foreignProjects = await database.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT id FROM "Project" WHERE "organizationId"<>$1 ORDER BY id LIMIT 1',
        ORG,
      );
      expect(foreignProjects).toHaveLength(1);
      const restoreOwner = await patch("Document", document.documentId, {
        projectId:
          variant === "missing"
            ? null
            : variant === "foreign"
              ? foreignProjects[0]!.id
              : unassignedProject,
        dataClassification: variant === "deleted" ? "DEMO_SYNTHETIC" : "TENANT_PRIVATE",
      });
      const restoreDeletion =
        variant === "deleted"
          ? await patch("Project", unassignedProject, { deletedAt: new Date().toISOString() })
          : async () => {};
      try {
        queryLog = [];
        const receipt = await services.getReceipt(
          fresh(fixture.actor.context),
          created.receipt.businessKey,
          "en",
        );
        expect(receipt.kind).toBe("ACTION_NOT_AUTHORIZED");
        expect(
          queryLog.filter((entry) =>
            /SELECT[\s\S]*"contentSnapshot"[\s\S]*FROM[\s\S]*"Action"/i.test(entry.query),
          ),
        ).toEqual([]);
        const list = await services.listProjectActions(fresh(fixture.actor.context), PROJECT, "en");
        expect(JSON.stringify(list)).not.toContain(created.receipt.businessKey);
        expect(JSON.stringify(list)).not.toContain(created.receipt.title);
      } finally {
        await restoreDeletion();
        await restoreOwner();
      }
      expect(
        (await services.getReceipt(fresh(fixture.actor.context), created.receipt.businessKey, "en"))
          .kind,
      ).toBe("AVAILABLE");
    },
    30_000,
  );

  it("hides a committed action when an evidence reference is rebound to another accessible document version", async () => {
    const fixture = await prepared();
    const services = createInternalReviewServices();
    const created = await services.confirm(fresh(fixture.actor.context), command(fixture.proposal));
    if (created.kind !== "CREATED") throw new Error("TEST_ACTION_REQUIRED");
    const document = await requiredDocument(fixture.proposal);
    const original = await row("DocumentVersion", document.versionId);
    const replacementId = `rebound_version_${randomUUID()}`;
    await database.$executeRawUnsafe(
      'INSERT INTO "DocumentVersion" SELECT (jsonb_populate_record(NULL::"DocumentVersion",$1::jsonb)).*',
      JSON.stringify({ ...original, id: replacementId, versionLabel: replacementId }),
    );
    const restore = await patch("EvidenceReference", document.referenceId, {
      documentVersionId: replacementId,
    });
    try {
      const receipt = await services.getReceipt(
        fresh(fixture.actor.context),
        created.receipt.businessKey,
        "en",
      );
      expect(receipt.kind).toBe("ACTION_NOT_AUTHORIZED");
      const list = await services.listProjectActions(fresh(fixture.actor.context), PROJECT, "en");
      expect(JSON.stringify(list)).not.toContain(created.receipt.businessKey);
      expect(JSON.stringify(list)).not.toContain(created.receipt.title);
    } finally {
      await restore();
      await database.$executeRawUnsafe('DELETE FROM "DocumentVersion" WHERE id=$1', replacementId);
    }
    expect(
      (await services.getReceipt(fresh(fixture.actor.context), created.receipt.businessKey, "en"))
        .kind,
    ).toBe("AVAILABLE");
  }, 30_000);

  it("rejects repeated preparation when its immutable suggested assignee becomes ineligible", async () => {
    const fixture = await prepared();
    const stored = await proposalRow(fixture.proposal.businessKey);
    expect(typeof stored.suggestedAssigneeMembershipId).toBe("string");
    const restore = await patch("Membership", String(stored.suggestedAssigneeMembershipId), {
      active: false,
    });
    try {
      const result = await createInternalReviewServices().prepare(fresh(fixture.actor.context), {
        projectKey: PROJECT,
        comparisonRunId: fixture.comparisonRunId,
        enrichmentRunId: fixture.enrichmentRunId,
        locale: "en",
        returnContext: fixture.proposal.returnContext,
      });
      expect(result.kind).toBe("PROPOSAL_UNAVAILABLE");
      expect((await proposalRow(fixture.proposal.businessKey)).suggestedAssigneeMembershipId).toBe(
        stored.suggestedAssigneeMembershipId,
      );
    } finally {
      await restore();
    }
  }, 30_000);

  it("measures uncached proposal and confirmation p95 with SQL query counts", async () => {
    const user = await actor();
    const services = createInternalReviewServices();
    const timings = { proposal: [] as number[], confirmation: [] as number[] };
    const queries = { proposal: [] as number[], confirmation: [] as number[] };
    for (let sample = -1; sample < 30; sample += 1) {
      const input = await pair(user);
      queryLog = [];
      const proposalStart = performance.now();
      const proposal = await services.prepare(fresh(user.context), input);
      const proposalMs = performance.now() - proposalStart;
      const proposalQueries = queryLog.length;
      if (proposal.kind !== "PREPARED") throw new Error(`PERFORMANCE_PREPARE_${proposal.kind}`);
      queryLog = [];
      const confirmStart = performance.now();
      const created = await services.confirm(fresh(user.context), command(proposal.proposal));
      const confirmMs = performance.now() - confirmStart;
      if (created.kind !== "CREATED") throw new Error(`PERFORMANCE_CONFIRM_${created.kind}`);
      if (sample >= 0) {
        timings.proposal.push(proposalMs);
        timings.confirmation.push(confirmMs);
        queries.proposal.push(proposalQueries);
        queries.confirmation.push(queryLog.length);
      }
    }
    const proposalStats = distribution(timings.proposal);
    const confirmationStats = distribution(timings.confirmation);
    Object.assign(performanceEvidence, {
      methodology:
        "30 unique immutable pairs/proposals; one excluded warmup; nearest-rank p95; server duration excluding network; actual Prisma query events",
      proposal: proposalStats,
      confirmation: confirmationStats,
      proposalQueryCounts: queries.proposal,
      confirmationQueryCounts: queries.confirmation,
      slowestConfirmationQueries: [...queryLog]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(({ query, duration }) => ({ query, duration })),
    });
    const slowestRead = [...queryLog]
      .filter((entry) => entry.query.startsWith("SELECT ") && !entry.query.includes("pg_advisory"))
      .sort((a, b) => b.duration - a.duration)[0];
    if (!slowestRead) throw new Error("PERFORMANCE_READ_QUERY_REQUIRED");
    performanceEvidence.slowestReadPlan = await database.$queryRawUnsafe(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${slowestRead.query}`,
      ...(JSON.parse(slowestRead.parameters) as unknown[]),
    );
    console.info("STAGE8_INDEPENDENT_PERFORMANCE", JSON.stringify(performanceEvidence));
    expect(proposalStats.p95).toBeLessThanOrEqual(500);
    expect(confirmationStats.p95).toBeLessThanOrEqual(800);
    expect(queries.proposal.every((count) => count > 0)).toBe(true);
    expect(new Set(queries.proposal).size).toBe(1);
    expect(new Set(queries.confirmation).size).toBe(1);
  }, 180_000);

  it("loads twenty additional evidence references without a per-reference query waterfall", async () => {
    const fixture = await prepared();
    const stored = await proposalRow(fixture.proposal.businessKey);
    const references = stored.evidenceReferenceIds as string[];
    const original = await row("EvidenceReference", references[0]!);
    const repository = new PrismaInternalReviewRepository(database);
    const loadScopes = (ids: string[]) =>
      repository.transaction((tx) =>
        tx.getEvidenceScopes(fixture.actor.context, fixture.comparisonRunId, ids),
      );
    queryLog = [];
    const initial = await loadScopes(references);
    const initialQueries = queryLog.length;
    expect(initial).toHaveLength(references.length);
    const added = Array.from({ length: 20 }, () => `batch_evidence_${randomUUID()}`);
    try {
      for (const id of added) {
        await database.$executeRawUnsafe(
          'INSERT INTO "EvidenceReference" SELECT (jsonb_populate_record(NULL::"EvidenceReference",$1::jsonb)).*',
          JSON.stringify({ ...original, id, claimKey: id }),
        );
      }
      queryLog = [];
      const expanded = await loadScopes([...references, ...added]);
      const expandedQueries = queryLog.length;
      expect(expanded).toHaveLength(references.length + 20);
      expect(expandedQueries).toBe(initialQueries);
      performanceEvidence.evidenceBatching = {
        initialReferences: references.length,
        addedReferences: added.length,
        initialQueries,
        expandedQueries,
      };
    } finally {
      await database.$executeRawUnsafe(
        'DELETE FROM "EvidenceReference" WHERE id=ANY($1::text[])',
        added,
      );
    }
  }, 30_000);

  it("loads twenty additional eligible assignees without a per-assignee query waterfall", async () => {
    const user = await actor();
    const services = createInternalReviewServices();
    const initialInput = await pair(user);
    queryLog = [];
    const initial = await services.prepare(fresh(user.context), initialInput);
    expect(initial.kind).toBe("PREPARED");
    const initialQueries = queryLog.length;
    const prefix = `sb029_assignee_${randomUUID().replaceAll("-", "")}`;
    await database.$executeRawUnsafe(
      `INSERT INTO "Person" ("id","organizationId","businessKey","nameEn","nameZhTw","active","createdAt","updatedAt")
       SELECT $1 || '_person_' || g, $2, $1 || '_person_' || g, 'Synthetic reviewer ' || g, '合成審查人員' || g, true, NOW(), NOW() FROM generate_series(1,20) g`,
      prefix,
      ORG,
    );
    await database.$executeRawUnsafe(
      `INSERT INTO "Membership" ("id","organizationId","personId","role","active","createdAt","updatedAt")
       SELECT $1 || '_membership_' || g, $2, $1 || '_person_' || g, 'FINANCIAL_REVIEWER', true, NOW(), NOW() FROM generate_series(1,20) g`,
      prefix,
      ORG,
    );
    await database.$executeRawUnsafe(
      `INSERT INTO "ProjectAssignment" ("id","organizationId","projectId","membershipId","canReadActuals","canCreateAction","createdAt")
       SELECT $1 || '_assignment_' || g, $2, $3, $1 || '_membership_' || g, true, true, NOW() FROM generate_series(1,20) g`,
      prefix,
      ORG,
      PROJECT_ID,
    );
    try {
      const expandedInput = await pair(user);
      queryLog = [];
      const expanded = await services.prepare(fresh(user.context), expandedInput);
      const expandedQueries = queryLog.length;
      expect(expanded.kind).toBe("PREPARED");
      if (initial.kind !== "PREPARED" || expanded.kind !== "PREPARED")
        throw new Error("TEST_PROPOSALS_REQUIRED");
      expect(expanded.proposal.assignees.length - initial.proposal.assignees.length).toBe(20);
      expect(expandedQueries).toBe(initialQueries);
      performanceEvidence.assigneeBatching = {
        addedEligibleAssignees: 20,
        initialQueries,
        expandedQueries,
      };
    } finally {
      await database.$executeRawUnsafe(
        'DELETE FROM "ProjectAssignment" WHERE "organizationId"=$1 AND "id" LIKE $2',
        ORG,
        `${prefix}%`,
      );
      await database.$executeRawUnsafe(
        'UPDATE "Membership" SET active=false WHERE "organizationId"=$1 AND "id" LIKE $2',
        ORG,
        `${prefix}%`,
      );
      await database.$executeRawUnsafe(
        'UPDATE "Person" SET active=false WHERE "organizationId"=$1 AND "id" LIKE $2',
        ORG,
        `${prefix}%`,
      );
    }
  }, 30_000);

  it("records concurrent confirmation latency without duplicating business state", async () => {
    const user = await actor();
    const services = createInternalReviewServices();
    const timings: number[] = [];
    for (let batch = 0; batch < 10; batch += 1) {
      const fixtures: Prepared[] = [];
      for (let index = 0; index < 3; index += 1) fixtures.push(await prepared(user));
      const outcomes = await Promise.all(
        fixtures.map(async (fixture) => {
          const started = performance.now();
          const outcome = await services.confirm(fresh(user.context), command(fixture.proposal));
          timings.push(performance.now() - started);
          return outcome;
        }),
      );
      expect(outcomes.every((outcome) => outcome.kind === "CREATED")).toBe(true);
      const keys = outcomes.flatMap((outcome) =>
        "receipt" in outcome ? [outcome.receipt.businessKey] : [],
      );
      expect(new Set(keys).size).toBe(3);
    }
    performanceEvidence.concurrentConfirmation = distribution(timings);
    performanceEvidence.concurrentProtocol =
      "10 batches × 3 independent proposals, unique immutable run pair per proposal";
    expect(distribution(timings).p95).toBeLessThanOrEqual(800);
  }, 180_000);

  it("repeatably reseeds after real actions and restores all immutability triggers", async () => {
    const fixture = await prepared();
    expect(
      (
        await createInternalReviewServices().confirm(
          fresh(fixture.actor.context),
          command(fixture.proposal),
        )
      ).kind,
    ).toBe("CREATED");
    expect((await counts()).actions).toBeGreaterThan(0);
    const unrelatedOrganization = `org_unrelated_${randomUUID()}`;
    await database.$executeRawUnsafe(
      `INSERT INTO "Organization" ("id","businessKey","nameEn","nameZhTw","primaryLocale","timezone","dataClassification","createdAt","updatedAt")
        VALUES ($1,$1,'Unrelated synthetic preservation probe','無關合成資料保留檢查','en','Asia/Taipei','DEMO_SYNTHETIC',NOW(),NOW())`,
      unrelatedOrganization,
    );
    const environment = { ...process.env, DATABASE_URL: testDatabaseUrl };
    for (let iteration = 0; iteration < 2; iteration += 1) {
      for (const script of ["db:seed", "db:verify"]) {
        execFileSync("npm", ["run", script], {
          env: environment,
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 90_000,
        });
      }
    }
    const triggers = await database.$queryRawUnsafe<Array<{ name: string; enabled: string }>>(
      `SELECT tgname AS name, tgenabled::text AS enabled FROM pg_trigger WHERE tgname IN ('AuditEvent_append_only','Action_stage8_immutable','ProposedAction_stage8_immutable','InternalReviewReceipt_immutable') ORDER BY tgname`,
    );
    expect(triggers).toHaveLength(4);
    expect(triggers.every((trigger) => trigger.enabled === "O")).toBe(true);
    expect(await counts()).toEqual({ actions: 0, audits: 0, receipts: 0, consumed: 0 });
    expect((await row("Organization", unrelatedOrganization)).dataClassification).toBe(
      "DEMO_SYNTHETIC",
    );
  }, 180_000);

  it("refuses a fixture reset against non-synthetic identities without disabling audit protections", async () => {
    await database.$executeRawUnsafe(
      'UPDATE "Organization" SET "dataClassification"=\'TENANT_PRIVATE\' WHERE id=$1',
      ORG,
    );
    try {
      expect(() =>
        execFileSync("npm", ["run", "db:seed"], {
          env: { ...process.env, DATABASE_URL: testDatabaseUrl },
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 90_000,
        }),
      ).toThrow();
      expect((await row("Organization", ORG)).dataClassification).toBe("TENANT_PRIVATE");
      const triggers = await database.$queryRawUnsafe<Array<{ enabled: string }>>(
        `SELECT tgenabled::text AS enabled FROM pg_trigger WHERE tgname IN ('AuditEvent_append_only','Action_stage8_immutable','ProposedAction_stage8_immutable','InternalReviewReceipt_immutable')`,
      );
      expect(triggers).toHaveLength(4);
      expect(triggers.every((trigger) => trigger.enabled === "O")).toBe(true);
    } finally {
      await database.$executeRawUnsafe(
        'UPDATE "Organization" SET "dataClassification"=\'DEMO_SYNTHETIC\' WHERE id=$1',
        ORG,
      );
    }
  }, 120_000);
});
