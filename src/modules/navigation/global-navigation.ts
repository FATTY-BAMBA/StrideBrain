import type { MessageKey } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";

export type GlobalSurfaceKey = "home" | "projects" | "knowledge" | "customerCare";

type GlobalNavigationItem = {
  key: GlobalSurfaceKey;
  segment: "" | "projects" | "knowledge" | "customer-care";
  planned?: boolean;
  labelKey: MessageKey;
};

export const globalNavigation: readonly GlobalNavigationItem[] = [
  { key: "home", segment: "", labelKey: "nav.home" },
  { key: "projects", segment: "projects", labelKey: "nav.projects" },
  { key: "knowledge", segment: "knowledge", labelKey: "nav.knowledge", planned: true },
  { key: "customerCare", segment: "customer-care", labelKey: "nav.customerCare", planned: true },
] as const;

export function globalSurfaceHref(locale: Locale, item: GlobalNavigationItem): string {
  return item.segment ? `/${locale}/${item.segment}` : `/${locale}`;
}
