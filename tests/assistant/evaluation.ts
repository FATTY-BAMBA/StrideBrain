import type {
  AssistantOutcome,
  AssistantSource,
  ToolCall,
} from "@/modules/assistant/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { redactSource } from "@/modules/assistant/domain/redaction";
import { hasUnsupportedNumbers, numericTokens, record } from "@/modules/assistant/domain/grounding";
export type EvaluationQuestion = {
  id: string;
  locale: Locale;
  person: string;
  question: string;
  oracleTools: ToolCall[];
  expected: { kind: "FACTS" | "DECLINE"; facts: string[]; forbidden: string[] };
};
function path(value: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>((v, k) => (Array.isArray(v) ? v[Number(k)] : record(v)?.[k]), value);
}
/** @paths bind to deterministic tool facts from the seeded records, never to model output. */
export function expectedFacts(
  question: EvaluationQuestion,
  oracle: readonly AssistantSource[],
): string[] {
  return question.expected.facts.map((f) => {
    if (!f.startsWith("@")) return f;
    const value = oracle
      .map((s) => path(s.facts, f.slice(1)))
      .find((v) => v !== undefined && v !== null);
    if (typeof value !== "string" && typeof value !== "number")
      throw new Error(`EVALUATION_ORACLE_MISSING:${question.id}:${f}`);
    return String(value);
  });
}
export function evaluateAnswer(
  question: EvaluationQuestion,
  outcome: AssistantOutcome,
  facts: readonly string[],
  rawAnswer: unknown,
  ledger: readonly AssistantSource[],
) {
  const raw = record(rawAnswer),
    text = typeof raw?.text === "string" ? raw.text : "";
  const cited = Array.isArray(raw?.sourceIds)
    ? ledger
        .filter((s) => (raw.sourceIds as unknown[]).includes(s.sourceId))
        .map((s) => redactSource(s, s.projectKeys))
    : [];
  const output = [
    text,
    ...(Array.isArray(raw?.followUps)
      ? raw.followUps.filter((f): f is string => typeof f === "string")
      : []),
  ].join(" ");
  const wrongNumber = hasUnsupportedNumbers(output, cited);
  if (outcome.kind !== "ANSWER" || wrongNumber) return { verdict: "wrong" as const, wrongNumber };
  if (
    question.expected.forbidden.some(
      (f) =>
        outcome.answer.text.includes(f) || outcome.sources.some((s) => s.projectKeys.includes(f)),
    )
  )
    return { verdict: "wrong" as const, wrongNumber };
  if (question.expected.kind === "DECLINE")
    return {
      verdict:
        outcome.answer.sourceIds.length === 0
          ? ("correctly declined" as const)
          : ("wrong" as const),
      wrongNumber,
    };
  const all = facts.every(
    (f) =>
      outcome.answer.text.toLocaleLowerCase().includes(f.toLocaleLowerCase()) ||
      (numericTokens(f).length > 0 &&
        !/[A-Za-z]{2,}/.test(f.replace(/NT|USD|TWD/gi, "")) &&
        numericTokens(f).every((n) => numericTokens(outcome.answer.text).includes(n))),
  );
  return {
    verdict:
      all && outcome.answer.sourceIds.length > 0
        ? ("grounded and correct" as const)
        : ("wrong" as const),
    wrongNumber,
  };
}
