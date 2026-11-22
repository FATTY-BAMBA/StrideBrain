/** Draft provenance is read only through the quote use case, which checks every underlying source.
 * Ordinary quote evidence supports the entered amount; it must not expose the historical basis. */
export function publicEvidenceValue(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "quoteDraft"));
}
