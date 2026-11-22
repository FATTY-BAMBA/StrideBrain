import type { Stage5EconomicsResult, StructuredEconomicsClaimDTO } from "../domain/contracts";
import { isReviewClaim, isVisibleFinding } from "../domain/claim-selection";
import { categoryLabel } from "@/modules/localization/jobs";
import { findingsCopy } from "@/modules/localization/economics-findings";
import type { Locale } from "@/modules/localization/config";

export function findClaim(
  result: Stage5EconomicsResult | undefined,
  kind: StructuredEconomicsClaimDTO["kind"],
  categoryId?: string,
): StructuredEconomicsClaimDTO | undefined {
  return result?.claims.find((claim) => claim.kind === kind && claim.categoryId === categoryId);
}
export function claimFindingText(
  claim: StructuredEconomicsClaimDTO,
  locale: Locale,
): string | null {
  if (!isVisibleFinding(claim)) return null;
  const copy = findingsCopy(locale);
  const category = claim.categoryId ? categoryLabel(locale, claim.categoryId) : copy.overall;
  if (claim.kind === "PROGRAMME_DIFFERENCE_UNQUANTIFIED") return copy.programme;
  if (claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT" && claim.categoryId) {
    return copy.insufficient
      .replace("{category}", category)
      .replace("{eligible}", String(claim.value.eligibleObservationCount))
      .replace("{required}", String(claim.value.requiredObservationCount));
  }
  const quoted =
    claim.kind === "CATEGORY_QUOTED_VARIANCE" || claim.kind === "OVERALL_QUOTED_VARIANCE";
  const forecast =
    claim.kind === "CATEGORY_FORECAST_ACTUAL_VARIANCE" ||
    claim.kind === "OVERALL_FORECAST_ACTUAL_VARIANCE";
  if (
    (!quoted && !forecast) ||
    !isVisibleFinding(claim) ||
    typeof claim.value.variancePercent !== "string" ||
    !/^-?\d+(\.\d+)?$/.test(claim.value.variancePercent)
  )
    return null;
  // Formatting only: value, direction and alignment come from the domain claim.
  const percent = new Intl.NumberFormat(locale, {
    signDisplay: "never",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(claim.value.variancePercent));
  return (quoted ? copy.quote : copy.forecast)
    .replace("{category}", category)
    .replace("{percent}", percent)
    .replace("{direction}", copy[claim.value.direction as "ABOVE" | "BELOW"]);
}
export function recommendationText(
  result: Stage5EconomicsResult | undefined,
  locale: Locale,
): string | undefined {
  if (!result || result.accessScope === "STRUCTURAL_ONLY") return undefined;
  const categories = [
    ...new Set(
      result.claims
        .filter(isReviewClaim)
        .flatMap((claim) => (claim.categoryId ? [categoryLabel(locale, claim.categoryId)] : [])),
    ),
  ];
  const copy = findingsCopy(locale);
  return categories.length
    ? locale === "zh-TW"
      ? `${copy.review}：${categories.join("、")}。`
      : `${copy.review}: ${categories.join(", ")}.`
    : copy.nothing;
}
