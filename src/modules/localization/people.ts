import type { Locale } from "./config";
import type { Capability, Role } from "@/modules/runtime-context/contracts";
import { roleBundle } from "@/modules/runtime-context/capabilities";
export function peopleCopy(locale: Locale) {
  return locale === "en"
    ? {
        title: "People",
        mailNotSent: "Invitation email not sent",
        directSignIn: "They can also go straight to the sign-in page and use this email.",
        name: "Name",
        email: "Email",
        role: "Role",
        invite: "Invite person",
        close: "Cancel",
        organizationLimited: "Today's invitation limit is reached. Please try again tomorrow.",
        resend: "Send again",
        cancel: "Cancel invitation",
        deactivate: "Deactivate",
        reactivate: "Reactivate",
        save: "Save",
        joined: "Joined",
        invited: "Invited",
        deactivated: "Deactivated",
        jobs: "Job access",
        actuals: "Can see actual costs",
        action: "Can create action items",
        busy: "Saving…",
        saved: "Saved.",
        failed: "This change could not be saved. Check it and try again.",
        limited: "Too many tries. Please try again later.",
        lastOwner: "Keep at least one active owner.",
        self: "You cannot deactivate yourself.",
        duplicate: "This person is already in this firm.",
        mailFailed: "The invitation is saved, but the email was not sent. Choose Send again.",
        allJobs: "Owners can open every job.",
      }
    : {
        title: "成員",
        mailNotSent: "邀請信未寄出",
        directSignIn: "對方也可以直接到登入頁，用這個信箱登入。",
        name: "姓名",
        email: "電子信箱",
        role: "角色",
        invite: "邀請成員",
        close: "取消",
        organizationLimited: "今天的邀請數已達上限，請明天再試。",
        resend: "再次寄送",
        cancel: "取消邀請",
        deactivate: "停用",
        reactivate: "重新啟用",
        save: "儲存",
        joined: "已加入",
        invited: "已邀請",
        deactivated: "已停用",
        jobs: "專案存取權限",
        actuals: "可看實際成本",
        action: "可建立行動事項",
        busy: "儲存中…",
        saved: "已儲存。",
        failed: "無法儲存此變更，請檢查後再試一次。",
        limited: "嘗試次數太多，請稍後再試。",
        lastOwner: "請保留至少一位啟用中的管理員。",
        self: "您無法停用自己。",
        duplicate: "此成員已在公司名單中。",
        mailFailed: "邀請已儲存，但邀請信沒有寄出。請按「再次寄送」。",
        allJobs: "管理員可開啟所有專案。",
      };
}
export function roleLabel(locale: Locale, role: Role) {
  const labels = {
    ORGANIZATION_ADMIN: ["Owner", "管理員"],
    PROJECT_MANAGER_ESTIMATOR: ["Project manager", "專案經理"],
    FINANCIAL_REVIEWER: ["Finance", "財務"],
    VIEWER: ["Viewer", "檢視者"],
  };
  return labels[role][locale === "en" ? 0 : 1]!;
}
/** Each phrase is selected by the actual role capability table, not a second role policy. */
export function roleDescription(locale: Locale, role: Role) {
  const phrases: [Capability, string, string][] = [
    ["project:read", "open jobs", "開啟專案"],
    ["project:create", "create jobs", "建立專案"],
    ["quote:read", "see quotes and amounts", "查看報價與金額"],
    ["quote:draft", "edit quotes", "編輯報價"],
    ["quote:issue", "issue quotes", "核發報價"],
    ["commercial:actual-read", "see actual costs (set per job)", "查看實際成本（依專案勾選）"],
    [
      "action:internal-review:create",
      "create action items (set per job)",
      "建立行動事項（依專案勾選）",
    ],
    ["settings:manage", "manage people and settings", "管理成員與設定"],
  ];
  const caps = roleBundle(role);
  const description = phrases
    .filter(([cap]) => caps.has(cap))
    .map(([, en, zh]) => (locale === "en" ? en : zh))
    .join(locale === "en" ? ", " : "、");
  return `${locale === "en" ? "Can: " : "可以："}${description}${locale === "en" ? "." : "。"}${caps.has("quote:read") ? "" : locale === "en" ? " Cannot see quotes or amounts." : "看不到報價與金額。"}`;
}

export function peopleConfirmation(
  locale: Locale,
  operation: "deactivate" | "cancel",
  name: string,
) {
  return operation === "deactivate"
    ? locale === "en"
      ? `Deactivate ${name}? They lose access at once. What they created stays.`
      : `停用${name}？他將立即無法登入，已建立的資料會保留。`
    : locale === "en"
      ? `Cancel the invitation to ${name}?`
      : `取消對${name}的邀請？`;
}
