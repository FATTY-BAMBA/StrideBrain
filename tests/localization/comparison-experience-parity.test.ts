import { describe, expect, it } from "vitest";

import { comparisonCopies } from "@/modules/comparison-experience/copy";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, nested]) =>
    leafKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe("Stage 6 comparison localization", () => {
  it("keeps English and Taiwan Traditional Chinese catalogs structurally identical", () => {
    expect(leafKeys(comparisonCopies.en).sort()).toEqual(
      leafKeys(comparisonCopies["zh-TW"]).sort(),
    );
  });

  it("keeps technical model and provider plumbing out of normal Chinese copy", () => {
    const chineseCopy = JSON.stringify(comparisonCopies["zh-TW"]);
    expect(chineseCopy).not.toMatch(/OpenRouter|OpenAI|Prisma|Postgres|provider|token/i);
  });

  it("preserves distinct financial-authority terminology", () => {
    const english = JSON.stringify(comparisonCopies.en);
    const chinese = JSON.stringify(comparisonCopies["zh-TW"]);

    expect(english).toContain("Quoted price");
    expect(english).toContain("Forecast direct cost");
    expect(english).toContain("Reconciled actual cost");
    expect(chinese).toContain("歷史報價");
    expect(chinese).toContain("預估直接成本");
    expect(chinese).toContain("已核對實際成本");
  });
});
