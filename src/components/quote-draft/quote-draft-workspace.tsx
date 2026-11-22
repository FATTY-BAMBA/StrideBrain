"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  prepareQuoteDraftAction,
  saveQuoteDraftAction,
  previewQuoteTotalsAction,
  quoteDraftEvidenceAction,
} from "@/app/[locale]/projects/[projectKey]/quote/actions";
import { updateProjectStageAction } from "@/app/[locale]/projects/actions";
import { EvidencePanel } from "@/components/evidence/evidence-panel";
import type {
  EvidencePanelOutcome,
  EvidencePanelSelection,
} from "@/modules/evidence-panel/contracts";
import type { QuoteDraftView } from "@/modules/quote-draft/application/get-quote-draft";
import { draftCoverage, type DraftBasis } from "@/modules/quote-draft/domain/draft-policy";
import { DRAFT_AMOUNT } from "@/modules/quote-draft/domain/save-input";
import { formatQuoteArea, formatQuoteRate } from "@/modules/quote-draft/presentation";
import type { QuoteTotals } from "@/modules/finance/quote-totals";
import { formatMoney } from "@/modules/finance/format-money";
import type { Locale } from "@/modules/localization/config";
import { categoryLabel } from "@/modules/localization/jobs";
import { quoteDraftCopy, quoteTemplate as text } from "@/modules/localization/quote-draft";
import styles from "./quote-draft-workspace.module.css";

