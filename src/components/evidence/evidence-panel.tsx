"use client";

import { StaleComparisonNotice } from "@/components/comparisons/stale-comparison-notice";
import { useCallback, useRef, type ReactNode } from "react";
import { useModalFocus } from "@/components/accessibility/use-modal-focus";
import { evidenceSelectionParams } from "@/modules/evidence-panel/route-state";

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
  selection?: EvidencePanelSelection | null | undefined;
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

function selectionKey(selection: EvidencePanelSelection): string {
  return JSON.stringify([
    selection.comparisonRunId,
    Object.entries(evidenceSelectionParams(selection)).sort(([a], [b]) => a.localeCompare(b)),
  ]);
}

// Route selectors only: returning to a parent always requests fresh server authorization.
function parentSelection(selection: EvidencePanelSelection | null | undefined) {
  if (!selection || (selection.mode !== "SOURCE" && selection.mode !== "CONFLICT")) return null;
  if (selection.mode === "CONFLICT" && selection.sourceKey) {
    return {
      mode: "SOURCE" as const,
      comparisonRunId: selection.comparisonRunId,
      sourceKey: selection.sourceKey,
      enrichmentRunId: selection.enrichmentRunId,
      claimKey: selection.claimKey,
      candidateProjectKey: selection.candidateProjectKey,
      factorKey: selection.factorKey,
    };
  }
  if (selection.claimKey && selection.enrichmentRunId) {
    return {
      mode: "CLAIM" as const,
      comparisonRunId: selection.comparisonRunId,
      enrichmentRunId: selection.enrichmentRunId,
      claimKey: selection.claimKey,
    };
  }
  if (selection.candidateProjectKey && selection.factorKey) {
    return {
      mode: "FACTOR" as const,
      comparisonRunId: selection.comparisonRunId,
      candidateProjectKey: selection.candidateProjectKey,
      factorKey: selection.factorKey,
    };
  }
  return null;
}

