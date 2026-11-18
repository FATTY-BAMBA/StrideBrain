"use client";

import { useParams } from "next/navigation";
import { getComparisonCopy } from "@/modules/comparison-experience/copy";
import { isSupportedLocale } from "@/modules/localization/config";

import styles from "@/components/comparisons/comparison-loading.module.css";

export default function ComparisonLoading() {
  const params = useParams<{ locale?: string }>();
  const locale = params.locale && isSupportedLocale(params.locale) ? params.locale : "en";
  return (
    <div
      className={styles.shell}
      role="status"
      aria-busy="true"
      aria-label={getComparisonCopy(locale).loadingLabel}
    >
      <section className={styles.hero}>
        <span className={styles.lineShort} />
        <span className={styles.lineWide} />
        <span className={styles.line} />
      </section>
      <section className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.block} />
        </div>
        <div className={styles.card}>
          <div className={styles.block} />
        </div>
        <div className={styles.card}>
          <div className={styles.block} />
        </div>
      </section>
      <section className={styles.table}>
        <div className={styles.block} />
      </section>
    </div>
  );
}
