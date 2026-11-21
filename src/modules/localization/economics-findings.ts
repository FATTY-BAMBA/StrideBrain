import type { Locale } from "./config";
const en = {
  overall: "Overall",
  quote: "quoted price versus quoted history",
  forecast: "forecast cost versus reconciled actual history",
  ABOVE: "above",
  BELOW: "below",
  insufficient: "actual-cost evidence is insufficient",
  programme: "The programme differs from selected history; its cost effect is unquantified.",
  review: "Review these categories and their supporting records",
  nothing: "Nothing is out of range in the available category findings.",
  noQuote: "Cost findings need a quote version for this job. Review is not available yet.",
  noComparison: "Run a comparison to see ranked past jobs and findings for this job.",
  noEconomics: "Financial findings are unavailable for this comparison or your access.",
  detail: "Based on the selected past jobs and authorized source records.",
  check: "Open the supporting evidence before deciding what to change.",
  quotedRow: "quoted",
  actualRow: "forecast / reconciled actual",
} as const;
const zh: Record<keyof typeof en, string> = {
  overall: "整體",
  quote: "報價與歷史報價比較",
  forecast: "預估成本與已核對實際成本比較",
  ABOVE: "高於",
  BELOW: "低於",
  insufficient: "實際成本資料不足",
  programme: "工期與選取的歷史專案不同；其成本影響尚未量化。",
  review: "請審查以下類別及其佐證紀錄",
  nothing: "現有類別資料中沒有超出範圍的項目。",
  noQuote: "此專案需要報價版本才能提供成本發現，目前尚無法建立審查。",
  noComparison: "執行比較以查看此專案的過往專案排名與發現。",
  noEconomics: "此比較或您的權限目前無法提供財務發現。",
  detail: "依據選取的過往專案與已授權來源紀錄。",
  check: "決定變更前，請先開啟佐證資料。",
  quotedRow: "報價",
  actualRow: "預估／已核對實際成本",
};
export function findingsCopy(locale: Locale): Record<keyof typeof en, string> {
  return locale === "zh-TW" ? zh : en;
}
