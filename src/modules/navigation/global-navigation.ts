import type { MessageKey } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";

export type GlobalSurfaceKey = "home" | "projects";

type GlobalNavigationItem = {
  key: GlobalSurfaceKey;
  segment: "" | "projects";
  labelKey: MessageKey;
};

export const globalNavigation: readonly GlobalNavigationItem[] = [
  { key: "home", segment: "", labelKey: "nav.home" },
  { key: "projects", segment: "projects", labelKey: "nav.projects" },
] as const;

export function globalSurfaceHref(locale: Locale, item: GlobalNavigationItem): string {
  return item.segment ? `/${locale}/${item.segment}` : `/${locale}`;
}
