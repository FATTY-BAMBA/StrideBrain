import type { Locale } from "./config";
import type { ProjectStage } from "@/modules/projects/domain/job-input";

const categories: Record<string, readonly [string, string]> = {
  SELECTIVE_DEMOLITION: ["Selective demolition", "選擇性拆除"],
  PARTITIONS_CEILINGS: ["Partitions and ceilings", "隔間與天花"],
  DEMOLITION_CEILING: ["Demolition, partitions and ceilings", "拆除、隔間與天花"],
  CUSTOM_MILLWORK: ["Custom millwork", "客製木作"],
  LIGHTING_ELECTRICAL: ["Lighting and electrical", "照明與電氣"],
  IMPORTED_STONE: ["Imported stone and hard finishes", "進口石材與硬質面材"],
  SIGNAGE: ["Signage and display installation", "標示與展示安裝"],
  COORDINATION: ["Site coordination and handover", "現場協調與交付"],
};
const stages: Record<ProjectStage, readonly [string, string]> = {
  DISCOVERY: ["Discovery", "需求探索"],
  DESIGN: ["Design", "設計"],
  QUOTE_REVIEW: ["Quote review", "報價審查"],
  APPROVED: ["Approved", "已核准"],
  PROCUREMENT: ["Procurement", "採購"],
  CONSTRUCTION: ["Construction", "施工"],
  HANDOVER: ["Handover", "交付"],
  COMPLETE: ["Complete", "完成"],
};
export function categoryLabel(locale: Locale, key: string): string {
  return categories[key]?.[locale === "zh-TW" ? 1 : 0] ?? key;
}
export function projectStageLabel(locale: Locale, stage: ProjectStage): string {
  return stages[stage][locale === "zh-TW" ? 1 : 0];
}
