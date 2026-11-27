"use client";
import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import {
  prepareQuoteIssueAction,
  quoteIssueMutationAction,
} from "@/app/[locale]/projects/[projectKey]/quote/issue-actions";
import { quoteDraftEvidenceAction } from "@/app/[locale]/projects/[projectKey]/quote/actions";
import { EvidencePanel } from "@/components/evidence/evidence-panel";
import type {
  EvidencePanelOutcome,
  EvidencePanelSelection,
} from "@/modules/evidence-panel/contracts";
import type { GetQuoteIssue } from "@/modules/quote-issue/application/issue-services";
import type {
  IssueOptions,
  IssuePreparation,
  LineConflict,
} from "@/modules/quote-issue/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { quoteIssueCopy, quoteIssueBlockerText } from "@/modules/localization/quote-issue";
import { quoteDocumentCopy } from "@/modules/localization/quote-document";
import { categoryLabel } from "@/modules/localization/jobs";
import { formatMoney } from "@/modules/finance/format-money";
import styles from "./quote-issue.module.css";
export type IssueView = Extract<
  Awaited<ReturnType<GetQuoteIssue["execute"]>>,
  { kind: "AVAILABLE" }
>;
export function QuoteIssuePanel({
  view,
  locale,
  disabled = false,
  externalActions = false,
  onReviewChange,
  onOptionsChange,
}: {
  view: IssueView;
  locale: Locale;
  disabled?: boolean;
  externalActions?: boolean;
  onReviewChange?: (reviewing: boolean) => void;
  onOptionsChange?: (options: IssueOptions) => void;
}) {
  const copy = quoteIssueCopy(locale),
    docCopy = quoteDocumentCopy(locale),
    router = useRouter();
  const [options, setOptions] = useState<IssueOptions>(view.defaults),
    [prepared, setPrepared] = useState<{ token: string; preparation: IssuePreparation } | null>(
      null,
    );
  const [transitionPending, start] = useTransition(),
    [message, setMessage] = useState("");
  const pending = transitionPending || disabled;
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [accepting, setAccepting] = useState(false);
  const [date, setDate] = useState(view.today),
    [note, setNote] = useState("");
  const [evidence, setEvidence] = useState<{
    conflict: LineConflict;
    selection: EvidencePanelSelection;
    outcome: EvidencePanelOutcome;
  } | null>(null);
  function update(patch: Partial<IssueOptions>) {
    setOptions({ ...options, ...patch });
    onOptionsChange?.({ ...options, ...patch });
    setPrepared(null);
    onReviewChange?.(false);
  }
  function mutation(operation: "issue" | "revise" | "accept" | "resolve", input: object) {
    start(async () => {
      const result = await quoteIssueMutationAction(locale, operation, {
        projectKey: view.projectKey,
        idempotencyKey: key,
        ...input,
      });
      setMessage(
        "blockers" in result && result.blockers?.length
          ? result.blockers
              .map((code) => quoteIssueBlockerText(locale, code, result.missingFirmFields ?? []))
              .join(" ")
          : copy[result.kind],
      );
      if (["ISSUED", "REVISED", "ACCEPTED", "RESOLVED"].includes(result.kind)) {
        setKey(crypto.randomUUID());
        setPrepared(null);
        onReviewChange?.(false);
        router.refresh();
      }
    });
  }
  function readings(
    conflict: LineConflict,
    selection: EvidencePanelSelection = {
      mode: "CONFLICT",
      comparisonRunId: conflict.comparisonRunId,
      conflictKey: conflict.conflictKey,
    },
  ) {
    start(async () => {
      setEvidence({
        conflict,
        selection,
        outcome: await quoteDraftEvidenceAction(locale, {
          projectKey: view.projectKey,
          categoryId: conflict.categoryId,
          preparationToken: null,
          selection,
        }),
      });
    });
  }
  function preview() {
    if (pending) return;
    start(async () => {
      try {
        const response = await fetch(`/api/quotes/${encodeURIComponent(view.versionId!)}/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error("unavailable");
        const url = URL.createObjectURL(await response.blob());
        const a = document.createElement("a");
        a.href = url;
        const filename = /filename="([^"]+)"/.exec(
          response.headers.get("Content-Disposition") ?? "",
        )?.[1];
        if (!filename) throw new Error("unavailable");
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch {
        setMessage(copy.UNAVAILABLE);
      }
    });
  }
  function prepare() {
    if (pending) return;
    start(async () => {
      setMessage("");
      const result = await prepareQuoteIssueAction(locale, {
        projectKey: view.projectKey,
        versionId: view.versionId,
        options,
      });
      if (result.kind === "PREPARED") {
        setPrepared(result);
        onReviewChange?.(true);
      } else setMessage(copy[result.kind]);
    });
  }
  const snapshot = prepared?.preparation.snapshot;
  const showRevise = view.canRevise && view.status === "ISSUED" && view.issued?.status === "ISSUED";
  return (
    <section className={styles.section} aria-busy={pending} id="quote-issue">
      <h2>{copy.title}</h2>
      {message && (
        <p role="status" className={styles.notice}>
          {message}
        </p>
      )}
      {view.issued && (
        <div>
          <h3>
            {copy.issued} · {view.issued.status === "ACCEPTED" ? copy.ACCEPTED : copy.ISSUED}
          </h3>
          <dl className={styles.summary}>
            <dt>{copy.number}</dt>
            <dd>{view.issued.documentNumber}</dd>
            <dt>{copy.validUntil}</dt>
            <dd>{view.issued.validUntil}</dd>
            {view.issued.acceptedOn && (
              <>
                <dt>{copy.acceptedOn}</dt>
                <dd>{view.issued.acceptedOn}</dd>
              </>
            )}
          </dl>
          <div className={styles.actions}>
            <a
              href={`/api/quotes/${encodeURIComponent(view.issued.id)}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              {copy.pdf}
            </a>
            {showRevise && (
              <button
                className={styles.button}
                disabled={pending}
                onClick={() => mutation("revise", { versionId: view.issued!.id })}
              >
                {copy.revise}
              </button>
            )}
          </div>
          <p>
            {view.issued.status === "ACCEPTED"
              ? copy.acceptedDocument.replace("{date}", view.issued.acceptedOn ?? "")
              : showRevise
                ? copy.end
                : copy.fixedDocument}
          </p>
          {view.issued.status === "ISSUED" && view.canAccept && (
            <form
              id="accept-quote"
              onSubmit={(event) => {
                event.preventDefault();
                setAccepting(true);
              }}
            >
              {view.issued.validUntil < view.today && (
                <p className={styles.notice}>{copy.expired}</p>
              )}
              <div className={styles.fields}>
                <label>
                  {copy.date}
                  <input
                    required
                    type="date"
                    max={view.today}
                    value={date}
                    disabled={pending}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label>
                  {copy.note}
                  <input
                    maxLength={2000}
                    value={note}
                    disabled={pending}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
              </div>
              {accepting ? (
                <div role="group" aria-label={docCopy.confirm}>
                  <p>
                    {docCopy.confirmAcceptance
                      .replace("{number}", view.issued.documentNumber)
                      .replace("{client}", view.issued.clientName)
                      .replace(
                        "{total}",
                        formatMoney(view.issued.totalAmount, view.issued.currency),
                      )}
                  </p>
                  <button
                    type="button"
                    className={styles.button}
                    disabled={pending}
                    onClick={() => setAccepting(false)}
                  >
                    {docCopy.cancel}
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    disabled={pending}
                    onClick={() => {
                      mutation("accept", { versionId: view.issued!.id, date, note });
                      setAccepting(false);
                    }}
                  >
                    {docCopy.confirm}
                  </button>
                </div>
              ) : (
                <button className={styles.button} disabled={pending}>
                  {copy.accept}
                </button>
              )}
            </form>
          )}
        </div>
      )}
      {view.status === "DRAFT" ? (
        <>
          <p>{copy.savedOnly}</p>
          <div className={styles.fields}>
            <label>
              {copy.language}
              <select
                value={options.language}
                disabled={pending}
                onChange={(e) =>
                  update({
                    language: e.target.value as Locale,
                    terms: e.target.value === "en" ? view.termsEn : view.termsZhTw,
                  })
                }
              >
                <option value="zh-TW">繁體中文</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>
              {copy.validUntil}
              <input
                type="date"
                min={view.today}
                value={options.validUntil ?? ""}
                disabled={pending}
                onChange={(e) => update({ validUntil: e.target.value })}
              />
            </label>
            <label>
              {copy.attention}
              <input
                maxLength={200}
                value={options.attention}
                disabled={pending}
                onChange={(e) => update({ attention: e.target.value })}
              />
            </label>
          </div>
          <label className={styles.label}>
            {copy.terms}
            <textarea
              maxLength={10000}
              value={options.terms ?? ""}
              disabled={pending}
              onChange={(e) => update({ terms: e.target.value })}
            />
          </label>
          <form
            id="quote-document-preview"
            onSubmit={(event) => {
              event.preventDefault();
              preview();
            }}
          />
          <form
            id="quote-document-prepare"
            onSubmit={(event) => {
              event.preventDefault();
              prepare();
            }}
          />
          {!externalActions && (
            <div className={styles.actions}>
              <button className={styles.button} disabled={pending} onClick={preview}>
                {copy.preview}
              </button>
              {view.canIssue && (
                <button
                  className={`${styles.button} ${styles.primary}`}
                  disabled={pending}
                  onClick={prepare}
                >
                  {copy.prepare}
                </button>
              )}
            </div>
          )}
          {prepared && snapshot && (
            <div aria-live="polite">
              <h3>{copy.review}</h3>
              <dl className={styles.summary}>
                <dt>{copy.number}</dt>
                <dd>{snapshot.documentNumber}</dd>
                <dt>{copy.client}</dt>
                <dd>{snapshot.clientName}</dd>
                {[
                  [docCopy.contact, snapshot.clientDetails?.contactPerson],
                  [docCopy.clientAddress, snapshot.clientDetails?.address],
                  [docCopy.clientTaxId, snapshot.clientDetails?.taxId],
                  [
                    docCopy.siteAddress,
                    snapshot.schemaVersion === "QUOTE-DOCUMENT-2.0" ? snapshot.siteAddress : "",
                  ],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} style={{ display: "contents" }}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                <dt>{copy.issueDate}</dt>
                <dd>{snapshot.issueDate}</dd>
                <dt>{copy.validUntil}</dt>
                <dd>{snapshot.validUntil}</dd>
                <dt>{copy.language}</dt>
                <dd>{snapshot.language === "en" ? "English" : "繁體中文"}</dd>
              </dl>
              <table className={styles.lines}>
                {snapshot.schemaVersion === "QUOTE-DOCUMENT-2.0" ? (
                  snapshot.document.sections.map((section, sectionIndex) => (
                    <tbody key={sectionIndex}>
                      <tr>
                        <th scope="rowgroup">
                          {section.title} — {docCopy.sectionSubtotal}
                        </th>
                        <td>{formatMoney(section.subtotal, snapshot.currency)}</td>
                      </tr>
                      {section.lines.map((line, lineIndex) => (
                        <tr key={lineIndex}>
                          <td>{line.description}</td>
                          <td>
                            {line.amount === null
                              ? ""
                              : formatMoney(line.amount, snapshot.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))
                ) : (
                  <tbody>
                    {snapshot.lines.map((line, index) => (
                      <tr key={`${line.categoryId}-${index}`}>
                        <td>{line.description}</td>
                        <td>{formatMoney(line.amount, snapshot.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
              <dl className={styles.summary}>
                {(
                  [
                    ...(snapshot.schemaVersion === "QUOTE-DOCUMENT-2.0"
                      ? [
                          [docCopy.subtotal, snapshot.document.subtotal],
                          ...snapshot.document.percentageLines.map((line) => [
                            `${line.description} (${line.percentage}%)`,
                            line.amount,
                          ]),
                          ...(!/^0(?:\.0+)?$/.test(snapshot.document.discount.amount)
                            ? [
                                [
                                  snapshot.document.discount.label,
                                  `-${snapshot.document.discount.amount}`,
                                ],
                              ]
                            : []),
                        ]
                      : []),
                    [copy.beforeTax, snapshot.totals.amountBeforeTax],
                    [copy.tax, snapshot.totals.taxAmount],
                    [copy.total, snapshot.totals.totalAmount],
                  ] as const
                ).map(([label, value]) => (
                  <div style={{ display: "contents" }} key={label}>
                    <dt>{label}</dt>
                    <dd>{formatMoney(value, snapshot.currency)}</dd>
                  </div>
                ))}
              </dl>
              {snapshot.terms && (
                <>
                  <h3>{copy.terms}</h3>
                  <p className={styles.terms}>{snapshot.terms}</p>
                </>
              )}
              {!!prepared.preparation.blockers.length && (
                <div className={styles.notice}>
                  <h3>{copy.blockers}</h3>
                  <ul>
                    {prepared.preparation.blockers.map((code) => (
                      <li key={code}>
                        {quoteIssueBlockerText(
                          locale,
                          code,
                          prepared.preparation.missingFirmFields,
                        )}
                      </li>
                    ))}
                  </ul>
                  {prepared.preparation.blockers.includes("FIRM_INCOMPLETE") && (
                    <Link href={`/${locale}/settings`}>{copy.settings}</Link>
                  )}
                </div>
              )}
              {!!prepared.preparation.warnings.length && (
                <div className={styles.notice}>
                  <h3>{copy.warnings}</h3>
                  <ul>
                    {prepared.preparation.warnings.map((code) => (
                      <li key={code}>{copy[code]}</li>
                    ))}
                  </ul>
                  <Link
                    href={
                      `/${locale}/projects/${encodeURIComponent(view.projectKey)}/compare` as Route
                    }
                  >
                    {copy.comparison}
                  </Link>
                </div>
              )}
              <button
                className={`${styles.button} ${styles.primary}`}
                disabled={pending || !!prepared.preparation.blockers.length}
                onClick={() => mutation("issue", { token: prepared.token })}
              >
                {copy.confirm}
              </button>
            </div>
          )}
        </>
      ) : (
        <p>
          {!view.versionId
            ? copy.noDraft
            : ["FINAL", "INTERNAL_REVIEW"].includes(view.status ?? "")
              ? docCopy.unavailableIssue
              : copy.fixedDocument}
        </p>
      )}
      {!!view.conflicts.length && (
        <div>
          <h3>{copy.conflicts}</h3>
          {view.conflicts.map((conflict) => (
            <ConflictForm
              key={`${conflict.categoryId}:${conflict.conflictKey}`}
              conflict={conflict}
              catalog={view.catalog}
              locale={locale}
              pending={pending}
              canResolve={view.canResolve}
              onRead={() => readings(conflict)}
              onResolve={(status, note) =>
                mutation("resolve", { conflictKey: conflict.conflictKey, status, note })
              }
            />
          ))}
        </div>
      )}
      {evidence && (
        <EvidencePanel
          locale={locale}
          outcome={evidence.outcome}
          selection={evidence.selection}
          onClose={() => setEvidence(null)}
          onNavigate={(selection) => readings(evidence.conflict, selection)}
        />
      )}
    </section>
  );
}
function ConflictForm({
  catalog,
  conflict,
  locale,
  pending,
  canResolve,
  onRead,
  onResolve,
}: {
  catalog: FirmLists;
  conflict: LineConflict;
  locale: Locale;
  pending: boolean;
  canResolve: boolean;
  onRead: () => void;
  onResolve: (status: "RESOLVED" | "DISMISSED", note: string) => void;
}) {
  const copy = quoteIssueCopy(locale),
    [status, setStatus] = useState<"RESOLVED" | "DISMISSED">("RESOLVED"),
    [note, setNote] = useState("");
  return (
    <form
      className={styles.conflict}
      id={`quote-conflict-${conflict.categoryId}`}
      onSubmit={(e) => {
        e.preventDefault();
        onResolve(status, note);
      }}
    >
      <h4>{categoryLabel(locale, conflict.categoryId, catalog.workCategories)}</h4>
      <button type="button" className={styles.button} disabled={pending} onClick={onRead}>
        {copy.readings}
      </button>
      {canResolve && (
        <>
          <div className={styles.fields}>
            <label>
              {copy.resolution}
              <select
                value={status}
                disabled={pending}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="RESOLVED">{copy.sourceStands}</option>
                <option value="DISMISSED">{copy.notConflict}</option>
              </select>
            </label>
            <label>
              {copy.resolutionNote}
              <textarea
                required
                maxLength={2000}
                value={note}
                disabled={pending}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          <button className={styles.button} disabled={pending || !note.trim()}>
            {copy.resolve}
          </button>
        </>
      )}
    </form>
  );
}
