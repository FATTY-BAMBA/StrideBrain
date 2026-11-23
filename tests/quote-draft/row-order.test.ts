import { seededFirmLists } from "@/fixtures/firm-lists";
// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { QuoteDraftWorkspace } from "@/components/quote-draft/quote-draft-workspace";
import { COMMERCIAL_CATEGORIES, SCOPE_CATEGORIES } from "@/fixtures/firm-lists";
import { quoteDraftCopy } from "@/modules/localization/quote-draft";
import type { QuoteDraftView } from "@/modules/quote-draft/application/get-quote-draft";
const mock = vi.hoisted(() => ({ prepare: vi.fn(), totals: vi.fn().mockResolvedValue(null) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/[locale]/projects/[projectKey]/quote/actions", () => ({
  prepareQuoteDraftAction: mock.prepare,
  previewQuoteTotalsAction: mock.totals,
  saveQuoteDraftAction: vi.fn(),
  quoteDraftEvidenceAction: vi.fn(),
}));
vi.mock("@/app/[locale]/projects/actions", () => ({ updateProjectStageAction: vi.fn() }));
it.each(["en", "zh-TW"] as const)(
  "keeps saved, prepared and refreshed editor rows in work order (%s)",
  async (locale) => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const initial: Extract<QuoteDraftView, { kind: "AVAILABLE" }> = {
      kind: "AVAILABLE",
      canDraft: true,
      canReadAmounts: true,
      job: {
        catalog: seededFirmLists,
        id: "job",
        organizationId: "org",
        businessKey: "JOB",
        name: "Synthetic job",
        stage: "QUOTE_REVIEW",
        area: "100",
        areaUnit: "m2",
        currency: "TWD",
        scopeCategoryIds: SCOPE_CATEGORIES,
        commercialCategoryIds: COMMERCIAL_CATEGORIES,
      },
      saved: {
        id: "version",
        quoteId: "quote",
        versionNumber: 1,
        status: "DRAFT",
        currency: "TWD",
        totals: { amountBeforeTax: "6000.00", taxAmount: "300.00", totalAmount: "6300.00" },
        lines: [...COMMERCIAL_CATEGORIES].sort().map((categoryId) => ({
          id: categoryId,
          categoryId,
          description: categoryId,
          amount: "1000.00",
          recorded: null,
          enteredBy: null,
          basisUnavailable: false,
          basisOutOfDate: false,
          openConflict: false,
        })),
      },
    };
    mock.prepare.mockResolvedValue({
      kind: "PREPARED",
      token: "signed",
      preparation: {
        suggestions: [...COMMERCIAL_CATEGORIES].reverse().map((categoryId) => ({
          categoryId,
          basis: {
            policyVersion: "QUOTE-DRAFT-1.0",
            calculatedAt: "2026-11-22T00:00:00Z",
            area: "100",
            areaUnit: "m2",
            scopeCategoryIds: SCOPE_CATEGORIES,
            count: 0,
            requiredCount: 3,
            evidenceReferenceIds: [],
            conflictEvidenceIds: [],
          },
        })),
      },
    });
    for (const saved of [initial.saved, null]) {
      const host = document.createElement("div"),
        root = createRoot(host);
      document.body.append(host);
      try {
        await act(async () =>
          root.render(
            createElement(QuoteDraftWorkspace, { initial: { ...initial, saved }, locale }),
          ),
        );
        const order = () =>
          [...host.querySelectorAll("h2[id^='category-']")].map((node) => node.id.slice(9));
        if (saved) expect(order()).toEqual(COMMERCIAL_CATEGORIES);
        const text = saved ? quoteDraftCopy(locale).refresh : quoteDraftCopy(locale).draft;
        const button = [...host.querySelectorAll("button")].find(
          (node) => node.textContent === text,
        )!;
        expect(button).toBeDefined();
        await act(async () => button.click());
        expect(order()).toEqual(COMMERCIAL_CATEGORIES);
        if (saved)
          expect(
            [...host.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]')].map(
              (node) => node.value,
            ),
          ).toEqual(Array(6).fill("1000.00"));
      } finally {
        await act(async () => root.unmount());
        host.remove();
      }
    }
  },
);
