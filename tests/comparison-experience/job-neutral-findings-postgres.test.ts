import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createProjectWorkspaceService } from "@/lib/server/project-workspace-services";
import { getPrismaClient, disconnectPrismaClientForTests } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { buildComparisonExperience } from "@/modules/comparison-experience/build-comparison-experience";
import { buildHomeIntelligence } from "@/modules/home-intelligence/home-intelligence";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
const baseUrl = process.env.DATABASE_URL;
let admin: Client;
let sql: Client;
const databaseName = `sb044_findings_${randomUUID().replaceAll("-", "")}`;
beforeAll(async () => {
  if (!baseUrl) return;
  admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  const url = new URL(baseUrl);
  url.pathname = `/${databaseName}`;
  process.env.DATABASE_URL = url.toString();
  await disconnectPrismaClientForTests();
  sql = new Client({ connectionString: url.toString() });
  await sql.connect();
  for (const migration of readdirSync("prisma/migrations")
    .filter((name) => name !== "migration_lock.toml")
    .sort())
    await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  for (const fixture of [
    "horizon-atelier",
    "stage2-authorization",
    "stage4-comparison",
    "stage5-economics",
    "job-neutral-findings",
    "verify-job-neutral-findings",
  ])
    await sql.query(readFileSync(`prisma/fixtures/${fixture}.sql`, "utf8"));
}, 30000);
afterAll(async () => {
  if (!baseUrl) return;
  await disconnectPrismaClientForTests();
  await sql?.end();
  process.env.DATABASE_URL = baseUrl;
  if (admin) {
    await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    await admin.end();
  }
});

