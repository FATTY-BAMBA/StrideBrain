"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/modules/localization/config";

type LanguageSwitcherProps = {
  locale: Locale;
  zhLabel: string;
  enLabel: string;
};

function pathForLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (segments.length < 2) {
    return `/${locale}`;
  }

  segments[1] = locale;
  return segments.join("/") || `/${locale}`;
}

export function LanguageSwitcher({ locale, zhLabel, enLabel }: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <div className="language-switcher" aria-label={`${zhLabel} / ${enLabel}`}>
      <Link
        href={pathForLocale(pathname, "zh-TW") as Route}
        lang="zh-Hant"
        aria-current={locale === "zh-TW" ? "page" : undefined}
      >
        {zhLabel}
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        href={pathForLocale(pathname, "en") as Route}
        lang="en"
        aria-current={locale === "en" ? "page" : undefined}
      >
        {enLabel}
      </Link>
    </div>
  );
}
