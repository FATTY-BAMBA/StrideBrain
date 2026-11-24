import PDFDocument from "pdfkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { QuoteDocumentSnapshotV2 } from "../domain/contracts";
import type { ComputedQuoteLine } from "@/modules/finance/quote-totals";
import { formatMoney } from "@/modules/finance/format-money";
import { quoteDocumentCopy } from "@/modules/localization/quote-document";
/** Rendering only: every amount, including line and section totals, is a frozen server fact. */
export async function renderQuoteDocumentV2(
  snapshot: QuoteDocumentSnapshotV2,
  draft: boolean,
): Promise<Buffer> {
  const font = await readFile(join(process.cwd(), "assets/fonts/StrideBrainSansTC-Regular.ttf"));
  const copy = quoteDocumentCopy(snapshot.language),
    zh = snapshot.language === "zh-TW",
    colon = zh ? "：" : ": ";
  const date = new Date(`${snapshot.issueDate}T00:00:00Z`);
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 36, left: 32, right: 32, bottom: 64 },
    bufferPages: true,
    info: {
      Title: snapshot.documentNumber,
      Author: snapshot.firm.legalName,
      Subject: copy.title,
      CreationDate: date,
      ModDate: date,
    },
  });
  doc.registerFont("Document", font).font("Document");
  const chunks: Buffer[] = [];
  let bytes = 0;
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 10_000_000) doc.destroy(new Error("PDF_TOO_LARGE"));
      else chunks.push(chunk);
    });
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const left = 32,
    width = doc.page.width - 64,
    bottom = doc.page.height - 64;
  const ink = "#14211d",
    muted = "#5d6d67",
    lineColor = "#b8c7c0",
    subtle = "#f4f6f5";
  const format = (value: string) => formatMoney(value, snapshot.currency);
  const plain = (value: string) => value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  function ensure(height: number) {
    if (doc.y + height > bottom) doc.addPage();
  }
  function paragraph(text: string, size = 9) {
    doc.fontSize(size).fillColor(ink);
    const height = doc.heightOfString(text, { width, lineGap: 2 });
    ensure(Math.min(height + 6, bottom - 36));
    doc.text(text, left, doc.y, { width, lineGap: 2 });
    doc.y += 6;
  }
  paragraph(snapshot.firm.legalName, 16);
  paragraph(`${zh ? "統一編號" : "Tax ID"}${colon}${snapshot.firm.taxId}`);
  paragraph(snapshot.firm.address);
  paragraph([snapshot.firm.phone, snapshot.firm.email].filter(Boolean).join("   "));
  paragraph(zh ? "報價單" : "QUOTATION", 22);
  paragraph(`${zh ? "報價單號" : "Document number"}${colon}${snapshot.documentNumber}`, 10);
  paragraph(
    `${zh ? "核發日期" : "Issue date"}${colon}${snapshot.issueDate}     ${zh ? "有效期限" : "Valid until"}${colon}${snapshot.validUntil}`,
  );
  for (const [label, value] of [
    [copy.client, snapshot.clientName],
    [copy.contact, snapshot.clientDetails?.contactPerson],
    [copy.clientAddress, snapshot.clientDetails?.address],
    [copy.clientTaxId, snapshot.clientDetails?.taxId],
    [zh ? "收件人" : "Attention", snapshot.attention],
    [copy.project, snapshot.projectName],
    [zh ? "專案編號" : "Job reference", snapshot.projectKey],
    [copy.siteAddress, snapshot.siteAddress],
  ])
    if (value) paragraph(`${label}${colon}${value}`);
  const widths = [26, 150, 30, 42, 86, 96, width - 430];
  const headings = [
    copy.number,
    copy.item,
    copy.unit,
    copy.quantity,
    copy.price,
    copy.amount,
    copy.remarks,
  ];
  const columns = widths.map((w, i) => ({
    width: w,
    x: left + widths.slice(0, i).reduce((sum, value) => sum + value, 0),
  }));
  function cells(values: readonly string[], sizes = widths) {
    doc.fontSize(9);
    const height = Math.max(
      24,
      ...values.map(
        (value, index) => doc.heightOfString(value, { width: sizes[index]! - 8, lineGap: 2 }) + 12,
      ),
    );
    return { values, sizes, height };
  }
  function lineCells(item: ComputedQuoteLine, index: number) {
    if (item.kind === "NOTE") return cells([String(index + 1), item.description], [26, width - 26]);
    return cells([
      String(index + 1),
      item.description,
      item.kind === "ITEM" ? item.unit : "%",
      item.kind === "ITEM" ? plain(item.quantity) : plain(item.percentage),
      item.kind === "ITEM" ? format(item.unitPrice) : "—",
      format(item.amount!),
      item.remark,
    ]);
  }
  function sectionHead(title: string, continued = false) {
    const value = `${title}${continued ? (zh ? "（續）" : " (continued)") : ""}`;
    doc.fontSize(11);
    const height = doc.heightOfString(value, { width }) + 14;
    const y = doc.y;
    doc.fillColor(ink).text(value, left, y, { width });
    doc.y = y + height;
    doc.fontSize(9);
    const headHeight = Math.max(
      30,
      ...headings.map((heading, i) => doc.heightOfString(heading, { width: widths[i]! - 8 }) + 14),
    );
    const top = doc.y;
    doc.rect(left, top, width, headHeight).fill(subtle);
    doc.fillColor(muted);
    headings.forEach((heading, i) =>
      doc.text(heading, columns[i]!.x + 4, top + 6, {
        width: widths[i]! - 8,
        align: i >= 3 && i <= 5 ? "right" : "left",
      }),
    );
    doc.y = top + headHeight;
  }
  snapshot.document.sections.forEach((section) => {
    doc.fontSize(11);
    const titleHeight = doc.heightOfString(section.title, { width }) + 14;
    const firstHeight = section.lines[0] ? lineCells(section.lines[0], 0).height : 24;
    ensure(titleHeight + 44 + firstHeight);
    sectionHead(section.title);
    section.lines.forEach((item, index) => {
      const row = lineCells(item, index);
      if (doc.y + row.height > bottom) {
        doc.addPage();
        sectionHead(section.title, true);
      }
      const y = doc.y;
      let x = left;
      doc.fontSize(9).fillColor(ink);
      row.values.forEach((value, i) => {
        doc.text(value, x + 4, y + 6, {
          width: row.sizes[i]! - 8,
          lineGap: 2,
          align: item.kind !== "NOTE" && i >= 3 && i <= 5 ? "right" : "left",
        });
        x += row.sizes[i]!;
      });
      doc
        .moveTo(left, y + row.height)
        .lineTo(left + width, y + row.height)
        .lineWidth(0.5)
        .strokeColor(lineColor)
        .stroke();
      doc.y = y + row.height;
    });
    ensure(30);
    const y = doc.y;
    doc
      .fontSize(10)
      .fillColor(ink)
      .text(`${copy.sectionSubtotal}${colon}${format(section.subtotal)}`, left, y + 8, {
        width,
        align: "right",
      });
    doc.y = y + 32;
  });
  const totals: readonly (readonly [string, string])[] = [
    [copy.subtotal, snapshot.document.subtotal],
    ...snapshot.document.percentageLines.map(
      (fee) => [`${fee.description} (${plain(fee.percentage)}%)`, fee.amount] as const,
    ),
    [snapshot.document.discount.label || copy.discount, `-${snapshot.document.discount.amount}`],
    [copy.beforeTax, snapshot.totals.amountBeforeTax],
    [copy.tax, snapshot.totals.taxAmount],
    [copy.total, snapshot.totals.totalAmount],
  ];
  totals.forEach(([label, amount], index) => {
    const size = index === totals.length - 1 ? 12 : 10;
    doc.fontSize(size);
    const height = Math.max(
      26,
      doc.heightOfString(label, { width: width - 170 }) + 10,
      doc.heightOfString(format(amount), { width: 160 }) + 10,
    );
    ensure(height);
    const y = doc.y;
    doc.fillColor(ink).text(label, left, y, { width: width - 170 });
    doc.text(format(amount), left + width - 160, y, { width: 160, align: "right" });
    doc.y = y + height;
  });
  if (snapshot.terms.trim()) {
    ensure(50);
    paragraph(zh ? "條款" : "Terms", 11);
    paragraph(snapshot.terms);
  }
  ensure(90);
  const signY = doc.y + 12;
  for (const [x, label] of [
    [left, zh ? "公司簽署" : "For the firm"],
    [left + width / 2 + 16, zh ? "客戶簽署" : "Client signature"],
  ] as const) {
    doc.fontSize(10).text(label, x, signY, { width: width / 2 - 20 });
    doc
      .moveTo(x, signY + 38)
      .lineTo(x + width / 2 - 20, signY + 38)
      .strokeColor(lineColor)
      .stroke();
    doc.fontSize(9).text(`${copy.issueDate}${colon}`, x, signY + 46, { width: width / 2 - 20 });
  }
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    if (draft)
      doc
        .save()
        .fillColor(muted)
        .opacity(0.12)
        .fontSize(54)
        .rotate(-32, { origin: [doc.page.width / 2, doc.page.height / 2] })
        .text(zh ? "草稿 / DRAFT" : "DRAFT", 60, doc.page.height / 2 - 24, {
          width: doc.page.width - 120,
          align: "center",
          lineBreak: false,
        })
        .restore();
    const margin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .fontSize(8)
      .fillColor(muted)
      .text(`${snapshot.documentNumber} · ${i + 1}/${pages.count}`, left, doc.page.height - 38, {
        width,
        align: "right",
        lineBreak: false,
      });
    doc.page.margins.bottom = margin;
  }
  doc.end();
  return result;
}
