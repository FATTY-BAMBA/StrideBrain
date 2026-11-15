"use client";

import { useEffect, useRef } from "react";

import type {
  EvidencePanelOutcome,
  EvidencePanelSelection,
  EvidencePanelSourceView,
  EvidencePanelView,
} from "@/modules/evidence-panel/contracts";
import { getEvidencePanelCopy } from "@/modules/evidence-panel/copy";
import type { Locale } from "@/modules/localization/config";

import styles from "./evidence-panel.module.css";

type EvidencePanelProps = Readonly<{
  outcome: EvidencePanelOutcome;
  locale: Locale;
  onClose: () => void;
  onNavigate: (selection: EvidencePanelSelection) => void;
}>;

function panelStateText(outcome: Exclude<EvidencePanelOutcome, { kind: "READY" }>): string {
  if (outcome.kind === "ACCESS_CHANGED") return "ACCESS_CHANGED";
  if (outcome.kind === "RESTRICTED") return "RESTRICTED";
  if (outcome.kind === "FAILED") return "FAILED";
  return "UNAVAILABLE";
}

function StatePanel({
  outcome,
  onClose,
  locale,
}: Readonly<{
  outcome: Exclude<EvidencePanelOutcome, { kind: "READY" }>;
  onClose: () => void;
  locale: Locale;
}>) {
  const copy = getEvidencePanelCopy(locale);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const message =
    outcome.kind === "ACCESS_CHANGED"
      ? copy.accessChanged
      : outcome.kind === "RESTRICTED"
        ? copy.restricted
        : copy.unavailable;
  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <aside
        aria-label={copy.title}
        aria-modal="true"
        className={styles.panel}
        data-state={panelStateText(outcome)}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h2 ref={headingRef} tabIndex={-1}>
              {copy.title}
            </h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            {copy.close}
          </button>
        </header>
        <section className={styles.stateMessage} data-tone="CAUTION">
          <strong>{message}</strong>
          <span>{copy.unavailable}</span>
          <small>{outcome.requestId}</small>
        </section>
      </aside>
    </div>
  );
}

