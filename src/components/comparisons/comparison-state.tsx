import { PageHeader } from "@/components/ui/page-header";
import { missingContextLabel } from "@/modules/localization/comparison-fields";
import { runComparisonAction } from "@/app/[locale]/projects/[projectKey]/compare/actions";
import { getComparisonCopy } from "@/modules/comparison-experience/copy";
import type { Locale } from "@/modules/localization/config";

import styles from "./comparison-experience.module.css";

type ComparisonStateKind =
  | "SESSION_REQUIRED"
  | "CONTEXT_INCOMPLETE"
  | "NO_ELIGIBLE_HISTORY"
  | "UNAVAILABLE"
  | "FAILED"
  | "ECONOMICS_UNAVAILABLE"
  | "ECONOMICS_FAILED";

type ComparisonStateProps = Readonly<{
  closed?: boolean;
  locale: Locale;
  projectKey: string;
  kind: ComparisonStateKind;
  requestId?: string | undefined;
  missingFields?: readonly string[] | undefined;
}>;

export function ComparisonState({
  locale,
  projectKey,
  kind,
  requestId,
  missingFields = [],
  closed = false,
}: ComparisonStateProps) {
  const copy = getComparisonCopy(locale);
  const sessionRequired = kind === "SESSION_REQUIRED";
  const title =
    kind === "CONTEXT_INCOMPLETE"
      ? copy.contextIncompleteTitle
      : kind === "NO_ELIGIBLE_HISTORY"
        ? copy.noHistoryTitle
        : kind === "FAILED" || kind === "ECONOMICS_FAILED"
          ? copy.failedTitle
          : sessionRequired
            ? copy.sessionRequiredTitle
            : copy.unavailableTitle;
  const description =
    kind === "FAILED" || kind === "ECONOMICS_FAILED"
      ? copy.failedDescription
      : sessionRequired
        ? copy.sessionRequiredDescription
        : copy.unavailableDescription;

  return (
    <section className={styles.statePanel} aria-labelledby="comparison-state-title">
      <PageHeader
        id="comparison-state-title"
        context={copy.eyebrow}
        title={title}
        description={description}
      />

      {missingFields.length > 0 ? (
        <ul className={styles.missingList} aria-label={copy.contextIncompleteTitle}>
          {missingFields.map((field) => (
            <li key={field}>{missingContextLabel(locale, field)}</li>
          ))}
        </ul>
      ) : null}

      {requestId ? (
        <p>
          <strong>{copy.referenceId}:</strong> <code>{requestId}</code>
        </p>
      ) : null}

      {!sessionRequired && !closed ? (
        <form action={runComparisonAction} className={styles.startActions}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectKey" value={projectKey} />
          <button className={styles.secondaryButton} type="submit">
            {copy.rerunComparison}
          </button>
        </form>
      ) : null}
    </section>
  );
}
