import { describe, it, expect } from "vitest";
import { runEvaluationRounds, roundSummary, stabilitySummary } from "./evaluation-stability";
describe("three-round evaluation gates", () => {
  const rows = (en: number, zh: number) =>
    ["en", "zh-TW"].flatMap((locale) =>
      Array.from({ length: 42 }, (_, i) => ({
        id: `${locale}-${i}`,
        locale: locale as "en" | "zh-TW",
        required: i >= 20 && i < 41,
        reported: i === 41,
        qualityRegression: i === 24,
        calls: 2,
        latencyMs: 1000,
        estimatedUsd: "0.001",
        wrongRecordValue: false,
        factSelectionRegression: i >= 27 && i < 41,
        namedJobRefusal: false,
        wrongAmountLabel: false,
        badDisplayFormat: false,
        verdict: i >= 20 || i < (locale === "en" ? en : zh) ? "grounded and correct" : "wrong",
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
    const critical = rows(20, 20);
    critical.find((q) => q.required)!.verdict = "wrong";
    expect(roundSummary(1, critical).passed).toBe(false);
    expect(stabilitySummary([roundSummary(1, rows(20, 20))]).passed).toBe(false);
  });
  it("requires each added job-page case to pass in every round", async () => {
    const complete = rows(20, 20);
    for (const locale of ["en", "zh-TW"])
      for (const index of [25, 26]) {
        const failed = complete.map((q) =>
          q.id === `${locale}-${index}` ? { ...q, verdict: "wrong" } : q,
        );
        expect(roundSummary(1, failed).passed).toBe(false);
        expect(
          (await runEvaluationRounds(async (round) => (round === 2 ? failed : complete))).passed,
        ).toBe(false);
      }
    expect(
      roundSummary(
        1,
        complete.filter((q) => !q.id.endsWith("-26")),
      ).passed,
    ).toBe(false);
  });
  it("requires unresolved-subject cases to reach the model", () => {
    const sample = rows(20, 20).map((q, i) => ({ ...q, mustReachModel: i === 27 }));
    sample[27]!.calls = 0;
    expect(roundSummary(1, sample).passed).toBe(false);
    sample[27]!.calls = 1;
    expect(roundSummary(1, sample).passed).toBe(true);
  });
  it("enforces call targets and rejects every displayed mislabel", () => {
    const sample = rows(20, 20);
    for (let i = 0; i < 5; i++) sample[i]!.calls = 4;
    expect(roundSummary(1, sample)).toMatchObject({
      factSelectionRegressions: { passed: 28, total: 28 },
      passed: true,
      callTargets: { median: 2, maximum: 4, withinThree: 79, questions: 84 },
    });
    sample[5]!.calls = 4;
    sample[6]!.calls = 4;
    sample[7]!.calls = 4;
    sample[8]!.calls = 4;
    expect(roundSummary(1, sample).passed).toBe(false);
    sample[5]!.calls = 2;
    sample[6]!.calls = 2;
    sample[7]!.calls = 2;
    sample[8]!.calls = 2;
    sample[0]!.calls = 6;
    expect(roundSummary(1, sample).passed).toBe(false);
    sample[0]!.calls = 3;
    sample[0]!.namedJobRefusal = true;
    expect(roundSummary(1, sample).passed).toBe(false);
    sample[0]!.calls = 2;
    sample[0]!.wrongAmountLabel = true;
    expect(roundSummary(1, sample).passed).toBe(false);
    sample[0]!.wrongAmountLabel = false;
    sample[0]!.badDisplayFormat = true;
    expect(roundSummary(1, sample).passed).toBe(false);
  });
});
