import type { AssistantSource, StructuredAnswer, ToolCall } from "./contracts";
export type AssistantProjectIdentity = Readonly<{
  projectKey: string;
  names: readonly string[];
}>;
/** Literal authorized names in either language or complete references; never fuzzy record lookup. */
export function mentionsIdentity(text: string, value: string): boolean {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return !!value && new RegExp(`(?<![A-Za-z0-9_/-])${escaped}(?![A-Za-z0-9_/-])`, "i").test(text);
}
export function namedProjects(question: string, projects: readonly AssistantProjectIdentity[]) {
  return projects.filter((p) =>
    [p.projectKey, ...p.names].some((v) => mentionsIdentity(question, v)),
  );
}
export function matchesSubject(
  answer: StructuredAnswer,
  sources: readonly AssistantSource[],
  subjects: readonly string[],
  projects: readonly AssistantProjectIdentity[],
): boolean {
  if (!subjects.length) return true;
  const cited = sources.filter((s) => answer.sourceIds.includes(s.sourceId));
  const citedSubjects = cited.flatMap((s) => s.subjectProjectKeys ?? s.projectKeys);
  if (
    !citedSubjects.some((key) => subjects.includes(key)) ||
    citedSubjects.some((key) => !subjects.includes(key))
  )
    return false;
  const dependencies = new Set(cited.flatMap((s) => s.projectKeys));
  return namedProjects(answer.text, projects).every((p) => dependencies.has(p.projectKey));
}
/** Object-key order cannot cause the same tool arguments to execute twice. */
export function toolCallKey(call: ToolCall): string {
  const canonical = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, canonical(v)]),
          )
        : v;
  return JSON.stringify([call.name, canonical(call.arguments)]);
}

/** Explicit job selectors must resolve before a page can supply a default subject.
 * This uses only authorized identities; inaccessible and nonexistent names take the same path.
 */
export function hasUnresolvedJobSelector(
  question: string,
  projects: readonly AssistantProjectIdentity[],
): boolean {
  let text = question.replaceAll("\0", "");
  const identities = projects
    .flatMap((p) => [p.projectKey, ...p.names])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  for (const identity of identities) {
    const escaped = identity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`(?<![A-Za-z0-9_/-])${escaped}(?![A-Za-z0-9_/-])`, "gi"), "\0");
  }
  // Complete reference-shaped selectors (not dates or bare numbers).
  if (/\b[A-Za-z][A-Za-z0-9]*-(?:[A-Za-z0-9]+-)*[A-Za-z0-9]*\d[A-Za-z0-9]*\b/.test(text))
    return true;
  const candidates: string[] = [];
  for (const m of text.matchAll(
    /[「『“"]([^「」『』“”"]+)[」』”"]\s*(?:這個|這|的)?\s*(?:專案|工程|job|project)/gi,
  ))
    candidates.push(m[1]!);
  for (const m of text.matchAll(
    /(?:quote (?:total|amount|status|number)|stage|status)\s+(?:for|of)\s+([^?!.,;]+)/gi,
  ))
    candidates.push(m[1]!);
  for (const m of text.matchAll(
    /(?:^|[，。？！；,;!?])\s*(?:請問|請告訴我|告訴我)?\s*([^，。？！；,;!?]+?)(?:的(?:報價|總額|總計|階段)|目前在哪個階段)/g,
  ))
    candidates.push(m[1]!);
  return candidates.some((candidate) => {
    const normalized = candidate.replace(/[「」『』“”"]/g, "").trim();
    if (
      normalized.includes("\0") &&
      normalized.split(/\band\b|和|及|、/i).every((part) => part.includes("\0"))
    )
      return false;
    if (/^(?:等待|正在等待|還在等|等)(?:待)?客戶回覆$/.test(normalized)) return false;
    return !/^(?:\0|(?:this|the|current|selected) (?:job|project)|這個專案(?:目前)?|這個工程|本專案|此專案|專案|目前專案)(?:\s*(?:這個專案|專案|job|project))?$/i.test(
      normalized,
    );
  });
}
