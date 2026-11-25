import {
  decimalFromString,
  decimalToString,
  sum,
  divide,
  quantity,
  compare,
} from "@/modules/finance/fixed-decimal";
import type { Locale } from "@/modules/localization/config";
export const evaluationRounds = 3;
export type ScoredRow = {
  id: string;
  locale: Locale;
  verdict: string;
  wrongNumber: boolean;
  wrongRecordValue: boolean;
  factSelectionRegression?: boolean;
  latencyMs: number;
  estimatedUsd: string;
  wrongAmountLabel: boolean;
  badDisplayFormat: boolean;
  calls: number;
  namedJobRefusal?: boolean;
  qualityRegression?: boolean;
  required?: boolean;
};
export function roundSummary<T extends ScoredRow>(round: number, questions: readonly T[]) {
  const scores = Object.fromEntries(
    ["en", "zh-TW"].map((locale) => [
      locale,
      questions.filter(
        (q) => !q.required && q.locale === locale && q.verdict !== "wrong" && !q.wrongNumber,
      ).length,
    ]),
  );
  const complete =
    ["en", "zh-TW"].every(
      (locale) => questions.filter((q) => !q.required && q.locale === locale).length === 20,
    ) &&
    new Set(questions.map((q) => q.id)).size === 62 &&
    questions.filter((q) => q.required && !q.qualityRegression && !q.factSelectionRegression)
      .length === 12 &&
    questions.filter((q) => q.required && q.qualityRegression).length === 2 &&
    questions.filter((q) => q.required && q.factSelectionRegression).length === 8;
  const sortedCalls = questions.map((q) => q.calls).sort((a, b) => a - b);
  const withinThree = sortedCalls.filter((n) => n <= 3).length;
  const callTargets = {
    median:
      (sortedCalls[Math.floor((sortedCalls.length - 1) / 2)]! +
        sortedCalls[Math.floor(sortedCalls.length / 2)]!) /
      2,
    maximum: sortedCalls.at(-1) ?? 0,
    withinThree,
    questions: questions.length,
    namedRefusalMaximum: Math.max(
      0,
      ...questions.filter((q) => q.namedJobRefusal).map((q) => q.calls),
    ),
  };
  const latency = questions.map((q) => q.latencyMs).sort((a, b) => a - b);
  const totalUsd = sum(
    questions.map((q) => decimalFromString(q.estimatedUsd, 9)),
    9,
  );
  const costPerQuestion = divide(totalUsd, quantity(String(questions.length || 1)), 12);
  const limitCost = divide(decimalFromString("0.2475", 9), quantity("162"), 12);
  const performance = {
    medianMs: latency[Math.floor(latency.length / 2)] ?? 0,
    p90Ms: latency[Math.max(0, Math.ceil(latency.length * 0.9) - 1)] ?? 0,
    totalUsd: decimalToString(totalUsd),
    costPerQuestionUsd: decimalToString(costPerQuestion),
    baseline: { medianCalls: 2, p90Ms: 2000, costUsd: "0.198", questions: 162 },
    limits: { p90Ms: 2500, costPerQuestionUsd: decimalToString(limitCost) },
  };
  const performancePassed =
    callTargets.median <= 2 &&
    performance.p90Ms <= 2500 &&
    compare(costPerQuestion, limitCost) <= 0;
  return {
    round,
    callTargets,
    performance,
    performancePassed,
    factSelectionRegressions: {
      passed: questions.filter(
        (q) => q.factSelectionRegression && q.verdict !== "wrong" && !q.wrongRecordValue,
      ).length,
      total: 8,
    },
    qualityRegressions: {
      passed: questions.filter(
        (q) =>
          q.qualityRegression && q.verdict !== "wrong" && !q.wrongNumber && !q.wrongAmountLabel,
      ).length,
      total: 2,
    },
    scores,
    hostedRegressions: {
      passed: questions.filter(
        (q) =>
          q.required &&
          !q.qualityRegression &&
          !q.factSelectionRegression &&
          q.verdict !== "wrong" &&
          !q.wrongRecordValue &&
          !q.wrongNumber &&
          !q.wrongAmountLabel,
      ).length,
      total: 12,
    },
    passed:
      complete &&
      performancePassed &&
      withinThree * 10 >= questions.length * 9 &&
      callTargets.maximum <= 5 &&
      callTargets.namedRefusalMaximum <= 2 &&
      Object.values(scores).every((s) => s >= 16) &&
      questions.every(
        (q) =>
          !q.wrongRecordValue &&
          !q.wrongNumber &&
          !q.wrongAmountLabel &&
          !q.badDisplayFormat &&
          (!q.required || q.verdict !== "wrong"),
      ),
    questions,
  };
}
export function stabilitySummary<T extends ScoredRow>(
  rounds: readonly ReturnType<typeof roundSummary<T>>[],
) {
  const ids = [...new Set(rounds.flatMap((r) => r.questions.map((q) => q.id)))];
  const perQuestion = ids.map((id) => {
    const rows = rounds.flatMap((r) => r.questions.filter((q) => q.id === id));
    const passes = rows.filter(
      (q) => q.verdict !== "wrong" && !q.wrongNumber && !q.wrongAmountLabel,
    ).length;
    return {
      id,
      locale: rows[0]!.locale,
      passes,
      rounds: evaluationRounds,
      passRate: passes / evaluationRounds,
      calls: rows.map((q) => q.calls),
      callMedian:
        [...rows.map((q) => q.calls)].sort((a, b) => a - b)[Math.floor(rows.length / 2)] ?? 0,
      callMaximum: Math.max(0, ...rows.map((q) => q.calls)),
    };
  });
  return {
    passed:
      rounds.length === evaluationRounds &&
      rounds.every((r) => r.passed) &&
      perQuestion.length === 62 &&
      ids.every((id) => rounds.every((r) => r.questions.some((q) => q.id === id))),
    rounds,
    perQuestion,
  };
}
/** Keep collecting after a failed round; each round owns fresh synthetic fixture state. */
export async function runEvaluationRounds<T extends ScoredRow>(
  run: (round: number) => Promise<readonly T[]>,
) {
  const rounds = [];
  for (let round = 1; round <= evaluationRounds; round++)
    rounds.push(roundSummary(round, await run(round)));
  return stabilitySummary(rounds);
}
