import { describe, it, expect } from "vitest";
import { numericTokens, questionLocale, verifyAnswer } from "@/modules/assistant/domain/grounding";
import { redact, redactText } from "@/modules/assistant/domain/redaction";
import { estimatedCost } from "@/modules/assistant/domain/usage-cost";
const source = {
  sourceId: "s",
  href: "/en",
  label: "source",
  projectKeys: ["J"],
  facts: {
    observationType: "QUOTED_PRICE",
    amount: "NT$3,733,000",
    variance: "43.0%",
    date: "2026-11-22",
    count: 5,
  },
};
const answer = (text: string, sourceIds = ["s"], followUps: string[] = []) => ({
  text,
  sourceIds,
  followUps,
});
describe("assistant grounding", () => {
  it("does not turn a structural area into an amount or a quoted price into actual cost", () => {
    const structural = { ...source, facts: { area: "640" } };
    expect(verifyAnswer(answer("Quote amount NT$640"), [structural], "en")).toBeNull();
    expect(verifyAnswer(answer("Actual cost NT$3,733,000"), [source], "en")).toBeNull();
    expect(verifyAnswer(answer("I issued the quote."), [source], "en")).toBeNull();
  });
  it("recognizes the question language around localized names and references", () => {
    expect(questionLocale("What is the quote status for 進行中設計專案01?", "zh-TW")).toBe("en");
    expect(questionLocale("請問PRJ-XINYI-026與PRJ-ACTIVE-001的狀態？", "en")).toBe("zh-TW");
  });

  it("accepts exact supplied values and rejects a wrong number or citation", () => {
    expect(
      verifyAnswer(answer("NT$3,733,000; 43.0%; 2026-11-22; 5 findings."), [source], "en"),
    ).not.toBeNull();
    for (const text of [
      "NT$3,733,001",
      "-43%",
      "2026-11-23",
      "five findings",
      "五項紀錄",
      "twenty findings",
      "−43%",
    ])
      expect(verifyAnswer(answer(text), [source], "en")).toBeNull();
    expect(verifyAnswer(answer("5 findings", ["other"]), [source], "en")).toBeNull();
  });
  it("only cited facts ground numbers, not source IDs or field names", () => {
    expect(
      verifyAnswer(answer("99"), [{ ...source, sourceId: "s", facts: { count99: "none" } }], "en"),
    ).toBeNull();
    expect(
      verifyAnswer(
        answer("7"),
        [source, { ...source, sourceId: "unused", facts: { count: 7 } }],
        "en",
      ),
    ).toBeNull();
  });
  it("bounds English and Chinese words, follow-ups and generated links", () => {
    expect(verifyAnswer(answer("word ".repeat(121)), [source], "en")).toBeNull();
    expect(verifyAnswer(answer("價格 ".repeat(121)), [source], "zh-TW")).toBeNull();
    expect(
      verifyAnswer(answer("5 findings", ["s"], ["A?", "B?", "C?", "D?"]), [source], "en"),
    ).toBeNull();
    for (const text of ["https://example.com", "<b>5</b>", "[x](/en)"])
      expect(verifyAnswer(answer(text), [source], "en")).toBeNull();
    expect(verifyAnswer(answer("5 findings", ["s"], ["Why 6?"]), [source], "en")).toBeNull();
  });
  it("keeps dates, signs and percentages distinct", () => {
    expect(numericTokens("２０２６-１１-２２ -43.00% NT$3,733,000.00")).toEqual([
      "2026-11-22",
      "-43%",
      "3733000",
    ]);
  });
});
describe("redaction and exact cost", () => {
  it("removes Taiwan IDs, accounts/cards, and password fields", () => {
    expect(
      redact({
        password: "anything",
        nested: { bankAccount: "123", text: "A123456789 4111 1111 1111 1111 密碼：secret" },
      }),
    ).toEqual({
      password: "[removed]",
      nested: { bankAccount: "[removed]", text: "[removed] [removed] 密碼：[removed]" },
    });
    expect(redactText("amount 3,733,000 and date 2026-11-22")).toBe(
      "amount 3,733,000 and date 2026-11-22",
    );
  });
  it("calculates estimated USD with fixed decimals", () => {
    expect(
      estimatedCost(
        { inputTokens: 1000, outputTokens: 200 },
        { inputUsdPerMillion: "0.30", outputUsdPerMillion: "2.50" },
      ),
    ).toBe("0.000800000");
  });
});
