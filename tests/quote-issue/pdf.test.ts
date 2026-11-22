import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { renderQuotePdf } from "@/modules/quote-issue/infrastructure/render-quote-pdf";
import type { QuoteDocumentSnapshot } from "@/modules/quote-issue/domain/contracts";
export const sample: QuoteDocumentSnapshot = {
  schemaVersion: "QUOTE-DOCUMENT-1.0",
  language: "zh-TW",
  firm: {
    legalName: "禾序空間設計（合成示範公司）",
    taxId: "00000000",
    address: "臺北市示範路100號（合成地址）",
    phone: "02-0000-0000",
    email: "quotes@example.invalid",
  },
  clientName: "合成客戶股份有限公司",
  attention: "王小姐",
  projectName: "信義合成門市裝修",
  projectKey: "J-2611-A7K3",
  documentNumber: "J-2611-A7K3-Q1",
  issueDate: "2026-11-22",
  validUntil: "2026-12-22",
  currency: "TWD",
  lines: [
    { categoryId: "CUSTOM_MILLWORK", description: "客製木作", amount: "3733000.00" },
    { categoryId: "DEMOLITION_CEILING", description: "拆除、隔間與天花", amount: "25000.00" },
  ],
  totals: { amountBeforeTax: "3758000.00", taxAmount: "187900.00", totalAmount: "3945900.00" },
  terms: "本報價僅供合成資料示範。工作範圍變更須另行修改報價。",
};
async function text(buffer: Buffer) {
  const loading = getDocument({ data: new Uint8Array(buffer), useSystemFonts: false });
  const pdf = await loading.promise;
  let result = "";
  for (let page = 1; page <= pdf.numPages; page++) {
    const content = await (await pdf.getPage(page)).getTextContent();
    result += content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
  }
  await loading.destroy();
  return result;
}
it("embeds Traditional Chinese text, exact totals, signatures and draft watermark; the same snapshot retains its text", async () => {
  const first = await renderQuotePdf(sample),
    again = await renderQuotePdf(sample),
    issued = await text(first);
  for (const value of [
    "禾序空間設計",
    "統一編號",
    "00000000",
    "王小姐",
    "拆除、隔間與天花",
    "NT$3,945,900",
    "公司簽署",
    "客戶簽署",
    "2026-12-22",
  ])
    expect(issued).toContain(value);
  expect(issued).not.toContain("DRAFT");
  expect(await text(again)).toEqual(issued);
  expect(await text(await renderQuotePdf(sample, true))).toContain("DRAFT");
});
it("wraps long Chinese terms across A4 pages without dropping text", async () => {
  const terms = Array.from(
    { length: 80 },
    (_, i) => `條款${i + 1}：工作範圍變更須另行修改報價，請確認後簽署。`,
  ).join("\n");
  const content = await text(await renderQuotePdf({ ...sample, terms }));
  expect(content).toContain("條款80");
  expect(content).toContain("客戶簽署");
});

it("renders English labels and long terms in a watermarked multi-page draft", async () => {
  const result = await text(
    await renderQuotePdf(
      { ...sample, language: "en", terms: "Payment terms remain as written.\n".repeat(100) },
      true,
    ),
  );
  for (const label of ["QUOTATION", "DRAFT", "Tax ID: ", "Client signature", "NT$3,945,900"])
    expect(result).toContain(label);
});

it("keeps a short quotation on one A4 portrait page including its footer", async () => {
  for (const draft of [false, true]) {
    const loading = getDocument({
      data: new Uint8Array(await renderQuotePdf(sample, draft)),
      useSystemFonts: false,
    });
    const pdf = await loading.promise;
    expect(pdf.numPages).toBe(1);
    const viewport = (await pdf.getPage(1)).getViewport({ scale: 1 });
    expect(viewport.width).toBeCloseTo(595.28, 1);
    expect(viewport.height).toBeCloseTo(841.89, 1);
    await loading.destroy();
  }
});

it("reserves space between wrapped terms and every page footer", async () => {
  const loading = getDocument({
    data: new Uint8Array(
      await renderQuotePdf({
        ...sample,
        terms: "工作範圍變更須另行修改報價，請確認後簽署。\n".repeat(120),
      }),
    ),
    useSystemFonts: false,
  });
  const pdf = await loading.promise;
  expect(pdf.numPages).toBeGreaterThan(2);
  for (let page = 1; page <= pdf.numPages; page++) {
    const content = await (await pdf.getPage(page)).getTextContent();
    const text = content.items.filter((item) => "str" in item && item.str.trim());
    for (const item of text) {
      if (!("str" in item)) continue;
      if (item.str.includes(" · ")) expect(item.transform[5]).toBeLessThan(50);
      else expect(item.transform[5]).toBeGreaterThan(55);
    }
  }
  await loading.destroy();
});

it.each(["en", "zh-TW"] as const)(
  "omits empty terms and prints phone without email in %s documents and previews",
  async (language) => {
    for (const draft of [false, true]) {
      const content = await text(
        await renderQuotePdf(
          { ...sample, language, terms: "", firm: { ...sample.firm, email: "" } },
          draft,
        ),
      );
      expect(content).not.toContain(language === "en" ? "Terms" : "條款");
      expect(content).toContain(sample.firm.phone);
      expect(content).not.toContain(sample.firm.email);
      expect(content).toContain(language === "en" ? "Client signature" : "客戶簽署");
      expect(content).toContain("NT$3,945,900");
    }
  },
);

it("keeps an existing issued PDF byte-identical to the pre-SB-054 renderer, including its old line order", async () => {
  const snapshot = JSON.parse(
    readFileSync("tests/quote-issue/fixtures/before-sb054.json", "utf8"),
  ) as QuoteDocumentSnapshot;
  const before = readFileSync("tests/quote-issue/fixtures/before-sb054.pdf");
  const after = await renderQuotePdf(snapshot);
  expect(after.equals(before)).toBe(true);
  const content = await text(after);
  expect(content.indexOf("現場協調與交付")).toBeLessThan(content.indexOf("拆除、隔間與天花"));
});
