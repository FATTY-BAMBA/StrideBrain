"use client";

import type { ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { currentLocalizedHref, localizedHref } from "@/components/shell/language-switcher";
import { getInternalReviewCopy } from "@/modules/internal-review-experience/copy";
import type { Locale } from "@/modules/localization/config";
import styles from "./internal-review.module.css";

export function ReviewModal({
  locale,
  title,
  description,
  children,
  onClose,
  pending = false,
  focusKey,
  returnFocusId,
  onNavigate,
}: Readonly<{
  locale: Locale;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  pending?: boolean;
  focusKey: string;
  returnFocusId?: string | undefined;
  onNavigate?: (href: string) => void;
}>) {
  const copy = getInternalReviewCopy(locale);
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  return (
    <Dialog
      className={styles.sheet}
      labelledBy="internal-review-heading"
      describedBy="internal-review-description"
      pending={pending}
      onClose={onClose}
      focusKey={focusKey}
      resolveInitialFocus={(panel) =>
        (returnFocusId
          ? panel.querySelector<HTMLElement>(
              `[data-evidence-trigger-id="${CSS.escape(returnFocusId)}"]`,
            )
          : null) ?? panel.querySelector("h2")
      }
    >
      <header className={styles.header}>
        <div>
          <h2 id="internal-review-heading" tabIndex={-1}>
            {title}
          </h2>
          <p id="internal-review-description">{description}</p>
          <nav className={styles.locale} aria-label="English / 繁體中文">
            <Link
              href={localizedHref(pathname, search, "en") as Route}
              aria-disabled={pending}
              onNavigate={(event) => {
                event.preventDefault();
                if (pending) return;
                const href = currentLocalizedHref("en");
                if (onNavigate) onNavigate(href);
                else router.push(href as Route, { scroll: false });
              }}
              lang="en"
              aria-current={locale === "en" ? "page" : undefined}
            >
              {copy.english}
            </Link>
            <Link
              href={localizedHref(pathname, search, "zh-TW") as Route}
              aria-disabled={pending}
              onNavigate={(event) => {
                event.preventDefault();
                if (pending) return;
                const href = currentLocalizedHref("zh-TW");
                if (onNavigate) onNavigate(href);
                else router.push(href as Route, { scroll: false });
              }}
              lang="zh-Hant"
              aria-current={locale === "zh-TW" ? "page" : undefined}
            >
              {copy.chinese}
            </Link>
          </nav>
        </div>
        <button className={styles.secondary} type="button" onClick={onClose} disabled={pending}>
          {copy.close}
        </button>
      </header>
      {children}
    </Dialog>
  );
}
