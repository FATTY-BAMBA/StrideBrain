import { expect, it } from "vitest";
import { seededFirmLists } from "@/fixtures/firm-lists";
import {
  pricingCategoriesForScopes,
  validPricingRelationship,
  categoryScopes,
} from "@/modules/firm-lists/domain/work-categories";
import { draftCoverage } from "@/modules/quote-draft/domain/draft-policy";
const categories = seededFirmLists.workCategories;
it("preserves combined pricing, partial coverage and a hidden pricing-only parent", () => {
  expect(
    pricingCategoriesForScopes(categories, ["SELECTIVE_DEMOLITION", "PARTITIONS_CEILINGS"]),
  ).toEqual(["DEMOLITION_CEILING"]);
  expect(categoryScopes(categories, "DEMOLITION_CEILING")).toEqual([
    "SELECTIVE_DEMOLITION",
    "PARTITIONS_CEILINGS",
  ]);
  expect(categories.filter((c) => c.active && c.scopeSelectable)).toHaveLength(7);
  expect(draftCoverage("DEMOLITION_CEILING", ["PARTITIONS_CEILINGS"], categories).partial).toBe(
    true,
  );
});
it("rejects unknown, cyclic and newly retired parents; preserves existing retired mappings", () => {
  expect(validPricingRelationship(categories, null, "UNKNOWN")).toBe(false);
  expect(validPricingRelationship(categories, "DEMOLITION_CEILING", "PARTITIONS_CEILINGS")).toBe(
    false,
  );
  const retired = categories.map((c) =>
    c.key === "DEMOLITION_CEILING" ? { ...c, active: false } : c,
  );
  expect(validPricingRelationship(retired, null, "DEMOLITION_CEILING")).toBe(false);
  expect(validPricingRelationship(retired, "PARTITIONS_CEILINGS", "DEMOLITION_CEILING")).toBe(true);
});
