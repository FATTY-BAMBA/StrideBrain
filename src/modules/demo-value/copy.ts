import type { Locale } from "@/modules/localization/config";
import type { ProjectWorkspaceWarningCode } from "@/modules/projects/domain/project-workspace";

const en = {
  homeTitle: "What would you like to get done?",
  framing: "Find. Understand. Decide. Act.",
  homeDescription: "Backed by your company’s knowledge and experience.",
  continue: "Continue working",
  openProject: "Open project",
  chooseProject: "Choose a project",
  context: "Working with",
  tasks: "Start with a task",
  attention: "Needs attention",
  attentionEmpty: "Open a comparison to see how the quotation and costs relate to past work.",
  reviewContext: "Project records to keep in mind",
  planned: "Planned",
  plannedTitle: "Planned assistance",
  plannedDescription: "More help with the work around your projects.",
  plannedItems: ["Project coordination", "Quote-review preparation", "Follow-up preparation"],
  noProject: "Choose an available project to get started.",
  noAccess: "Sign in to your demo session to see your projects and their records.",
  knowledgeTitle: "Your company’s knowledge",
  knowledgeTasks: "Explore company records",
  knowledgeDescription:
    "What does your company already know? Explore past work and project records.",
  bounded: "Open a task below. Historical findings and evidence start with a comparison.",
  compare: "Compare with past work",
  compareDescription: "Find similar completed projects and understand how they differ.",
  quote: "Review a quotation",
  quoteDescription: "See the current quotation and forecast cost, then compare with past work.",
  evidence: "Find supporting evidence",
  evidenceDescription: "Compare first, then open the exact source behind a finding.",
  knowledge: "Explore company knowledge",
  knowledgeTaskDescription: "Explore project context, past work and supporting records.",
  compareFirst: "Start a comparison",
  quoteContext: "View quotation context",
  openActions: "View open actions",
  similar: "Have we done something similar before?",
  materials: "Which past projects used similar materials?",
  stone: "What supports the imported-stone variance?",
  history: "What did the selected historical projects cost?",
  current: "What is recorded in the current quotation?",
  records: "Which project records are missing or out of date?",
  recordsDescription: "Check missing, conflicting or out-of-date records before making a decision.",
  actionsDescription: "Open the project’s recorded review actions and follow-up details.",
  unusual: "What looks unusual in this quotation?",
  next: "What should I review next?",
  actions: "What actions are still open?",
  restricted: "Comparison is not available for your role.",
  strongest: "Closest past projects",
  selectedHistory: "Projects used for these findings",
  selectedHistoryHelp:
    "The closest matches above may differ from this selection. Update the comparison to apply changes.",
  seeEvidence: "See evidence",
  details: "Comparison details",
  changeSelection: "Review / change selected projects",
  match: "Match score",
  calculation: "Calculation details",
  support: "What supports this finding?",
};
type ValueCopy = { [K in keyof typeof en]: (typeof en)[K] };
const zhTw: ValueCopy = {
  homeTitle: "今天想先完成什麼？",
  framing: "找到資料。掌握狀況。做出判斷。採取行動。",
  homeDescription: "以公司的知識與過往經驗為依據。",
  continue: "繼續處理專案",
  openProject: "開啟專案",
  chooseProject: "選擇專案",
  context: "目前專案",
  tasks: "從一項工作開始",
  attention: "需要留意的事項",
  attentionEmpty: "開啟比較，了解目前報價與成本和過往專案的差異。",
  reviewContext: "留意這些專案資料",
  planned: "規劃中",
  plannedTitle: "規劃中的工作協助",
  plannedDescription: "讓專案周邊的日常工作更省心。",
  plannedItems: ["專案協調", "報價審查準備", "後續追蹤準備"],
  noProject: "選擇可開啟的專案，開始處理工作。",
  noAccess: "請登入示範工作階段，查看您的專案與相關紀錄。",
  knowledgeTitle: "公司的知識與經驗",
  knowledgeTasks: "查找公司紀錄",
  knowledgeDescription: "公司已掌握哪些資訊？查找過往專案與相關紀錄。",
  bounded: "選擇下方工作。歷史差異與佐證，從比較開始。",
  compare: "與過往專案比較",
  compareDescription: "找出類似的已完工專案，了解相似之處與差異。",
  quote: "檢視報價",
  quoteDescription: "查看目前報價與預估成本，再與過往專案比較。",
  evidence: "查找佐證資料",
  evidenceDescription: "先比較，再開啟各項發現的確切來源。",
  knowledge: "查找公司知識",
  knowledgeTaskDescription: "查看專案背景、過往經驗與相關紀錄。",
  compareFirst: "開始比較",
  quoteContext: "查看報價背景",
  openActions: "查看未完成事項",
  similar: "我們做過類似的專案嗎？",
  materials: "哪些過往專案使用過類似的材料？",
  stone: "進口石材成本差異有哪些佐證？",
  history: "選取的歷史專案花了多少成本？",
  current: "目前報價記錄了哪些內容？",
  records: "哪些專案紀錄缺漏或已過期？",
  recordsDescription: "先確認缺漏、不一致或過期的紀錄，再做決定。",
  actionsDescription: "查看專案已記錄的審查事項與後續追蹤資料。",
  unusual: "這份報價有哪些需要留意的地方？",
  next: "接下來有哪些事項需要檢視？",
  actions: "還有哪些未完成事項？",
  restricted: "目前角色無法執行比較。",
  strongest: "最接近的過往專案",
  selectedHistory: "這些發現所依據的專案",
  selectedHistoryHelp: "上方最接近的專案可能與此處選擇不同。變更選擇後，請更新比較。",
  seeEvidence: "查看佐證",
  details: "比較詳細資料",
  changeSelection: "檢視／變更比較專案",
  match: "相似度分數",
  calculation: "計算詳細資料",
  support: "這項發現有哪些佐證？",
};
export const valueCopies = { en, "zh-TW": zhTw } as const;
export function getValueCopy(locale: Locale) {
  return valueCopies[locale];
}

