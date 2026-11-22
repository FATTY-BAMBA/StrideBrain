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
      paths.includes(path) &&
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
    normalizeSimpleNumberWords(normalizeDates(text))
      .replaceAll("−", "-")
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
    sourceIds.length > 30 ||
    !Array.isArray(followUps) ||
    followUps.length > 3
  )
    return null;
  const words = [...new Intl.Segmenter(locale, { granularity: "word" }).segment(text)].filter(
    (s) => s.isWordLike,
  ).length;
  if (
    words > 240 ||
    sourceIds.some((id) => typeof id !== "string" || id.length > 80) ||
    followUps.some((f) => typeof f !== "string" || f.length > 160 || !f.trim())
  )
    return null;
  return { text: text.trim(), sourceIds: sourceIds as string[], followUps: followUps as string[] };
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
  const references = sourceReferences(sources, authorizedReferences);
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
export function checkAnswer(
  raw: unknown,
  sources: readonly AssistantSource[],
  locale: Locale,
  authorizedReferences: readonly string[] = [],
): AnswerCheck {
  const parsed = parseAnswer(raw, locale);
  if (!parsed) return { kind: "REJECTED", reason: answerSchemaReason(raw, locale) };
  const { text, sourceIds, followUps } = parsed;
  if (sourceIds.some((id) => !sources.some((s) => s.sourceId === id)))
    return { kind: "REJECTED", reason: "UNKNOWN_SOURCE" };
  if (!sourceIds.length) return { kind: "REJECTED", reason: "NO_SOURCES" };
  const output = [text, ...followUps].join(" ");
  const references = sourceReferences(sources, authorizedReferences);
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
    numericTokens(output).length &&
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
  for (const finding of findings)
    if (
      numericTokens(finding).some((n) => n.endsWith("%") && numericTokens(output).includes(n)) &&
      !text.includes(finding)
    )
      return { kind: "REJECTED", reason: "FINDING_SENTENCE" };
  // Links are rendered from the server's source list, never generated text.
  if (/https?:\/\/|www\.|<\/?[a-z]|\]\(/i.test(output))
    return { kind: "REJECTED", reason: "GENERATED_LINK_OR_HTML" };
  return {
    kind: "ACCEPTED",
    answer: {
      text: text.trim(),
      sourceIds: cited.map((s) => s.sourceId),
      followUps: followUps as string[],
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
