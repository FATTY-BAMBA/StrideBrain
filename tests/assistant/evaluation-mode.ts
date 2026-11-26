import type { EvaluationQuestion } from "./evaluation";
/** Explicit case ids only; a typo cannot silently turn a focused dispatch into a full run. */
export function evaluationMode(all: readonly EvaluationQuestion[], input: string | undefined) {
  if (!input?.trim()) return { acceptanceRun: true, questions: all, caseIds: undefined };
  const ids = input.split(",").map((s) => s.trim());
  if (
    ids.length > all.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !all.some((q) => q.id === id))
  )
    throw Error("INVALID_FOCUSED_CASE_IDS");
  return { acceptanceRun: false, questions: all.filter((q) => ids.includes(q.id)), caseIds: ids };
}