export function stageLabel(locale: Locale, stage: string): string {
  const labels: Record<string, [string, string]> = {
    QUOTE_REVIEW: ["Quote review", "報價審查"],
    DESIGN: ["Design", "設計中"],
    CONSTRUCTION: ["Construction", "施工中"],
    COMPLETED: ["Completed", "已完工"],
  };
  return (
    labels[stage]?.[locale === "en" ? 0 : 1] ??
    (locale === "en" ? "Project workspace" : "專案工作區")
  );
}
const warnings: Record<ProjectWorkspaceWarningCode, [string, string]> = {
  PROJECT_CONTEXT_PARTIAL: ["Some project context is missing.", "部分專案背景資料尚未齊全。"],
  PROJECT_MANAGER_UNRECORDED: ["Project lead is not recorded.", "尚未記錄專案負責人。"],
  QUOTE_UNAVAILABLE: ["Current quotation is unavailable.", "目前無法取得報價。"],
  FORECAST_UNAVAILABLE: ["Forecast direct cost is unavailable.", "目前無法取得預估直接成本。"],
  ACTUAL_UNAVAILABLE: ["Reconciled actual cost is not available yet.", "尚無已核對的實際成本。"],
  QUOTE_RESTRICTED: ["Quotation access is restricted for this role.", "目前角色無權查看報價。"],
  FORECAST_RESTRICTED: [
    "Forecast access is restricted for this role.",
    "目前角色無權查看預估成本。",
  ],
  ACTUAL_RESTRICTED: [
    "Actual-cost access is restricted for this role.",
    "目前角色無權查看實際成本。",
  ],
  EVIDENCE_RESTRICTED: [
    "Evidence access is restricted for this role.",
    "目前角色無權查看佐證資料。",
  ],
  EVIDENCE_PARTIAL: ["Supporting records are incomplete.", "佐證紀錄尚未齊全。"],
  EVIDENCE_STALE: [
    "Some records are out of date; check their validity.",
    "部分紀錄已過期，請確認有效性。",
  ],
  EVIDENCE_CONFLICT: ["Conflicting records need review.", "資料紀錄不一致，需要檢視。"],
  SUPPLIER_OFFER_STALE: [
    "Historical supplier offers are not current pricing.",
    "歷史供應商報價不代表目前價格。",
  ],
};
export function warningLabel(locale: Locale, code: ProjectWorkspaceWarningCode) {
  return warnings[code][locale === "en" ? 0 : 1];
}
