import type { FirmWorkCategory } from "@/modules/firm-lists/domain/contracts";
import { firmEntryLabel } from "@/modules/firm-lists/domain/contracts";
import type { Locale } from "./config";
import type { ProjectStage } from "@/modules/projects/domain/job-input";

const stages: Record<ProjectStage, readonly [string, string]> = {
  DISCOVERY: ["Discovery", "需求探索"],
  DESIGN: ["Design", "設計"],
  QUOTE_REVIEW: ["Quote review", "報價審查"],
  APPROVED: ["Approved", "已核准"],
  PROCUREMENT: ["Procurement", "採購"],
  CONSTRUCTION: ["Construction", "施工"],
  HANDOVER: ["Handover", "交付"],
  COMPLETE: ["Complete", "完成"],
};
export function categoryLabel(
  locale: Locale,
  key: string,
  categories: readonly FirmWorkCategory[],
): string {
  return firmEntryLabel(categories, key, locale);
}
export function projectStageLabel(locale: Locale, stage: ProjectStage): string {
  return stages[stage][locale === "zh-TW" ? 1 : 0];
}

const en = {
  newJob: "Create a job",
  description:
    "Start with the job details and scope. The new job will appear in Quote review, ready to compare with past work.",
  businessKey: "Job reference",
  name: "Job name",
  comparisonClass: "Job class",
  subtype: "Job type",
  areaQuantity: "Area (m²)",
  areaUnit: "Area unit",
  currency: "Currency",
  locationCity: "City",
  locationDistrict: "District (optional)",
  scopeCategoryIds: "Scope categories",
  commercialCategoryIds: "Commercial categories",
  clientMode: "Client",
  clientBusinessKey: "Client reference",
  clientName: "New client name",
  clientType: "Client type",
  existing: "Choose an existing client",
  existingClient: "Existing client",
  clientsUnavailable: "Client choices could not be loaded. Refresh the page to try again.",
  new: "Create a new client",
  RETAIL: "Retail",
  CORPORATE: "Corporate",
  HOSPITALITY: "Hospitality",
  commercialClass: "Commercial interior fit-out",
  squareMetres: "Square metres (m²)",
  taiwanDollar: "New Taiwan dollar (TWD)",
  select: "Choose an option",
  submit: "Create job",
  pending: "Saving…",
  cancel: "Back to jobs",
  required: "This field is required.",
  invalid: "Enter a valid value or choose a listed option.",
  tooLong: "This value is too long.",
  duplicate: "This reference is already in use. Choose another reference.",
  clientUnavailable: "No available client matches this reference.",
  validation: "Check the highlighted fields.",
  unavailable: "Job changes are unavailable for this session.",
  failed: "The job could not be saved. Try again.",
  idempotencyKey: "Submission reference",
  stage: "Stage",
  updateStage: "Save stage",
  updated: "Stage saved.",
  conflict:
    "This job changed or the request was already used. Refresh the page before trying again.",
  emptyStage: "No jobs in this stage.",
  groupDescription: "Your authorized jobs, grouped by their current stage.",
  stageHelp: "Changing the stage tracks progress. Complete the job through the close-job flow.",
  nameHelp: "Names are saved as entered and shown in both languages.",
  keyHelp:
    "The job reference is generated for you and can be edited. Use letters, numbers, hyphens or underscores.",
  clientKeyHelp: "A client reference is generated for you. You can edit it.",
} as const;
const zh: Record<keyof typeof en, string> = {
  newJob: "建立專案",
  description: "填寫專案資料與範疇。新專案將顯示於「報價審查」，可立即與過往專案比較。",
  businessKey: "專案編號",
  name: "專案名稱",
  comparisonClass: "專案類別",
  subtype: "專案類型",
  areaQuantity: "面積（m²）",
  areaUnit: "面積單位",
  currency: "幣別",
  locationCity: "城市",
  locationDistrict: "行政區（選填）",
  scopeCategoryIds: "工程範疇類別",
  commercialCategoryIds: "商務項目類別",
  clientMode: "客戶",
  clientBusinessKey: "客戶編號",
  clientName: "新客戶名稱",
  clientType: "客戶類型",
  existing: "選擇既有客戶",
  existingClient: "既有客戶",
  clientsUnavailable: "無法載入客戶清單，請重新整理後再試。",
  new: "建立新客戶",
  RETAIL: "零售",
  CORPORATE: "企業",
  HOSPITALITY: "旅宿",
  commercialClass: "商業室內裝修",
  squareMetres: "平方公尺（m²）",
  taiwanDollar: "新臺幣（TWD）",
  select: "請選擇",
  submit: "建立專案",
  pending: "儲存中…",
  cancel: "返回專案",
  required: "此欄位為必填。",
  invalid: "請輸入有效值或選擇清單中的選項。",
  tooLong: "輸入內容過長。",
  duplicate: "此編號已使用，請選擇其他編號。",
  clientUnavailable: "找不到此編號對應的可用客戶。",
  validation: "請檢查標示的欄位。",
  unavailable: "目前工作階段無法變更專案。",
  failed: "無法儲存專案，請重試。",
  idempotencyKey: "提交編號",
  stage: "階段",
  updateStage: "儲存階段",
  updated: "已儲存階段。",
  conflict: "此專案已變更或請求已使用，請重新整理後再試。",
  emptyStage: "此階段尚無專案。",
  groupDescription: "依目前階段瀏覽您有權限查看的專案。",
  stageHelp: "變更階段用於追蹤進度。請透過結案流程完成專案。",
  nameHelp: "名稱依輸入內容儲存，兩種語言皆顯示相同名稱。",
  keyHelp: "已自動產生專案編號，可自行編輯。請使用英文字母、數字、連字號或底線。",
  clientKeyHelp: "已自動產生客戶編號，可自行編輯。",
};
export function jobsCopy(locale: Locale): Record<keyof typeof en, string> {
  return locale === "zh-TW" ? zh : en;
}

/** Category recognition only narrows an already-supported chat intent. */
export function mentionedCategory(
  query: string,
  categories: readonly FirmWorkCategory[],
): string | undefined {
  const normalized = query.toLocaleLowerCase();
  const matches = categories.flatMap((category) =>
    [category.nameEn, category.nameZhTw, ...category.aliases].flatMap((alias) => {
      const text = alias.toLocaleLowerCase();
      const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matched = /[a-z]/i.test(text)
        ? new RegExp(`\\b${escaped}\\b`, "i").test(normalized)
        : normalized.includes(text);
      return matched ? [{ id: category.key, length: text.length }] : [];
    }),
  );
  // Prefer a full category name over a shorter overlapping alias.
  return matches.sort((left, right) => right.length - left.length)[0]?.id;
}
