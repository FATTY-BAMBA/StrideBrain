import { expandFindingSentences } from "./finding-expansion";
import type { AssistantSource, StructuredAnswer } from "./contracts";
import type { Locale } from "@/modules/localization/config";

export function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const monthPattern =
  "(?:" + months.map((m) => (m.length > 3 ? `${m}|${m.slice(0, 3)}\\.?` : m)).join("|") + ")";
function calendarDate(year: string, month: string, day: string): string {
  const y = Number(year),
    m = Number(month),
    d = Number(day),
    date = new Date(Date.UTC(y, m - 1, d));
  const canonical = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    ? canonical
    : `INVALID_DATE_${canonical}`;
}
/** Calendar-equivalent display formats share a token; invalid/different dates never match. */
export function normalizeDates(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/(?<![A-Za-z0-9])([1-9]\d{3})([-/.])(\d{1,2})\2(\d{1,2})(?!\d)/g, (_, y, _sep, m, d) =>
      calendarDate(y, m, d),
    )
    .replace(/([1-9]\d{3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*[日號]/g, (_, y, m, d) =>
      calendarDate(y, m, d),
    )
    .replace(
      new RegExp(
        `\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,)?\\s+([1-9]\\d{3})\\b`,
        "gi",
      ),
      (_, m, d, y) =>
        calendarDate(
          y,
          String(months.findIndex((name) => name.startsWith(m.toLowerCase().replace(".", ""))) + 1),
          d,
        ),
    )
    .replace(
      new RegExp(
        `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})(?:,)?\\s+([1-9]\\d{3})\\b`,
        "gi",
      ),
      (_, d, m, y) =>
        calendarDate(
          y,
          String(months.findIndex((name) => name.startsWith(m.toLowerCase().replace(".", ""))) + 1),
          d,
        ),
    );
}
const simpleEnglishNumbers = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];
const simpleChineseNumbers: Record<string, string> = {
  一: "1",
  二: "2",
  兩: "2",
  三: "3",
  四: "4",
  五: "5",
  六: "6",
  七: "7",
  八: "8",
  九: "9",
  十: "10",
};
function normalizeSimpleNumberWords(text: string): string {
  return text
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi, (word) =>
      String(simpleEnglishNumbers.indexOf(word.toLowerCase()) + 1),
    )
    .replace(
      /[零〇一二兩三四五六七八九十百千萬億]+(?=\s*(?:個|項|筆|元|天|日|年|月|%|％|件|家|份|位|座|專案|工作))/g,
      (word) => simpleChineseNumbers[word] ?? word,
    )
    .replace(
      /(?<![\p{L}\p{N}])[一二兩三四五六七八九十](?![\p{L}\p{N}])/gu,
      (word) => simpleChineseNumbers[word]!,
    );
}
/** References are exact authorized identities, not quantities or arbitrary numeric substrings. */
export function sourceReferences(
  sources: readonly AssistantSource[],
  authorized: readonly string[] = [],
): string[] {
  const values = [...authorized, ...sources.flatMap((s) => s.projectKeys)];
  const walk = (value: unknown, paths: readonly string[], path = ""): void => {
    if (
      typeof value === "string" &&
      paths.some((p) => path === p || path.startsWith(`${p}.`)) &&
      /(?:^|\.)(?:reference|documentNumber)$/.test(path)
    )
      values.push(value);
    else if (Array.isArray(value)) value.forEach((v) => walk(v, paths, `${path}.*`));
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([k, v]) => walk(v, paths, path ? `${path}.${k}` : k));
  };
  sources.forEach((s) => walk(s.facts, s.typedFactPaths ?? []));
  return [...new Set(values.filter(Boolean))];
}
/** Identity text must be the redacted labels/names actually sent in this turn. */
export function sourceIdentities(
  sources: readonly AssistantSource[],
  authorized: readonly string[] = [],
): string[] {
  const values = sourceReferences(sources, authorized);
  const walk = (value: unknown, key = ""): void => {
    if (typeof value === "string" && /^(?:name|label)$/.test(key)) values.push(value);
    else if (Array.isArray(value)) value.forEach((v) => walk(v));
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([k, v]) => walk(v, k));
  };
  for (const source of sources) {
    values.push(source.label);
    walk(source.facts);
  }
  return [...new Set(values.filter(Boolean))];
}
/** Markdown/plain list markers are structure, not statements about record quantities. */
export function withoutEnumerators(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/^([ \t]*(?:>[ \t]*)?)(?:[-*+][ \t]+)?\d+[.)、](?!\d)[ \t]*/gm, "$1")
    .replace(/^([ \t]*(?:>[ \t]*)?)[-*+][ \t]+/gm, "$1");
}
function withoutReferences(text: string, references: readonly string[]): string {
  if (!references.length) return text;
  const escaped = [...references]
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return text.replace(
    new RegExp(`(?<![A-Za-z0-9_/-])(?:${escaped.join("|")})(?![A-Za-z0-9_/-])`, "g"),
    " ",
  );
}
/** A row's count dependency is supplied by the server, never inferred from model text. */
export function citedSources(
  sources: readonly AssistantSource[],
  sourceIds: readonly string[],
): AssistantSource[] {
  const ids = new Set(sourceIds);
  for (const source of sources)
    if (ids.has(source.sourceId) && source.countSourceId) ids.add(source.countSourceId);
  return sources.filter((s) => ids.has(s.sourceId));
}
export function numericTokens(text: string): readonly string[] {
  return (
    normalizeSimpleNumberWords(normalizeDates(withoutEnumerators(text)))
      .replaceAll("−", "-")
      .replace(/([+-])\s*(?:NT\$|TWD|USD|\$)\s*(?=\d)/g, "$1")
      .match(/(?:INVALID_DATE_)?\d{4}-\d{2}-\d{2}|[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?/g) ??
    []
  ).map((token) => {
    if (/^(?:INVALID_DATE_)?\d{4}-\d{2}-\d{2}$/.test(token)) return token;
    return token
      .replaceAll(",", "")
      .replace(/^\+/, "")
      .replace(/(\.\d*?)0+(%?)$/, "$1$2")
      .replace(/\.(%?)$/, "$1");
  });
}
function factText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(factText).join(" ");
  const fields = record(value);
  return fields
    ? Object.entries(fields)
        .filter(([k]) => !/(?:Id|Ids)$/.test(k))
        .map(([, v]) => factText(v))
        .join(" ")
    : "";
}
export function parseAnswer(raw: unknown, locale: Locale): StructuredAnswer | null {
  const value = record(raw);
  if (!value || Object.keys(value).some((k) => !["text", "sourceIds", "followUps"].includes(k)))
    return null;
  const { text, sourceIds, followUps } = value;
  if (
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 1400 ||
    !Array.isArray(sourceIds) ||
    sourceIds.length > 30
  )
    return null;
  const words = [...new Intl.Segmenter(locale, { granularity: "word" }).segment(text)].filter(
    (s) => s.isWordLike,
  ).length;
  if (words > 240 || sourceIds.some((id) => typeof id !== "string" || id.length > 80)) return null;
  return {
    text: text.trim(),
    sourceIds: sourceIds as string[],
    followUps: (Array.isArray(followUps) ? followUps : [])
      .filter((f): f is string => typeof f === "string" && !!f.trim() && f.length <= 160)
      .slice(0, 3),
  };
}
export type AnswerRejection =
  | "ANSWER_SCHEMA"
  | "WORD_LIMIT"
  | "UNKNOWN_SOURCE"
  | "NO_SOURCES"
  | "NUMBER_WORD"
  | "UNSUPPORTED_NUMBER"
  | "FINANCIAL_AUTHORITY"
  | "ACTUAL_COST_AUTHORITY"
  | "ACTION_CLAIM"
  | "FINDING_SENTENCE"
  | "GENERATED_LINK_OR_HTML";
