"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ActionReceipt } from "@/components/internal-review/action-receipt";
import { InternalReviewSheet } from "@/components/internal-review/internal-review-sheet";
import { ReviewModal } from "@/components/internal-review/review-modal";
import type {
  ConfirmOutcome,
  PrepareOutcome,
  ReceiptDTO,
  ReceiptOutcome,
  ReturnContext,
} from "@/modules/internal-review/domain/contracts";
import {
  getInternalReviewCopy,
  reviewStateMessage,
} from "@/modules/internal-review-experience/copy";
import {
  INTERNAL_REVIEW_QUERY_KEYS,
  internalReviewHref,
  projectActionsHref,
  type InternalReviewRouteState,
} from "@/modules/internal-review-experience/route-state";
import type { Locale } from "@/modules/localization/config";
import styles from "./internal-review.module.css";

export type InternalReviewExperienceProps = Readonly<{
  locale: Locale;
  projectKey: string;
  comparisonRunId: string;
  enrichmentRunId: string;
  canPrepare: boolean;
  returnContext: ReturnContext;
  route: InternalReviewRouteState;
  proposalOutcome?: PrepareOutcome | undefined;
  receiptOutcome?: ReceiptOutcome | undefined;
}>;

export function InternalReviewController({
  locale,
  projectKey,
  comparisonRunId,
  enrichmentRunId,
  canPrepare,
  returnContext,
  route,
  proposalOutcome,
  receiptOutcome,
  evidenceActive,
  onEvidence,
  evidenceReturnId,
}: InternalReviewExperienceProps &
  Readonly<{
    evidenceActive: boolean;
    onEvidence: (claimKey: string, triggerId: string) => void;
    evidenceReturnId?: string | undefined;
  }>) {
  const router = useRouter();
  const copy = getInternalReviewCopy(locale);
  const [prepared, setPrepared] = useState<PrepareOutcome | null>(null);
  const [created, setCreated] = useState<Readonly<{ receipt: ReceiptDTO; replay: boolean }> | null>(
    null,
  );
  const [failure, setFailure] = useState<Readonly<{ kind: string; requestId?: string }> | null>(
    null,
  );
  const [requestPending, setRequestPending] = useState(false);
  const [navigating, startTransition] = useTransition();
  const preparing = useRef(false);
  const pending = requestPending || navigating;
  const proposalResult = prepared ?? proposalOutcome;
  const proposal = proposalResult?.kind === "PREPARED" ? proposalResult.proposal : null;
  const receipt =
    created?.receipt ?? (receiptOutcome?.kind === "AVAILABLE" ? receiptOutcome.receipt : null);
  const errorState =
    failure ??
    (route.errorKind ? { kind: route.errorKind } : null) ??
    (receiptOutcome?.kind === "ACTION_NOT_AUTHORIZED" ? receiptOutcome : null) ??
    (proposalResult && proposalResult.kind !== "PREPARED" ? proposalResult : null);
  const open = !!(errorState || receipt || proposal);

  const close = useCallback(() => {
    if (pending) return;
    const url = new URL(window.location.href);
    for (const key of INTERNAL_REVIEW_QUERY_KEYS) url.searchParams.delete(key);
    url.searchParams.set("reviewReturn", "internal-review-entry");
    setPrepared(null);
    setCreated(null);
    setFailure(null);
    startTransition(() => {
      router.push(`${url.pathname}?${url.searchParams}` as Route, { scroll: false });
    });
  }, [pending, router]);

  useEffect(() => {
    if (open || !route.returnId) return;
    const trigger =
      document.getElementById(route.returnId) ?? document.querySelector<HTMLElement>("h1");
    trigger?.focus();
    const url = new URL(window.location.href);
    url.searchParams.delete("reviewReturn");
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams}`);
  }, [open, route.returnId]);

  async function prepare() {
    if (pending || preparing.current) return;
    preparing.current = true;
    setRequestPending(true);
    setFailure(null);
    let awaitingProposalRoute = false;
    try {
      const response = await fetch("/api/actions/internal-review/proposals", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectKey,
          comparisonRunId,
          enrichmentRunId,
          locale,
          returnContext,
        }),
      });
      const outcome = (await response.json()) as PrepareOutcome;
      if (!outcome || typeof outcome.kind !== "string") throw new Error("INVALID_RESPONSE");
      if (outcome.kind === "PREPARED") {
        awaitingProposalRoute = true;
        startTransition(() =>
          router.push(
            internalReviewHref(locale, projectKey, outcome.proposal, {
              proposalKey: outcome.proposal.businessKey,
            }) as Route,
            { scroll: false },
          ),
        );
      } else {
        setPrepared(outcome);
      }
    } catch {
      awaitingProposalRoute = false;
      setFailure({ kind: "PROPOSAL_FAILED" });
    } finally {
      // The route-keyed controller remounts only after the server has reopened the proposal.
      // Keep the entry guarded while that navigation is outstanding.
      if (!awaitingProposalRoute) {
        preparing.current = false;
        setRequestPending(false);
      }
    }
  }

  function confirmed(outcome: ConfirmOutcome) {
    if ("receipt" in outcome) {
      setCreated({ receipt: outcome.receipt, replay: outcome.kind === "IDEMPOTENT_REPLAY" });
      router.replace(
        internalReviewHref(locale, projectKey, outcome.receipt, {
          actionKey: outcome.receipt.businessKey,
          replay: outcome.kind === "IDEMPOTENT_REPLAY",
        }) as Route,
        { scroll: false },
      );
    } else {
      setFailure(outcome);
      const url = new URL(window.location.href);
      for (const key of INTERNAL_REVIEW_QUERY_KEYS) url.searchParams.delete(key);
      url.searchParams.set("reviewError", outcome.kind);
      router.replace(`${url.pathname}?${url.searchParams}` as Route, { scroll: false });
    }
  }

  const source = receipt ?? proposal ?? { comparisonRunId, enrichmentRunId, returnContext };
  const replay = created?.replay === true || route.replay === true;
  return (
    <>
      {canPrepare ? (
        <section className={styles.entry}>
          <div>
            <strong>{copy.entry}</strong>
            <p>{copy.entryDescription}</p>
          </div>
          <button
            id="internal-review-entry"
            className={styles.primary}
            type="button"
            onClick={prepare}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? copy.preparing : copy.entry}
          </button>
        </section>
      ) : null}
      {open && !evidenceActive ? (
        <ReviewModal
          locale={locale}
          title={
            errorState
              ? copy.reviewTitle
              : receipt
                ? replay
                  ? copy.replayTitle
                  : copy.receiptTitle
                : copy.reviewTitle
          }
          description={
            receipt && !errorState
              ? replay
                ? copy.replayDescription
                : copy.receiptDescription
              : copy.reviewDescription
          }
          onClose={close}
          pending={pending}
          focusKey={errorState?.kind ?? receipt?.businessKey ?? proposal?.businessKey ?? "review"}
          returnFocusId={evidenceReturnId}
          onNavigate={(href) =>
            startTransition(() => router.push(href as Route, { scroll: false }))
          }
        >
          {errorState ? (
            <div className={styles.form}>
              <div className={styles.notice} role="alert">
                {reviewStateMessage(copy, errorState.kind)}
              </div>
              {"requestId" in errorState && errorState.requestId ? (
                <p className={styles.reference}>
                  {copy.reference}: {errorState.requestId}
                </p>
              ) : null}
              <div className={styles.actions}>
                <Link
                  className={styles.secondary}
                  href={internalReviewHref(locale, projectKey, source) as Route}
                >
                  {copy.returnToComparison}
                </Link>
                <Link
                  className={styles.secondary}
                  href={projectActionsHref(locale, projectKey) as Route}
                >
                  {copy.openActions}
                </Link>
                <button className={styles.secondary} type="button" onClick={close}>
                  {copy.close}
                </button>
              </div>
            </div>
          ) : receipt ? (
            <ActionReceipt receipt={receipt} locale={locale} />
          ) : proposal ? (
            <InternalReviewSheet
              proposal={proposal}
              draft={route.draft}
              onCancel={close}
              onEvidence={(claimKey, triggerId) =>
                startTransition(() => onEvidence(claimKey, triggerId))
              }
              onOutcome={(outcome) => startTransition(() => confirmed(outcome))}
              onPendingChange={setRequestPending}
              navigationPending={pending}
            />
          ) : null}
        </ReviewModal>
      ) : null}
    </>
  );
}
