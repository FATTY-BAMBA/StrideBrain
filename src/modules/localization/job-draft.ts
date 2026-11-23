import type { Locale } from "./config";
import type { DraftJobOutcome } from "@/modules/assistant/application/draft-job";
const en = {
  label: "Describe the new job",
  placeholder: "Type a sentence or paste the client’s message.",
  fill: "Fill the form",
  create: "Create a job",
  confirm: "Create job",
  pending: "Preparing the form…",
  marked: "Filled by AI, please check",
  ready: "Check the filled fields, complete the missing details, then create the job.",
  empty: "No job details could be drafted; fill in the form below.",
  failed: "The form could not be filled; you can enter the details yourself.",
  cap: "The daily AI limit has been reached; you can enter the details yourself.",
  timeout: "Filling the form took too long; you can enter the details yourself.",
};
const zh: Record<keyof typeof en, string> = {
  label: "描述新專案",
  placeholder: "輸入一句話，或貼上客戶的訊息。",
  fill: "填入表單",
  create: "建立專案",
  confirm: "確認建立",
  pending: "正在填入表單…",
  marked: "AI 填入，請確認",
  ready: "請確認已填入的欄位、補齊缺少的資料，再建立專案。",
  empty: "無法從這段文字填入專案資料，請填寫下方表單。",
  failed: "無法填入表單，您仍可自行輸入資料。",
  cap: "已達今日 AI 使用上限，您仍可自行輸入資料。",
  timeout: "填入表單逾時，您仍可自行輸入資料。",
};
export const jobDraftCopy = (locale: Locale): Record<keyof typeof en, string> =>
  locale === "zh-TW" ? zh : en;
export function jobDraftMessage(locale: Locale, outcome: DraftJobOutcome): string {
  const c = jobDraftCopy(locale);
  if (outcome.kind !== "UNAVAILABLE") return outcome.kind === "DRAFTED" ? c.ready : c.empty;
  return outcome.reason === "DAILY_CAP"
    ? c.cap
    : outcome.reason === "TIMEOUT"
      ? c.timeout
      : c.failed;
}
