import { describe, expect, it } from "vitest";
import { quoteCategoryTotals, quoteDocumentTotals } from "@/modules/finance/quote-totals";
import {
  validateQuoteDocument,
  type QuoteDocumentDraft,
} from "@/modules/quote-draft/domain/document-input";
const item = (description: string, quantity: string, unitPrice: string) => ({
  kind: "ITEM" as const,
  description,
  quantity,
  unit: "式",
  unitPrice,
  remark: "",
});
const document = (): QuoteDocumentDraft => ({
  sections: [
    {
      title: "木作",
      categoryId: "CUSTOM_MILLWORK",
      lines: [item("天花板", "30", "3500"), item("系統櫃", "1", "180000")],
    },
    { title: "水電", categoryId: "LIGHTING_ELECTRICAL", lines: [item("插座", "12", "1250")] },
    {
      title: "費用",
      categoryId: null,
      lines: [
        { kind: "PERCENTAGE", description: "監工管理費", percentage: "8", remark: "" },
        { kind: "NOTE", description: "現場尺寸複核" },
      ],
    },
  ],
  discount: { label: "優惠折讓", amount: "0" },
});
describe("document totals", () => {
  it("combines sections sharing one pricing category and permits a suggestion only when all are empty", () => {
    const sections = [
      {
        title: "拆除工程",
        categoryId: "DEMOLITION_CEILING",
        lines: [item("Demolition", "1", "100")],
      },
      {
        title: "天花板工程",
        categoryId: "DEMOLITION_CEILING",
        lines: [item("Ceiling", "1", "250")],
      },
      { title: "Other", categoryId: null, lines: [item("Other", "1", "50")] },
    ];
    expect(
      quoteCategoryTotals(
        quoteDocumentTotals({ sections, discount: { label: "Discount", amount: "20" } }),
      ),
    ).toEqual([
      {
        categoryId: "DEMOLITION_CEILING",
        sectionIndexes: [0, 1],
        amount: "350.00",
        hasLines: true,
      },
    ]);
    expect(
      quoteCategoryTotals(
        quoteDocumentTotals({
          sections: sections.slice(0, 2).map((section) => ({ ...section, lines: [] })),
          discount: { label: "Discount", amount: "0" },
        }),
      )[0],
    ).toMatchObject({ amount: "0.00", hasLines: false });
    expect(
      quoteCategoryTotals(
        quoteDocumentTotals({
          sections: [
            {
              title: "Notes",
              categoryId: "DEMOLITION_CEILING",
              lines: [{ kind: "NOTE", description: "Check dimensions" }],
            },
          ],
          discount: { label: "Discount", amount: "0" },
        }),
      )[0]?.hasLines,
    ).toBe(true);
  });
  it("computes the acceptance example and applies one discount after the fees", () => {
    const input = document();
    expect(quoteDocumentTotals(input)).toMatchObject({
      subtotal: "300000.00",
      sections: [{ subtotal: "285000.00" }, { subtotal: "15000.00" }, { subtotal: "24000.00" }],
      amountBeforeTax: "324000.00",
      taxAmount: "16200.00",
      totalAmount: "340200.00",
    });
    expect(
      quoteDocumentTotals({ ...input, discount: { label: "Discount", amount: "4000" } }),
    ).toMatchObject({
      amountBeforeTax: "320000.00",
      taxAmount: "16000.00",
      totalAmount: "336000.00",
    });
    expect(() =>
      quoteDocumentTotals({ ...input, discount: { label: "Discount", amount: "324001" } }),
    ).toThrow("DISCOUNT_EXCEEDS_SUBTOTAL");
  });
  it("rounds each quantity product, percentage fee and tax half up without floating arithmetic", () => {
    const input = {
      sections: [
        {
          title: "Work",
          categoryId: null,
          lines: [
            item("Board", "6.23", "3200"),
            item("Half", "0.5", "1"),
            { kind: "PERCENTAGE" as const, description: "Fee", percentage: "0.5", remark: "" },
          ],
        },
      ],
      discount: { label: "Discount", amount: "0" },
    };
    const result = quoteDocumentTotals(input);
    expect(result.sections[0]?.lines.map((line) => line.amount)).toEqual([
      "19936.00",
      "1.00",
      "100.00",
    ]);
    expect(result.taxAmount).toBe("1002.00");
    expect(result.totalAmount).toBe("21039.00");
  });
  it("uses the same un-discounted non-percentage base for every fee, regardless of row order", () => {
    const input = document();
    const sections = [
      ...input.sections,
      {
        title: "Design",
        categoryId: null,
        lines: [
          { kind: "PERCENTAGE" as const, description: "Design", percentage: "10", remark: "" },
        ],
      },
    ];
    expect(
      quoteDocumentTotals({ ...input, sections, discount: { label: "Discount", amount: "4000" } }),
    ).toMatchObject({
      percentageLines: [{ amount: "24000.00" }, { amount: "30000.00" }],
      amountBeforeTax: "350000.00",
      totalAmount: "367500.00",
    });
  });
  it("refuses amounts that cannot be stored exactly", () => {
    expect(() =>
      quoteDocumentTotals({
        sections: [
          {
            title: "Huge",
            categoryId: null,
            lines: [item("Huge", "99999999999999", "99999999999999")],
          },
        ],
        discount: { label: "Discount", amount: "0" },
      }),
    ).toThrow("QUOTE_AMOUNT_LIMIT");
  });
});
describe("bounded document input", () => {
  it("discards submitted amounts and subtotals and keeps text once, as typed", () => {
    const input = document();
    const parsed = validateQuoteDocument(
      {
        ...input,
        sections: input.sections.map((section) => ({
          ...section,
          subtotal: "999",
          lines: section.lines.map((line) => ({ ...line, amount: "999" })),
        })),
      },
      "zh-TW",
    );
    expect(parsed?.sections[0]?.lines[0]?.description).toBe("天花板");
    expect(quoteDocumentTotals(parsed!).totalAmount).toBe("340200.00");
    expect(
      validateQuoteDocument({ sections: [{ title: "", categoryId: null, lines: [] }] }, "zh-TW")
        ?.discount.label,
    ).toBe("優惠折讓");
  });
  it("bounds sections, lines, decimals, descriptions, units, remarks and discounts", () => {
    const input = document();
    for (const patch of [
      { quantity: "1.001" },
      { quantity: "-1" },
      { quantity: 1.2 },
      { unitPrice: "1e3" },
      { unit: "123456789" },
      { remark: "x".repeat(201) },
      { description: "x".repeat(501) },
    ]) {
      expect(
        validateQuoteDocument(
          {
            ...input,
            sections: [{ ...input.sections[0], lines: [{ ...item("A", "1", "1"), ...patch }] }],
          },
          "en",
        ),
      ).toBeNull();
    }
    expect(
      validateQuoteDocument({ ...input, sections: Array(31).fill(input.sections[0]) }, "en"),
    ).toBeNull();
    expect(
      validateQuoteDocument(
        {
          ...input,
          sections: [{ ...input.sections[0], lines: Array(301).fill(item("A", "1", "1")) }],
        },
        "en",
      ),
    ).toBeNull();
    expect(
      validateQuoteDocument({ ...input, discount: { label: "Discount", amount: "1.50" } }, "en"),
    ).toBeNull();
    expect(
      validateQuoteDocument({ ...input, discount: { label: "x".repeat(41), amount: "1" } }, "en"),
    ).toBeNull();
  });
});
