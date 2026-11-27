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
    ["project:read", "open assigned jobs", "開啟指派專案"],
    ["project:create", "create jobs", "建立專案"],
    ["quote:read", "read quotes", "查看報價"],
    ["quote:draft", "prepare quotes", "編輯報價"],
    ["quote:issue", "issue quotes", "核發報價"],
    ["commercial:actual-read", "read permitted actual costs", "查看授權實際成本"],
    ["action:internal-review:create", "create permitted action items", "建立授權行動事項"],
    ["settings:manage", "manage people and settings", "管理成員與設定"],
  ];
  const caps = roleBundle(role);
  return phrases
    .filter(([cap]) => caps.has(cap))
    .map(([, en, zh]) => (locale === "en" ? en : zh))
    .join(locale === "en" ? "; " : "、");
}
