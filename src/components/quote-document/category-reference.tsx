"use client";
import { Button } from "@/components/ui/button";
import type { DraftBasis } from "@/modules/quote-draft/domain/draft-policy";
import { draftCoverage } from "@/modules/quote-draft/domain/draft-policy";
import type { QuoteDraftJob } from "@/repositories/ports/quote-draft-repository";
import { formatMoney } from "@/modules/finance/format-money";
import { formatQuoteRate } from "@/modules/quote-draft/presentation";
import { areaInFirmUnit, areaUnitLabel } from "@/modules/firm-lists/domain/area-unit";
import { categoryLabel } from "@/modules/localization/jobs";
import { quoteDraftCopy, quoteTemplate as text } from "@/modules/localization/quote-draft";
import { quoteDocumentCopy } from "@/modules/localization/quote-document";
import type { Locale } from "@/modules/localization/config";
import styles from "./quote-document.module.css";
export function CategoryReference({
  locale,
  job,
  categoryId,
  basis,
  unavailable,
  outdated,
  sectionTitles,
  amount,
  canUse,
  pending,
  onUse,
  onSources,
}: {
  locale: Locale;
  job: QuoteDraftJob;
  categoryId: string;
  basis: DraftBasis | null;
  unavailable: boolean;
  outdated: boolean;
  sectionTitles: readonly string[];
  amount: string | null;
  canUse: boolean;
  pending: boolean;
  onUse: () => void;
  onSources: () => void;
}) {
  const copy = quoteDraftCopy(locale),
    doc = quoteDocumentCopy(locale),
    coverage = basis
      ? draftCoverage(categoryId, basis.scopeCategoryIds, job.catalog.workCategories)
      : null;
  const names = (ids: readonly string[]) =>
    new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
      ids.map((id) => categoryLabel(locale, id, job.catalog.workCategories)),
    );
  const rate = (value: string) => formatQuoteRate(value, job.currency, job.catalog.areaDisplayUnit),
    unit = areaUnitLabel(job.catalog.areaDisplayUnit);
  return (
    <section className={styles.reference}>
      <h3>{categoryLabel(locale, categoryId, job.catalog.workCategories)}</h3>
      {sectionTitles.length > 1 && (
        <p>
          {text(doc.combined, { sections: sectionTitles.join(locale === "zh-TW" ? "、" : ", ") })}
        </p>
      )}
      {amount !== null && (
        <p>
          {doc.categoryTotal}：{formatMoney(amount, job.currency)}
        </p>
      )}
      {unavailable ? (
        <p>{copy.unavailableBasis}</p>
      ) : basis ? (
        <>
          <p>{text(copy.calculated, { date: basis.calculatedAt.slice(0, 10) })}</p>
          {outdated && <p role="status">{copy.stale}</p>}
          {basis.suggestedAmount !== undefined && (
            <p>
              <strong>
                {copy.suggestion}：{formatMoney(basis.suggestedAmount, job.currency)}
              </strong>
              {canUse && !outdated && (
                <Button disabled={pending} onClick={onUse}>
                  {copy.use}
                </Button>
              )}
            </p>
          )}
          {coverage?.partial && (
            <p>
              {text(copy.partial, { all: names(coverage.all), included: names(coverage.included) })}
            </p>
          )}
          {basis.medianRate !== undefined ? (
            <>
              <p>
                {text(
                  coverage?.partial || basis.count < basis.requiredCount
                    ? copy.reference
                    : copy.basis,
                  {
                    n: basis.count,
                    rate: rate(basis.medianRate),
                    unit,
                    area: areaInFirmUnit(basis.area, job.catalog.areaDisplayUnit),
                  },
                )}
              </p>
              <p>
                {text(copy.range, { low: rate(basis.lowRate!), high: rate(basis.highRate!), unit })}
              </p>
            </>
          ) : null}
          {basis.count < basis.requiredCount && (
            <p>{text(copy.few, { n: basis.count, required: basis.requiredCount })}</p>
          )}
          {basis.actualExceeded && (
            <p>
              {text(copy.exceeded, {
                k: basis.actualExceeded.count,
                n: basis.actualExceeded.selectedCount,
              })}
            </p>
          )}
          <Button variant="quiet" disabled={pending} onClick={onSources}>
            {copy.sources}
          </Button>
        </>
      ) : (
        <p>{doc.noReference}</p>
      )}
    </section>
  );
}
