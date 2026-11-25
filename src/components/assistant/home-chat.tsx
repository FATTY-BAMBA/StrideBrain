"use client";

import Link from "next/link";
import { assistantCopy } from "@/modules/localization/assistant";
import { Fragment, useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { askHomeAction } from "@/app/[locale]/home-chat-actions";
import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts";
import type { Locale } from "@/modules/localization/config";
import styles from "../demo-value/home-chat.module.css";
import type { HomeChatTurn } from "@/modules/home-intelligence/chat-contracts";
import type { JobDraftActionState } from "@/modules/assistant/application/job-draft-action-state";
import { draftJobFromHome } from "@/app/[locale]/job-draft-actions";
import { jobDraftCopy, jobDraftMessage } from "@/modules/localization/job-draft";
import { NewJobForm } from "@/components/projects/new-job-form";

export function HomeChat({
  locale,
  projectKey,
  canDraftJob = false,
  quoteHasUnsavedChanges = false,
  jobPanelOpen,
}: {
  locale: Locale;
  projectKey?: string | undefined;
  canDraftJob?: boolean;
  quoteHasUnsavedChanges?: boolean;
  /** Omitted on Home; only the job panel has a bounded, scrolling thread. */
  jobPanelOpen?: boolean;
}) {
  const id = useId(),
    formRef = useRef<HTMLFormElement>(null),
    threadRef = useRef<HTMLDivElement>(null);
  const [openDraft, setOpenDraft] = useState<string | null>(null);
  const [state, action, asking] = useActionState(askHomeAction, initialHomeChatState);
  const [drafting, startDraft] = useTransition();
  const pending = asking || drafting;
  type DraftTurn = HomeChatTurn & { draftResult?: JobDraftActionState; draftRequest?: string };
  const [draftTurns, setDraftTurns] = useState<readonly DraftTurn[]>([]);
  // Drafts stay in this client component, never in the question action's history.
  const turns: readonly DraftTurn[] = [...state.turns, ...draftTurns].sort(
    (a, b) => (Number(a.id.split("-").at(-1)) || 0) - (Number(b.id.split("-").at(-1)) || 0),
  );
  const latestTurnId = turns.at(-1)?.id;
  useEffect(() => {
    if (jobPanelOpen && threadRef.current) {
      // Scroll only this region, without moving keyboard focus or the page.
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [jobPanelOpen, latestTurnId, pending]);
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
      const draftId = `draft-assistant-${Date.now()}`;
      if (result.form) setOpenDraft(draftId);
      setDraftTurns((current) => [
        ...current,
        {
          id: draftId,
          role: "assistant",
          text: jobDraftMessage(locale, result.outcome),
          draftResult: result,
          draftRequest: text,
        },
      ]);
    });
  }
  const copy =
    locale === "zh-TW"
      ? {
          label: "詢問 StrideBrain",
          thread: "此專案的對話",
          placeholder: projectKey ? "這個專案的報價狀態如何？" : "我們以前做過旗艦店整修嗎？",
          savedDraft: "回答依據最後儲存的草稿。",
          send: "提問",
          thinking: "正在查找公司紀錄…",
        }
      : {
          label: "Ask StrideBrain",
          thread: "Conversation about this job",
          placeholder: projectKey
            ? "What is this job's quote status?"
            : "Have we renovated a flagship store before?",
          savedDraft: "Answers use the last saved draft.",
          send: "Ask",
          thinking: "Checking company records…",
        };

  return (
    <section className={styles.chat} aria-label={copy.label}>
      <label className={styles.chatLabel} htmlFor={`${id}-message`}>
        {copy.label}
      </label>
      <div
        ref={threadRef}
        className={
          jobPanelOpen === undefined
            ? styles.chatThread
            : `${styles.chatThread} ${styles.jobThread}`
        }
        aria-live="polite"
        role={jobPanelOpen === undefined ? undefined : "region"}
        aria-label={jobPanelOpen === undefined ? undefined : copy.thread}
        tabIndex={jobPanelOpen === undefined ? undefined : 0}
      >
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
            {!turn.draftResult?.form ? (
              <p>
                {turn.text.split("\n").map((line, index, lines) => (
                  <Fragment key={index}>
                    <span className={styles.answerLine}>{line}</span>
                    {index < lines.length - 1 ? "\n" : ""}
                  </Fragment>
                ))}
              </p>
            ) : null}
            {turn.draftResult?.form ? (
              <div className={styles.draftCard}>
                <button
                  type="button"
                  className={styles.draftToggle}
                  aria-expanded={openDraft === turn.id}
                  aria-controls={`${id}-${turn.id}`}
                  onClick={() => setOpenDraft(openDraft === turn.id ? null : turn.id)}
                >
                  {turn.draftRequest}
                </button>
                <div id={`${id}-${turn.id}`} hidden={openDraft !== turn.id}>
                  <p>{turn.text}</p>
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
                </div>
              </div>
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
                        const form = formRef.current;
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

      <form ref={formRef} action={action} className={styles.chatComposer}>
        <input type="hidden" name="locale" value={locale} />
        {projectKey ? <input type="hidden" name="projectKey" value={projectKey} /> : null}
        {quoteHasUnsavedChanges && (
          <p role="status" className={styles.savedDraftNotice}>
            {copy.savedDraft}
          </p>
        )}
        <textarea
          id={`${id}-message`}
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
