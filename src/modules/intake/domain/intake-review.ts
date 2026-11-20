/**
 * Review-only import boundary. No database writes, storage keys, tenant IDs,
 * approval tokens, or browser-selectable authority are accepted here.
 * A future server-side staging/commit service must derive tenant and reviewer
 * identity from RuntimeContext and verify uploaded bytes independently.
 */
export const INTAKE_REVIEW_VERSION = "intake-review.v0.1" as const;
export const INTAKE_MAX_SOURCE_BYTES = 10 * 1024 * 1024;
export const INTAKE_MAX_ROWS = 2000;

export type IntakeSourceKind = "CSV" | "XLSX";
export type IntakeObservationType =
  | "QUOTED_PRICE"
  | "SUPPLIER_OFFER"
  | "FORECAST_DIRECT_COST"
  | "RECONCILED_ACTUAL_COST"
  | "UNCLASSIFIED";

export type IntakeSource = Readonly<{
  kind: IntakeSourceKind;
  /** Checksum must eventually be recomputed from quarantined bytes server-side. */
  sha256: string;
  byteLength: number;
}>;

export type IntakeProject = Readonly<{
  businessKey: string;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  completedAt?: string;
  comparisonClass: string;
  subtype: string;
  locationCity: string;
  areaQuantity: string;
  areaUnit: "m2";
  currency: "TWD";
}>;

export type IntakeFinancialRow = Readonly<{
  sourceRow: number;
  categoryId: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
}>;

export type IntakeFinancialRecord = Readonly<{
  observationType: IntakeObservationType;
  versionNumber: number;
  /** Human-supplied claim must not itself create financial authority. */
  reconciledAt?: string;
  amountBeforeTax: string;
  rows: readonly IntakeFinancialRow[];
}>;

export type IntakeDraft = Readonly<{
  source: IntakeSource;
  project: IntakeProject;
  financialRecords: readonly IntakeFinancialRecord[];
}>;

export type IntakeIssueCode =
  | "INVALID_SOURCE"
  | "SOURCE_TOO_LARGE"
  | "INVALID_PROJECT"
  | "INVALID_AREA"
  | "TOO_MANY_ROWS"
  | "NO_FINANCIAL_RECORDS"
  | "UNCLASSIFIED_OBSERVATION"
  | "INVALID_RECONCILED_ACTUAL"
  | "INVALID_VERSION"
  | "INVALID_ROW_NUMBER"
  | "DUPLICATE_SOURCE_ROW"
  | "UNKNOWN_CATEGORY"
  | "INVALID_DESCRIPTION"
  | "FORMULA_LIKE_DESCRIPTION"
  | "INVALID_QUANTITY"
  | "INVALID_UNIT"
  | "INVALID_UNIT_PRICE"
  | "INVALID_AMOUNT"
  | "LINE_AMOUNT_MISMATCH"
  | "TOTAL_MISMATCH";

export type IntakeIssue = Readonly<{
  code: IntakeIssueCode;
  location: string;
}>;

export type IntakeReview = Readonly<{
  version: typeof INTAKE_REVIEW_VERSION;
  state: "READY_FOR_HUMAN_REVIEW" | "NEEDS_CORRECTION";
  issues: readonly IntakeIssue[];
  /** Readiness here is not an authorization or permission to persist. */
  requiresServerAuthorizationAndApproval: true;
}>;

const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const SAFE_SHA256 = /^[a-f0-9]{64}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FORMULA_PREFIX = /^[\s]*[=+@\-\t\r]/;

/** Exact fixed-point parsing; financial calculations must never use JS floats. */
function scaledAmount(value: string, places: number): bigint | null {
  if (!/^(0|[1-9]\d{0,12})(?:\.\d+)?$/.test(value)) return null;
  const [whole, fractional = ""] = value.split(".");
  if (fractional.length > places) return null;
  return BigInt(whole!) * 10n ** BigInt(places) + BigInt((fractional || "").padEnd(places, "0") || "0");
}

function realDate(date: string | undefined): boolean {
  if (!date || !ISO_DATE.test(date)) return false;
  const epoch = Date.parse(`${date}T00:00:00.000Z`);
  return Number.isFinite(epoch) && new Date(epoch).toISOString().slice(0, 10) === date;
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0 && value.length <= 200;
}

/**
 * Checks structural and financial consistency, not approval or data accuracy.
 * The taxonomy set comes from trusted tenant configuration, never the upload.
 */
