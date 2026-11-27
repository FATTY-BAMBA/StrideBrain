import { MobileMenu } from "./mobile-menu";
import { designSystemCopy } from "@/modules/localization/design-system";
import { SettingsLink } from "./settings-link";
import styles from "./shell.module.css";
import { Icon } from "@/components/ui/icons";
import { Suspense, type ReactNode } from "react";

import type { Catalog } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";

import { CurrentArea } from "./current-area";
import { GlobalNav } from "./global-nav";
import { LanguageSwitcher, LanguageSwitcherFallback } from "./language-switcher";
import type { WorkspaceAccount } from "@/modules/runtime-context/get-workspace-account";
import { homeDeskCopy } from "@/modules/localization/home-desk";

type WorkspaceShellProps = {
  locale: Locale;
  canReadClients?: boolean;
  catalog: Catalog;
  children: ReactNode;
  account?: WorkspaceAccount | null | undefined;
};

export function WorkspaceShell({
  locale,
  catalog,
  children,
  account,
  canReadClients = false,
}: WorkspaceShellProps) {
  const copy = homeDeskCopy(locale);
  const uiCopy = designSystemCopy(locale);
  const navigation = (
    <>
      <div className={styles.brand}>
        <strong>{catalog["app.name"]}</strong>
        {account ? <span>{account.organization}</span> : null}
      </div>

      <GlobalNav
        canReadClients={canReadClients}
        locale={locale}
        labels={{
          "nav.home": catalog["nav.home"],
          "nav.projects": catalog["nav.projects"],
          "nav.quotes": catalog["nav.quotes"],
          "nav.clients": catalog["nav.clients"],
          "nav.knowledge": catalog["nav.knowledge"],
          "nav.customerCare": catalog["nav.customerCare"],
        }}
      />
      <section className={styles.account} aria-label={copy.account}>
        {account ? (
          <div className={styles.identity}>
            <strong>{account.person}</strong>
          </div>
        ) : null}
        <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
          <LanguageSwitcher locale={locale} zhLabel="繁中" enLabel="EN" />
        </Suspense>
        {account ? (
          <div className={styles.actions}>
            <SettingsLink locale={locale} label={catalog["nav.settings"]} />
            <form action="/api/preview-session/logout" method="post">
              <input type="hidden" name="locale" value={locale} />
              <button type="submit">
                <Icon name="signOut" decorative />
                {copy.signOut}
              </button>
            </form>
          </div>
        ) : null}
      </section>
    </>
  );
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main-content">
        {uiCopy.skip}
      </a>

      <aside className={styles.sidebar}>{navigation}</aside>
      <MobileMenu
        summary={
          <>
            <strong>{catalog["app.name"]}</strong>
            <CurrentArea locale={locale} catalog={catalog} canReadClients={canReadClients} />
            <span>{uiCopy.menu}</span>
          </>
        }
      >
        <div className={styles.mobileNavigation}>{navigation}</div>
      </MobileMenu>

      <div className={styles.column}>
        <header className={styles.topbar}>
          <span>{catalog["app.demoStatus"]}</span>
        </header>

        <main className={styles.main} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
