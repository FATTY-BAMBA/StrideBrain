import type { FirmLists } from "@/modules/firm-lists/domain/contracts";
import { firmEntryLabel } from "@/modules/firm-lists/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { getFinancialCopy } from "@/modules/localization/financial-copy";
import { projectSubtypeLabel } from "@/modules/localization/project-context";

// Raw identifiers stay in the immutable source DTO. Only reviewed business copy is
// selected for normal UI; an unknown field must never become a camel-case label.
const values: Readonly<Record<string, readonly [string, string]>> = {
  HISTORICAL_QUOTED_PRICE_NORMALIZED_MEDIAN: [
    "Historical normalized quoted-price median",
    "歷史標準化報價中位數",
  ],
  HISTORICAL_RECONCILED_ACTUAL_COST_NORMALIZED_MEDIAN: [
    "Historical normalized reconciled actual-cost median",
    "歷史標準化已核對實際成本中位數",
  ],
  PROJECT: ["Project record", "專案紀錄"],
  PROJECT_SCOPE: ["Project scope", "專案範圍"],
  DOCUMENT_VERSION: ["Document version", "文件版本"],
  QUOTE_VERSION: ["Quote version", "報價版本"],
  QUOTE_ITEM: ["Quote line", "報價項目"],
  FORECAST_COST_VERSION: ["Forecast cost version", "預估成本版本"],
  FORECAST_COST_LINE: ["Forecast cost line", "預估成本項目"],
  PROJECT_COST_VERSION: ["Reconciled actual cost version", "已核對實際成本版本"],
  COST_LINE: ["Reconciled actual cost line", "已核對實際成本項目"],
  UNQUANTIFIED: ["Not quantified", "尚未量化"],
  CURRENT_CONTEXT: ["Current context", "目前資料"],
  HISTORICAL_CONTEXT: ["Historical context", "歷史資料"],
  ABOVE: ["Above the historical baseline", "高於歷史基準"],
  BELOW: ["Below the historical baseline", "低於歷史基準"],
  ALIGNED: ["Aligned with the historical baseline", "與歷史基準相當"],
  TWD: ["TWD", "新臺幣"],
  TWD_PER_M2: ["TWD/m²", "新臺幣／平方公尺"],
  weeks: ["weeks", "週"],
  KNOWN: ["Known", "已知"],
  UNKNOWN: ["Unknown—not a mismatch", "資料未知，不視為不相符"],
  NOT_APPLICABLE: ["Not applicable", "不適用"],
  ACTIVE: ["Active", "進行中"],
  COMPLETED: ["Completed", "已完成"],
  FINAL: ["Final", "定稿"],
  DRAFT: ["Draft", "草稿"],
  APPROVED: ["Approved", "已核准"],
  SUPERSEDED: ["Superseded", "已由新版取代"],
  RECONCILED: ["Reconciled", "已核對"],
  "document-version": ["Document version", "文件版本"],
  QUOTED_PRICE_MEDIAN: ["Quoted-price historical median", "歷史報價中位數"],
  RECONCILED_ACTUAL_COST_MEDIAN: [
    "Reconciled actual-cost historical median",
    "歷史已核對實際成本中位數",
  ],
  QUOTED_PRICE_OVERALL_MEDIAN: ["Overall quoted-price historical median", "整體歷史報價中位數"],
  RECONCILED_ACTUAL_COST_OVERALL_MEDIAN: [
    "Overall reconciled actual-cost historical median",
    "整體歷史已核對實際成本中位數",
  ],
  QUOTED_PRICE_CATEGORY_MEDIAN: ["Category quoted-price historical median", "分類歷史報價中位數"],
  RECONCILED_ACTUAL_COST_CATEGORY_MEDIAN: [
    "Category reconciled actual-cost historical median",
    "分類歷史已核對實際成本中位數",
  ],
  QUOTE_VERSUS_QUOTED_PRICE_MEDIAN_VARIANCE: [
    "Current quoted price versus historical quoted-price median",
    "目前報價與歷史報價中位數的差異",
  ],
  FORECAST_VERSUS_RECONCILED_ACTUAL_COST_MEDIAN_VARIANCE: [
    "Current forecast direct cost versus historical reconciled actual-cost median",
    "目前預估直接成本與歷史已核對實際成本中位數的差異",
  ],
  CATEGORY_VARIANCE: ["Category variance", "分類差異"],
  MEDIAN_MIN_MAX: ["Median, minimum and maximum", "中位數、最低值與最高值"],
  "(CURRENT_NORMALIZED - HISTORICAL_MEDIAN) / HISTORICAL_MEDIAN * 100": [
    "(Current normalized value − historical median) ÷ historical median × 100",
    "（目前標準化數值－歷史中位數）÷ 歷史中位數 × 100",
  ],
  HALF_UP: ["Round half up", "四捨五入"],
  "HALF_UP; percent scale 4": [
    "Round half up to 4 decimal places for percentages",
    "百分比四捨五入至小數點後 4 位",
  ],
  "HALF_UP; normalized rate scale 6; equivalent amount scale 2": [
    "Round half up: normalized rates to 6 decimal places; equivalent amounts to 2",
    "四捨五入：標準化單價保留小數點後 6 位；等值金額保留 2 位",
  ],
  "subtype.compatibility": [
    "Exact or configured adjacent project types",
    "依專案類型相同或設定的相近類型比較",
  ],
  "area.log-ratio": [
    "Area similarity based on the logarithmic area ratio",
    "依面積比值的對數計算相似度",
  ],
  "scope_overlap.jaccard": [
    "Shared scope categories divided by all distinct scope categories",
    "共同工作範圍分類數占全部不重複分類數的比例",
  ],
  "commercial_category_overlap.jaccard": [
    "Shared commercial categories divided by all distinct categories",
    "共同報價分類數占全部不重複分類數的比例",
  ],
  "material_overlap.jaccard": [
    "Shared materials divided by all distinct materials",
    "共同材料數占全部不重複材料數的比例",
  ],
  "supplier_overlap.jaccard": [
    "Shared suppliers divided by all distinct suppliers",
    "共同供應商數占全部不重複供應商數的比例",
  ],
  "scope_overlap.unknown": [
    "Scope evidence is missing; this is not treated as a mismatch",
    "工作範圍資料不足，不視為不相符",
  ],
  "commercial_category_overlap.unknown": [
    "Commercial category evidence is missing; this is not treated as a mismatch",
    "報價分類資料不足，不視為不相符",
  ],
  "material_overlap.unknown": [
    "Material evidence is missing; this is not treated as a mismatch",
    "材料資料不足，不視為不相符",
  ],
  "supplier_overlap.unknown": [
    "Supplier evidence is missing; this is not treated as a mismatch",
    "供應商資料不足，不視為不相符",
  ],
  "completion.recency-60-months": [
    "Completion recency within a 60-month window",
    "依最近 60 個月內的完工時間計算接近度",
  ],
  "location.configured-proximity": [
    "Configured district, city and adjacent-city proximity",
    "依行政區、城市與鄰近城市的設定比較地點接近度",
  ],
};

