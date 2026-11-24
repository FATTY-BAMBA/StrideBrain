import { writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { renderQuotePdf } from "@/modules/quote-issue/infrastructure/render-quote-pdf";
import { quoteDocumentTotals } from "@/modules/finance/quote-totals";
import type { QuoteDocumentSnapshotV2 } from "@/modules/quote-issue/domain/contracts";
import type { Locale } from "@/modules/localization/config";
function sample(language: Locale): QuoteDocumentSnapshotV2 {
  const document = quoteDocumentTotals({
    sections: [
      {
        title: "木作工程 / Millwork",
        categoryId: "CUSTOM_MILLWORK",
        lines: [
          {
            kind: "ITEM",
            description: "天花板 / Ceiling",
            quantity: "30",
            unit: "坪",
            unitPrice: "3500",
            remark: "依現場尺寸 / Site dimensions",
          },
          {
            kind: "ITEM",
            description: "系統櫃 / Cabinetry",
            quantity: "1",
            unit: "式",
            unitPrice: "180000",
            remark: "",
          },
        ],
      },
      {
        title: "水電工程 / Electrical",
        categoryId: "LIGHTING_ELECTRICAL",
        lines: [
          {
            kind: "ITEM",
            description: "插座 / Outlets",
            quantity: "12",
            unit: "個",
            unitPrice: "1250",
            remark: "合成規格 / Synthetic specification",
          },
          { kind: "NOTE", description: "施工前複核尺寸 / Verify dimensions before work." },
        ],
      },
      {
        title: "費用 / Fees",
        categoryId: null,
        lines: [
          {
            kind: "PERCENTAGE",
            description: "監工管理費 / Supervision",
            percentage: "8",
            remark: "不含折讓 / Before discount",
          },
        ],
      },
    ],
    discount: { label: language === "zh-TW" ? "優惠折讓" : "Discount", amount: "4000" },
  });
  return {
    schemaVersion: "QUOTE-DOCUMENT-2.0",
    language,
    firm: {
      legalName: language === "zh-TW" ? "禾序空間設計（合成公司）" : "Horizon Atelier (synthetic)",
      taxId: "00000000",
      address: "臺北市合成路100號 / 100 Synthetic Road",
      phone: "02-0000-0000",
      email: "",
    },
    clientName: language === "zh-TW" ? "合成客戶" : "Synthetic client",
    clientDetails: {
      contactPerson: "合成聯絡人 / Synthetic contact",
      address: "200 Synthetic Road",
      taxId: "12345678",
    },
    siteAddress: "合成工程地址 / 300 Synthetic Road",
    attention: "",
    projectName: "合成店面 / Synthetic shop",
    projectKey: "J-2611-A7K3",
    documentNumber: "J-2611-A7K3-Q1",
    issueDate: "2026-11-24",
    validUntil: "2026-12-24",
    currency: "TWD",
    lines: [],
    totals: document,
    document,
    terms: "",
  };
}
async function content(bytes: Buffer) {
  const loading = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false });
  const pdf = await loading.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    pages.push((await page.getTextContent()).items.filter((item) => "str" in item));
  }
  await loading.destroy();
  return pages;
}
it.each(["en", "zh-TW"] as const)(
  "prints seven columns, notes, fee/discount, client/site details and exact totals (%s)",
  async (language) => {
    const snapshot = sample(language),
      pdf = await renderQuotePdf(snapshot),
      pages = await content(pdf),
      text = pages
        .flat()
        .map((item) => item.str)
        .join(" ");
    for (const value of [
      language === "en" ? "Remarks" : "備註",
      "NT$285,000",
      "NT$15,000",
      "NT$300,000",
      "NT$24,000",
      "NT$-4,000",
      "NT$320,000",
      "NT$16,000",
      "NT$336,000",
      "Verify dimensions before work.",
      "300 Synthetic Road",
      "12345678",
    ])
      expect(text).toContain(value);
    expect(text).not.toContain(language === "en" ? "Terms" : "條款");
    expect(text).not.toContain("DRAFT");
    expect(Buffer.compare(pdf, await renderQuotePdf(snapshot))).toBe(0);
    if (process.env.STRIDEBRAIN_SB065_CAPTURE_PDF === "true")
      writeFileSync(`foundry/tasks/SB-065/evidence/quote-document-${language}.pdf`, pdf);
  },
);
it("wraps a long section across pages, repeats its columns and keeps rows, totals and footers apart", async () => {
  const snapshot = sample("zh-TW"),
    first = snapshot.document.sections[0]!;
  const document = quoteDocumentTotals({
    ...snapshot.document,
    sections: [
      {
        ...first,
        title: "長篇章節 / Long section",
        lines: Array.from({ length: 40 }, (_, i) => ({
          kind: "ITEM" as const,
          description: `項目${i + 1}：客製木作與現場安裝，依圖面及複核尺寸施作。`,
          quantity: "6.23",
          unit: "坪",
          unitPrice: "3200",
          remark: "備註：施工前確認細節，保留收邊空間。",
        })),
      },
    ],
    discount: { label: "優惠折讓", amount: "0" },
  });
  const pdf = await renderQuotePdf({ ...snapshot, document, totals: document }, true),
    pages = await content(pdf);
  expect(pages.length).toBeGreaterThan(2);
  const text = pages
    .flat()
    .map((item) => item.str)
    .join(" ");
  expect(text).toContain("項目40");
  expect(text).toContain("NT$19,936");
  expect(text).toContain("DRAFT");
  for (const page of pages)
    for (const item of page) {
      if (!item.str.trim() || item.str.includes("DRAFT")) continue;
      if (item.str.includes(" · ")) expect(item.transform[5]).toBeLessThan(50);
      else expect(item.transform[5]).toBeGreaterThan(55);
    }
  expect(text.match(/項次/g)!.length).toBeGreaterThan(1);
  if (process.env.STRIDEBRAIN_SB065_CAPTURE_PDF === "true")
    writeFileSync("foundry/tasks/SB-065/evidence/quote-document-long.pdf", pdf);
});
