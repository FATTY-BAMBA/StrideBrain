"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { localizedHref } from "@/components/shell/language-switcher";
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
}: Readonly<{
  locale: Locale;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  pending?: boolean;
  focusKey: string;
  returnFocusId?: string | undefined;
}>) {
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const copy = getInternalReviewCopy(locale);
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const restored = returnFocusId
      ? panel.current?.querySelector<HTMLElement>(
          `[data-evidence-trigger-id="${CSS.escape(returnFocusId)}"]`,
        )
      : null;
    (restored ?? heading.current)?.focus();
  }, [focusKey, returnFocusId]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pending) onClose();
      }
      if (event.key !== "Tab" || !panel.current) return;
      const elements = [
        ...panel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ),
      ].filter((element) => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) {
        event.preventDefault();
        heading.current?.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === heading.current ||
          !panel.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !panel.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, pending]);

  return (
    <div className={styles.overlay}>
      <section
        ref={panel}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="internal-review-heading"
        aria-describedby="internal-review-description"
        aria-busy={pending}
      >
        <header className={styles.header}>
          <div>
            <h2 id="internal-review-heading" ref={heading} tabIndex={-1}>
              {title}
            </h2>
            <p id="internal-review-description">{description}</p>
            <nav className={styles.locale} aria-label="English / 繁體中文">
              <Link
                href={localizedHref(pathname, search, "en") as Route}
                lang="en"
                aria-current={locale === "en" ? "page" : undefined}
              >
                {copy.english}
              </Link>
              <Link
                href={localizedHref(pathname, search, "zh-TW") as Route}
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
      </section>
    </div>
  );
}
