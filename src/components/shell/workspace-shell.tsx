import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import type { Catalog } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";

import { GlobalNav } from "./global-nav";
import { LanguageSwitcher } from "./language-switcher";
import type { WorkspaceAccount } from "@/modules/runtime-context/get-workspace-account";
import { homeDeskCopy } from "@/modules/localization/home-desk";

type WorkspaceShellProps = {
  locale: Locale;
  catalog: Catalog;
  children: ReactNode;
  account?: WorkspaceAccount | null | undefined;
};

export function WorkspaceShell({ locale, catalog, children, account }: WorkspaceShellProps) {
  const copy = homeDeskCopy(locale);
  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#main-content">
        {locale === "zh-TW" ? "跳至主要內容" : "Skip to main content"}
      </a>

      <aside className="workspace-sidebar">
        <div
          className="brand-lockup"
          aria-label={`${catalog["app.name"]} ${catalog["app.byline"]}`}
        >
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-copy">
            <strong>{catalog["app.name"]}</strong>
            <small>{catalog["app.byline"]}</small>
          </span>
        </div>

        <GlobalNav
          locale={locale}
          labels={{
            "nav.home": catalog["nav.home"],
            "nav.projects": catalog["nav.projects"],
          }}
        />
        <section className="workspace-account" aria-label={copy.account}>
          {account ? (
            <div className="workspace-account__identity">
              <strong>{account.person}</strong>
              <span>{account.organization}</span>
            </div>
          ) : null}
          <Suspense fallback={<span className="language-switcher">繁中 / EN</span>}>
            <LanguageSwitcher locale={locale} zhLabel="繁中" enLabel="EN" />
          </Suspense>
          {account ? (
            <div className="workspace-account__actions">
              <Link href={`/${locale}/settings`}>{catalog["nav.settings"]}</Link>
              <form action="/api/preview-session/logout" method="post">
                <input type="hidden" name="locale" value={locale} />
                <button type="submit">{copy.signOut}</button>
              </form>
            </div>
          ) : null}
        </section>
      </aside>

      <div className="workspace-column">
        <header className="workspace-topbar">
          <div className="workspace-topbar__status">
            <span aria-hidden="true">●</span>
            {catalog["app.demoStatus"]}
          </div>
        </header>

        <main className="workspace-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
