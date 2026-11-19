import { Suspense, type ReactNode } from "react";

import type { Catalog } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";

import { GlobalNav } from "./global-nav";
import { LanguageSwitcher } from "./language-switcher";

type WorkspaceShellProps = {
  locale: Locale;
  catalog: Catalog;
  children: ReactNode;
};

export function WorkspaceShell({ locale, catalog, children }: WorkspaceShellProps) {
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
            "nav.knowledge": catalog["nav.knowledge"],
            "nav.stridebrain": catalog["nav.stridebrain"],
            "nav.settings": catalog["nav.settings"],
          }}
        />
      </aside>

      <div className="workspace-column">
        <header className="workspace-topbar">
          <div className="workspace-topbar__status">
            <span aria-hidden="true">●</span>
            {catalog["app.demoStatus"]}
          </div>
          <Suspense
            fallback={
              <span className="language-switcher" aria-hidden="true">
                {catalog["language.zhTw"]} / {catalog["language.en"]}
              </span>
            }
          >
            <LanguageSwitcher
              locale={locale}
              zhLabel={catalog["language.zhTw"]}
              enLabel={catalog["language.en"]}
            />
          </Suspense>
        </header>

        <main className="workspace-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
