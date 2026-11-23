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
