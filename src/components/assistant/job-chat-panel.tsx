"use client";
import { useId, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/modules/localization/config";
import { projectNavigation, projectSurfaceHref } from "@/modules/navigation/project-navigation";
import { useQuoteUnsavedChanges } from "./job-chat-state";
import { HomeChat } from "./home-chat";
import styles from "./job-chat-panel.module.css";

/** Lives in the job layout: page changes retain chat state, leaving the job unmounts it. */
export function JobChatPanel({ locale, projectKey }: { locale: Locale; projectKey: string }) {
  const pathname = usePathname(),
    id = useId();
  const [disclosure, setDisclosure] = useState({ path: pathname, open: false });
  if (disclosure.path !== pathname) setDisclosure({ path: pathname, open: false });
  const visible = projectNavigation.some(
    (item) => projectSurfaceHref(locale, projectKey, item) === pathname,
  );
  const unsaved = useQuoteUnsavedChanges();
  const open = disclosure.path === pathname && disclosure.open;
  const label = locale === "zh-TW" ? "詢問這個專案" : "Ask about this job";
  return (
    <section className={styles.panel} hidden={!visible} aria-label={label}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setDisclosure({ path: pathname, open: !open })}
      >
        {label}
      </button>
      <div id={id} hidden={!open}>
        <HomeChat locale={locale} projectKey={projectKey} quoteHasUnsavedChanges={unsaved} />
      </div>
    </section>
  );
}
