"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  internalReviewHref,
  parseInternalReviewRoute,
  reviewDraftHref,
  type ReviewDraftSelection,
} from "@/modules/internal-review-experience/route-state";
import { displayReviewTimestamp } from "@/components/internal-review/action-receipt";
import styles from "./internal-review.module.css";
import { focusFirstReviewError } from "@/modules/internal-review-experience/focus";
import { useReviewDatePolicy } from "./use-review-date-policy";

function isReceiptOutcome(
  outcome: ConfirmOutcome,
): outcome is Extract<ConfirmOutcome, { receipt: unknown }> {
  return outcome.kind === "CREATED" || outcome.kind === "IDEMPOTENT_REPLAY";
}

function selectedReviewDraft(proposal: ProposalDTO, draft: ReviewDraftSelection) {
  const title = proposal.titleOptions.find((option) => option.key === draft.titleKey);
  const rationale = proposal.rationaleOptions.find((option) => option.key === draft.rationaleKey);
  return {
    titleKey: title?.key ?? proposal.titleKey,
    rationaleKey: rationale?.key ?? proposal.rationaleKey,
    title: title?.text ?? proposal.title,
    rationale: rationale?.text ?? proposal.rationale,
    assigneeKey:
      proposal.canAssign &&
      (draft.assigneeKey === "none" ||
        proposal.assignees.some((person) => person.key === draft.assigneeKey))
        ? draft.assigneeKey!
        : (proposal.suggestedAssigneeKey ?? "none"),
    dueDate: draft.dueDate ?? proposal.suggestedDueDate ?? "",
  };
}

