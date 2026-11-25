import { describe, it, expect } from "vitest";
import { questionLocale } from "@/modules/assistant/domain/grounding";
import { redact, redactText } from "@/modules/assistant/domain/redaction";
import { estimatedCost } from "@/modules/assistant/domain/usage-cost";
it("recognizes question language around localized names", () => {
  expect(questionLocale("What is the quote status for 進行中設計專案01?", "zh-TW")).toBe("en");
  expect(questionLocale("請問PRJ-XINYI-026與PRJ-ACTIVE-001的狀態？", "en")).toBe("zh-TW");
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
