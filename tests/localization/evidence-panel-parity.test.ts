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
