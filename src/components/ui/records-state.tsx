"use client";
import { useParams } from "next/navigation";
import { designSystemCopy } from "@/modules/localization/design-system";
import { PageHeader } from "./page-header";
import { Notice } from "./notice";
import { Button } from "./button";
import { quoteListCopy } from "@/modules/localization/quote-list";
import { clientRecordsCopy } from "@/modules/localization/client-records";
import styles from "./ui.module.css";
/** Route boundaries need the URL locale; no data or session reads happen here. */
export function RecordsState({
  area,
  reset,
}: {
  area: "quotes" | "clients" | "workspace";
  reset?: () => void;
}) {
  const locale = useParams<{ locale: string }>().locale === "en" ? "en" : "zh-TW";
  const copy = designSystemCopy(locale),
    title =
      area === "workspace"
        ? copy.workspace
        : area === "quotes"
          ? quoteListCopy(locale).title
          : clientRecordsCopy(locale).title;
  return (
    <div className={styles.page} aria-busy={reset ? undefined : true}>
      <PageHeader context={copy.workspace} title={title} />
      <Notice tone={reset ? "error" : "information"}>{reset ? copy.failed : copy.loading}</Notice>
      {reset ? (
        <div>
          <Button variant="primary" onClick={reset}>
            {copy.retry}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
