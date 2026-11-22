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

/** Exactly the cards rendered by claimFindingText, including the two overall findings. */
export function isVisibleFinding(claim: StructuredEconomicsClaimDTO): boolean {
  if (claim.kind === "PROGRAMME_DIFFERENCE_UNQUANTIFIED") return true;
  if (claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT") return Boolean(claim.categoryId);
  return (
    [
      "CATEGORY_QUOTED_VARIANCE",
      "CATEGORY_FORECAST_ACTUAL_VARIANCE",
      "OVERALL_QUOTED_VARIANCE",
      "OVERALL_FORECAST_ACTUAL_VARIANCE",
    ].includes(claim.kind) &&
    isOutOfRange(claim) &&
    typeof claim.value.variancePercent === "string" &&
    /^-?\d+(\.\d+)?$/.test(claim.value.variancePercent)
  );
}
