import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuoteListTable } from "@/components/quotes/quote-list-table";
import { expect, it, vi } from "vitest";
import {
  currentQuoteRow,
  quoteListSearch,
  type QuoteListVersion,
} from "@/modules/quotes/domain/quote-list";
import { ListQuotes } from "@/modules/quotes/application/list-quotes";
import { jobContext } from "../projects/job-fixture";
const version = (
  versionNumber: number,
  status: string,
  totalAmount = "105.00",
): QuoteListVersion => ({
  versionNumber,
  status,
  totalAmount,
  currency: "TWD",
  documentNumber: status === "DRAFT" ? null : `Q-${versionNumber}`,
  issuedAt: status === "DRAFT" ? null : "2026-11-24T00:00:00Z",
  createdAt: "2026-11-23T00:00:00Z",
});
it("keeps one issued row and its amounts while a newer revision is in draft", () => {
  expect(
    currentQuoteRow([
      version(1, "SUPERSEDED"),
      version(2, "ISSUED"),
      version(3, "DRAFT", "210.00"),
    ]),
  ).toEqual({
    status: "ISSUED",
    documentNumber: "Q-2",
    currency: "TWD",
    totalAmount: "105.00",
    date: "2026-11-24T00:00:00Z",
    revisionInDraft: true,
  });
  expect(currentQuoteRow([version(2, "ACCEPTED"), version(1, "ISSUED")])?.status).toBe("ACCEPTED");
});
it.each(["DRAFT", "INTERNAL_REVIEW", "FINAL"])(
  "keeps the unissued %s status with its creation date and no document number",
  (status) => {
    expect(currentQuoteRow([version(2, status)])).toMatchObject({
      status,
      documentNumber: null,
      date: "2026-11-23T00:00:00Z",
      revisionInDraft: false,
    });
    expect(currentQuoteRow([version(1, "SUPERSEDED")])).toBeNull();
  },
);
it("never adds an amount when it was not read", () => {
  const { totalAmount: omitted, ...v } = version(1, "ISSUED");
  expect(omitted).toBeDefined();
  expect(currentQuoteRow([v])).not.toHaveProperty("totalAmount");
});
it("bounds filters and blocks missing capabilities before reading", async () => {
  expect(quoteListSearch({ status: "SUPERSEDED", page: 1 })).toBeNull();
  expect(quoteListSearch({ status: null, page: 0 })).toBeNull();
  const list = vi.fn();
  const service = new ListQuotes({ list });
  expect(
    await service.execute({ ...jobContext(), capabilities: new Set() }, { status: null, page: 1 }),
  ).toEqual({ kind: "UNAVAILABLE" });
  expect(
    await service.execute(
      { ...jobContext(), capabilities: new Set(["project:read"]) },
      { status: null, page: 1, clientKey: "CLIENT-01" },
    ),
  ).toEqual({ kind: "UNAVAILABLE" });
  expect(list).not.toHaveBeenCalled();
});

it.each(["DRAFT", "INTERNAL_REVIEW", "FINAL"])(
  "marks a newer %s version as a revision while preserving the issued row",
  (status) => {
    expect(currentQuoteRow([version(2, "ISSUED"), version(3, status, "210.00")])).toMatchObject({
      status: "ISSUED",
      totalAmount: "105.00",
      revisionInDraft: true,
    });
  },
);
it("offers all five real statuses and preserves superseded exclusion", () => {
  for (const status of ["DRAFT", "INTERNAL_REVIEW", "ISSUED", "ACCEPTED", "FINAL"])
    expect(quoteListSearch({ status, page: 1 })?.status).toBe(status);
  expect(currentQuoteRow([version(2, "ISSUED"), version(3, "SUPERSEDED")])?.revisionInDraft).toBe(
    false,
  );
});

it.each(["en", "zh-TW"] as const)(
  "renders Final and Internal review with no Viewer amount in %s",
  (locale) => {
    const rows = ["FINAL", "INTERNAL_REVIEW"].map((status, i) => {
      const v = version(1, status);
      const { totalAmount: omitted, ...visible } = v;
      expect(omitted).toBeDefined();
      return {
        ...currentQuoteRow([visible])!,
        quoteKey: `Q-${i}`,
        projectKey: `J-${i}`,
        projectName: "Synthetic job",
        clientName: "Synthetic client",
      };
    });
    const html = renderToStaticMarkup(createElement(QuoteListTable, { rows, locale }));
    expect(html).toContain(locale === "en" ? "Final" : "定稿");
    expect(html).toContain(locale === "en" ? "In internal review" : "內部審查中");
    expect(html).not.toContain("NT$");
  },
);
