import { seededFirmLists } from "@/fixtures/firm-lists";
import { expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { COMMERCIAL_CATEGORIES, SCOPE_CATEGORIES } from "@/fixtures/firm-lists";
import { orderQuoteLines } from "@/modules/quote-draft/domain/quote-line-order";
import { validateSaveDraft } from "@/modules/quote-draft/domain/save-input";
import { prepareDraftPolicy } from "@/modules/quote-draft/domain/draft-policy";
it("uses work order without changing amounts, descriptions, duplicate/unknown lines or the input", () => {
  const lines = [...COMMERCIAL_CATEGORIES]
    .sort()
    .map((categoryId, i) => ({ categoryId, amount: `${i + 1}.00`, description: categoryId }));
  const before = JSON.stringify(lines),
    ordered = orderQuoteLines(lines, seededFirmLists.workCategories);
  expect(ordered.map((line) => line.categoryId)).toEqual(COMMERCIAL_CATEGORIES);
  expect(JSON.stringify(lines)).toBe(before);
  for (const line of ordered)
    expect(line).toBe(lines.find((row) => row.categoryId === line.categoryId));
  expect(
    orderQuoteLines(
      [{ categoryId: "OLD_B" }, { categoryId: "OLD_A" }, ...lines],
      seededFirmLists.workCategories,
    )
      .slice(-2)
      .map((line) => line.categoryId),
  ).toEqual(["OLD_B", "OLD_A"]);
});
it("prepares suggestions and validates saves in the same work order", () => {
  const suggestions = prepareDraftPolicy({
    job: {
      catalog: seededFirmLists,
      area: "100",
      areaUnit: "m2",
      currency: "TWD",
      scopeCategoryIds: SCOPE_CATEGORIES,
      commercialCategoryIds: [...COMMERCIAL_CATEGORIES].reverse(),
    },
    baselines: [],
    calculatedAt: "2026-11-22T00:00:00Z",
    selectedProjectCount: 0,
  });
  expect(suggestions.map((line) => line.categoryId)).toEqual(COMMERCIAL_CATEGORIES);
  const value = validateSaveDraft(
    {
      projectKey: "J-2611-A7K3",
      idempotencyKey: randomUUID(),
      baseVersionId: null,
      preparationToken: null,
      lines: [...COMMERCIAL_CATEGORIES]
        .sort()
        .map((categoryId) => ({ categoryId, description: categoryId, amount: "1000.00" })),
    },
    seededFirmLists.workCategories,
  );
  expect(value?.lines.map((line) => line.categoryId)).toEqual(COMMERCIAL_CATEGORIES);
});
