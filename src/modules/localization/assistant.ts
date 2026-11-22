import type { Locale } from "./config";
const en = {
  title: "AI preferences",
  enabled: "Use AI for record questions",
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
  fallback: "AI is unavailable for this answer. Using record search.",
  unavailable: "AI preferences are unavailable.",
  off: "Off",
  on: "On",
  notConfigured:
    "AI is unavailable until the server is configured for the paid service. Record search still works.",
  planned: "Planned",
  knowledge: "Knowledge",
  customerCare: "Customer care",
  knowledgeDescription:
    "Planned: upload company documents and past quotes, ask questions from them, and track owners and review dates.",
  careDescription:
    "Planned: LINE first, with other channels later. Staff review and approve drafted replies before sending.",
  dataIntro:
    "StrideBrain can use Google Gemini, on its paid API service, to answer questions from your firm's records.",
  dataSent:
    "When AI is enabled, Google receives your question, bounded recent questions for context, and only the authorized record details needed for this turn. Each tool call checks your access again.",
  dataNever:
    "Excluded jobs, inaccessible records, passwords and credentials are never included in record results. Taiwan ID numbers, bank account and card numbers, and password fields are removed before sending. Conversations are not stored by StrideBrain; usage logs contain metadata, not questions or answers.",
  dataTraining:
    "Under Google's paid API terms, prompts and responses are not used to train or improve its models. Google may retain limited data for abuse monitoring under those terms.",
  dataOff:
    "An owner can switch AI off in Settings. People who can update a job can exclude it on its overview. With AI off or unavailable, record search continues to work.",
  terms: "Google Gemini API terms",
  sources: "Sources",
};
const zh: typeof en = {
  title: "AI 偏好設定",
  enabled: "使用 AI 回答公司紀錄問題",
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
  fallback: "此回答目前無法使用 AI，改以紀錄搜尋。",
  unavailable: "目前無法讀取 AI 偏好設定。",
  off: "關閉",
  on: "開啟",
  notConfigured: "伺服器完成付費服務設定後才能使用 AI，紀錄搜尋仍可使用。",
  planned: "規劃中",
  knowledge: "知識庫",
  customerCare: "客戶服務",
  knowledgeDescription: "規劃中：上傳公司文件與過往報價，根據資料提問，並追蹤負責人與審查日期。",
  careDescription: "規劃中：先支援 LINE，之後加入其他管道。回覆草稿由員工審查核准後才會傳送。",
  dataIntro: "StrideBrain 可透過 Google Gemini 的付費 API 服務，根據公司的紀錄回答問題。",
  dataSent:
    "開啟 AI 時，Google 會收到您的問題、有限的近期問題脈絡，以及本次回答所需且您有權查看的紀錄內容。每次工具呼叫都會重新檢查存取權限。",
  dataNever:
    "紀錄結果不會包含已排除的專案、無權查看的紀錄、密碼或憑證。傳送前會移除臺灣身分證字號、銀行帳號、卡號及密碼欄位。StrideBrain 不儲存對話；用量紀錄僅含中繼資料，不含問題或回答。",
  dataTraining:
    "依 Google 付費 API 條款，問題與回答不會用於訓練或改善其模型。Google 可能依條款保留有限資料以監控濫用。",
  dataOff:
    "擁有者可在設定中關閉 AI。有權更新專案的人可在專案總覽排除該專案。AI 關閉或無法使用時，仍可搜尋紀錄。",
  terms: "Google Gemini API 條款",
  sources: "來源",
};
export const assistantCopy = (locale: Locale) => (locale === "zh-TW" ? zh : en);
