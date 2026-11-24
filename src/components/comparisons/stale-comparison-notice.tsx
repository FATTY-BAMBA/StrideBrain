"use client";

import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import { useFormStatus } from "react-dom";
import { runComparisonAction } from "@/app/[locale]/projects/[projectKey]/compare/actions";
import { getFreshnessCopy } from "@/modules/comparison-experience/freshness-copy";
import type { ComparisonFreshness } from "@/modules/comparisons/domain/freshness";
import { getEvidencePanelCopy } from "@/modules/evidence-panel/copy";
import { evidenceTitle } from "@/modules/evidence-panel/presentation";
import type { Locale } from "@/modules/localization/config";
import styles from "./stale-comparison-notice.module.css";

function RerunButton({ locale }: Readonly<{ locale: Locale }>) {
  const { pending } = useFormStatus();
  const copy = getFreshnessCopy(locale);
  return (
    <button disabled={pending} type="submit">
      {pending ? copy.pending : copy.rerun}
    </button>
  );
}

export function StaleComparisonNotice({
  catalog,
  freshness,
  locale,
  projectKey,
}: Readonly<{
  catalog: FirmLists;
  freshness: ComparisonFreshness;
  locale: Locale;
  projectKey: string;
}>) {
  if (freshness.state === "CURRENT") return null;
  const copy = getFreshnessCopy(locale);
  const evidenceCopy = getEvidencePanelCopy(locale);
  return (
    <section
      className={styles.notice}
      role="alert"
      aria-atomic="false"
      data-comparison-freshness={freshness.state}
    >
      <strong className={styles.title}>
        <span aria-hidden="true">⚠ </span>
        {freshness.state === "STALE" ? copy.stale : copy.unverified}
      </strong>
      <p>{freshness.state === "STALE" ? copy.explanation : copy.unverifiedExplanation}</p>
      {freshness.changedSources.length ? (
        <div>
          <strong>{copy.changedSources}</strong>
          <ul className={styles.sources}>
            {freshness.changedSources.map((source) => (
              <li key={source.sourceKey} data-changed-source-key={source.sourceKey}>
                <strong>
                  {locale === "zh-TW" ? source.projectNameZhTw : source.projectNameEn} ·{" "}
                  {evidenceTitle(
                    locale,
                    locale === "zh-TW" ? source.titleZhTw : source.titleEn,
                    catalog,
                  )}
                </strong>
                {source.reasons.includes("AUTHORITY") ? (
                  <p>
                    {copy.authority}: {copy.previous} —{" "}
                    {evidenceCopy.authorityLabels[source.previousAuthority]}; {copy.current} —{" "}
                    {evidenceCopy.authorityLabels[source.currentAuthority]}
                  </p>
                ) : null}
                {source.reasons
                  .filter((reason) => reason !== "AUTHORITY")
                  .map((reason) => (
                    <p key={reason}>{copy.reasons[reason]}</p>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      ) : freshness.state === "STALE" ? (
        <p>{copy.otherChanges}</p>
      ) : null}
      <form action={runComparisonAction}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectKey" value={projectKey} />
        <RerunButton locale={locale} />
      </form>
    </section>
  );
}