export function evidenceValueLabel(locale: Locale, value: string, catalog: FirmLists): string {
  const financial = getFinancialCopy(locale);
  const subtype = projectSubtypeLabel(locale, value, catalog.jobTypes);
  if (subtype) return subtype;
  const configured = [...catalog.workCategories, ...catalog.quoteUnits].find(
    (entry) => entry.key === value,
  );
  if (configured) return firmEntryLabel([configured], value, locale);
  const known = values[value];
  if (known) return known[locale === "zh-TW" ? 1 : 0];
  const observation = financial.observations[value as keyof typeof financial.observations];
  if (observation) return observation;
  const authority = financial.authorities[value as keyof typeof financial.authorities];
  if (authority) return authority;
  // Unknown machine tokens remain inspectable internally, never exposed as UI copy.
  if (/^[A-Z][A-Z_]+$/.test(value) || /^[a-z_]+\.[a-z_-]+$/.test(value)) {
    return locale === "zh-TW" ? "此項說明尚未提供" : "Description unavailable";
  }
  return value;
}

const recordTypes: Readonly<Record<string, readonly [string, string]>> = {
  project: ["Project record", "專案紀錄"],
  "project-scope": ["Project scope", "專案範圍"],
  "document-version": ["Document version", "文件版本"],
  "quote-version": ["Quote version", "報價版本"],
  "quote-item": ["Quote line", "報價項目"],
  "forecast-cost-version": ["Forecast cost version", "預估成本版本"],
  "forecast-cost-line": ["Forecast cost line", "預估成本項目"],
  "project-cost-version": ["Reconciled actual cost version", "已核對實際成本版本"],
  "cost-line": ["Reconciled actual cost line", "已核對實際成本項目"],
  "supplier-offer": ["Supplier offer", "供應商報價"],
  "supplier-offer-item": ["Supplier offer line", "供應商報價項目"],
};

export function evidenceRecordTypeLabel(locale: Locale, kind: string): string {
  return Object.hasOwn(recordTypes, kind)
    ? recordTypes[kind]![locale === "zh-TW" ? 1 : 0]
    : locale === "zh-TW"
      ? "來源紀錄"
      : "Source record";
}

export function evidenceTitle(locale: Locale, title: string, catalog: FirmLists): string {
  const configured = [...catalog.jobTypes, ...catalog.workCategories, ...catalog.quoteUnits].sort(
    (a, b) => b.key.length - a.key.length,
  );
  let localized = title;
  for (const entry of configured) {
    const escaped = entry.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    localized = localized.replace(new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "g"), () =>
      firmEntryLabel([entry], entry.key, locale),
    );
  }
  return localized.replace(
    /(?<![\w-])[A-Z][A-Z_]+(?![\w-])/g,
    (value) =>
      projectSubtypeLabel(locale, value, catalog.jobTypes) ??
      (values[value] ? values[value][locale === "zh-TW" ? 1 : 0] : value),
  );
}

export function evidencePolicyDescription(locale: Locale, kind: "FACTOR" | "FINANCIAL"): string {
  return kind === "FACTOR"
    ? locale === "zh-TW"
      ? "依已核准的相似度規則計算；缺少資料不視為不相符。"
      : "Calculated using the approved similarity rules; missing evidence is not treated as a mismatch."
    : locale === "zh-TW"
      ? "僅使用符合資料權威性規則的觀測值；不同成本與報價類型分開比較。"
      : "Uses observations eligible under the evidence-authority rules; quote and cost types remain distinct.";
}
