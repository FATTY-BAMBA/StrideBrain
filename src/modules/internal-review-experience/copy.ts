import type { Locale } from "@/modules/localization/config";

const en = {
  entry: "Create internal review action",
  entryDescription:
    "Review the verified findings, choose the wording and assignee, then explicitly create an internal review action.",
  preparing: "Preparing the review…",
  opening: "Opening review…",
  reviewTitle: "Review internal review action",
  reviewDescription: "Review the evidence and uncertainty before creating this action.",
  title: "Title",
  rationale: "Review purpose",
  boundedEditHint:
    "Choose review wording. Verified findings and uncertainty statements remain attached and cannot be changed here.",
  findings: "Verified findings · retained with the action",
  uncertainty: "Uncertainty and limits · retained with the action",
  evidence: "Inspect supporting evidence",
  assignee: "Assignee",
  assigneeLocked: "The suggested assignee is fixed for your current access.",
  unassigned: "Unassigned",
  dueDate: "Due date",
  dateHint: "Optional. Enter a date from {min} through {max}, or leave it blank.",
  datePolicyRefreshing: "Checking the current allowed date range…",
  datePolicyUnavailable:
    "The current allowed date range could not be checked. Your draft is saved. Try again before confirming.",
  datePolicyRetry: "Check allowed dates again",
  clearDate: "Clear due date",
  expires: "Review available until",
  auditDetails: "Audit details",
  comparison: "Source comparison",
  economics: "Source economics review",
  consequence:
    "Confirmation creates a persistent internal action and an audit record. This screen cannot undo creation. It does not approve a quotation or send a message.",
  acknowledgement:
    "I have reviewed the evidence and limits and want to create this internal review action.",
  confirming: "Creating internal review action…",
  cancel: "Cancel review",
  close: "Close",
  retry: "Try again",
  refresh: "Refresh comparison",
  returnToComparison: "Return to source comparison",
  openActions: "View project actions",
  receiptTitle: "Internal review action created",
  receiptDescription: "This receipt records the action saved to the project.",
  receiptUnavailableTitle: "Receipt unavailable",
  receiptUnavailableDescription:
    "This receipt cannot be displayed. Return to a project you can access to view available actions.",
  confirmationErrorTitle: "Review could not be confirmed",
  replayTitle: "This internal review action was already created",
  replayDescription: "The same saved receipt is shown. No additional action was created.",
  actionKey: "Action reference",
  project: "Project",
  status: "Status",
  open: "Open",
  createdAt: "Created",
  createdBy: "Created by",
  evidenceCount: "Authorized evidence references",
  noDueDate: "No due date",
  actionsTitle: "Actions",
  actionsDescription:
    "Open a saved receipt to inspect its details and return to the source comparison.",
  actionsEmpty: "No internal review actions are currently available here.",
  openReceipt: "Open receipt",
  overviewActions: "Open internal review actions",
  reference: "Reference",
  english: "English",
  chinese: "繁體中文",
  validationTitle: "Check the highlighted fields",
  states: {
    NO_QUOTE_VERSION: "A quote version is needed before creating a review for this job.",
    NOTHING_TO_REVIEW:
      "There are no out-of-range category findings, actual-cost evidence gaps or programme differences to review.",
    PROPOSAL_UNAVAILABLE:
      "This review is unavailable. Open an authorized comparison with the required evidence and try again.",
    PROPOSAL_EXPIRED: "This review has expired. Return to the comparison and prepare a new review.",
    PROPOSAL_STALE:
      "The comparison or its evidence has changed. Refresh the comparison before preparing a new review.",
    PROPOSAL_NOT_AUTHORIZED: "This review is unavailable with your current access.",
    PROPOSAL_FAILED: "The review could not be prepared. Try again from the comparison.",
    ACTION_NOT_AUTHORIZED: "This action is unavailable with your current access.",
    ACCESS_CHANGED:
      "Your access has changed. Return to a comparison you can access before continuing.",
    ASSIGNEE_UNAVAILABLE:
      "The assignee is no longer available for this review. Reopen the review to check the current assignment.",
    EVIDENCE_UNAVAILABLE:
      "Required evidence is no longer available. Return to the comparison to review access and sources.",
    STALE_COMPARISON:
      "The comparison or its evidence has changed. Nothing was created. Refresh the comparison and review it again.",
    PROPOSAL_ALREADY_CONSUMED:
      "This review has already been used. Open the saved action from the project actions list.",
    IDEMPOTENCY_CONFLICT:
      "This confirmation does not match the saved request. Reopen the review or its saved receipt before continuing.",
    ACTION_CREATE_FAILED:
      "The action could not be confirmed. Retry the same confirmation to safely recover its saved receipt if it was created.",
    VALIDATION_FAILED: "Check the highlighted fields before confirming.",
  },
  validation: {
    INVALID_TITLE: "Choose one of the available review titles.",
    INVALID_RATIONALE: "Choose one of the available review purposes.",
    INVALID_DUE_DATE: "Enter a valid date within the displayed range, or leave it blank.",
    CONFIRMATION_REQUIRED:
      "Confirm that you have reviewed the evidence and want to create the action.",
    INVALID_REQUEST: "Reopen the review and check the entered information.",
  },
} as const;

