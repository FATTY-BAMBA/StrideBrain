import { describe, it, expect } from "vitest";
import { hasUnresolvedJobSelector } from "@/modules/assistant/domain/subjects";
const visible = [{ projectKey: "PRJ-XINYI-026", names: ["Xinyi flagship", "信義旗艦店裝修"] }];
describe("explicit job selectors", () => {
  it.each([
    "進行中設計專案01的報價總計是多少？",
    "What is the quote total for Active Design Project 01?",
    "進行中設計專案02的報價單號是什麼？",
    "進行中設計專案02目前在哪個階段？",
    "「月光咖啡館」這個專案的報價總計是多少？",
    "What is the quote total for Moonlight Cafe?",
    "PRJ-ACTIVE-001 的報價是多少？",
  ])("does not substitute a page for %s", (question) => {
    expect(hasUnresolvedJobSelector(question, visible)).toBe(true);
  });
  it.each([
    "信義旗艦店裝修的報價總計是多少？",
    "What is the quote total for Xinyi flagship?",
    "PRJ-XINYI-026 的報價是多少？",
    "這個專案的報價總計是多少？",
    "What is the quote total for this job?",
    "哪些報價還在等客戶回覆？",
    "天花板一坪我們報多少？",
    "How much do we quote for Ceiling per ping?",
  ])("preserves readable or implicit context: %s", (question) => {
    expect(hasUnresolvedJobSelector(question, visible)).toBe(false);
  });
});
