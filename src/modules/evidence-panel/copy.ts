import { getFinancialCopy } from "@/modules/localization/financial-copy";
import type { SimilarityFactorKey } from "@/modules/comparisons/domain/contracts";
import type { DataClassification, EconomicsClaimKind } from "@/modules/economics/domain/contracts";
import type { AuthorityState, ObservationType } from "@/modules/projects/domain/project-workspace";
import type { Locale } from "@/modules/localization/config";

export type EvidencePanelCopy = Readonly<{
  eyebrow: string;
  title: string;
  close: string;
  back: string;
  whereFrom: string;
  authority: string;
  observation: string;
  sourceList: string;
  calculation: string;
  supportedValue: string;
  locator: string;
  project: string;
  version: string;
  effectiveDate: string;
  classification: string;
  preview: string;
  previewUnsupported: string;
  previewUnavailable: string;
  previewRestricted: string;
  noSources: string;
  unavailable: string;
  accessChanged: string;
  restricted: string;
  staleRun: string;
  conflicts: string;
  conflictImpact: string;
  conflictStatus: string;
  sourceModeDescription: string;
  claimModeDescription: string;
  factorModeDescription: string;
  conflictModeDescription: string;
  openSource: string;
  inspectSource: string;
  inspectConflict: string;
  relatedClaims: string;
  sourceCount: string;
  structuredRecord: string;
  unknownDetail: string;
  fields: Readonly<{
    operation: string;
    aggregation: string;
    rounding: string;
    generated: string;
    result: string;
    input: string;
    score: string;
    coverage: string;
    weight: string;
    contribution: string;
    normalized: string;
    state: string;
  }>;
  authorityLabels: Readonly<Record<AuthorityState, string>>;
  observationLabels: Readonly<Record<ObservationType, string>>;
  conditionLabels: Readonly<
    Record<
      | "CURRENT"
      | "HISTORICAL"
      | "STALE"
      | "SUPERSEDED"
      | "CONFLICTED"
      | "INSUFFICIENT"
      | "RESTRICTED",
      string
    >
  >;
  factorLabels: Readonly<Record<SimilarityFactorKey, string>>;
  factorStateLabels: Readonly<Record<"KNOWN" | "UNKNOWN" | "NOT_APPLICABLE", string>>;
  subjectLabels: Readonly<Record<string, string>>;
  claimKindLabels: Readonly<Record<EconomicsClaimKind, string>>;
  classificationLabels: Readonly<Record<DataClassification, string>>;
  conflictStatusLabels: Readonly<Record<"OPEN" | "RESOLVED" | "DISMISSED", string>>;
  fieldLabels: Readonly<Record<string, string>>;
  warningLabels: Readonly<Record<string, string>>;
  sufficiencyLabels: Readonly<Record<string, string>>;
}>;

const commonSubjectEn: Readonly<Record<string, string>> = Object.freeze({
  PROJECT: "Project record",
  PROJECT_SCOPE: "Project scope",
  DOCUMENT_VERSION: "Document version",
  QUOTE_VERSION: "Quote version",
  QUOTE_ITEM: "Quote line",
  FORECAST_COST_VERSION: "Forecast cost version",
  FORECAST_COST_LINE: "Forecast cost line",
  PROJECT_COST_VERSION: "Final cost version",
  COST_LINE: "Final cost line",
  SUPPLIER_OFFER: "Supplier offer",
  SUPPLIER_OFFER_ITEM: "Supplier-offer line",
  COMPARISON_CLAIM: "Comparison claim",
  ACTION: "Action",
});

const commonSubjectZh: Readonly<Record<string, string>> = Object.freeze({
  PROJECT: "專案紀錄",
  PROJECT_SCOPE: "專案範圍",
  DOCUMENT_VERSION: "文件版本",
  QUOTE_VERSION: "報價版本",
  QUOTE_ITEM: "報價項目",
  FORECAST_COST_VERSION: "預估成本版本",
  FORECAST_COST_LINE: "預估成本項目",
  PROJECT_COST_VERSION: "最終成本版本",
  COST_LINE: "最終成本項目",
  SUPPLIER_OFFER: "供應商報價",
  SUPPLIER_OFFER_ITEM: "供應商報價項目",
  COMPARISON_CLAIM: "比較結論",
  ACTION: "行動事項",
});

