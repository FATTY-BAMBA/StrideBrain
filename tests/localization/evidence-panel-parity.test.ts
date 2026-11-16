import { describe, expect, it } from "vitest";

import { getEvidencePanelCopy } from "@/modules/evidence-panel/copy";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, nested]) =>
    leafKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe("Stage 7 evidence-panel localization", () => {
  it("keeps English and Taiwan Traditional Chinese catalogs structurally identical", () => {
    expect(leafKeys(getEvidencePanelCopy("en")).sort()).toEqual(
      leafKeys(getEvidencePanelCopy("zh-TW")).sort(),
    );
  });

  it("keeps provider, database, and model plumbing out of normal Chinese copy", () => {
    const chinese = JSON.stringify(getEvidencePanelCopy("zh-TW"));
    expect(chinese).not.toMatch(/OpenRouter|OpenAI|Prisma|Postgres|provider|token|embedding/i);
  });

  it("preserves evidence authority, freshness, conflict, and insufficiency semantics", () => {
    const english = JSON.stringify(getEvidencePanelCopy("en"));
    const chinese = JSON.stringify(getEvidencePanelCopy("zh-TW"));

    for (const phrase of [
      "Quoted price",
      "Forecast direct cost",
      "Reconciled actual cost",
      "Stale",
      "Conflicted",
      "Insufficient evidence",
    ]) {
      expect(english).toContain(phrase);
    }
    for (const phrase of ["歷史報價", "預估直接成本", "已核對實際成本", "資料不一致", "資料不足"]) {
      expect(chinese).toContain(phrase);
    }
  });
});

it("translates stored claim category headings and complete calculation methods without weakening meaning", async () => {
  const { evidenceTitle, evidenceValueLabel } =
    await import("@/modules/evidence-panel/presentation");
  expect(evidenceTitle("zh-TW", "IMPORTED_STONE 預估成本與已核對實際成本比較")).toBe(
    "進口石材 預估成本與已核對實際成本比較",
  );
  for (const locale of ["en", "zh-TW"] as const) {
    for (const value of [
      "FORECAST_VERSUS_RECONCILED_ACTUAL_COST_MEDIAN_VARIANCE",
      "QUOTE_VERSUS_QUOTED_PRICE_MEDIAN_VARIANCE",
      "HISTORICAL_QUOTED_PRICE_NORMALIZED_MEDIAN",
      "HISTORICAL_RECONCILED_ACTUAL_COST_NORMALIZED_MEDIAN",
      "TWD_PER_M2",
      "HALF_UP; percent scale 4",
      "HALF_UP; normalized rate scale 6; equivalent amount scale 2",
      "scope_overlap.jaccard",
    ]) {
      const label = evidenceValueLabel(locale, value);
      expect(label).not.toBe(value);
      expect(label).not.toMatch(/unavailable|尚未提供/);
      if (locale === "zh-TW") expect(label).toMatch(/[\u4e00-\u9fff]/);
    }
  }
  expect(evidenceValueLabel("zh-TW", "HALF_UP; percent scale 4")).toContain("4 位");
  expect(
    evidenceValueLabel("zh-TW", "HALF_UP; normalized rate scale 6; equivalent amount scale 2"),
  ).toContain("6 位");
});
