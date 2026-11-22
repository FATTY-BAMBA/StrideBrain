import PDFDocument from "pdfkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { QuoteDocumentSnapshot } from "../domain/contracts";
import { formatMoney } from "@/modules/finance/format-money";

/** Only immutable document values enter this renderer. It does not query live records. */
export async function renderQuotePdf(
  snapshot: QuoteDocumentSnapshot,
  draft = false,
): Promise<Buffer> {
  const font = await readFile(join(process.cwd(), "assets/fonts/StrideBrainSansTC-Regular.ttf"));
  const zh = snapshot.language === "zh-TW";
  const copy = zh
    ? {
        quote: "報價單",
        taxId: "統一編號",
        client: "客戶",
        attention: "收件人",
        job: "專案",
        reference: "專案編號",
        number: "報價單號",
        issued: "核發日期",
        valid: "有效期限",
        description: "項目說明",
        amount: "未稅金額",
        subtotal: "未稅金額合計",
        tax: "營業稅（5%）",
        total: "總計",
        terms: "條款",
        firmSign: "公司簽署",
        clientSign: "客戶簽署",
        date: "日期",
        draft: "草稿 / DRAFT",
      }
    : {
        quote: "QUOTATION",
        taxId: "Tax ID",
        client: "Client",
        attention: "Attention",
        job: "Job",
        reference: "Job reference",
        number: "Document number",
        issued: "Issue date",
        valid: "Valid until",
        description: "Description",
        amount: "Amount before tax",
        subtotal: "Amount before tax",
        tax: "Business tax (5%)",
        total: "Total",
        terms: "Terms",
        firmSign: "For the firm",
        clientSign: "Client signature",
        date: "Date",
        draft: "DRAFT",
      };
  const date = new Date(`${snapshot.issueDate}T00:00:00Z`);
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 48, right: 48, bottom: 64, left: 48 },
    bufferPages: true,
    info: {
      Title: snapshot.documentNumber,
      Author: snapshot.firm.legalName,
      Subject: copy.quote,
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
  const left = 48,
    width = doc.page.width - 96,
    right = left + width,
    bottom = doc.page.height - 64;
  function watermark() {
    if (!draft) return;
    doc
      .save()
      .fillColor("#64776b")
      .opacity(0.12)
      .fontSize(54)
      .rotate(-32, { origin: [doc.page.width / 2, doc.page.height / 2] })
      .text(copy.draft, 60, doc.page.height / 2 - 24, {
        width: doc.page.width - 120,
        align: "center",
        lineBreak: false,
      })
      .restore();
    doc.x = left;
    doc.y = 48;
  }

  function ensure(height: number) {
    if (doc.y + height > bottom) doc.addPage();
  }
  function paragraph(value: string, size = 10, color = "#223a31") {
    doc.fontSize(size).fillColor(color);
    const height = doc.heightOfString(value, { width, lineGap: 3 });
    ensure(Math.min(height, bottom - 48));
    doc.text(value, left, doc.y, { width, lineGap: 3 });
    doc.moveDown(0.35);
  }
  const colon = zh ? "：" : ": ";
  paragraph(snapshot.firm.legalName, 18);
  paragraph(`${copy.taxId}${colon}${snapshot.firm.taxId}`, 9);
  paragraph(snapshot.firm.address, 9);
  paragraph([snapshot.firm.phone, snapshot.firm.email].filter(Boolean).join("   "), 9);
  doc.moveDown(0.5);
  paragraph(copy.quote, 24);
  paragraph(`${copy.number}${colon}${snapshot.documentNumber}`, 11);
  paragraph(
    `${copy.issued}${colon}${snapshot.issueDate}     ${copy.valid}${colon}${snapshot.validUntil}`,
    9,
  );
  doc.moveDown(0.5);
  paragraph(`${copy.client}${colon}${snapshot.clientName}`, 11);
  if (snapshot.attention) paragraph(`${copy.attention}${colon}${snapshot.attention}`, 10);
  paragraph(`${copy.job}${colon}${snapshot.projectName}`, 10);
  paragraph(`${copy.reference}${colon}${snapshot.projectKey}`, 9);
  doc.moveDown(0.5);
  function tableHead() {
    ensure(30);
    const y = doc.y;
    doc.rect(left, y, width, 26).fill("#eaf0ec");
    doc
      .fillColor("#223a31")
      .fontSize(9)
      .text(copy.description, left + 10, y + 7, { width: width - 160, lineBreak: false });
    doc.text(copy.amount, right - 150, y + 7, { width: 140, align: "right", lineBreak: false });
    doc.y = y + 34;
  }
  tableHead();
  for (const line of snapshot.lines) {
    doc.fontSize(10);
    const height = Math.max(
      22,
      doc.heightOfString(line.description, { width: width - 160, lineGap: 3 }) + 14,
    );
    if (doc.y + height > bottom) {
      doc.addPage();
      tableHead();
    }
    const y = doc.y;
    doc
      .fillColor("#223a31")
      .text(line.description, left + 10, y, { width: width - 160, lineGap: 3 });
    doc.text(formatMoney(line.amount, snapshot.currency), right - 150, y, {
      width: 140,
      align: "right",
      lineBreak: false,
    });
    doc
      .moveTo(left, y + height - 4)
      .lineTo(right, y + height - 4)
      .lineWidth(0.5)
      .strokeColor("#d2dcd5")
      .stroke();
    doc.y = y + height;
  }
  doc.moveDown();
  ensure(94);
  for (const [label, amount] of [
    [copy.subtotal, snapshot.totals.amountBeforeTax],
    [copy.tax, snapshot.totals.taxAmount],
    [copy.total, snapshot.totals.totalAmount],
  ] as const) {
    const y = doc.y;
    doc
      .fontSize(label === copy.total ? 13 : 10)
      .fillColor("#223a31")
      .text(label, left + 160, y, { width: 180 });
    doc.text(formatMoney(amount, snapshot.currency), right - 150, y, {
      width: 150,
      align: "right",
      lineBreak: false,
    });
    doc.y = y + 27;
  }
  doc.moveDown();
  if (snapshot.terms.trim()) {
    paragraph(copy.terms, 12);
    paragraph(snapshot.terms, 9);
  }
  ensure(100);
  doc.moveDown();
  const y = doc.y;
  for (const [x, label] of [
    [left, copy.firmSign],
    [left + width / 2 + 16, copy.clientSign],
  ] as const) {
    doc.fontSize(10).text(label, x, y, { width: width / 2 - 16 });
    doc
      .moveTo(x, y + 40)
      .lineTo(x + width / 2 - 20, y + 40)
      .strokeColor("#8b9c90")
      .stroke();
    doc.fontSize(8).text(`${copy.date}${colon}`, x, y + 48, { width: width / 2 - 16 });
  }
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    watermark();
    // The footer is outside the body margin. Do not let text layout add a page for it.
    const bodyBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .fontSize(8)
      .fillColor("#627269")
      .text(`${snapshot.documentNumber} · ${i + 1}/${pages.count}`, left, doc.page.height - 38, {
        width,
        align: "right",
        lineBreak: false,
      });
    doc.page.margins.bottom = bodyBottom;
  }
  doc.end();
  return result;
}
