"use client";
import { useState, useTransition } from "react";
import { changeFirmListAction } from "@/app/[locale]/settings/firm-list-actions";
import { firmListsCopy } from "@/modules/localization/firm-lists";
import type { Locale } from "@/modules/localization/config";
import type { FirmLists, FirmListEntry } from "@/modules/firm-lists/domain/contracts";
import type { FirmListChange } from "@/modules/firm-lists/domain/list-change";
type Settings = { lists: FirmLists; mappingLockedKeys: readonly string[] };
type Edit = Omit<
  Extract<FirmListChange, { kind: "JOB_TYPE" | "QUOTE_UNIT" | "WORK_CATEGORY" | "CLIENT_TYPE" }>,
  "expectedRevision" | "idempotencyKey"
>;
export function FirmListSettings({ initial, locale }: { initial: Settings; locale: Locale }) {
  const [settings, setSettings] = useState(initial),
    [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  const c = firmListsCopy(locale),
    lists = settings.lists;
  function save(value: Edit | { kind: "AREA_UNIT"; areaDisplayUnit: "m2" | "ping" }, key: string) {
    start(async () => {
      const result = await changeFirmListAction(locale, {
        ...value,
        expectedRevision: lists.revision,
        idempotencyKey: key,
      });
      setMessage(
        result.result.kind === "LIMIT" && value.kind === "CLIENT_TYPE"
          ? c.clientTypeLimit
          : c[result.result.kind],
      );
      if (result.settings) setSettings(result.settings);
    });
  }
  return (
    <section className="records-panel" aria-busy={pending}>
      <h2>{c.title}</h2>
      <p>{c.description}</p>
      {message && <p role="status">{message}</p>}
      <AreaSetting
        key={lists.revision}
        unit={lists.areaDisplayUnit}
        locale={locale}
        pending={pending}
        save={save}
      />
      {(["JOB_TYPE", "WORK_CATEGORY", "QUOTE_UNIT", "CLIENT_TYPE"] as const).map((kind) => {
        const entries =
          kind === "JOB_TYPE"
            ? lists.jobTypes
            : kind === "WORK_CATEGORY"
              ? lists.workCategories
              : kind === "CLIENT_TYPE"
                ? lists.clientTypes
                : lists.quoteUnits;
        return (
          <section key={kind} className="firm-list-group">
            <h3>{c[kind]}</h3>
            {[...entries, null].map((entry) => (
              <details key={`${lists.revision}-${entry?.key ?? "new"}`} className="firm-list-entry">
                <summary>
                  {entry ? (locale === "zh-TW" ? entry.nameZhTw : entry.nameEn) : c.add}
                  {entry && !entry.active && ` · ${c.retired}`}
                </summary>
                <EntryForm
                  kind={kind}
                  entry={entry}
                  lists={lists}
                  locked={!!entry && settings.mappingLockedKeys.includes(entry.key)}
                  locale={locale}
                  pending={pending}
                  save={save}
                />
              </details>
            ))}
          </section>
        );
      })}
    </section>
  );
}
function AreaSetting({
  unit,
  locale,
  pending,
  save,
}: {
  unit: "m2" | "ping";
  locale: Locale;
  pending: boolean;
  save: (v: { kind: "AREA_UNIT"; areaDisplayUnit: "m2" | "ping" }, key: string) => void;
}) {
  const c = firmListsCopy(locale),
    [value, setValue] = useState(unit),
    [key] = useState(() => crypto.randomUUID());
  return (
    <form
      className="records-filter"
      onSubmit={(e) => {
        e.preventDefault();
        save({ kind: "AREA_UNIT", areaDisplayUnit: value }, key);
      }}
    >
      <label>
        {c.area}
        <select
          disabled={pending}
          value={value}
          onChange={(e) => setValue(e.target.value as "m2" | "ping")}
        >
          <option value="m2">m²</option>
          <option value="ping">坪</option>
        </select>
      </label>
      <button disabled={pending || value === unit}>{pending ? c.saving : c.save}</button>
    </form>
  );
}
function EntryForm({
  kind,
  entry,
  lists,
  locked,
  locale,
  pending,
  save,
}: {
  kind: Edit["kind"];
  entry: FirmListEntry | null;
  lists: FirmLists;
  locked: boolean;
  locale: Locale;
  pending: boolean;
  save: (v: Edit, key: string) => void;
}) {
  const c = firmListsCopy(locale),
    type = lists.jobTypes.find((v) => v.key === entry?.key),
    category = lists.workCategories.find((v) => v.key === entry?.key);
  const [value, setValue] = useState<Edit>({
    kind,
    key: entry?.key ?? null,
    nameEn: entry?.nameEn ?? "",
    nameZhTw: entry?.nameZhTw ?? "",
    sortOrder:
      entry?.sortOrder ??
      lists[
        kind === "JOB_TYPE"
          ? "jobTypes"
          : kind === "WORK_CATEGORY"
            ? "workCategories"
            : kind === "CLIENT_TYPE"
              ? "clientTypes"
              : "quoteUnits"
      ].length,
    active: entry?.active ?? true,
    relatedKeys: kind === "JOB_TYPE" ? (type?.relatedKeys ?? []) : [],
    ...(kind === "WORK_CATEGORY" ? { pricedUnderKey: category?.pricedUnderKey ?? null } : {}),
  });
  const [key] = useState(() => crypto.randomUUID());
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(value, key);
      }}
    >
      <div className="records-fields">
        {(["nameZhTw", "nameEn"] as const).map((field) => (
          <label key={field}>
            {c[field]}
            <input
              value={value[field]}
              required
              maxLength={kind === "CLIENT_TYPE" ? 40 : 200}
              disabled={pending}
              onChange={(e) => setValue({ ...value, [field]: e.target.value })}
            />
          </label>
        ))}
        <label>
          {c.sortOrder}
          <input
            type="number"
            min={0}
            max={10000}
            step={1}
            required
            disabled={pending}
            value={value.sortOrder}
            onChange={(e) => setValue({ ...value, sortOrder: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="firm-list-check">
        <input
          type="checkbox"
          checked={value.active}
          disabled={pending}
          onChange={(e) => setValue({ ...value, active: e.target.checked })}
        />
        {c.active}
      </label>
      {kind === "WORK_CATEGORY" && (
        <>
          <label className="firm-list-mapping">
            {c.pricedUnder}
            <select
              disabled={pending || locked}
              value={value.pricedUnderKey ?? ""}
              onChange={(e) => setValue({ ...value, pricedUnderKey: e.target.value || null })}
            >
              <option value="">{c.ownPrice}</option>
              {lists.workCategories
                .filter((v) => v.key !== entry?.key && (v.active || v.key === value.pricedUnderKey))
                .map((v) => (
                  <option key={v.key} value={v.key}>
                    {locale === "zh-TW" ? v.nameZhTw : v.nameEn}
                  </option>
                ))}
            </select>
          </label>
          {locked && <p>{c.locked}</p>}
          {category && !category.scopeSelectable && <p>{c.pricingOnly}</p>}
        </>
      )}
      {kind === "JOB_TYPE" && (
        <fieldset>
          <legend>{c.related}</legend>
          {lists.jobTypes
            .filter((v) => v.key !== entry?.key && (v.active || value.relatedKeys.includes(v.key)))
            .map((v) => (
              <label key={v.key} className="firm-list-check">
                <input
                  type="checkbox"
                  disabled={pending}
                  checked={value.relatedKeys.includes(v.key)}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      relatedKeys: e.target.checked
                        ? [...value.relatedKeys, v.key]
                        : value.relatedKeys.filter((key) => key !== v.key),
                    })
                  }
                />
                {locale === "zh-TW" ? v.nameZhTw : v.nameEn}
              </label>
            ))}
        </fieldset>
      )}
      <button disabled={pending}>{pending ? c.saving : c.save}</button>
    </form>
  );
}
