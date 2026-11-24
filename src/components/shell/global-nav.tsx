"use client";

import styles from "./shell.module.css";
import { Icon } from "@/components/ui/icons";

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
  canReadClients?: boolean;
  labels: Pick<Catalog, `nav.${GlobalSurfaceKey}`>;
};

export function GlobalNav({ locale, labels, canReadClients = false }: GlobalNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label={locale === "zh-TW" ? "主要導覽" : "Main navigation"}>
      {globalNavigation
        .filter((item) => item.key !== "clients" || canReadClients)
        .map((item) => {
          const href = globalSurfaceHref(locale, item);
          const isActive = item.segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;

          const content = (
            <>
              <Icon name={item.key} decorative />
              <span>{labels[item.labelKey as keyof typeof labels]}</span>
              {item.planned && <small>{locale === "zh-TW" ? "規劃中" : "Planned"}</small>}
            </>
          );
          return (
            <Link
              key={item.key}
              href={href as Route}
              className={`${styles.item}${item.planned ? ` ${styles.planned}` : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
    </nav>
  );
}
