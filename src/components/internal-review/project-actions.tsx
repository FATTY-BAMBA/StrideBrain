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
import { PageHeader } from "@/components/ui/page-header";
import { Table, NameCell } from "@/components/ui/table";
import styles from "@/components/ui/ui.module.css";

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
  const receipt = receiptOutcome?.kind === "AVAILABLE" ? receiptOutcome.receipt : null;
  const close = useCallback(() => {
    const href = receipt
      ? internalReviewHref(locale, projectKey, receipt, {}, "actions")
      : projectActionsHref(locale, projectKey);
    router.push(
      `${href}${route.actionKey ? `${href.includes("?") ? "&" : "?"}reviewReturn=${encodeURIComponent(route.actionKey)}` : ""}` as Route,
      { scroll: false },
    );
  }, [locale, projectKey, receipt, route.actionKey, router]);

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
    <section className={styles.page}>
      <PageHeader
        id="project-actions-title"
        context={listOutcome.kind === "AVAILABLE" ? listOutcome.project.name : "StrideBrain"}
        title={copy.actionsTitle}
        description={copy.actionsDescription}
      />
      {listOutcome.kind === "ACTION_NOT_AUTHORIZED" ? (
        <p className={styles.notice} role="status">
          {reviewStateMessage(copy, listOutcome.kind)}
        </p>
      ) : listOutcome.actions.length === 0 ? (
        <p>{copy.actionsEmpty}</p>
      ) : (
        <Table
          caption={copy.actionsTitle}
          headings={[
            { label: copy.actionsTitle },
            { label: copy.assignee },
            { label: copy.dueDate },
            { label: copy.openReceipt, action: true },
          ]}
        >
          {listOutcome.actions.map((action) => (
            <tr key={action.businessKey}>
              <NameCell>
                {action.title}
                <span className={styles.marker}>{copy.open}</span>
              </NameCell>
              <td>{action.assigneeDisplayName ?? copy.unassigned}</td>
              <td>{action.dueDate ?? copy.noDueDate}</td>
              <td className={styles.rowAction}>
                <Link
                  id={`action-${action.businessKey}`}
                  className={styles.rowLink}
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
              </td>
            </tr>
          ))}
        </Table>
      )}
      {receiptOutcome || route.actionKey ? (
        <ReviewModal
          locale={locale}
          title={receipt ? copy.receiptTitle : copy.receiptUnavailableTitle}
          description={receipt ? copy.receiptDescription : copy.receiptUnavailableDescription}
          onClose={close}
          focusKey={receipt ? receipt.businessKey : "unavailable"}
        >
          {receipt ? <ActionReceipt receipt={receipt} locale={locale} /> : null}
        </ReviewModal>
      ) : null}
    </section>
  );
}
