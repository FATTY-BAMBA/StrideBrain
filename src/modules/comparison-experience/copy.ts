import type { SimilarityFactorKey } from "@/modules/comparisons/domain/contracts";
import type { Locale } from "@/modules/localization/config";

export type ComparisonCopy = Readonly<{
  eyebrow: string;
  titlePrefix: string;
  description: string;
  heroQuestion: string;
  heroPrompt: string;
  runComparison: string;
  rerunComparison: string;
  sessionRequiredTitle: string;
  sessionRequiredDescription: string;
  unavailableTitle: string;
  unavailableDescription: string;
  loadingLabel: string;
  openingEvidence: string;
  failedTitle: string;
  failedDescription: string;
  contextIncompleteTitle: string;
  noHistoryTitle: string;
  referenceId: string;
  summary: Readonly<{
    generated: string;
    policy: string;
    matches: string;
    selected: string;
    economics: string;
    demoData: string;
  }>;
  selection: Readonly<{
    title: string;
    description: string;
    apply: string;
    selectedCount: string;
    maximum: string;
    errorMaximum: string;
  }>;
  card: Readonly<{
    score: string;
    coverage: string;
    strongest: string;
    differences: string;
    unknowns: string;
    quotedAvailable: string;
    actualAvailable: string;
    inspectFactors: string;
  }>;
  bands: Readonly<{
    STRONG: string;
    RELEVANT: string;
    PARTIAL: string;
    BROADER: string;
  }>;
  factors: Readonly<Record<SimilarityFactorKey, string>>;
  factorState: Readonly<{
    unknown: string;
    contribution: string;
    lostContribution: string;
  }>;
  table: Readonly<{
    title: string;
    description: string;
    activeProject: string;
    projectContext: string;
    economics: string;
    categories: string;
    evidenceState: string;
    subtype: string;
    area: string;
    location: string;
    completion: string;
    quotedRate: string;
    forecastRate: string;
    actualRate: string;
    supplierContext: string;
    programme: string;
  }>;
  states: Readonly<{
    sufficient: string;
    insufficient: string;
    restricted: string;
    unavailable: string;
    stale: string;
    conflicted: string;
    notApplicable: string;
    quotedOnly: string;
    partial: string;
    complete: string;
    structuralOnly: string;
  }>;
  synthesis: Readonly<{
    title: string;
    history: string;
    differences: string;
    gaps: string;
    recommendation: string;
    programmeDifference: string;
    noEconomics: string;
  }>;
  notices: Readonly<{
    staleSupplier: string;
    conflict: string;
    insufficientActual: string;
    restricted: string;
    synthetic: string;
  }>;
  actionComingLater: string;
  normalizedUnit: string;
  programmeUnit: string;
  similarityMethod: string;
  selectedProjects: string;
}>;

