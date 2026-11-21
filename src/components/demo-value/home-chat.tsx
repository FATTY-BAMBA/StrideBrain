"use client";

import Link from "next/link";
import { useActionState } from "react";
import { askHomeAction } from "@/app/[locale]/home-chat-actions";
import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts";
import type { Locale } from "@/modules/localization/config";
import styles from "./home-chat.module.css";

export function HomeChat({
  locale,
  projectKey,
}: {
  locale: Locale;
  projectKey?: string | undefined;
}) {
  const [state, action, pending] = useActionState(askHomeAction, initialHomeChatState);
  const copy =
    locale === "zh-TW"
      ? {
          label: "詢問 StrideBrain",
          placeholder: "我們以前做過旗艦店整修嗎？",
          send: "提問",
          thinking: "正在查找公司紀錄…",
        }
      : {
          label: "Ask StrideBrain",
          placeholder: "Have we renovated a flagship store before?",
          send: "Ask",
          thinking: "Checking company records…",
        };

  return (
    <section className={styles.chat} aria-label={copy.label}>
      <label className={styles.chatLabel} htmlFor="chat-message">
        {copy.label}
      </label>
      <div className={styles.chatThread} aria-live="polite">
        {state.turns.map((turn) => (
          <article
            className={turn.role === "user" ? styles.userMessage : styles.assistantMessage}
            key={turn.id}
          >
            <p>{turn.text}</p>
            {turn.bullets?.length ? (
              <ul>
                {turn.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {turn.citations?.length ? (
              <section
                className={styles.chatSources}
                aria-label={
                  locale === "zh-TW" ? "此回答使用的來源" : "Sources used for this answer"
                }
              >
                <span className={styles.chatSourcesLabel}>
                  {locale === "zh-TW" ? "此回答使用的來源" : "Sources"}
                </span>
                <div className={styles.citationList}>
                  {turn.citations.map((citation) => (
                    <details className={styles.citation} key={citation.sourceKey}>
                      <summary>
                        <span className={styles.citationIndex}>[{citation.index}]</span>
                        <span>{citation.title}</span>
                      </summary>
                      <div className={styles.citationPreview}>
                        <div className={styles.citationMeta}>
                          <span>{citation.sourceType}</span>
                          {citation.project ? <span>{citation.project}</span> : null}
                          <span>{citation.authority}</span>
                        </div>
                        {citation.supportedValue ? (
                          <p className={styles.citationValue}>{citation.supportedValue}</p>
                        ) : null}
                        <dl className={styles.citationFields}>
                          {citation.preview.map((field) => (
                            <div key={`${field.label}-${field.value}`}>
                              <dt>{field.label}</dt>
                              <dd>{field.value}</dd>
                            </div>
                          ))}
                          <div>
                            <dt>{locale === "zh-TW" ? "來源位置" : "Location"}</dt>
                            <dd>{citation.locator}</dd>
                          </div>
                        </dl>
                        {citation.conditions.length ? (
                          <div className={styles.citationConditions}>
                            {citation.conditions.map((condition) => (
                              <span key={condition}>{condition}</span>
                            ))}
                          </div>
                        ) : null}
                        <Link className={styles.chatAction} href={citation.fullHref}>
                          {locale === "zh-TW" ? "開啟完整佐證" : "Open full evidence"}{" "}
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
            {turn.action ? (
              <Link className={styles.chatAction} href={turn.action.href}>
                {turn.action.label} <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </article>
        ))}

        {pending ? <p className={styles.thinking}>{copy.thinking}</p> : null}
      </div>

      <form action={action} className={styles.chatComposer}>
        <input type="hidden" name="locale" value={locale} />
        {projectKey ? <input type="hidden" name="projectKey" value={projectKey} /> : null}
        <textarea
          id="chat-message"
          name="message"
          placeholder={copy.placeholder}
          rows={1}
          maxLength={280}
          disabled={pending}
          required
        />
        <button type="submit" disabled={pending}>
          {copy.send}
        </button>
      </form>
    </section>
  );
}
