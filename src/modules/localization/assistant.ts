import { priceListCopy } from "./price-list";
import { quoteDocumentCopy } from "./quote-document";
import { quoteDraftCopy } from "./quote-draft";
import { quoteIssueCopy } from "./quote-issue";
import { homeDeskCopy } from "./home-desk";
import type { Locale } from "./config";
const en = {
  title: "AI preferences",
  enabled: "Use AI for questions and job drafts",
  exclude: "Keep this job out of AI",
  save: "Save",
  saving: "Saving…",
  saved: "Saved",
  failed: "The preference could not be saved. Try again.",
  provider: "Provider",
  model: "Model",
  calls: "Model calls this month (UTC)",
  cost: "Estimated cost this month (USD)",
  unknownCost: "Some calls have no returned usage; the estimate is incomplete.",
  data: "AI and your data",
  label: "AI answer · check the sources",
  labelWithoutSources: "AI answer",
  jobNotFound: "No job by that name was found.",
  failedAnswer: "The AI could not answer this time. Please ask again.",
  retry: "Ask again",
  fallback: "AI is unavailable for this answer. Using record search.",
  unavailable: "AI preferences are unavailable.",
  off: "Off",
  on: "On",
  notConfigured: "AI is not configured on this server. Questions use record search.",
  planned: "Planned",
  knowledge: "Knowledge",
  customerCare: "Customer care",
  knowledgeDescription:
    "Planned: upload company documents and past quotes, ask questions from them, and track owners and review dates.",
  careDescription:
    "Planned: LINE first, with other channels later. Staff review and approve drafted replies before sending.",
  dataIntro:
    "StrideBrain can use Google Gemini, on its paid API service, to answer questions from your firm's records and fill new-job forms for you to confirm.",
  dataSent:
    "When AI is enabled, Google receives your question, bounded recent questions for context, and only the authorized record details needed for this turn. Each tool call checks your access again. For job drafts, only your redacted text and the fixed form choices are sent; client matching stays on the server.",
  dataNever:
    "Excluded jobs, inaccessible records, passwords and credentials are never included in record results. Taiwan ID numbers, bank account and card numbers, and password fields are removed before sending. Conversations and unconfirmed job drafts are not stored by StrideBrain; usage logs contain metadata, not questions or answers.",
  dataTraining:
    "Under Google's paid API terms, prompts and responses are not used to train or improve its models. Google may retain limited data for abuse monitoring under those terms. Google may process this content outside Taiwan.",
  dataOff:
    "An owner can switch AI off in Settings. People who can update a job can exclude it on its overview. With AI off or not configured, questions use record search. A failed AI answer offers a retry.",
  terms: "Google Gemini API terms",
  sources: "Sources",
  failures: "AI failures in the last seven days",
  noFailures: "No AI failures in the last seven days.",
  turnTimings: "Total server time in the last seven days",
  timingExplanation:
    "From question-action entry until the response finishes, including record reads and answer preparation. Browser and network time before the action are not included.",
  recentTimings: "Latest 20 completed questions",
  timingStarted: "Action started (UTC)",
  timingDuration: "Server time",
  noTimings: "No completed question timings yet.",
  timedTurns: "Measured turns",
  latestTiming: "Latest turn",
  maximumTiming: "Longest turn",
  failureReason: "Reason",
  failureCount: "Count",
  failureCode: "Code",
};
const zh: typeof en = {
  title: "AI 偏好設定",
  enabled: "使用 AI 回答問題及填入專案表單",
  exclude: "不提供此專案給 AI",
  save: "儲存",
  saving: "儲存中…",
  saved: "已儲存",
  failed: "無法儲存偏好設定，請重試。",
  provider: "服務提供者",
  model: "模型",
  calls: "本月模型呼叫次數（UTC）",
  cost: "本月預估費用（美元）",
  unknownCost: "部分呼叫未回傳用量，費用估計尚不完整。",
  data: "AI 與您的資料",
  label: "AI 回答 · 請查看來源",
  labelWithoutSources: "AI 回答",
  jobNotFound: "找不到這個名稱的專案。",
  failedAnswer: "AI 這次沒有答出來，請再問一次。",
  retry: "再問一次",
  fallback: "此回答目前無法使用 AI，改以紀錄搜尋。",
  unavailable: "目前無法讀取 AI 偏好設定。",
  off: "關閉",
  on: "開啟",
  notConfigured: "伺服器尚未設定 AI，提問會使用紀錄搜尋。",
  planned: "規劃中",
  knowledge: "知識庫",
  customerCare: "客戶服務",
  knowledgeDescription: "規劃中：上傳公司文件與過往報價，根據資料提問，並追蹤負責人與審查日期。",
  careDescription: "規劃中：先支援 LINE，之後加入其他管道。回覆草稿由員工審查核准後才會傳送。",
  dataIntro:
    "StrideBrain 可透過 Google Gemini 的付費 API 服務，根據公司的紀錄回答問題，並填入新專案表單供您確認。",
  dataSent:
    "開啟 AI 時，Google 會收到您的問題、有限的近期問題脈絡，以及本次回答所需且您有權查看的紀錄內容。每次工具呼叫都會重新檢查存取權限。填入專案表單時，只會傳送已遮蔽敏感資訊的文字與固定欄位選項；客戶比對留在伺服器端進行。",
  dataNever:
    "紀錄結果不會包含已排除的專案、無權查看的紀錄、密碼或憑證。傳送前會移除臺灣身分證字號、銀行帳號、卡號及密碼欄位。StrideBrain 不儲存對話或尚未確認的專案草稿；用量紀錄僅含中繼資料，不含問題或回答。",
  dataTraining:
    "依 Google 付費 API 條款，問題與回答不會用於訓練或改善其模型。Google 可能依條款保留有限資料以監控濫用。Google 可能在臺灣以外地區處理這些內容。",
  dataOff:
    "擁有者可在設定中關閉 AI。有權更新專案的人可在專案總覽排除該專案。AI 關閉或尚未設定時，提問會使用紀錄搜尋；AI 回答失敗時可重試。",
  terms: "Google Gemini API 條款",
  sources: "來源",
  failures: "最近七天的 AI 失敗紀錄",
  noFailures: "最近七天沒有 AI 失敗紀錄。",
  turnTimings: "最近七天的伺服器總處理時間",
  timingExplanation:
    "從提問動作開始至回應完成，包含讀取紀錄及準備回答；不包含動作開始前的瀏覽器與網路時間。",
  recentTimings: "最近 20 次已完成提問",
  timingStarted: "操作開始時間（UTC）",
  timingDuration: "伺服器時間",
  noTimings: "尚無已完成的提問計時紀錄。",
  timedTurns: "已計時提問次數",
  latestTiming: "最近一次",
  maximumTiming: "最長一次",
  failureReason: "原因",
  failureCount: "次數",
  failureCode: "代碼",
};
export const assistantCopy = (locale: Locale) => (locale === "zh-TW" ? zh : en);

