"use client";

import Link from "next/link";
import { assistantCopy } from "@/modules/localization/assistant";
import { useActionState, useState, useTransition } from "react";
import { askHomeAction } from "@/app/[locale]/home-chat-actions";
import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts";
import type { Locale } from "@/modules/localization/config";
import styles from "./home-chat.module.css";
import type { HomeChatTurn } from "@/modules/home-intelligence/chat-contracts";
import type { JobDraftActionState } from "@/modules/assistant/application/job-draft-action-state";
import { draftJobFromHome } from "@/app/[locale]/job-draft-actions";
import { jobDraftCopy, jobDraftMessage } from "@/modules/localization/job-draft";
import { NewJobForm } from "@/components/projects/new-job-form";

export function HomeChat({
  locale,
  projectKey,
  canDraftJob = false,
}: {
  locale: Locale;
  projectKey?: string | undefined;
  canDraftJob?: boolean;
}) {
  const [state, action, asking] = useActionState(askHomeAction, initialHomeChatState);
  const [drafting, startDraft] = useTransition();
  const pending = asking || drafting;
  type DraftTurn = HomeChatTurn & { draftResult?: JobDraftActionState };
  const [draftTurns, setDraftTurns] = useState<readonly DraftTurn[]>([]);
  // Drafts stay in this client component, never in the question action's history.
  const turns: readonly DraftTurn[] = [...state.turns, ...draftTurns].sort(
    (a, b) => (Number(a.id.split("-").at(-1)) || 0) - (Number(b.id.split("-").at(-1)) || 0),
  );
  function draftAction(data: FormData) {
    const text = data.get("message");
    if (typeof text !== "string" || !text.trim() || text.length > 280) return;
    const now = Date.now();
    setDraftTurns((current) => [...current, { id: `draft-user-${now}`, role: "user", text }]);
    startDraft(async () => {
      let result: JobDraftActionState;
      try {
        result = await draftJobFromHome(locale, text);
      } catch {
        result = { outcome: { kind: "UNAVAILABLE", reason: "UNAVAILABLE" } };
      }
      setDraftTurns((current) => [
        ...current,
        {
          id: `draft-assistant-${Date.now()}`,
          role: "assistant",
          text: jobDraftMessage(locale, result.outcome),
          draftResult: result,
        },
      ]);
    });
  }
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
        {turns.map((turn) => (
          <article
            className={turn.role === "user" ? styles.userMessage : styles.assistantMessage}
            key={turn.id}
          >
            {turn.ai && (
              <small>
                {turn.aiSources?.length
                  ? assistantCopy(locale).label
                  : assistantCopy(locale).labelWithoutSources}
              </small>
            )}
            {turn.aiFallback && <small role="status">{assistantCopy(locale).fallback}</small>}
            <p>{turn.text}</p>
            {turn.draftResult?.form ? (
              <NewJobForm
                locale={locale}
                {...turn.draftResult.form}
                initialDraft={
                  turn.draftResult.outcome.kind !== "UNAVAILABLE"
                    ? turn.draftResult.outcome.draft
                    : undefined
                }
                confirmDraft
              />
            ) : null}
            {turn.aiSources?.length ? (
              <ul aria-label={assistantCopy(locale).sources}>
                {turn.aiSources.map((source) => (
                  <li key={source.sourceId}>
                    <Link href={source.href}>{source.label}</Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {turn.aiFollowUps?.length ? (
              <ul className={styles.followUps}>
                {turn.aiFollowUps.map((question) => (
                  <li key={question}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        const form = document.getElementById("chat-form") as HTMLFormElement | null;
                        const field = form?.elements.namedItem("message");
                        if (field instanceof HTMLTextAreaElement) {
                          field.value = question;
                          form?.requestSubmit();
                        }
                      }}
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {turn.ai && <Link href={`/${locale}/ai-data`}>{assistantCopy(locale).data}</Link>}
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

        {pending ? (
          <p className={styles.thinking}>
            {drafting ? jobDraftCopy(locale).pending : copy.thinking}
          </p>
        ) : null}
      </div>

      <form id="chat-form" action={action} className={styles.chatComposer}>
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
        <div className={styles.composerButtons}>
          <button type="submit" disabled={pending}>
            {copy.send}
          </button>
          {canDraftJob ? (
            <button type="submit" formAction={draftAction} disabled={pending}>
              {jobDraftCopy(locale).create}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
