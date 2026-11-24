import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { jobContext } from "../projects/job-fixture";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import PricesPage from "@/app/[locale]/quotes/prices/page";
import { QuoteListNav } from "@/components/quotes/quote-list-nav";
const mock = vi.hoisted(() => ({ context: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/server/runtime-context", () => ({ resolveServerRuntimeContext: mock.context }));
vi.mock("@/lib/server/price-list-services", () => ({
  createPriceListService: () => ({ execute: mock.read }),
}));
vi.mock("@/app/[locale]/quotes/prices/actions", () => ({ readQuotePricesAction: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw Error("NOT_FOUND");
  },
}));
it("refuses the Viewer page before reading prices and hides its navigation link", async () => {
  mock.context.mockResolvedValue(
    jobContext({ role: "VIEWER", capabilities: roleBundle("VIEWER") }),
  );
  await expect(
    PricesPage({ params: Promise.resolve({ locale: "zh-TW" }), searchParams: Promise.resolve({}) }),
  ).rejects.toThrow("NOT_FOUND");
  expect(mock.read).not.toHaveBeenCalled();
  expect(
    renderToStaticMarkup(
      createElement(QuoteListNav, { locale: "zh-TW", active: "quotes", canReadPrices: false }),
    ),
  ).not.toContain("/quotes/prices");
});
it.each(["en", "zh-TW"] as const)(
  "renders the read-only list, exact source link, count, search and paging in %s",
  async (locale) => {
    mock.context.mockResolvedValue(jobContext());
    mock.read.mockResolvedValue({
      kind: "AVAILABLE",
      hasMore: true,
      rows: [
        {
          description: "天花板",
          unit: "坪",
          unitPrice: "3800",
          currency: "TWD",
          issuedOn: "2026-11-27",
          documentNumber: "Q2",
          versionId: "v2",
          projectKey: "J2",
          projectName: "Synthetic job",
          clientName: "Synthetic client",
          timesQuoted: 2,
        },
      ],
    });
    const html = renderToStaticMarkup(
      await PricesPage({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({ search: "天花", page: "2" }),
      }),
    );
    expect(html).toContain("NT$3,800");
    expect(html).toContain("/api/quotes/v2/pdf");
    expect(html).toContain("2026-11-27");
    expect(html).toContain("page=3");
    expect(html).toContain("page=1");
    expect(html).not.toContain("contenteditable");
    expect(html).not.toContain("Use this price");
    expect(mock.read).toHaveBeenCalledWith(expect.objectContaining({ locale }), {
      mode: "LIST",
      search: "天花",
      unit: "",
      page: 2,
      projectKey: null,
    });
  },
);
