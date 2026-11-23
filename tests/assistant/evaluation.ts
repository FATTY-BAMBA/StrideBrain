import type {
  AssistantOutcome,
  AssistantSource,
  ToolCall,
} from "@/modules/assistant/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { redactSource } from "@/modules/assistant/domain/redaction";
import {
  hasMislabelledQuoteAmount,
  citedSources,
  sourceReferences,
  sourceIdentities,
  unsupportedNumericTokens,
  numericTokens,
  record,
} from "@/modules/assistant/domain/grounding";
export type EvaluationQuestion = {
  id: string;
  locale: Locale;
  person: string;
  question: string;
  projectKey?: string;
  required?: boolean;
  qualityRegression?: boolean;
  scenario?: "EMPTY_AWAITING";
  oracleTools: ToolCall[];
  expected: {
    kind: "FACTS" | "DECLINE";
    facts: string[];
    forbidden: string[];
    match?: "ANY_SAVED_FINDING" | "EMPTY_LIST" | "NOT_FOUND";
  };
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
  if (question.expected.match === "ANY_SAVED_FINDING") {
    const findings = oracle
      .flatMap((s) => (Array.isArray(s.facts.findings) ? s.facts.findings : []))
      .flatMap((f) => (typeof record(f)?.text === "string" ? [record(f)!.text as string] : []));
    if (!findings.length) throw new Error(`EVALUATION_ORACLE_MISSING:${question.id}:findings`);
    return findings;
  }
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
  sentSubjectNames: readonly string[] = [],
) {
  const raw = record(rawAnswer),
    rawAnswerText = typeof raw?.text === "string" ? raw.text : null;
  const references = sourceReferences(ledger, authorizedReferences);
  const safeLedger = ledger.map((s) => redactSource(s, references));
  const identities = sourceIdentities(safeLedger, [...references, ...sentSubjectNames]);
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
  const draftUnsupportedTokens = unsupportedNumericTokens(draftOutput, draftCited, identities);
  // A discarded draft is diagnostic data, not the answer seen by the person.
  const displayed = outcome.kind === "ANSWER" ? outcome.answer.text : "";
  const rawFollowUps = Array.isArray(raw?.followUps)
    ? raw.followUps.filter((f): f is string => typeof f === "string")
    : [];
  const followUps = outcome.kind === "ANSWER" ? outcome.answer.followUps : [];
  const displayedCited =
    outcome.kind === "ANSWER" ? citedSources(safeLedger, outcome.answer.sourceIds) : [];
  const unsupportedTokens = [
    ...new Set(
      [displayed, ...followUps].flatMap((text) =>
        unsupportedNumericTokens(text, displayedCited, identities),
      ),
    ),
  ];
  const wrongNumber = unsupportedTokens.length > 0;
  const wrongAmountLabel = [displayed, ...followUps].some((text) =>
    hasMislabelledQuoteAmount(text, displayedCited, question.locale, identities),
  );
  const report = (verdict: "wrong" | "correctly declined" | "grounded and correct") => ({
    verdict,
    wrongNumber,
    wrongAmountLabel,
    draftWrongNumber: draftUnsupportedTokens.length > 0,
    draftUnsupportedTokens,
    rawFollowUps,
    followUps,
    answerText: outcome.kind === "ANSWER" ? displayed : null,
    ...(verdict === "wrong" ? { unsupportedTokens, rawAnswerText } : {}),
  });
  if (outcome.kind !== "ANSWER" || wrongNumber || wrongAmountLabel) return report("wrong");
  if (
    question.expected.forbidden.some(
      (f) =>
        outcome.answer.text.includes(f) || outcome.sources.some((s) => s.projectKeys.includes(f)),
    )
  )
    return report("wrong");
  if (question.expected.kind === "DECLINE") {
    const notFound =
      question.expected.match === "NOT_FOUND" &&
      displayedCited.length > 0 &&
      displayedCited.every((s) => s.facts.count === 0 && s.projectKeys.length === 0) &&
      /cannot (?:be )?found|not found|could not find|can(?:not|'t) find|找不到|查無|未找到/i.test(
        displayed,
      );
    return report(
      outcome.answer.sourceIds.length === 0 || notFound ? "correctly declined" : "wrong",
    );
  }
  if (question.expected.match === "EMPTY_LIST")
    return report(
      displayedCited.some((s) => s.facts.count === 0) &&
        /\b(?:no|none|zero|0)\b|沒有|尚無|目前無|0/i.test(displayed)
        ? "grounded and correct"
        : "wrong",
    );
  const matches = (f: string) => outcome.answer.text.includes(f);
  if (question.expected.match === "ANY_SAVED_FINDING")
    return report(
      facts.some(matches) && outcome.answer.sourceIds.length > 0 ? "grounded and correct" : "wrong",
    );
  const all = facts.every(
    (f) =>
      outcome.answer.text.toLocaleLowerCase().includes(f.toLocaleLowerCase()) ||
      (f === "Not accepted yet" &&
        /\b(?:not|hasn't|isn't)(?: yet)?(?: been)? accepted(?: yet)?\b/i.test(
          outcome.answer.text,
        )) ||
      (f === "尚未接受" && /(?:尚未|還未)(?:被(?:客戶)?)?接受/.test(outcome.answer.text)) ||
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
    wrongAmountLabel: row.wrongAmountLabel,
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