export function assistantFactCopy(locale: Locale) {
  return locale === "zh-TW"
    ? {
        noQuote: "尚無報價",
        draft: "草稿",
        issued: "已核發",
        accepted: "已接受",
        superseded: "已取代",
        notAccepted: "尚未接受",
        noIssued: "尚未核發報價",
        noAmounts: "目前沒有報價金額",
        quotedPrices: "過往報價",
        noHistory: "沒有可比較的過往報價",
        latestIssued: "最新核發報價",
        currentQuote: "目前報價",
        internalReview: "內部審查中",
        approved: "已核准",
        declined: "已拒絕",
        withdrawn: "已撤回",
        expired: "已過期",
        currentDraft: "目前草稿",
        moreRecords: "仍有其他紀錄",
        allRecords: "已列出全部紀錄",
        allStageGroups: "所有階段群組",
        unavailable: "目前無法取得",
        excluded: "此專案已設定為不提供給 AI",
        outOfDate: "已儲存的比較已過期",
        noRecords: "沒有可用紀錄",
        noneAwaiting: "目前有 0 筆報價等待客戶回覆。",
        available: "可用",
      }
    : {
        noQuote: "No quote yet",
        draft: "Draft",
        issued: "Issued",
        accepted: "Accepted",
        superseded: "Superseded",
        notAccepted: "Not accepted yet",
        noIssued: "No issued quote yet",
        noAmounts: "No quote amounts available",
        quotedPrices: "Past quoted prices",
        noHistory: "No comparable past quoted prices",
        latestIssued: "Latest issued quote",
        currentQuote: "Current quote",
        internalReview: "In internal review",
        approved: "Approved",
        declined: "Declined",
        withdrawn: "Withdrawn",
        expired: "Expired",
        currentDraft: "Current draft",
        moreRecords: "More records available",
        allRecords: "All records shown",
        allStageGroups: "All stage groups",
        unavailable: "Unavailable",
        excluded: "This job is excluded from AI",
        outOfDate: "The saved comparison is out of date",
        noRecords: "No available records",
        noneAwaiting: "There are 0 quotes waiting for the client.",
        available: "Available",
      };
}
export function assistantQuoteStatus(locale: Locale, status: string | null): string {
  const c = assistantFactCopy(locale);
  return (
    (
      {
        DRAFT: c.draft,
        INTERNAL_REVIEW: c.internalReview,
        APPROVED: c.approved,
        REJECTED: c.declined,
        WITHDRAWN: c.withdrawn,
        EXPIRED: c.expired,
        ISSUED: c.issued,
        ACCEPTED: c.accepted,
        SUPERSEDED: c.superseded,
        FINAL: locale === "zh-TW" ? "定稿" : "Final",
      } as Record<string, string>
    )[status ?? ""] ?? (status ? c.currentQuote : c.noQuote)
  );
}
export function assistantToolStatus(locale: Locale, status: string): string {
  const c = assistantFactCopy(locale);
  return (
    (
      {
        OK: c.available,
        NO_RECORDS: c.noRecords,
        UNAVAILABLE: c.unavailable,
        EXCLUDED: c.excluded,
        OUT_OF_DATE: c.outOfDate,
      } as Record<string, string>
    )[status] ?? c.unavailable
  );
}

