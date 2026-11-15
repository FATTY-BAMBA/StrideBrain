import type { Route } from "next";
import Link from "next/link";

import type { ReceiptDTO } from "@/modules/internal-review/domain/contracts";
import { getInternalReviewCopy } from "@/modules/internal-review-experience/copy";
import { internalReviewHref } from "@/modules/internal-review-experience/route-state";
import type { Locale } from "@/modules/localization/config";
import styles from "./internal-review.module.css";

export function displayReviewTimestamp(value: string, locale: Locale, timezone: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

export function ActionReceipt({
  receipt,
  locale,
}: Readonly<{ receipt: ReceiptDTO; locale: Locale }>) {
  const copy = getInternalReviewCopy(locale);
  const fields = [
    [copy.actionKey, receipt.businessKey],
    [copy.project, receipt.project.name],
    [copy.assignee, receipt.assigneeDisplayName ?? copy.unassigned],
    [copy.dueDate, receipt.dueDate ?? copy.noDueDate],
    [copy.status, copy.open],
    [copy.createdAt, displayReviewTimestamp(receipt.createdAt, locale, receipt.timezone)],
    [copy.createdBy, receipt.createdByDisplay],
    [copy.evidenceCount, String(receipt.evidenceCount)],
    [copy.comparison, receipt.comparisonRunId],
    [copy.economics, receipt.enrichmentRunId],
  ] as const;
  return (
    <div className={styles.receiptContent}>
      <h3 className={styles.receiptTitle}>{receipt.title}</h3>
      <p className={styles.rationale}>{receipt.rationale}</p>
      <dl className={styles.referenceGrid}>
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.actions}>
        <Link
          className={styles.primary}
          href={internalReviewHref(locale, receipt.project.projectKey, receipt) as Route}
        >
          {copy.returnToComparison}
        </Link>
        <Link
          className={styles.secondary}
          href={
            internalReviewHref(locale, receipt.project.projectKey, receipt, {}, "actions") as Route
          }
        >
          {copy.openActions}
        </Link>
      </div>
    </div>
  );
}
