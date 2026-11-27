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
  mustReachModel?: boolean;
  qualityRegression?: boolean;
  required?: boolean;
  friendlierMiss?: boolean;
  reported?: boolean;
  discardReason?: string | null;
  accessViolation?: boolean;
};
const median = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length
    ? (sorted[Math.floor((sorted.length - 1) / 2)]! + sorted[Math.floor(sorted.length / 2)]!) / 2
    : 0;
};
const safe = (q: ScoredRow) =>
  !q.wrongRecordValue &&
  !q.wrongNumber &&
  !q.wrongAmountLabel &&
  !q.badDisplayFormat &&
  !q.accessViolation &&
  !q.discardReason;
const correct = (q: ScoredRow) =>
  safe(q) && q.verdict !== "wrong" && (!q.mustReachModel || q.calls > 0);
export function roundSummary<T extends ScoredRow>(
  round: number,
  questions: readonly T[],
  legacySb079Replay = false,
) {
  const scores = Object.fromEntries(
    ["en", "zh-TW"].map((locale) => [
      locale,
      questions.filter(
        (q) =>
          !q.required &&
          !q.reported &&
          q.locale === locale &&
          q.verdict !== "wrong" &&
          !q.wrongNumber,
      ).length,
    ]),
  );
  const complete =
    ["en", "zh-TW"].every(
      (locale) =>
        questions.filter((q) => !q.required && !q.reported && q.locale === locale).length === 20,
    ) &&
    new Set(questions.map((q) => q.id)).size === (legacySb079Replay ? 84 : 112) &&
    questions.filter((q) => q.reported).length === 2 &&
    questions.filter(
      (q) => q.required && !q.friendlierMiss && !q.qualityRegression && !q.factSelectionRegression,
    ).length === 12 &&
    questions.filter((q) => q.required && q.qualityRegression).length === 2 &&
    questions.filter((q) => q.required && q.factSelectionRegression).length === 28 &&
    questions.filter((q) => q.friendlierMiss).length === (legacySb079Replay ? 0 : 28);
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
    namedRefusalMedian: median(questions.filter((q) => q.namedJobRefusal).map((q) => q.calls)),
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
  const limitCost = divide(decimalFromString("0.440789000", 9), quantity("252"), 12);
  const performance = {
    medianMs: latency[Math.floor(latency.length / 2)] ?? 0,
    p90Ms: latency[Math.max(0, Math.ceil(latency.length * 0.9) - 1)] ?? 0,
    totalUsd: decimalToString(totalUsd),
    costPerQuestionUsd: decimalToString(costPerQuestion),
    baseline: {
      run: "45804259788",
      medianCalls: 2,
      p90Ms: 2428,
      costUsd: "0.352631200",
      questions: 252,
    },
    limits: { p90Ms: 3035, costPerQuestionUsd: decimalToString(limitCost) },
  };
  const performancePassed =
    callTargets.median <= 2 &&
    performance.p90Ms <= 3035 &&
    compare(costPerQuestion, limitCost) <= 0;
  return {
    round,
    callTargets,
    performance,
    performancePassed,
    friendlierMisses: {
      passed: questions.filter((q) => q.friendlierMiss && correct(q)).length,
      total: 28,
    },
    factSelectionRegressions: {
      passed: questions.filter(
        (q) => q.factSelectionRegression && q.verdict !== "wrong" && !q.wrongRecordValue,
      ).length,
      total: 28,
    },
    reportedCases: {
      passed: questions.filter((q) => q.reported && q.verdict !== "wrong" && !q.wrongRecordValue)
        .length,
      total: 2,
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
          !q.friendlierMiss &&
          !q.qualityRegression &&
          !q.factSelectionRegression &&
          q.verdict !== "wrong" &&
          (!q.mustReachModel || q.calls > 0) &&
          !q.wrongRecordValue &&
          !q.wrongNumber &&
          !q.wrongAmountLabel,
      ).length,
      total: 12,
    },
    passed:
      complete &&
      performancePassed &&
      withinThree * 100 >= questions.length * 95 &&
      callTargets.maximum <= 5 &&
      callTargets.namedRefusalMedian <= 2 &&
      Object.values(scores).every((s) => s >= 16) &&
      questions.every((q) => (!q.mustReachModel || q.calls > 0) && safe(q)),
    questions,
  };
}
export function stabilitySummary<T extends ScoredRow>(
  rounds: readonly ReturnType<typeof roundSummary<T>>[],
  focusedCaseIds?: readonly string[],
  legacySb079Replay = false,
) {
  const ids = [...new Set(rounds.flatMap((r) => r.questions.map((q) => q.id)))];
  const perQuestion = ids.map((id) => {
    const rows = rounds.flatMap((r) => r.questions.filter((q) => q.id === id));
    const passes = rows.filter(correct).length;
    return {
      id,
      locale: rows[0]!.locale,
      required: rows[0]!.required ?? false,
      passes,
      rounds: evaluationRounds,
      passRate: passes / evaluationRounds,
      calls: rows.map((q) => q.calls),
      callMedian:
        [...rows.map((q) => q.calls)].sort((a, b) => a - b)[Math.floor(rows.length / 2)] ?? 0,
      callMaximum: Math.max(0, ...rows.map((q) => q.calls)),
    };
  });
  const required = perQuestion.filter((q) => focusedCaseIds || q.required);
  const requiredAnswers = {
    passed: required.reduce((n, q) => n + q.passes, 0),
    total: required.length * evaluationRounds,
  };
  const requiredPassed =
    required.every((q) => q.passes >= 2) &&
    requiredAnswers.passed * 100 >= requiredAnswers.total * 97;
  const absoluteGatesPassed = rounds.every((r) => r.questions.every(safe));
  return {
    acceptanceRun: !focusedCaseIds,
    requiredAnswers,
    requiredPassed,
    absoluteGatesPassed,
    passed:
      requiredPassed &&
      absoluteGatesPassed &&
      rounds.length === evaluationRounds &&
      (focusedCaseIds
        ? rounds.every((r) => r.questions.every((q) => !q.mustReachModel || q.calls > 0))
        : rounds.every((r) => r.passed)) &&
      perQuestion.length === (focusedCaseIds?.length ?? (legacySb079Replay ? 84 : 112)) &&
      ids.every((id) => rounds.every((r) => r.questions.some((q) => q.id === id))),
    rounds,
    perQuestion,
  };
}
/** Keep collecting after a failed round; each round owns fresh synthetic fixture state. */
export async function runEvaluationRounds<T extends ScoredRow>(
  run: (round: number) => Promise<readonly T[]>,
  focusedCaseIds?: readonly string[],
) {
  const rounds = [];
  for (let round = 1; round <= evaluationRounds; round++)
    rounds.push(roundSummary(round, await run(round)));
  return stabilitySummary(rounds, focusedCaseIds);
}