async function actor(membership: string) {
  const sessions = new PrismaDemoSessionRepository(
    getPrismaClient() as unknown as PrismaDemoSessionDatabase,
  );
  const secret = "sb044-job-neutral-integration-secret-32-bytes";
  const issued = await new DemoSessionService(sessions, secret).issueForMembership(membership, {
    locale: "en",
    ttlSeconds: 300,
  });
  const context = await new SignedDemoIdentityContext(sessions, secret).resolve(
    new Request("https://stridebrain.test/en", {
      headers: { cookie: issued!.setCookie.split(";")[0]! },
    }),
  );
  if (!context) throw new Error("CONTEXT_REQUIRED");
  return context;
}
suite("job-specific findings from PostgreSQL", () => {
  it("requires the saving member and the current quote version for Home", async () => {
    const context = await actor("membership_horizon_mei");
    const services = createComparisonServices();
    const comparison = await services.runComparison.execute(context, "J-2611-R7K3");
    if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
    expect((await services.getHomeComparison.execute(context, "J-2611-R7K3"))?.kind).toBe(
      "AVAILABLE",
    );
    const anotherMember = await actor("membership_horizon_admin");
    expect(await services.getHomeComparison.execute(anotherMember, "J-2611-R7K3")).toEqual({
      kind: "OUT_OF_DATE",
    });
    const versionId = `quote-review-${randomUUID()}`;
    try {
      await sql.query(
        `INSERT INTO "QuoteVersion" SELECT (jsonb_populate_record(NULL::"QuoteVersion", to_jsonb(v) || jsonb_build_object('id', $1::text, 'versionNumber', v."versionNumber"+1))).* FROM "QuoteVersion" v WHERE id='qv_riverside_044_v1'`,
        [versionId],
      );
      await sql.query(
        `INSERT INTO "QuoteItem" SELECT (jsonb_populate_record(NULL::"QuoteItem", to_jsonb(i) || jsonb_build_object('id', $1::text || i.id, 'quoteVersionId', $1::text))).* FROM "QuoteItem" i WHERE "quoteVersionId"='qv_riverside_044_v1'`,
        [versionId],
      );
      expect(await services.getHomeComparison.execute(context, "J-2611-R7K3")).toEqual({
        kind: "OUT_OF_DATE",
      });
    } finally {
      await sql.query('DELETE FROM "QuoteItem" WHERE "quoteVersionId"=$1', [versionId]);
      await sql.query('DELETE FROM "QuoteVersion" WHERE id=$1', [versionId]);
    }
    expect((await services.getHomeComparison.execute(context, "J-2611-R7K3"))?.kind).toBe(
      "AVAILABLE",
    );
  });
  it("uses the second job's categories and the same stored findings/scores on Home and comparison in both languages", async () => {
    const context = await actor("membership_horizon_mei");
    const services = createComparisonServices();
    const comparison = await services.runComparison.execute(context, "J-2611-R7K3");
    if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
    const economics = await services.runEconomics.execute(
      { ...context, requestId: randomUUID() },
      comparison.result.run.id,
      comparison.result.defaultSelectedProjectKeys,
    );
    if (!("result" in economics)) throw new Error(economics.kind);
    expect(economics.result.categories.map((c) => c.categoryId)).toEqual([
      "CUSTOM_MILLWORK",
      "SIGNAGE",
    ]);
    expect(
      economics.result.claims.some(
        (c) => c.categoryId === "CUSTOM_MILLWORK" && c.value.direction === "ABOVE",
      ),
    ).toBe(true);
    expect(
      economics.result.claims.some(
        (c) => c.categoryId === "SIGNAGE" && c.value.direction === "BELOW",
      ),
    ).toBe(true);
    const source = await services.getHomeComparison.execute(context, "J-2611-R7K3");
    expect(source?.kind).toBe("AVAILABLE");
    if (source?.kind !== "AVAILABLE") throw new Error("HOME_RESULT_NOT_CURRENT");
    expect(source.economics?.run.id).toBe(economics.result.run.id);
    for (const locale of ["en", "zh-TW"] as const) {
      const loaded = await createProjectWorkspaceService().execute(
        { ...context, locale },
        "J-2611-R7K3",
      );
      if (loaded.kind !== "AVAILABLE") throw new Error(loaded.kind);
      const home = buildHomeIntelligence(locale, {
        projects: [],
        workspace: loaded.workspace,
        intelligence: source,
      });
      const view = buildComparisonExperience({
        locale,
        stage4: comparison.result,
        economics: economics.result,
      });
      expect(home.findings.map((f) => f.title)).toEqual(
        [...view.synthesis.history, ...view.synthesis.differences, ...view.synthesis.gaps]
          .filter((f) => f.claimKey)
          .map((f) => f.body),
      );
      expect(home.memory.map((m) => m.score)).toEqual(
        comparison.result.matches.map((m) => m.displayScore),
      );
      expect(JSON.stringify(home.findings)).not.toMatch(/stone|lighting|石材|照明/i);
      expect(
        view.table.sections
          .flatMap((s) => s.rows)
          .filter((r) => r.key.endsWith("-QUOTE"))
          .map((r) => r.key),
      ).toEqual(["CUSTOM_MILLWORK-QUOTE", "SIGNAGE-QUOTE"]);
      for (const finding of home.findings) {
        expect(finding.href).toContain(`economics=${economics.result.run.id}`);
        const panel = await services.getEvidencePanel.execute(
          context,
          {
            mode: "CLAIM",
            comparisonRunId: comparison.result.run.id,
            enrichmentRunId: economics.result.run.id,
            claimKey: finding.claimKey,
          },
          locale,
        );
        expect(panel.kind).toBe("READY");
      }
    }
    const outsider = await actor("membership_northern_owner");
    expect(await services.getHomeComparison.execute(outsider, "J-2611-R7K3")).toBeNull();
    const viewer = await actor("membership_horizon_viewer");
    const limited = await services.getHomeComparison.execute(viewer, "J-2611-R7K3");
    expect(limited?.kind === "AVAILABLE" ? limited.economics : undefined).toBeUndefined();
    expect(
      await services.getHomeComparison.execute(
        { ...context, capabilities: new Set() },
        "J-2611-R7K3",
      ),
    ).toBeNull();
  }, 20000);
});

import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { jobInput } from "../projects/job-fixture";