const en: ComparisonCopy = {
  eyebrow: "COMPARE WITH PAST WORK",
  titlePrefix: "Historical precedents for",
  description: "Find relevant past projects, see what needs review, and check the evidence.",
  heroQuestion: "Have we done something like this before?",
  heroPrompt:
    "Search the authorized project history, explain the strongest matches, and compare the current quotation with trustworthy precedents.",
  runComparison: "Find comparable projects",
  rerunComparison: "Run a fresh comparison",
  sessionRequiredTitle: "A controlled demo session is required.",
  sessionRequiredDescription:
    "Sign in to your demo session to compare the projects you can access.",
  unavailableTitle: "This comparison is unavailable.",
  unavailableDescription:
    "The project or stored run is not available under the current authorization context.",
  loadingLabel: "Loading comparable projects",
  openingEvidence: "Opening evidence…",
  failedTitle: "StrideBrain could not complete the comparison.",
  failedDescription:
    "No unsupported conclusion was shown. Use the reference ID when reviewing the failure.",
  contextIncompleteTitle: "The current project needs more structured context before comparison.",
  noHistoryTitle: "No authorized historical projects meet the comparison policy.",
  referenceId: "Reference ID",
  summary: {
    generated: "Generated",
    policy: "Comparison policy",
    matches: "Authorized matches",
    selected: "Selected precedents",
    economics: "Commercial evidence",
    demoData: "Data boundary",
  },
  selection: {
    title: "Choose precedents to compare",
    description:
      "Select up to three projects, then update the comparison. The similarity ranking stays the same.",
    apply: "Update comparison",
    selectedCount: "selected",
    maximum: "Maximum 3",
    errorMaximum: "Select no more than three projects.",
  },
  card: {
    score: "Match score",
    coverage: "Evidence coverage",
    strongest: "Strongest similarities",
    differences: "Important differences",
    unknowns: "Unknown factors",
    quotedAvailable: "Quoted history",
    actualAvailable: "Reconciled actual cost",
    inspectFactors: "Inspect factors",
  },
  bands: {
    STRONG: "Strong match",
    RELEVANT: "Relevant match",
    PARTIAL: "Partial match",
    BROADER: "Broader reference",
  },
  factors: {
    SUBTYPE: "Project subtype",
    SCOPE_OVERLAP: "Scope overlap",
    AREA_SIMILARITY: "Area similarity",
    COMMERCIAL_CATEGORY_OVERLAP: "Commercial-category overlap",
    MATERIAL_OVERLAP: "Material overlap",
    SUPPLIER_OVERLAP: "Supplier overlap",
    COMPLETION_RECENCY: "Completion recency",
    LOCATION_PROXIMITY: "Location proximity",
  },
  factorState: {
    unknown: "Unknown—not treated as a mismatch",
    contribution: "Score contribution",
    lostContribution: "Lost contribution",
  },
  table: {
    title: "Structured comparison",
    description:
      "Compare the details. Quoted price, forecast, supplier offer, and reconciled actual cost remain separate.",
    activeProject: "Current project",
    projectContext: "Project context",
    economics: "Overall commercial comparison",
    categories: "Category comparison",
    evidenceState: "Evidence and sufficiency",
    subtype: "Subtype",
    area: "Area",
    location: "Location",
    completion: "Completion",
    quotedRate: "Quoted price · normalized",
    forecastRate: "Forecast direct cost · normalized",
    actualRate: "Forecast / reconciled actual cost · normalized",
    supplierContext: "Supplier-offer context",
    programme: "Programme",
  },
  states: {
    sufficient: "Sufficient evidence",
    insufficient: "Insufficient evidence",
    restricted: "Restricted for this role",
    unavailable: "Unavailable",
    stale: "Historical / stale",
    conflicted: "Conflicting records",
    notApplicable: "Not applicable",
    quotedOnly: "Quoted history only",
    partial: "Partial economics",
    complete: "Quote and actual history",
    structuralOnly: "Structural comparison only",
  },
  synthesis: {
    title: "What needs review",
    history: "What history suggests",
    differences: "Important differences",
    gaps: "Evidence gaps",
    recommendation: "Recommended next review",
    programmeDifference:
      "The current programme differs from the selected history; its cost effect is unquantified.",
    noEconomics:
      "Commercial evidence is restricted or unavailable; the structural comparison remains usable.",
  },
  notices: {
    staleSupplier: "Supplier offers are historical and must not be presented as current pricing.",
    conflict: "Conflicting evidence is visible and excluded from authoritative aggregates.",
    insufficientActual: "Some categories do not have enough reconciled actual-cost evidence.",
    restricted: "Commercial values are restricted under the current role.",
    synthetic: "Synthetic demo data for {job}; not a market benchmark.",
  },
  actionComingLater: "Internal review action becomes available in Stage 8.",
  normalizedUnit: "TWD/m²",
  programmeUnit: "weeks",
  similarityMethod: "Project similarity",
  selectedProjects: "Selected projects",
};

