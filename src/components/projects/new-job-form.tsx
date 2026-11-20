"use client";

import { useActionState, useState } from "react";
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
import styles from "./job-form.module.css";

export function NewJobForm({
  locale,
  idempotencyKey,
  businessKey,
  clients,
}: {
  locale: Locale;
  idempotencyKey: string;
  businessKey: string;
  clients: readonly ProjectClientOption[];
}) {
  const copy = jobsCopy(locale);
  const [state, action, pending] = useActionState(createProjectAction, {} as JobActionState);
  const [values, setValues] = useState<Record<string, string>>({
    businessKey,
    clientMode: clients.length ? "existing" : "new",
  });
  const [existingClient, setExistingClient] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  function change(key: JobField, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function error(key: JobField) {
    const code = state.errors?.[key];
    return code ? (
      <p id={`${key}-error`} className={styles.error}>
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
        <label htmlFor={key}>{copy[key]}</label>
        <input
          id={key}
          name={key}
          value={values[key] ?? ""}
          onChange={(event) => change(key, event.target.value)}
          maxLength={maxLength}
          required={!optional}
          inputMode={key === "areaQuantity" ? "decimal" : "text"}
          aria-invalid={!!state.errors?.[key]}
          aria-describedby={state.errors?.[key] ? `${key}-error` : undefined}
        />
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
        <label htmlFor={key}>{copy[key]}</label>
        <select
          id={key}
          name={key}
          value={values[key] ?? ""}
          onChange={(event) => change(key, event.target.value)}
          required
          aria-invalid={!!state.errors?.[key]}
          aria-describedby={state.errors?.[key] ? `${key}-error` : undefined}
        >
          <option value="">{copy.select}</option>
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {error(key)}
      </div>
    );
  }
  function categoryFields(key: "scopeCategoryIds", options: readonly string[]) {
    return (
      <fieldset
        className={styles.categories}
        aria-describedby={state.errors?.[key] ? `${key}-error` : undefined}
        aria-invalid={!!state.errors?.[key]}
      >
        <legend>{copy[key]}</legend>
        {options.map((value) => (
          <label key={value} className={styles.checkbox}>
            <input
              type="checkbox"
              name={key}
              value={value}
              checked={categories.includes(value)}
              onChange={(event) => {
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
    <form action={action} noValidate className={styles.form} aria-busy={pending}>
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
              <label htmlFor="clientBusinessKey">{copy.existingClient}</label>
              <select
                id="clientBusinessKey"
                name="clientBusinessKey"
                value={existingClient}
                onChange={(event) => setExistingClient(event.target.value)}
                required
                aria-invalid={!!state.errors?.clientBusinessKey}
                aria-describedby={
                  state.errors?.clientBusinessKey ? "clientBusinessKey-error" : undefined
                }
              >
                <option value="">{copy.select}</option>
                {clients.map((client) => (
                  <option key={client.businessKey} value={client.businessKey}>
                    {client.name} ({client.businessKey})
                  </option>
                ))}
              </select>
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
            {pending ? copy.pending : copy.submit}
          </button>
          <Link href={`/${locale}/projects`}>{copy.cancel}</Link>
        </div>
      </fieldset>
    </form>
  );
}
