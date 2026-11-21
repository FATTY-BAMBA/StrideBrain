import type { ProjectStage } from "./job-input";

/** Display grouping only; persisted ProjectStage values do not change. */
export const stageGroups = [
  { key: "inquiry", en: "Inquiry", "zh-TW": "詢問", stages: ["DISCOVERY", "DESIGN"] },
  { key: "quote", en: "Quote", "zh-TW": "報價", stages: ["QUOTE_REVIEW"] },
  { key: "confirmed", en: "Confirmed", "zh-TW": "確認", stages: ["APPROVED", "PROCUREMENT"] },
  { key: "work", en: "Work", "zh-TW": "施工", stages: ["CONSTRUCTION", "HANDOVER"] },
  { key: "closed", en: "Closed", "zh-TW": "結案", stages: ["COMPLETE"] },
] as const satisfies readonly {
  key: string;
  en: string;
  "zh-TW": string;
  stages: readonly ProjectStage[];
}[];
export type StageGroupKey = (typeof stageGroups)[number]["key"];
export function parseStageGroup(value: unknown): StageGroupKey | undefined {
  return stageGroups.find((group) => group.key === value)?.key;
}
export function inStageGroup(stage: ProjectStage, key: StageGroupKey): boolean {
  return stageGroups.some(
    (group) => group.key === key && (group.stages as readonly ProjectStage[]).includes(stage),
  );
}
