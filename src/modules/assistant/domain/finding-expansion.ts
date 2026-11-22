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
      f && typeof f === "object" && "text" in f && typeof f.text === "string" ? [f.text] : [],
    );
  if (!percentages(text).length) return { kind: "EXPANDED", text };
  if (!findings.length) return { kind: "REJECTED", reason: "UNSUPPORTED_NUMBER" };
  // A list item may wrap over several lines. Non-list paragraphs are split into sentences.
  const blocks: { list: boolean; text: string }[] = [];
  for (const line of text.split("\n")) {
    const list = /^[ \t]*(?:>[ \t]*)?(?:[-*+][ \t]+)?[0-9０-９]+[.．)）、](?![0-9０-９])/.test(
      line,
    );
    const previous = blocks.at(-1);
    if (!previous || list || !line.trim() || !previous.text.trim())
      blocks.push({ list, text: line });
    else previous.text += `\n${line}`;
  }
  const segments = blocks.flatMap((b) =>
    b.list ? [b.text] : b.text.split(/(?<=[。！？!?])\s*|(?<=[^\d]\.)\s+(?=\S)/u),
  );
  const expanded: string[] = [];
  for (const segment of segments) {
    const tokens = percentages(segment);
    if (!tokens.length) {
      expanded.push(segment);
      continue;
    }
    const replacements: string[] = [];
    for (const token of tokens) {
      const matches = findings.filter((finding) => percentages(finding).includes(token));
      if (!matches.length) return { kind: "REJECTED", reason: "UNSUPPORTED_NUMBER" };
      if (matches.length !== 1) return { kind: "REJECTED", reason: "FINDING_SENTENCE" };
      if (!replacements.includes(matches[0]!)) replacements.push(matches[0]!);
    }
    expanded.push(...replacements);
  }
  return { kind: "EXPANDED", text: expanded.join("\n").trim() };
}