export function reviewIntakeDraft(
  draft: IntakeDraft,
  allowedCategoryIds: ReadonlySet<string>,
): IntakeReview {
  const issues: IntakeIssue[] = [];
  const issue = (code: IntakeIssueCode, location: string) => issues.push({ code, location });

  if (
    !SAFE_SHA256.test(draft.source.sha256) ||
    !["CSV", "XLSX"].includes(draft.source.kind) ||
    !Number.isSafeInteger(draft.source.byteLength) ||
    draft.source.byteLength <= 0
  ) issue("INVALID_SOURCE", "source");
  if (draft.source.byteLength > INTAKE_MAX_SOURCE_BYTES) issue("SOURCE_TOO_LARGE", "source");

  const project = draft.project;
  if (
    !SAFE_KEY.test(project.businessKey) ||
    !nonEmpty(project.name) ||
    !nonEmpty(project.comparisonClass) ||
    !nonEmpty(project.subtype) ||
    !nonEmpty(project.locationCity) ||
    project.currency !== "TWD" ||
    project.areaUnit !== "m2" ||
    (project.status === "COMPLETED" && !realDate(project.completedAt))
  ) issue("INVALID_PROJECT", "project");
  const area = scaledAmount(project.areaQuantity, 3);
  if (area === null || area <= 0n) issue("INVALID_AREA", "project.areaQuantity");

  const totalRows = draft.financialRecords.reduce((sum, item) => sum + item.rows.length, 0);
  if (totalRows > INTAKE_MAX_ROWS) issue("TOO_MANY_ROWS", "financialRecords");
  if (!draft.financialRecords.length) issue("NO_FINANCIAL_RECORDS", "financialRecords");
  const allRows = new Set<number>();
  const versions = new Set<string>();

  for (const [i, record] of draft.financialRecords.entries()) {
    const location = `financialRecords[${i}]`;
    if (record.observationType === "UNCLASSIFIED") issue("UNCLASSIFIED_OBSERVATION", location);
    if (
      record.observationType === "RECONCILED_ACTUAL_COST" &&
      (project.status !== "COMPLETED" || !realDate(record.reconciledAt))
    ) issue("INVALID_RECONCILED_ACTUAL", location);

    const versionKey = `${record.observationType}:${record.versionNumber}`;
    if (!Number.isSafeInteger(record.versionNumber) || record.versionNumber < 1 || versions.has(versionKey)) {
      issue("INVALID_VERSION", location);
    }
    versions.add(versionKey);

    let lineTotal = 0n;
    for (const [j, row] of record.rows.entries()) {
      const at = `${location}.rows[${j}]`;
      if (!Number.isSafeInteger(row.sourceRow) || row.sourceRow < 1) {
        issue("INVALID_ROW_NUMBER", at);
      } else if (allRows.has(row.sourceRow)) {
        issue("DUPLICATE_SOURCE_ROW", at);
      }
      allRows.add(row.sourceRow);
      if (!allowedCategoryIds.has(row.categoryId)) issue("UNKNOWN_CATEGORY", at);
      if (!nonEmpty(row.description)) issue("INVALID_DESCRIPTION", at);
      if (FORMULA_PREFIX.test(row.description)) issue("FORMULA_LIKE_DESCRIPTION", at);
      if (!nonEmpty(row.unit)) issue("INVALID_UNIT", at);

      const quantity = scaledAmount(row.quantity, 3);
      const unitPrice = scaledAmount(row.unitPrice, 6);
      const lineAmount = scaledAmount(row.amount, 2);
      if (quantity === null || quantity <= 0n) issue("INVALID_QUANTITY", at);
      if (unitPrice === null) issue("INVALID_UNIT_PRICE", at);
      if (lineAmount === null) issue("INVALID_AMOUNT", at);
      if (quantity !== null && unitPrice !== null && lineAmount !== null) {
        // Quantity (3dp) × unit price (6dp) -> currency minor units (2dp).
        const expected = (quantity * unitPrice + 5_000_000n) / 10_000_000n;
        if (expected !== lineAmount) issue("LINE_AMOUNT_MISMATCH", at);
      }
      if (lineAmount !== null) lineTotal += lineAmount;
    }

    const claimedTotal = scaledAmount(record.amountBeforeTax, 2);
    if (claimedTotal === null) issue("INVALID_AMOUNT", `${location}.amountBeforeTax`);
    else if (claimedTotal !== lineTotal) issue("TOTAL_MISMATCH", location);
  }

  return Object.freeze({
    version: INTAKE_REVIEW_VERSION,
    state: issues.length ? "NEEDS_CORRECTION" : "READY_FOR_HUMAN_REVIEW",
    issues: Object.freeze(issues.map((entry) => Object.freeze(entry))),
    requiresServerAuthorizationAndApproval: true,
  });
}