export type AnswerCheck =
  { kind: "ACCEPTED"; answer: StructuredAnswer } | { kind: "REJECTED"; reason: AnswerRejection };
export function answerSchemaReason(raw: unknown, locale: Locale): AnswerRejection {
  const text = record(raw)?.text;
  return typeof text === "string" &&
    [...new Intl.Segmenter(locale, { granularity: "word" }).segment(text)].filter(
      (s) => s.isWordLike,
    ).length > 240
    ? "WORD_LIMIT"
    : "ANSWER_SCHEMA";
}
export function unsupportedNumericTokens(
  text: string,
  sources: readonly AssistantSource[],
  authorizedReferences: readonly string[] = [],
): string[] {
  const references = sourceIdentities(sources, authorizedReferences);
  const ledger = new Set(
    numericTokens(withoutReferences(sources.map((s) => factText(s.facts)).join(" "), references)),
  );
  return [
    ...new Set(numericTokens(withoutReferences(text, references)).filter((n) => !ledger.has(n))),
  ];
}
export function hasUnsupportedNumbers(
  text: string,
  sources: readonly AssistantSource[],
  authorizedReferences: readonly string[] = [],
): boolean {
  return unsupportedNumericTokens(text, sources, authorizedReferences).length > 0;
}
function checkSingleAnswer(
  raw: unknown,
  sources: readonly AssistantSource[],
  locale: Locale,
  authorizedReferences: readonly string[] = [],
): AnswerCheck {
  const parsed = parseAnswer(raw, locale);
  if (!parsed) return { kind: "REJECTED", reason: answerSchemaReason(raw, locale) };
  const { text, sourceIds } = parsed;
  if (sourceIds.some((id) => !sources.some((s) => s.sourceId === id)))
    return { kind: "REJECTED", reason: "UNKNOWN_SOURCE" };
  if (!sourceIds.length) return { kind: "REJECTED", reason: "NO_SOURCES" };
  const output = text;
  const references = sourceIdentities(sources, authorizedReferences);
  const quantities = normalizeSimpleNumberWords(withoutReferences(output, references));
  // Simple words use the same numeric ledger; unsupported compound/large words still fail.
  if (
    /\b(?:zero|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion|dozen|half|quarter|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/i.test(
      quantities,
    ) ||
    /[零〇一二兩三四五六七八九十百千萬億壹貳參肆伍陸柒捌玖拾佰仟]+(?:個|項|筆|元|天|日|年|月|%|％)|百分之[零〇一二三四五六七八九十百千萬億]/.test(
      quantities,
    )
  )
    return { kind: "REJECTED", reason: "NUMBER_WORD" };
  const cited = citedSources(sources, sourceIds);
  if (hasUnsupportedNumbers(output, cited, references))
    return { kind: "REJECTED", reason: "UNSUPPORTED_NUMBER" };
  // Percent findings retain the shared Home/comparison/chat sentence verbatim.
  const findings = cited
    .flatMap((s) => (Array.isArray(s.facts.findings) ? s.facts.findings : []))
    .flatMap((f) => (typeof record(f)?.text === "string" ? [record(f)!.text as string] : []));
  const financial =
    cited.some(
      (s) =>
        s.facts.observationType === "QUOTED_PRICE" ||
        typeof s.facts.quoteBeforeTax === "string" ||
        !!record(s.facts.amounts),
    ) || findings.length > 0;
  if (
    /NT\$|TWD|USD|\b(?:amount|cost|price|rate)\b|金額|成本|單價/i.test(output) &&
    numericTokens(withoutReferences(output, references)).length &&
    !financial
  )
    return { kind: "REJECTED", reason: "FINANCIAL_AUTHORITY" };
  if (
    /actual costs?|實際成本/i.test(output) &&
    !cited.some((s) => typeof s.facts.actualCost === "string") &&
    !findings.some((f) => /actual costs?|實際成本/i.test(f))
  )
    return { kind: "REJECTED", reason: "ACTUAL_COST_AUTHORITY" };
  if (
    /\b(?:I|we)\s+(?:have\s+)?(?:created|sent|issued|approved|updated|deleted|ran)\b|我(?:們)?(?:已經|已)?(?:建立|發送|開立|核准|更新|刪除|執行)/i.test(
      output,
    )
  )
    return { kind: "REJECTED", reason: "ACTION_CLAIM" };
  // Links are rendered from the server's source list, never generated text.
  if (/https?:\/\/|www\.|<\/?[a-z]|\]\(/i.test(output))
    return { kind: "REJECTED", reason: "GENERATED_LINK_OR_HTML" };
  return {
    kind: "ACCEPTED",
    answer: {
      text: text.trim(),
      sourceIds: cited.map((s) => s.sourceId),
      followUps: [],
    },
  };
}
export function checkAnswer(
  raw: unknown,
  sources: readonly AssistantSource[],
  locale: Locale,
  authorizedReferences: readonly string[] = [],
): AnswerCheck {
  const parsed = parseAnswer(raw, locale);
  if (!parsed) return { kind: "REJECTED", reason: answerSchemaReason(raw, locale) };
  // Validate citation identity before using any of its saved wording.
  if (parsed.sourceIds.some((id) => !sources.some((s) => s.sourceId === id)))
    return { kind: "REJECTED", reason: "UNKNOWN_SOURCE" };
  const identities = sourceIdentities(sources, authorizedReferences);
  const expand = (text: string) =>
    expandFindingSentences(text, citedSources(sources, parsed.sourceIds), (value) =>
      numericTokens(withoutReferences(value, identities)).filter((n) => n.endsWith("%")),
    );
  const expanded = expand(parsed.text);
  if (expanded.kind === "REJECTED") return expanded;
  const checked = checkSingleAnswer(
    { ...parsed, text: expanded.text, followUps: [] },
    sources,
    locale,
    authorizedReferences,
  );
  if (checked.kind === "REJECTED") return checked;
  return {
    kind: "ACCEPTED",
    answer: {
      ...checked.answer,
      followUps: parsed.followUps.filter((text) => {
        const expandedFollowUp = expand(text);
        return (
          expandedFollowUp.kind === "EXPANDED" &&
          expandedFollowUp.text === text.trim() &&
          checkSingleAnswer(
            { text, sourceIds: checked.answer.sourceIds, followUps: [] },
            sources,
            locale,
            authorizedReferences,
          ).kind === "ACCEPTED"
        );
      }),
    },
  };
}
export function verifyAnswer(
  raw: unknown,
  sources: readonly AssistantSource[],
  locale: Locale,
): StructuredAnswer | null {
  const checked = checkAnswer(raw, sources, locale);
  return checked.kind === "ACCEPTED" ? checked.answer : null;
}
export function questionLocale(question: string, fallback: Locale): Locale {
  // An English question may contain a Chinese job name.
  if (
    (question.replace(/\b[A-Z][A-Z0-9]*(?:[-_][A-Z0-9]+)+\b/g, "").match(/[A-Za-z]+/g)?.length ??
      0) >= 4
  )
    return "en";
  if (/\p{Script=Han}/u.test(question)) return "zh-TW";
  return /[a-z]/i.test(question) ? "en" : fallback;
}
