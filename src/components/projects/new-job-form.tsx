"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createProjectAction } from "@/app/[locale]/projects/new/actions";
import { jobsCopy, categoryLabel } from "@/modules/localization/jobs";
import { projectSubtypeLabel } from "@/modules/localization/project-context";
import type { Locale } from "@/modules/localization/config";
import {
  CLIENT_TYPES,
  COMMERCIAL_CATEGORIES,
  JOB_SUBTYPES,
  SCOPE_CATEGORIES,
  type JobField,
} from "@/modules/projects/domain/job-input";
import type { JobActionState } from "@/modules/projects/application/job-action-state";
import styles from "./job-form.module.css";

export function NewJobForm({ locale, idempotencyKey }: { locale: Locale; idempotencyKey: string }) {
  const copy = jobsCopy(locale);
  const [state, action, pending] = useActionState(createProjectAction, {} as JobActionState);
  const [values, setValues] = useState<Record<string, string>>({
    comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
    areaUnit: "m2",
    currency: "TWD",
    clientMode: "new",
  });
  const [categories, setCategories] = useState<
    Record<"scopeCategoryIds" | "commercialCategoryIds", string[]>
  >({ scopeCategoryIds: [], commercialCategoryIds: [] });
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
    key: Exclude<JobField, "scopeCategoryIds" | "commercialCategoryIds" | "idempotencyKey">,
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
    key: "comparisonClass" | "subtype" | "areaUnit" | "currency" | "clientMode" | "clientType",
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
  function categoryFields(
    key: "scopeCategoryIds" | "commercialCategoryIds",
    options: readonly string[],
  ) {
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
              checked={categories[key].includes(value)}
              onChange={(event) => {
                const checked = event.target.checked;
                setCategories((current) => ({
                  ...current,
                  [key]: checked
                    ? [...current[key], value]
                    : current[key].filter((item) => item !== value),
                }));
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
      {state.message ? (
        <div role="alert" className={styles.error}>
          {copy[state.message]}
          {error("idempotencyKey")}
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
          {select("comparisonClass", [["COMMERCIAL_INTERIOR_FIT_OUT", copy.commercialClass]])}
          {select(
            "subtype",
            JOB_SUBTYPES.map((value) => [value, projectSubtypeLabel(locale, value)!] as const),
          )}
          {field("areaQuantity", 19)}
          {select("areaUnit", [["m2", copy.squareMetres]])}
          {select("currency", [["TWD", copy.taiwanDollar]])}
          {field("locationCity", 120)}
          {field("locationDistrict", 120, true)}
        </div>
        <div className={styles.grid}>
          {categoryFields("scopeCategoryIds", SCOPE_CATEGORIES)}
          {categoryFields("commercialCategoryIds", COMMERCIAL_CATEGORIES)}
        </div>
        <div className={styles.grid}>
          {select("clientMode", [
            ["new", copy.new],
            ["existing", copy.existing],
          ])}
          {field("clientBusinessKey", 128)}
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
        <p className={styles.hint}>{copy.clientKeyHelp}</p>
        <div className={styles.actions}>
          <button className="button button-primary" type="submit">
            {pending ? copy.pending : copy.submit}
          </button>
          <Link href={`/${locale}/projects`}>{copy.cancel}</Link>
        </div>
      </fieldset>
    </form>
  );
}
