import { describe, expect, it } from "vitest";
import { labelledFacts } from "@/modules/assistant/domain/display-facts";
import { redactSource } from "@/modules/assistant/domain/redaction";
import { assistantFactLabels } from "@/modules/localization/assistant";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
const quote: AssistantSource = {
  sourceId: "quote",
  href: "/en/projects/J/quote",
  label: "J",
  projectKeys: ["J"],
  facts: {
    reference: "J",
    status: "Issued",
    amounts: {
      amountBeforeTax: "NT$11,110,200",
      taxAmount: "NT$555,510",
      totalAmount: "NT$11,665,710",
      currency: "TWD",
      priceBasis: "Current quote",
      basis: "CURRENT",
    },
    issued: { documentNumber: "Q-001", validUntil: "2027-12-31", acceptedOn: "Not accepted yet" },
  },
  typedFactPaths: ["reference", "status", "amounts", "issued"],
};
describe("display facts", () => {
  it.each(["en", "zh-TW"] as const)("sends labels and display values only in %s", (locale) => {
    const labels = assistantFactLabels(locale);
    const facts = labelledFacts(redactSource(quote, ["J"]).facts, locale) as Record<
      string,
      unknown
    >;
    expect(facts[labels.amounts!]).toEqual({
      [labels.amountBeforeTax!]: "NT$11,110,200",
      [labels.taxAmount!]: "NT$555,510",
      [labels.totalAmount!]: "NT$11,665,710",
    });
    expect(JSON.stringify(facts)).not.toMatch(
      /acceptedOn|validUntil|priceBasis|basis|amountBeforeTax|currency|CURRENT/,
    );
    const history = {
      category: "Custom millwork",
      count: 3,
      median: "5833.333333",
      low: "5424.333333",
      high: "5902.000000",
      unit: "TWD/m2",
      displayMedian: "NT$5,833/m²",
      displayLow: "NT$5,424/m²",
      displayHigh: "NT$5,902/m²",
      observationType: "QUOTED_PRICE",
      evidenceReferenceIds: ["private"],
    };
    const displayed = JSON.stringify(labelledFacts(history, locale));
    expect(displayed).toContain("NT$5,833/m²");
    expect(displayed).not.toMatch(
      /5833\.333333|5424\.333333|5902\.000000|TWD\/m2|displayMedian|QUOTED_PRICE|private/,
    );
    const closed = labelledFacts(
      {
        quoteBeforeTax: "1000.00",
        actualCost: "900.00",
        difference: "100.00",
        quotedPrice: "NT$1,000",
        reconciledActualCost: "NT$900",
        costComparison: "Saved lesson",
        categoryId: "STONE",
      },
      locale,
    );
    expect(JSON.stringify(closed)).not.toMatch(
      /quoteBeforeTax|actualCost|difference|1000\.00|900\.00|STONE/,
    );
  });
});
