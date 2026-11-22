import type { AssistantSource, StructuredAnswer } from "./contracts";
import type { Locale } from "@/modules/localization/config";

export function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
export function numericTokens(text: string): readonly string[] {
  return (
    text
      .normalize("NFKC")
      .replaceAll("−", "-")
      .match(/\d{4}-\d{2}-\d{2}|[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?/g) ?? []
  ).map((token) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(token)) return token;
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
    words > 120 ||
    sourceIds.some((id) => typeof id !== "string" || id.length > 80) ||
    followUps.some((f) => typeof f !== "string" || f.length > 160 || !f.trim())
  )
    return null;
  return { text: text.trim(), sourceIds: sourceIds as string[], followUps: followUps as string[] };
}
export function verifyAnswer(
  raw: unknown,
  sources: readonly AssistantSource[],
  locale: Locale,
): StructuredAnswer | null {
  const parsed = parseAnswer(raw, locale);
  if (!parsed) return null;
  const { text, sourceIds, followUps } = parsed;
  if (sourceIds.some((id) => !sources.some((s) => s.sourceId === id))) return null;
  if (!sourceIds.length) return null;
  const ledger = new Set(
    numericTokens(
      sources
        .filter((s) => sourceIds.includes(s.sourceId))
        .map((s) => factText(s.facts))
        .join(" "),
    ),
  );
  // Require digits for quantities: prose number words cannot bypass the numeric ledger.
  const output = [text, ...followUps].join(" ");
  if (
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion|dozen|half|quarter|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/i.test(
      output,
    ) ||
    /[零〇一二兩三四五六七八九十百千萬億壹貳參肆伍陸柒捌玖拾佰仟]+(?:個|項|筆|元|天|日|年|月|%|％)|百分之[零〇一二三四五六七八九十百千萬億]/.test(
      output,
    )
  )
    return null;
  if (numericTokens(output).some((n) => !ledger.has(n))) return null;
  const cited = sources.filter((s) => sourceIds.includes(s.sourceId));
  // Percent findings retain the shared Home/comparison/chat sentence verbatim.
  const findings = cited
    .flatMap((s) => (Array.isArray(s.facts.findings) ? s.facts.findings : []))
    .flatMap((f) => (typeof record(f)?.text === "string" ? [record(f)!.text as string] : []));
  const financial =
    cited.some(
      (s) =>
        s.facts.observationType === "QUOTED_PRICE" || typeof s.facts.quoteBeforeTax === "string",
    ) || findings.length > 0;
  if (
    /NT\$|TWD|USD|\b(?:amount|cost|price|rate)\b|金額|成本|單價/i.test(output) &&
    numericTokens(output).length &&
    !financial
  )
    return null;
  if (
    /actual costs?|實際成本/i.test(output) &&
    !cited.some((s) => typeof s.facts.actualCost === "string") &&
    !findings.some((f) => /actual costs?|實際成本/i.test(f))
  )
    return null;
  if (
    /\b(?:I|we)\s+(?:have\s+)?(?:created|sent|issued|approved|updated|deleted|ran)\b|我(?:們)?(?:已經|已)?(?:建立|發送|開立|核准|更新|刪除|執行)/i.test(
      output,
    )
  )
    return null;
  for (const finding of findings)
    if (
      numericTokens(finding).some((n) => n.endsWith("%") && numericTokens(output).includes(n)) &&
      !text.includes(finding)
    )
      return null;
  // Links are rendered from the server's source list, never generated text.
  if (/https?:\/\/|www\.|<\/?[a-z]|\]\(/i.test(output)) return null;
  return {
    text: text.trim(),
    sourceIds: [...new Set(sourceIds as string[])],
    followUps: followUps as string[],
  };
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