/** Words used by the Quote tab/PDF and their ordinary sentence forms. */
export const quoteAmountLabelWords = {
  en: {
    amountBeforeTax: [
      "amount before tax",
      "before-tax amount",
      "before tax",
      "pre-tax amount",
      "pre-tax",
      "excluding tax",
      "excl. tax",
      "subtotal",
    ],
    taxAmount: ["business tax", "tax amount", "including tax of", "tax"],
    totalAmount: [
      "quote total",
      "total amount",
      "total",
      "totaling",
      "totalling",
      "totals",
      "including tax",
      "inclusive of tax",
      "tax included",
      "incl. tax",
    ],
  },
  "zh-TW": {
    amountBeforeTax: ["未稅金額", "未稅報價", "未稅", "稅前金額", "稅前"],
    taxAmount: ["營業稅", "稅額", "稅金"],
    totalAmount: ["含稅總額", "報價總額", "總計金額", "總計", "總金額", "總額", "合計", "含稅"],
  },
} as const;

/** Keys stay in server DTOs; only these human labels cross the model boundary. */
export function assistantFactLabels(locale: Locale): Readonly<Record<string, string>> {
  const price = priceListCopy(locale);
  const document = quoteDocumentCopy(locale);
  const quote = quoteDraftCopy(locale),
    issue = quoteIssueCopy(locale),
    home = homeDeskCopy(locale);
  return {
    description: price.item,
    lastPrice: price.lastPrice,
    lastQuoted: price.lastQuoted,
    timesQuoted: price.timesQuoted,
    clientLastPrice: locale === "zh-TW" ? "此專案客戶上次單價" : "Last price for this job's client",
    clientLastQuoted: price.lastQuoted,
    clientDocumentNumber: issue.number,
    amountBeforeTax: quote.beforeTax,
    taxAmount: document.tax,
    totalAmount: document.total,
    validUntil: issue.validUntil,
    acceptedOn: issue.acceptedOn,
    acceptance: locale === "zh-TW" ? "接受狀態" : "Acceptance",
    documentNumber: issue.number,
    quotedPrice: home.quote,
    reconciledActualCost: home.actual,
    ...(locale === "zh-TW"
      ? {
          amount: "金額",
          date: "日期",
          reference: "專案編號",
          name: "專案名稱",
          status: "報價狀態",
          stage: "階段",
          stageGroup: "階段群組",
          appliedStageGroup: "套用的階段群組篩選",
          matchingCount: "符合篩選的專案數",
          city: "城市",
          area: "面積",
          value: "數值",
          unit: "單位",
          scopeCategories: "工作範圍",
          amounts: "目前報價",
          issued: "最新核發報價",
          category: "類別",
          history: "過往報價",
          count: "紀錄筆數",
          displayMedian: "過往報價單價中位數",
          displayLow: "過往最低報價單價",
          displayHigh: "過往最高報價單價",
          costComparison: "結案經驗",
          overallDifference: "整體差異",
          pastJobs: "所選過往專案",
          score: "相似分數",
          findings: "比較結果",
          text: "說明",
          coverage: "清單範圍",
          nextOffset: "下一頁起點",
        }
      : {
          amount: "Amount",
          date: "Date",
          reference: "Job reference",
          name: "Job name",
          status: "Quote status",
          stage: "Stage",
          stageGroup: "Stage group",
          appliedStageGroup: "Applied stage group filter",
          matchingCount: "Matching job count",
          city: "City",
          area: "Area",
          value: "Value",
          unit: "Unit",
          scopeCategories: "Scope categories",
          amounts: "Current quote",
          issued: "Latest issued quote",
          category: "Category",
          history: "Past quoted prices",
          count: "Record count",
          displayMedian: "Past quoted rate median",
          displayLow: "Lowest past quoted rate",
          displayHigh: "Highest past quoted rate",
          costComparison: "Closed-job lesson",
          overallDifference: "Overall difference",
          pastJobs: "Selected past jobs",
          score: "Similarity score",
          findings: "Findings",
          text: "Description",
          coverage: "List coverage",
          nextOffset: "Next page offset",
        }),
  };
}

