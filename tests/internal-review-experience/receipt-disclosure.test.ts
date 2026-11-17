// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReceiptDTO, ReceiptOutcome } from "@/modules/internal-review/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { getInternalReviewCopy } from "@/modules/internal-review-experience/copy";
import { parseInternalReviewRoute } from "@/modules/internal-review-experience/route-state";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en/projects/PRJ-XINYI-026/actions",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    onNavigate: _onNavigate,
    ...props
  }: {
    children: ReactNode;
    onNavigate?: unknown;
  }) => {
    void _onNavigate;
    return createElement("a", props, children);
  },
}));

import { ProjectActions } from "@/components/internal-review/project-actions";
import { InternalReviewController } from "@/components/internal-review/internal-review-controller";

const receipt: ReceiptDTO = {
  version: "action-receipt.v1",
  businessKey: "action_private",
  timezone: "Asia/Taipei",
  title: "Private action title",
  rationale: "Private rationale",
  project: { projectKey: "PRJ-PRIVATE", name: "Private project" },
  assigneeDisplayName: "Private assignee",
  dueDate: "2026-12-20",
  status: "OPEN",
  createdAt: "2026-11-17T00:00:00Z",
  createdByDisplay: "Private creator",
  comparisonRunId: "private-comparison",
  enrichmentRunId: "private-economics",
  evidenceCount: 987,
  returnContext: { selectedProjectKeys: [] },
};

function renderReceipt(
  surface: "actions" | "comparison",
  locale: Locale,
  selector: string,
  receiptOutcome?: ReceiptOutcome,
) {
  const route = { ...parseInternalReviewRoute({}), actionKey: selector };
  const element =
    surface === "actions"
      ? createElement(ProjectActions, {
          locale,
          projectKey: "PRJ-XINYI-026",
          route,
          receiptOutcome,
          listOutcome: { kind: "ACTION_NOT_AUTHORIZED", requestId: "safe" },
        })
      : createElement(InternalReviewController, {
          locale,
          projectKey: "PRJ-XINYI-026",
          route,
          receiptOutcome,
          comparisonRunId: "",
          enrichmentRunId: "",
          canPrepare: false,
          returnContext: { selectedProjectKeys: [] },
          evidenceActive: false,
          onEvidence: vi.fn(),
        });
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(element);
  return host.querySelector<HTMLElement>('[role="dialog"]')!;
}

describe.each(["actions", "comparison"] as const)(
  "QA-07/08 receipt non-disclosure: %s",
  (surface) => {
    describe.each(["en", "zh-TW"] as const)("%s", (locale) => {
      it("shows success and details only for an authorized loaded receipt", () => {
        const dialog = renderReceipt(surface, locale, receipt.businessKey, {
          kind: "AVAILABLE",
          receipt,
        });
        const copy = getInternalReviewCopy(locale);
        expect(dialog.textContent).toContain(copy.receiptTitle);
        expect(dialog.textContent).toContain(copy.receiptDescription);
        expect(dialog.textContent).toContain(receipt.title);
        expect(dialog.textContent).toContain(receipt.assigneeDisplayName);
        expect(dialog.textContent).toContain(String(receipt.evidenceCount));
        expect(dialog.textContent).not.toContain(copy.receiptUnavailableTitle);
      });
      it("renders identical neutral markup for missing, denied, cross-tenant and unavailable DTOs", () => {
        const copy = getInternalReviewCopy(locale);
        const variants = [
          { selector: "missing", outcome: undefined },
          { selector: "missing", outcome: { kind: "ACTION_NOT_AUTHORIZED", requestId: "missing" } },
          {
            selector: receipt.businessKey,
            outcome: { kind: "ACTION_NOT_AUTHORIZED", requestId: "denied" },
          },
          {
            selector: "cross-tenant",
            outcome: { kind: "ACTION_NOT_AUTHORIZED", requestId: "foreign" },
          },
          // Defensive: even a malformed unavailable DTO must never announce success.
          { selector: "unavailable", outcome: { kind: "AVAILABLE", receipt: undefined } },
          {
            selector: "denied-extra-data",
            outcome: { kind: "ACTION_NOT_AUTHORIZED", requestId: "safe", receipt },
          },
        ];
        const markup = variants.map(({ selector, outcome }) => {
          const dialog = renderReceipt(
            surface,
            locale,
            selector,
            outcome as ReceiptOutcome | undefined,
          );
          expect(dialog.querySelectorAll("h2")).toHaveLength(1);
          expect(dialog.querySelector("h2")!.textContent).toBe(copy.receiptUnavailableTitle);
          expect(dialog.querySelector("#internal-review-description")!.textContent).toBe(
            copy.receiptUnavailableDescription,
          );
          expect(dialog.getAttribute("aria-labelledby")).toBe("internal-review-heading");
          expect(dialog.getAttribute("aria-describedby")).toBe("internal-review-description");
          for (const forbidden of [
            copy.receiptTitle,
            copy.receiptDescription,
            copy.replayTitle,
            copy.replayDescription,
            receipt.title,
            receipt.rationale,
            receipt.project.name,
            receipt.assigneeDisplayName!,
            receipt.createdByDisplay,
            copy.evidenceCount,
            String(receipt.evidenceCount),
          ])
            expect(dialog.textContent).not.toContain(forbidden);
          return dialog.outerHTML;
        });
        expect(new Set(markup).size).toBe(1);
      });
    });
  },
);
