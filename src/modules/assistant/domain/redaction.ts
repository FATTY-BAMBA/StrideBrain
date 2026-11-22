import type { AssistantSource } from "./contracts";
import { numericTokens } from "./grounding";

const sensitiveField = /password|passwd|pwd|密碼|bank.?account|card.?number/i;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Only independently authorized references/typed values may be exempted, never model input. */
export function redactText(value: string, preserved: readonly string[] = []): string {
  const redactFreeText = (text: string) =>
    text
      .replace(/[A-ZＡ-Ｚ][1289１２８９][0-9０-９]{8}/gi, "[removed]")
      .replace(
        /[0-9０-９]{4}-[0-9０-９]{2}-[0-9０-９]{2}|[0-9０-９](?:[ -]?[0-9０-９]){7,18}/g,
        (token) => (/^\d{4}-\d{2}-\d{2}$/.test(token.normalize("NFKC")) ? token : "[removed]"),
      );
  // Password fields win even if their value happens to equal an authorized reference.
  const text = value.replace(
    /((?:"?(?:password|passwd|pwd|密碼)"?)\s*[=:：]\s*)(?:"[^"]*"|'[^']*'|[^\s,;，；]+)/gi,
    "$1[removed]",
  );
  const values = [...new Set(preserved.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!values.length) return redactFreeText(text);
  const pattern = new RegExp(
    `(?<![A-Za-z0-9_])(?:${values.map(escape).join("|")})(?![A-Za-z0-9_])`,
    "g",
  );
  let result = "",
    offset = 0;
  for (const match of text.matchAll(pattern)) {
    result += redactFreeText(text.slice(offset, match.index)) + match[0];
    offset = match.index + match[0].length;
  }
  return result + redactFreeText(text.slice(offset));
}
export function redact(value: unknown, key = "", references: readonly string[] = []): unknown {
  if (sensitiveField.test(key.normalize("NFKC"))) return "[removed]";
  if (typeof value === "string") return redactText(value, references);
  if (Array.isArray(value)) return value.map((item) => redact(item, "", references));
  if (value !== null && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k, references)]));
  return value;
}
function mapFacts(
  value: unknown,
  paths: readonly string[],
  references: readonly string[],
  path = "",
): unknown {
  const key = path.split(".").at(-1) ?? "";
  if (sensitiveField.test(key)) return "[removed]";
  if (/(?:Id|Ids)$/.test(key) || paths.includes(path)) return value;
  if (Array.isArray(value)) return value.map((v) => mapFacts(v, paths, references, `${path}.*`));
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        mapFacts(v, paths, references, path ? `${path}.${k}` : k),
      ]),
    );
  return typeof value === "string" ? redactText(value, references) : value;
}
/** Typed paths are declared by each server DTO producer. Names/notes are always free text. */
export function redactSource(
  source: AssistantSource,
  references: readonly string[],
): AssistantSource {
  return {
    ...source,
    label: redactText(source.label, references),
    facts: mapFacts(
      source.facts,
      source.typedFactPaths ?? [],
      references,
    ) as AssistantSource["facts"],
  };
}
export function modelFacts(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(modelFacts);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/(?:Id|Ids)$/.test(key))
        .map(([key, v]) => [key, modelFacts(v)]),
    );
  return value;
}
export function typedAnswerValues(sources: readonly AssistantSource[]): string[] {
  const values: string[] = [];
  const collect = (v: unknown): void => {
    if (typeof v === "string" || typeof v === "number") values.push(String(v));
    else if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === "object") Object.values(v).forEach(collect);
  };
  const walk = (v: unknown, paths: readonly string[], path = ""): void => {
    if (paths.includes(path)) {
      collect(modelFacts(v));
      return;
    }
    if (Array.isArray(v)) v.forEach((x) => walk(x, paths, `${path}.*`));
    else if (v && typeof v === "object")
      Object.entries(v).forEach(([k, x]) => walk(x, paths, path ? `${path}.${k}` : k));
  };
  for (const source of sources) walk(source.facts, source.typedFactPaths ?? []);
  return [...new Set([...values, ...values.flatMap((v) => numericTokens(v))])];
}
/** Bounded candidate extraction; only database matches become redaction exemptions. */
export function referenceCandidates(texts: readonly string[]): string[] {
  return [
    ...new Set(texts.flatMap((t) => t.match(/[A-Za-z0-9][A-Za-z0-9_/-]{0,127}/g) ?? [])),
  ].slice(0, 500);
}
