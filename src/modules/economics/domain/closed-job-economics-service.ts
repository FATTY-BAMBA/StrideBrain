import { compare, decimalToString, money, subtract, sum } from "@/modules/finance/fixed-decimal";
import type {
  AuthorizedEconomicsBatch,
  EconomicsProjectSnapshot,
  FinancialObservationRecord,
} from "./contracts";
import { ObservationAuthorityService } from "./observation-authority";

export type ClosedJobFinancials = Readonly<{
  project: EconomicsProjectSnapshot;
  quote: FinancialObservationRecord | null;
  actual: FinancialObservationRecord | null;
}>;
export type ClosedJobLesson = Readonly<{
  currency: string;
  quoteBeforeTax: string;
  actualCost: string;
  quoteEvidenceIds: readonly string[];
  actualEvidenceIds: readonly string[];
  categoryId: string;
  difference: string;
  exceeded: boolean;
  evidenceReferenceIds: readonly string[];
}>;

/** Same-job price versus actual cost, never margin or cross-job normalization. */
export class ClosedJobEconomicsService {
  calculate(input: ClosedJobFinancials, snapshotDate: string): ClosedJobLesson | null {
    return this.categoryDifferences(input, snapshotDate)[0] ?? null;
  }

  categoryDifferences(
    input: ClosedJobFinancials,
    snapshotDate: string,
  ): readonly ClosedJobLesson[] {
    const { project, quote, actual } = input;
    if (!quote || !actual) return [];
    if (quote.projectId !== project.internalId || actual.projectId !== project.internalId)
      return [];
    const authority = new ObservationAuthorityService();
    const basis = {
      snapshotDate,
      activeCurrency: project.currency,
      activeAreaUnit: project.areaUnit,
    };
    if (
      !authority.evaluate(project, quote, { ...basis, purpose: "QUOTED_HISTORY" }).eligible ||
      !authority.evaluate(project, actual, { ...basis, purpose: "ACTUAL_HISTORY" }).eligible
    )
      return [];
    const evidence = (record: FinancialObservationRecord, category?: string) =>
      [
        ...new Set([
          ...record.evidenceReferenceIds.filter(
            (id) =>
              !category ||
              !record.lines.some(
                (line) => line.categoryId !== category && line.evidenceReferenceIds.includes(id),
              ),
          ),
          ...record.lines
            .filter((line) => !category || line.categoryId === category)
            .flatMap((line) => line.evidenceReferenceIds),
        ]),
      ].sort();
    const categories = [...new Set(actual.lines.map((line) => line.categoryId))].sort();
    if (categories.some((category) => !quote.lines.some((line) => line.categoryId === category)))
      return [];
    const differences = categories
      .flatMap((categoryId) => {
        const quotes = quote.lines.filter((line) => line.categoryId === categoryId);
        const costs = actual.lines.filter((line) => line.categoryId === categoryId);
        if (
          !quotes.length ||
          !evidence(quote, categoryId).length ||
          !evidence(actual, categoryId).length
        )
          return [];
        return [
          {
            categoryId,
            difference: subtract(
              sum(
                costs.map((line) => money(line.amount)),
                2,
              ),
              sum(
                quotes.map((line) => money(line.amount)),
                2,
              ),
            ),
          },
        ];
      })
      .sort(
        (a, b) => compare(b.difference, a.difference) || a.categoryId.localeCompare(b.categoryId),
      );
    return differences.map((lesson) => ({
      currency: project.currency,
      quoteBeforeTax: decimalToString(money(quote.totalAmount)),
      actualCost: decimalToString(money(actual.totalAmount)),
      quoteEvidenceIds: evidence(quote),
      actualEvidenceIds: evidence(actual),
      categoryId: lesson.categoryId,
      difference: decimalToString(lesson.difference),
      exceeded: compare(lesson.difference, money("0")) > 0,
      evidenceReferenceIds: [
        ...new Set([...evidence(quote, lesson.categoryId), ...evidence(actual, lesson.categoryId)]),
      ].sort(),
    }));
  }

  selectedCategoryDifferences(batch: AuthorizedEconomicsBatch, snapshotDate: string) {
    if (batch.accessScope !== "FULL_ACTUAL") return undefined;
    const authority = new ObservationAuthorityService();
    return batch.projects
      .filter((project) => batch.selectedProjectIds.includes(project.internalId))
      .flatMap((project) => {
        const latest = (purpose: "QUOTED_HISTORY" | "ACTUAL_HISTORY") =>
          batch.records
            .filter(
              (record) =>
                record.projectId === project.internalId &&
                authority.evaluate(project, record, {
                  snapshotDate,
                  activeCurrency: project.currency,
                  activeAreaUnit: project.areaUnit,
                  purpose,
                }).eligible,
            )
            .sort(
              (a, b) =>
                (b.versionNumber ?? 0) - (a.versionNumber ?? 0) ||
                (b.effectiveAt ?? "").localeCompare(a.effectiveAt ?? "") ||
                a.id.localeCompare(b.id),
            )[0] ?? null;
        return this.categoryDifferences(
          { project, quote: latest("QUOTED_HISTORY"), actual: latest("ACTUAL_HISTORY") },
          snapshotDate,
        ).map((lesson) => ({ ...lesson, projectKey: project.businessKey }));
      });
  }
}
