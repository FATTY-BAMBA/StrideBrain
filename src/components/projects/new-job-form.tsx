"use client";
import { TAIWAN_CITIES, cityLabel } from "@/modules/projects/domain/taiwan-cities";

import { useActionState, useState, useId } from "react";
import Link from "next/link";
import { createProjectAction } from "@/app/[locale]/projects/new/actions";
import { jobsCopy, categoryLabel } from "@/modules/localization/jobs";
import { projectSubtypeLabel } from "@/modules/localization/project-context";
import type { Locale } from "@/modules/localization/config";
import { JOB_FIXED_VALUES, type JobField } from "@/modules/projects/domain/job-input";
import type { JobActionState } from "@/modules/projects/application/job-action-state";
import type { ProjectClientOption } from "@/modules/projects/application/list-project-clients";
import type { JobDraft } from "@/modules/assistant/domain/job-draft";
import { jobDraftCopy } from "@/modules/localization/job-draft";
import { firmEntryLabel, type FirmLists } from "@/modules/firm-lists/domain/contracts";
import { areaInFirmUnit, areaUnitLabel } from "@/modules/firm-lists/domain/area-unit";
import styles from "./job-form.module.css";

export function NewJobForm({
  locale,
  idempotencyKey,
  businessKey,
  clientBusinessKey,
  catalog,
  clients,
  initialDraft,
  confirmDraft = false,
}: {
  locale: Locale;
  idempotencyKey: string;
  businessKey: string;
  clientBusinessKey: string;
  catalog: FirmLists;
  clients: readonly ProjectClientOption[];
  initialDraft?: JobDraft | undefined;
  confirmDraft?: boolean;
}) {
  const formId = useId();
  const copy = jobsCopy(locale);
  const [state, action, pending] = useActionState(createProjectAction, {} as JobActionState);
  const [values, setValues] = useState<Record<string, string>>({
    businessKey,
    clientBusinessKey,
    clientMode: initialDraft?.clientMode ?? (clients.length ? "existing" : "new"),
    ...initialDraft?.values,
    ...(initialDraft?.area
      ? { areaQuantity: areaInFirmUnit(initialDraft.area.squareMetres, catalog.areaDisplayUnit) }
      : {}),
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
        <label htmlFor={`${formId}-${key}`}>
          {key === "areaQuantity"
            ? locale === "zh-TW"
              ? `面積（${areaUnitLabel(catalog.areaDisplayUnit)}）`
              : `Area (${areaUnitLabel(catalog.areaDisplayUnit)})`
            : copy[key]}
        </label>
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
        {key === "areaQuantity" &&
        aiFields.includes(key) &&
        initialDraft?.area &&
        (initialDraft.area.unit.normalize("NFKC").trim() === "坪" ? "ping" : "m2") !==
          catalog.areaDisplayUnit ? (
          <small>
            {initialDraft.area.digits}{" "}
            {initialDraft.area.unit.normalize("NFKC").trim() === "坪" ? "坪" : "m²"} ={" "}
            {areaInFirmUnit(initialDraft.area.squareMetres, catalog.areaDisplayUnit)}{" "}
            {areaUnitLabel(catalog.areaDisplayUnit)}
          </small>
        ) : null}
        {error(key)}
      </div>
    );
  }
  function select(
    key: "subtype" | "clientMode" | "clientType" | "locationCity",
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
            {categoryLabel(locale, value, catalog.workCategories)}
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
      {Object.entries({ ...JOB_FIXED_VALUES, areaUnit: catalog.areaDisplayUnit }).map(
        ([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ),
      )}
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
            catalog.jobTypes
              .filter((entry) => entry.active)
              .map(
                ({ key }) => [key, projectSubtypeLabel(locale, key, catalog.jobTypes)!] as const,
              ),
          )}
          {field("areaQuantity", 19)}
          {select(
            "locationCity",
            TAIWAN_CITIES.map((city) => [city.key, cityLabel(locale, city.key)] as const),
          )}
          {field("locationDistrict", 120, true)}
        </div>
        <p className={styles.hint}>
          {copy.commercialClass} · {copy.taiwanDollar}
        </p>
        {categoryFields(
          "scopeCategoryIds",
          catalog.workCategories
            .filter((entry) => entry.active && entry.scopeSelectable)
            .map((entry) => entry.key),
        )}
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
                catalog.clientTypes
                  .filter((entry) => entry.active)
                  .map(
                    (entry) =>
                      [entry.key, firmEntryLabel(catalog.clientTypes, entry.key, locale)] as const,
                  ),
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
