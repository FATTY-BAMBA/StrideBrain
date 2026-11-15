import { runComparisonAction } from "@/app/[locale]/projects/[projectKey]/compare/actions";
import { getComparisonCopy } from "@/modules/comparison-experience/copy";
import type { Locale } from "@/modules/localization/config";

import styles from "./comparison-experience.module.css";

type ComparisonStartProps = Readonly<{
  locale: Locale;
  projectKey: string;
}>;

export function ComparisonStart({ locale, projectKey }: ComparisonStartProps) {
  const copy = getComparisonCopy(locale);

  return (
    <section className={styles.hero} aria-labelledby="comparison-start-title">
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="comparison-start-title">{copy.heroQuestion}</h1>
        <div className={styles.heroQuestion}>
          <strong>{copy.runComparison}</strong>
          <span>{copy.heroPrompt}</span>
        </div>
        <form action={runComparisonAction} className={styles.startActions}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectKey" value={projectKey} />
          <button className={styles.primaryButton} type="submit">
            {copy.runComparison}
          </button>
        </form>
      </div>
    </section>
  );
}
