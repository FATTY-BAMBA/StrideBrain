"use client";

import Link from "next/link";
import { useActionState } from "react";
import { askHomeAction } from "@/app/[locale]/home-chat-actions";
import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts";
import type { Locale } from "@/modules/localization/config";
import styles from "./value-launchpad.module.css";

const suggestions = {
  en: [
    "Have we done something similar before?",
    "What looks unusual in this quotation?",
    "What supports these findings?",
    "What should I review next?",
  ],
  "zh-TW": [
    "我們以前做過類似的專案嗎？",
    "這份報價有哪些需要留意的地方？",
    "這些發現有哪些佐證？",
    "接下來應該先檢視什麼？",
  ],
} as const;

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
          placeholder: "詢問專案、報價、材料、供應商、文件或未完成事項…",
          send: "送出",
          thinking: "正在查找公司紀錄…",
          suggested: "你可以試著問",
        }
      : {
          label: "Ask StrideBrain",
          placeholder:
            "Ask about projects, quotes, materials, suppliers, documents or open actions…",
          send: "Send",
          thinking: "Checking company records…",
          suggested: "Try asking",
        };

  return (
    <section className={styles.chat} aria-label={copy.label}>
      <div className={styles.chatThread} aria-live="polite">
        {state.turns.length === 0 ? (
          <div className={styles.chatWelcome}>
            <strong>{copy.label}</strong>
            <span>
              {locale === "zh-TW"
                ? "用自然語言提問。StrideBrain 只會用目前可支援的公司資料回答。"
                : "Ask naturally. StrideBrain will answer only from the company data this demo can support."}
            </span>
          </div>
        ) : null}

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
        <label className={styles.srOnly} htmlFor="chat-message">
          {copy.label}
        </label>
        <textarea
          id="chat-message"
          name="message"
          placeholder={copy.placeholder}
          rows={2}
          maxLength={280}
          disabled={pending}
          required
        />
        <button type="submit" disabled={pending}>
          {copy.send}
        </button>
      </form>

      <div className={styles.chatSuggestions} aria-label={copy.suggested}>
        <span>{copy.suggested}</span>
        {suggestions[locale].map((question) => (
          <form action={action} key={question}>
            <input type="hidden" name="locale" value={locale} />
            {projectKey ? <input type="hidden" name="projectKey" value={projectKey} /> : null}
            <input type="hidden" name="message" value={question} />
            <button type="submit" disabled={pending}>
              {question}
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
