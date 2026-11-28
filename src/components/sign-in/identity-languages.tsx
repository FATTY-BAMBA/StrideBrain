"use client";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  localizedHref,
  currentLocalizedHref,
  pathForLocale,
} from "@/components/shell/language-switcher";
import { localePreferenceCookie } from "@/modules/localization/locale-preference";
import type { Locale } from "@/modules/localization/config";
import styles from "./sign-in.module.css";
export function IdentityLanguages({ locale }: { locale: Locale }) {
  const pathname = usePathname(),
    query = useSearchParams().toString(),
    router = useRouter();
  useEffect(() => {
    document.cookie = localePreferenceCookie(locale, window.location.protocol === "https:");
  }, [locale]);
  return (
    <nav className={styles.languageSegments} aria-label={locale === "en" ? "Language" : "語言"}>
      {(["zh-TW", "en"] as const).map((target) => (
        <Link
          key={target}
          href={localizedHref(pathname, query, target) as Route}
          lang={target === "en" ? "en" : "zh-Hant"}
          aria-current={locale === target ? "page" : undefined}
          onNavigate={(event) => {
            event.preventDefault();
            document.cookie = localePreferenceCookie(target, window.location.protocol === "https:");
            router.push(currentLocalizedHref(target) as Route);
          }}
        >
          {target === "en" ? "EN" : "繁中"}
        </Link>
      ))}
    </nav>
  );
}
export function IdentityLanguagesFallback({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  return (
    <nav className={styles.languageSegments} aria-label={locale === "en" ? "Language" : "語言"}>
      {(["zh-TW", "en"] as const).map((target) => (
        <a
          key={target}
          href={pathForLocale(pathname, target)}
          lang={target === "en" ? "en" : "zh-Hant"}
          aria-current={locale === target ? "page" : undefined}
        >
          {target === "en" ? "EN" : "繁中"}
        </a>
      ))}
    </nav>
  );
}
