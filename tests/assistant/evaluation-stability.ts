import type { Locale } from "@/modules/localization/config";
export const evaluationRounds = 3;
export type ScoredRow = { id: string; locale: Locale; verdict: string; wrongNumber: boolean };
export function roundSummary<T extends ScoredRow>(round: number, questions: readonly T[]) {
  const scores = Object.fromEntries(
    ["en", "zh-TW"].map((locale) => [
      locale,
      questions.filter((q) => q.locale === locale && q.verdict !== "wrong" && !q.wrongNumber)
        .length,
    ]),
  );
  const complete =
    ["en", "zh-TW"].every((locale) => questions.filter((q) => q.locale === locale).length === 20) &&
    new Set(questions.map((q) => q.id)).size === 40;
  return {
    round,
    scores,
    passed:
      complete &&
      Object.values(scores).every((s) => s >= 16) &&
      questions.every((q) => !q.wrongNumber),
    questions,
  };
}
export function stabilitySummary<T extends ScoredRow>(
  rounds: readonly ReturnType<typeof roundSummary<T>>[],
) {
  const ids = [...new Set(rounds.flatMap((r) => r.questions.map((q) => q.id)))];
  const perQuestion = ids.map((id) => {
    const rows = rounds.flatMap((r) => r.questions.filter((q) => q.id === id));
    const passes = rows.filter((q) => q.verdict !== "wrong" && !q.wrongNumber).length;
    return {
      id,
      locale: rows[0]!.locale,
      passes,
      rounds: evaluationRounds,
      passRate: passes / evaluationRounds,
    };
  });
  return {
    passed:
      rounds.length === evaluationRounds &&
      rounds.every((r) => r.passed) &&
      perQuestion.length === 40 &&
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
