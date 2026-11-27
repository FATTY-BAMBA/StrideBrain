"use client";
import { usePathname } from "next/navigation";
import type { Catalog } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";
import { globalNavigation } from "@/modules/navigation/global-navigation";
export function CurrentArea({
  locale,
  catalog,
  canReadClients = false,
}: {
  locale: Locale;
  catalog: Catalog;
  canReadClients?: boolean;
}) {
  const pathname = usePathname();
  const area = globalNavigation.find(
    (item) =>
      (item.segment !== "clients" || canReadClients) &&
      item.segment &&
      (pathname === `/${locale}/${item.segment}` ||
        pathname.startsWith(`/${locale}/${item.segment}/`)),
  );
  return (
    <span>
      {area
        ? catalog[area.labelKey as keyof Catalog]
        : pathname === `/${locale}/settings`
          ? catalog["nav.settings"]
          : catalog["nav.home"]}
    </span>
  );
}
