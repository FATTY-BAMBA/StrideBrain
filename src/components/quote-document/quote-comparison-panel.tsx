"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { requestQuoteComparison } from "@/modules/quote-comparison/request";
import type { QuoteComparison } from "@/modules/quote-comparison/application/quote-comparison";
import type { Locale } from "@/modules/localization/config";
import { quoteComparisonCopy } from "@/modules/localization/quote-comparison";
import ui from "@/components/ui/ui.module.css";
import styles from "./quote-document.module.css";
export function QuoteComparisonPanel({
  locale,
  projectKey,
  children,
  onPrepared,
  closed = false,
}: {
  closed?: boolean;
  locale: Locale;
  projectKey: string;
  children?: ReactNode;
  onPrepared: (
    value: NonNullable<Extract<QuoteComparison, { kind: "CURRENT" }>["preparation"]>,
  ) => void;
}) {
  const copy = quoteComparisonCopy(locale);
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reveal = () => {
      if (location.hash === "#quote-comparison" && disclosure.current)
        disclosure.current.open = true;
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  const [result, setResult] = useState<QuoteComparison | null>(null);
  const [running, setRunning] = useState(false);
  const status =
    result?.kind === "CONTEXT_INCOMPLETE" && result.missingFields.includes("COMMERCIAL_CATEGORIES")
      ? copy.missingCategories
      : result
        ? copy[result.kind]
        : copy.loading;
  useEffect(() => {
    let active = true;
    void requestQuoteComparison(locale, projectKey, "READ")
      .catch(() => ({ kind: "UNAVAILABLE" as const }))
      .then((result) => {
        if (active) {
          setResult(result);
          if (result.kind === "CURRENT" && result.preparation) onPrepared(result.preparation);
        }
      });
    return () => {
      active = false;
    };
  }, [locale, projectKey, onPrepared]);
  async function run() {
    setRunning(true);
    try {
      const result = await requestQuoteComparison(locale, projectKey, "RUN");
      setResult(result);
      if (result.kind === "CURRENT" && result.preparation) onPrepared(result.preparation);
    } catch {
      setResult({ kind: "UNAVAILABLE" });
    } finally {
      setRunning(false);
    }
  }
  return (
    <section id="quote-comparison" className={styles.references} aria-label={copy.title}>
      <h2>{copy.title}</h2>
      <p role="status">{running ? copy.running : status}</p>
      {!closed && (
        <Button disabled={running || !result} onClick={() => void run()}>
          {result?.kind === "CURRENT" || result?.kind === "OUT_OF_DATE" ? copy.refresh : copy.run}
        </Button>
      )}
      <details ref={disclosure}>
        <summary>
          {copy.details}
          {result?.kind === "CURRENT"
            ? ` · ${copy.similar}: ${result.jobs.length} · ${copy.findings}: ${result.findings.length}`
            : ""}
        </summary>
        {result?.kind === "CURRENT" && (
          <>
            <h3>{copy.similar}</h3>
            <ul>
              {result.jobs.map((job) => (
                <li key={job.projectKey}>
                  <Link
                    className={ui.recordLink}
                    href={
                      `/${locale}/projects/${encodeURIComponent(job.projectKey)}/quote` as Route
                    }
                  >
                    {job.name}
                  </Link>{" "}
                  · {job.score}/100
                </li>
              ))}
            </ul>
            <h3>{copy.findings}</h3>
            {result.findings.length ? (
              <ul>
                {result.findings.slice(0, 5).map((finding) => (
                  <li key={finding.href}>
                    {finding.sentence} <Link href={finding.href as Route}>{copy.sources}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{copy.none}</p>
            )}
          </>
        )}
        <Link
          href={
            (result?.kind === "CURRENT"
              ? result.href
              : `/${locale}/projects/${encodeURIComponent(projectKey)}/compare`) as Route
          }
        >
          {copy.open}
        </Link>
        {children}
      </details>
    </section>
  );
}
