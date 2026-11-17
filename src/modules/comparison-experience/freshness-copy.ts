import type { SourceChangeReason } from "@/modules/comparisons/domain/freshness";
import type { Locale } from "@/modules/localization/config";

type FreshnessCopy = Readonly<{
  stale: string;
  unverified: string;
  explanation: string;
  unverifiedExplanation: string;
  changedSources: string;
  otherChanges: string;
  authority: string;
  previous: string;
  current: string;
  rerun: string;
  pending: string;
  reasons: Readonly<Record<SourceChangeReason, string>>;
}>;

const en: FreshnessCopy = {
  stale: "This result is stale",
  unverified: "This result could not be checked against current information",
  explanation:
    "You can inspect this saved result, but cannot prepare or confirm a new action from it. Re-run the comparison to review current information.",
  unverifiedExplanation:
    "This saved result remains available for inspection. New action preparation and confirmation are unavailable until current information is verified. Re-run the comparison to try again.",
  changedSources: "Changed sources",
  otherChanges:
    "The source information or comparison conditions have changed since this result was saved.",
  authority: "Evidence authority changed",
  previous: "At calculation",
  current: "Now",
  rerun: "Re-run comparison",
  pending: "Re-running comparison…",
  reasons: {
    AUTHORITY: "Evidence authority changed.",
    SOURCE_DETAILS: "Source details changed.",
    SUPPORT: "The source's support for the saved calculation changed.",
    FRESHNESS: "The source has become stale since this result was saved.",
    SUPERSEDED: "A newer source version has superseded this source.",
    UNAVAILABLE: "The source is no longer available.",
  },
};

const zhTw: FreshnessCopy = {
  stale: "此比較結果已過時",
  unverified: "目前無法確認此結果是否仍符合最新資料",
  explanation:
    "您仍可檢視這份已儲存的結果，但無法據此準備或確認新的審查事項。請重新比較，以檢視最新資料。",
  unverifiedExplanation:
    "您仍可檢視這份已儲存的結果。在確認最新資料前，無法準備或確認新的審查事項。請重新比較後再試。",
  changedSources: "已變更的資料來源",
  otherChanges: "這份結果儲存後，資料來源或比較條件已變更。",
  authority: "佐證資料權威性已變更",
  previous: "計算時",
  current: "目前",
  rerun: "重新比較",
  pending: "正在重新比較…",
  reasons: {
    AUTHORITY: "佐證資料權威性已變更。",
    SOURCE_DETAILS: "資料來源內容已變更。",
    SUPPORT: "此來源對已儲存計算結果的佐證情況已變更。",
    FRESHNESS: "這份結果儲存後，此資料來源已過時。",
    SUPERSEDED: "此資料來源已由較新版本取代。",
    UNAVAILABLE: "此資料來源目前無法使用。",
  },
};

export function getFreshnessCopy(locale: Locale): FreshnessCopy {
  return locale === "zh-TW" ? zhTw : en;
}