export function assistantFailureText(locale: Locale, code: string, status: number | null) {
  const zh = locale === "zh-TW";
  if (code === "PROVIDER_HTTP") {
    if (status === 401 || status === 403)
      return zh ? "服務提供者拒絕了 API 金鑰。" : "The provider refused the API key.";
    if (status === 429)
      return zh ? "已達到服務提供者的用量限制。" : "The provider's usage limit was reached.";
    if (status !== null && status >= 500)
      return zh ? "服務提供者發生錯誤。" : "The provider's service had an error.";
    return zh ? "服務提供者拒絕了請求。" : "The provider refused the request.";
  }
  if (code === "PROVIDER_NETWORK")
    return zh ? "無法連線至服務提供者。" : "The provider could not be reached.";
  if (code === "TIMEOUT")
    return zh ? "服務未在時限內回應。" : "The service did not respond within the time limit.";
  if (code === "DAILY_CAP" || code === "TOOL_CAP" || code === "OUTPUT_CAP")
    return zh
      ? "此請求已達到應用程式的用量限制。"
      : "This request reached an application usage limit.";
  if (code === "ACCESS_CHANGED")
    return zh ? "存取權限已變更，回答未顯示。" : "Access changed, so the answer was not shown.";
  return zh
    ? "回答未通過伺服器檢查，已改用紀錄搜尋。"
    : "The answer did not pass the server checks; record search was used.";
}
