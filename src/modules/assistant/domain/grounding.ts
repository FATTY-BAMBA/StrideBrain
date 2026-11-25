import type { AssistantSource } from "./contracts";
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
export function withoutReferences(text: string, references: readonly string[]): string {
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
      .replace(/\b(m|ft|cm|mm)2\b/g, "$1²")
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
/** Follow-ups are questions for the existing read tools, never offers to write or workflow advice. */
export function isReadFollowUp(text: string): boolean {
  return (
    /[?？]$/.test(text.trim()) &&
    !/\b(?:create|edit|issue|send|approve|delete|update|write|save|generate)\b|建立|編輯|修改|核發|開立|發送|寄送|核准|刪除|更新|儲存|執行比較|重新執行/i.test(
      text,
    ) &&
    !/^(?:would you|do you want|can I|shall I)\b|是否需要|需要.*協助/i.test(text)
  );
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
