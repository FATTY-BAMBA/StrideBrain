import { quoteDocumentReconciliation } from "./quote-document-reconciliation";
import {
  add,
  compare,
  decimalFromAtoms,
  decimalFromString,
  lineReconciles,
  money,
  rescale,
  withinTolerance,
} from "@/modules/finance/fixed-decimal";

import type {
  AuthorityReasonCode,
  EconomicsProjectSnapshot,
  FinancialObservationRecord,
  FreshnessState,
  ObservationAuthorityDecision,
  ObservationPurpose,
} from "@/modules/economics/domain/contracts";

const COMPLETED_PROJECT_STATUSES = new Set(["COMPLETED", "CLOSED"]);
const REVIEWED_AUTHORITIES = new Set(["HUMAN_REVIEWED", "APPROVED_COMMERCIAL"]);

export type AuthorityEvaluationContext = Readonly<{
  purpose: ObservationPurpose;
  snapshotDate: string;
  activeCurrency: string;
  activeAreaUnit: string;
}>;

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function calendarDaysBetween(earlier: Date, later: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / 86_400_000);
}

export function supplierOfferFreshness(
  record: FinancialObservationRecord,
  snapshotDate: string,
): FreshnessState {
  const snapshot = parseDate(snapshotDate);
  if (!snapshot) throw new TypeError("INVALID_SNAPSHOT_DATE");

  const validUntil = parseDate(record.validUntil);
  if (validUntil && validUntil.getTime() < snapshot.getTime()) return "STALE";

  const effectiveAt = parseDate(record.effectiveAt);
  if (!validUntil && effectiveAt && calendarDaysBetween(effectiveAt, snapshot) > 90) {
    return "STALE";
  }

  return "CURRENT";
}

function freshnessFor(
  record: FinancialObservationRecord,
  context: AuthorityEvaluationContext,
): FreshnessState {
  if (record.observationType === "SUPPLIER_OFFER") {
    const freshness = supplierOfferFreshness(record, context.snapshotDate);
    return context.purpose === "SUPPLIER_CURRENT"
      ? freshness
      : freshness === "STALE"
        ? "STALE"
        : "HISTORICAL";
  }

  return context.purpose === "CURRENT_QUOTE" || context.purpose === "CURRENT_FORECAST"
    ? "CURRENT"
    : "HISTORICAL";
}

function expectedObservationType(
  purpose: ObservationPurpose,
): FinancialObservationRecord["observationType"] {
  switch (purpose) {
    case "CURRENT_QUOTE":
    case "QUOTED_HISTORY":
      return "QUOTED_PRICE";
    case "CURRENT_FORECAST":
      return "FORECAST_DIRECT_COST";
    case "ACTUAL_HISTORY":
      return "RECONCILED_ACTUAL_COST";
    case "SUPPLIER_HISTORY":
    case "SUPPLIER_CURRENT":
      return "SUPPLIER_OFFER";
  }
}

function authorityAccepted(
  record: FinancialObservationRecord,
  purpose: ObservationPurpose,
): boolean {
  switch (purpose) {
    case "CURRENT_QUOTE":
    case "CURRENT_FORECAST":
      return REVIEWED_AUTHORITIES.has(record.authorityState);
    case "QUOTED_HISTORY":
      return record.authorityState === "APPROVED_COMMERCIAL";
    case "ACTUAL_HISTORY":
      return record.authorityState === "RECONCILED_ACTUAL";
    case "SUPPLIER_HISTORY":
    case "SUPPLIER_CURRENT":
      return record.authorityState === "APPROVED_COMMERCIAL";
  }
}

function lineAuthorityAccepted(
  line: FinancialObservationRecord["lines"][number],
  purpose: ObservationPurpose,
): boolean {
  if (purpose === "ACTUAL_HISTORY") return line.authorityState === "RECONCILED_ACTUAL";
  if (purpose === "QUOTED_HISTORY") return line.authorityState === "APPROVED_COMMERCIAL";
  return REVIEWED_AUTHORITIES.has(line.authorityState);
}

function hasEvidence(record: FinancialObservationRecord): boolean {
  if (record.evidenceReferenceIds.length > 0) return true;
  return (
    record.lines.length > 0 && record.lines.every((line) => line.evidenceReferenceIds.length > 0)
  );
}

function validMoney(value: string, allowZero: boolean): boolean {
  try {
    const comparison = compare(money(value), decimalFromAtoms(0n, 2));
    return allowZero ? comparison >= 0 : comparison > 0;
  } catch {
    return false;
  }
}

function validPositiveArea(project: EconomicsProjectSnapshot): boolean {
  try {
    return compare(decimalFromString(project.areaValue, 3), decimalFromAtoms(0n, 3)) > 0;
  } catch {
    return false;
  }
}

