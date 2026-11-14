import type { MessageKey } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";

export type GlobalSurfaceKey = "home" | "projects" | "knowledge" | "stridebrain" | "settings";

type GlobalNavigationItem = {
  key: GlobalSurfaceKey;
  segment: "" | "projects" | "knowledge" | "stridebrain" | "settings";
  labelKey: MessageKey;
  marker: string;
};

export const globalNavigation: readonly GlobalNavigationItem[] = [
  { key: "home", segment: "", labelKey: "nav.home", marker: "01" },
  { key: "projects", segment: "projects", labelKey: "nav.projects", marker: "02" },
  { key: "knowledge", segment: "knowledge", labelKey: "nav.knowledge", marker: "03" },
  { key: "stridebrain", segment: "stridebrain", labelKey: "nav.stridebrain", marker: "04" },
  { key: "settings", segment: "settings", labelKey: "nav.settings", marker: "05" },
] as const;

export function globalSurfaceHref(locale: Locale, item: GlobalNavigationItem): string {
  return item.segment ? `/${locale}/${item.segment}` : `/${locale}`;
}
