import { expect, it } from "vitest";
import { ObservationAuthorityService } from "@/modules/economics/domain/observation-authority";
import { quoteDocumentReconciliation } from "@/modules/economics/domain/quote-document-reconciliation";
import type { FinancialObservationRecord } from "@/modules/economics/domain/contracts";
const record: FinancialObservationRecord = {
  id: "quote",
  projectId: "job",
  projectKey: "JOB",
  recordKey: "QUOTE",
  subjectType: "QUOTE_VERSION",
  observationType: "QUOTED_PRICE",
  authorityState: "APPROVED_COMMERCIAL",
  currency: "TWD",
  totalAmount: "320000.00",
  quoteDocument: { discountAmount: "4000.00" },
  conflictIds: [],
  evidenceReferenceIds: ["total"],
  dataClassification: "DEMO_SYNTHETIC",
  lines: [
    {
      id: "wood",
      subjectType: "QUOTE_ITEM",
      lineNumber: 1,
      categoryId: "CUSTOM_MILLWORK",
      amount: "285000",
      quantity: "30",
      unitRate: "9500",
      unit: "坪",
      authorityState: "APPROVED_COMMERCIAL",
      evidenceReferenceIds: ["wood-source"],
      quoteCalculation: { kind: "ITEM" },
    },
    {
      id: "electric",
      subjectType: "QUOTE_ITEM",
      lineNumber: 2,
      categoryId: "LIGHTING_ELECTRICAL",
      amount: "15000",
      quantity: "12",
      unitRate: "1250",
      unit: "個",
      authorityState: "APPROVED_COMMERCIAL",
      evidenceReferenceIds: ["electric-source"],
      quoteCalculation: { kind: "ITEM" },
    },
    {
      id: "fee",
      subjectType: "QUOTE_ITEM",
      lineNumber: 3,
      categoryId: "",
      amount: "24000",
      quantity: "0",
      unitRate: "0",
      unit: "%",
      authorityState: "APPROVED_COMMERCIAL",
      evidenceReferenceIds: ["fee-source"],
      quoteCalculation: { kind: "PERCENTAGE", percentage: "8" },
    },
  ],
};
it("reconciles whole-dollar sectioned quotes and uncategorized fees with an overall-only discount", () => {
  expect(quoteDocumentReconciliation(record)).toEqual({ lineFailure: false, totalFailure: false });
  expect(
    new ObservationAuthorityService().evaluate(
      {
        internalId: "job",
        businessKey: "JOB",
        status: "COMPLETED",
        areaValue: "100",
        areaUnit: "m2",
        currency: "TWD",
        dataClassification: "DEMO_SYNTHETIC",
        evidenceReferenceIds: [],
      },
      record,
      {
        purpose: "QUOTED_HISTORY",
        snapshotDate: "2026-11-24",
        activeCurrency: "TWD",
        activeAreaUnit: "m2",
      },
    ).eligible,
  ).toBe(true);
});
it("refuses a compounded fee, mismatched total, fractional/negative discount and a disguised cost", () => {
  const fee = record.lines[2]!;
  expect(
    quoteDocumentReconciliation({
      ...record,
      lines: [...record.lines.slice(0, 2), { ...fee, amount: "25920" }],
    }).lineFailure,
  ).toBe(true);
  for (const discountAmount of ["4000.50", "-1", "999999"])
    expect(
      quoteDocumentReconciliation({ ...record, quoteDocument: { discountAmount } }).totalFailure,
    ).toBe(true);
  expect(quoteDocumentReconciliation({ ...record, totalAmount: "324000" }).totalFailure).toBe(true);
  expect(
    quoteDocumentReconciliation({ ...record, observationType: "FORECAST_DIRECT_COST" }).lineFailure,
  ).toBe(true);
  expect(
    quoteDocumentReconciliation({
      ...record,
      lines: record.lines.map((line) => {
        const { quoteCalculation, ...without } = line;
        expect(quoteCalculation).toBeDefined();
        return without;
      }),
    }).lineFailure,
  ).toBe(true);
});
