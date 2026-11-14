import type { MessageKey } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";

export type ProjectSurfaceKey = "overview" | "compare" | "commercial" | "evidence" | "actions";

type ProjectNavigationItem = {
  key: ProjectSurfaceKey;
  segment: "" | "compare" | "commercial" | "evidence" | "actions";
  labelKey: MessageKey;
};

export const projectNavigation: readonly ProjectNavigationItem[] = [
  { key: "overview", segment: "", labelKey: "nav.overview" },
  { key: "compare", segment: "compare", labelKey: "nav.compare" },
  { key: "commercial", segment: "commercial", labelKey: "nav.commercial" },
  { key: "evidence", segment: "evidence", labelKey: "nav.evidence" },
  { key: "actions", segment: "actions", labelKey: "nav.actions" },
] as const;

export function projectSurfaceHref(
  locale: Locale,
  projectKey: string,
  item: ProjectNavigationItem,
): string {
  const base = `/${locale}/projects/${encodeURIComponent(projectKey)}`;
  return item.segment ? `${base}/${item.segment}` : base;
}
