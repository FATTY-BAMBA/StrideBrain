import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { resetWorkerDatabase } from "../database/worker";
import { fixturePaths } from "../database/lifecycle";
import { getPrismaClient, disconnectPrismaClientForTests } from "@/lib/server/prisma";
import { PrismaFirmListsRepository } from "@/repositories/prisma/prisma-firm-lists-repository";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";
import { DemoSessionService } from "@/modules/runtime-context/demo-session-service";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { PrepareQuoteDraft } from "@/modules/quote-draft/application/prepare-quote-draft";
import { PrismaQuoteDraftRepository } from "@/repositories/prisma/prisma-quote-draft-repository";
import { SignedDraftPreparationCodec } from "@/modules/quote-draft/application/preparation-codec";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
const baseline = "foundry/tasks/SB-065/evidence/seeded-before.json";
const capture = process.env.STRIDEBRAIN_SB065_CAPTURE_BASELINE === "true";
const migration = "20261124150000_quote_document_sections";
const suite = process.env.DATABASE_URL ? describe : describe.skip;
let sql: Client;
beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  if (capture) {
    if (existsSync(baseline)) throw new Error("BASELINE_ALREADY_CAPTURED");
    await resetWorkerDatabase(true);
  }
  sql = new Client({ connectionString: process.env.DATABASE_URL });
  await sql.connect();
  if (capture) {
    for (const name of readdirSync("prisma/migrations")
      .filter((name) => name < migration)
      .sort())
      await sql.query(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    for (const path of fixturePaths("db:seed").filter((path) => !path.includes("quote-document")))
      await sql.query(readFileSync(path, "utf8"));
    expect(
      (await sql.query("SELECT to_regclass('public.\"QuoteSection\"') AS relation")).rows[0]
        .relation,
    ).toBeNull();
  }
}, 30000);
afterAll(async () => {
  await disconnectPrismaClientForTests();
  await sql?.end();
});
suite("SB-065 preserved seeded financial outputs", () => {
  it("keeps rankings, exact findings, reference suggestions and Home figures across the migration", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-24T08:00:00Z"));
    try {
      const sessions = new PrismaDemoSessionRepository(
        getPrismaClient() as unknown as PrismaDemoSessionDatabase,
      );
      const secret = "quote-document-synthetic-session-secret-32-bytes";
      const session = await new DemoSessionService(sessions, secret).issueForMembership(
        "membership_horizon_admin",
        { locale: "en", ttlSeconds: 3600 },
      );
      const actor = await new SignedDemoIdentityContext(sessions, secret).resolve(
        new Request("https://stridebrain.test/en", {
          headers: { cookie: session!.setCookie.split(";")[0]! },
        }),
      );
      if (!actor) throw new Error("CONTEXT_REQUIRED");
      const context = {
        ...actor,
        firmLists: (await new PrismaFirmListsRepository(getPrismaClient()).read(actor))!,
      };
      const services = createComparisonServices();
      const comparison = await services.runComparison.execute(context, "PRJ-XINYI-026");
      if (comparison.kind !== "COMPLETE") throw new Error("COMPARISON_REQUIRED");
      const economics = await services.runEconomics.execute(
        context,
        comparison.result.run.id,
        comparison.result.defaultSelectedProjectKeys,
      );
      if (!("result" in economics)) throw new Error("ECONOMICS_REQUIRED");
      const prepared = await new PrepareQuoteDraft(
        new PrismaQuoteDraftRepository(getPrismaClient()),
        new SignedDraftPreparationCodec("quote-document-synthetic-signing-secret-32-bytes"),
      ).execute(context, "PRJ-XINYI-026");
      if (prepared.kind !== "PREPARED") throw new Error("SUGGESTIONS_REQUIRED");
      const home = await createHomeDeskService().execute(context);
      if (home.kind !== "AVAILABLE") throw new Error("HOME_REQUIRED");
      const result = {
        snapshotDate: comparison.result.run.snapshotDate,
        summary: comparison.result.summary,
        matches: comparison.result.matches,
        broaderMatches: comparison.result.broaderMatches,
        selected: comparison.result.defaultSelectedProjectKeys,
        claims: economics.result.claims.map((claim) => ({
          claimKey: claim.claimKey,
          kind: claim.kind,
          categoryId: claim.categoryId,
          value: claim.value,
          observationType: claim.observationType,
          authorityState: claim.authorityState,
          sufficiencyCode: claim.sufficiencyCode,
          evidenceReferenceIds: claim.evidenceReferenceIds,
          warningCodes: claim.warningCodes,
          en: claimFindingText(claim, "en", context.firmLists.workCategories),
          zhTw: claimFindingText(claim, "zh-TW", context.firmLists.workCategories),
        })),
        suggestions: prepared.preparation.suggestions,
        // Compare the original SB-065 figures and lessons. SB-063 adds a separate
        // derived display field, covered by the closed-job domain/Home tests.
        home: {
          stageCounts: home.stageCounts,
          closedJobs: home.closedJobs.map(({ project, lesson, financialState }) => ({
            project,
            lesson,
            financialState,
          })),
        },
      };
      if (capture) writeFileSync(baseline, JSON.stringify(result, null, 2) + "\n");
      expect(JSON.parse(JSON.stringify(result))).toEqual(
        JSON.parse(readFileSync(baseline, "utf8")),
      );
    } finally {
      vi.useRealTimers();
    }
  }, 30000);
});
