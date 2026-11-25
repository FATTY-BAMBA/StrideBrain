"use client";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useReportQuoteUnsavedChanges } from "@/components/assistant/job-chat-state";
import { useRouter } from "next/navigation";
import {
  prepareQuoteDraftAction,
  previewQuoteTotalsAction,
  saveQuoteDraftAction,
  quoteDraftEvidenceAction,
} from "@/app/[locale]/projects/[projectKey]/quote/actions";
import { updateProjectStageAction } from "@/app/[locale]/projects/actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Paper } from "@/components/ui/paper";
import { Notice } from "@/components/ui/notice";
import { QUOTE_LIST_STATUSES, type QuoteListStatus } from "@/modules/quotes/domain/quote-list";
import { Badge } from "@/components/ui/badge";
import { EvidencePanel } from "@/components/evidence/evidence-panel";
import { QuoteIssuePanel, type IssueView } from "@/components/quote-issue/quote-issue-panel";
import type {
  EvidencePanelOutcome,
  EvidencePanelSelection,
} from "@/modules/evidence-panel/contracts";
import type { QuoteDraftView } from "@/modules/quote-draft/application/get-quote-draft";
import type { PrepareDraftOutcome } from "@/modules/quote-draft/application/prepare-quote-draft";
import type {
  QuoteDocumentDraft,
  QuoteDocumentLine,
  QuoteDocumentSection,
} from "@/modules/quote-draft/domain/document-input";
import type { DraftBasis } from "@/modules/quote-draft/domain/draft-policy";
import type { QuoteDocumentAmounts } from "@/modules/finance/quote-totals";
import type { Locale } from "@/modules/localization/config";
import { formatMoney } from "@/modules/finance/format-money";
import { quoteDraftCopy, quoteTemplate } from "@/modules/localization/quote-draft";
import { quoteIssueCopy } from "@/modules/localization/quote-issue";
import { quoteDocumentCopy } from "@/modules/localization/quote-document";
import { categoryLabel } from "@/modules/localization/jobs";
import { QuoteItemDescription } from "@/components/price-list/quote-item-description";
import { QuoteComparisonPanel } from "./quote-comparison-panel";
import { CategoryReference } from "./category-reference";
import ui from "@/components/ui/ui.module.css";
import styles from "./quote-document.module.css";
type Available = Extract<QuoteDraftView, { kind: "AVAILABLE" }>;
type Reference = {
  categoryId: string;
  basis: DraftBasis | null;
  unavailable: boolean;
  outdated: boolean;
};
function references(view: Available): Reference[] {
  return [
    ...new Set([
      ...view.job.commercialCategoryIds,
      ...(view.saved?.lines.map((line) => line.categoryId).filter(Boolean) ?? []),
    ]),
  ].map((categoryId) => {
    const line = view.saved?.lines.find(
      (item) => item.categoryId === categoryId && (item.recorded || item.basisUnavailable),
    );
    return {
      categoryId,
      basis: line?.recorded?.basis ?? null,
      unavailable: line?.basisUnavailable ?? false,
      outdated: line?.basisOutOfDate ?? false,
    };
  });
}
function newSection(): QuoteDocumentSection {
  return { id: crypto.randomUUID(), title: "", categoryId: null, lines: [] };
}
function documentFor(view: Available): QuoteDocumentDraft {
  return view.saved?.document
    ? { sections: view.saved.document.sections, discount: view.saved.document.discount }
    : {
        sections: [newSection()],
        discount: { label: "", amount: "0" },
      };
}
export function QuoteDocumentEditor({
  initial,
  issue,
  locale,
  preparation,
}: {
  initial: Available;
  issue: IssueView | null;
  locale: Locale;
  preparation?: Extract<PrepareDraftOutcome, { kind: "PREPARED" }> | null;
}) {
  const copy = quoteDocumentCopy(locale),
    draftCopy = quoteDraftCopy(locale),
    issueCopy = quoteIssueCopy(locale),
    router = useRouter();
  const workspaceRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const paper = workspace.querySelector("article");
      if (paper)
        workspace.style.setProperty(
          "--document-top",
          `${paper.getBoundingClientRect().top + window.scrollY}px`,
        );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(workspace);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const [view, setView] = useState(initial),
    [document, setDocument] = useState(() => documentFor(initial));
  const [savedDocument, setSavedDocument] = useState(() => JSON.stringify(document));
  const [calculated, setCalculated] = useState<QuoteDocumentAmounts | null>(
    initial.saved?.document ?? null,
  );
  const [categoryTotals, setCategoryTotals] = useState(initial.categoryTotals ?? []);
  const [referenceRows, setReferences] = useState(() =>
    preparation
      ? preparation.preparation.suggestions.map((suggestion) => ({
          ...suggestion,
          unavailable: false,
          outdated: false,
        }))
      : references(initial),
  );
  const [token, setToken] = useState<string | null>(preparation?.token ?? null),
    [key, setKey] = useState(() => crypto.randomUUID());
  const [firstSave, setFirstSave] = useState(false),
    [moved, setMoved] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [validUntil, setValidUntil] = useState(issue?.defaults.validUntil);
  const issueKey = `${issue?.versionId}:${issue?.status}`;
  const [selectedLanguage, setSelectedLanguage] = useState<{
    issueKey: string;
    language: Locale;
  } | null>(null);
  const documentLanguage =
    selectedLanguage?.issueKey === issueKey
      ? selectedLanguage.language
      : (issue?.defaults.language ?? locale);
  const [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  const [evidence, setEvidence] = useState<{
    categoryId: string;
    outcome: EvidencePanelOutcome;
    selection?: EvidencePanelSelection;
  } | null>(null);
  const serialized = JSON.stringify(document),
    dirty = serialized !== savedDocument;
  useReportQuoteUnsavedChanges(dirty);
  const editable = view.canDraft && initial.canDraft;
  const currentVersion = view.saved?.id ?? null;
  const receivePreparation = useCallback(
    (result: Extract<PrepareDraftOutcome, { kind: "PREPARED" }>) => {
      if (result.preparation.baseVersionId !== currentVersion) return;
      setToken(result.token);
      setReferences(
        result.preparation.suggestions.map((suggestion) => ({
          ...suggestion,
          unavailable: false,
          outdated: false,
        })),
      );
    },
    [currentVersion],
  );
  const canIssueSaved =
    !!currentVersion && currentVersion === issue?.versionId && !dirty && !pending;
  const lineCount = document.sections.reduce((count, section) => count + section.lines.length, 0);
  useEffect(() => {
    if (!editable || (!dirty && view.saved)) return;
    let active = true;
    const timer = setTimeout(() => {
      void previewQuoteTotalsAction(locale, {
        projectKey: view.job.businessKey,
        ...JSON.parse(serialized),
      }).then((value) => {
        if (active) {
          setCalculated(value?.sections ? value : null);
          setCategoryTotals(value?.categoryTotals ?? []);
        }
      });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [serialized, locale, editable, dirty, view.saved, view.job.businessKey]);
  function change(next: QuoteDocumentDraft) {
    setDocument(next);
    setCalculated(null);
    setCategoryTotals([]);
  }
  function sectionAt(index: number, patch: Partial<QuoteDocumentSection>) {
    change({
      ...document,
      sections: document.sections.map((section, i) =>
        i === index ? { ...section, ...patch } : section,
      ),
    });
  }
  function lineAt(si: number, li: number, next: QuoteDocumentLine) {
    sectionAt(si, {
      lines: document.sections[si]!.lines.map((line, i) => (i === li ? next : line)),
    });
  }
  function move<T>(items: readonly T[], index: number, offset: number): T[] {
    const result = [...items],
      other = index + offset;
    if (other < 0 || other >= items.length) return result;
    [result[index], result[other]] = [result[other]!, result[index]!];
    return result;
  }
  function addLine(si: number, kind: QuoteDocumentLine["kind"]) {
    if (lineCount >= 300) return;
    const base = { id: crypto.randomUUID(), description: "" };
    const line: QuoteDocumentLine =
      kind === "NOTE"
        ? { ...base, kind }
        : kind === "PERCENTAGE"
          ? { ...base, kind, percentage: "", remark: "" }
          : { ...base, kind, quantity: "1", unit: "式", unitPrice: "", remark: "" };
    sectionAt(si, { lines: [...document.sections[si]!.lines, line] });
  }
  function save() {
    start(async () => {
      const response = await saveQuoteDraftAction(locale, {
        projectKey: view.job.businessKey,
        baseVersionId: currentVersion,
        idempotencyKey: key,
        preparationToken: token,
        ...document,
      });
      setMessage(
        response.result.kind === "SAVED"
          ? quoteTemplate(draftCopy.saved, { version: response.result.versionNumber })
          : draftCopy[response.result.kind],
      );
      if (response.result.kind === "SAVED" && response.view?.kind === "AVAILABLE") {
        setFirstSave(response.result.firstSave);
        const next = documentFor(response.view);
        setView(response.view);
        setDocument(next);
        setSavedDocument(JSON.stringify(next));
        setCalculated(response.view.saved?.document ?? null);
        setCategoryTotals(response.view.categoryTotals ?? []);
        setReferences(references(response.view));
        setToken(null);
        setKey(crypto.randomUUID());
        router.refresh();
      }
    });
  }
  function moveToReview() {
    start(async () => {
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
        setMessage(draftCopy.moved);
      } else setMessage(draftCopy.UNAVAILABLE);
    });
  }
  const [referencePending, startReference] = useTransition();
  function refresh() {
    startReference(async () => {
      const result = await prepareQuoteDraftAction(locale, view.job.businessKey);
      if (result.kind !== "PREPARED") {
        setMessage(draftCopy[result.kind]);
        return;
      }
      setToken(result.token);
      setReferences(
        result.preparation.suggestions.map((suggestion) => ({
          ...suggestion,
          unavailable: false,
          outdated: false,
        })),
      );
      setMessage(draftCopy.refreshHint);
    });
  }
  function applySuggestion(row: Reference) {
    const mapped = document.sections.filter((section) => section.categoryId === row.categoryId);
    if (
      !row.basis?.suggestedAmount ||
      row.outdated ||
      mapped.some((section) => section.lines.length > 0) ||
      lineCount >= 300
    )
      return;
    const index = document.sections.findIndex((section) => section.categoryId === row.categoryId);
    if (index < 0) return;
    sectionAt(index, {
      lines: [
        {
          id: crypto.randomUUID(),
          kind: "ITEM",
          description: categoryLabel(locale, row.categoryId, view.job.catalog.workCategories),
          quantity: "1",
          unit: "式",
          unitPrice: row.basis.suggestedAmount,
          remark: "",
        },
      ],
    });
  }
  function sources(categoryId: string, selection?: EvidencePanelSelection) {
    start(async () => {
      const outcome = await quoteDraftEvidenceAction(locale, {
        projectKey: view.job.businessKey,
        categoryId,
        preparationToken: token,
        selection,
      });
      setEvidence({ categoryId, outcome, ...(selection ? { selection } : {}) });
    });
  }
  const header = issue?.issuedHeader ?? view.job.header;
  const format = (amount: string | null | undefined) =>
    amount == null ? "—" : formatMoney(amount, view.job.currency);
  return (
    <section className={styles.workspace} aria-busy={pending} ref={workspaceRef}>
      <PageHeader
        context={`${view.job.businessKey} · ${view.job.name}`}
        title={copy.title}
        description={
          editable
            ? dirty
              ? copy.unsaved
              : view.saved
                ? copy.saved
                : copy.saveFirst
            : copy.readOnly
        }
        actions={
          view.canReadAmounts && editable ? (
            <>
              <Button type="submit" form="quote-document-preview" disabled={!canIssueSaved}>
                {issueCopy.preview}
              </Button>
              <Button type="submit" form="quote-document-save" disabled={pending}>
                {draftCopy.save}
              </Button>
              {issue?.canIssue && (
                <Button
                  variant={reviewing ? "secondary" : "primary"}
                  type="submit"
                  form="quote-document-prepare"
                  disabled={!canIssueSaved}
                >
                  {issueCopy.prepare}
                </Button>
              )}
            </>
          ) : undefined
        }
      />
      {message && <Notice>{message}</Notice>}
      {firstSave &&
        !moved &&
        view.canUpdateStage &&
        ["DISCOVERY", "DESIGN"].includes(view.job.stage) && (
          <Button disabled={pending} onClick={moveToReview}>
            {draftCopy.move}
          </Button>
        )}
      <div className={styles.layout}>
        <div className={styles.main}>
          <Paper className={styles.document} aria-label={copy.title}>
            <header className={styles.documentHeader}>
              <h2>{header?.firmName ? `${header.firmName} · ${copy.title}` : copy.title}</h2>
              <dl className={styles.meta}>
                {[
                  [copy.client, header?.clientName],
                  [copy.contact, header?.contactPerson],
                  [copy.clientAddress, header?.clientAddress],
                  [copy.clientTaxId, header?.clientTaxId],
                  [copy.project, issue?.issuedHeader?.projectName ?? view.job.name],
                  [copy.siteAddress, issue?.issuedHeader?.siteAddress ?? view.job.siteAddress],
                  [copy.issueDate, issue?.issuedHeader?.issueDate ?? issue?.today],
                  [issueCopy.validUntil, issue?.issuedHeader?.validUntil ?? validUntil],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} style={{ display: "contents" }}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
              </dl>
              {issue?.status && QUOTE_LIST_STATUSES.includes(issue.status as QuoteListStatus) && (
                <Badge status={issue.status as QuoteListStatus} locale={locale} />
              )}
            </header>
            {!view.canReadAmounts ? (
              <div
                className={styles.scroll}
                data-quote-scroll
                tabIndex={0}
                role="region"
                aria-label={copy.title}
              >
                <p>{draftCopy.restricted}</p>
                {view.structure?.sections.map((section, si) => (
                  <section key={si}>
                    <h3>{section.title || copy.section}</h3>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          {[copy.number, copy.item, copy.unit, copy.quantity, copy.remarks].map(
                            (label) => (
                              <th key={label}>{label}</th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {section.lines.map((line, li) => (
                          <tr key={li}>
                            <td>{li + 1}</td>
                            <td>{line.description}</td>
                            <td>{line.unit}</td>
                            <td>{line.quantity}</td>
                            <td>{line.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                ))}
              </div>
            ) : (
              <>
                <form
                  id="quote-document-save"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!pending && editable) save();
                  }}
                >
                  <div
                    className={styles.scroll}
                    data-quote-scroll
                    tabIndex={0}
                    role="region"
                    aria-label={copy.title}
                  >
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          {[
                            copy.number,
                            copy.item,
                            copy.unit,
                            copy.quantity,
                            copy.price,
                            copy.amount,
                            copy.remarks,
                          ].map((label) => (
                            <th key={label}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      {document.sections.map((section, si) => (
                        <tbody key={section.id ?? si} data-section={si + 1}>
                          <tr className={styles.sectionRow}>
                            <td colSpan={5}>
                              <div className={styles.sectionHeader}>
                                <label>
                                  {copy.sectionTitle}
                                  <input
                                    className={ui.input}
                                    aria-label={`${copy.sectionTitle} ${si + 1}`}
                                    maxLength={80}
                                    value={section.title}
                                    disabled={!editable || pending}
                                    onChange={(event) =>
                                      sectionAt(si, { title: event.target.value })
                                    }
                                  />
                                </label>
                                <label>
                                  {copy.category}
                                  <select
                                    className={ui.input}
                                    value={section.categoryId ?? ""}
                                    disabled={!editable || pending}
                                    onChange={(event) =>
                                      sectionAt(si, { categoryId: event.target.value || null })
                                    }
                                  >
                                    <option value="">{copy.noCategory}</option>
                                    {[
                                      ...new Set([
                                        ...view.job.commercialCategoryIds,
                                        ...(section.categoryId ? [section.categoryId] : []),
                                      ]),
                                    ].map((id) => (
                                      <option key={id} value={id}>
                                        {categoryLabel(locale, id, view.job.catalog.workCategories)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                            </td>
                            <td className={styles.sectionTotal}>
                              <small>{copy.sectionSubtotal}</small>
                              {format(calculated?.sections[si]?.subtotal)}
                            </td>
                            <td>
                              {editable && (
                                <div className={styles.controls}>
                                  <Button
                                    disabled={pending || si === 0}
                                    onClick={() =>
                                      change({
                                        ...document,
                                        sections: move(document.sections, si, -1),
                                      })
                                    }
                                  >
                                    {copy.up}
                                  </Button>
                                  <Button
                                    disabled={pending || si === document.sections.length - 1}
                                    onClick={() =>
                                      change({
                                        ...document,
                                        sections: move(document.sections, si, 1),
                                      })
                                    }
                                  >
                                    {copy.down}
                                  </Button>
                                  <Button
                                    variant="quiet"
                                    disabled={pending || document.sections.length === 1}
                                    onClick={() =>
                                      change({
                                        ...document,
                                        sections: document.sections.filter((_, i) => i !== si),
                                      })
                                    }
                                  >
                                    {copy.remove}
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                          {section.lines.map((line, li) => {
                            const disabled = !editable || pending,
                              label = `${si + 1}.${li + 1}`;
                            const amount = calculated?.sections[si]?.lines[li]?.amount;
                            const renderRow = (description: ReactNode) => (
                              <tr key={line.id ?? li}>
                                <td>
                                  {editable ? (
                                    <details>
                                      <summary aria-label={`${copy.lineActions} ${label}`}>
                                        {li + 1}
                                      </summary>
                                      <div className={styles.controls}>
                                        <Button
                                          disabled={disabled || li === 0}
                                          onClick={() =>
                                            sectionAt(si, { lines: move(section.lines, li, -1) })
                                          }
                                        >
                                          {copy.up}
                                        </Button>
                                        <Button
                                          disabled={disabled || li === section.lines.length - 1}
                                          onClick={() =>
                                            sectionAt(si, { lines: move(section.lines, li, 1) })
                                          }
                                        >
                                          {copy.down}
                                        </Button>
                                        <Button
                                          variant="quiet"
                                          disabled={disabled}
                                          onClick={() =>
                                            sectionAt(si, {
                                              lines: section.lines.filter((_, i) => i !== li),
                                            })
                                          }
                                        >
                                          {copy.remove}
                                        </Button>
                                      </div>
                                    </details>
                                  ) : (
                                    li + 1
                                  )}
                                </td>
                                <td colSpan={line.kind === "NOTE" ? 6 : 1}>
                                  {description}
                                  {line.kind === "NOTE" && <small>{copy.note}</small>}
                                </td>
                                {line.kind === "ITEM" && (
                                  <>
                                    <td>
                                      <input
                                        aria-label={`${copy.unit} ${label}`}
                                        required
                                        list="quote-unit-suggestions"
                                        maxLength={8}
                                        value={line.unit}
                                        disabled={disabled}
                                        onChange={(event) =>
                                          lineAt(si, li, { ...line, unit: event.target.value })
                                        }
                                      />
                                    </td>
                                    <td>
                                      <input
                                        className={styles.numeric}
                                        aria-label={`${copy.quantity} ${label}`}
                                        required
                                        inputMode="decimal"
                                        pattern="[0-9]+(\.[0-9]{1,2})?"
                                        maxLength={17}
                                        value={line.quantity}
                                        disabled={disabled}
                                        onChange={(event) =>
                                          lineAt(si, li, {
                                            ...line,
                                            quantity: event.target.value,
                                          })
                                        }
                                      />
                                    </td>
                                    <td>
                                      <input
                                        className={styles.numeric}
                                        aria-label={`${copy.price} ${label}`}
                                        required
                                        inputMode="decimal"
                                        pattern="[0-9]+(\.[0-9]{1,2})?"
                                        maxLength={17}
                                        value={line.unitPrice}
                                        disabled={disabled}
                                        onChange={(event) =>
                                          lineAt(si, li, {
                                            ...line,
                                            unitPrice: event.target.value,
                                          })
                                        }
                                      />
                                      <small className={styles.numeric}>
                                        {/^\d+(\.\d{1,2})?$/.test(line.unitPrice)
                                          ? format(line.unitPrice)
                                          : ""}
                                      </small>
                                    </td>
                                  </>
                                )}
                                {line.kind === "PERCENTAGE" && (
                                  <td colSpan={3}>
                                    <label>
                                      {copy.percentage}
                                      <input
                                        className={styles.numeric}
                                        aria-label={`${copy.percentage} ${label}`}
                                        required
                                        inputMode="decimal"
                                        pattern="[0-9]+(\.[0-9]{1,2})?"
                                        maxLength={9}
                                        value={line.percentage}
                                        disabled={disabled}
                                        onChange={(event) =>
                                          lineAt(si, li, {
                                            ...line,
                                            percentage: event.target.value,
                                          })
                                        }
                                      />
                                      %
                                    </label>
                                  </td>
                                )}
                                {line.kind !== "NOTE" && (
                                  <>
                                    <td className={styles.numeric}>
                                      <output aria-label={`${copy.amount} ${label}`}>
                                        {format(amount)}
                                      </output>
                                    </td>
                                    <td>
                                      <textarea
                                        aria-label={`${copy.remarks} ${label}`}
                                        rows={2}
                                        maxLength={200}
                                        value={line.remark}
                                        disabled={disabled}
                                        onChange={(event) =>
                                          lineAt(si, li, { ...line, remark: event.target.value })
                                        }
                                      />
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                            return line.kind === "ITEM" ? (
                              <QuoteItemDescription
                                key={line.id ?? li}
                                renderRow={renderRow}
                                line={line}
                                projectKey={view.job.businessKey}
                                locale={locale}
                                label={`${copy.item} ${label}`}
                                disabled={disabled}
                                editable={editable}
                                onChange={(item) => lineAt(si, li, item)}
                              />
                            ) : (
                              renderRow(
                                <textarea
                                  aria-label={`${copy.item} ${label}`}
                                  required
                                  rows={2}
                                  maxLength={500}
                                  value={line.description}
                                  disabled={disabled}
                                  onChange={(event) =>
                                    lineAt(si, li, { ...line, description: event.target.value })
                                  }
                                />,
                              )
                            );
                          })}
                          {!section.lines.length && (
                            <tr>
                              <td colSpan={7}>{copy.empty}</td>
                            </tr>
                          )}
                          {editable && (
                            <tr>
                              <td colSpan={7}>
                                {editable && (
                                  <div className={styles.controls}>
                                    <Button
                                      disabled={pending || lineCount >= 300}
                                      onClick={() => addLine(si, "ITEM")}
                                    >
                                      {copy.addItem}
                                    </Button>
                                    <Button
                                      disabled={pending || lineCount >= 300}
                                      onClick={() => addLine(si, "PERCENTAGE")}
                                    >
                                      {copy.addFee}
                                    </Button>
                                    <Button
                                      disabled={pending || lineCount >= 300}
                                      onClick={() => addLine(si, "NOTE")}
                                    >
                                      {copy.addNote}
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      ))}
                    </table>
                    {editable && (
                      <Button
                        disabled={pending || document.sections.length >= 30}
                        onClick={() =>
                          change({ ...document, sections: [...document.sections, newSection()] })
                        }
                      >
                        {copy.addSection}
                      </Button>
                    )}
                    <datalist id="quote-unit-suggestions">
                      {[
                        ...new Set(
                          view.job.catalog.quoteUnits
                            .filter((unit) => unit.active)
                            .flatMap((unit) =>
                              locale === "zh-TW"
                                ? [unit.nameZhTw, unit.nameEn]
                                : [unit.nameEn, unit.nameZhTw],
                            ),
                        ),
                      ]
                        .filter((name) => name.length <= 8)
                        .map((name) => (
                          <option key={name} value={name} />
                        ))}
                    </datalist>
                  </div>
                </form>
                <footer className={styles.totals} aria-live="polite">
                  {calculated ? (
                    <dl>
                      {[
                        [copy.subtotal, calculated.subtotal],
                        ...calculated.percentageLines.map((line) => [
                          `${line.description} (${line.percentage}%)`,
                          line.amount,
                        ]),
                        [
                          document.discount.label || quoteDocumentCopy(documentLanguage).discount,
                          calculated.discount.amount === "0.00" ||
                          calculated.discount.amount === "0"
                            ? "0.00"
                            : `-${calculated.discount.amount}`,
                        ],
                        [copy.beforeTax, calculated.amountBeforeTax],
                        [copy.tax, calculated.taxAmount],
                        [copy.total, calculated.totalAmount],
                      ].map(([label, amount], i, all) => (
                        <div
                          key={`${label}-${i}`}
                          className={i === all.length - 1 ? styles.total : undefined}
                          style={{ display: "contents" }}
                        >
                          <dt>{label}</dt>
                          <dd>{format(amount)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p role="status">{copy.invalid}</p>
                  )}
                </footer>
              </>
            )}
          </Paper>
        </div>
        <aside className={styles.aside} aria-label={copy.settings}>
          {editable && (
            <div className={styles.settings}>
              <label>
                {copy.discountLabel}
                <input
                  className={ui.input}
                  maxLength={40}
                  value={document.discount.label}
                  placeholder={quoteDocumentCopy(documentLanguage).discount}
                  disabled={pending}
                  onChange={(event) =>
                    change({
                      ...document,
                      discount: { ...document.discount, label: event.target.value },
                    })
                  }
                />
              </label>
              <label>
                {copy.discountAmount}
                <input
                  className={ui.input}
                  form="quote-document-save"
                  required
                  inputMode="numeric"
                  pattern="[0-9]+(\.00)?"
                  maxLength={21}
                  value={document.discount.amount}
                  disabled={pending}
                  onChange={(event) =>
                    change({
                      ...document,
                      discount: { ...document.discount, amount: event.target.value },
                    })
                  }
                />
              </label>
              <p>{copy.fees}</p>
              <p>{copy.limit}</p>
            </div>
          )}
          {issue ? (
            <QuoteIssuePanel
              key={issueKey}
              view={issue}
              locale={locale}
              disabled={pending || (editable && !canIssueSaved)}
              externalActions={editable}
              onReviewChange={setReviewing}
              onOptionsChange={(options) => {
                setValidUntil(options.validUntil);
                setSelectedLanguage({ issueKey, language: options.language });
              }}
            />
          ) : view.canReadAmounts ? (
            <p>{draftCopy.UNAVAILABLE}</p>
          ) : null}
          {view.canReadAmounts && (
            <QuoteComparisonPanel
              key={currentVersion ?? "unsaved"}
              locale={locale}
              projectKey={view.job.businessKey}
              onPrepared={receivePreparation}
            >
              <h2>{copy.references}</h2>
              {editable && (
                <Button disabled={referencePending || pending} onClick={refresh}>
                  {draftCopy.refresh}
                </Button>
              )}
              {referenceRows
                .filter((row) =>
                  document.sections.some((section) => section.categoryId === row.categoryId),
                )
                .map((row) => {
                  const sections = document.sections.filter(
                    (section) => section.categoryId === row.categoryId,
                  );
                  return (
                    <CategoryReference
                      key={row.categoryId}
                      locale={locale}
                      job={view.job}
                      {...row}
                      sectionTitles={sections.map((section) => section.title || copy.section)}
                      amount={
                        categoryTotals.find((total) => total.categoryId === row.categoryId)
                          ?.amount ?? null
                      }
                      canUse={
                        editable &&
                        sections.length > 0 &&
                        sections.every((section) => section.lines.length === 0)
                      }
                      pending={referencePending || pending}
                      onUse={() => applySuggestion(row)}
                      onSources={() => sources(row.categoryId)}
                    />
                  );
                })}
            </QuoteComparisonPanel>
          )}
        </aside>
      </div>
      {evidence && (
        <EvidencePanel
          locale={locale}
          outcome={evidence.outcome}
          selection={evidence.selection}
          onClose={() => setEvidence(null)}
          onNavigate={(selection) => sources(evidence.categoryId, selection)}
        />
      )}
    </section>
  );
}
