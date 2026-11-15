"use client";

import { useCallback, useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ActionReceipt } from "@/components/internal-review/action-receipt";
import { ReviewModal } from "@/components/internal-review/review-modal";
import type { ActionListOutcome, ReceiptOutcome } from "@/modules/internal-review/domain/contracts";
import {
  getInternalReviewCopy,
  reviewStateMessage,
} from "@/modules/internal-review-experience/copy";
import {
  internalReviewHref,
  projectActionsHref,
  type InternalReviewRouteState,
} from "@/modules/internal-review-experience/route-state";
import type { Locale } from "@/modules/localization/config";
import styles from "./internal-review.module.css";

export function ProjectActions({
  locale,
  projectKey,
  listOutcome,
  receiptOutcome,
  route,
}: Readonly<{
  locale: Locale;
  projectKey: string;
  listOutcome: ActionListOutcome;
  receiptOutcome?: ReceiptOutcome | undefined;
  route: InternalReviewRouteState;
}>) {
  const router = useRouter();
  const copy = getInternalReviewCopy(locale);
  const close = useCallback(() => {
    const href =
      receiptOutcome?.kind === "AVAILABLE"
        ? internalReviewHref(locale, projectKey, receiptOutcome.receipt, {}, "actions")
        : projectActionsHref(locale, projectKey);
    router.push(
      `${href}${route.actionKey ? `${href.includes("?") ? "&" : "?"}reviewReturn=${encodeURIComponent(route.actionKey)}` : ""}` as Route,
      { scroll: false },
    );
  }, [locale, projectKey, receiptOutcome, route.actionKey, router]);

  useEffect(() => {
    if (receiptOutcome || !route.returnId) return;
    const trigger =
      document.getElementById(`action-${route.returnId}`) ??
      document.getElementById("project-actions-title");
    trigger?.focus();
    const url = new URL(window.location.href);
    url.searchParams.delete("reviewReturn");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.searchParams.size ? `?${url.searchParams}` : ""}`,
    );
  }, [receiptOutcome, route.returnId]);

  return (
    <section className={styles.list}>
      <header>
        <h1 id="project-actions-title" tabIndex={-1}>
          {copy.actionsTitle}
        </h1>
        {listOutcome.kind === "AVAILABLE" ? <p>{listOutcome.project.name}</p> : null}
        <p>{copy.actionsDescription}</p>
      </header>
      {listOutcome.kind === "ACTION_NOT_AUTHORIZED" ? (
        <p className={styles.notice} role="status">
          {reviewStateMessage(copy, listOutcome.kind)}
        </p>
      ) : listOutcome.actions.length === 0 ? (
        <p>{copy.actionsEmpty}</p>
      ) : (
        listOutcome.actions.map((action) => (
          <article key={action.businessKey} className={styles.card}>
            <div>
              <span className={styles.status}>{copy.open}</span>
              <h2 className={styles.receiptTitle}>{action.title}</h2>
            </div>
            <dl className={styles.referenceGrid}>
              <div>
                <dt>{copy.assignee}</dt>
                <dd>{action.assigneeDisplayName ?? copy.unassigned}</dd>
              </div>
              <div>
                <dt>{copy.dueDate}</dt>
                <dd>{action.dueDate ?? copy.noDueDate}</dd>
              </div>
            </dl>
            <div className={styles.actions}>
              <Link
                id={`action-${action.businessKey}`}
                className={styles.secondary}
                href={
                  internalReviewHref(
                    locale,
                    projectKey,
                    action,
                    { actionKey: action.businessKey },
                    "actions",
                  ) as Route
                }
              >
                {copy.openReceipt}
              </Link>
            </div>
          </article>
        ))
      )}
      {receiptOutcome ? (
        <ReviewModal
          locale={locale}
          title={copy.receiptTitle}
          description={copy.receiptDescription}
          onClose={close}
          focusKey={
            receiptOutcome.kind === "AVAILABLE" ? receiptOutcome.receipt.businessKey : "unavailable"
          }
        >
          {receiptOutcome.kind === "AVAILABLE" ? (
            <ActionReceipt receipt={receiptOutcome.receipt} locale={locale} />
          ) : (
            <p className={styles.notice} role="alert">
              {reviewStateMessage(copy, receiptOutcome.kind)}
            </p>
          )}
        </ReviewModal>
      ) : null}
    </section>
  );
}
