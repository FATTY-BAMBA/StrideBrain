import { draftFields, normalizeDraftText } from "@/modules/assistant/domain/job-draft";
import type { JobDraftCase } from "./job-draft-cases";

/** A deterministic provider fixture with separate support for job and client fields. */
export function modelDraftForCase(test: JobDraftCase): Record<string, unknown> {
  const text = normalizeDraftText(test.text);
  const raw: Record<string, unknown> = Object.fromEntries(
    draftFields.map((field) => [field, field === "scopeCategoryIds" ? [] : null]),
  );
  for (const [field, value] of Object.entries(test.expected)) {
    if (field === "areaQuantity") continue;
    let quote = value;
    if (field === "subtype")
      quote = text.match(
        /Retail (?:flagship|renovation|concept store|showroom)|零售(?:旗艦店|整修|概念店|展示店)/iu,
      )![0];
    if (field === "clientType")
      quote = text.match(
        /(?:client type|客戶類型):\s*(?:retail|corporate|hospitality|零售|企業|旅宿)/iu,
      )![0];
    raw[field] = { value, quote };
  }
  raw.scopeCategoryIds = test.scopes.map((value) => ({
    value,
    quote: text.split(/Phone|電話/)[0]!,
  }));
  if (test.expected.areaQuantity) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(坪|m2|平方公尺)/)!;
    raw.area = { digits: match[1], unit: match[2], quote: match[0] };
  }
  return raw;
}
