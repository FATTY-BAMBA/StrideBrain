import type { StructuredEconomicsClaimDTO } from "./contracts";

/** The economics service already applies ALIGNMENT_THRESHOLD. Never recalculate it in a UI. */
export function isOutOfRange(claim: StructuredEconomicsClaimDTO): boolean {
  return claim.value.direction === "ABOVE" || claim.value.direction === "BELOW";
}

export function isReviewClaim(claim: StructuredEconomicsClaimDTO): boolean {
  return (
    ((claim.kind === "CATEGORY_QUOTED_VARIANCE" ||
      claim.kind === "CATEGORY_FORECAST_ACTUAL_VARIANCE") &&
      Boolean(claim.categoryId) &&
      isOutOfRange(claim)) ||
    (claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT" && Boolean(claim.categoryId)) ||
    claim.kind === "PROGRAMME_DIFFERENCE_UNQUANTIFIED"
  );
}
