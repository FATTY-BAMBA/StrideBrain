import { seededFirmLists } from "@/fixtures/firm-lists";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { QuoteIssuePanel, type IssueView } from "@/components/quote-issue/quote-issue-panel";
import { quoteIssueCopy } from "@/modules/localization/quote-issue";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/[locale]/projects/[projectKey]/quote/issue-actions", () => ({
  prepareQuoteIssueAction: vi.fn(),
  quoteIssueMutationAction: vi.fn(),
}));
vi.mock("@/app/[locale]/projects/[projectKey]/quote/actions", () => ({
  quoteDraftEvidenceAction: vi.fn(),
}));
it.each(["en", "zh-TW"] as const)(
  "matches the issued note to acceptance and the actual Revise button (%s)",
  (locale) => {
    const copy = quoteIssueCopy(locale);
    const view: IssueView = {
      catalog: seededFirmLists,
      kind: "AVAILABLE",
      latestIssued: null,
      amounts: null,
      projectKey: "J-2611-A7K3",
      versionId: "version",
      status: "ISSUED",
      today: "2026-11-22",
      issued: {
        id: "version",
        status: "ISSUED",
        documentNumber: "J-2611-A7K3-Q1",
        validUntil: "2026-12-22",
        acceptedOn: null,
      },
      canIssue: false,
      canRevise: true,
      canAccept: false,
      canResolve: false,
      conflicts: [],
      findings: [],
      warnings: [],
      defaults: { language: "zh-TW", validUntil: "2026-12-22", attention: "", terms: "" },
      termsEn: "",
      termsZhTw: "",
    };
    const html = (value: IssueView) =>
      renderToStaticMarkup(createElement(QuoteIssuePanel, { view: value, locale }));
    expect(html(view)).toContain(copy.end);
    expect(html(view)).toContain(`>${copy.revise}</button>`);
    for (const restricted of [
      { ...view, canRevise: false },
      { ...view, status: "DRAFT" },
    ]) {
      expect(html(restricted)).toContain(copy.fixedDocument);
      expect(html(restricted)).not.toContain(copy.revise);
    }
    const accepted = html({
      ...view,
      status: "ACCEPTED",
      issued: { ...view.issued!, status: "ACCEPTED", acceptedOn: "2026-11-21" },
    });
    expect(accepted).toContain(copy.acceptedDocument.replace("{date}", "2026-11-21"));
    expect(accepted).not.toContain(copy.revise);
  },
);
