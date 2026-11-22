import type { MessageKey } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";

export type ProjectSurfaceKey =
  "overview" | "quote" | "compare" | "commercial" | "evidence" | "actions";

type ProjectNavigationItem = {
  key: ProjectSurfaceKey;
  segment: "" | "quote" | "compare" | "commercial" | "evidence" | "actions";
  labelKey: MessageKey;
};

export const projectNavigation: readonly ProjectNavigationItem[] = [
  { key: "overview", segment: "", labelKey: "nav.overview" },
  { key: "quote", segment: "quote", labelKey: "nav.quote" },
  { key: "compare", segment: "compare", labelKey: "nav.compare" },
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
