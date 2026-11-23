"use client";

import { useActionState, useState, useId } from "react";
import Link from "next/link";
import { createProjectAction } from "@/app/[locale]/projects/new/actions";
import { jobsCopy, categoryLabel } from "@/modules/localization/jobs";
import { projectSubtypeLabel } from "@/modules/localization/project-context";
import type { Locale } from "@/modules/localization/config";
import {
  CLIENT_TYPES,
  JOB_FIXED_VALUES,
  JOB_SUBTYPES,
  SCOPE_CATEGORIES,
  type JobField,
} from "@/modules/projects/domain/job-input";
import type { JobActionState } from "@/modules/projects/application/job-action-state";
import type { ProjectClientOption } from "@/modules/projects/application/list-project-clients";
import type { JobDraft } from "@/modules/assistant/domain/job-draft";
import { jobDraftCopy } from "@/modules/localization/job-draft";
import styles from "./job-form.module.css";

export function NewJobForm({
  locale,
  idempotencyKey,
  businessKey,
  clients,
  initialDraft,
  confirmDraft = false,
}: {
  locale: Locale;
  idempotencyKey: string;
  businessKey: string;
  clients: readonly ProjectClientOption[];
  initialDraft?: JobDraft | undefined;
  confirmDraft?: boolean;
}) {
  const formId = useId();
  const copy = jobsCopy(locale);
  const [state, action, pending] = useActionState(createProjectAction, {} as JobActionState);
  const [values, setValues] = useState<Record<string, string>>({
    businessKey,
    clientMode: initialDraft?.clientMode ?? (clients.length ? "existing" : "new"),
    ...initialDraft?.values,
  });
  const [existingClient, setExistingClient] = useState(initialDraft?.clientBusinessKey ?? "");
  const [categories, setCategories] = useState<readonly string[]>(
    initialDraft?.scopeCategoryIds ?? [],
  );
  const [aiFields, setAiFields] = useState<readonly JobField[]>(() => [
    ...(Object.keys(initialDraft?.values ?? {}) as JobField[]),
    ...(initialDraft?.scopeCategoryIds.length ? ["scopeCategoryIds" as const] : []),
    ...(initialDraft?.values.clientName
      ? [
          "clientMode" as const,
          ...(initialDraft.clientBusinessKey ? ["clientBusinessKey" as const] : []),
        ]
      : []),
  ]);
  const mark = (key: JobField) =>
    aiFields.includes(key) ? (
      <small className={styles.aiMark}>{jobDraftCopy(locale).marked}</small>
    ) : null;
  const [edited, setEdited] = useState<{ response: JobActionState; fields: readonly JobField[] }>({
    response: state,
    fields: [],
  });
  function clearError(key: JobField) {
    setAiFields((current) => current.filter((field) => field !== key));
    setEdited((current) => ({
      response: state,
      fields: [...(current.response === state ? current.fields : []), key],
    }));
  }
  function errorCode(key: JobField) {
    return edited.response === state && edited.fields.includes(key)
      ? undefined
      : state.errors?.[key];
  }
  function change(key: JobField, value: string) {
    clearError(key);
    setValues((current) => ({ ...current, [key]: value }));
  }
  function error(key: JobField) {
    const code = errorCode(key);
    return code ? (
      <p id={`${formId}-${key}-error`} className={styles.error}>
        {copy[code]}
      </p>
    ) : null;
  }
  function field(
    key: Exclude<JobField, "scopeCategoryIds" | "idempotencyKey">,
    maxLength: number,
    optional = false,
  ) {
    return (
      <div className={styles.field} key={key}>
        <label htmlFor={`${formId}-${key}`}>{copy[key]}</label>
        <input
          id={`${formId}-${key}`}
          name={key}
          value={values[key] ?? ""}
          onChange={(event) => change(key, event.target.value)}
          maxLength={maxLength}
          required={!optional}
          inputMode={key === "areaQuantity" ? "decimal" : "text"}
          aria-invalid={!!errorCode(key)}
          aria-describedby={errorCode(key) ? `${formId}-${key}-error` : undefined}
        />
        {mark(key)}
        {key === "areaQuantity" && aiFields.includes(key) && initialDraft?.area ? (
          <small>
            {initialDraft.area.digits} {initialDraft.area.unit} = {initialDraft.area.squareMetres}{" "}
            m²
          </small>
        ) : null}
        {error(key)}
      </div>
    );
  }
  function select(
    key: "subtype" | "clientMode" | "clientType",
    options: readonly (readonly [string, string])[],
  ) {
    return (
      <div className={styles.field} key={key}>
        <label htmlFor={`${formId}-${key}`}>{copy[key]}</label>
        <select
          id={`${formId}-${key}`}
          name={key}
          value={values[key] ?? ""}
          onChange={(event) => change(key, event.target.value)}
          required
          aria-invalid={!!errorCode(key)}
          aria-describedby={errorCode(key) ? `${formId}-${key}-error` : undefined}
        >
          <option value="">{copy.select}</option>
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {mark(key)}
        {error(key)}
      </div>
    );
  }
  function categoryFields(key: "scopeCategoryIds", options: readonly string[]) {
    return (
      <fieldset
        className={styles.categories}
        aria-describedby={errorCode(key) ? `${formId}-${key}-error` : undefined}
        aria-invalid={!!errorCode(key)}
      >
        <legend>{copy[key]}</legend>
        {mark(key)}
        {options.map((value) => (
          <label key={value} className={styles.checkbox}>
            <input
              type="checkbox"
              name={key}
              value={value}
              checked={categories.includes(value)}
              onChange={(event) => {
                clearError(key);
                const checked = event.target.checked;
                setCategories((current) =>
                  checked ? [...current, value] : current.filter((item) => item !== value),
                );
              }}
            />
            {categoryLabel(locale, value)}
          </label>
        ))}
        {error(key)}
      </fieldset>
    );
  }
  return (
    <form
      action={action}
      noValidate
      className={styles.form}
      aria-busy={pending}
      onReset={(event) => event.preventDefault()}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {Object.entries(JOB_FIXED_VALUES).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state.message ? (
        <div role="alert" className={styles.error}>
          {copy[state.message]}
          {error("idempotencyKey")}
          {error("comparisonClass")}
          {error("areaUnit")}
          {error("currency")}
        </div>
      ) : null}
      <fieldset disabled={pending} className={styles.body}>
        <div className={styles.grid}>
          {field("businessKey", 128)}
          {field("name", 200)}
        </div>
        <p className={styles.hint}>
          {copy.keyHelp} {copy.nameHelp}
        </p>
        <div className={styles.grid}>
          {select(
            "subtype",
            JOB_SUBTYPES.map((value) => [value, projectSubtypeLabel(locale, value)!] as const),
          )}
          {field("areaQuantity", 19)}
          {field("locationCity", 120)}
          {field("locationDistrict", 120, true)}
        </div>
        <p className={styles.hint}>
          {copy.commercialClass} · {copy.taiwanDollar}
        </p>
        {categoryFields("scopeCategoryIds", SCOPE_CATEGORIES)}
        <div className={styles.grid}>
          {select("clientMode", [
            ["new", copy.new],
            ["existing", copy.existing],
          ])}
          {values.clientMode === "existing" ? (
            <div className={styles.field}>
              <label htmlFor={`${formId}-clientBusinessKey`}>{copy.existingClient}</label>
              <select
                id={`${formId}-clientBusinessKey`}
                name="clientBusinessKey"
                value={existingClient}
                onChange={(event) => {
                  clearError("clientBusinessKey");
                  setExistingClient(event.target.value);
                }}
                required
                aria-invalid={!!errorCode("clientBusinessKey")}
                aria-describedby={
                  errorCode("clientBusinessKey") ? `${formId}-clientBusinessKey-error` : undefined
                }
              >
                <option value="">{copy.select}</option>
                {clients.map((client) => (
                  <option key={client.businessKey} value={client.businessKey}>
                    {client.name} ({client.businessKey})
                  </option>
                ))}
              </select>
              {mark("clientBusinessKey")}
              {error("clientBusinessKey")}
            </div>
          ) : (
            field("clientBusinessKey", 128)
          )}
          {values.clientMode === "new" ? (
            <>
              {field("clientName", 200)}
              {select(
                "clientType",
                CLIENT_TYPES.map((value) => [value, copy[value]] as const),
              )}
            </>
          ) : null}
        </div>
        {values.clientMode === "new" ? <p className={styles.hint}>{copy.clientKeyHelp}</p> : null}
        <div className={styles.actions}>
          <button className={styles.primary} type="submit">
            {pending ? copy.pending : confirmDraft ? jobDraftCopy(locale).confirm : copy.submit}
          </button>
          <Link href={`/${locale}/projects`}>{copy.cancel}</Link>
        </div>
      </fieldset>
    </form>
  );
}
