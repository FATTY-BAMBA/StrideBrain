import type { Locale } from "@/modules/localization/config";
import Link from "next/link";
import type { Route } from "next";
import { useId } from "react";
import type { AnswerPresentation, AnswerRow } from "@/modules/assistant/domain/answer-cards";
import styles from "./answer-cards.module.css";
import { FactsList } from "@/components/ui/facts-list";

function FactRows({ rows, locale }: { rows: readonly AnswerRow[]; locale: Locale }) {
  return (
    <FactsList
      alignValues
      groupAdjacent
      rows={rows.map((row) => ({
        key: row.ref,
        label: row.label,
        value: (
          <>
            <strong>{row.value}</strong>
            {row.details?.length ? (
              <small className={styles.details}>
                {row.details.map((detail) => (
                  <span key={detail.ref}>
                    {detail.label}
                    {locale === "zh-TW" ? "：" : ": "}
                    <span className={styles.detailValue}>{detail.value}</span>
                  </span>
                ))}
              </small>
            ) : null}
          </>
        ),
      }))}
    />
  );
}
/** Only server-built fields enter this view; text parsing is reserved for older answers. */
export function AnswerCards({ presentation }: { presentation: AnswerPresentation }) {
  const id = useId();
  return (
    <div className={styles.answers}>
      {presentation.blocks.map((block, index) =>
        block.kind === "NOTICE" ? (
          <p key={index} className={styles.notice}>
            {block.text}
          </p>
        ) : (
          <section className={styles.card} aria-labelledby={`${id}-${index}`} key={block.key}>
            <header className={styles.heading}>
              <h3 id={`${id}-${index}`}>{block.title}</h3>
              {block.reference ? <span>{block.reference}</span> : null}
              {block.unit ? <span>{block.unit}</span> : null}
            </header>
            {block.rows.length ? <FactRows rows={block.rows} locale={presentation.locale} /> : null}
            {block.list ? (
              <>
                <p className={styles.summary}>
                  {block.list.countText}
                  {block.list.filter
                    ? ` · ${block.list.filter.label}${presentation.locale === "zh-TW" ? "：" : ": "}${block.list.filter.value}`
                    : ""}
                </p>
                {block.list.rows.length ? (
                  <ul className={styles.list}>
                    {block.list.rows.map((row) => (
                      <li key={row.key}>
                        <div className={styles.heading}>
                          <strong>{row.title}</strong>
                          {row.reference ? <span>{row.reference}</span> : null}
                          {row.unit ? <span>{row.unit}</span> : null}
                        </div>
                        <FactRows rows={row.facts} locale={presentation.locale} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {block.list.remaining ? (
                  <p className={styles.summary}>{block.list.remaining}</p>
                ) : null}
              </>
            ) : null}
            <footer className={styles.footer}>
              {block.remaining ? <span className={styles.summary}>{block.remaining}</span> : null}
              <Link className={styles.link} href={block.link.href as Route}>
                {block.link.label}
              </Link>
            </footer>
          </section>
        ),
      )}
    </div>
  );
}
