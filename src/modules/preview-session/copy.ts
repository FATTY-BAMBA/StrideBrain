import type { Locale } from "@/modules/localization/config";

const en = {
  title: "StrideBrain controlled preview",
  description: "Explore everyday project work with a fictional company’s knowledge and experience.",
  invitation: "Invitation code",
  enter: "Enter StrideBrain",
  leave: "Leave demo",
  failure: "We couldn’t complete that request. Please try again shortly or contact your host.",
  unavailable: "This preview is not available right now. Please contact your host.",
  session: "Demo session",
  sessionDescription:
    "Leave the demo when you’re finished. You can return using your invitation code.",
};
const zhTW: typeof en = {
  title: "StrideBrain 受邀體驗",
  description: "透過虛構公司的知識與經驗，探索更輕鬆的日常專案工作方式。",
  invitation: "邀請碼",
  enter: "進入 StrideBrain",
  leave: "離開體驗",
  failure: "目前無法完成這項操作。請稍後再試，或聯絡邀請您的人。",
  unavailable: "目前無法進入體驗。請聯絡邀請您的人。",
  session: "體驗登入狀態",
  sessionDescription: "體驗結束後，請登出。您可以使用邀請碼再次進入。",
};
export function previewSessionCopy(locale: Locale) {
  return locale === "en" ? en : zhTW;
}
