import {
  add,
  compare,
  decimalFromString,
  decimalToString,
  divide,
  money,
  multiply,
  rescale,
  subtract,
  sum,
} from "./fixed-decimal";
import type {
  QuoteDocumentDraft,
  QuoteDocumentLine,
  QuoteDocumentSection,
} from "@/modules/quote-draft/domain/document-input";

export const TAIWAN_BUSINESS_TAX_RATE = "0.05";
export type QuoteTotals = Readonly<{
  amountBeforeTax: string;
  taxAmount: string;
  totalAmount: string;
}>;

export function quoteTotals(amounts: readonly string[]): QuoteTotals {
  const beforeTax = sum(amounts.map(money), 2);
  const tax = multiply(beforeTax, decimalFromString(TAIWAN_BUSINESS_TAX_RATE, 2), 2);
  return {
    amountBeforeTax: decimalToString(beforeTax),
    taxAmount: decimalToString(tax),
    totalAmount: decimalToString(add(beforeTax, tax)),
  };
}

export type ComputedQuoteLine = QuoteDocumentLine & Readonly<{ amount: string | null }>;
export type ComputedQuoteSection = Omit<QuoteDocumentSection, "lines"> &
  Readonly<{ lines: readonly ComputedQuoteLine[]; subtotal: string }>;
export type QuoteDocumentAmounts = QuoteTotals &
  Readonly<{
    sections: readonly ComputedQuoteSection[];
    subtotal: string;
    percentageLines: readonly Readonly<{
      sectionIndex: number;
      lineIndex: number;
      description: string;
      percentage: string;
      amount: string;
    }>[];
    discount: QuoteDocumentDraft["discount"];
  }>;

/** Read stored facts without changing legacy rounding or rewriting an issued version. */
export function storedQuoteDocument(
  input: readonly Omit<ComputedQuoteSection, "subtotal">[],
  discount: QuoteDocumentDraft["discount"],
  totals: QuoteTotals,
): QuoteDocumentAmounts {
  const sections = input.map((section) => ({
    ...section,
    subtotal: decimalToString(
      sum(
        section.lines.flatMap((line) =>
          line.kind === "ITEM" && line.amount !== null ? [money(line.amount)] : [],
        ),
        2,
      ),
    ),
  }));
  const percentageLines: QuoteDocumentAmounts["percentageLines"][number][] = [];
  sections.forEach((section, sectionIndex) =>
    section.lines.forEach((line, lineIndex) => {
      if (line.kind === "PERCENTAGE" && line.amount !== null)
        percentageLines.push({
          sectionIndex,
          lineIndex,
          description: line.description,
          percentage: line.percentage,
          amount: line.amount,
        });
    }),
  );
  return {
    ...totals,
    sections,
    discount,
    percentageLines,
    subtotal: decimalToString(
      sum(
        sections.flatMap((section) =>
          section.lines.flatMap((line) =>
            line.kind === "ITEM" && line.amount !== null ? [money(line.amount)] : [],
          ),
        ),
        2,
      ),
    ),
  };
}

/** Whole-dollar half-up at each line, fee and tax; percentage fees never compound. */
export function quoteDocumentTotals(document: QuoteDocumentDraft): QuoteDocumentAmounts {
  const normalAmounts = document.sections.flatMap((section) =>
    section.lines
      .filter((line) => line.kind === "ITEM")
      .map((line) =>
        multiply(decimalFromString(line.quantity, 2), money(line.unitPrice), 0, "HALF_UP"),
      ),
  );
  const base = sum(normalAmounts, 0);
  const maximum = decimalFromString("999999999999999999", 0);
  const dollars = (value: ReturnType<typeof money>) => {
    if (value.atoms < 0n || compare(value, maximum) > 0) throw new RangeError("QUOTE_AMOUNT_LIMIT");
    return decimalToString(rescale(value, 2));
  };
  dollars(base);
  const percentageLines: QuoteDocumentAmounts["percentageLines"][number][] = [];
  const sections = document.sections.map((section, sectionIndex): ComputedQuoteSection => {
    const lines = section.lines.map((line, lineIndex): ComputedQuoteLine => {
      if (line.kind === "NOTE") return { ...line, amount: null };
      const amount = dollars(
        line.kind === "ITEM"
          ? multiply(decimalFromString(line.quantity, 2), money(line.unitPrice), 0, "HALF_UP")
          : multiply(
              base,
              divide(decimalFromString(line.percentage, 2), decimalFromString("100", 0), 4),
              0,
              "HALF_UP",
            ),
      );
      if (line.kind === "PERCENTAGE")
        percentageLines.push({
          sectionIndex,
          lineIndex,
          description: line.description,
          percentage: line.percentage,
          amount,
        });
      return { ...line, amount };
    });
    return {
      ...section,
      lines,
      subtotal: dollars(
        sum(
          lines.flatMap((line) =>
            line.kind === "ITEM" && line.amount !== null ? [money(line.amount)] : [],
          ),
          2,
        ),
      ),
    };
  });
  const beforeDiscount = sum([base, ...percentageLines.map((line) => money(line.amount))], 2);
  const discount = money(document.discount.amount);
  if (discount.atoms < 0n || compare(discount, beforeDiscount) > 0)
    throw new RangeError("DISCOUNT_EXCEEDS_SUBTOTAL");
  const beforeTax = subtract(beforeDiscount, discount);
  const tax = multiply(beforeTax, decimalFromString(TAIWAN_BUSINESS_TAX_RATE, 2), 0, "HALF_UP");
  return {
    sections,
    subtotal: dollars(base),
    percentageLines,
    discount: document.discount,
    amountBeforeTax: dollars(beforeTax),
    taxAmount: dollars(tax),
    totalAmount: dollars(add(beforeTax, rescale(tax, 2))),
  };
}

/** A pricing reference covers all sections of that category, never an individual section. */
export function quoteCategoryTotals(document: QuoteDocumentAmounts) {
  const categories = [
    ...new Set(
      document.sections.flatMap((section) => (section.categoryId ? [section.categoryId] : [])),
    ),
  ];
  return categories.map((categoryId) => {
    const sections = document.sections.flatMap((section, index) =>
      section.categoryId === categoryId ? [{ section, index }] : [],
    );
    return {
      categoryId,
      sectionIndexes: sections.map((entry) => entry.index),
      amount: decimalToString(
        sum(
          sections.flatMap((entry) =>
            entry.section.lines.flatMap((line) =>
              line.kind === "ITEM" && line.amount !== null ? [money(line.amount)] : [],
            ),
          ),
          2,
        ),
      ),
      hasLines: sections.some((entry) => entry.section.lines.length > 0),
    };
  });
}