const zhTw: ComparisonCopy = {
  eyebrow: "與過往專案比較",
  titlePrefix: "歷史專案比較：",
  description: "找到相關的過往專案，掌握需要檢視的事項，並查閱佐證資料。",
  heroQuestion: "我們以前做過類似的案子嗎？",
  heroPrompt: "搜尋已授權的歷史專案、說明最接近的原因，並用可信任的歷史依據比較目前報價。",
  runComparison: "尋找類似歷史專案",
  rerunComparison: "重新執行比較",
  sessionRequiredTitle: "需要受控的示範工作階段。",
  sessionRequiredDescription: "請登入示範工作階段，比較您有權查看的專案。",
  unavailableTitle: "目前無法開啟此比較。",
  unavailableDescription: "目前的授權脈絡無法存取此專案或已儲存的比較結果。",
  loadingLabel: "正在載入歷史專案比較",
  openingEvidence: "正在開啟佐證…",
  failedTitle: "StrideBrain 無法完成此次比較。",
  failedDescription: "系統沒有顯示未經支持的結論。檢查問題時請使用參考編號。",
  contextIncompleteTitle: "目前專案需要更多結構化資料才能進行比較。",
  noHistoryTitle: "沒有已授權的歷史專案符合比較規則。",
  referenceId: "參考編號",
  summary: {
    generated: "產生時間",
    policy: "比較規則",
    matches: "已授權相似專案",
    selected: "已選歷史專案",
    economics: "商務資料狀態",
    demoData: "資料邊界",
  },
  selection: {
    title: "選擇要比較的歷史專案",
    description: "最多選擇三個專案，再更新比較。專案相似度排序維持不變。",
    apply: "更新比較",
    selectedCount: "個已選",
    maximum: "最多 3 個",
    errorMaximum: "最多只能選擇三個專案。",
  },
  card: {
    score: "相似度分數",
    coverage: "資料完整度",
    strongest: "主要相似原因",
    differences: "重要差異",
    unknowns: "未知因素",
    quotedAvailable: "歷史報價",
    actualAvailable: "已核對實際成本",
    inspectFactors: "查看比較因素",
  },
  bands: {
    STRONG: "高度相似",
    RELEVANT: "具參考價值",
    PARTIAL: "部分相似",
    BROADER: "延伸參考",
  },
  factors: {
    SUBTYPE: "專案類型",
    SCOPE_OVERLAP: "工作範圍重疊",
    AREA_SIMILARITY: "面積相似度",
    COMMERCIAL_CATEGORY_OVERLAP: "報價分類重疊",
    MATERIAL_OVERLAP: "材料重疊",
    SUPPLIER_OVERLAP: "供應商重疊",
    COMPLETION_RECENCY: "完工時間接近度",
    LOCATION_PROXIMITY: "地點接近度",
  },
  factorState: {
    unknown: "資料未知，不視為不相符",
    contribution: "分數貢獻",
    lostContribution: "未取得分數",
  },
  table: {
    title: "結構化比較",
    description: "查看各項比較資料。歷史報價、預估成本、供應商報價與已核對實際成本會保持清楚區分。",
    activeProject: "目前專案",
    projectContext: "專案脈絡",
    economics: "整體商務比較",
    categories: "分類比較",
    evidenceState: "資料依據與完整度",
    subtype: "專案類型",
    area: "面積",
    location: "地點",
    completion: "完工時間",
    quotedRate: "報價 · 標準化",
    forecastRate: "預估直接成本 · 標準化",
    actualRate: "預估／已核對實際成本 · 標準化",
    supplierContext: "供應商報價脈絡",
    programme: "工期",
  },
  states: {
    sufficient: "資料足夠",
    insufficient: "資料不足",
    restricted: "目前角色無權查看",
    unavailable: "無法使用",
    stale: "歷史／已過期",
    conflicted: "資料紀錄不一致",
    notApplicable: "不適用",
    quotedOnly: "僅有歷史報價",
    partial: "部分商務資料",
    complete: "報價與實際成本皆可用",
    structuralOnly: "僅顯示專案結構比較",
  },
  synthesis: {
    title: "需要檢視的事項",
    history: "歷史資料顯示",
    differences: "重要差異",
    gaps: "資料缺口",
    recommendation: "建議下一步審查",
    programmeDifference: "目前工期與已選歷史專案不同，其成本影響尚未量化。",
    noEconomics: "商務資料受到權限限制或目前無法使用；專案結構比較仍可使用。",
  },
  notices: {
    staleSupplier: "供應商報價僅屬歷史資料，不得呈現為目前價格。",
    conflict: "不一致的資料會明確顯示，並排除在權威彙總之外。",
    insufficientActual: "部分分類沒有足夠的已核對實際成本資料。",
    restricted: "目前角色無權查看商務數值。",
    synthetic: "{job}的虛構示範資料，不是市場基準。",
  },
  actionComingLater: "建立內部審查事項將於 Stage 8 啟用。",
  normalizedUnit: "新台幣／m²",
  programmeUnit: "週",
  similarityMethod: "專案相似度",
  selectedProjects: "已選專案",
};

export const comparisonCopies: Readonly<Record<Locale, ComparisonCopy>> = Object.freeze({
  en,
  "zh-TW": zhTw,
});

export function getComparisonCopy(locale: Locale): ComparisonCopy {
  return comparisonCopies[locale];
}