function linesReconcile(record: FinancialObservationRecord): Readonly<{
  lineFailure: boolean;
  totalFailure: boolean;
}> {
  if (record.quoteDocument) return quoteDocumentReconciliation(record);
  if (record.lines.length === 0) {
    return Object.freeze({ lineFailure: false, totalFailure: false });
  }

  let total = decimalFromAtoms(0n, 2);
  let lineFailure = false;

  for (const line of record.lines) {
    try {
      const lineAmount = money(line.amount);
      const quantity = decimalFromString(line.quantity, 3);
      const unitRate = decimalFromString(line.unitRate, 6);
      if (!lineReconciles(quantity, unitRate, lineAmount)) lineFailure = true;
      total = add(total, rescale(lineAmount, 2));
    } catch {
      lineFailure = true;
    }
  }

  let totalFailure = false;
  try {
    totalFailure = !withinTolerance(total, money(record.totalAmount), money("0.02"));
  } catch {
    totalFailure = true;
  }

  return Object.freeze({ lineFailure, totalFailure });
}

function uniqueReasons(reasons: readonly AuthorityReasonCode[]): readonly AuthorityReasonCode[] {
  return Object.freeze([...new Set(reasons)]);
}

export class ObservationAuthorityService {
  evaluate(
    project: EconomicsProjectSnapshot,
    record: FinancialObservationRecord,
    context: AuthorityEvaluationContext,
  ): ObservationAuthorityDecision {
    const reasons: AuthorityReasonCode[] = [];
    const freshness = freshnessFor(record, context);

    if (record.observationType !== expectedObservationType(context.purpose)) {
      reasons.push("WRONG_OBSERVATION_TYPE");
    }
    if (!authorityAccepted(record, context.purpose)) reasons.push("INSUFFICIENT_AUTHORITY");
    if (
      (context.purpose === "QUOTED_HISTORY" || context.purpose === "ACTUAL_HISTORY") &&
      !COMPLETED_PROJECT_STATUSES.has(project.status)
    ) {
      reasons.push("PROJECT_NOT_COMPLETED");
    }
    if (record.supersededById || record.authorityState === "SUPERSEDED") {
      reasons.push("SUPERSEDED");
    }
    if (record.conflictIds.length > 0 || record.authorityState === "CONFLICTED") {
      reasons.push("CONFLICTED");
    }
    if (record.currency !== context.activeCurrency) reasons.push("INCOMPATIBLE_CURRENCY");
    if (project.areaUnit !== context.activeAreaUnit) reasons.push("INCOMPATIBLE_UNIT");
    if (!validPositiveArea(project)) reasons.push("MISSING_AREA");
    if (!validMoney(record.totalAmount, context.purpose === "CURRENT_QUOTE"))
      reasons.push("AMOUNT_INVALID");
    if (context.purpose === "QUOTED_HISTORY" && record.quoteStatus === "DRAFT")
      reasons.push("POLICY_EXCLUDED");
    if (record.policyExcluded) reasons.push("POLICY_EXCLUDED");

    const requiresStructuredLines =
      context.purpose === "CURRENT_QUOTE" ||
      context.purpose === "QUOTED_HISTORY" ||
      context.purpose === "CURRENT_FORECAST" ||
      context.purpose === "ACTUAL_HISTORY";
    if (
      requiresStructuredLines &&
      (record.lines.length === 0 ||
        record.lines.some(
          (line) =>
            line.categoryId.trim().length === 0 &&
            !(
              record.quoteDocument &&
              record.observationType === "QUOTED_PRICE" &&
              record.subjectType === "QUOTE_VERSION"
            ),
        ))
    ) {
      reasons.push("MISSING_TAXONOMY");
    }
    if (record.lines.some((line) => !lineAuthorityAccepted(line, context.purpose))) {
      reasons.push("INSUFFICIENT_AUTHORITY");
    }
    if (!hasEvidence(record)) reasons.push("MISSING_EVIDENCE");

    const reconciliation = linesReconcile(record);
    if (reconciliation.lineFailure) reasons.push("LINE_NOT_RECONCILED");
    if (reconciliation.totalFailure) reasons.push("TOTAL_NOT_RECONCILED");

    if (freshness === "STALE") reasons.push("STALE");

    const disqualifyingReasons = reasons.filter(
      (reason) => !(reason === "STALE" && context.purpose === "SUPPLIER_HISTORY"),
    );

    return Object.freeze({
      recordId: record.id,
      purpose: context.purpose,
      eligible: disqualifyingReasons.length === 0,
      reasonCodes: uniqueReasons(reasons),
      freshness,
      conflictIds: Object.freeze([...record.conflictIds]),
      evidenceReferenceIds: Object.freeze([...record.evidenceReferenceIds]),
    });
  }
}
