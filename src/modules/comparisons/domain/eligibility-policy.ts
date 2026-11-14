import type { AuthorityState } from "@/modules/projects/domain/project-workspace";

import type {
  ActiveProjectComparisonContext,
  CandidateEligibilityDecision,
  ComparisonProjectProfile,
  EligibilityReasonCode,
  MissingContextField,
} from "@/modules/comparisons/domain/contracts";

const ACCEPTED_METADATA_AUTHORITIES = new Set<AuthorityState>([
  "HUMAN_REVIEWED",
  "APPROVED_COMMERCIAL",
  "RECONCILED_ACTUAL",
]);

const HISTORICAL_STATUSES = new Set(["COMPLETED", "CLOSED", "ARCHIVED"]);

function nonEmpty(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function positiveDecimal(value: string): boolean {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

function validIsoDate(value: string | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateActiveComparisonContext(
  context: ActiveProjectComparisonContext,
): readonly MissingContextField[] {
  const missing = new Set<MissingContextField>();

  if (!nonEmpty(context.comparisonClass)) missing.add("COMPARISON_CLASS");
  if (!nonEmpty(context.subtype)) missing.add("SUBTYPE");
  if (!positiveDecimal(context.areaValue)) missing.add("AREA");
  if (!nonEmpty(context.areaUnit)) missing.add("AREA_UNIT");
  if (!nonEmpty(context.currency)) missing.add("CURRENCY");
  if (context.scopeCategoryIds.length === 0) missing.add("SCOPE_CATEGORIES");
  if (context.commercialCategoryIds.length === 0) missing.add("COMMERCIAL_CATEGORIES");
  if (!nonEmpty(context.location.city)) missing.add("LOCATION_CITY");
  if (!ACCEPTED_METADATA_AUTHORITIES.has(context.metadataAuthority)) {
    missing.add("METADATA_AUTHORITY");
  }
  if (!validIsoDate(context.snapshotDate)) missing.add("SNAPSHOT_DATE");

  return Object.freeze([...missing]);
}

function missingCandidateMandatoryContext(candidate: ComparisonProjectProfile): boolean {
  return (
    !nonEmpty(candidate.subtype) ||
    !positiveDecimal(candidate.areaValue) ||
    !nonEmpty(candidate.areaUnit) ||
    !nonEmpty(candidate.currency) ||
    candidate.scopeCategoryIds.length === 0 ||
    candidate.commercialCategoryIds.length === 0 ||
    !nonEmpty(candidate.location.city) ||
    !validIsoDate(candidate.completedAt)
  );
}

export function evaluateCandidateEligibility(
  active: ActiveProjectComparisonContext,
  candidate: ComparisonProjectProfile,
): CandidateEligibilityDecision {
  const reasons = new Set<EligibilityReasonCode>();

  if (candidate.organizationId !== active.organizationId) {
    reasons.add("ORGANIZATION_MISMATCH");
  }
  if (!HISTORICAL_STATUSES.has(candidate.status)) {
    reasons.add("STATUS_NOT_HISTORICAL");
  }
  if (candidate.comparisonClass !== active.comparisonClass) {
    reasons.add("COMPARISON_CLASS_MISMATCH");
  }
  if (candidate.currency !== active.currency) {
    reasons.add("CURRENCY_MISMATCH");
  }
  if (candidate.areaUnit !== active.areaUnit) {
    reasons.add("AREA_UNIT_MISMATCH");
  }
  if (missingCandidateMandatoryContext(candidate)) {
    reasons.add("MANDATORY_CONTEXT_MISSING");
  }
  if (!ACCEPTED_METADATA_AUTHORITIES.has(candidate.metadataAuthority)) {
    reasons.add("METADATA_AUTHORITY_INSUFFICIENT");
  }
  if (
    candidate.completedAt &&
    validIsoDate(candidate.completedAt) &&
    candidate.completedAt > active.snapshotDate
  ) {
    reasons.add("COMPLETION_DATE_INVALID");
  }
  if (candidate.duplicateOfProjectId) reasons.add("DUPLICATE_RECORD");
  if (candidate.testRecord) reasons.add("TEST_RECORD");
  if (candidate.policyExcluded) reasons.add("POLICY_EXCLUDED");

  return Object.freeze({
    eligible: reasons.size === 0,
    reasonCodes: Object.freeze([...reasons]),
  });
}