function SourceCard({
  source,
  mode,
  copy,
  onNavigate,
}: Readonly<{
  source: EvidencePanelSourceView;
  mode: EvidencePanelView["mode"];
  copy: ReturnType<typeof getEvidencePanelCopy>;
  onNavigate: (selection: EvidencePanelSelection) => void;
}>) {
  return (
    <article className={styles.sourceCard} data-source-key={source.sourceKey}>
      <header className={styles.sourceHeader}>
        <div>
          <p className={styles.sourceType}>{source.objectTypeLabel}</p>
          <h4>{source.title}</h4>
        </div>
        <div className={styles.badgeStack}>
          <span className={styles.badge}>{source.authorityLabel}</span>
          {source.observationTypeLabel ? (
            <span className={styles.badge}>{source.observationTypeLabel}</span>
          ) : null}
        </div>
      </header>

      <dl className={styles.definitionGrid}>
        {source.projectLabel ? (
          <div>
            <dt>{copy.project}</dt>
            <dd>{source.projectLabel}</dd>
          </div>
        ) : null}
        {source.versionLabel ? (
          <div>
            <dt>{copy.version}</dt>
            <dd>{source.versionLabel}</dd>
          </div>
        ) : null}
        {source.effectiveDateLabel ? (
          <div>
            <dt>{copy.effectiveDate}</dt>
            <dd>{source.effectiveDateLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt>{copy.locator}</dt>
          <dd>{source.locatorLabel}</dd>
        </div>
        <div>
          <dt>{copy.classification}</dt>
          <dd>{source.dataClassificationLabel}</dd>
        </div>
        {source.supportedValueLabel ? (
          <div>
            <dt>{copy.supportedValue}</dt>
            <dd>{source.supportedValueLabel}</dd>
          </div>
        ) : null}
      </dl>

      <div className={styles.conditionRow} aria-label={copy.authority}>
        {source.conditionLabels.map((label) => (
          <span className={styles.condition} key={label}>
            {label}
          </span>
        ))}
      </div>

      <section className={styles.preview}>
        <h5>{copy.preview}</h5>
        {source.preview.state === "STRUCTURED" ? (
          <dl className={styles.previewGrid}>
            {source.preview.fields.map((field) => (
              <div key={`${field.label}-${field.value}`}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{source.preview.message}</p>
        )}
      </section>

      <footer className={styles.sourceActions}>
        {mode !== "SOURCE" ? (
          <button type="button" onClick={() => onNavigate(source.sourceSelection)}>
            {copy.inspectSource}
          </button>
        ) : null}
        {source.conflictKeys.map((conflictKey) => (
          <button
            key={conflictKey}
            type="button"
            onClick={() =>
              onNavigate({
                mode: "CONFLICT",
                comparisonRunId: source.sourceSelection.comparisonRunId,
                ...(source.sourceSelection.mode === "SOURCE" &&
                source.sourceSelection.enrichmentRunId
                  ? { enrichmentRunId: source.sourceSelection.enrichmentRunId }
                  : {}),
                conflictKey,
                sourceKey: source.sourceKey,
                ...(source.sourceSelection.mode === "SOURCE" && source.sourceSelection.claimKey
                  ? { claimKey: source.sourceSelection.claimKey }
                  : {}),
                ...(source.sourceSelection.mode === "SOURCE" &&
                source.sourceSelection.candidateProjectKey
                  ? { candidateProjectKey: source.sourceSelection.candidateProjectKey }
                  : {}),
                ...(source.sourceSelection.mode === "SOURCE" && source.sourceSelection.factorKey
                  ? { factorKey: source.sourceSelection.factorKey }
                  : {}),
              })
            }
          >
            {copy.inspectConflict}
          </button>
        ))}
      </footer>
    </article>
  );
}

function Trace({ view }: Readonly<{ view: EvidencePanelView }>) {
  const copy = getEvidencePanelCopy(view.locale);
  const trace = view.trace;
  if (!trace) return null;
  if (trace.kind === "FACTOR") {
    return (
      <section className={styles.traceSection} aria-labelledby="evidence-factor-trace-title">
        <h3 id="evidence-factor-trace-title">{copy.calculation}</h3>
        <dl className={styles.traceGrid}>
          <div>
            <dt>{copy.fields.state}</dt>
            <dd>{trace.stateLabel}</dd>
          </div>
          <div>
            <dt>{copy.fields.normalized}</dt>
            <dd>{trace.normalizedValueLabel ?? "—"}</dd>
          </div>
          <div>
            <dt>{copy.fields.weight}</dt>
            <dd>{trace.weightLabel}</dd>
          </div>
          <div>
            <dt>{copy.fields.contribution}</dt>
            <dd>{trace.contributionLabel ?? "0"}</dd>
          </div>
          <div>
            <dt>{copy.fields.score}</dt>
            <dd>{trace.totalScoreLabel}</dd>
          </div>
          <div>
            <dt>{copy.fields.coverage}</dt>
            <dd>{trace.evidenceCoverageLabel}</dd>
          </div>
        </dl>
        <p className={styles.traceExplanation}>{trace.explanationLabel}</p>
        <small>{trace.policyVersion}</small>
      </section>
    );
  }
  return (
    <section className={styles.traceSection} aria-labelledby="evidence-financial-trace-title">
      <h3 id="evidence-financial-trace-title">{copy.calculation}</h3>
      <dl className={styles.traceGrid}>
        <div>
          <dt>{copy.fields.operation}</dt>
          <dd>{trace.operation}</dd>
        </div>
        <div>
          <dt>{copy.fields.aggregation}</dt>
          <dd>{trace.aggregation}</dd>
        </div>
        <div>
          <dt>{copy.fields.rounding}</dt>
          <dd>{trace.rounding}</dd>
        </div>
        <div>
          <dt>{copy.fields.generated}</dt>
          <dd>{trace.generatedAtLabel}</dd>
        </div>
      </dl>
      <div className={styles.traceInputs}>
        {trace.inputs.map((input) => (
          <div key={`${input.projectKey}-${input.normalizedValueLabel}`}>
            <strong>{input.projectKey}</strong>
            <span>{input.normalizedValueLabel}</span>
            <small>{input.sourceCount} source(s)</small>
          </div>
        ))}
      </div>
      <dl className={styles.previewGrid}>
        {trace.resultFields.map((field) => (
          <div key={`${field.label}-${field.value}`}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
      <small>{trace.calculationVersion}</small>
    </section>
  );
}

function ReadyPanel({
  view,
  onClose,
  onNavigate,
}: Readonly<{
  view: EvidencePanelView;
  onClose: () => void;
  onNavigate: (selection: EvidencePanelSelection) => void;
}>) {
  const copy = getEvidencePanelCopy(view.locale);
  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <aside
        aria-labelledby="evidence-panel-title"
        aria-modal="true"
        className={styles.panel}
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{view.heading.eyebrow}</p>
            <h2 id="evidence-panel-title" ref={headingRef} tabIndex={-1}>
              {view.heading.title}
            </h2>
            <p>{view.heading.description}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            {copy.close}
          </button>
        </header>

        <div className={styles.contextBar}>
          <strong>{view.context.projectName}</strong>
          <span>{view.context.snapshotLabel}</span>
          <code>{view.context.comparisonRunId}</code>
        </div>

        {view.backSelection ? (
          <button
            className={styles.backButton}
            type="button"
            onClick={() => onNavigate(view.backSelection!)}
          >
            {copy.back}
          </button>
        ) : null}

        {view.claim ? (
          <section className={styles.claimSummary}>
            <p className={styles.eyebrow}>{view.claim.kindLabel}</p>
            {view.claim.valueLabel ? <strong>{view.claim.valueLabel}</strong> : null}
            <div className={styles.conditionRow}>
              {view.claim.observationTypeLabel ? (
                <span>{view.claim.observationTypeLabel}</span>
              ) : null}
              {view.claim.authorityLabel ? <span>{view.claim.authorityLabel}</span> : null}
              {view.claim.sufficiencyLabel ? <span>{view.claim.sufficiencyLabel}</span> : null}
            </div>
            {view.claim.warningLabels.map((warning) => (
              <p className={styles.warning} key={warning}>
                {warning}
              </p>
            ))}
          </section>
        ) : null}

        {view.notices.map((notice) => (
          <div className={styles.notice} data-tone={notice.tone} key={notice.text} role="status">
            {notice.text}
          </div>
        ))}

        <Trace view={view} />

        {view.relatedClaims?.length ? (
          <section className={styles.relatedClaims}>
            <h3>{copy.relatedClaims}</h3>
            <ul>
              {view.relatedClaims.map((claim) => (
                <li key={claim.claimKey}>
                  <strong>{claim.title}</strong>
                  <span>{claim.kindLabel}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {view.conflict ? (
          <section className={styles.conflictSection}>
            <h3>{copy.conflicts}</h3>
            <dl className={styles.traceGrid}>
              <div>
                <dt>{copy.conflictStatus}</dt>
                <dd>{view.conflict.statusLabel}</dd>
              </div>
              <div>
                <dt>{copy.conflictImpact}</dt>
                <dd>{view.conflict.impactLabel}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section className={styles.sourcesSection} aria-labelledby="evidence-sources-title">
          <h3 id="evidence-sources-title">{copy.sourceList}</h3>
          {view.sources.length > 0 ? (
            <div className={styles.sourceList}>
              {view.sources.map((source) => (
                <SourceCard
                  key={source.sourceKey}
                  source={source}
                  mode={view.mode}
                  copy={copy}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : (
            <p>{copy.noSources}</p>
          )}
        </section>
      </aside>
    </div>
  );
}

export function EvidencePanel({ outcome, locale, onClose, onNavigate }: EvidencePanelProps) {
  return outcome.kind === "READY" ? (
    <ReadyPanel view={outcome.view} onClose={onClose} onNavigate={onNavigate} />
  ) : (
    <StatePanel outcome={outcome} onClose={onClose} locale={locale} />
  );
}
