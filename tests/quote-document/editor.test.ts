// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { QuoteDocumentEditor } from "@/components/quote-document/quote-document-editor";
import { QuoteIssuePanel, type IssueView } from "@/components/quote-issue/quote-issue-panel";
import { seededFirmLists } from "@/fixtures/firm-lists";
import { quoteDocumentTotals, quoteCategoryTotals } from "@/modules/finance/quote-totals";
import type { QuoteDraftView } from "@/modules/quote-draft/application/get-quote-draft";
import { quoteDocumentCopy } from "@/modules/localization/quote-document";
import { quoteDraftCopy } from "@/modules/localization/quote-draft";
import { quoteIssueCopy } from "@/modules/localization/quote-issue";
const mock = vi.hoisted(() => ({
  save: vi.fn(),
  prepare: vi.fn(),
  totals: vi.fn().mockResolvedValue(null),
  mutate: vi.fn().mockResolvedValue({ kind: "ACCEPTED" }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/[locale]/projects/[projectKey]/quote/actions", () => ({
  saveQuoteDraftAction: mock.save,
  prepareQuoteDraftAction: mock.prepare,
  previewQuoteTotalsAction: mock.totals,
  quoteDraftEvidenceAction: vi.fn(),
}));
vi.mock("@/app/[locale]/projects/[projectKey]/quote/issue-actions", () => ({
  prepareQuoteIssueAction: vi.fn(),
  quoteIssueMutationAction: mock.mutate,
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const host = document.createElement("div");
document.body.append(host);
let root = createRoot(host);
afterEach(async () => {
  await act(async () => root.unmount());
  host.replaceChildren();
  root = createRoot(host);
  vi.clearAllMocks();
});
function view(withLines = false): Extract<QuoteDraftView, { kind: "AVAILABLE" }> {
  const doc = quoteDocumentTotals({
    sections: [
      {
        id: "one",
        title: "拆除",
        categoryId: "DEMOLITION_CEILING",
        lines: withLines
          ? [
              {
                kind: "ITEM",
                description: "拆除工程",
                quantity: "1",
                unit: "式",
                unitPrice: "1000",
                remark: "",
              },
            ]
          : [],
      },
      { id: "two", title: "天花板", categoryId: "DEMOLITION_CEILING", lines: [] },
    ],
    discount: { label: "Discount", amount: "0" },
  });
  return {
    kind: "AVAILABLE",
    canReadAmounts: true,
    canDraft: true,
    job: {
      id: "job",
      organizationId: "org",
      businessKey: "J-TEST",
      name: "Synthetic job",
      stage: "QUOTE_REVIEW",
      area: "100",
      areaUnit: "m2",
      currency: "TWD",
      catalog: seededFirmLists,
      scopeCategoryIds: ["SELECTIVE_DEMOLITION", "PARTITIONS_CEILINGS"],
      commercialCategoryIds: ["DEMOLITION_CEILING"],
    },
    categoryTotals: quoteCategoryTotals(doc),
    saved: {
      id: "version",
      quoteId: "quote",
      versionNumber: 1,
      status: "DRAFT",
      currency: "TWD",
      document: doc,
      totals: doc,
      lines: [],
    },
  };
}
function button(text: string) {
  const found = [...host.querySelectorAll("button")].find((node) => node.textContent === text);
  expect(found).toBeDefined();
  return found!;
}
it.each(["en", "zh-TW"] as const)(
  "shows one combined reference and only inserts on explicit Use into an empty category (%s)",
  async (locale) => {
    const copy = quoteDraftCopy(locale),
      docCopy = quoteDocumentCopy(locale);
    mock.prepare.mockResolvedValue({
      kind: "PREPARED",
      token: "signed",
      preparation: {
        suggestions: [
          {
            categoryId: "DEMOLITION_CEILING",
            basis: {
              policyVersion: "QUOTE-DRAFT-1.0",
              calculatedAt: "2026-11-24T00:00:00Z",
              area: "100",
              areaUnit: "m2",
              scopeCategoryIds: ["SELECTIVE_DEMOLITION", "PARTITIONS_CEILINGS"],
              count: 3,
              requiredCount: 3,
              suggestedAmount: "300000.00",
              evidenceReferenceIds: [],
              conflictEvidenceIds: [],
            },
          },
        ],
      },
    });
    await act(async () =>
      root.render(createElement(QuoteDocumentEditor, { initial: view(), issue: null, locale })),
    );
    await act(async () => button(copy.refresh).click());
    expect(host.querySelectorAll('textarea[aria-label^="' + docCopy.item + ' "]')).toHaveLength(0);
    expect(host.textContent).toContain(
      docCopy.combined.replace("{sections}", locale === "zh-TW" ? "拆除、天花板" : "拆除, 天花板"),
    );
    expect(
      [...host.querySelectorAll("button")].filter((node) => node.textContent === copy.use),
    ).toHaveLength(1);
    await act(async () => button(copy.use).click());
    expect(host.querySelectorAll('textarea[aria-label^="' + docCopy.item + ' "]')).toHaveLength(1);
    expect([...host.querySelectorAll("input")].some((input) => input.value === "300000.00")).toBe(
      true,
    );
    expect([...host.querySelectorAll("button")].some((node) => node.textContent === copy.use)).toBe(
      false,
    );
    expect(mock.save).not.toHaveBeenCalled();
    expect(host.textContent).toContain(docCopy.unsaved);
  },
);
it("does not offer Use when any mapped section already has a line", async () => {
  await act(async () =>
    root.render(
      createElement(QuoteDocumentEditor, { initial: view(true), issue: null, locale: "en" }),
    ),
  );
  await act(async () => button(quoteDraftCopy("en").refresh).click());
  expect(host.textContent).toContain("NT$1,000");
  expect(
    [...host.querySelectorAll("button")].some(
      (node) => node.textContent === quoteDraftCopy("en").use,
    ),
  ).toBe(false);
});
it("shows Viewer descriptions without financial controls or totals", async () => {
  const initial = { ...view(), saved: null };
  await act(async () =>
    root.render(
      createElement(QuoteDocumentEditor, {
        initial: {
          ...initial,
          canReadAmounts: false,
          canDraft: false,
          categoryTotals: [],
          structure: {
            versionNumber: 1,
            status: "FINAL",
            sections: [
              {
                title: "Work",
                categoryId: null,
                lines: [{ kind: "ITEM", description: "Visible work", quantity: "1", unit: "式" }],
              },
            ],
          },
        },
        issue: null,
        locale: "en",
      }),
    ),
  );
  expect(host.textContent).toContain("Visible work");
  expect(host.textContent).not.toContain("NT$");
  expect(host.querySelectorAll("input")).toHaveLength(0);
});
it("requires acceptance confirmation with document, client and total; Cancel never writes", async () => {
  const locale = "en",
    copy = quoteIssueCopy(locale),
    doc = quoteDocumentCopy(locale);
  const issue: IssueView = {
    kind: "AVAILABLE",
    catalog: seededFirmLists,
    latestIssued: null,
    amounts: null,
    projectKey: "JOB",
    versionId: "version",
    status: "ISSUED",
    today: "2026-11-24",
    issued: {
      id: "version",
      status: "ISSUED",
      documentNumber: "Q-TEST",
      validUntil: "2026-12-24",
      acceptedOn: null,
      clientName: "Test client",
      currency: "TWD",
      totalAmount: "336000.00",
    },
    canIssue: false,
    canRevise: false,
    canAccept: true,
    canResolve: false,
    conflicts: [],
    findings: [],
    warnings: [],
    defaults: { language: "zh-TW", attention: "", validUntil: "2026-12-24", terms: "" },
    termsEn: "",
    termsZhTw: "",
  };
  await act(async () => root.render(createElement(QuoteIssuePanel, { view: issue, locale })));
  await act(async () => button(copy.accept).click());
  expect(host.textContent).toContain(
    "Record acceptance of Q-TEST for Test client, total NT$336,000?",
  );
  expect(mock.mutate).not.toHaveBeenCalled();
  await act(async () => button(doc.cancel).click());
  expect(mock.mutate).not.toHaveBeenCalled();
  await act(async () => button(copy.accept).click());
  await act(async () => button(doc.confirm).click());
  expect(mock.mutate).toHaveBeenCalledTimes(1);
  expect(mock.mutate).toHaveBeenCalledWith(
    "en",
    "accept",
    expect.objectContaining({ projectKey: "JOB", versionId: "version" }),
  );
});
