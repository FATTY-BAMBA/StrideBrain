import { describe, it, expect } from "vitest";
import { AnswerFactRegistry } from "@/modules/assistant/domain/fact-answers";
import legacy from "./legacy-prose-fixtures.json";
import fixtures from "./rejected-answer-fixtures.json";
import quality from "./quality-rejected-answer-fixtures.json";
import sb060 from "./sb060-rejected-answer-fixtures.json";
import hosted from "./hosted-paid-answers.json";
/** Old accept/reject prose fixtures now prove that model-authored wording cannot be displayed. */
describe("historical prose is never an answer in v0.3", () => {
  const texts = [
    ...new Set(
      [...legacy, ...fixtures, ...quality, ...sb060]
        .map((f) => f.text)
        .concat(hosted.map((f) => f.rawAnswerText)),
    ),
  ];
  it.each(texts)("rejects model text: %s", (text) => {
    const registry = new AnswerFactRegistry("en");
    registry.register([
      {
        sourceId: "s",
        href: "/en",
        label: "Quote",
        projectKeys: ["J"],
        facts: {
          amounts: {
            totalAmount: "NT$11,665,710",
            taxAmount: "NT$555,510",
            amountBeforeTax: "NT$11,110,200",
          },
        },
      },
    ]);
    expect(registry.render({ text, sourceIds: ["s"], followUps: [] })).toEqual({
      kind: "REJECTED",
      reason: "INVALID_OUTPUT",
    });
    expect(
      registry.render({
        parts: [{ say: text }, { show: "s1.amounts.totalAmount" }],
        followUps: [],
      }),
    ).toEqual({ kind: "REJECTED", reason: "INVALID_OUTPUT" });
    expect(
      registry.render({
        parts: [{ say: "RECORDS_SHOW" }, { show: "s1.amounts.totalAmount", text }],
        followUps: [],
      }),
    ).toEqual({ kind: "REJECTED", reason: "INVALID_OUTPUT" });
    expect(
      registry.render({
        parts: [{ say: "RECORDS_SHOW" }, { show: "s1.amounts.totalAmount" }],
        followUps: [],
      }),
    ).toMatchObject({
      kind: "ACCEPTED",
      answer: { text: "Here is what the records show:\n\nQuote\nTotal: NT$11,665,710" },
    });
  });
});
