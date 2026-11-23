import { IDEMPOTENCY_KEY } from "@/modules/projects/domain/job-input";
import { AREA_UNITS, type AreaDisplayUnit } from "./area-unit";
import type { FirmLists } from "./contracts";
import { validPricingRelationship } from "./work-categories";

type ChangeIdentity = Readonly<{ expectedRevision: string; idempotencyKey: string }>;
export type FirmListChange = ChangeIdentity &
  (
    | Readonly<{ kind: "AREA_UNIT"; areaDisplayUnit: AreaDisplayUnit }>
    | Readonly<{
        kind: "JOB_TYPE" | "QUOTE_UNIT" | "WORK_CATEGORY";
        key: string | null;
        nameEn: string;
        nameZhTw: string;
        sortOrder: number;
        active: boolean;
        relatedKeys: readonly string[];
        pricedUnderKey?: string | null;
      }>
  );
export type FirmListValidation =
  | Readonly<{ kind: "VALID"; input: FirmListChange }>
  | Readonly<{ kind: "INVALID"; fields: readonly string[] }>;

const boundedText = (value: unknown, maximum: number): value is string =>
  typeof value === "string" &&
  !!value.trim() &&
  value.length <= maximum &&
  !/[\u0000-\u001f\u007f]/.test(value);

/** Keys are immutable: null adds an entry with a server-generated key; a key edits that entry. */
export function validateFirmListChange(raw: unknown): FirmListValidation {
  const invalid = (...fields: string[]): FirmListValidation => ({ kind: "INVALID", fields });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return invalid();
  const value = raw as Record<string, unknown>;
  if (
    typeof value.expectedRevision !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.expectedRevision) ||
    typeof value.idempotencyKey !== "string" ||
    !IDEMPOTENCY_KEY.test(value.idempotencyKey)
  )
    return invalid();
  const identity = {
    expectedRevision: value.expectedRevision,
    idempotencyKey: value.idempotencyKey,
  };
  if (value.kind === "AREA_UNIT") {
    if (
      Object.keys(value).some(
        (key) => !["kind", "areaDisplayUnit", "expectedRevision", "idempotencyKey"].includes(key),
      ) ||
      !AREA_UNITS.includes(value.areaDisplayUnit as AreaDisplayUnit)
    )
      return invalid("areaDisplayUnit");
    return {
      kind: "VALID",
      input: {
        ...identity,
        kind: value.kind,
        areaDisplayUnit: value.areaDisplayUnit as AreaDisplayUnit,
      },
    };
  }
  if (
    !["JOB_TYPE", "QUOTE_UNIT", "WORK_CATEGORY"].includes(String(value.kind)) ||
    Object.keys(value).some(
      (key) =>
        ![
          "kind",
          "key",
          "nameEn",
          "nameZhTw",
          "sortOrder",
          "active",
          "relatedKeys",
          "pricedUnderKey",
          "expectedRevision",
          "idempotencyKey",
        ].includes(key),
    )
  )
    return invalid();
  const fields: string[] = [];
  if (value.key !== null && !boundedText(value.key, 128)) fields.push("key");
  for (const field of ["nameEn", "nameZhTw"] as const)
    if (!boundedText(value[field], 200)) fields.push(field);
  if (
    typeof value.sortOrder !== "number" ||
    !Number.isInteger(value.sortOrder) ||
    value.sortOrder < 0 ||
    value.sortOrder > 10000
  )
    fields.push("sortOrder");
  if (typeof value.active !== "boolean") fields.push("active");
  if (
    !Array.isArray(value.relatedKeys) ||
    value.relatedKeys.length > 500 ||
    value.relatedKeys.some((key) => !boundedText(key, 128) || key === value.key) ||
    new Set(value.relatedKeys).size !== value.relatedKeys.length ||
    (value.kind !== "JOB_TYPE" && value.relatedKeys.length)
  )
    fields.push("relatedKeys");
  if (
    value.kind === "WORK_CATEGORY"
      ? value.pricedUnderKey !== null && !boundedText(value.pricedUnderKey, 128)
      : value.pricedUnderKey !== undefined
  )
    fields.push("pricedUnderKey");
  if (fields.length) return invalid(...fields);
  return {
    kind: "VALID",
    input: {
      ...identity,
      kind: value.kind as "JOB_TYPE" | "QUOTE_UNIT" | "WORK_CATEGORY",
      key: value.key as string | null,
      nameEn: (value.nameEn as string).trim(),
      nameZhTw: (value.nameZhTw as string).trim(),
      sortOrder: value.sortOrder as number,
      active: value.active as boolean,
      relatedKeys: [...(value.relatedKeys as string[])].sort(),
      ...(value.kind === "WORK_CATEGORY"
        ? { pricedUnderKey: value.pricedUnderKey as string | null }
        : {}),
    },
  };
}

export function validateFirmListReferences(
  input: FirmListChange,
  lists: FirmLists,
): readonly string[] {
  if (input.kind === "WORK_CATEGORY")
    return validPricingRelationship(lists.workCategories, input.key, input.pricedUnderKey ?? null)
      ? []
      : ["pricedUnderKey"];
  if (input.kind !== "JOB_TYPE") return [];
  const previous = lists.jobTypes.find((entry) => entry.key === input.key);
  return input.relatedKeys.some(
    (key) =>
      !lists.jobTypes.some(
        (entry) => entry.key === key && (entry.active || previous?.relatedKeys.includes(key)),
      ),
  )
    ? ["relatedKeys"]
    : [];
}
