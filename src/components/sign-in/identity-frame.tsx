"use client";
import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/shell/language-switcher";
import type { Locale } from "@/modules/localization/config";
import styles from "./sign-in.module.css";
/** Path-aware at the client boundary so soft navigation also removes the workspace shell. */
export function IdentityFrame({
  locale,
  sampleNotice,
  standalone,
  workspace,
}: {
  locale: Locale;
  sampleNotice: string;
  standalone: ReactNode;
  workspace: ReactNode;
}) {
  const path = usePathname();
  if (!/^\/(en|zh-TW)\/(sign-in(?:\/complete)?|no-access|choose-firm)\/?$/.test(path))
    return workspace;
  return (
    <div className={styles.standalone}>
      <header className={styles.brand}>
        <strong>StrideBrain</strong>
        <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
          <LanguageSwitcher locale={locale} zhLabel="繁中" enLabel="EN" />
        </Suspense>
      </header>
      <p className={styles.sample}>{sampleNotice}</p>
      <main id="main-content">{standalone}</main>
    </div>
  );
}
