import { describe, it, expect } from "vitest";
import { checkAnswer, numericTokens } from "@/modules/assistant/domain/grounding";
import { modelFacts, redactSource } from "@/modules/assistant/domain/redaction";
import type { AssistantSource } from "@/modules/assistant/domain/contracts";
import {
  evaluateAnswer,
  expectedFacts,
  evaluationLogRow,
  type EvaluationQuestion,
} from "./evaluation";
import { runEvaluationRounds, roundSummary, stabilitySummary } from "./evaluation-stability";
import fixtures from "./rejected-answer-fixtures.json";
const source: AssistantSource = {
  sourceId: "s",
  href: "/en",
  label: "Jobs",
  projectKeys: ["J"],
  facts: { count: 4 },
};
const raw = (text: string, followUps: unknown[] = []) => ({ text, sourceIds: ["s"], followUps });
describe("stability regressions", () => {
  it.each(["1.", "2)", "3、", "１．", "２）", "３、", "- 1.", "> 2)"])(
    "ignores marker %s without ignoring the sentence's quantity",
    (marker) => {
      expect(checkAnswer(raw(`${marker} 4 jobs`), [source], "en").kind).toBe("ACCEPTED");
      expect(checkAnswer(raw(`${marker} 5 jobs`), [source], "en")).toEqual({
        kind: "REJECTED",
        reason: "UNSUPPORTED_NUMBER",
      });
      expect(numericTokens(`${marker} 4 jobs\n${marker} NT$1.25`)).toEqual(["4", "1.25"]);
    },
  );
  it("does not ignore a sentence count, decimal amount or date at the start of a line", () => {
    expect(numericTokens("7 jobs\n1.25 dollars\n2026-12-22")).toEqual(["7", "1.25", "2026-12-22"]);
  });
  it.each(["Active Design Project 01", "進行中設計專案01"])(
    "uses every sent source's identity %s but only cited quantitative facts",
    (name) => {
      const identity = {
        ...source,
        sourceId: "unused",
        label: name,
        facts: { name, amount: "999", date: "2026-12-22", count: 9 },
      };
      expect(checkAnswer(raw(`${name}: 4 jobs`), [source, identity], "en").kind).toBe("ACCEPTED");
      for (const text of [
        `${name}: 9 jobs`,
        `${name}: NT$999`,
        `${name}: 2026-12-22`,
        "Unknown Project 02: 4 jobs",
      ])
        expect(checkAnswer(raw(text), [source, identity], "en").kind).toBe("REJECTED");
      const safe = redactSource(
        { ...identity, label: "A123456789", facts: { name: "A123456789" } },
        [],
      );
      expect(checkAnswer(raw("A123456789: 4 jobs"), [source, safe], "en").kind).toBe("REJECTED");
    },
  );
  it("keeps the exact awaiting reply and checks each follow-up independently", () => {
    const fixture = fixtures.find((f) => f.run === 45053587841 && f.id === "zh-TW-awaiting")!;
    const s = {
      ...source,
      label: "進行中設計專案01",
      projectKeys: ["PRJ-ACTIVE-001"],
      facts: {
        name: "進行中設計專案01",
        documentNumber: "PRJ-ACTIVE-001-Q1",
        validUntil: "2027-12-31",
      },
      typedFactPaths: ["documentNumber", "validUntil"],
    };
    const checked = checkAnswer(
      raw(fixture.text, ["需要查看報價金額嗎？", "金額是 NT$999 嗎？", "<b>go</b>"]),
      [s],
      "zh-TW",
    );
    expect(checked).toEqual({
      kind: "ACCEPTED",
      answer: { text: fixture.text, sourceIds: ["s"], followUps: ["需要查看報價金額嗎？"] },
    });
    expect(
      checkAnswer({ text: "4 jobs", sourceIds: ["s"], followUps: "malformed" }, [source], "en"),
    ).toMatchObject({ kind: "ACCEPTED", answer: { followUps: [] } });
    expect(
      checkAnswer(raw("4 jobs", [null, "x".repeat(161), "Why 99?"]), [source], "en"),
    ).toMatchObject({ kind: "ACCEPTED", answer: { followUps: [] } });
  });
  it("keeps check markers server-side and omits missing model values recursively", () => {
    const facts = {
      observationType: "QUOTED_PRICE",
      basis: "ISSUED",
      nested: { acceptedOn: null, amount: "NT$500", evidenceReferenceIds: ["private"] },
      list: [null, { authorityState: "ACCEPTED", label: "Available" }],
    };
    expect(modelFacts(facts)).toEqual({
      nested: { amount: "NT$500" },
      list: [{ label: "Available" }],
    });
    expect(facts.observationType).toBe("QUOTED_PRICE");
  });
  it("accepts any exact saved finding and records follow-ups only in the artifact", () => {
    const sentences = [
      "Overall: quoted price is 7.2% above past quoted prices.",
      "Site coordination and handover: quoted price is 28.0% below past quoted prices.",
    ];
    const q = {
      expected: { kind: "FACTS", facts: [], forbidden: [], match: "ANY_SAVED_FINDING" },
    } as unknown as EvaluationQuestion;
    const s = {
      ...source,
      projectKeys: ["PRJ-XINYI-026"],
      facts: { findings: sentences.map((text) => ({ text })) },
    };
    expect(expectedFacts(q, [s])).toEqual(sentences);
    const text = fixtures.find((f) => f.id === "en-finding")!.text;
    const answer = { text, sourceIds: ["s"], followUps: ["Open the comparison?"] };
    const result = evaluateAnswer(
      q,
      { kind: "ANSWER", locale: "en", answer, sources: [s] },
      sentences,
      answer,
      [s],
    );
    expect(result).toMatchObject({
      verdict: "grounded and correct",
      rawFollowUps: answer.followUps,
      followUps: answer.followUps,
    });
    const bad = { ...answer, text: "Unrelated wording" };
    expect(
      evaluateAnswer(
        q,
        { kind: "ANSWER", locale: "en", answer: bad, sources: [s] },
        sentences,
        bad,
        [s],
      ).verdict,
    ).toBe("wrong");
    expect(
      evaluationLogRow({
        ...result,
        id: "en-finding",
        locale: "en",
        discardReason: null,
        latencyMs: 1,
        calls: 1,
        inputTokens: 1,
        outputTokens: 1,
        estimatedUsd: "0",
      }),
    ).not.toHaveProperty("followUps");
  });
  it("expands whole items with saved wording, so a model's wrong direction cannot survive", () => {
    const saved = "Overall: quoted price is 43.0% above past quoted prices.";
    const s = { ...source, facts: { findings: [{ text: saved }] } };
    expect(
      checkAnswer(raw("1. The quoted price is 43% below past quotes."), [s], "en"),
    ).toMatchObject({ kind: "ACCEPTED", answer: { text: saved } });
    expect(checkAnswer(raw("The quoted price is 44% below past quotes."), [s], "en")).toEqual({
      kind: "REJECTED",
      reason: "UNSUPPORTED_NUMBER",
    });
    expect(checkAnswer(raw("43%"), [{ ...source, facts: { variance: "43%" } }], "en")).toEqual({
      kind: "REJECTED",
      reason: "UNSUPPORTED_NUMBER",
    });
    const ambiguous = {
      ...s,
      facts: {
        findings: [
          { text: saved },
          { text: "Overall: forecast cost is 43.0% below past reconciled actual costs." },
        ],
      },
    };
    expect(checkAnswer(raw("43% difference."), [ambiguous], "en")).toEqual({
      kind: "REJECTED",
      reason: "FINDING_SENTENCE",
    });
  });
  const rows = (en: number, zh: number) =>
    ["en", "zh-TW"].flatMap((locale) =>
      Array.from({ length: 20 }, (_, i) => ({
        id: `${locale}-${i}`,
        locale: locale as "en" | "zh-TW",
        verdict: i < (locale === "en" ? en : zh) ? "grounded and correct" : "wrong",
        wrongNumber: false,
      })),
    );
  it("runs all three rounds, fails if any round fails, and reports per-question pass rates", async () => {
    const calls: number[] = [];
    const result = await runEvaluationRounds(async (round) => {
      calls.push(round);
      return round === 2 ? rows(18, 15) : rows(19, 16);
    });
    expect(calls).toEqual([1, 2, 3]);
    expect(result.passed).toBe(false);
    expect(result.rounds.map((r) => r.scores)).toEqual([
      { en: 19, "zh-TW": 16 },
      { en: 18, "zh-TW": 15 },
      { en: 19, "zh-TW": 16 },
    ]);
    expect(result.perQuestion.find((q) => q.id === "zh-TW-15")).toMatchObject({
      passes: 2,
      rounds: 3,
      passRate: 2 / 3,
    });
    expect((await runEvaluationRounds(async () => rows(16, 16))).passed).toBe(true);
    const wrong = rows(20, 20);
    wrong[0]!.wrongNumber = true;
    expect(roundSummary(1, wrong).passed).toBe(false);
    expect(stabilitySummary([roundSummary(1, rows(20, 20))]).passed).toBe(false);
  });
});
