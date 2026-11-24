import type { Locale } from "./config";
const en = {
  workspace: "Workspace",
  open: "Open",
  action: "Action",
  name: "Name",
  loading: "Loading records…",
  failed: "Records are unavailable. Try again.",
  retry: "Try again",
};
const zh: Record<keyof typeof en, string> = {
  workspace: "工作區",
  open: "開啟",
  action: "操作",
  name: "名稱",
  loading: "正在載入紀錄…",
  failed: "目前無法取得紀錄，請再試一次。",
  retry: "再試一次",
};
export const designSystemCopy = (locale: Locale) => (locale === "zh-TW" ? zh : en);