const en: EvidencePanelCopy = {
  eyebrow: "EVIDENCE",
  title: "Evidence and calculation trace",
  close: "Close evidence",
  back: "Back to evidence bundle",
  whereFrom: "Where did this come from?",
  authority: "Authority",
  observation: "Observation type",
  sourceList: "Supporting sources",
  calculation: "Calculation trace",
  supportedValue: "Supported value",
  locator: "Exact locator",
  project: "Project",
  version: "Version",
  effectiveDate: "Effective / recorded date",
  classification: "Data boundary",
  preview: "Safe source preview",
  previewUnsupported:
    "Inline preview is not supported for this source. Metadata, locator, and authority remain available.",
  previewUnavailable:
    "The source cannot currently be opened. The stored verified claim remains visible.",
  previewRestricted: "Preview content is restricted under the current role.",
  noSources: "No authorized source can be shown for this selection.",
  unavailable: "This evidence selection is unavailable under the current context.",
  accessChanged:
    "Access changed after the comparison was created. Sensitive preview content was not retained.",
  restricted: "Evidence is restricted under the current role.",
  staleRun:
    "This stored comparison is stale. It remains inspectable but cannot authorize a new action.",
  conflicts: "Conflicting records",
  conflictImpact: "Calculation impact",
  conflictStatus: "Conflict status",
  sourceModeDescription: "One authorized source and the current result that relies on it.",
  claimModeDescription: "The exact sources and calculation supporting this structured claim.",
  factorModeDescription: "See why this project matches and the records that support it.",
  conflictModeDescription: "Accessible conflicting records and why neither was silently selected.",
  openSource: "View source",
  inspectSource: "View source",
  inspectConflict: "Inspect conflict",
  relatedClaims: "Used by this result",
  sourceCount: "Supporting sources: {count}",
  structuredRecord: "Structured record",
  unknownDetail: "Additional detail unavailable",
  fields: {
    operation: "Operation",
    aggregation: "Aggregation",
    rounding: "Rounding",
    generated: "Generated",
    result: "Result",
    input: "Input",
    score: "Total match score",
    coverage: "Evidence coverage",
    weight: "Weight",
    contribution: "Contribution",
    normalized: "Normalized value",
    state: "Factor state",
  },
  authorityLabels: getFinancialCopy("en").authorities,
  observationLabels: getFinancialCopy("en").observations,
  conditionLabels: {
    CURRENT: "Current",
    HISTORICAL: "Historical",
    STALE: "Stale / historical only",
    SUPERSEDED: "Superseded",
    CONFLICTED: "Conflicted",
    INSUFFICIENT: "Insufficient evidence",
    RESTRICTED: "Restricted",
  },
  factorLabels: {
    SUBTYPE: "Project subtype",
    SCOPE_OVERLAP: "Scope overlap",
    AREA_SIMILARITY: "Area similarity",
    COMMERCIAL_CATEGORY_OVERLAP: "Commercial-category overlap",
    MATERIAL_OVERLAP: "Material overlap",
    SUPPLIER_OVERLAP: "Supplier overlap",
    COMPLETION_RECENCY: "Completion recency",
    LOCATION_PROXIMITY: "Location proximity",
  },
  factorStateLabels: {
    KNOWN: "Known",
    UNKNOWN: "Unknown—not a mismatch",
    NOT_APPLICABLE: "Not applicable",
  },
  subjectLabels: commonSubjectEn,
  claimKindLabels: {
    OVERALL_QUOTED_VARIANCE: "Overall quoted-price comparison",
    OVERALL_FORECAST_ACTUAL_VARIANCE: "Forecast versus reconciled actual history",
    CATEGORY_QUOTED_VARIANCE: "Category quoted-price comparison",
    CATEGORY_FORECAST_ACTUAL_VARIANCE: "Category forecast versus actual history",
    CATEGORY_ACTUAL_INSUFFICIENT: "Insufficient category actual-cost evidence",
    PROGRAMME_DIFFERENCE_UNQUANTIFIED: "Programme difference—unquantified",
    STALE_SUPPLIER_EVIDENCE: "Stale supplier evidence",
  },
  classificationLabels: {
    DEMO_SYNTHETIC: "Synthetic demo data",
    PUBLIC_REFERENCE: "Public reference",
    TENANT_PRIVATE: "Company private",
    TENANT_RESTRICTED: "Company restricted",
    TENANT_APPROVED: "Company approved",
  },
  conflictStatusLabels: {
    OPEN: "Open",
    RESOLVED: "Resolved",
    DISMISSED: "Dismissed",
  },
  fieldLabels: {
    equivalentAmountForActiveProject: "Equivalent amount for current project",
    quantifiedPremiumState: "Quantified premium",
    quoteAmountBeforeTax: "Quoted amount before tax",
    areaValue: "Area",
    quoteItem: "Quote line",
    normalizedUnit: "Normalized unit",
    observationType: "Observation type",
    authorityState: "Authority",
    line: "Line number",
    descriptionEn: "Description",
    descriptionZhTw: "Description",
    unitPrice: "Unit price",
    currentNormalizedAmount: "Current normalized amount",
    state: "State",
    code: "Calculation explanation",
    kind: "Record type",
    version: "Version",
    activeArea: "Current project area",
    candidateArea: "Historical project area",
    validUntil: "Valid until",
    effectiveAt: "Effective date",
    mimeType: "File type",
    subtype: "Project type",
    area: "Area",
    areaUnit: "Area unit",
    programmeWeeks: "Programme in weeks",
    page: "Page",
    section: "Section",
    sheet: "Sheet",
    rows: "Rows",
    cells: "Cells",
    lineNumber: "Line number",
    categoryId: "Category",
    field: "Field",
    amount: "Amount",
    totalAmount: "Total amount",
    quantity: "Quantity",
    unit: "Unit",
    unitRate: "Unit rate",
    currency: "Currency",
    status: "Status",
    category: "Category",
    businessKey: "Business key",
    projectKey: "Project key",
    versionNumber: "Version",
    variancePercent: "Variance",
    currentAmount: "Current amount",
    baselineEquivalentAmount: "Historical equivalent baseline",
    baselineMedianNormalizedAmount: "Historical normalized median",
    normalizedValue: "Normalized value",
    medianNormalizedAmount: "Normalized median",
    minimumNormalizedAmount: "Normalized minimum",
    maximumNormalizedAmount: "Normalized maximum",
    eligibleObservationCount: "Eligible observations",
    requiredObservationCount: "Required observations",
    direction: "Direction",
    activeProgrammeWeeks: "Current programme",
    historicalMinimumWeeks: "Historical minimum programme",
    historicalMaximumWeeks: "Historical maximum programme",
  },
  warningLabels: {
    STALE_SUPPLIER_EVIDENCE: "Historical supplier offer—not current pricing.",
    INSUFFICIENT_ACTUAL_COST_EVIDENCE: "Actual-cost evidence is below the required threshold.",
    CONFLICTED_EVIDENCE: "Conflicting evidence was excluded from the authoritative calculation.",
  },
  sufficiencyLabels: {
    INSUFFICIENT_ACTUAL_COST_EVIDENCE: "Insufficient actual-cost evidence",
  },
};

