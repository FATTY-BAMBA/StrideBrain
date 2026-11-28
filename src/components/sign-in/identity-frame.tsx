"use client";
import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Paper } from "@/components/ui/paper";
import { IdentityLanguages, IdentityLanguagesFallback } from "./identity-languages";
import { BrandMark } from "./brand-mark";
import type { Locale } from "@/modules/localization/config";
import type { SignInMode } from "@/modules/sign-in/domain/policy";
import { signInCopy } from "@/modules/localization/sign-in";
import ui from "@/components/ui/ui.module.css";
import styles from "./sign-in.module.css";
/** Path-aware at the client boundary so soft navigation also removes the workspace shell. */
export function IdentityFrame({
  locale,
  mode,
  standalone,
  workspace,
}: {
  locale: Locale;
  mode: SignInMode;
  standalone: ReactNode;
  workspace: ReactNode;
}) {
  const path = usePathname(),
    c = signInCopy(locale);
  if (!/^\/(en|zh-TW)\/(sign-in(?:\/complete)?|no-access|choose-firm)\/?$/.test(path))
    return workspace;
  return (
    <div className={styles.standalone}>
      <header className={styles.identityTopbar}>
        <div className={styles.identityBrand}>
          <BrandMark />
          <strong>StrideBrain</strong>
        </div>
        <Suspense fallback={<IdentityLanguagesFallback locale={locale} />}>
          <IdentityLanguages locale={locale} />
        </Suspense>
      </header>
      <main className={styles.identityMain} id="main-content">
        <Paper className={styles.identitySheet}>{standalone}</Paper>
        {mode === "both" && (
          <div className={styles.testStrip}>
            <span className={`${ui.badge} ${ui.draft}`}>{c.sampleBadge}</span>
            <span>{c.sampleLine}</span>
            <a href={`/${locale}/preview`}>{c.sample}</a>
          </div>
        )}
      </main>
      <footer className={styles.identityFooter}>© {new Date().getFullYear()} PrimeStride AI</footer>
    </div>
  );
}
