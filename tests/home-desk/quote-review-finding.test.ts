import { expect, it } from "vitest";
import { quoteReviewFinding } from "@/modules/home-desk/domain/quote-review-finding";
import type { StructuredEconomicsClaimDTO } from "@/modules/economics/domain/contracts";

function claim(
  categoryId: string,
  variancePercent: string,
  kind: StructuredEconomicsClaimDTO["kind"] = "CATEGORY_QUOTED_VARIANCE",
): StructuredEconomicsClaimDTO {
  return {
    claimKey: `${categoryId}:${kind}`,
    categoryId,
    kind,
    titleEn: "",
    titleZhTw: "",
    warningCodes: [],
    value: { variancePercent, direction: variancePercent.startsWith("-") ? "BELOW" : "ABOVE" },
    evidenceReferenceIds: [`evidence:${categoryId}`],
  };
}
it("leads with stone's 43% rather than coordination's -15.9% and keeps the exact claim", () => {
  const stone = claim("IMPORTED_STONE", "43.0000");
  const claims = [claim("COORDINATION", "-15.9000", "CATEGORY_FORECAST_ACTUAL_VARIANCE"), stone];
  expect(quoteReviewFinding(claims)).toEqual({ claim: stone, additionalFindingCount: 1 });
  expect(quoteReviewFinding(claims)?.claim).toBe(stone);
});
it("compares absolute values across quoted and forecast variances, without display rounding", () => {
  const below = claim("IMPORTED_STONE", "-43.0001", "CATEGORY_FORECAST_ACTUAL_VARIANCE");
  expect(quoteReviewFinding([claim("COORDINATION", "43.0000"), below])?.claim).toBe(below);
});
it("compares exact fixed decimals beyond binary float precision", () => {
  const larger = claim("IMPORTED_STONE", "9007199254740992.0002");
  expect(quoteReviewFinding([claim("COORDINATION", "9007199254740992.0001"), larger])?.claim).toBe(
    larger,
  );
});
it("uses category id to break equal absolute variances regardless of sign, kind or input order", () => {
  const first = claim("COORDINATION", "-43.0000", "CATEGORY_FORECAST_ACTUAL_VARIANCE");
  const second = claim("IMPORTED_STONE", "43.0000");
  expect(quoteReviewFinding([second, first])?.claim).toBe(first);
  expect(quoteReviewFinding([first, second])?.claim).toBe(first);
});
it("prefers variance to too little history; counts all other review findings, including programme", () => {
  const variance = claim("IMPORTED_STONE", "12.0000");
  const insufficient = claim("COORDINATION", "0", "CATEGORY_ACTUAL_INSUFFICIENT");
  const programme = {
    ...claim("", "0", "PROGRAMME_DIFFERENCE_UNQUANTIFIED"),
    categoryId: undefined,
  };
  const aligned = {
    ...claim("LIGHTING", "1.0000"),
    value: { direction: "ALIGNED", variancePercent: "1.0000" },
  };
  const overall = claim("", "99.0000", "OVERALL_QUOTED_VARIANCE");
  expect(quoteReviewFinding([insufficient, overall, aligned, programme, variance])).toEqual({
    claim: variance,
    additionalFindingCount: 2,
  });
});
it("uses category order for insufficient history only when there is no variance", () => {
  const first = claim("COORDINATION", "0", "CATEGORY_ACTUAL_INSUFFICIENT");
  expect(
    quoteReviewFinding([claim("IMPORTED_STONE", "0", "CATEGORY_ACTUAL_INSUFFICIENT"), first]),
  ).toEqual({
    claim: first,
    additionalFindingCount: 1,
  });
  expect(quoteReviewFinding([])).toBeNull();
  expect(quoteReviewFinding([claim("", "0", "PROGRAMME_DIFFERENCE_UNQUANTIFIED")])).toBeNull();
});
it("rejects invalid saved variance instead of silently falling back to an insufficient claim", () => {
  expect(() =>
    quoteReviewFinding([
      claim("IMPORTED_STONE", "bad"),
      claim("LIGHTING", "0", "CATEGORY_ACTUAL_INSUFFICIENT"),
    ]),
  ).toThrow();
  expect(() =>
    quoteReviewFinding([
      { ...claim("IMPORTED_STONE", "43"), value: { direction: "ABOVE", variancePercent: 43 } },
    ]),
  ).toThrow("INVALID_SAVED_VARIANCE");
});
