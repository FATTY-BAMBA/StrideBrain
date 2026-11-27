import type { Locale } from "./config";
const fields: Record<string, readonly [string, string]> = {
  COMPARISON_CLASS: ["Job class", "專案類別"],
  SUBTYPE: ["Job type", "專案類型"],
  AREA: ["Area", "面積"],
  AREA_UNIT: ["Area unit", "面積單位"],
  CURRENCY: ["Currency", "幣別"],
  SCOPE_CATEGORIES: ["Work categories", "工作範圍分類"],
  COMMERCIAL_CATEGORIES: ["Pricing categories", "報價類別"],
  LOCATION_CITY: ["City", "縣市"],
  METADATA_AUTHORITY: ["Verified job details", "已核對的專案資料"],
  SNAPSHOT_DATE: ["Comparison date", "比較日期"],
};
export function missingContextLabel(locale: Locale, field: string) {
  return (
    fields[field]?.[locale === "zh-TW" ? 1 : 0] ??
    (locale === "zh-TW" ? "請補齊專案資料。" : "Complete the job details.")
  );
}