export function InternalReviewSheet({
  proposal,
  draft,
  onCancel,
  onEvidence,
  onOutcome,
  onPendingChange,
  navigationPending = false,
}: Readonly<{
  proposal: ProposalDTO;
  draft: ReviewDraftSelection;
  onCancel: () => void;
  onEvidence: (claimKey: string, triggerId: string) => void;
  onOutcome: (outcome: ConfirmOutcome) => void;
  onPendingChange: (pending: boolean) => void;
  navigationPending?: boolean;
}>) {
  const copy = getInternalReviewCopy(proposal.locale);
  const form = useRef<HTMLFormElement>(null);
  const search = useSearchParams();
  const liveRoute = parseInternalReviewRoute(Object.fromEntries(search));
  const selectedDraft = liveRoute.proposalKey === proposal.businessKey ? liveRoute.draft : draft;
  const {
    titleKey,
    rationaleKey,
    assigneeKey,
    dueDate,
    title: selectedTitle,
    rationale: selectedRationale,
  } = selectedReviewDraft(proposal, selectedDraft);
  const [confirmation, setConfirmation] = useState(false);
  const acknowledged = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const submission = useRef(false);
  const errorFocusPending = useRef(false);
  const dateRecoveryFocusPending = useRef(false);
  const pending = confirming || navigationPending;
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<Exclude<ConfirmOutcome, { receipt: unknown }> | null>(
    null,
  );
  const dates = useReviewDatePolicy(proposal);
  const dueDateError =
    fieldErrors.dueDate ??
    (dates.status === "ready" &&
    dueDate &&
    (dueDate < dates.policy.minDueDate || dueDate > dates.policy.maxDueDate)
      ? "INVALID_DUE_DATE"
      : undefined);

  useEffect(() => {
    if (pending || !failure || !errorFocusPending.current) return;
    errorFocusPending.current = false;
    focusFirstReviewError(form.current, fieldErrors);
  }, [failure, fieldErrors, pending]);

  useEffect(() => {
    if (pending || dates.status === "refreshing" || !dateRecoveryFocusPending.current) return;
    dateRecoveryFocusPending.current = false;
    const recovery = form.current?.querySelector<HTMLElement>(
      dates.status === "ready" ? "#review-dueDate" : "#review-date-policy",
    );
    recovery?.focus({ preventScroll: true });
    recovery?.scrollIntoView({ behavior: "instant", block: "center" });
  }, [dates.status, pending]);

  const lockedAfterFailure =
    failure &&
    [
      "STALE_COMPARISON",
      "ACCESS_CHANGED",
      "ACTION_NOT_AUTHORIZED",
      "EVIDENCE_UNAVAILABLE",
      "PROPOSAL_EXPIRED",
      "PROPOSAL_ALREADY_CONSUMED",
      "ASSIGNEE_UNAVAILABLE",
      "IDEMPOTENCY_CONFLICT",
    ].includes(failure.kind);

  function currentDraftHref(change: ReviewDraftSelection = {}) {
    const canonicalHref = internalReviewHref(
      proposal.locale,
      proposal.project.projectKey,
      proposal,
      { proposalKey: proposal.businessKey, draft: selectedDraft },
    );
    return reviewDraftHref(canonicalHref, window.location.href, change);
  }

  function updateDraft(change: ReviewDraftSelection) {
    if (pending) return;
    if (change.dueDate !== undefined) {
      setFieldErrors((previous) => {
        const remaining = { ...previous };
        delete remaining.dueDate;
        return remaining;
      });
    }
    window.history.replaceState(null, "", currentDraftHref(change));
  }

  function error(field: keyof FieldErrors) {
    const code = field === "dueDate" ? dueDateError : fieldErrors[field];
    return code ? (
      <p className={styles.error} id={`review-${field}-error`} tabIndex={-1}>
        {field === "assigneeKey"
          ? copy.states.ASSIGNEE_UNAVAILABLE
          : reviewValidationMessage(copy, code)}
      </p>
    ) : null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submission.current || lockedAfterFailure) return;
    const latest = selectedReviewDraft(
      proposal,
      parseInternalReviewRoute(
        Object.fromEntries(new URL(currentDraftHref(), window.location.href).searchParams),
      ).draft,
    );
    submission.current = true;
    setConfirming(true);
    onPendingChange(true);
    setFieldErrors({});
    setFailure(null);
    let outcome: ConfirmOutcome;
    const startedAt = performance.now();
    try {
      const currentDates = await dates.ensureCurrent();
      if (!currentDates) {
        dateRecoveryFocusPending.current = true;
        submission.current = false;
        setConfirming(false);
        onPendingChange(false);
        return;
      }
      if (
        latest.dueDate &&
        (latest.dueDate < currentDates.minDueDate || latest.dueDate > currentDates.maxDueDate)
      ) {
        outcome = {
          kind: "VALIDATION_FAILED",
          requestId: "",
          fieldErrors: { dueDate: "INVALID_DUE_DATE" },
        };
      } else {
        const response = await fetch("/api/actions/internal-review", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: "internal-review-command.v1",
            proposalKey: proposal.businessKey,
            title: latest.title,
            rationale: latest.rationale,
            assigneeKey: latest.assigneeKey === "none" ? null : latest.assigneeKey,
            dueDate: latest.dueDate || null,
            confirmation: acknowledged.current,
            idempotencyKey: proposal.idempotencyKey,
            locale: proposal.locale,
          }),
        });
        outcome = (await response.json()) as ConfirmOutcome;
        if (!outcome || typeof outcome.kind !== "string") throw new Error("INVALID_RESPONSE");
        if (isReceiptOutcome(outcome) && !outcome.receipt) throw new Error("RECEIPT_UNAVAILABLE");
      }
    } catch {
      outcome = { kind: "ACTION_CREATE_FAILED", requestId: "" };
    }
    submission.current = false;
    setConfirming(false);
    onPendingChange(false);
    errorFocusPending.current = true;
    if (outcome.kind === "VALIDATION_FAILED") {
      if (outcome.datePolicy) dates.accept(outcome.datePolicy, startedAt);
      setFieldErrors(outcome.fieldErrors);
      setFailure(outcome);
      return;
    }
    if (outcome.kind === "ASSIGNEE_UNAVAILABLE") setFieldErrors({ assigneeKey: "INVALID_REQUEST" });
    if (isReceiptOutcome(outcome)) {
      onOutcome(outcome);
      return;
    }
    setFailure(outcome);
  }

  return (
    <form
      ref={form}
      className={styles.form}
      onSubmit={submit}
      noValidate
      aria-label={copy.reviewTitle}
      aria-describedby={
        dates.status === "unavailable"
          ? "review-date-policy"
          : failure
            ? "review-error-summary"
            : undefined
      }
    >
      {failure ? (
        <div
          className={styles.notice}
          role="alert"
          id="review-error-summary"
          tabIndex={-1}
          aria-labelledby="review-error-heading"
        >
          <h3 id="review-error-heading">
            {failure.kind === "VALIDATION_FAILED"
              ? copy.validationTitle
              : copy.confirmationErrorTitle}
          </h3>
          <p>{reviewStateMessage(copy, failure.kind)}</p>
          {"requestId" in failure && failure.requestId ? (
            <p className={styles.reference}>
              {copy.reference}: {failure.requestId}
            </p>
          ) : null}
          {lockedAfterFailure ? (
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
            <span className={styles.fieldLabel} id="review-assignee-label">
              {copy.assignee}
            </span>
            <p
              aria-labelledby="review-assignee-label"
              aria-describedby={
                fieldErrors.assigneeKey ? "review-assigneeKey-error" : "review-assignee-hint"
              }
            >
              {proposal.assignees.find((person) => person.key === proposal.suggestedAssigneeKey)
                ?.displayName ?? copy.unassigned}
            </p>
            <p className={styles.hint} id="review-assignee-hint">
              {copy.assigneeLocked}
            </p>
            {error("assigneeKey")}
          </>
        )}
      </div>
      <div className={styles.field}>
        <label htmlFor="review-dueDate">{copy.dueDate}</label>
        <input
          id="review-dueDate"
          name="dueDate"
          type="date"
          min={dates.status === "ready" ? dates.policy.minDueDate : undefined}
          max={dates.status === "ready" ? dates.policy.maxDueDate : undefined}
          disabled={pending}
          value={dueDate}
          aria-invalid={!!dueDateError}
          aria-describedby={`review-date-hint${dueDateError ? " review-dueDate-error" : ""}`}
          onChange={(event) => {
            updateDraft({ dueDate: event.target.value });
          }}
        />
        <p id="review-date-hint" className={styles.hint}>
          {dates.status === "ready"
            ? copy.dateHint
                .replace("{min}", dates.policy.minDueDate)
                .replace("{max}", dates.policy.maxDueDate)
            : dates.status === "refreshing"
              ? copy.datePolicyRefreshing
              : copy.datePolicyUnavailable}
        </p>
        {dates.status === "unavailable" ? (
          <div id="review-date-policy" tabIndex={-1} role="alert" className={styles.notice}>
            <p>{copy.datePolicyUnavailable}</p>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => {
                dateRecoveryFocusPending.current = true;
                void dates.refresh();
              }}
            >
              {copy.datePolicyRetry}
            </button>
          </div>
        ) : null}
        {error("dueDate")}
        <button
          className={styles.textButton}
          type="button"
          disabled={pending}
          onClick={() => {
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
            onChange={(event) => {
              acknowledged.current = event.target.checked;
              setConfirmation(event.target.checked);
            }}
          />
          <span>{copy.acknowledgement}</span>
        </label>
        {error("confirmation")}
      </div>
      <div className={styles.actions}>
        <button
          className={styles.primary}
          type="submit"
          disabled={pending || !!lockedAfterFailure || dates.status !== "ready"}
        >
          {pending
            ? copy.confirming
            : failure?.kind === "ACTION_CREATE_FAILED"
              ? copy.retry
              : copy.entry}
        </button>
        <button className={styles.secondary} type="button" onClick={onCancel} disabled={pending}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}
