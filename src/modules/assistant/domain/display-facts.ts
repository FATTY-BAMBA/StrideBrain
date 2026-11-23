import type { Locale } from "@/modules/localization/config";
import { assistantFactCopy, assistantFactLabels } from "@/modules/localization/assistant";
import { modelFacts } from "./redaction";

/** Project only existing display facts. Redaction happens before this function. */
export function labelledFacts(facts: unknown, locale: Locale): unknown {
  const labels = assistantFactLabels(locale);
  const copy = assistantFactCopy(locale);
  const localize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(localize);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => labels[key])
          .map(([key, v]) =>
            key === "acceptedOn" && v === copy.notAccepted
              ? [labels.acceptance, copy.notAccepted.toLocaleLowerCase(locale)]
              : [labels[key], localize(v)],
          ),
      );
    return value;
  };
  return localize(modelFacts(facts));
}
