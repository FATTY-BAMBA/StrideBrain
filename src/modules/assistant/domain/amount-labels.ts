import { quoteAmountLabelWords } from "@/modules/localization/assistant";
import type { Locale } from "@/modules/localization/config";
import type { AssistantSource } from "./contracts";

export type QuoteAmountField = keyof typeof quoteAmountLabelWords.en;
const fields = Object.keys(quoteAmountLabelWords.en) as QuoteAmountField[];
const number = /(?:NT\$|TWD|USD|\$)?\s*[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g;
const canonical = (value: string): string =>
  value
    .replace(/(?:NT\$|TWD|USD|\$)|[\s,]/g, "")
    .replace(/^\+/, "")
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** No rewriting or arithmetic: associate a cited quote's values with their local labels. */
export function hasWrongAmountLabel(
  text: string,
  sources: readonly AssistantSource[],
  locale: Locale,
): boolean {
  const amounts = new Map<string, Set<QuoteAmountField>>();
  for (const source of sources) {
    const a = source.facts.amounts;
    if (!a || typeof a !== "object") continue;
    for (const field of fields) {
      const value = (a as Record<string, unknown>)[field];
      if (typeof value !== "string") continue;
      const key = canonical(value),
        allowed = amounts.get(key) ?? new Set();
      allowed.add(field);
      amounts.set(key, allowed);
    }
  }
  if (!amounts.size) return false;
  const words = quoteAmountLabelWords[locale];
  const labels = fields.flatMap((field) => words[field].map((label) => ({ field, label })));
  const labelPattern = new RegExp(
    labels
      .map(({ label }) => (/[a-z]/i.test(label) ? `\\b${escape(label)}\\b` : escape(label)))
      .sort((a, b) => b.length - a.length)
      .join("|"),
    "gi",
  );
  // Keep label-only parentheses with their amount, but separate clauses containing money.
  const normalized = text
    .normalize("NFKC")
    .replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, "")
    .replace(/\(\s*\d+(?:\.\d+)?%\s*\)/g, " ")
    .replace(/\(([^()]*)\)/g, (whole, inner: string) => (/\d/.test(inner) ? whole : ` ${inner} `));
  for (const clause of normalized.split(/[,，;；。!?！？()\n]/u)) {
    const occurrences = [...clause.matchAll(number)];
    const tags = [...clause.matchAll(labelPattern)].map((m) => ({
      index: m.index,
      end: m.index + m[0].length,
      field: labels.find((l) => l.label.toLowerCase() === m[0].toLowerCase())!.field,
    }));
    const firstAmountIndex = occurrences.findIndex((m) => amounts.has(canonical(m[0])));
    const firstAmount = occurrences[firstAmountIndex];
    // In “with $5 tax and $100 before tax”, tax belongs to $5, never to $100.
    const labelsFollowAmounts =
      firstAmount !== undefined &&
      !tags.some((t) => t.end <= firstAmount.index) &&
      tags.some(
        (t) =>
          t.index >= firstAmount.index + firstAmount[0].length &&
          t.end <= (occurrences[firstAmountIndex + 1]?.index ?? clause.length),
      );
    for (let i = 0; i < occurrences.length; i++) {
      const m = occurrences[i]!,
        key = canonical(m[0]),
        allowed = amounts.get(key);
      if (!allowed) continue;
      if (clause[m.index + m[0].length] === "%" || /[A-Za-z_]/.test(clause[m.index - 1] ?? ""))
        continue;
      const previousEnd = i ? occurrences[i - 1]!.index + occurrences[i - 1]![0].length : 0;
      const nextStart = occurrences[i + 1]?.index ?? clause.length;
      const before = tags.filter((t) => t.index >= previousEnd && t.end <= m.index).at(-1);
      const after = tags.find((t) => t.index >= m.index + m[0].length && t.end <= nextStart);
      const label = labelsFollowAmounts ? after : (before ?? after);
      if (!label || !allowed.has(label.field)) return true;
    }
  }
  return false;
}
