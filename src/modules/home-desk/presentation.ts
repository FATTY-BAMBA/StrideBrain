import type { FirmWorkCategory } from "@/modules/firm-lists/domain/contracts";
import { formatMoney } from "@/modules/finance/format-money";
import { comparisonHref } from "@/modules/comparison-experience/route-state";
import { internalReviewHref } from "@/modules/internal-review-experience/route-state";
import type { HomeDecision } from "./application/get-home-desk";
import type { Locale } from "@/modules/localization/config";
import { homeDeskCopy } from "@/modules/localization/home-desk";
import { categoryLabel } from "@/modules/localization/jobs";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
import type { ClosedJobLesson } from "@/modules/economics/domain/closed-job-economics-service";

export function decisionPresentation(
  item: HomeDecision,
  locale: Locale,
  categories: readonly FirmWorkCategory[],
) {
  const copy = homeDeskCopy(locale);
  return {
    sentence:
      ["REVIEW_QUOTE", "ISSUE_QUOTE"].includes(item.kind) && item.claim
        ? claimFindingText(item.claim, locale, categories)
        : item.kind === "ISSUE_QUOTE"
          ? copy.issue
          : item.kind === "AWAITING_CLIENT"
            ? copy.awaiting
                .replace("{number}", item.documentNumber ?? "")
                .replace("{date}", item.validUntil ?? "")
            : item.kind === "CONFIRM_REVIEW"
              ? copy.confirm
              : item.kind === "DRAFT_QUOTE"
                ? copy.draft
                : copy.REVIEW_QUOTE,
    moreFindings:
      ["REVIEW_QUOTE", "ISSUE_QUOTE"].includes(item.kind) &&
      item.additionalFindingCount &&
      item.additionalFindingCount > 0
        ? item.additionalFindingCount === 1
          ? copy.oneMoreFinding
          : copy.moreFindings.replace("{count}", String(item.additionalFindingCount))
        : null,
    label: item.kind === "AWAITING_CLIENT" && item.canAccept ? copy.accept : copy[item.kind],
    href: ["DRAFT_QUOTE", "ISSUE_QUOTE", "AWAITING_CLIENT"].includes(item.kind)
      ? `/${locale}/projects/${encodeURIComponent(item.project.businessKey)}/quote`
      : item.kind === "ISSUE_QUOTE"
        ? copy.issue
        : item.kind === "AWAITING_CLIENT"
          ? copy.awaiting
              .replace("{number}", item.documentNumber ?? "")
              .replace("{date}", item.validUntil ?? "")
          : item.kind === "CONFIRM_REVIEW" && item.comparisonRunId && item.enrichmentRunId
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
export function closedLessonText(
  lesson: ClosedJobLesson,
  locale: Locale,
  categories: readonly FirmWorkCategory[],
) {
  return homeDeskCopy(locale)
    [lesson.exceeded ? "exceeded" : "closest"].replace(
      "{category}",
      categoryLabel(locale, lesson.categoryId, categories),
    )
    .replace("{amount}", formatMoney(lesson.difference, lesson.currency));
}
