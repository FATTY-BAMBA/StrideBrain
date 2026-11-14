import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { getServerEnvironment } from "@/lib/env/server-env";
import { getCatalog } from "@/modules/localization/catalog";
import {
  htmlLanguage,
  isSupportedLocale,
  supportedLocales,
} from "@/modules/localization/config";

import "../globals.css";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) {
    return {};
  }

  const catalog = getCatalog(rawLocale);
  const environment = getServerEnvironment();

  return {
    metadataBase: environment.appOrigin,
    title: {
      default: catalog["app.name"],
      template: `%s · ${catalog["app.name"]}`,
    },
    description: catalog["home.description"],
    alternates: {
      languages: {
        "zh-Hant": "/zh-TW",
        en: "/en",
      },
    },
    robots:
      environment.publicEnvironment === "production"
        ? { index: false, follow: false }
        : { index: false, follow: false, noarchive: true },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const catalog = getCatalog(locale);

  return (
    <html lang={htmlLanguage(locale)}>
      <body>
        <WorkspaceShell locale={locale} catalog={catalog}>
          {children}
        </WorkspaceShell>
      </body>
    </html>
  );
}
