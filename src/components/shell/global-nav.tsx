"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Catalog } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";
import {
  globalNavigation,
  globalSurfaceHref,
  type GlobalSurfaceKey,
} from "@/modules/navigation/global-navigation";

type GlobalNavProps = {
  locale: Locale;
  labels: Pick<Catalog, `nav.${GlobalSurfaceKey}`>;
};

export function GlobalNav({ locale, labels }: GlobalNavProps) {
  const pathname = usePathname();

  return (
    <nav className="global-nav" aria-label={labels["nav.projects"]}>
      {globalNavigation.map((item) => {
        const href = globalSurfaceHref(locale, item);
        const isActive = item.segment
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === href;

        return (
          <Link
            key={item.key}
            href={href as Route}
            className="global-nav__item"
            aria-current={isActive ? "page" : undefined}
          >
            <span className="global-nav__marker" aria-hidden="true">
              {item.marker}
            </span>
            <span>{labels[item.labelKey as keyof typeof labels]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