const zhTw: EvidencePanelCopy = {
  eyebrow: "資料依據",
  title: "資料依據與計算過程",
  close: "關閉資料依據",
  back: "返回資料依據組合",
  whereFrom: "這個結果從哪裡來？",
  authority: "資料權威性",
  observation: "資料類型",
  sourceList: "支持資料來源",
  calculation: "計算過程",
  supportedValue: "支持的數值",
  locator: "精確位置",
  project: "專案",
  version: "版本",
  effectiveDate: "生效／紀錄日期",
  classification: "資料邊界",
  preview: "安全來源預覽",
  previewUnsupported: "此來源不支援內嵌預覽，但仍可查看中繼資料、位置與權威性。",
  previewUnavailable: "目前無法開啟來源；已儲存且經驗證的結論仍會保留。",
  previewRestricted: "目前角色無權查看預覽內容。",
  noSources: "此選擇沒有可顯示的已授權來源。",
  unavailable: "目前授權脈絡無法使用此資料依據選擇。",
  accessChanged: "比較建立後存取權限已變更；系統未保留敏感預覽內容。",
  restricted: "目前角色無權查看此資料依據。",
  staleRun: "此比較結果已過期，但仍可檢視；不得用於建立新的行動事項。",
  conflicts: "不一致的紀錄",
  conflictImpact: "對計算的影響",
  conflictStatus: "不一致狀態",
  sourceModeDescription: "顯示一筆已授權來源，以及目前哪些結果使用了它。",
  claimModeDescription: "顯示支持此結構化結論的精確來源與計算過程。",
  factorModeDescription: "了解這個專案相似在哪裡，以及支持判斷的資料。",
  conflictModeDescription: "顯示可存取的不一致紀錄，以及系統為何沒有自行選擇其中一筆。",
  openSource: "開啟來源物件",
  inspectSource: "查看來源",
  inspectConflict: "查看不一致紀錄",
  relatedClaims: "目前結果中的用途",
  sourceCount: "{count} 筆資料來源",
  structuredRecord: "結構化紀錄",
  unknownDetail: "尚無補充說明",
  fields: {
    operation: "計算方式",
    aggregation: "彙總方式",
    rounding: "四捨五入",
    generated: "產生時間",
    result: "計算結果",
    input: "輸入資料",
    score: "相似度總分",
    coverage: "資料完整度",
    weight: "權重",
    contribution: "分數貢獻",
    normalized: "標準化數值",
    state: "因素狀態",
  },
  authorityLabels: getFinancialCopy("zh-TW").authorities,
  observationLabels: getFinancialCopy("zh-TW").observations,
  conditionLabels: {
    CURRENT: "目前有效",
    HISTORICAL: "歷史紀錄",
    STALE: "已過期／僅供歷史參考",
    SUPERSEDED: "已由新版取代",
    CONFLICTED: "資料不一致",
    INSUFFICIENT: "資料不足",
    RESTRICTED: "無權查看",
  },
  factorLabels: {
    SUBTYPE: "專案類型",
    SCOPE_OVERLAP: "工作範圍重疊",
    AREA_SIMILARITY: "面積相似度",
    COMMERCIAL_CATEGORY_OVERLAP: "報價分類重疊",
    MATERIAL_OVERLAP: "材料重疊",
    SUPPLIER_OVERLAP: "供應商重疊",
    COMPLETION_RECENCY: "完工時間接近度",
    LOCATION_PROXIMITY: "地點接近度",
  },
  factorStateLabels: {
    KNOWN: "已知",
    UNKNOWN: "資料未知，不視為不相符",
    NOT_APPLICABLE: "不適用",
  },
  subjectLabels: commonSubjectZh,
  claimKindLabels: {
    OVERALL_QUOTED_VARIANCE: "整體歷史報價比較",
    OVERALL_FORECAST_ACTUAL_VARIANCE: "預估成本與已核對實際成本比較",
    CATEGORY_QUOTED_VARIANCE: "分類歷史報價比較",
    CATEGORY_FORECAST_ACTUAL_VARIANCE: "分類預估與實際成本比較",
    CATEGORY_ACTUAL_INSUFFICIENT: "分類實際成本資料不足",
    PROGRAMME_DIFFERENCE_UNQUANTIFIED: "工期差異（未量化）",
    STALE_SUPPLIER_EVIDENCE: "已過期的供應商資料",
  },
  classificationLabels: {
    DEMO_SYNTHETIC: "虛構示範資料",
    PUBLIC_REFERENCE: "公開參考資料",
    TENANT_PRIVATE: "公司內部資料",
    TENANT_RESTRICTED: "公司限制資料",
    TENANT_APPROVED: "公司已核准資料",
  },
  conflictStatusLabels: {
    OPEN: "尚未解決",
    RESOLVED: "已解決",
    DISMISSED: "已排除影響",
  },
  fieldLabels: {
    equivalentAmountForActiveProject: "目前專案的歷史基準等值金額",
    quantifiedPremiumState: "加價量化狀態",
    quoteAmountBeforeTax: "未稅報價",
    areaValue: "面積",
    quoteItem: "報價項目",
    normalizedUnit: "標準化單位",
    observationType: "資料類型",
    authorityState: "資料權威性",
    line: "項目編號",
    descriptionEn: "內容說明",
    descriptionZhTw: "內容說明",
    unitPrice: "單價",
    currentNormalizedAmount: "目前標準化金額",
    state: "狀態",
    code: "計算說明",
    kind: "紀錄類型",
    version: "版本",
    activeArea: "目前專案面積",
    candidateArea: "歷史專案面積",
    validUntil: "有效期限",
    effectiveAt: "生效日期",
    mimeType: "檔案類型",
    subtype: "專案類型",
    area: "面積",
    areaUnit: "面積單位",
    programmeWeeks: "工期（週）",
    page: "頁碼",
    section: "章節",
    sheet: "工作表",
    rows: "列",
    cells: "儲存格",
    lineNumber: "項目編號",
    categoryId: "分類",
    field: "欄位",
    amount: "金額",
    totalAmount: "總金額",
    quantity: "數量",
    unit: "單位",
    unitRate: "單價",
    currency: "幣別",
    status: "狀態",
    category: "分類",
    businessKey: "業務識別碼",
    projectKey: "專案識別碼",
    versionNumber: "版本",
    variancePercent: "差異百分比",
    currentAmount: "目前金額",
    baselineEquivalentAmount: "歷史基準等值",
    baselineMedianNormalizedAmount: "歷史標準化中位數",
    normalizedValue: "標準化數值",
    medianNormalizedAmount: "標準化中位數",
    minimumNormalizedAmount: "標準化最低值",
    maximumNormalizedAmount: "標準化最高值",
    eligibleObservationCount: "可用觀測數",
    requiredObservationCount: "最低需求筆數",
    direction: "方向",
    activeProgrammeWeeks: "目前工期",
    historicalMinimumWeeks: "歷史最短工期",
    historicalMaximumWeeks: "歷史最長工期",
  },
  warningLabels: {
    STALE_SUPPLIER_EVIDENCE: "歷史供應商報價，非目前有效價格。",
    INSUFFICIENT_ACTUAL_COST_EVIDENCE: "實際成本資料低於最低門檻。",
    CONFLICTED_EVIDENCE: "不一致的資料已排除，不會進入權威計算。",
  },
  sufficiencyLabels: {
    INSUFFICIENT_ACTUAL_COST_EVIDENCE: "實際成本資料不足",
  },
};

export function getEvidencePanelCopy(locale: Locale): EvidencePanelCopy {
  return locale === "zh-TW" ? zhTw : en;
}
