export const PROJECT_STAGES = [
  "DISCOVERY",
  "DESIGN",
  "QUOTE_REVIEW",
  "APPROVED",
  "PROCUREMENT",
  "CONSTRUCTION",
  "HANDOVER",
  "COMPLETE",
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];
export const EDITABLE_PROJECT_STAGES = PROJECT_STAGES.filter((stage) => stage !== "COMPLETE");
export type EditableProjectStage = (typeof EDITABLE_PROJECT_STAGES)[number];

export const JOB_FIXED_VALUES = Object.freeze({
  comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
  areaUnit: "m2",
  currency: "TWD",
});

// Canonical IDs already used by the comparison policy and reviewed taxonomy.
export const JOB_SUBTYPES = [
  "RETAIL_FLAGSHIP",
  "RETAIL_RENOVATION",
  "RETAIL_CONCEPT_STORE",
  "RETAIL_SHOWROOM",
] as const;
export const SCOPE_CATEGORIES = [
  "SELECTIVE_DEMOLITION",
  "PARTITIONS_CEILINGS",
  "CUSTOM_MILLWORK",
  "LIGHTING_ELECTRICAL",
  "IMPORTED_STONE",
  "SIGNAGE",
  "COORDINATION",
] as const;
export const COMMERCIAL_CATEGORIES = [
  "DEMOLITION_CEILING",
  "CUSTOM_MILLWORK",
  "LIGHTING_ELECTRICAL",
  "IMPORTED_STONE",
  "SIGNAGE",
  "COORDINATION",
] as const;
type ScopeCategory = (typeof SCOPE_CATEGORIES)[number];
type CommercialCategory = (typeof COMMERCIAL_CATEGORIES)[number];
const SCOPE_TO_COMMERCIAL: Readonly<Record<ScopeCategory, CommercialCategory>> = Object.freeze({
  SELECTIVE_DEMOLITION: "DEMOLITION_CEILING",
  PARTITIONS_CEILINGS: "DEMOLITION_CEILING",
  CUSTOM_MILLWORK: "CUSTOM_MILLWORK",
  LIGHTING_ELECTRICAL: "LIGHTING_ELECTRICAL",
  IMPORTED_STONE: "IMPORTED_STONE",
  SIGNAGE: "SIGNAGE",
  COORDINATION: "COORDINATION",
});

/** Called only after validating the canonical scope choices. No browser-supplied
 * commercial list can override this mapping. */
export function commercialCategoriesForScope(
  scopes: readonly ScopeCategory[],
): readonly CommercialCategory[] {
  return [...new Set(scopes.map((scope) => SCOPE_TO_COMMERCIAL[scope]))].sort();
}

