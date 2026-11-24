import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantDatabase } from "../assistant/database-fixture";
import { createComparisonServices } from "@/lib/server/comparison-services";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";

const suite = process.env.DATABASE_URL ? describe : describe.skip;
const baselineFile = "foundry/tasks/SB-066/evidence/seeded-comparison-before.json";
let db: Awaited<ReturnType<typeof assistantDatabase>>;
beforeAll(async () => {
  if (process.env.DATABASE_URL) db = await assistantDatabase();
}, 30000);
afterAll(async () => {
  await db?.close();
});
suite("SB-066 seeded comparison parity", () => {
  it("keeps the pre-change ranking, exact scores, claims and bilingual findings", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-23T08:00:00.000Z"));
    try {
      const context = await db.actor();
      const services = createComparisonServices();
      const comparison = await services.runComparison.execute(context, "PRJ-XINYI-026");
      if (comparison.kind !== "COMPLETE") throw new Error("BASELINE_COMPARISON_REQUIRED");
      const economics = await services.runEconomics.execute(
        context,
        comparison.result.run.id,
        comparison.result.defaultSelectedProjectKeys,
      );
      if (!("result" in economics)) throw new Error("BASELINE_ECONOMICS_REQUIRED");
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
          en: claimFindingText(claim, "en", context.firmLists!.workCategories),
          zhTw: claimFindingText(claim, "zh-TW", context.firmLists!.workCategories),
        })),
      };
      // Capture once before behavior changes; later runs cannot overwrite the baseline.
      if (process.env.STRIDEBRAIN_SB066_CAPTURE_BASELINE === "true" && !existsSync(baselineFile))
        writeFileSync(baselineFile, JSON.stringify(result, null, 2) + "\n");
      expect(JSON.parse(JSON.stringify(result))).toEqual(
        JSON.parse(readFileSync(baselineFile, "utf8")),
      );
    } finally {
      vi.useRealTimers();
    }
  }, 30000);
});
