import type { AssistantSource } from "./contracts";
import type { Locale } from "@/modules/localization/config";

export type SourceDisplay = Readonly<{
  kind:
    | "JOB"
    | "QUOTE"
    | "COMPARISON"
    | "CATEGORY_PRICES"
    | "ITEM_PRICE"
    | "JOB_LIST"
    | "AWAITING_LIST"
    | "CLOSED_LIST"
    | "ITEM_LIST";
  title: string;
  reference?: string;
  unit?: string;
  filter?: string;
}>;
export type DisplayFact = Readonly<{
  ref: string;
  sourceId: string;
  path: string;
  label: string;
  value: string;
}>;
export type AnswerRow = DisplayFact & Readonly<{ details?: readonly DisplayFact[] }>;
export type AnswerCard = Readonly<{
  kind: "CARD";
  key: string;
  title: string;
  reference?: string;
  unit?: string;
  rows: readonly AnswerRow[];
  /** Count of otherwise visible fact rows omitted by the answer-wide layout limit. */
  remaining?: string;
  link: Readonly<{ href: string; label: string }>;
  list?: Readonly<{
    count: number;
    countText: string;
    filter?: Readonly<{ label: string; value: string }>;
    rows: readonly Readonly<{
      key: string;
      title: string;
      reference?: string;
      unit?: string;
      facts: readonly AnswerRow[];
    }>[];
    remaining: string | null;
  }>;
}>;
export type AnswerPresentation = Readonly<{
  version: 1;
  locale: Locale;
  blocks: readonly (AnswerCard | Readonly<{ kind: "NOTICE"; text: string }>)[];
}>;

/** Semantic identity comes from authorized DTO fields, never from parsing answer text. */
export function displayIdentity(source: AssistantSource): SourceDisplay {
  if (source.display) return source.display;
  // Compatibility for recorded sources and callers predating structured cards.
  const f = source.facts;
  return {
    kind: typeof f.lastPrice === "string" ? "ITEM_PRICE" : "JOB",
    title:
      typeof f.name === "string"
        ? f.name
        : typeof f.description === "string"
          ? f.description
          : source.label,
    ...(typeof f.reference === "string" ? { reference: f.reference } : {}),
    ...(typeof f.lastPrice === "string" && typeof f.unit === "string" ? { unit: f.unit } : {}),
  };
}
export function recordIdentity(source: AssistantSource): string {
  const d = displayIdentity(source);
  if (d.kind === "ITEM_PRICE") return JSON.stringify([d.kind, d.title, d.unit]);
  if (d.reference && ["JOB", "QUOTE"].includes(d.kind))
    return JSON.stringify([d.kind, d.reference]);
  return source.sourceId;
}
export function cardLink(source: AssistantSource, locale: Locale) {
  const kind = displayIdentity(source).kind;
  const pageLocale = source.href.match(/^\/(?:en|zh-TW)(?=\/|$)/)?.[0] ?? `/${locale}`;
  const zh = locale === "zh-TW";
  if (kind === "ITEM_PRICE" || kind === "ITEM_LIST")
    return { href: `${pageLocale}/quotes/prices`, label: zh ? "開啟價格表" : "Open price list" };
  if (kind === "AWAITING_LIST")
    return { href: `${pageLocale}/quotes?status=ISSUED`, label: zh ? "開啟報價" : "Open quotes" };
  if (kind === "QUOTE") return { href: source.href, label: zh ? "開啟報價" : "Open quote" };
  if (kind === "COMPARISON")
    return { href: source.href, label: zh ? "開啟比較" : "Open comparison" };
  if (kind === "CATEGORY_PRICES")
    return { href: source.href, label: zh ? "開啟報價" : "Open quote" };
  return { href: source.href, label: zh ? "開啟專案" : "Open job" };
}
export function listFactPaths(source: AssistantSource): readonly string[] | null {
  switch (displayIdentity(source).kind) {
    case "AWAITING_LIST":
      return ["name", "reference", "documentNumber", "validUntil"];
    case "JOB_LIST":
      return ["name", "reference", "stage"];
    case "CLOSED_LIST":
      return [
        "name",
        "reference",
        "quotedPrice",
        "reconciledActualCost",
        "overallDifference",
        "costComparison",
      ];
    default:
      return null;
  }
}
export function listCountText(source: AssistantSource, count: number, locale: Locale): string {
  const kind = displayIdentity(source).kind;
  if (kind === "AWAITING_LIST")
    return locale === "zh-TW" ? `${count} 份報價` : `${count} quote${count === 1 ? "" : "s"}`;
  if (kind === "ITEM_LIST")
    return locale === "zh-TW" ? `${count} 個項目` : `${count} item${count === 1 ? "" : "s"}`;
  return locale === "zh-TW" ? `${count} 個專案` : `${count} job${count === 1 ? "" : "s"}`;
}
export function emptyListText(source: AssistantSource, locale: Locale): string {
  switch (displayIdentity(source).kind) {
    case "AWAITING_LIST":
      return locale === "zh-TW"
        ? "目前沒有等待客戶回覆的報價。"
        : "No quotes are awaiting the client right now.";
    case "JOB_LIST":
      return locale === "zh-TW" ? "目前沒有符合條件的專案。" : "No jobs match right now.";
    case "CLOSED_LIST":
      return locale === "zh-TW"
        ? "目前沒有可顯示的已結案專案。"
        : "No closed jobs are available to show right now.";
    case "ITEM_LIST":
      return locale === "zh-TW"
        ? "目前沒有符合條件的價格表項目。"
        : "No price-list items match right now.";
    default:
      return locale === "zh-TW"
        ? `${source.label}目前沒有符合的項目。`
        : `No matching entries in ${source.label} right now.`;
  }
}