/** The inverse of the creation mapping, for coverage of a past pricing category. */
export function scopesForCommercialCategory(categoryId: string): readonly ScopeCategory[] {
  return SCOPE_CATEGORIES.filter((scope) => SCOPE_TO_COMMERCIAL[scope] === categoryId);
}
export const CLIENT_TYPES = ["RETAIL", "CORPORATE", "HOSPITALITY"] as const;
export const JOB_FIELDS = [
  "businessKey",
  "name",
  "comparisonClass",
  "subtype",
  "areaQuantity",
  "areaUnit",
  "currency",
  "locationCity",
  "locationDistrict",
  "scopeCategoryIds",
  "clientMode",
  "clientBusinessKey",
  "clientName",
  "clientType",
  "idempotencyKey",
] as const;
export type JobField = (typeof JOB_FIELDS)[number];
export type FieldError = "required" | "invalid" | "tooLong" | "duplicate" | "clientUnavailable";
export type JobErrors = Partial<Record<JobField, FieldError>>;
export type CreateProjectInput = Readonly<{
  businessKey: string;
  name: string;
  comparisonClass: string;
  subtype: string;
  areaQuantity: string;
  areaUnit: string;
  currency: string;
  locationCity: string;
  locationDistrict: string;
  scopeCategoryIds: readonly string[];
  commercialCategoryIds: readonly string[];
  clientMode: "existing" | "new";
  clientBusinessKey: string;
  clientName: string;
  clientType: string;
  idempotencyKey: string;
}>;
export const BUSINESS_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
export const IDEMPOTENCY_KEY =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export function validateCreateProject(
  raw: unknown,
): { kind: "VALID"; input: CreateProjectInput } | { kind: "INVALID"; errors: JobErrors } {
  const values =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const errors: JobErrors = {};
  function text(key: JobField, max: number, required = true): string {
    const value = values[key];
    if (typeof value !== "string") {
      if (required || value != null) errors[key] = "required";
      return "";
    }
    const result = value.trim();
    if (!result && required) errors[key] = "required";
    else if (result.length > max) errors[key] = "tooLong";
    else if (/[\u0000-\u001f\u007f]/.test(result)) errors[key] = "invalid";
    return result;
  }
  function choice(key: JobField, allowed: readonly string[]): string {
    const value = text(key, 128);
    if (value && !allowed.includes(value)) errors[key] = "invalid";
    return value;
  }
  function categories(key: "scopeCategoryIds", allowed: readonly string[]): readonly string[] {
    const value = values[key];
    if (!Array.isArray(value) || !value.length) {
      errors[key] = "required";
      return [];
    }
    if (
      value.length > allowed.length ||
      value.some((v) => typeof v !== "string" || !allowed.includes(v)) ||
      new Set(value).size !== value.length
    ) {
      errors[key] = "invalid";
      return [];
    }
    return [...value].sort();
  }
  const clientMode = choice("clientMode", ["existing", "new"]) as "existing" | "new";
  const scopeCategoryIds = categories(
    "scopeCategoryIds",
    SCOPE_CATEGORIES,
  ) as readonly ScopeCategory[];
  const input: CreateProjectInput = {
    businessKey: text("businessKey", 128),
    name: text("name", 200),
    comparisonClass: choice("comparisonClass", [JOB_FIXED_VALUES.comparisonClass]),
    subtype: choice("subtype", JOB_SUBTYPES),
    areaQuantity: text("areaQuantity", 19),
    areaUnit: choice("areaUnit", [JOB_FIXED_VALUES.areaUnit]),
    currency: choice("currency", [JOB_FIXED_VALUES.currency]),
    locationCity: text("locationCity", 120),
    locationDistrict: text("locationDistrict", 120, false),
    scopeCategoryIds,
    commercialCategoryIds: commercialCategoriesForScope(scopeCategoryIds),
    clientMode,
    clientBusinessKey: text("clientBusinessKey", 128),
    clientName: text("clientName", 200, clientMode === "new"),
    clientType: clientMode === "new" ? choice("clientType", CLIENT_TYPES) : "",
    idempotencyKey: text("idempotencyKey", 36),
  };
  for (const key of ["businessKey", "clientBusinessKey"] as const)
    if (input[key] && !BUSINESS_KEY.test(input[key])) errors[key] = "invalid";
  // The static creation route owns this path segment.
  if (input.businessKey === "new") errors.businessKey = "invalid";
  if (
    input.areaQuantity &&
    (!/^\d{1,15}(\.\d{1,3})?$/.test(input.areaQuantity) || !/[1-9]/.test(input.areaQuantity))
  )
    errors.areaQuantity = "invalid";
  if (input.idempotencyKey && !IDEMPOTENCY_KEY.test(input.idempotencyKey))
    errors.idempotencyKey = "invalid";
  return Object.keys(errors).length ? { kind: "INVALID", errors } : { kind: "VALID", input };
}

export type UpdateStageInput = Readonly<{
  businessKey: string;
  stage: EditableProjectStage;
  expectedStage: ProjectStage;
  idempotencyKey: string;
}>;
export function validateStageUpdate(value: unknown): UpdateStageInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    typeof input.businessKey !== "string" ||
    !BUSINESS_KEY.test(input.businessKey) ||
    typeof input.idempotencyKey !== "string" ||
    !IDEMPOTENCY_KEY.test(input.idempotencyKey) ||
    !EDITABLE_PROJECT_STAGES.includes(input.stage as EditableProjectStage) ||
    !EDITABLE_PROJECT_STAGES.includes(input.expectedStage as EditableProjectStage)
  )
    return null;
  return {
    businessKey: input.businessKey,
    stage: input.stage as EditableProjectStage,
    expectedStage: input.expectedStage as ProjectStage,
    idempotencyKey: input.idempotencyKey,
  };
}
