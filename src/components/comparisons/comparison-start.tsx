import { PageHeader } from "@/components/ui/page-header";
import { runComparisonAction } from "@/app/[locale]/projects/[projectKey]/compare/actions";
import { getComparisonCopy } from "@/modules/comparison-experience/copy";
import type { Locale } from "@/modules/localization/config";

import styles from "./comparison-experience.module.css";

type ComparisonStartProps = Readonly<{
  closed?: boolean;
  locale: Locale;
  projectKey: string;
}>;

export function ComparisonStart({ locale, projectKey, closed = false }: ComparisonStartProps) {
  const copy = getComparisonCopy(locale);

  return (
    <section className={styles.hero} aria-labelledby="comparison-start-title">
      <div className={styles.heroContent}>
        <PageHeader
          id="comparison-start-title"
          context={copy.eyebrow}
          title={copy.heroQuestion}
          description={copy.heroPrompt}
        />
        {!closed && (
          <form action={runComparisonAction} className={styles.startActions}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="projectKey" value={projectKey} />
            <button className={styles.primaryButton} type="submit">
              {copy.runComparison}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
