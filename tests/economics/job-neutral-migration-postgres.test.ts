import { resetWorkerDatabase } from "../database/worker";
import { withFirmLists } from "../firm-lists/with-firm-lists";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { disconnectPrismaClientForTests, getPrismaClient } from "@/lib/server/prisma";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

const baseUrl = process.env.DATABASE_URL;
const suite = baseUrl ? describe.sequential : describe.skip;
const migration = "20261121160000_job_neutral_claims";
let sql: Client;
let context: RuntimeContext;
let runId: string;
let comparisonId: string;
let snapshot: unknown;
let legacyClaims: { id: string; claimKey: string; evidenceReferenceIds: string[] }[];
suite("job-neutral populated PostgreSQL migration", () => {
  beforeAll(async () => {
    await resetWorkerDatabase(true);
    sql = new Client({ connectionString: process.env.DATABASE_URL });
    await sql.connect();
    for (const name of readdirSync("prisma/migrations")
      .filter((name) => name < migration)
      .sort()) {
      if (name === "migration_lock.toml") continue;
      await sql.query(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    }
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
    for (const independent of [
      "20261124010000_client_details_and_firm_preferences",
      "20261124011000_firm_job_types_and_units",
      "20261124012000_firm_work_categories",
      "20261124150000_quote_document_sections",
      "20261124151000_quote_document_line_invariants",
      "20261125150000_firm_client_types",
      "20261125151000_project_cities",
    ])
      await sql.query(readFileSync(`prisma/migrations/${independent}/migration.sql`, "utf8"));
    // Use today's writer to construct a real calculation, then model the pre-upgrade
    // indexed/snapshot shape before taking the preservation baseline. No immutable
    // audit/action/receipt row is rewritten and no trigger is disabled.
    await sql.query(
      'ALTER TABLE "ComparisonClaim" ADD COLUMN "categoryId" TEXT, ADD COLUMN "originalClaimKey" TEXT',
    );
    const sessions = new PrismaDemoSessionRepository(
      getPrismaClient() as unknown as PrismaDemoSessionDatabase,
    );
    const secret = "sb044-migration-only-test-secret-32-bytes";
    const session = await new DemoSessionService(sessions, secret).issueForMembership(
      "membership_horizon_mei",
      { locale: "en", ttlSeconds: 1800 },
    );
    const actor = await new SignedDemoIdentityContext(sessions, secret).resolve(
      new Request("https://stridebrain.test/en", {
        headers: { cookie: session!.setCookie.split(";")[0]! },
      }),
    );
    if (!actor) throw new Error("CONTEXT_REQUIRED");
    context = await withFirmLists(actor);
    const services = createComparisonServices();
    const comparison = await services.runComparison.execute(context, "PRJ-XINYI-026");
    if (comparison.kind !== "COMPLETE") throw new Error("COMPARISON_REQUIRED");
    comparisonId = comparison.result.run.id;
    const economics = await services.runEconomics.execute(
      { ...context, requestId: randomUUID() },
      comparisonId,
      comparison.result.defaultSelectedProjectKeys,
    );
    if (!("result" in economics)) throw new Error("ECONOMICS_REQUIRED");
    runId = economics.result.run.id;
    const row = (
      await sql.query('SELECT "resultSnapshot" FROM "EconomicsEnrichmentRun" WHERE id=$1', [runId])
    ).rows[0];
    const legacy = row.resultSnapshot;
    legacy.result.claims = legacy.result.claims.map(
      (original: { categoryId?: string; claimKey: string }) => {
        const claim = { ...original, claimKey: `XINYI_${original.claimKey}` };
        delete claim.categoryId;
        return claim;
      },
    );
    legacy.result.evidenceBundles = legacy.result.evidenceBundles.map(
      (bundle: { claimKey: string }) => ({ ...bundle, claimKey: `XINYI_${bundle.claimKey}` }),
    );
    await sql.query('UPDATE "EconomicsEnrichmentRun" SET "resultSnapshot"=$1 WHERE id=$2', [
      legacy,
      runId,
    ]);
    await sql.query(
      'UPDATE "ComparisonClaim" SET "claimKey"=\'XINYI_\' || "claimKey" WHERE "enrichmentRunId"=$1',
      [runId],
    );
    await sql.query(
      'ALTER TABLE "ComparisonClaim" DROP COLUMN "categoryId", DROP COLUMN "originalClaimKey"',
    );
    snapshot = legacy;
    legacyClaims = (
      await sql.query(
        'SELECT id,"claimKey","evidenceReferenceIds" FROM "ComparisonClaim" WHERE "enrichmentRunId"=$1',
        [runId],
      )
    ).rows;
  }, 30000);
  afterAll(async () => {
    await disconnectPrismaClientForTests();
    if (sql) await sql.end();
  });
  it("renames indexed keys, backfills category identity and preserves historical snapshots and evidence IDs", async () => {
    await sql.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    expect(
      (
        await sql.query('SELECT "resultSnapshot" FROM "EconomicsEnrichmentRun" WHERE id=$1', [
          runId,
        ])
      ).rows[0].resultSnapshot,
    ).toEqual(snapshot);
    const rows = (
      await sql.query('SELECT * FROM "ComparisonClaim" WHERE "enrichmentRunId"=$1', [runId])
    ).rows;
    for (const old of legacyClaims) {
      const row = rows.find((row) => row.id === old.id);
      expect(row.claimKey).toBe(old.claimKey.slice(6));
      expect(row.originalClaimKey).toBe(old.claimKey);
      expect(row.evidenceReferenceIds).toEqual(old.evidenceReferenceIds);
      if (row.claimType.startsWith("CATEGORY_")) expect(row.categoryId).toBeTruthy();
    }
    const result = await createComparisonServices().getEconomics.execute(context, runId);
    expect(result).not.toBeNull();
    for (const claim of result!.claims) {
      expect(claim.claimKey.startsWith("XINYI_")).toBe(true);
      if (claim.kind.startsWith("CATEGORY_")) expect(claim.categoryId).toBeTruthy();
      const panel = await createComparisonServices().getEvidencePanel.execute(
        context,
        {
          mode: "CLAIM",
          comparisonRunId: comparisonId,
          enrichmentRunId: runId,
          claimKey: claim.claimKey,
        },
        "en",
      );
      expect(panel.kind).toBe("READY");
    }
  }, 30000);
});
