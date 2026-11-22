import { orderQuoteLines } from "@/modules/quote-draft/domain/quote-line-order";
import {
  decimalToString,
  divide,
  money,
  multiply,
  quantity,
  unitRate,
} from "@/modules/finance/fixed-decimal";
import {
  REQUIRED_HISTORY_COUNT,
  type CategoryQuotedHistory,
} from "@/modules/economics/domain/historical-economics-service";
import type { ClosedJobLesson } from "@/modules/economics/domain/closed-job-economics-service";
import { scopesForCommercialCategory } from "@/modules/projects/domain/job-input";

export const QUOTE_DRAFT_POLICY_VERSION = "QUOTE-DRAFT-1.0" as const;
export type DraftJob = Readonly<{
  area: string;
  areaUnit: string;
  currency: string;
  scopeCategoryIds: readonly string[];
  commercialCategoryIds: readonly string[];
}>;
export type DraftBasis = Readonly<{
  policyVersion: typeof QUOTE_DRAFT_POLICY_VERSION;
  calculatedAt: string;
  area: string;
  areaUnit: string;
  scopeCategoryIds: readonly string[];
  count: number;
  requiredCount: number;
  medianRate?: string;
  lowRate?: string;
  highRate?: string;
  suggestedAmount?: string;
  evidenceReferenceIds: readonly string[];
  conflictEvidenceIds: readonly string[];
  actualExceeded?: Readonly<{
    count: number;
    selectedCount: number;
    evidenceReferenceIds: readonly string[];
  }>;
}>;
export type DraftSuggestion = Readonly<{ categoryId: string; basis: DraftBasis }>;

/** Prices come exclusively from the shared eligible quoted-history aggregate. */
export function prepareDraftPolicy(
  input: Readonly<{
    job: DraftJob;
    baselines: readonly CategoryQuotedHistory[];
    differences?: readonly (ClosedJobLesson & { projectKey: string })[] | undefined;
    selectedProjectCount: number;
    calculatedAt: string;
  }>,
): readonly DraftSuggestion[] {
  return orderQuoteLines(
    [...new Set(input.job.commercialCategoryIds)].map((categoryId) => ({ categoryId })),
  ).map(({ categoryId }) => {
    const coverage = draftCoverage(categoryId, input.job.scopeCategoryIds);
    const baseline = input.baselines.find((entry) => entry.categoryId === categoryId);
    const history = baseline?.history;
    const count = history?.eligibleObservationCount ?? 0;
    const hasReference =
      history?.observationType === "QUOTED_PRICE" &&
      count > 0 &&
      history.medianNormalizedAmount !== undefined &&
      history.minimumNormalizedAmount !== undefined &&
      history.maximumNormalizedAmount !== undefined;
    const exceeded = input.differences?.filter(
      (entry) => entry.categoryId === categoryId && entry.exceeded,
    );
    const basis: DraftBasis = {
      policyVersion: QUOTE_DRAFT_POLICY_VERSION,
      calculatedAt: input.calculatedAt,
      area: input.job.area,
      areaUnit: input.job.areaUnit,
      scopeCategoryIds: [...input.job.scopeCategoryIds].sort(),
      count,
      requiredCount: REQUIRED_HISTORY_COUNT,
      ...(hasReference
        ? {
            medianRate: history.medianNormalizedAmount!,
            lowRate: history.minimumNormalizedAmount!,
            highRate: history.maximumNormalizedAmount!,
          }
        : {}),
      ...(hasReference && count >= REQUIRED_HISTORY_COUNT && !coverage.partial
        ? {
            // Keep all nine product decimals until rounding to thousands (no double rounding).
            suggestedAmount: decimalToString(
              multiply(
                divide(
                  multiply(unitRate(history.medianNormalizedAmount!), quantity(input.job.area), 9),
                  money("1000"),
                  0,
                  "HALF_UP",
                ),
                money("1000"),
                2,
              ),
            ),
          }
        : {}),
      evidenceReferenceIds: [...new Set(history?.evidenceReferenceIds ?? [])].sort(),
      conflictEvidenceIds: [...new Set(baseline?.conflictEvidenceIds ?? [])].sort(),
      ...(exceeded?.length
        ? {
            actualExceeded: {
              count: new Set(exceeded.map((entry) => entry.projectKey)).size,
              selectedCount: input.selectedProjectCount,
              evidenceReferenceIds: [
                ...new Set(exceeded.flatMap((entry) => entry.evidenceReferenceIds)),
              ].sort(),
            },
          }
        : {}),
    };
    return { categoryId, basis };
  });
}

export function basisOutOfDate(basis: DraftBasis, job: DraftJob, categoryId: string): boolean {
  const before = draftCoverage(categoryId, basis.scopeCategoryIds);
  const current = draftCoverage(categoryId, job.scopeCategoryIds);
  return (
    quantity(basis.area).atoms !== quantity(job.area).atoms ||
    basis.areaUnit !== job.areaUnit ||
    !job.commercialCategoryIds.includes(categoryId) ||
    before.included.length === 0 ||
    JSON.stringify(before.included) !== JSON.stringify(current.included)
  );
}

export function draftCoverage(categoryId: string, scopeCategoryIds: readonly string[]) {
  const all = scopesForCommercialCategory(categoryId);
  const included = all.filter((scope) => scopeCategoryIds.includes(scope));
  return { all, included, partial: all.length === 0 || included.length !== all.length };
}

export function basisSourceIds(basis: DraftBasis): readonly string[] {
  return [
    ...new Set([
      ...basis.evidenceReferenceIds,
      ...basis.conflictEvidenceIds,
      ...(basis.actualExceeded?.evidenceReferenceIds ?? []),
    ]),
  ].sort();
}
