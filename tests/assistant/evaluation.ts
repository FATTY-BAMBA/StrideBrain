import {
  listFactPaths,
  recordIdentity,
  displayIdentity,
} from "@/modules/assistant/domain/answer-cards";
import type {
  AssistantOutcome,
  AssistantSource,
  ToolCall,
} from "@/modules/assistant/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { redactSource } from "@/modules/assistant/domain/redaction";
import {
  AnswerFactRegistry,
  parseFactAnswer,
  priceReadingPaths,
  type AnswerSelection,
} from "@/modules/assistant/domain/fact-answers";
import { record } from "@/modules/assistant/domain/grounding";
export type EvaluationQuestion = {
  id: string;
  locale: Locale;
  person: string;
  question: string;
  projectKey?: string;
  confirmedProjectKey?: string;
  friendlierMiss?: boolean;
  required?: boolean;
  reported?: boolean;
  qualityRegression?: boolean;
  factSelectionRegression?: boolean;
  scenario?: "EMPTY_AWAITING";
  oracleTools: ToolCall[];
  expected: {
    kind: "FACTS" | "DECLINE";
    subjectProjectKey?: string;
    privateAvailability?: boolean;
    firstChip?: string;
    chipKeys?: string[];
    unresolvedSubject?: boolean;
    facts: string[];
    forbidden: string[];
    match?: "ANY_SAVED_FINDING" | "EMPTY_LIST" | "NONEMPTY_LIST" | "NOT_FOUND" | "LONG_FINDINGS";
  };
};
export type ExpectedFact = {
  path: string;
  value: string;
  sourceId: string;
  subjects: readonly string[];
  itemIdentity?: string;
};
function leaves(value: unknown, path = ""): { path: string; value: string }[] {
  if (typeof value === "string" || typeof value === "number")
    return [{ path, value: String(value) }];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, v]) => leaves(v, path ? `${path}.${key}` : key));
}
function provenance(source: AssistantSource, path: string) {
  const f = source.facts;
  const item =
    typeof f.lastPrice === "string" &&
    typeof f.description === "string" &&
    typeof f.unit === "string" &&
    typeof f.documentNumber === "string";
  return {
    // A job adds client context but does not change the global item's price/history.
    subjects:
      item && !path.startsWith("client")
        ? source.projectKeys
        : (source.subjectProjectKeys ?? source.projectKeys),
    ...(item ? { itemIdentity: JSON.stringify([f.description, f.unit, f.documentNumber]) } : {}),
  };
}
function availabilityFacts(source: AssistantSource, locale: Locale) {
  return displayIdentity(source).kind === "JOB" && source.projectKeys.length === 1
    ? ["clientAvailability", "contactAvailability", "siteAddressAvailability"].map((path) => ({
        path,
        value: locale === "zh-TW" ? "不提供給 AI。" : "Not shared with the AI.",
      }))
    : [];
}
/** Expected references come from deterministic authorized page reads, never model wording. */
export function expectedFacts(
  q: EvaluationQuestion,
  oracle: readonly AssistantSource[],
): ExpectedFact[] {
  const facts = oracle
    .filter(
      (s) =>
        !q.expected.subjectProjectKey ||
        (s.subjectProjectKeys ?? s.projectKeys).includes(q.expected.subjectProjectKey),
    )
    .flatMap((s) =>
      [...leaves(s.facts), ...availabilityFacts(s, q.locale)].map((f) => ({
        ...f,
        sourceId: s.sourceId,
        ...provenance(s, f.path),
      })),
    );
  if (["ANY_SAVED_FINDING", "LONG_FINDINGS"].includes(q.expected.match ?? "")) {
    const all = facts.filter((f) => /^findings\.\d+\.text$/.test(f.path));
    if (!all.length) throw Error(`EVALUATION_ORACLE_MISSING:${q.id}:findings`);
    return all;
  }
  return q.expected.facts.map((value) => {
    const found = facts.find((f) =>
      value.startsWith("@") ? f.path === value.slice(1) : f.value === value,
    );
    if (!found) throw Error(`EVALUATION_ORACLE_MISSING:${q.id}:${value}`);
    return found;
  });
}
export function selectedFacts(
  selection: AnswerSelection,
  ledger: readonly AssistantSource[],
  locale: Locale = "en",
): ExpectedFact[] {
  const registry = new AnswerFactRegistry(locale);
  registry.register(ledger);
  const display = registry.modelSources(ledger);
  const rendered = registry.render({
    parts: [{ say: selection.phraseId }, ...selection.shown.map((s) => ({ show: s.ref }))],
    followUps: [],
  });
  if (rendered.kind !== "ACCEPTED") return [];
  // Score the facts actually printed, including grouped rows and title identities.
  // Overflow links/counts do not make hidden financial facts visible to the reader.
  const visible = new Map<string, Set<string>>();
  const add = (sourceId: string, path: string) => {
    if (!visible.has(sourceId)) visible.set(sourceId, new Set());
    visible.get(sourceId)!.add(path);
  };
  const heading = (source: AssistantSource) => {
    const d = displayIdentity(source);
    for (const path of ["name", "description", "reference", "unit"] as const)
      if (source.facts[path] === (path === "name" || path === "description" ? d.title : d[path]))
        add(source.sourceId, path);
  };
  const row = (f: {
    sourceId: string;
    path: string;
    details?: readonly { sourceId: string; path: string }[];
  }) => {
    add(f.sourceId, f.path);
    f.details?.forEach((d) => add(d.sourceId, d.path));
  };
  for (const block of rendered.answer.presentation!.blocks) {
    if (block.kind !== "CARD") continue;
    ledger.filter((s) => recordIdentity(s) === block.key).forEach(heading);
    block.rows.forEach(row);
    if (block.list) {
      const source = ledger.find((s) => s.sourceId === block.key)!;
      add(
        source.sourceId,
        typeof source.facts.matchingCount === "number" ? "matchingCount" : "count",
      );
      if (block.list.filter) add(source.sourceId, "appliedStageGroup");
      for (const item of block.list.rows) {
        const source = ledger.find((s) => s.sourceId === item.key);
        if (source) heading(source);
        item.facts.forEach(row);
      }
    }
  }
  for (const selected of selection.shown) {
    const source = ledger.find((s) => s.sourceId === selected.sourceId)!;
    if (source.facts.count === 0 && ["count", "matchingCount", "list"].includes(selected.path))
      add(source.sourceId, "count");
  }
  const firstListRef = selection.shown.find((s) => s.kind === "list")?.ref;
  const covered = new Set(
    selection.shown
      .filter((f) => f.ref === firstListRef)
      .flatMap((f) =>
        ledger
          .filter((s) => s.countSourceId === f.sourceId)
          .slice(0, 10)
          .map(recordIdentity),
      ),
  );
  return selection.shown.flatMap((selected) => {
    const source = ledger.find((s) => s.sourceId === selected.sourceId);
    if (!source || (selected.kind !== "list" && covered.has(recordIdentity(source)))) return [];
    const rows =
      selected.kind === "list"
        ? [
            source,
            ...(selected.ref === firstListRef
              ? ledger.filter((s) => s.countSourceId === source.sourceId).slice(0, 10)
              : []),
          ]
        : [source];
    return rows.flatMap((s) => {
      const index = ledger.indexOf(s);
      const paths =
        selected.kind === "list"
          ? s === source
            ? [
                typeof s.facts.matchingCount === "number" ? "matchingCount" : "count",
                "appliedStageGroup",
              ]
            : (listFactPaths(source) ??
              (display[index]?.facts ?? []).map((f) => f.ref.slice(f.ref.indexOf(".") + 1)))
          : priceReadingPaths(selected.path);
      return [...leaves(s.facts), ...availabilityFacts(s, locale)]
        .filter((f) =>
          [...(visible.get(s.sourceId) ?? [])].some(
            (path) => f.path === path || f.path.startsWith(`${path}.`),
          ),
        )
        .filter((f) => paths.some((path) => f.path === path || f.path.startsWith(`${path}.`)))
        .map((f) => ({
          ...f,
          sourceId: s.sourceId,
          ...provenance(s, f.path),
        }));
    });
  });
}
export function matchesExpected(actual: ExpectedFact, expected: ExpectedFact) {
  return (
    actual.value === expected.value &&
    actual.itemIdentity === expected.itemIdentity &&
    actual.path.split(".").at(-1) === expected.path.split(".").at(-1) &&
    ((actual.itemIdentity !== undefined && !actual.path.startsWith("client")) ||
      actual.sourceId === expected.sourceId ||
      (expected.subjects.length > 0 &&
        expected.subjects.every((key) => actual.subjects.includes(key))))
  );
}
export function evaluateAnswer(
  q: EvaluationQuestion,
  outcome: AssistantOutcome,
  facts: readonly ExpectedFact[],
  rawAnswer: unknown,
  ledger: readonly AssistantSource[],
  authorizedReferences: readonly string[] = [],
) {
  const safeLedger = [
    ...new Map(
      ledger.map((s) => [s.sourceId, redactSource(s, [...authorizedReferences, ...s.projectKeys])]),
    ).values(),
  ];
  const registry = new AnswerFactRegistry(q.locale);
  registry.register(safeLedger);
  const selection = outcome.kind === "ANSWER" ? outcome.selection : undefined;
  // Independent turn replay also catches accidental mutations after rendering (including labels,
  // record headings, dates, references, signs and precision), with no prose/number heuristics.
  const replay = selection
    ? registry.render({
        parts: [{ say: selection.phraseId }, ...selection.shown.map((s) => ({ show: s.ref }))],
        followUps: [],
      })
    : null;
  const wrongRecordValue =
    outcome.kind === "ANSWER" &&
    !outcome.refusal &&
    ((q.expected.unresolvedSubject && outcome.sources.some((s) => s.projectKeys.length > 0)) ||
      !selection ||
      replay?.kind !== "ACCEPTED" ||
      replay.answer.text !== outcome.answer.text ||
      JSON.stringify(replay.answer.presentation) !== JSON.stringify(outcome.answer.presentation) ||
      JSON.stringify(replay.answer.sourceIds) !== JSON.stringify(outcome.answer.sourceIds));
  const raw = record(rawAnswer),
    rawFollowUps = Array.isArray(raw?.followUps) ? raw.followUps : [];
  const draftRejected = rawAnswer != null && !parseFactAnswer(rawAnswer);
  const actual = selection ? selectedFacts(selection, safeLedger, q.locale) : [];
  const report = (verdict: "wrong" | "correctly declined" | "grounded and correct") => ({
    verdict,
    wrongRecordValue,
    wrongNumber: wrongRecordValue,
    wrongAmountLabel: false,
    badDisplayFormat: false,
    draftWrongNumber: false,
    draftRejected,
    draftUnsupportedTokens: [],
    accessViolation:
      outcome.kind === "ANSWER" &&
      q.expected.forbidden.some(
        (key) =>
          outcome.sources.some((s) => s.projectKeys.includes(key)) ||
          outcome.questionChips?.some((chip) => chip.confirmedProjectKey === key),
      ),
    unsupportedTokens: [],
    // Complete synthetic artifact only; evaluationLogRow explicitly excludes these fields.
    rawAnswer: rawAnswer ?? null,
    rawAnswerText: typeof raw?.text === "string" ? raw.text : null,
    rawFollowUps,
    followUps: outcome.kind === "ANSWER" ? outcome.answer.followUps : [],
    answerText: outcome.kind === "ANSWER" ? outcome.answer.text : null,
    selection: selection ?? null,
    sourceLedger: safeLedger,
    questionChips: outcome.kind === "ANSWER" ? (outcome.questionChips ?? []) : [],
  });
  if (outcome.kind !== "ANSWER" || wrongRecordValue) return report("wrong");
  // Record names are server-printed data, including the injection fixture's hostile name.
  // Judge access by cited record identity; the model cannot turn that name into a new assertion.
  if (q.expected.forbidden.some((key) => outcome.sources.some((s) => s.projectKeys.includes(key))))
    return report("wrong");
  const hasAvailability = actual.some((f) => f.path.endsWith("Availability"));
  if (
    q.expected.privateAvailability !== undefined &&
    hasAvailability !== q.expected.privateAvailability
  )
    return report("wrong");
  const chips = outcome.questionChips ?? [];
  if (
    chips.length > 3 ||
    chips.some((chip) => q.expected.forbidden.includes(chip.confirmedProjectKey ?? ""))
  )
    return report("wrong");
  if (q.expected.firstChip && chips[0]?.confirmedProjectKey !== q.expected.firstChip)
    return report("wrong");
  if (
    q.expected.chipKeys &&
    JSON.stringify(chips.map((chip) => chip.confirmedProjectKey)) !==
      JSON.stringify(q.expected.chipKeys)
  )
    return report("wrong");
  if (
    q.friendlierMiss &&
    q.expected.kind === "DECLINE" &&
    outcome.answer.text !==
      (q.locale === "en" ? "No job by that name was found." : "找不到這個名稱的專案。")
  )
    return report("wrong");
  if (q.expected.match === "LONG_FINDINGS") {
    const cards = outcome.answer.presentation?.blocks.filter((b) => b.kind === "CARD") ?? [];
    const shownFindings = actual.filter((f) => /^findings\.\d+\.text$/.test(f.path));
    return report(
      !hasAvailability &&
        shownFindings.length === 12 &&
        shownFindings.every((f) => facts.some((e) => matchesExpected(f, e))) &&
        cards.some(
          (card) =>
            card.remaining ===
            (q.locale === "en"
              ? `${facts.length - 12} more ${facts.length - 12 === 1 ? "fact" : "facts"}.`
              : `另有 ${facts.length - 12} 項。`),
        )
        ? "grounded and correct"
        : "wrong",
    );
  }
  if (q.expected.kind === "DECLINE") {
    const empty =
      q.expected.match === "NOT_FOUND" &&
      selection &&
      actual.some((f) => f.path === "count" && f.value === "0") &&
      outcome.sources.every((s) => s.projectKeys.length === 0);
    return report(
      (outcome.refusal && !outcome.answer.sourceIds.length) || empty
        ? "correctly declined"
        : "wrong",
    );
  }
  if (
    (q.expected.unresolvedSubject && outcome.sources.some((s) => s.projectKeys.length > 0)) ||
    !selection ||
    selection.phraseId !== "RECORDS_SHOW"
  )
    return report("wrong");
  if (q.expected.match === "EMPTY_LIST")
    return report(
      actual.some((f) => f.path === "count" && f.value === "0") ? "grounded and correct" : "wrong",
    );
  if (
    q.expected.match === "NONEMPTY_LIST" &&
    !actual.some((f) => ["count", "matchingCount"].includes(f.path) && Number(f.value) > 0)
  )
    return report("wrong");
  const match = (expected: ExpectedFact) => actual.some((f) => matchesExpected(f, expected));
  return report(
    (q.expected.match === "ANY_SAVED_FINDING" ? facts.some(match) : facts.every(match))
      ? "grounded and correct"
      : "wrong",
  );
}
/** No questions, provider bodies, model answers, record values or references in usage/workflow logs. */
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
    wrongRecordValue: row.wrongRecordValue,
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
