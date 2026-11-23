import type { Locale } from "@/modules/localization/config";
export const evaluationRounds = 3;
export type ScoredRow = {
  id: string;
  locale: Locale;
  verdict: string;
  wrongNumber: boolean;
  wrongAmountLabel: boolean;
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
    new Set(questions.map((q) => q.id)).size === 50 &&
    questions.filter((q) => q.required && !q.qualityRegression).length === 8 &&
    questions.filter((q) => q.required && q.qualityRegression).length === 2;
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
  return {
    round,
    callTargets,
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
          q.verdict !== "wrong" &&
          !q.wrongNumber &&
          !q.wrongAmountLabel,
      ).length,
      total: 8,
    },
    passed:
      complete &&
      withinThree * 10 >= questions.length * 9 &&
      callTargets.maximum <= 5 &&
      callTargets.namedRefusalMaximum <= 2 &&
      Object.values(scores).every((s) => s >= 16) &&
      questions.every(
        (q) => !q.wrongNumber && !q.wrongAmountLabel && (!q.required || q.verdict !== "wrong"),
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
      perQuestion.length === 50 &&
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
