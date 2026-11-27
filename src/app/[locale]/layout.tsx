import type { Metadata } from "next";
import { headers } from "next/headers";
import { signInMode, sameSiteReturn } from "@/modules/sign-in/domain/policy";
import { realIdentityState } from "@/lib/server/real-identity";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { loadWorkspaceAccount } from "@/lib/server/workspace-account";
import { getServerEnvironment } from "@/lib/env/server-env";
import { getCatalog } from "@/modules/localization/catalog";
import { htmlLanguage, isSupportedLocale, supportedLocales } from "@/modules/localization/config";

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
  const mode = signInMode(process.env);
  if (mode !== "demo") {
    const path = (await headers()).get("x-stridebrain-page-path") ?? `/${locale}`;
    const publicPage = /^\/(en|zh-TW)\/(sign-in|no-access|choose-firm|preview)(\/|\?|$)/.test(path);
    if (!publicPage) {
      const identity = await realIdentityState();
      if (identity && !identity.choices.length) redirect(`/${locale}/no-access`);
      if (identity && !identity.context)
        redirect(
          `/${locale}/choose-firm?returnTo=${encodeURIComponent(sameSiteReturn(path, locale))}`,
        );
      if (!identity && !(mode === "both" && (await resolveServerRuntimeContext())))
        redirect(`/${locale}/sign-in?returnTo=${encodeURIComponent(sameSiteReturn(path, locale))}`);
    }
  }
  const account = await loadWorkspaceAccount(locale);
  const context = await resolveServerRuntimeContext().catch(() => null);

  return (
    <html lang={htmlLanguage(locale)}>
      <body>
        <WorkspaceShell
          realSignIn={mode !== "demo" && Boolean(await realIdentityState())}
          canReadClients={context?.capabilities.has("client:read") ?? false}
          locale={locale}
          catalog={catalog}
          account={account}
        >
          {children}
        </WorkspaceShell>
      </body>
    </html>
  );
}
