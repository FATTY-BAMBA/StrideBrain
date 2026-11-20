"use client";

import { useActionState, useId, useState } from "react";
import { updateProjectStageAction } from "@/app/[locale]/projects/actions";
import type { Locale } from "@/modules/localization/config";
import { jobsCopy, projectStageLabel } from "@/modules/localization/jobs";
import { PROJECT_STAGES, type ProjectStage } from "@/modules/projects/domain/job-input";
import type { JobActionState } from "@/modules/projects/application/job-action-state";
import styles from "./project-list.module.css";

export function ProjectStageForm({
  locale,
  businessKey,
  stage,
  idempotencyKey,
}: {
  locale: Locale;
  businessKey: string;
  stage: ProjectStage;
  idempotencyKey: string;
}) {
  const copy = jobsCopy(locale);
  const id = useId();
  const [selected, setSelected] = useState(stage);
  const [state, action, pending] = useActionState(updateProjectStageAction, {} as JobActionState);
  return (
    <form action={action} className={styles.stageForm} aria-busy={pending}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessKey" value={businessKey} />
      <input type="hidden" name="expectedStage" value={stage} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <label htmlFor={id}>{copy.stage}</label>
      <select
        id={id}
        name="stage"
        value={selected}
        onChange={(event) => setSelected(event.target.value as ProjectStage)}
        disabled={pending}
      >
        {PROJECT_STAGES.map((value) => (
          <option key={value} value={value}>
            {projectStageLabel(locale, value)}
          </option>
        ))}
      </select>
      <button type="submit" className={styles.stageButton} disabled={pending || selected === stage}>
        {pending ? copy.pending : copy.updateStage}
      </button>
      {state.message ? (
        <p role={state.message === "updated" ? "status" : "alert"}>{copy[state.message]}</p>
      ) : null}
    </form>
  );
}
