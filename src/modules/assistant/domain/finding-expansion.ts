import type { AssistantSource } from "./contracts";

/** Display replacement always uses complete saved sentences, never model directions. */
export function expandFindingSentences(
  text: string,
  sources: readonly AssistantSource[],
  percentages: (text: string) => readonly string[],
):
  | { kind: "EXPANDED"; text: string }
  | { kind: "REJECTED"; reason: "FINDING_SENTENCE" | "UNSUPPORTED_NUMBER" } {
  const findings = sources
    .flatMap((s) => (Array.isArray(s.facts.findings) ? s.facts.findings : []))
    .flatMap((f) =>
      f && typeof f === "object" && "text" in f && typeof f.text === "string"
        ? [
            {
              text: f.text,
              category: "category" in f && typeof f.category === "string" ? f.category : null,
              kind: "claimKind" in f ? claimKind(f.claimKind) : null,
            },
          ]
        : [],
    );
  if (!percentages(text).length) return { kind: "EXPANDED", text };
  if (!findings.length) return { kind: "REJECTED", reason: "UNSUPPORTED_NUMBER" };
  // A list item may wrap over several lines. Non-list paragraphs are split into sentences.
  const blocks: { list: boolean; text: string }[] = [];
  for (const line of text.split("\n")) {
    const list = /^[ \t]*(?:>[ \t]*)?(?:[-*+][ \t]+|[0-9０-９]+[.．)）、](?![0-9０-９]))/.test(
      line,
    );
    const previous = blocks.at(-1);
    if (!previous || list || !line.trim() || !previous.text.trim())
      blocks.push({ list, text: line });
    else previous.text += `\n${line}`;
  }
  // A heading carries through comma-separated clauses, but never past an item/segment boundary.
  const segments = blocks.flatMap((b) =>
    b.text.split(/(?<=[;；。！？!?])\s*|(?<=[^\d]\.)\s+(?=\S)/u),
  );
  const categories = [...new Set(findings.flatMap((f) => (f.category ? [f.category] : [])))];
  const expanded: string[] = [];
  for (const segment of segments) {
    const tokens = percentages(segment);
    if (!tokens.length) {
      expanded.push(segment);
      continue;
    }
    const replacements: string[] = [];
    for (const occurrence of segment.matchAll(/[-+−]?[0-9０-９][0-9０-９,.，．]*\s*[%％]/g)) {
      const token = percentages(occurrence[0])[0];
      if (!token || !tokens.includes(token)) continue;
      const prefix = segment.slice(0, occurrence.index);
      const category = statedCategory(prefix, categories);
      if (category === false) return { kind: "REJECTED", reason: "FINDING_SENTENCE" };
      const byPercent = findings.filter((finding) => percentages(finding.text).includes(token));
      if (!byPercent.length) return { kind: "REJECTED", reason: "UNSUPPORTED_NUMBER" };
      let matches = byPercent;
      if (category) {
        const kind = statedKind(prefix);
        if (!kind) return { kind: "REJECTED", reason: "FINDING_SENTENCE" };
        matches = byPercent.filter(
          (finding) => finding.category === category && finding.kind === kind,
        );
      }
      // No stated category deliberately uses percentage-only uniqueness, even if a kind is stated.
      if (matches.length !== 1) return { kind: "REJECTED", reason: "FINDING_SENTENCE" };
      if (!replacements.includes(matches[0]!.text)) replacements.push(matches[0]!.text);
    }
    if (!replacements.length) return { kind: "REJECTED", reason: "FINDING_SENTENCE" };
    expanded.push(...replacements);
  }
  return { kind: "EXPANDED", text: expanded.join("\n").trim() };
}

type PriceKind = "QUOTED_PRICE" | "FORECAST_COST";
function claimKind(kind: unknown): PriceKind | null {
  if (kind === "CATEGORY_QUOTED_VARIANCE" || kind === "OVERALL_QUOTED_VARIANCE")
    return "QUOTED_PRICE";
  if (kind === "CATEGORY_FORECAST_ACTUAL_VARIANCE" || kind === "OVERALL_FORECAST_ACTUAL_VARIANCE")
    return "FORECAST_COST";
  return null;
}
const kindPattern = /\bforecast cost\b|\bquoted price\b|預估成本|報價/gi;
function statedKind(prefix: string): PriceKind | null {
  const last = [...prefix.matchAll(kindPattern)].at(-1)?.[0];
  return last ? (/forecast cost|預估成本/i.test(last) ? "FORECAST_COST" : "QUOTED_PRICE") : null;
}
/** Exact sent labels only: ignore letter case only; no aliases or fuzzy category recognition. */
function statedCategory(prefix: string, labels: readonly string[]): string | null | false {
  const matches = labels
    .flatMap((label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Chinese has no spaces between an exact category and “的預估成本”, “報價”, etc.
      const end = /[\p{Script=Han}]/u.test(label)
        ? "(?=的|預估成本|報價|過往|因|[^\\p{L}\\p{N}]|$)"
        : "(?![\\p{L}\\p{N}])";
      return [...prefix.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}${end}`, "giu"))].map(
        (match) => ({ label, index: match.index }),
      );
    })
    .sort((a, b) => b.index - a.index);
  if (matches.length) return matches[0]!.label;
  // An explicitly named but unknown heading must not silently use another category's percentage.
  if (/[:：]/.test(prefix)) return false;
  const firstKind = [...prefix.matchAll(kindPattern)][0];
  if (firstKind) {
    const subject = prefix
      .slice(0, firstKind.index)
      .replace(/^\s*(?:[-*+]\s*)?[0-9０-９]+[.．)）、]\s*/, "")
      .trim();
    if (subject && !/^(?:the|a|an)$/i.test(subject)) return false;
  }
  return null;
}
