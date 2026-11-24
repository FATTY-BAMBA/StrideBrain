import { decimalFromString, decimalToString } from "@/modules/finance/fixed-decimal";

type LineIdentity = Readonly<{ id?: string; description: string }>;
export type QuoteDocumentLine =
  | (LineIdentity &
      Readonly<{ kind: "ITEM"; quantity: string; unit: string; unitPrice: string; remark: string }>)
  | (LineIdentity & Readonly<{ kind: "PERCENTAGE"; percentage: string; remark: string }>)
  | (LineIdentity & Readonly<{ kind: "NOTE" }>);
export type QuoteDocumentSection = Readonly<{
  id?: string;
  title: string;
  categoryId: string | null;
  lines: readonly QuoteDocumentLine[];
}>;
export type QuoteDocumentDraft = Readonly<{
  sections: readonly QuoteDocumentSection[];
  discount: Readonly<{ label: string; amount: string }>;
}>;
export const QUOTE_DOCUMENT_LIMITS = Object.freeze({
  sections: 30,
  lines: 300,
  description: 500,
  remark: 200,
  title: 80,
  unit: 8,
  discountLabel: 40,
});
const number = /^(?:0|[1-9]\d{0,13})(?:\.\d{1,2})?$/;
const percentage = /^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/;
const wholeAmount = /^(?:0|[1-9]\d{0,17})(?:\.00)?$/;
const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
function text(value: unknown, max: number, required = false): value is string {
  return (
    typeof value === "string" &&
    value.length <= max &&
    (!required || !!value.trim()) &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  );
}
function identity(value: Record<string, unknown>): boolean {
  return value.id === undefined || (text(value.id, 128, true) && /^[A-Za-z0-9_-]+$/.test(value.id));
}
const fixed = (value: string) => decimalToString(decimalFromString(value, 2));
/** Computed amounts from a browser are deliberately discarded, never trusted or persisted. */
export function validateQuoteDocument(value: unknown): QuoteDocumentDraft | null {
  const input = record(value);
  if (
    !input ||
    !Array.isArray(input.sections) ||
    !input.sections.length ||
    input.sections.length > QUOTE_DOCUMENT_LIMITS.sections
  )
    return null;
  const sections: QuoteDocumentSection[] = [];
  const ids = new Set<string>();
  let count = 0;
  for (const raw of input.sections) {
    const section = record(raw);
    if (
      !section ||
      !identity(section) ||
      Object.keys(section).some(
        (key) => !["id", "title", "categoryId", "lines", "subtotal"].includes(key),
      ) ||
      !text(section.title, 80) ||
      !(section.categoryId === null || text(section.categoryId, 128, true)) ||
      !Array.isArray(section.lines)
    )
      return null;
    if (typeof section.id === "string") {
      if (ids.has(section.id)) return null;
      ids.add(section.id);
    }
    count += section.lines.length;
    if (count > QUOTE_DOCUMENT_LIMITS.lines) return null;
    const lines: QuoteDocumentLine[] = [];
    for (const rawLine of section.lines) {
      const line = record(rawLine);
      if (!line || !identity(line) || !text(line.description, 500, true)) return null;
      if (typeof line.id === "string") {
        if (ids.has(line.id)) return null;
        ids.add(line.id);
      }
      const common = {
        ...(typeof line.id === "string" ? { id: line.id } : {}),
        description: line.description.trim(),
      };
      if (line.kind === "NOTE") {
        if (Object.keys(line).some((key) => !["id", "kind", "description", "amount"].includes(key)))
          return null;
        lines.push({ ...common, kind: "NOTE" });
      } else if (line.kind === "ITEM") {
        if (
          Object.keys(line).some(
            (key) =>
              ![
                "id",
                "kind",
                "description",
                "quantity",
                "unit",
                "unitPrice",
                "remark",
                "amount",
              ].includes(key),
          ) ||
          typeof line.quantity !== "string" ||
          !number.test(line.quantity) ||
          typeof line.unitPrice !== "string" ||
          !number.test(line.unitPrice) ||
          !text(line.unit, 8, true) ||
          /[\r\n]/.test(line.unit) ||
          !text(line.remark, 200)
        )
          return null;
        lines.push({
          ...common,
          kind: "ITEM",
          quantity: fixed(line.quantity),
          unit: line.unit.trim(),
          unitPrice: fixed(line.unitPrice),
          remark: line.remark.trim(),
        });
      } else if (line.kind === "PERCENTAGE") {
        if (
          Object.keys(line).some(
            (key) => !["id", "kind", "description", "percentage", "remark", "amount"].includes(key),
          ) ||
          typeof line.percentage !== "string" ||
          !percentage.test(line.percentage) ||
          !text(line.remark, 200)
        )
          return null;
        lines.push({
          ...common,
          kind: "PERCENTAGE",
          percentage: fixed(line.percentage),
          remark: line.remark.trim(),
        });
      } else return null;
    }
    sections.push({
      ...(typeof section.id === "string" ? { id: section.id } : {}),
      title: section.title.trim(),
      categoryId: section.categoryId as string | null,
      lines,
    });
  }
  const discount =
    input.discount === undefined ? { amount: "0", label: "" } : record(input.discount);
  if (
    !discount ||
    Object.keys(discount).some((key) => !["amount", "label"].includes(key)) ||
    !text(discount.label, 40) ||
    typeof discount.amount !== "string" ||
    !wholeAmount.test(discount.amount)
  )
    return null;
  return {
    sections,
    discount: {
      amount: fixed(discount.amount),
      // Empty preserves the distinction between a default and text the person entered.
      label: discount.label.trim(),
    },
  };
}
