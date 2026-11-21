import { isReviewClaim } from "@/modules/economics/domain/claim-selection";
import type { StructuredEconomicsClaimDTO } from "@/modules/economics/domain/contracts";
import { absolute, compare, percent } from "@/modules/finance/fixed-decimal";

/** Select a saved finding; never recalculate its variance or alignment. */
export function quoteReviewFinding(claims: readonly StructuredEconomicsClaimDTO[]) {
  const findings = claims.filter(isReviewClaim);
  const candidates = findings
    .filter((claim) => Boolean(claim.categoryId))
    .map((claim) => {
      if (claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT") return { claim, magnitude: null };
      if (
        claim.kind !== "CATEGORY_QUOTED_VARIANCE" &&
        claim.kind !== "CATEGORY_FORECAST_ACTUAL_VARIANCE"
      )
        return null;
      if (typeof claim.value.variancePercent !== "string")
        throw new Error("INVALID_SAVED_VARIANCE");
      return { claim, magnitude: absolute(percent(claim.value.variancePercent)) };
    })
    .filter((item) => item !== null)
    .sort((a, b) => {
      const varianceOrder =
        a.magnitude && b.magnitude
          ? compare(b.magnitude, a.magnitude)
          : a.magnitude
            ? -1
            : b.magnitude
              ? 1
              : 0;
      return (
        varianceOrder ||
        a.claim.categoryId!.localeCompare(b.claim.categoryId!) ||
        a.claim.kind.localeCompare(b.claim.kind) ||
        a.claim.claimKey.localeCompare(b.claim.claimKey)
      );
    });
  const claim = candidates[0]?.claim;
  return claim ? { claim, additionalFindingCount: findings.length - 1 } : null;
}