suite("job-neutral review outcomes", () => {
  it.each(["en", "zh-TW"] as const)(
    "prepares and confirms millwork/signage findings in %s",
    async (locale) => {
      const context = await actor("membership_horizon_mei");
      const services = createComparisonServices();
      const comparison = await services.runComparison.execute(context, "J-2611-R7K3");
      if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
      const economics = await services.runEconomics.execute(
        { ...context, requestId: randomUUID() },
        comparison.result.run.id,
        comparison.result.defaultSelectedProjectKeys,
      );
      if (!("result" in economics)) throw new Error(economics.kind);
      const review = createInternalReviewServices();
      const prepared = await review.prepare(
        { ...context, requestId: randomUUID() },
        {
          projectKey: "J-2611-R7K3",
          comparisonRunId: comparison.result.run.id,
          enrichmentRunId: economics.result.run.id,
          locale,
        },
      );
      expect(prepared.kind).toBe("PREPARED");
      if (prepared.kind !== "PREPARED") throw new Error(prepared.kind);
      const p = prepared.proposal;
      expect(JSON.stringify(p)).not.toMatch(
        /IMPORTED_STONE|LIGHTING_ELECTRICAL|imported.stone|lighting|石材|照明/i,
      );
      expect(p.title).toContain(locale === "en" ? "Custom millwork" : "客製木作");
      expect(p.title).toContain(locale === "en" ? "Signage" : "標示");
      const confirmed = await review.confirm(
        { ...context, requestId: randomUUID() },
        {
          version: "internal-review-command.v1",
          proposalKey: p.businessKey,
          title: p.title,
          rationale: p.rationale,
          assigneeKey: p.suggestedAssigneeKey,
          dueDate: p.suggestedDueDate,
          confirmation: true,
          idempotencyKey: p.idempotencyKey,
          locale,
        },
      );
      expect(confirmed.kind).toBe("CREATED");
    },
    20000,
  );
  it("returns NO_QUOTE_VERSION for a newly created job and still ranks actual history", async () => {
    let context = await actor("membership_horizon_mei");
    const input = {
      ...jobInput(),
      businessKey: `J-NQ-${randomUUID()}`,
      name: "Synthetic no-quote signage job",
      scopeCategoryIds: ["CUSTOM_MILLWORK", "SIGNAGE"],
      clientMode: "existing",
      clientBusinessKey: "CLIENT-01",
    };
    const created = await createProjectWriteServices().create.execute(context, input);
    expect(created.kind).toBe("CREATED");
    // An admin has the unchanged actual-read authority required to propose reviews.
    context = await actor("membership_horizon_admin");
    const services = createComparisonServices();
    const comparison = await services.runComparison.execute(context, input.businessKey);
    if (comparison.kind !== "COMPLETE") throw new Error(comparison.kind);
    expect(comparison.result.matches.length).toBeGreaterThan(0);
    const economics = await services.runEconomics.execute(
      { ...context, requestId: randomUUID() },
      comparison.result.run.id,
      comparison.result.defaultSelectedProjectKeys,
    );
    if (!("result" in economics)) throw new Error(economics.kind);
    expect(economics.result.categories).toEqual([]);
    const pair = {
      comparisonRunId: comparison.result.run.id,
      enrichmentRunId: economics.result.run.id,
    };
    const review = createInternalReviewServices();
    expect(await review.availability(context, input.businessKey, pair)).toBe("NO_QUOTE_VERSION");
    expect(
      (await review.prepare(context, { projectKey: input.businessKey, ...pair, locale: "en" }))
        .kind,
    ).toBe("NO_QUOTE_VERSION");
    for (const locale of ["en", "zh-TW"] as const) {
      const view = buildComparisonExperience({
        stage4: comparison.result,
        economics: economics.result,
        locale,
      });
      expect(view.synthesis.history).toEqual([]);
      expect(view.synthesis.recommendation).toBeUndefined();
      expect(JSON.stringify(view.table)).not.toMatch(
        /NT\$|[+-]\d+\.\d+%|IMPORTED_STONE|LIGHTING_ELECTRICAL/,
      );
    }
  }, 20000);
});
