"use client";

import { useParams } from "next/navigation";

import styles from "@/components/comparisons/comparison-experience.module.css";
import { getComparisonCopy } from "@/modules/comparison-experience/copy";
import { isSupportedLocale } from "@/modules/localization/config";

type ComparisonErrorProps = Readonly<{
  error: Error & { digest?: string | undefined };
  reset: () => void;
}>;

export default function ComparisonError({ error, reset }: ComparisonErrorProps) {
  const params = useParams<{ locale?: string }>();
  const locale = params.locale && isSupportedLocale(params.locale) ? params.locale : "en";
  const copy = getComparisonCopy(locale);

  return (
    <section className={styles.statePanel} aria-labelledby="comparison-error-title">
      <p className={styles.eyebrow}>{copy.eyebrow}</p>
      <h1 id="comparison-error-title">{copy.failedTitle}</h1>
      <p>{copy.failedDescription}</p>
      {error.digest ? (
        <p>
          <strong>{copy.referenceId}:</strong> <code>{error.digest}</code>
        </p>
      ) : null}
      <div className={styles.startActions}>
        <button className={styles.secondaryButton} type="button" onClick={reset}>
          {copy.rerunComparison}
        </button>
      </div>
    </section>
  );
}
