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
    importedStoneQuoted: string;
    importedStoneActual: string;
    lightingQuoted: string;
    lightingActual: string;
    millworkQuoted: string;
    millworkActual: string;
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
    quoteAbove: string;
    actualAbove: string;
    stoneReview: string;
    lightingGap: string;
    programmeDifference: string;
    nextReview: string;
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
  selectedProjects: string;
}>;

const en: ComparisonCopy = {
  eyebrow: "COMPARABLE PROJECT INTELLIGENCE",
  titlePrefix: "Historical precedents for",
  description:
    "StrideBrain ranks authorized historical projects with deterministic factors, keeps commercial authority distinct, and shows where evidence is incomplete.",
  heroQuestion: "Have we done something like this before?",
  heroPrompt:
    "Search the authorized project history, explain the strongest matches, and compare the current quotation with trustworthy precedents.",
  runComparison: "Find comparable projects",
  rerunComparison: "Run a fresh comparison",
  sessionRequiredTitle: "A controlled demo session is required.",
  sessionRequiredDescription:
    "This workspace only opens after the server validates a signed synthetic-demo session. Browser parameters cannot select an organization or role.",
  unavailableTitle: "This comparison is unavailable.",
  unavailableDescription:
    "The project or stored run is not available under the current authorization context.",
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
      "Select up to three projects. Updating the set creates a new immutable economics enrichment without changing the structural ranking.",
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
    actualAvailable: "Reconciled actual",
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
      "Values come from the stored deterministic run. Quoted price, forecast, supplier offer, and reconciled actual cost remain separate.",
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
    forecastRate: "Current forecast · normalized",
    actualRate: "Reconciled actual · normalized",
    importedStoneQuoted: "Imported stone · quoted",
    importedStoneActual: "Imported stone · actual",
    lightingQuoted: "Lighting/electrical · quoted",
    lightingActual: "Lighting/electrical · actual",
    millworkQuoted: "Custom millwork · quoted",
    millworkActual: "Custom millwork · actual",
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
    title: "Structured review",
    history: "What history suggests",
    differences: "Important differences",
    gaps: "Evidence gaps",
    recommendation: "Recommended next review",
    quoteAbove: "The current quotation is above the selected quoted-price history.",
    actualAbove:
      "The current forecast direct cost is above the eligible reconciled-actual history.",
    stoneReview:
      "Imported stone is the strongest evidence-backed variance and deserves focused review.",
    lightingGap:
      "Lighting is above quoted history, but actual-cost evidence is below the required threshold.",
    programmeDifference:
      "The current programme is shorter than the selected history, but no supported percentage premium is available.",
    nextReview:
      "Validate imported-stone and lighting assumptions internally before quote approval.",
    noEconomics:
      "Commercial evidence is restricted or unavailable; the structural comparison remains usable.",
  },
  notices: {
    staleSupplier: "Supplier offers are historical and must not be presented as current pricing.",
    conflict: "Conflicting evidence is visible and excluded from authoritative aggregates.",
    insufficientActual: "Some categories do not have enough reconciled actual-cost evidence.",
    restricted: "Commercial values are restricted under the current role.",
    synthetic: "Synthetic Horizon Atelier demo data—not a market benchmark.",
  },
  actionComingLater: "Internal review action becomes available in Stage 8.",
  normalizedUnit: "TWD/m²",
  selectedProjects: "Selected projects",
};

const zhTw: ComparisonCopy = {
  eyebrow: "類似專案智慧",
  titlePrefix: "歷史專案比較：",
  description:
    "StrideBrain 以可解釋的固定規則排序已授權的歷史專案，清楚區分商務資料權威性，也會誠實呈現資料不足之處。",
  heroQuestion: "我們以前做過類似的案子嗎？",
  heroPrompt: "搜尋已授權的歷史專案、說明最接近的原因，並用可信任的歷史依據比較目前報價。",
  runComparison: "尋找類似歷史專案",
  rerunComparison: "重新執行比較",
  sessionRequiredTitle: "需要受控的示範工作階段。",
  sessionRequiredDescription:
    "伺服器驗證已簽署的虛構示範工作階段後，才會開啟此工作區。網址參數不能選擇組織或角色。",
  unavailableTitle: "目前無法開啟此比較。",
  unavailableDescription: "目前的授權脈絡無法存取此專案或已儲存的比較結果。",
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
    description:
      "最多選擇三個專案。更新選擇會建立新的不可變更商務分析，但不會改變原本的相似度排序。",
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
    description:
      "所有數值都來自已儲存的固定規則結果。歷史報價、預估成本、供應商報價與已核對實際成本會保持清楚區分。",
    activeProject: "目前專案",
    projectContext: "專案脈絡",
    economics: "整體商務比較",
    categories: "分類比較",
    evidenceState: "資料依據與完整度",
    subtype: "專案類型",
    area: "面積",
    location: "地點",
    completion: "完工時間",
    quotedRate: "歷史報價 · 標準化",
    forecastRate: "目前預估 · 標準化",
    actualRate: "已核對實際成本 · 標準化",
    importedStoneQuoted: "進口石材 · 報價",
    importedStoneActual: "進口石材 · 實際成本",
    lightingQuoted: "燈具／電氣 · 報價",
    lightingActual: "燈具／電氣 · 實際成本",
    millworkQuoted: "訂製木作 · 報價",
    millworkActual: "訂製木作 · 實際成本",
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
    title: "結構化審查",
    history: "歷史資料顯示",
    differences: "重要差異",
    gaps: "資料缺口",
    recommendation: "建議下一步審查",
    quoteAbove: "目前報價高於已選歷史專案的報價基準。",
    actualAbove: "目前預估直接成本高於符合條件的已核對實際成本基準。",
    stoneReview: "進口石材是資料支持最完整的主要差異，值得優先審查。",
    lightingGap: "燈具報價高於歷史報價，但已核對實際成本的資料量不足。",
    programmeDifference: "目前工期比已選歷史專案短，但沒有足夠資料量化成本溢價。",
    nextReview: "在內部核准報價前，先確認進口石材額度與燈具假設。",
    noEconomics: "商務資料受到權限限制或目前無法使用；專案結構比較仍可使用。",
  },
  notices: {
    staleSupplier: "供應商報價僅屬歷史資料，不得呈現為目前價格。",
    conflict: "不一致的資料會明確顯示，並排除在權威彙總之外。",
    insufficientActual: "部分分類沒有足夠的已核對實際成本資料。",
    restricted: "目前角色無權查看商務數值。",
    synthetic: "禾序空間設計虛構示範資料，不是市場基準。",
  },
  actionComingLater: "建立內部審查事項將於 Stage 8 啟用。",
  normalizedUnit: "新台幣／m²",
  selectedProjects: "已選專案",
};

export const comparisonCopies: Readonly<Record<Locale, ComparisonCopy>> = Object.freeze({
  en,
  "zh-TW": zhTw,
});

export function getComparisonCopy(locale: Locale): ComparisonCopy {
  return comparisonCopies[locale];
}
