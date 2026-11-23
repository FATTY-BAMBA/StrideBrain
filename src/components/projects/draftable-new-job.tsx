"use client";
import { useState, useTransition } from "react";
import type { Locale } from "@/modules/localization/config";
import { jobDraftCopy, jobDraftMessage } from "@/modules/localization/job-draft";
import { draftJobFromNewPage } from "@/app/[locale]/job-draft-actions";
import type {
  JobDraftActionState,
  JobDraftFormSeed,
} from "@/modules/assistant/application/job-draft-action-state";
import { NewJobForm } from "./new-job-form";
import styles from "./job-form.module.css";

export function DraftableNewJob({
  locale,
  initialForm,
  enabled,
}: {
  locale: Locale;
  initialForm: JobDraftFormSeed;
  enabled: boolean;
}) {
  const [result, setResult] = useState<JobDraftActionState>();
  const [pending, start] = useTransition();
  const copy = jobDraftCopy(locale);
  // A failed attempt never replaces a person's current form.
  const [filled, setFilled] = useState<JobDraftActionState>();
  const form = filled?.form ?? initialForm;
  const draft = filled && filled.outcome.kind !== "UNAVAILABLE" ? filled.outcome.draft : undefined;
  return (
    <>
      {enabled ? (
        <form
          className={styles.draftBox}
          action={(data) =>
            start(async () => {
              let next: JobDraftActionState;
              try {
                next = await draftJobFromNewPage(locale, data.get("text"));
              } catch {
                next = { outcome: { kind: "UNAVAILABLE", reason: "UNAVAILABLE" } };
              }
              setResult(next);
              if (next.outcome.kind !== "UNAVAILABLE") setFilled(next);
            })
          }
        >
          <label htmlFor="job-draft-text">{copy.label}</label>
          <textarea
            id="job-draft-text"
            name="text"
            maxLength={1000}
            rows={4}
            required
            disabled={pending}
            placeholder={copy.placeholder}
          />
          <button className={styles.primary} disabled={pending}>
            {pending ? copy.pending : copy.fill}
          </button>
        </form>
      ) : null}
      {result ? <p role="status">{jobDraftMessage(locale, result.outcome)}</p> : null}
      <NewJobForm key={form.idempotencyKey} locale={locale} {...form} initialDraft={draft} />
    </>
  );
}
