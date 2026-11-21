import { comparisonHref } from "@/modules/comparison-experience/route-state";
import { internalReviewHref } from "@/modules/internal-review-experience/route-state";
import type { HomeDecision } from "./application/get-home-desk";
import type { Locale } from "@/modules/localization/config";
import { homeDeskCopy } from "@/modules/localization/home-desk";
import { categoryLabel } from "@/modules/localization/jobs";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
import type { ClosedJobLesson } from "@/modules/economics/domain/closed-job-economics-service";

export function decisionPresentation(item: HomeDecision, locale: Locale) {
  const copy = homeDeskCopy(locale);
  return {
    sentence:
      item.kind === "REVIEW_QUOTE" && item.claim
        ? claimFindingText(item.claim, locale)
        : item.kind === "CONFIRM_REVIEW"
          ? copy.confirm
          : copy.compare,
    label: copy[item.kind],
    href:
      item.kind === "CONFIRM_REVIEW" && item.comparisonRunId && item.enrichmentRunId
        ? internalReviewHref(
            locale,
            item.project.businessKey,
            {
              comparisonRunId: item.comparisonRunId,
              enrichmentRunId: item.enrichmentRunId,
              returnContext: { selectedProjectKeys: [] },
            },
            { proposalKey: item.proposalKey },
          )
        : comparisonHref(locale, item.project.businessKey, {
            comparisonRunId: item.comparisonRunId,
            economicsRunId: item.enrichmentRunId,
            selectedProjectKeys: item.selectedProjectKeys,
            evidenceClaimKey: item.claim?.claimKey,
          }),
  };
}
/** Formats exact decimal text without converting monetary values to binary floats. */
export function homeMoney(amount: string, currency: string): string {
  const [whole = "0", fraction = "00"] = amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency === "TWD" ? "NT$" : `${currency} `}${grouped}${fraction === "00" ? "" : `.${fraction}`}`;
}
export function closedLessonText(lesson: ClosedJobLesson, locale: Locale) {
  return homeDeskCopy(locale)
    [lesson.exceeded ? "exceeded" : "closest"].replace(
      "{category}",
      categoryLabel(locale, lesson.categoryId),
    )
    .replace("{amount}", homeMoney(lesson.difference, lesson.currency));
}
