import type {
  AssistantOutcome,
  AssistantSource,
  ToolCall,
} from "@/modules/assistant/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { redactSource } from "@/modules/assistant/domain/redaction";
import {
  citedSources,
  sourceReferences,
  unsupportedNumericTokens,
  numericTokens,
  record,
} from "@/modules/assistant/domain/grounding";
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
  authorizedReferences: readonly string[] = [],
) {
  const raw = record(rawAnswer),
    rawAnswerText = typeof raw?.text === "string" ? raw.text : null;
  const references = sourceReferences(ledger, authorizedReferences);
  const safeLedger = ledger.map((s) => redactSource(s, references));
  const draftCited = citedSources(
    safeLedger,
    Array.isArray(raw?.sourceIds)
      ? raw.sourceIds.filter((id): id is string => typeof id === "string")
      : [],
  );
  const draftOutput = [
    rawAnswerText ?? "",
    ...(Array.isArray(raw?.followUps)
      ? raw.followUps.filter((f): f is string => typeof f === "string")
      : []),
  ].join(" ");
  const draftUnsupportedTokens = unsupportedNumericTokens(draftOutput, draftCited, references);
  // A discarded draft is diagnostic data, not the answer seen by the person.
  const displayed =
    outcome.kind === "ANSWER" ? [outcome.answer.text, ...outcome.answer.followUps].join(" ") : "";
  const displayedCited =
    outcome.kind === "ANSWER" ? citedSources(safeLedger, outcome.answer.sourceIds) : [];
  const unsupportedTokens = unsupportedNumericTokens(displayed, displayedCited, references);
  const wrongNumber = unsupportedTokens.length > 0;
  const report = (verdict: "wrong" | "correctly declined" | "grounded and correct") => ({
    verdict,
    wrongNumber,
    draftWrongNumber: draftUnsupportedTokens.length > 0,
    draftUnsupportedTokens,
    ...(verdict === "wrong" ? { unsupportedTokens, rawAnswerText } : {}),
  });
  if (outcome.kind !== "ANSWER" || wrongNumber) return report("wrong");
  if (
    question.expected.forbidden.some(
      (f) =>
        outcome.answer.text.includes(f) || outcome.sources.some((s) => s.projectKeys.includes(f)),
    )
  )
    return report("wrong");
  if (question.expected.kind === "DECLINE")
    return report(outcome.answer.sourceIds.length === 0 ? "correctly declined" : "wrong");
  const all = facts.every(
    (f) =>
      outcome.answer.text.toLocaleLowerCase().includes(f.toLocaleLowerCase()) ||
      (numericTokens(f).length > 0 &&
        !/[A-Za-z]{2,}/.test(f.replace(/NT|USD|TWD/gi, "")) &&
        numericTokens(f).every((n) => numericTokens(outcome.answer.text).includes(n))),
  );
  return report(all && outcome.answer.sourceIds.length > 0 ? "grounded and correct" : "wrong");
}
/** Explicit allowlist: raw text and unsupported values belong only in the synthetic artifact. */
export function evaluationLogRow(
  row: ReturnType<typeof evaluateAnswer> & {
    id: string;
    locale: Locale;
    discardReason: string | null;
    latencyMs: number;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    estimatedUsd: string;
    fallback?: string;
  },
) {
  return {
    id: row.id,
    locale: row.locale,
    verdict: row.verdict,
    wrongNumber: row.wrongNumber,
    draftWrongNumber: row.draftWrongNumber,
    discardReason: row.discardReason,
    latencyMs: row.latencyMs,
    calls: row.calls,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    estimatedUsd: row.estimatedUsd,
    ...(row.fallback ? { fallback: row.fallback } : {}),
  };
}