type Available = Extract<QuoteDraftView, { kind: "AVAILABLE" }>;
type Row = {
  categoryId: string;
  description: string;
  amount: string;
  basis: DraftBasis | null;
  unavailable: boolean;
  outdated: boolean;
};
function savedRows(view: Available, locale: Locale): Row[] {
  if (!view.saved) return [];
  if (!view.canDraft || view.saved.status !== "DRAFT")
    return view.saved.lines.map((line) => ({
      categoryId: line.categoryId,
      description: line.description,
      amount: line.amount,
      basis: line.recorded?.basis ?? null,
      unavailable: line.basisUnavailable,
      outdated: line.basisOutOfDate,
    }));
  const ids = [
    ...new Set([
      ...view.job.commercialCategoryIds,
      ...view.saved.lines.map((line) => line.categoryId),
    ]),
  ].sort();
  return ids.map((categoryId) => {
    const line = view.saved!.lines.find((entry) => entry.categoryId === categoryId);
    return {
      categoryId,
      description: line?.description ?? categoryLabel(locale, categoryId),
      amount: line?.amount ?? "",
      basis: line?.recorded?.basis ?? null,
      unavailable: line?.basisUnavailable ?? false,
      outdated: line?.basisOutOfDate ?? false,
    };
  });
}
export function QuoteDraftWorkspace({ initial, locale }: { initial: Available; locale: Locale }) {
  const copy = quoteDraftCopy(locale),
    [view, setView] = useState(initial),
    [rows, setRows] = useState(() => savedRows(initial, locale));
  const [token, setToken] = useState<string | null>(null),
    [idempotencyKey, setKey] = useState(() => crypto.randomUUID());
  const [totals, setTotals] = useState<QuoteTotals | null>(initial.saved?.totals ?? null);
  const [message, setMessage] = useState<string | null>(null),
    [compareNeeded, setCompareNeeded] = useState(false);
  const [pending, startTransition] = useTransition(),
    [firstSave, setFirstSave] = useState(false),
    [moved, setMoved] = useState(false);
  const [evidence, setEvidence] = useState<{
    categoryId: string;
    outcome: EvidencePanelOutcome;
    selection?: EvidencePanelSelection;
  } | null>(null);
  const editable = view.canDraft && (!view.saved || view.saved.status === "DRAFT");
  const compareHref =
    `/${locale}/projects/${encodeURIComponent(view.job.businessKey)}/compare` as Route;
  const payload = {
    projectKey: view.job.businessKey,
    idempotencyKey,
    baseVersionId: view.saved?.id ?? null,
    preparationToken: token,
    lines: rows.map(({ categoryId, description, amount }) => ({ categoryId, description, amount })),
  };
  const serialized = JSON.stringify(payload);
  useEffect(() => {
    if (!editable || !rows.length) return;
    let active = true;
    const timer = setTimeout(() => {
      void previewQuoteTotalsAction(locale, JSON.parse(serialized)).then((value) => {
        if (active) setTotals(value);
      });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [serialized, locale, editable, rows.length]);
  function update(categoryId: string, patch: Partial<Pick<Row, "description" | "amount">>) {
    setRows((current) =>
      current.map((row) => (row.categoryId === categoryId ? { ...row, ...patch } : row)),
    );
    setTotals(null);
  }
  function prepare() {
    startTransition(async () => {
      setMessage(null);
      const result = await prepareQuoteDraftAction(locale, view.job.businessKey);
      if (result.kind !== "PREPARED") {
        setMessage(copy[result.kind]);
        setCompareNeeded(["NO_COMPARISON", "OUT_OF_DATE"].includes(result.kind));
        return;
      }
      setToken(result.token);
      setCompareNeeded(false);
      setTotals(null);
      setRows((current) => {
        const ids = [
          ...new Set([
            ...current.map((row) => row.categoryId),
            ...result.preparation.suggestions.map((line) => line.categoryId),
          ]),
        ].sort();
        return ids.map((categoryId) => {
          const old = current.find((row) => row.categoryId === categoryId),
            fresh = result.preparation.suggestions.find((line) => line.categoryId === categoryId);
          return {
            categoryId,
            description: old?.description ?? categoryLabel(locale, categoryId),
            amount: old?.amount ?? fresh?.basis.suggestedAmount ?? "",
            basis: fresh?.basis ?? old?.basis ?? null,
            unavailable: fresh ? false : (old?.unavailable ?? false),
            outdated: fresh ? false : (old?.outdated ?? false),
          };
        });
      });
    });
  }
  function save() {
    startTransition(async () => {
      const { result, view: next } = await saveQuoteDraftAction(locale, payload);
      if (result.kind !== "SAVED") {
        setMessage(copy[result.kind]);
        setCompareNeeded(["NO_COMPARISON", "OUT_OF_DATE"].includes(result.kind));
        return;
      }
      setMessage(text(copy.saved, { version: result.versionNumber }));
      setCompareNeeded(true);
      setFirstSave(result.firstSave);
      setToken(null);
      setKey(crypto.randomUUID());
      setTotals(result.totals);
      if (next?.kind === "AVAILABLE") {
        setView(next);
        setRows(savedRows(next, locale));
      }
    });
  }
  function sources(categoryId: string, selection?: EvidencePanelSelection) {
    startTransition(async () => {
      const outcome = await quoteDraftEvidenceAction(locale, {
        projectKey: view.job.businessKey,
        categoryId,
        preparationToken: token,
        selection,
      });
      setEvidence({ categoryId, outcome, ...(selection ? { selection } : {}) });
    });
  }
  function move() {
    startTransition(async () => {
      const form = new FormData();
      for (const [key, value] of Object.entries({
        locale,
        businessKey: view.job.businessKey,
        expectedStage: view.job.stage,
        stage: "QUOTE_REVIEW",
        idempotencyKey: crypto.randomUUID(),
      }))
        form.set(key, value);
      const result = await updateProjectStageAction({}, form);
      if (result.message === "updated") {
        setMoved(true);
        setMessage(copy.moved);
      } else setMessage(copy.UNAVAILABLE);
    });
  }
  return (
    <section className={styles.workspace} aria-busy={pending}>
      <header className={styles.heading}>
        <div>
          <h1>{copy.title}</h1>
          <p>{view.job.name}</p>
          {view.saved ? (
            <p>
              {view.saved.status === "DRAFT"
                ? text(copy.version, { version: view.saved.versionNumber })
                : copy.readOnly}
            </p>
          ) : null}
        </div>
        {editable && rows.length > 0 ? (
          <button className={styles.button} disabled={pending} onClick={prepare}>
            {copy.refresh}
          </button>
        ) : null}
      </header>
      {message ? (
        <div className={styles.notice} role="status">
          {message}
          {compareNeeded ? (
            <p>
              <Link href={compareHref}>{copy.compare}</Link>
            </p>
          ) : null}
        </div>
      ) : null}
      {!view.canReadAmounts ? (
        <p>{copy.restricted}</p>
      ) : (
        <>
          {!rows.length ? (
            <div className={styles.row}>
              <p>{copy.noQuote}</p>
              {editable ? (
                <button
                  className={`${styles.button} ${styles.primary}`}
                  disabled={pending}
                  onClick={prepare}
                >
                  {pending ? copy.pending : copy.draft}
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {editable ? <p>{copy.refreshHint}</p> : null}
              {rows.map((row, index) => {
                const rowKey = editable ? row.categoryId : `${row.categoryId}-${index}`;
                const basis = row.basis,
                  unit = basis?.areaUnit === "m2" ? "m²" : (basis?.areaUnit ?? view.job.areaUnit);
                const coverage = basis
                  ? draftCoverage(row.categoryId, basis.scopeCategoryIds)
                  : null;
                return (
                  <section
                    className={styles.row}
                    key={rowKey}
                    aria-labelledby={`category-${rowKey}`}
                  >
                    <h2 id={`category-${rowKey}`}>{categoryLabel(locale, row.categoryId)}</h2>
                    <div className={styles.fields}>
                      <label>
                        {copy.description}
                        <input
                          aria-label={`${categoryLabel(locale, row.categoryId)} ${copy.description}`}
                          value={row.description}
                          maxLength={500}
                          disabled={!editable || pending}
                          onChange={(event) =>
                            update(row.categoryId, { description: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        {copy.amount}
                        <input
                          aria-label={`${categoryLabel(locale, row.categoryId)} ${copy.amount}`}
                          value={row.amount}
                          inputMode="decimal"
                          maxLength={17}
                          disabled={!editable || pending}
                          onChange={(event) =>
                            update(row.categoryId, { amount: event.target.value })
                          }
                        />
                        <span aria-live="polite">
                          {DRAFT_AMOUNT.test(row.amount)
                            ? formatMoney(row.amount, view.job.currency)
                            : ""}
                        </span>
                      </label>
                    </div>
                    <div className={styles.basis}>
                      {row.unavailable ? (
                        <p>{copy.unavailableBasis}</p>
                      ) : basis ? (
                        <>
                          <p className={styles.date}>
                            {text(copy.calculated, { date: basis.calculatedAt.slice(0, 10) })}
                          </p>
                          {row.outdated ? <p className={styles.notice}>{copy.stale}</p> : null}
                          {basis.suggestedAmount !== undefined ? (
                            <>
                              <p>
                                <strong>
                                  {copy.suggestion}:{" "}
                                  {formatMoney(basis.suggestedAmount, view.job.currency)}
                                </strong>
                                {editable && !row.outdated ? (
                                  <button
                                    className={styles.button}
                                    disabled={pending}
                                    onClick={() =>
                                      update(row.categoryId, { amount: basis.suggestedAmount! })
                                    }
                                  >
                                    {copy.use}
                                  </button>
                                ) : null}
                              </p>
                            </>
                          ) : null}
                          {coverage?.partial && !row.outdated ? (
                            <p>
                              {text(copy.partial, {
                                all: new Intl.ListFormat(locale, {
                                  style: "long",
                                  type: "conjunction",
                                }).format(coverage.all.map((id) => categoryLabel(locale, id))),
                                included: new Intl.ListFormat(locale, {
                                  style: "long",
                                  type: "conjunction",
                                }).format(coverage.included.map((id) => categoryLabel(locale, id))),
                              })}
                            </p>
                          ) : null}
                          {basis.medianRate !== undefined ? (
                            <>
                              <p>
                                {text(coverage?.partial ? copy.reference : copy.basis, {
                                  n: basis.count,
                                  rate: formatQuoteRate(basis.medianRate, view.job.currency),
                                  unit,
                                  area: formatQuoteArea(basis.area),
                                })}
                              </p>
                              <p>
                                {text(copy.range, {
                                  low: formatQuoteRate(basis.lowRate!, view.job.currency),
                                  high: formatQuoteRate(basis.highRate!, view.job.currency),
                                  unit,
                                })}
                              </p>
                            </>
                          ) : (
                            <p>
                              {text(copy.few, { n: basis.count, required: basis.requiredCount })}
                            </p>
                          )}
                          {basis.actualExceeded ? (
                            <p>
                              {text(copy.exceeded, {
                                k: basis.actualExceeded.count,
                                n: basis.actualExceeded.selectedCount,
                              })}
                            </p>
                          ) : null}
                          {basis.conflictEvidenceIds.length > 0 ? <p>{copy.conflict}</p> : null}
                          {basis.evidenceReferenceIds.length + basis.conflictEvidenceIds.length >
                          0 ? (
                            <button
                              className={styles.button}
                              disabled={pending}
                              onClick={() => sources(row.categoryId)}
                            >
                              {copy.sources}
                            </button>
                          ) : null}
                        </>
                      ) : editable ? (
                        <p>{copy.manual}</p>
                      ) : null}
                    </div>
                  </section>
                );
              })}
              {totals ? (
                <dl className={styles.totals} aria-live="polite">
                  <div>
                    <dt>{copy.beforeTax}</dt>
                    <dd>{formatMoney(totals.amountBeforeTax, view.job.currency)}</dd>
                  </div>
                  <div>
                    <dt>{copy.tax}</dt>
                    <dd>{formatMoney(totals.taxAmount, view.job.currency)}</dd>
                  </div>
                  <div>
                    <dt>{copy.total}</dt>
                    <dd>{formatMoney(totals.totalAmount, view.job.currency)}</dd>
                  </div>
                </dl>
              ) : (
                <p role="status">{copy.incomplete}</p>
              )}
              <div className={styles.toolbar}>
                {editable ? (
                  <button
                    className={`${styles.button} ${styles.primary}`}
                    disabled={pending || !totals}
                    onClick={save}
                  >
                    {pending ? copy.pending : copy.save}
                  </button>
                ) : null}
                {view.saved ? <Link href={compareHref}>{copy.compare}</Link> : null}
                {firstSave && !moved && ["DISCOVERY", "DESIGN"].includes(view.job.stage) ? (
                  <button className={styles.button} disabled={pending} onClick={move}>
                    {copy.move}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </>
      )}
      {evidence ? (
        <>
          <button className={styles.button} onClick={() => sources(evidence.categoryId)}>
            {copy.backSources}
          </button>
          <EvidencePanel
            locale={locale}
            outcome={evidence.outcome}
            selection={evidence.selection}
            onClose={() => setEvidence(null)}
            onNavigate={(selection) => sources(evidence.categoryId, selection)}
          />
        </>
      ) : null}
    </section>
  );
}
