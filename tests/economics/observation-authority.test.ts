import { describe, expect, it } from "vitest";

import type {
  EconomicsProjectSnapshot,
  FinancialObservationRecord,
} from "@/modules/economics/domain/contracts";
import {
  ObservationAuthorityService,
  supplierOfferFreshness,
} from "@/modules/economics/domain/observation-authority";

const project: EconomicsProjectSnapshot = Object.freeze({
  internalId: "prj_history",
  businessKey: "PRJ-HISTORY",
  status: "COMPLETED",
  areaValue: "100.000",
  areaUnit: "m2",
  currency: "TWD",
  programmeWeeks: "20.00",
  dataClassification: "DEMO_SYNTHETIC",
  evidenceReferenceIds: Object.freeze(["evid_programme"]),
});

function record(overrides: Partial<FinancialObservationRecord> = {}): FinancialObservationRecord {
  const line = Object.freeze({
    id: "line_1",
    subjectType: "COST_LINE" as const,
    lineNumber: 1,
    categoryId: "IMPORTED_STONE",
    amount: "1000.00",
    quantity: "1.000",
    unitRate: "1000.000000",
    unit: "lot",
    authorityState: "RECONCILED_ACTUAL" as const,
    evidenceReferenceIds: Object.freeze(["evid_line_1"]),
  });

  return Object.freeze({
    id: "record_1",
    projectId: project.internalId,
    projectKey: project.businessKey,
    recordKey: "REC-1",
    versionNumber: 1,
    subjectType: "PROJECT_COST_VERSION",
    observationType: "RECONCILED_ACTUAL_COST",
    authorityState: "RECONCILED_ACTUAL",
    currency: "TWD",
    totalAmount: "1000.00",
    effectiveAt: "2026-01-01",
    conflictIds: Object.freeze([]),
    evidenceReferenceIds: Object.freeze(["evid_line_1"]),
    dataClassification: "DEMO_SYNTHETIC",
    lines: Object.freeze([line]),
    ...overrides,
  });
}

const context = Object.freeze({
  purpose: "ACTUAL_HISTORY" as const,
  snapshotDate: "2026-11-15",
  activeCurrency: "TWD",
  activeAreaUnit: "m2",
});

describe("ObservationAuthorityService", () => {
  const service = new ObservationAuthorityService();

  it("accepts reconciled completed-project actuals with exact evidence and arithmetic", () => {
    expect(service.evaluate(project, record(), context)).toMatchObject({
      eligible: true,
      reasonCodes: [],
      freshness: "HISTORICAL",
    });
  });

  it("never treats quoted or forecast values as reconciled actual cost", () => {
    const quoted = record({
      subjectType: "QUOTE_VERSION",
      observationType: "QUOTED_PRICE",
      authorityState: "APPROVED_COMMERCIAL",
      lines: Object.freeze([
        Object.freeze({
          ...record().lines[0]!,
          subjectType: "QUOTE_ITEM" as const,
          authorityState: "APPROVED_COMMERCIAL" as const,
        }),
      ]),
    });
    const forecast = record({
      subjectType: "FORECAST_COST_VERSION",
      observationType: "FORECAST_DIRECT_COST",
      authorityState: "HUMAN_REVIEWED",
      lines: Object.freeze([
        Object.freeze({
          ...record().lines[0]!,
          subjectType: "FORECAST_COST_LINE" as const,
          authorityState: "HUMAN_REVIEWED" as const,
        }),
      ]),
    });

    expect(service.evaluate(project, quoted, context)).toMatchObject({
      eligible: false,
      reasonCodes: expect.arrayContaining(["WRONG_OBSERVATION_TYPE", "INSUFFICIENT_AUTHORITY"]),
    });
    expect(service.evaluate(project, forecast, context)).toMatchObject({
      eligible: false,
      reasonCodes: expect.arrayContaining(["WRONG_OBSERVATION_TYPE", "INSUFFICIENT_AUTHORITY"]),
    });
  });

  it("excludes conflicted, superseded, and unreconciled records", () => {
    expect(
      service.evaluate(project, record({ conflictIds: Object.freeze(["conflict_1"]) }), context),
    ).toMatchObject({ eligible: false, reasonCodes: expect.arrayContaining(["CONFLICTED"]) });
    expect(
      service.evaluate(project, record({ supersededById: "record_2" }), context),
    ).toMatchObject({ eligible: false, reasonCodes: expect.arrayContaining(["SUPERSEDED"]) });
    expect(service.evaluate(project, record({ totalAmount: "999.00" }), context)).toMatchObject({
      eligible: false,
      reasonCodes: expect.arrayContaining(["TOTAL_NOT_RECONCILED"]),
    });
  });

  it("keeps stale supplier offers as labeled history but rejects them as current price", () => {
    const supplierOffer = record({
      id: "offer_1",
      subjectType: "SUPPLIER_OFFER",
      observationType: "SUPPLIER_OFFER",
      authorityState: "APPROVED_COMMERCIAL",
      effectiveAt: "2025-01-15",
      validUntil: "2025-02-15",
      lines: Object.freeze([
        Object.freeze({
          ...record().lines[0]!,
          subjectType: "SUPPLIER_OFFER_ITEM" as const,
          authorityState: "APPROVED_COMMERCIAL" as const,
        }),
      ]),
    });

    expect(supplierOfferFreshness(supplierOffer, "2026-11-15")).toBe("STALE");
    expect(
      service.evaluate(project, supplierOffer, { ...context, purpose: "SUPPLIER_HISTORY" }),
    ).toMatchObject({
      eligible: true,
      freshness: "STALE",
      reasonCodes: expect.arrayContaining(["STALE"]),
    });
    expect(
      service.evaluate(project, supplierOffer, { ...context, purpose: "SUPPLIER_CURRENT" }),
    ).toMatchObject({
      eligible: false,
      freshness: "STALE",
      reasonCodes: expect.arrayContaining(["STALE"]),
    });
  });
});
