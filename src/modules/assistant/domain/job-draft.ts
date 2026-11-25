import { taiwanCityKey } from "@/modules/projects/domain/taiwan-cities";
import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import { draftArea } from "@/modules/projects/domain/draft-area";
import { record } from "./grounding";

export const draftFields = [
  "name",
  "clientName",
  "clientType",
  "subtype",
  "scopeCategoryIds",
  "locationCity",
  "locationDistrict",
  "area",
] as const;
export type DraftField = (typeof draftFields)[number];
export type DraftTextField = Exclude<DraftField, "scopeCategoryIds" | "area">;
export type SupportedJobDraft = Readonly<{
  values: Partial<Record<DraftTextField | "areaQuantity", string>>;
  scopeCategoryIds: readonly string[];
  area?: Readonly<{ digits: string; unit: string; squareMetres: string }>;
  kept: readonly string[];
  dropped: readonly string[];
}>;
export type JobDraft = SupportedJobDraft &
  Readonly<{
    clientMode: "existing" | "new";
    clientBusinessKey: string;
  }>;

export const normalizeDraftText = (text: string) =>
  text.normalize("NFKC").replace(/\s+/gu, " ").trim();
const exact = (maxLength: number, choices?: readonly string[]) => ({
  type: ["object", "null"],
  properties: {
    value: { type: "string", maxLength, ...(choices ? { enum: choices } : {}) },
    quote: { type: "string", minLength: 1, maxLength: 1000 },
  },
  required: ["value", "quote"],
  additionalProperties: false,
});
export function jobDraftSchema(
  choices: Readonly<{
    subtype: readonly string[];
    clientType: readonly string[];
    scopeCategoryIds: readonly string[];
  }>,
) {
  return {
    type: "object",
    properties: {
      name: exact(200),
      clientName: exact(200),
      clientType: exact(128, choices.clientType),
      subtype: exact(128, choices.subtype),
      locationCity: exact(120),
      locationDistrict: exact(120),
      scopeCategoryIds: {
        type: "array",
        maxItems: choices.scopeCategoryIds.length,
        items: exact(128, choices.scopeCategoryIds),
      },
      area: {
        type: ["object", "null"],
        properties: {
          digits: { type: "string", maxLength: 19 },
          unit: { type: "string", maxLength: 20 },
          quote: { type: "string", minLength: 1, maxLength: 1000 },
        },
        required: ["digits", "unit", "quote"],
        additionalProperties: false,
      },
    },
    required: draftFields,
    additionalProperties: false,
  };
}

type QuoteOccurrence = Readonly<{ start: number; end: number }>;
function conflictingClientFields(
  text: string,
  quotes: Partial<Record<DraftTextField, string>>,
): readonly ("clientName" | "clientType")[] {
  const occurrences = (quote: string | undefined): readonly (QuoteOccurrence | null)[] => {
    if (!quote) return [null];
    const escaped = quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches: QuoteOccurrence[] = [];
    // Lookahead includes overlapping occurrences; case folding is only for location.
    for (const match of text.matchAll(new RegExp(`(?=(${escaped}))`, "giu"))) {
      matches.push({ start: match.index, end: match.index + match[1]!.length });
      if (matches.length === 20) break;
    }
    return matches;
  };
  const name = occurrences(quotes.name),
    subtype = occurrences(quotes.subtype),
    clientName = occurrences(quotes.clientName),
    clientType = occurrences(quotes.clientType);
  const separate = (a: QuoteOccurrence | null, b: QuoteOccurrence | null) =>
    !a || !b || a.end <= b.start || b.end <= a.start;
  function fits(keepName: boolean, keepType: boolean): boolean {
    for (const client of keepName ? clientName : [null])
      for (const type of keepType ? clientType : [null]) {
        if (!separate(client, type)) continue;
        // Name and subtype may overlap each other, so each can choose independently.
        if (
          [name, subtype].every((job) =>
            job.some((range) => separate(range, client) && separate(range, type)),
          )
        )
          return true;
      }
    return false;
  }
  if (fits(true, true)) return [];
  if (fits(true, false)) return ["clientType"];
  if (fits(false, true)) return ["clientName"];
  return ["clientType", "clientName"];
}

/** Invalid fields are dropped independently. Only quotes present in the redacted input count.
 * An area quote never starts inside a longer number, including one grouped with commas (1,200). */
