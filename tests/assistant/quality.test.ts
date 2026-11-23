import { describe, expect, it } from "vitest";
import { checkAnswer, hasMislabelledQuoteAmount } from "@/modules/assistant/domain/grounding";
import { labelledFacts } from "@/modules/assistant/domain/display-facts";
import { redactSource } from "@/modules/assistant/domain/redaction";
import { assistantFactLabels } from "@/modules/localization/assistant";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
import { evaluateAnswer, type EvaluationQuestion } from "./evaluation";
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
const raw = (text: string) => ({ text, sourceIds: ["quote"], followUps: [] });
describe("SB-058 labelled facts", () => {
  it.each([
    ["總額 NT$11,665,710（含稅 NT$11,110,200，稅額 NT$555,510）", "zh-TW"],
    ["含稅 NT$11,110,200", "zh-TW"],
    ["總計 NT$555,510", "zh-TW"],
    ["營業稅 NT$11,665,710", "zh-TW"],
    ["Total NT$11,110,200", "en"],
    ["Amount before tax NT$11,665,710", "en"],
    ["Tax: NT$11,110,200", "en"],
    ["NT$11,665,710", "en"],
    ["The quote totals NT$11,110,200.", "en"],
    ["Including tax of NT$11,665,710", "en"],
    ["Including tax of NT$11,110,200", "en"],
    ["Total including tax: NT$555,510", "en"],
  ] as const)("rejects incorrect or missing amount labels: %s", (text, locale) => {
    expect(checkAnswer(raw(text), [quote], locale)).toEqual({
      kind: "REJECTED",
      reason: "AMOUNT_LABEL",
    });
  });
  it.each([
    ["總計 NT$11,665,710（未稅金額 NT$11,110,200，營業稅 NT$555,510）", "zh-TW"],
    ["報價總額（含稅）是 NT$11,665,710", "zh-TW"],
    ["未稅金額 NT$11,110,200；總計 NT$11,665,710；營業稅 NT$555,510", "zh-TW"],
    ["Amount before tax: NT$11,110,200; Tax: NT$555,510; Total: NT$11,665,710", "en"],
    ["The quote total (including tax) is NT$11,665,710.", "en"],
    ["The quote totals NT$11,665,710.", "en"],
    [
      "Total NT$11,665,710 (including tax of NT$555,510 and an amount before tax of NT$11,110,200).",
      "en",
    ],
    [
      "The current quote before tax is NT$11,110,200, with tax of NT$555,510, totaling NT$11,665,710.",
      "en",
    ],
    ["NT$555,510 tax; NT$11,110,200 before tax; NT$11,665,710 total", "en"],
  ] as const)("accepts the cited amount with its own label: %s", (text, locale) => {
    expect(checkAnswer(raw(text), [quote], locale)).toMatchObject({
      kind: "ACCEPTED",
      answer: { text },
    });
  });
  it("cannot borrow a neighboring clause's label or an uncited quote's value", () => {
    expect(hasMislabelledQuoteAmount("Total NT$11,665,710; NT$11,110,200", [quote], "en")).toBe(
      true,
    );
    expect(checkAnswer(raw("Total NT$11,665,711"), [quote], "en")).toMatchObject({
      reason: "UNSUPPORTED_NUMBER",
    });
  });
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
  it("does not turn the square-metre exponent into a quote count", () => {
    const s = {
      ...quote,
      facts: { observationType: "QUOTED_PRICE", count: 3, displayMedian: "NT$5,833/m²" },
    };
    expect(checkAnswer(raw("2 quotes, NT$5,833/m²"), [s], "en")).toMatchObject({
      kind: "REJECTED",
      reason: "UNSUPPORTED_NUMBER",
    });
    expect(checkAnswer(raw("3 quotes, NT$5,833/m²"), [s], "en").kind).toBe("ACCEPTED");
  });
  it("does not ground an answer's raw precision from server-only duplicates", () => {
    const source = {
      ...quote,
      facts: {
        observationType: "QUOTED_PRICE",
        median: "5833.333333",
        displayMedian: "NT$5,833/m²",
      },
    };
    expect(checkAnswer(raw("NT$5,833/m²"), [source], "en").kind).toBe("ACCEPTED");
    expect(checkAnswer(raw("NT$5,833 (5833.333333 TWD/m2)"), [source], "en")).toMatchObject({
      reason: "UNSUPPORTED_NUMBER",
    });
  });
  it.each(["NT$5,833.000000/m²", "NT$5,833 (displayMedian)", "NT$5,833 TWD/m2"])(
    "rejects invented display clutter even when the number is supported: %s",
    (text) => {
      const source = {
        ...quote,
        facts: { observationType: "QUOTED_PRICE", displayMedian: "NT$5,833/m²" },
      };
      expect(checkAnswer(raw(text), [source], "en")).toMatchObject({ reason: "DISPLAY_FORMAT" });
      const q: EvaluationQuestion = {
        id: "display",
        locale: "en",
        person: "owner",
        question: "Rate?",
        oracleTools: [],
        expected: { kind: "FACTS", facts: [], forbidden: [] },
      };
      expect(
        evaluateAnswer(
          q,
          { kind: "ANSWER", locale: "en", answer: raw(text), sources: [source] },
          [],
          raw(text),
          [source],
        ),
      ).toMatchObject({ verdict: "wrong", badDisplayFormat: true });
    },
  );
  it("scores a displayed mislabel as wrong independently of numeric support", () => {
    const q: EvaluationQuestion = {
      id: "mislabel",
      locale: "zh-TW",
      person: "owner",
      question: "總額？",
      oracleTools: [],
      expected: { kind: "FACTS", facts: [], forbidden: [] },
    };
    const text = "含稅 NT$11,110,200";
    expect(
      evaluateAnswer(
        q,
        { kind: "ANSWER", locale: "zh-TW", answer: raw(text), sources: [quote] },
        [],
        raw(text),
        [quote],
      ),
    ).toMatchObject({ verdict: "wrong", wrongNumber: false, wrongAmountLabel: true });
  });
  it("does not mistake dates or percentage annotations for quote amounts", () => {
    const small = {
      ...quote,
      facts: {
        amounts: { amountBeforeTax: "NT$2,026", taxAmount: "NT$5", totalAmount: "NT$2,031" },
      },
    };
    expect(
      hasMislabelledQuoteAmount("Valid until December 22, 2026. Tax (5%): NT$5.", [small], "en"),
    ).toBe(false);
    expect(
      hasMislabelledQuoteAmount(
        "有效期限：2026 年 12 月 22 日。營業稅（5%）：NT$5",
        [small],
        "zh-TW",
      ),
    ).toBe(false);
  });
  it("allows a not-found answer only for the unknown-job case citing solely a count-zero list", () => {
    const q: EvaluationQuestion = {
      id: "unknown",
      locale: "zh-TW",
      person: "owner",
      question: "請介紹PRJ-DOES-NOT-EXIST。",
      oracleTools: [],
      expected: { kind: "DECLINE", match: "NOT_FOUND", facts: [], forbidden: [] },
    };
    const empty = { ...quote, projectKeys: [], facts: { count: 0 } };
    const text = "找不到專案 PRJ-DOES-NOT-EXIST。";
    const outcome = {
      kind: "ANSWER" as const,
      locale: "zh-TW" as const,
      answer: raw(text),
      sources: [empty],
    };
    expect(evaluateAnswer(q, outcome, [], raw(text), [empty]).verdict).toBe("correctly declined");
    expect(
      evaluateAnswer(
        q,
        { ...outcome, sources: [{ ...empty, facts: { count: 1 } }] },
        [],
        raw(text),
        [{ ...empty, facts: { count: 1 } }],
      ).verdict,
    ).toBe("wrong");
    const found = raw("找到專案 PRJ-DOES-NOT-EXIST。");
    expect(evaluateAnswer(q, { ...outcome, answer: found }, [], found, [empty]).verdict).toBe(
      "wrong",
    );
  });
});
