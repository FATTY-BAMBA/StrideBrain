"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Route } from "next";
import Link from "next/link";

import type {
  ConfirmOutcome,
  FieldErrors,
  ProposalDTO,
} from "@/modules/internal-review/domain/contracts";
import {
  getInternalReviewCopy,
  reviewStateMessage,
  reviewValidationMessage,
} from "@/modules/internal-review-experience/copy";
import {
  setReviewDraft,
  type ReviewDraftSelection,
} from "@/modules/internal-review-experience/route-state";
import { displayReviewTimestamp } from "@/components/internal-review/action-receipt";
import styles from "./internal-review.module.css";

export function InternalReviewSheet({
  proposal,
  draft,
  onCancel,
  onEvidence,
  onOutcome,
  onPendingChange,
}: Readonly<{
  proposal: ProposalDTO;
  draft: ReviewDraftSelection;
  onCancel: () => void;
  onEvidence: (claimKey: string, triggerId: string) => void;
  onOutcome: (outcome: ConfirmOutcome) => void;
  onPendingChange: (pending: boolean) => void;
}>) {
  const copy = getInternalReviewCopy(proposal.locale);
  const form = useRef<HTMLFormElement>(null);
  const [titleKey, setTitleKey] = useState(
    proposal.titleOptions.some((option) => option.key === draft.titleKey)
      ? draft.titleKey!
      : proposal.titleKey,
  );
  const [rationaleKey, setRationaleKey] = useState(
    proposal.rationaleOptions.some((option) => option.key === draft.rationaleKey)
      ? draft.rationaleKey!
      : proposal.rationaleKey,
  );
  const [assigneeKey, setAssigneeKey] = useState(
    proposal.canAssign &&
      (draft.assigneeKey === "none" ||
        proposal.assignees.some((person) => person.key === draft.assigneeKey))
      ? draft.assigneeKey!
      : (proposal.suggestedAssigneeKey ?? "none"),
  );
  const [dueDate, setDueDate] = useState(draft.dueDate ?? proposal.suggestedDueDate ?? "");
  const [confirmation, setConfirmation] = useState(false);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<Exclude<ConfirmOutcome, { receipt: unknown }> | null>(
    null,
  );

  useEffect(() => {
    const firstError = Object.keys(fieldErrors)[0];
    if (firstError) form.current?.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
  }, [fieldErrors]);

  const selectedTitle =
    proposal.titleOptions.find((option) => option.key === titleKey)?.text ?? proposal.title;
  const selectedRationale =
    proposal.rationaleOptions.find((option) => option.key === rationaleKey)?.text ??
    proposal.rationale;
  const lockedAfterFailure =
    failure &&
    [
      "STALE_COMPARISON",
      "PROPOSAL_ALREADY_CONSUMED",
      "ASSIGNEE_UNAVAILABLE",
      "IDEMPOTENCY_CONFLICT",
    ].includes(failure.kind);

  function updateDraft(change: ReviewDraftSelection) {
    const next = { titleKey, rationaleKey, assigneeKey, dueDate, ...change };
    const url = new URL(window.location.href);
    setReviewDraft(url.searchParams, next);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams}`);
  }

  function error(field: keyof FieldErrors) {
    const code = fieldErrors[field];
    return code ? (
      <p className={styles.error} id={`review-${field}-error`}>
        {reviewValidationMessage(copy, code)}
      </p>
    ) : null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || lockedAfterFailure) return;
    setPending(true);
    onPendingChange(true);
    setFieldErrors({});
    setFailure(null);
    let outcome: ConfirmOutcome;
    try {
      const response = await fetch("/api/actions/internal-review", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: "internal-review-command.v1",
          proposalKey: proposal.businessKey,
          title: selectedTitle,
          rationale: selectedRationale,
          assigneeKey: assigneeKey === "none" ? null : assigneeKey,
          dueDate: dueDate || null,
          confirmation,
          idempotencyKey: proposal.idempotencyKey,
          locale: proposal.locale,
        }),
      });
      outcome = (await response.json()) as ConfirmOutcome;
      if (!outcome || typeof outcome.kind !== "string") throw new Error("INVALID_RESPONSE");
    } catch {
      outcome = { kind: "ACTION_CREATE_FAILED", requestId: "" };
    }
    setPending(false);
    onPendingChange(false);
    if (outcome.kind === "VALIDATION_FAILED") {
      setFieldErrors(outcome.fieldErrors);
      setFailure(outcome);
      return;
    }
    if (outcome.kind === "ASSIGNEE_UNAVAILABLE") setFieldErrors({ assigneeKey: "INVALID_REQUEST" });
    if (
      "receipt" in outcome ||
      ["ACTION_NOT_AUTHORIZED", "EVIDENCE_UNAVAILABLE", "PROPOSAL_EXPIRED"].includes(outcome.kind)
    ) {
      onOutcome(outcome);
      return;
    }
    setFailure(outcome);
  }

  return (
    <form ref={form} className={styles.form} onSubmit={submit} noValidate>
      {failure ? (
        <div className={styles.notice} role="alert">
          <strong>{reviewStateMessage(copy, failure.kind)}</strong>
          {"requestId" in failure && failure.requestId ? (
            <p className={styles.reference}>
              {copy.reference}: {failure.requestId}
            </p>
          ) : null}
          {failure.kind === "STALE_COMPARISON" ? (
            <Link
              className={styles.textButton}
              href={
                `/${proposal.locale}/projects/${encodeURIComponent(proposal.project.projectKey)}/compare` as Route
              }
            >
              {copy.refresh}
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className={styles.field}>
        <label htmlFor="review-title">{copy.title}</label>
        <select
          id="review-title"
          name="title"
          value={titleKey}
          disabled={pending}
          aria-invalid={!!fieldErrors.title}
          aria-describedby={`review-edit-hint${fieldErrors.title ? " review-title-error" : ""}`}
          onChange={(event) => {
            setTitleKey(event.target.value);
            updateDraft({ titleKey: event.target.value });
          }}
        >
          {proposal.titleOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.text}
            </option>
          ))}
        </select>
        <p className={styles.hint}>{selectedTitle}</p>
        {error("title")}
      </div>
      <div className={styles.field}>
        <label htmlFor="review-rationale">{copy.rationale}</label>
        <select
          id="review-rationale"
          name="rationale"
          value={rationaleKey}
          disabled={pending}
          aria-invalid={!!fieldErrors.rationale}
          aria-describedby={`review-edit-hint${fieldErrors.rationale ? " review-rationale-error" : ""}`}
          onChange={(event) => {
            setRationaleKey(event.target.value);
            updateDraft({ rationaleKey: event.target.value });
          }}
        >
          {proposal.rationaleOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.text}
            </option>
          ))}
        </select>
        <p className={styles.hint}>{selectedRationale}</p>
        {error("rationale")}
        <p className={styles.hint} id="review-edit-hint">
          {copy.boundedEditHint}
        </p>
      </div>
      <section className={styles.locked} aria-labelledby="review-findings-title">
        <h3 id="review-findings-title">{copy.findings}</h3>
        <ul>
          {proposal.mandatoryStatements.map((statement) => (
            <li key={statement.key}>{statement.text}</li>
          ))}
        </ul>
      </section>
      <section className={styles.warning} aria-labelledby="review-warnings-title">
        <h3 id="review-warnings-title">
          <span aria-hidden="true">⚠ </span>
          {copy.uncertainty}
        </h3>
        <ul>
          {proposal.warnings.map((warning) => (
            <li key={warning.key}>{warning.text}</li>
          ))}
        </ul>
      </section>
      <section className={styles.locked} aria-labelledby="review-evidence-title">
        <h3 id="review-evidence-title">{copy.evidence}</h3>
        <ul>
          {proposal.evidenceLinks.map((link, index) => (
            <li key={link.claimKey}>
              <button
                className={styles.textButton}
                type="button"
                disabled={pending}
                data-evidence-trigger-id={`review-evidence-${index}`}
                onClick={() => onEvidence(link.claimKey, `review-evidence-${index}`)}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div className={styles.field}>
        {proposal.canAssign ? (
          <>
            <label htmlFor="review-assignee">{copy.assignee}</label>
            <select
              id="review-assignee"
              name="assigneeKey"
              disabled={pending}
              value={assigneeKey}
              aria-invalid={!!fieldErrors.assigneeKey}
              aria-describedby={fieldErrors.assigneeKey ? "review-assigneeKey-error" : undefined}
              onChange={(event) => {
                setAssigneeKey(event.target.value);
                updateDraft({ assigneeKey: event.target.value });
              }}
            >
              <option value="none">{copy.unassigned}</option>
              {proposal.assignees.map((person) => (
                <option key={person.key} value={person.key}>
                  {person.displayName}
                </option>
              ))}
            </select>
            {error("assigneeKey")}
          </>
        ) : (
          <>
            <span className={styles.fieldLabel}>{copy.assignee}</span>
            <p>
              {proposal.assignees.find((person) => person.key === proposal.suggestedAssigneeKey)
                ?.displayName ?? copy.unassigned}
            </p>
            <p className={styles.hint}>{copy.assigneeLocked}</p>
          </>
        )}
      </div>
      <div className={styles.field}>
        <label htmlFor="review-dueDate">{copy.dueDate}</label>
        <input
          id="review-dueDate"
          name="dueDate"
          type="date"
          min={proposal.minDueDate}
          max={proposal.maxDueDate}
          disabled={pending}
          value={dueDate}
          aria-invalid={!!fieldErrors.dueDate}
          aria-describedby={`review-date-hint${fieldErrors.dueDate ? " review-dueDate-error" : ""}`}
          onChange={(event) => {
            setDueDate(event.target.value);
            updateDraft({ dueDate: event.target.value });
          }}
        />
        <p id="review-date-hint" className={styles.hint}>
          {copy.dateHint
            .replace("{min}", proposal.minDueDate)
            .replace("{max}", proposal.maxDueDate)}
        </p>
        {error("dueDate")}
        <button
          className={styles.textButton}
          type="button"
          disabled={pending}
          onClick={() => {
            setDueDate("");
            updateDraft({ dueDate: "" });
          }}
        >
          {copy.clearDate}
        </button>
      </div>
      <dl className={styles.referenceGrid}>
        <div>
          <dt>{copy.comparison}</dt>
          <dd>{proposal.comparisonRunId}</dd>
        </div>
        <div>
          <dt>{copy.economics}</dt>
          <dd>{proposal.enrichmentRunId}</dd>
        </div>
        <div>
          <dt>{copy.expires}</dt>
          <dd>{displayReviewTimestamp(proposal.expiresAt, proposal.locale, proposal.timezone)}</dd>
        </div>
      </dl>
      <p className={styles.warning} id="review-consequence">
        <span aria-hidden="true">⚠ </span>
        {copy.consequence}
      </p>
      <div>
        <label className={styles.acknowledgement} htmlFor="review-confirmation">
          <input
            id="review-confirmation"
            name="confirmation"
            type="checkbox"
            checked={confirmation}
            disabled={pending}
            aria-invalid={!!fieldErrors.confirmation}
            aria-describedby={`review-consequence${fieldErrors.confirmation ? " review-confirmation-error" : ""}`}
            onChange={(event) => setConfirmation(event.target.checked)}
          />
          <span>{copy.acknowledgement}</span>
        </label>
        {error("confirmation")}
      </div>
      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={pending || !!lockedAfterFailure}>
          {pending ? copy.confirming : copy.entry}
        </button>
        <button className={styles.secondary} type="button" onClick={onCancel} disabled={pending}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}
