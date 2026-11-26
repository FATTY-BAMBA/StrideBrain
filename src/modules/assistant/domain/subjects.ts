import type { AssistantSource, StructuredAnswer, ToolCall } from "./contracts";
export type AssistantProjectIdentity = Readonly<{
  projectKey: string;
  names: readonly string[];
}>;
/** Literal authorized names in either language or complete references; never fuzzy record lookup. */
function identityPattern(value: string, flags: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9_/-])${escaped}(?![A-Za-z0-9_/-])`, flags);
}
export function identityMention(text: string, value: string): string | null {
  return value ? (identityPattern(value, "i").exec(text)?.[0] ?? null) : null;
}
/** All occurrences matter: a short identity can occur both inside a readable longer
 * name and independently later in the question. This runs only at the answer boundary. */
export function mentionsUnreadableIdentity(
  question: string,
  readable: readonly string[],
  unreadable: readonly string[],
): boolean {
  const spans = (identity: string) => {
    if (!identity) return [];
    const pattern = identityPattern(identity, "gi");
    const found: { start: number; end: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(question))) {
      found.push({ start: match.index, end: match.index + match[0].length });
      pattern.lastIndex = match.index + 1;
    }
    return found;
  };
  const allowed = readable.flatMap(spans);
  return unreadable.some((identity) =>
    spans(identity).some(
      (span) => !allowed.some((outer) => outer.start <= span.start && outer.end >= span.end),
    ),
  );
}
export function mentionsIdentity(text: string, value: string): boolean {
  return identityMention(text, value) !== null;
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
