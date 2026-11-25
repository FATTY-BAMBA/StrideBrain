// @vitest-environment jsdom
vi.mock("@/modules/quote-comparison/request", () => ({
  requestQuoteComparison: mock.comparison,
}));
vi.mock("@/modules/price-list/request", () => ({
  readQuotePrices: vi.fn().mockResolvedValue({ kind: "AVAILABLE", rows: [], hasMore: false }),
}));
vi.mock("@/app/[locale]/projects/actions", () => ({ updateProjectStageAction: vi.fn() }));
import { JobChatPanel } from "@/components/assistant/job-chat-panel";
import { JobChatStateProvider } from "@/components/assistant/job-chat-state";
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
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
import { quoteIssueCopy } from "@/modules/localization/quote-issue";
const mock = vi.hoisted(() => ({
  pathname: "/en/projects/J-TEST/quote",
  comparison: vi.fn().mockResolvedValue({ kind: "NOT_RUN" }),
  save: vi.fn(),
  issuePrepare: vi.fn(),
  prepare: vi.fn(),
  totals: vi.fn().mockResolvedValue(null),
  mutate: vi.fn().mockResolvedValue({ kind: "ACCEPTED" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => mock.pathname,
}));
vi.mock("@/app/[locale]/home-chat-actions", () => ({ askHomeAction: vi.fn() }));
vi.mock("@/app/[locale]/job-draft-actions", () => ({ draftJobFromHome: vi.fn() }));
vi.mock("@/app/[locale]/projects/[projectKey]/quote/actions", () => ({
  saveQuoteDraftAction: mock.save,
  prepareQuoteDraftAction: mock.prepare,
  previewQuoteTotalsAction: mock.totals,
  quoteDraftEvidenceAction: vi.fn(),
}));
vi.mock("@/app/[locale]/projects/[projectKey]/quote/issue-actions", () => ({
  prepareQuoteIssueAction: mock.issuePrepare,
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
    expect(host.querySelectorAll("#quote-document-save table")).toHaveLength(1);
    expect(host.querySelectorAll("#quote-document-save thead th")).toHaveLength(7);
    expect(host.querySelectorAll("#quote-document-save tbody[data-section]")).toHaveLength(2);
    expect(
      host.querySelector("#quote-document-save tbody tr td:nth-child(2)")?.textContent,
    ).toContain(docCopy.sectionSubtotal);
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

it.each(["en", "zh-TW"] as const)(
  "saves twice without a comparison link in the success message (%s)",
  async (locale) => {
    const initial = view(true);
    mock.save.mockImplementation(async (_locale, raw) => ({
      result: {
        kind: "SAVED",
        versionId: raw.baseVersionId === "version" ? "version-2" : "version-3",
        versionNumber: 2,
        firstSave: false,
        totals: initial.saved!.totals,
      },
      view: {
        ...initial,
        saved: {
          ...initial.saved!,
          id: raw.baseVersionId === "version" ? "version-2" : "version-3",
        },
      },
    }));
    await act(async () =>
      root.render(createElement(QuoteDocumentEditor, { initial, issue: null, locale })),
    );
    for (const baseVersionId of ["version", "version-2"]) {
      await act(async () =>
        host
          .querySelector("#quote-document-save")!
          .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
      );
      const raw = mock.save.mock.calls.at(-1)![1];
      expect(raw.baseVersionId).toBe(baseVersionId);
      expect(Object.keys(raw).sort()).toEqual([
        "baseVersionId",
        "discount",
        "idempotencyKey",
        "preparationToken",
        "projectKey",
        "sections",
      ]);
    }
    expect(mock.prepare).not.toHaveBeenCalled();
    expect(host.textContent).toContain(quoteDraftCopy(locale).saved.replace("{version}", "2"));
    expect(host.textContent).not.toContain(quoteDraftCopy(locale).compare);
  },
);

it("shows a current comparison on opening without adding lines or saving", async () => {
  const preparation = {
    kind: "PREPARED" as const,
    token: "signed",
    preparation: {
      organizationId: "org",
      membershipId: "member",
      projectId: "job",
      baseVersionId: "version",
      comparisonRunId: "run",
      sourceFingerprint: "source",
      permissionFingerprint: "permission",
      calculatedAt: "2026-11-24T00:00:00Z",
      suggestions: [
        {
          categoryId: "DEMOLITION_CEILING",
          basis: {
            policyVersion: "QUOTE-DRAFT-1.0" as const,
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
  };
  await act(async () =>
    root.render(
      createElement(QuoteDocumentEditor, {
        initial: view(),
        issue: null,
        locale: "en",
        preparation,
      }),
    ),
  );
  expect(host.textContent).toContain("NT$300,000");
  expect(host.querySelectorAll("textarea")).toHaveLength(0);
  expect(
    [...host.querySelectorAll("button")].filter(
      (node) => node.textContent === quoteDraftCopy("en").use,
    ),
  ).toHaveLength(1);
  expect(mock.save).not.toHaveBeenCalled();
  expect(mock.prepare).not.toHaveBeenCalled();
});

it.each(["en", "zh-TW"] as const)(
  "gives the row menu and description distinct accessible names (%s)",
  async (locale) => {
    await act(async () =>
      root.render(createElement(QuoteDocumentEditor, { initial: view(true), issue: null, locale })),
    );
    const copy = quoteDocumentCopy(locale);
    expect(host.querySelector(`summary[aria-label="${copy.lineActions} 1.1"]`)).not.toBeNull();
    expect(host.querySelector(`textarea[aria-label="${copy.item} 1.1"]`)).not.toBeNull();
    expect(host.querySelectorAll(`[aria-label="${copy.item} 1.1"]`)).toHaveLength(1);
  },
);

function draftIssue(): IssueView {
  return {
    kind: "AVAILABLE",
    catalog: seededFirmLists,
    latestIssued: null,
    amounts: null,
    projectKey: "J-TEST",
    versionId: "version",
    status: "DRAFT",
    today: "2026-11-25",
    issued: null,
    canIssue: true,
    canRevise: false,
    canAccept: false,
    canResolve: false,
    conflicts: [],
    findings: [],
    warnings: [],
    defaults: { language: "zh-TW", attention: "", validUntil: "2026-12-25", terms: "" },
    termsEn: "",
    termsZhTw: "",
  };
}
it.each(["en", "zh-TW"] as const)(
  "uses document language for an untyped discount and keeps typed text (%s page)",
  async (locale) => {
    const initial = view(true);
    const doc = initial.saved!.document!;
    await act(async () =>
      root.render(
        createElement(QuoteDocumentEditor, {
          initial: {
            ...initial,
            saved: {
              ...initial.saved!,
              document: { ...doc, discount: { amount: "0", label: "" } },
            },
          },
          issue: draftIssue(),
          locale,
        }),
      ),
    );
    const input = host.querySelector('input[maxlength="40"]') as HTMLInputElement;
    const language = [...host.querySelectorAll("select")].find((select) =>
      [...select.options].some((option) => option.value === "en"),
    )!;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("優惠折讓");
    expect(host.querySelector("footer")?.textContent).toContain("優惠折讓");
    await act(async () => {
      language.value = "en";
      language.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(input.placeholder).toBe("Discount");
    expect(host.querySelector("footer")?.textContent).toContain("Discount");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        input,
        "Loyal client",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      language.value = "zh-TW";
      language.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(input.value).toBe("Loyal client");
  },
);
it("reviews item-only section subtotals and shows percentage fees in their rows and the totals block", async () => {
  const doc = quoteDocumentTotals({
    sections: [
      {
        title: "Work",
        categoryId: "CUSTOM_MILLWORK",
        lines: [
          {
            kind: "ITEM",
            description: "Cabinet",
            quantity: "1",
            unit: "lot",
            unitPrice: "1000",
            remark: "",
          },
          { kind: "PERCENTAGE", description: "Supervision", percentage: "8", remark: "" },
        ],
      },
      {
        title: "Design",
        categoryId: "CUSTOM_MILLWORK",
        lines: [{ kind: "PERCENTAGE", description: "Design fee", percentage: "5", remark: "" }],
      },
    ],
    discount: { label: "Discount", amount: "0" },
  });
  mock.issuePrepare.mockResolvedValue({
    kind: "PREPARED",
    token: "signed",
    preparation: {
      blockers: [],
      warnings: ["COMPARISON_OUT_OF_DATE"],
      missingFirmFields: [],
      snapshot: {
        schemaVersion: "QUOTE-DOCUMENT-2.0",
        language: "en",
        documentNumber: "J-TEST-Q1",
        clientName: "Synthetic client",
        clientDetails: { contactPerson: "Contact", address: "Client road", taxId: "12345678" },
        siteAddress: "Site road",
        issueDate: "2026-11-25",
        validUntil: "2026-12-25",
        currency: "TWD",
        lines: [],
        document: doc,
        totals: doc,
        terms: "",
      },
    },
  });
  await act(async () =>
    root.render(createElement(QuoteIssuePanel, { view: draftIssue(), locale: "en" })),
  );
  await act(async () => button(quoteIssueCopy("en").prepare).click());
  expect(host.textContent).toContain(quoteIssueCopy("en").COMPARISON_OUT_OF_DATE);
  expect(button(quoteIssueCopy("en").confirm).disabled).toBe(false);
  const bodies = host.querySelectorAll("table tbody");
  expect(bodies).toHaveLength(2);
  expect(bodies[0]?.querySelector("tr")?.textContent).toContain("NT$1,000");
  expect(bodies[1]?.querySelector("tr")?.textContent).toContain("NT$0");
  expect(host.textContent?.match(/NT\$80(?!\d)/g)).toHaveLength(2);
  expect(host.textContent?.match(/NT\$50(?!\d)/g)).toHaveLength(2);
  expect(host.textContent).toContain("Site road");
  expect(host.textContent).toContain("Client road");
});

it("resets the untyped discount default with the language selector when a saved version refreshes", async () => {
  const initial = view(true);
  const saved = {
    ...initial.saved!,
    document: { ...initial.saved!.document!, discount: { amount: "0", label: "" } },
  };
  const props = { initial: { ...initial, saved }, issue: draftIssue(), locale: "en" as const };
  await act(async () => root.render(createElement(QuoteDocumentEditor, props)));
  const language = [...host.querySelectorAll("select")].find((select) =>
    [...select.options].some((option) => option.value === "en"),
  )!;
  await act(async () => {
    language.value = "en";
    language.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(host.querySelector("footer")?.textContent).toContain("Discount");
  await act(async () =>
    root.render(
      createElement(QuoteDocumentEditor, {
        ...props,
        issue: { ...props.issue, versionId: "new-version" },
      }),
    ),
  );
  const resetLanguage = [...host.querySelectorAll("select")].find((select) =>
    [...select.options].some((option) => option.value === "en"),
  )!;
  expect(resetLanguage.value).toBe("zh-TW");
  expect(host.querySelector("footer")?.textContent).toContain("優惠折讓");
});

it("keeps save available while comparison loading or Run is pending, then retains editing after a failure", async () => {
  let resolveRead!: (value: unknown) => void, resolveRun!: (value: unknown) => void;
  mock.comparison.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveRead = resolve;
      }),
  );
  await act(async () =>
    root.render(
      createElement(QuoteDocumentEditor, { initial: view(true), issue: null, locale: "en" }),
    ),
  );
  expect(host.textContent).toContain("Loading comparison…");
  expect(button(quoteDraftCopy("en").save).disabled).toBe(false);
  await act(async () => resolveRead({ kind: "NOT_RUN" }));
  mock.comparison.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveRun = resolve;
      }),
  );
  await act(async () => button("Run comparison").click());
  expect(host.textContent).toContain("Running comparison…");
  expect(button(quoteDraftCopy("en").save).disabled).toBe(false);
  expect(host.querySelector<HTMLTextAreaElement>("textarea")!.disabled).toBe(false);
  expect(mock.comparison).toHaveBeenLastCalledWith("en", "J-TEST", "RUN");
  await act(async () => resolveRun({ kind: "UNAVAILABLE" }));
  expect(host.textContent).toContain(
    "Comparison is unavailable. You can keep working on the quote.",
  );
  expect(button(quoteDraftCopy("en").save).disabled).toBe(false);
  expect(mock.save).not.toHaveBeenCalled();
});

it.each(["en", "zh-TW"] as const)(
  "shows findings once in the comparison panel, retaining issue reminders (%s)",
  async (locale) => {
    const claim: IssueView["findings"][number] = {
      claimKey: "programme",
      titleEn: "Programme",
      titleZhTw: "工期",
      kind: "PROGRAMME_DIFFERENCE_UNQUANTIFIED",
      value: {},
      evidenceReferenceIds: [],
      warningCodes: [],
    };
    const sentence = claimFindingText(claim, locale, seededFirmLists.workCategories)!;
    mock.comparison.mockResolvedValueOnce({
      kind: "CURRENT",
      generatedAt: "2026-11-25",
      href: `/${locale}/projects/J-TEST/compare`,
      jobs: [],
      findings: [{ sentence, href: `/${locale}/projects/J-TEST/compare?evidenceClaim=programme` }],
    });
    await act(async () =>
      root.render(
        createElement(QuoteDocumentEditor, {
          initial: view(true),
          issue: { ...draftIssue(), findings: [claim] },
          locale,
        }),
      ),
    );
    expect(host.textContent?.split(sentence)).toHaveLength(2);
    expect(host.querySelector("#quote-issue")?.textContent).not.toContain(sentence);
    expect(host.textContent).not.toContain(quoteIssueCopy(locale).findings);
  },
);

it.each(["en", "zh-TW"] as const)(
  "shares the editor's dirty flag with the chat, clears after save and on leaving quote (%s)",
  async (locale) => {
    mock.pathname = `/${locale}/projects/J-TEST/quote`;
    const initial = view(true);
    const line = locale === "en" ? "Answers use the last saved draft." : "回答依據最後儲存的草稿。";
    const draw = (showEditor = true) =>
      createElement(JobChatStateProvider, null, [
        createElement(JobChatPanel, { key: "chat", locale, projectKey: "J-TEST" }),
        showEditor
          ? createElement(QuoteDocumentEditor, { key: "editor", initial, issue: null, locale })
          : createElement("p", { key: "other" }, "Other tab"),
      ]);
    await act(() => root.render(draw()));
    const toggle = host.querySelector<HTMLButtonElement>("button[aria-controls]")!;
    await act(() => toggle.click());
    expect(host.textContent).not.toContain(line);
    const form = host.querySelector<HTMLFormElement>('form:has(textarea[name="message"])')!;
    expect(form.querySelector('input[name="projectKey"]')?.getAttribute("value")).toBe("J-TEST");
    const edit = async () => {
      const field = host.querySelector<HTMLTextAreaElement>("#quote-document-save textarea")!;
      await act(() => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
          field,
          "Edited work",
        );
        field.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };
    await edit();
    const notice = form.querySelector('[role="status"]');
    expect(notice?.textContent).toBe(line);
    expect(notice?.nextElementSibling).toBe(form.querySelector('textarea[name="message"]'));
    // Failed saves keep the existing dirty state and the notice.
    mock.save.mockResolvedValue({ result: { kind: "UNAVAILABLE" } });
    await act(() =>
      host
        .querySelector("#quote-document-save")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(form.textContent).toContain(line);
    mock.save.mockImplementation(async (_locale, raw) => ({
      result: {
        kind: "SAVED",
        versionId: "version-2",
        versionNumber: 2,
        firstSave: false,
        totals: initial.saved!.totals,
      },
      view: {
        ...initial,
        saved: {
          ...initial.saved!,
          id: "version-2",
          document: { ...initial.saved!.document!, sections: raw.sections, discount: raw.discount },
        },
      },
    }));
    await act(() =>
      host
        .querySelector("#quote-document-save")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(form.textContent).not.toContain(line);
    const raw = mock.save.mock.calls.at(-1)![1];
    expect(raw).not.toHaveProperty("dirty");
    expect(raw).not.toHaveProperty("quoteHasUnsavedChanges");
    // A fresh edit followed by leaving the editor clears the in-memory notice.
    await act(() => button(quoteDocumentCopy(locale).addItem).click());
    expect(form.textContent).toContain(line);
    mock.pathname = `/${locale}/projects/J-TEST/actions`;
    await act(() => root.render(draw(false)));
    await act(() => toggle.click());
    expect(form.textContent).not.toContain(line);
  },
);
