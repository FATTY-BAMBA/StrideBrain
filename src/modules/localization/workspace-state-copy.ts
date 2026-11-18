import type {
  EvidenceHealthDTO,
  ProjectWorkspaceState,
} from "@/modules/projects/domain/project-workspace";
import type { Locale } from "./config";

type StateCopy = Readonly<{
  workspace: Readonly<Record<ProjectWorkspaceState, string>>;
  evidence: Readonly<Record<EvidenceHealthDTO["state"], string>>;
}>;

export const workspaceStateCopies = {
  en: {
    workspace: {
      READY: "Ready",
      PARTIAL: "Partial information",
      UNAVAILABLE: "Unavailable",
      PERMISSION_RESTRICTED: "Restricted for this role",
      CONFLICTED: "Conflicting records",
      STALE: "Outdated information",
    },
    evidence: {
      GOOD: "Good",
      PARTIAL: "Partial evidence",
      INSUFFICIENT: "Insufficient evidence",
      CONFLICTED: "Conflicting evidence",
      RESTRICTED: "Restricted for this role",
    },
  },
  "zh-TW": {
    workspace: {
      READY: "可檢視",
      PARTIAL: "部分資料尚未齊備",
      UNAVAILABLE: "目前無法使用",
      PERMISSION_RESTRICTED: "目前角色無權查看",
      CONFLICTED: "資料紀錄不一致",
      STALE: "資料已過期",
    },
    evidence: {
      GOOD: "資料狀態良好",
      PARTIAL: "部分資料尚未齊備",
      INSUFFICIENT: "資料依據不足",
      CONFLICTED: "資料依據不一致",
      RESTRICTED: "目前角色無權查看",
    },
  },
} as const satisfies Readonly<Record<Locale, StateCopy>>;
