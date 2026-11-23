import { describe, it, expect } from "vitest";
import evaluationConfig from "../../vitest.ai-eval.config";
import { checkAnswer, parseAnswer } from "@/modules/assistant/domain/grounding";
import type { AssistantSource, AssistantOutcome } from "@/modules/assistant/domain/contracts";
import { evaluateAnswer, evaluationLogRow, type EvaluationQuestion } from "./evaluation";
import questions from "./questions.json";
const source: AssistantSource = {
  sourceId: "past",
  href: "/en/projects/PRJ-XINYI-026/quote",
  label: "Past prices",
  projectKeys: ["PRJ-XINYI-026"],
  facts: { observationType: "QUOTED_PRICE", displayMedian: "NT$5,833", count: 3 },
  typedFactPaths: ["displayMedian", "count"],
};
const answer = (text: string, sourceIds = ["past"]) => ({ text, sourceIds, followUps: [] });
const factQuestion = {
  expected: { kind: "FACTS", facts: [], forbidden: [] },
} as unknown as EvaluationQuestion;
const shown = (
  text: string,
  sources = [source],
): Extract<AssistantOutcome, { kind: "ANSWER" }> => ({
  kind: "ANSWER",
  locale: "en",
  answer: answer(
    text,
    sources.map((s) => s.sourceId),
  ),
  sources,
});
describe("paid evaluation regressions", () => {
  it("configures only the paid runner, retaining shared aliases but replacing include", () => {
    expect(evaluationConfig.test?.include).toEqual([
      "tests/assistant/provider-evaluation.runner.ts",
    ]);
    expect(evaluationConfig.resolve?.alias).toHaveProperty("@");
    expect(evaluationConfig.test?.fileParallelism).toBe(false);
  });
  it.each(["en-viewer-amount", "en-other-org", "zh-TW-viewer-amount", "zh-TW-other-org"])(
    "scores the displayed fixed refusal for %s independently of the discarded draft",
    (id) => {
      const question = questions.find((q) => q.id === id)! as EvaluationQuestion;
      const text =
        question.locale === "en"
          ? "The records do not show this information."
          : "目前的紀錄沒有顯示這項資訊。";
      const outcome = shown(text, []);
      const report = evaluateAnswer(
        question,
        outcome,
        [],
        answer("PRJ-FOREIGN-001: NT$999", []),
        [],
      );
      expect(report).toMatchObject({
        verdict: "correctly declined",
        wrongNumber: false,
        draftWrongNumber: true,
      });
      expect(report.draftUnsupportedTokens).toContain("999");
    },
  );
  it.each(["PRJ-XINYI-026", "20261103-01", "2026-0012", "113-0825-01", "J-2611-2345"])(
    "does not treat authorized job reference %s as a number in a past-price answer",
    (reference) => {
      const s = { ...source, projectKeys: [reference] };
      const text = `${reference}: NT$5,833`;
      expect(checkAnswer(answer(text), [s], "en").kind).toBe("ACCEPTED");
      expect(
        evaluateAnswer(factQuestion, shown(text, [s]), ["NT$5,833"], answer(text), [s]),
      ).toMatchObject({
        verdict: "grounded and correct",
        wrongNumber: false,
        draftWrongNumber: false,
      });
      expect(checkAnswer(answer(`${reference}: NT$5,834`), [s], "en")).toEqual({
        kind: "REJECTED",
        reason: "UNSUPPORTED_NUMBER",
      });
    },
  );
  it("exempts typed document numbers from any source in the turn and independently authorized question references", () => {
    const quote = {
      ...source,
      sourceId: "quote",
      facts: { issued: { documentNumber: "Q-2026-0199" } },
      typedFactPaths: ["issued.documentNumber"],
    };
    const text = "Q-2026-0199, QUESTION-008: NT$5,833";
    const sources = [source, quote];
    expect(checkAnswer(answer(text), sources, "en", ["QUESTION-008"]).kind).toBe("ACCEPTED");
    expect(
      evaluateAnswer(factQuestion, shown(text), ["NT$5,833"], answer(text), sources, [
        "QUESTION-008",
      ]),
    ).toMatchObject({
      verdict: "grounded and correct",
      wrongNumber: false,
      draftWrongNumber: false,
    });
    expect(checkAnswer(answer(text), sources, "en").kind).toBe("REJECTED");
    for (const text of ["PRJ-XINYI-026-999: NT$5,833", "PRJ-UNKNOWN-999: NT$5,833", "NT$026"]) {
      expect(checkAnswer(answer(text), sources, "en").kind).toBe("REJECTED");
    }
    const untyped = { ...quote, typedFactPaths: [] };
    expect(checkAnswer(answer("Q-2026-0199: NT$5,833"), [source, untyped], "en").kind).toBe(
      "REJECTED",
    );
  });
  it.each([
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
    ["five", 5],
    ["six", 6],
    ["seven", 7],
    ["eight", 8],
    ["nine", 9],
    ["ten", 10],
    ["eleven", 11],
    ["twelve", 12],
    ["一", 1],
    ["二", 2],
    ["兩", 2],
    ["三", 3],
    ["四", 4],
    ["五", 5],
    ["六", 6],
    ["七", 7],
    ["八", 8],
    ["九", 9],
    ["十", 10],
  ] as const)(
    "checks %s against the list's count %s even when only a row was cited",
    (word, count) => {
      const row = {
        ...source,
        sourceId: "row",
        countSourceId: "count",
        facts: { reference: "PRJ-XINYI-026" },
        typedFactPaths: ["reference"],
      };
      const countSource = {
        ...source,
        sourceId: "count",
        facts: { count },
        typedFactPaths: ["count"],
      };
      const text = /[a-z]/.test(word) ? `${word} jobs` : `${word}個專案`;
      const raw = answer(text, ["row"]);
      const checked = checkAnswer(raw, [row, countSource], "zh-TW");
      expect(checked).toMatchObject({ kind: "ACCEPTED", answer: { sourceIds: ["row", "count"] } });
      expect(
        evaluateAnswer(factQuestion, { ...shown(text, [row]), answer: raw }, [String(count)], raw, [
          row,
          countSource,
        ]),
      ).toMatchObject({
        verdict: "grounded and correct",
        wrongNumber: false,
        draftWrongNumber: false,
      });
      const wrongCount = { ...countSource, facts: { count: count + 1 } };
      expect(checkAnswer(raw, [row, wrongCount], "zh-TW")).toEqual({
        kind: "REJECTED",
        reason: "UNSUPPORTED_NUMBER",
      });
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "enforces 240 server words in %s while retaining 1,400 characters",
    (locale) => {
      const word = locale === "en" ? "word " : "紀錄 ";
      for (const n of [120, 121, 240])
        expect(checkAnswer(answer(word.repeat(n)), [source], locale).kind).toBe("ACCEPTED");
      expect(checkAnswer(answer(word.repeat(241)), [source], locale)).toEqual({
        kind: "REJECTED",
        reason: "WORD_LIMIT",
      });
      expect(parseAnswer(answer("x".repeat(1400)), locale)).not.toBeNull();
      expect(parseAnswer(answer("x".repeat(1401)), locale)).toBeNull();
    },
  );
  it("includes raw text and unsupported tokens for any non-pass, but excludes them from log rows", () => {
    const text = "PRJ-XINYI-026: NT$5,834";
    const result = evaluateAnswer(factQuestion, shown(text), ["NT$5,833"], answer(text), [source]);
    expect(result).toMatchObject({
      verdict: "wrong",
      wrongNumber: true,
      unsupportedTokens: ["5834"],
      draftUnsupportedTokens: ["5834"],
      rawAnswerText: text,
    });
    const log = evaluationLogRow({
      ...result,
      id: "synthetic",
      locale: "en",
      discardReason: "UNSUPPORTED_NUMBER",
      latencyMs: 1,
      calls: 1,
      inputTokens: 1,
      outputTokens: 1,
      estimatedUsd: "0",
    });
    expect(log).not.toHaveProperty("rawAnswerText");
    expect(log).not.toHaveProperty("unsupportedTokens");
    expect(log).not.toHaveProperty("draftUnsupportedTokens");
    expect(JSON.stringify(log)).not.toContain("5834");
    const noWrongNumber = evaluateAnswer(
      factQuestion,
      shown("Not enough detail"),
      ["NT$5,833"],
      answer("Not enough detail"),
      [source],
    );
    expect(noWrongNumber).toMatchObject({
      verdict: "wrong",
      unsupportedTokens: [],
      rawAnswerText: "Not enough detail",
    });
  });
});