export function supportJobDraft(
  text: string,
  raw: unknown,
  lists: FirmLists,
): SupportedJobDraft | null {
  const jobTypes = lists.jobTypes.filter((entry) => entry.active).map((entry) => entry.key);
  const scopes = lists.workCategories
    .filter((entry) => entry.active && entry.scopeSelectable)
    .map((entry) => entry.key);
  const input = record(raw);
  if (
    !input ||
    Object.keys(input).some((k) => !draftFields.includes(k as DraftField)) ||
    draftFields.some((k) => !(k in input)) ||
    !Array.isArray(input.scopeCategoryIds) ||
    input.scopeCategoryIds.length > scopes.length
  )
    return null;
  const normalized = normalizeDraftText(text);
  const kept: string[] = [],
    dropped: string[] = [];
  const values: SupportedJobDraft["values"] = {};
  const quotes: Partial<Record<DraftTextField, string>> = {};
  function supported(raw: unknown, max: number, choices?: readonly string[]): string | null {
    const item = record(raw);
    if (
      !item ||
      Object.keys(item).some((k) => !["value", "quote"].includes(k)) ||
      typeof item.value !== "string" ||
      typeof item.quote !== "string"
    )
      return null;
    const quote = normalizeDraftText(item.quote),
      value = normalizeDraftText(item.value);
    if (
      !quote ||
      quote.includes("[removed]") ||
      !normalized.includes(quote) ||
      !value ||
      value.length > max ||
      /[\u0000-\u001f\u007f]/u.test(value)
    )
      return null;
    return choices ? (choices.includes(value) ? value : null) : value === quote ? quote : null;
  }
  for (const field of [
    "name",
    "clientName",
    "locationCity",
    "locationDistrict",
    "clientType",
    "subtype",
  ] as const) {
    const supportedValue = supported(
      input[field],
      field.startsWith("location") ? 120 : 200,
      field === "clientType"
        ? lists.clientTypes.filter((entry) => entry.active).map((entry) => entry.key)
        : field === "subtype"
          ? jobTypes
          : undefined,
    );
    const value =
      field === "locationCity"
        ? supportedValue
          ? taiwanCityKey(supportedValue)
          : null
        : supportedValue;
    if (value) {
      values[field] = value;
      quotes[field] = normalizeDraftText(record(input[field])!.quote as string);
      kept.push(field);
    } else dropped.push(field);
  }
  for (const field of conflictingClientFields(normalized, quotes)) {
    const index = kept.indexOf(field);
    if (index < 0) continue;
    delete values[field];
    kept.splice(index, 1);
    dropped.push(field);
  }
  const scopeCategoryIds: string[] = [];
  for (const [i, item] of input.scopeCategoryIds.entries()) {
    const value = supported(item, 128, scopes);
    if (value && !scopeCategoryIds.includes(value)) {
      scopeCategoryIds.push(value);
      kept.push(`scopeCategoryIds.${value}`);
    } else dropped.push(`scopeCategoryIds.${i}`);
  }
  if (!input.scopeCategoryIds.length) dropped.push("scopeCategoryIds");
  const rawArea = record(input.area);
  let area: SupportedJobDraft["area"];
  if (
    rawArea &&
    Object.keys(rawArea).every((k) => ["digits", "unit", "quote"].includes(k)) &&
    typeof rawArea.digits === "string" &&
    typeof rawArea.unit === "string" &&
    typeof rawArea.quote === "string"
  ) {
    const quote = normalizeDraftText(rawArea.quote),
      digits = normalizeDraftText(rawArea.digits),
      unit = normalizeDraftText(rawArea.unit);
    const squareMetres = draftArea(rawArea.digits, rawArea.unit);
    if (
      squareMetres &&
      quote &&
      !quote.includes("[removed]") &&
      new RegExp(`(?<![0-9.]|[0-9],)${quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![0-9])`).test(
        normalized,
      ) &&
      [digits + unit, digits + " " + unit].includes(quote)
    ) {
      area = { digits: rawArea.digits, unit: rawArea.unit, squareMetres };
      values.areaQuantity = squareMetres;
    }
  }
  if (area) kept.push("area");
  else dropped.push("area");
  return { values, scopeCategoryIds, ...(area ? { area } : {}), kept, dropped };
}

/** The caller supplies active clients of the authorized firm; none are sent to the model. */
export function matchDraftClient(
  name: string | undefined,
  clients: readonly { businessKey: string; nameEn: string; nameZhTw: string }[],
): string | null {
  if (!name) return null;
  const key = (s: string) => s.normalize("NFKC").trim().toLowerCase();
  const matches = clients.filter((c) => [c.nameEn, c.nameZhTw].some((n) => key(n) === key(name)));
  return matches.length === 1 ? matches[0]!.businessKey : null;
}
