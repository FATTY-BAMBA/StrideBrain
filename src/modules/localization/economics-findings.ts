import type { Locale } from "./config";
const en = {
  overall: "Overall",
  quote: "{category}: quoted price is {percent}% {direction} past quoted prices.",
  forecast: "{category}: forecast cost is {percent}% {direction} past reconciled actual costs.",
  ABOVE: "above",
  BELOW: "below",
  insufficient:
    "{category}: too few past reconciled actual costs to compare ({eligible} of {required} needed).",
  programme:
    "The programme differs from the selected past jobs; the cost effect is not quantified.",
  review: "Review these categories and their supporting records",
  nothing: "Nothing is out of range in the available category findings.",
  noQuote: "Cost findings need a quote version for this job. Review is not available yet.",
  noComparison: "Run a comparison to see ranked past jobs and findings for this job.",
  outOfDate: "The saved comparison is out of date. Open the comparison to run it again.",
  unavailable: "Saved findings are unavailable. Open the comparison to try again.",
  noEconomics: "Financial findings are unavailable for this comparison or your access.",
  detail: "Based on the selected past jobs and authorized source records.",
  check: "Open the supporting evidence before deciding what to change.",
  quotedRow: "quoted",
  actualRow: "forecast / reconciled actual",
} as const;
const zh: Record<keyof typeof en, string> = {
  overall: "整體",
  quote: "{category}：報價比過往報價{direction} {percent}%",
  forecast: "{category}：預估成本比過往已核對實際成本{direction} {percent}%",
  ABOVE: "高",
  BELOW: "低",
  insufficient: "{category}：過往已核對實際成本紀錄不足，無法比較（{eligible}/{required}）",
  programme: "工期與所選過往專案不同，對成本的影響尚未量化。",
  review: "請審查以下類別及其佐證紀錄",
  nothing: "現有類別資料中沒有超出範圍的項目。",
  noQuote: "此專案尚無報價版本，無法提供成本比較，也還不能建立審查。",
  noComparison: "執行比較，即可查看相似的過往專案與成本比較結果。",
  outOfDate: "已儲存的比較已過期，請開啟比較後重新執行。",
  unavailable: "目前無法讀取已儲存的比較結果，請開啟比較後再試一次。",
  noEconomics: "此比較或您的權限目前無法提供財務發現。",
  detail: "依據選取的過往專案與已授權來源紀錄。",
  check: "決定變更前，請先開啟佐證資料。",
  quotedRow: "報價",
  actualRow: "預估／已核對實際成本",
};
export function findingsCopy(locale: Locale): Record<keyof typeof en, string> {
  return locale === "zh-TW" ? zh : en;
}