type CopyShape<T> = { readonly [K in keyof T]: T[K] extends string ? string : CopyShape<T[K]> };

const zhTw: CopyShape<typeof en> = {
  entry: "建立內部審查事項",
  entryDescription: "檢視已查證的內容、選擇用語與承辦人，再明確確認建立內部審查事項。",
  preparing: "正在準備審查內容…",
  opening: "正在開啟審查…",
  reviewTitle: "檢視內部審查事項",
  reviewDescription: "建立事項前，請先檢視資料依據與不確定性。",
  title: "標題",
  rationale: "審查目的",
  boundedEditHint: "可選擇審查用語。已查證的內容與不確定性說明會一併保留，無法在此變更。",
  findings: "已查證內容・隨事項保留",
  uncertainty: "不確定性與限制・隨事項保留",
  evidence: "檢視支持此內容的資料依據",
  assignee: "承辦人",
  assigneeLocked: "依您目前的權限，承辦人固定為建議人選。",
  unassigned: "未指派",
  dueDate: "到期日",
  dateHint: "非必填。請輸入 {min} 至 {max} 之間的日期，或保留空白。",
  datePolicyRefreshing: "正在確認目前可選的日期範圍…",
  datePolicyUnavailable: "目前無法確認可選的日期範圍。草稿已保留，請重試後再確認建立。",
  datePolicyRetry: "重新確認日期範圍",
  clearDate: "清除到期日",
  expires: "本次審查有效至",
  auditDetails: "稽核詳細資料",
  comparison: "來源比較紀錄",
  economics: "來源商務分析紀錄",
  consequence:
    "確認後將建立持續保存的內部事項及稽核紀錄；無法在此畫面撤銷建立。此操作不會核准報價，也不會傳送訊息。",
  acknowledgement: "我已檢視資料依據與限制，並確認建立此內部審查事項。",
  confirming: "正在建立內部審查事項…",
  cancel: "取消審查",
  close: "關閉",
  retry: "重試",
  refresh: "重新比較",
  returnToComparison: "返回來源比較",
  openActions: "查看專案事項",
  receiptTitle: "已建立內部審查事項",
  receiptDescription: "此回執記錄已儲存至專案的事項。",
  receiptUnavailableTitle: "目前無法查看回執",
  receiptUnavailableDescription: "目前無法顯示這份回執。請返回您有權存取的專案，查看可用的事項。",
  confirmationErrorTitle: "未能完成審查確認",
  replayTitle: "此內部審查事項已建立",
  replayDescription: "目前顯示同一份已儲存回執，未重複建立事項。",
  actionKey: "事項編號",
  project: "專案",
  status: "狀態",
  open: "待處理",
  createdAt: "建立時間",
  createdBy: "建立人",
  evidenceCount: "可存取的佐證資料筆數",
  noDueDate: "未設定到期日",
  actionsTitle: "行動事項",
  actionsDescription: "開啟已儲存回執以檢視詳情，或返回來源比較。",
  actionsEmpty: "目前沒有可查看的內部審查事項。",
  openReceipt: "開啟回執",
  overviewActions: "待處理內部審查事項",
  reference: "參考編號",
  english: "English",
  chinese: "繁體中文",
  validationTitle: "請檢查標示的欄位",
  states: {
    NO_QUOTE_VERSION: "此專案需要報價版本才能建立審查。",
    NOTHING_TO_REVIEW: "目前沒有超出範圍的類別、實際成本資料缺口或工期差異需要審查。",
    PROPOSAL_UNAVAILABLE: "目前無法提供此審查。請開啟您有權存取且具備必要佐證資料的比較後重試。",
    PROPOSAL_EXPIRED: "本次審查已逾期。請返回比較並重新準備審查內容。",
    PROPOSAL_STALE: "比較或相關佐證資料已變更。請重新比較，再準備新的審查。",
    PROPOSAL_NOT_AUTHORIZED: "依您目前的權限，無法查看此審查。",
    PROPOSAL_FAILED: "未能準備審查內容。請從比較畫面重試。",
    ACTION_NOT_AUTHORIZED: "依您目前的權限，無法查看或建立此事項。",
    ACCESS_CHANGED: "您的存取權限已變更。請返回您有權存取的比較，再繼續操作。",
    ASSIGNEE_UNAVAILABLE: "此承辦人目前無法承辦本次審查。請重新開啟審查，確認目前可用的人選。",
    EVIDENCE_UNAVAILABLE: "必要佐證資料目前無法存取。請返回比較，確認存取權限與資料來源。",
    STALE_COMPARISON: "比較或相關佐證資料已變更，未建立事項。請重新比較並再次檢視。",
    PROPOSAL_ALREADY_CONSUMED: "此審查已用於建立事項。請從專案事項清單開啟已儲存的回執。",
    IDEMPOTENCY_CONFLICT: "本次確認內容與已儲存的請求不符。請重新開啟審查或其回執後再繼續。",
    ACTION_CREATE_FAILED:
      "未能確認事項的建立結果。可重試相同的確認內容；若事項已建立，將安全地取回同一份回執。",
    VALIDATION_FAILED: "請先檢查標示的欄位，再確認建立。",
  },
  validation: {
    INVALID_TITLE: "請選擇其中一個可用的審查標題。",
    INVALID_RATIONALE: "請選擇其中一個可用的審查目的。",
    INVALID_DUE_DATE: "請輸入顯示範圍內的有效日期，或保留空白。",
    CONFIRMATION_REQUIRED: "請確認您已檢視資料依據，並要建立此事項。",
    INVALID_REQUEST: "請重新開啟審查並檢查輸入內容。",
  },
};

export type InternalReviewCopy = CopyShape<typeof en>;
export const internalReviewCopy = Object.freeze({ en, "zh-TW": zhTw });
export function getInternalReviewCopy(locale: Locale): InternalReviewCopy {
  return internalReviewCopy[locale];
}

export function reviewStateMessage(copy: InternalReviewCopy, kind: string): string {
  return kind in copy.states
    ? copy.states[kind as keyof typeof copy.states]
    : copy.states.ACTION_CREATE_FAILED;
}

export function reviewValidationMessage(copy: InternalReviewCopy, code: string): string {
  return code in copy.validation
    ? copy.validation[code as keyof typeof copy.validation]
    : copy.validation.INVALID_REQUEST;
}