function PanelFrame({
  locale,
  heading,
  focusKey,
  state,
  onClose,
  hasParent,
  resolveInitialFocus,
  children,
}: Readonly<{
  locale: Locale;
  heading: EvidencePanelView["heading"];
  focusKey: string;
  state?: string | undefined;
  onClose: () => void;
  hasParent: boolean;
  resolveInitialFocus: (panel: HTMLElement) => HTMLElement | null;
  children: ReactNode;
}>) {
  const copy = getEvidencePanelCopy(locale);
  const { panelRef, headingRef } = useModalFocus({ focusKey, onClose, resolveInitialFocus });
  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <aside
        aria-labelledby="evidence-panel-title"
        aria-modal="true"
        className={styles.panel}
        data-state={state}
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{heading.eyebrow}</p>
            <h2 id="evidence-panel-title" ref={headingRef} tabIndex={-1}>
              {heading.title}
            </h2>
            {heading.description ? <p>{heading.description}</p> : null}
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            {hasParent ? copy.back : copy.close}
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

function StateContent({
  outcome,
  locale,
}: Readonly<{
  outcome: Exclude<EvidencePanelOutcome, { kind: "READY" }>;
  locale: Locale;
}>) {
  const copy = getEvidencePanelCopy(locale);
  const message =
    outcome.kind === "ACCESS_CHANGED"
      ? copy.accessChanged
      : outcome.kind === "RESTRICTED"
        ? copy.restricted
        : copy.unavailable;
  return (
    <section className={styles.stateMessage} data-tone="CAUTION">
      <strong>{message}</strong>
      <span>{copy.unavailable}</span>
      <small>{outcome.requestId}</small>
    </section>
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
          <button
            type="button"
            data-panel-trigger={selectionKey(source.sourceSelection)}
            onClick={() => onNavigate(source.sourceSelection)}
          >
            {copy.inspectSource}
          </button>
        ) : null}
        {source.conflictKeys.map((conflictKey) => {
          const selection: EvidencePanelSelection = {
            ...source.sourceSelection,
            mode: "CONFLICT",
            conflictKey,
            sourceKey: source.sourceKey,
          };
          return (
            <button
              key={conflictKey}
              type="button"
              data-panel-trigger={selectionKey(selection)}
              onClick={() => onNavigate(selection)}
            >
              {copy.inspectConflict}
            </button>
          );
        })}
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
        <small>{trace.policyDescription}</small>
      </section>
    );
  }
  return (
    <section className={styles.traceSection} aria-labelledby="evidence-financial-trace-title">
      <h3 id="evidence-financial-trace-title">{copy.calculation}</h3>
      <dl className={styles.traceGrid}>
        <div>
          <dt>{copy.fields.operation}</dt>
          <dd>{trace.operationLabel}</dd>
        </div>
        <div>
          <dt>{copy.fields.aggregation}</dt>
          <dd>{trace.aggregationLabel}</dd>
        </div>
        <div>
          <dt>{copy.fields.rounding}</dt>
          <dd>{trace.roundingLabel}</dd>
        </div>
        <div>
          <dt>{copy.fields.generated}</dt>
          <dd>{trace.generatedAtLabel}</dd>
        </div>
      </dl>
      <div className={styles.traceInputs}>
        {trace.inputs.map((input) => (
          <div key={`${input.projectKey}-${input.normalizedValueLabel}`}>
            <strong>{input.projectLabel}</strong>
            {input.observationLabel ? <span>{input.observationLabel}</span> : null}
            <span>{input.normalizedValueLabel}</span>
            <small>{input.sourceCountLabel}</small>
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
      <small>{trace.policyDescription}</small>
    </section>
  );
}

function ReadyContent({
  view,
  onBack,
  onNavigate,
}: Readonly<{
  view: EvidencePanelView;
  onBack: () => void;
  onNavigate: (selection: EvidencePanelSelection) => void;
}>) {
  const copy = getEvidencePanelCopy(view.locale);
  return (
    <>
      <div className={styles.contextBar} data-comparison-run-id={view.context.comparisonRunId}>
        <strong>{view.context.projectName}</strong>
        <span>{view.context.snapshotLabel}</span>
      </div>

      <StaleComparisonNotice
        freshness={view.context.freshness}
        locale={view.locale}
        projectKey={view.context.projectKey}
      />

      {view.backSelection ? (
        <button className={styles.backButton} type="button" onClick={onBack}>
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
    </>
  );
}

export function EvidencePanel({
  outcome,
  selection,
  locale,
  onClose,
  onNavigate,
}: EvidencePanelProps) {
  const trail = useRef<Array<{ parent: EvidencePanelSelection; childKey: string }>>([]);
  const returnTo = useRef<{ key: string; trigger: string } | null>(null);
  const key = selection
    ? selectionKey(selection)
    : JSON.stringify(
        outcome.kind === "READY"
          ? [outcome.view.mode, outcome.view.selectedSourceKey, outcome.view.claim?.claimKey]
          : outcome.kind,
      );
  const parent =
    parentSelection(selection) ?? (outcome.kind === "READY" ? outcome.view.backSelection : null);

  const navigate = useCallback(
    (next: EvidencePanelSelection) => {
      const nextKey = selectionKey(next);
      const ancestor = trail.current.findLastIndex((step) => selectionKey(step.parent) === nextKey);
      if (ancestor >= 0) {
        returnTo.current = { key: nextKey, trigger: trail.current[ancestor]!.childKey };
        trail.current = trail.current.slice(0, ancestor);
      } else {
        const current = trail.current.findLastIndex((step) => step.childKey === key);
        trail.current = trail.current.slice(0, current + 1);
        if (selection) trail.current.push({ parent: selection, childKey: nextKey });
        returnTo.current = null;
      }
      onNavigate(next);
    },
    [key, selection, onNavigate],
  );

  const closeLayer = useCallback(() => {
    const step = trail.current.findLast((entry) => entry.childKey === key);
    const destination = step?.parent ?? parent;
    if (!destination) {
      onClose();
      return;
    }
    returnTo.current = { key: selectionKey(destination), trigger: key };
    const index = trail.current.findLastIndex((entry) => entry.childKey === key);
    if (index >= 0) trail.current = trail.current.slice(0, index);
    onNavigate(destination);
  }, [key, parent, onClose, onNavigate]);

  const resolveInitialFocus = useCallback(
    (panel: HTMLElement) => {
      if (returnTo.current?.key !== key) return null;
      return (
        [...panel.querySelectorAll<HTMLElement>("[data-panel-trigger]")].find(
          (element) => element.dataset.panelTrigger === returnTo.current?.trigger,
        ) ?? null
      );
    },
    [key],
  );
  const copy = getEvidencePanelCopy(locale);
  return (
    <PanelFrame
      locale={locale}
      heading={
        outcome.kind === "READY"
          ? outcome.view.heading
          : { eyebrow: copy.eyebrow, title: copy.title, description: "" }
      }
      focusKey={`${locale}:${key}:${outcome.kind}`}
      state={outcome.kind === "READY" ? undefined : panelStateText(outcome)}
      onClose={closeLayer}
      hasParent={!!parent}
      resolveInitialFocus={resolveInitialFocus}
    >
      {outcome.kind === "READY" ? (
        <ReadyContent view={outcome.view} onBack={closeLayer} onNavigate={navigate} />
      ) : (
        <StateContent outcome={outcome} locale={locale} />
      )}
    </PanelFrame>
  );
}
