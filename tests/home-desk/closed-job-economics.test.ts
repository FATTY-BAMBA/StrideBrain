import { expect, it } from "vitest";
import {
  ClosedJobEconomicsService,
  type ClosedJobFinancials,
} from "@/modules/economics/domain/closed-job-economics-service";
import type { FinancialObservationRecord } from "@/modules/economics/domain/contracts";
const record = (
  actual: boolean,
  values: readonly [string, string][],
): FinancialObservationRecord => ({
  id: actual ? "actual" : "quote",
  projectId: "job",
  projectKey: "job",
  recordKey: "record",
  subjectType: actual ? "PROJECT_COST_VERSION" : "QUOTE_VERSION",
  observationType: actual ? "RECONCILED_ACTUAL_COST" : "QUOTED_PRICE",
  authorityState: actual ? "RECONCILED_ACTUAL" : "APPROVED_COMMERCIAL",
  currency: "TWD",
  totalAmount: "100.00",
  conflictIds: [],
  evidenceReferenceIds: [],
  dataClassification: "DEMO_SYNTHETIC",
  lines: values.map(([categoryId, amount], lineNumber) => ({
    id: `${actual}-${categoryId}`,
    subjectType: actual ? "COST_LINE" : "QUOTE_ITEM",
    lineNumber,
    categoryId,
    amount,
    quantity: "1",
    unitRate: amount,
    unit: "lot",
    authorityState: actual ? "RECONCILED_ACTUAL" : "APPROVED_COMMERCIAL",
    evidenceReferenceIds: [`source-${actual}-${categoryId}`],
  })),
});
const input = (): ClosedJobFinancials => ({
  project: {
    internalId: "job",
    businessKey: "job",
    status: "COMPLETED",
    areaValue: "1",
    areaUnit: "m2",
    currency: "TWD",
    dataClassification: "DEMO_SYNTHETIC",
    evidenceReferenceIds: [],
  },
  quote: record(false, [
    ["A", "70.00"],
    ["B", "30.00"],
  ]),
  actual: record(true, [
    ["A", "60.00"],
    ["B", "40.00"],
  ]),
});
const service = new ClosedJobEconomicsService();
it("calculates greatest monetary difference exactly with source lineage", () => {
  expect(service.calculate(input(), "2026-11-22")).toMatchObject({
    quoteBeforeTax: "100.00",
    actualCost: "100.00",
    categoryId: "B",
    difference: "10.00",
    exceeded: true,
    evidenceReferenceIds: ["source-false-B", "source-true-B"],
  });
});
it("when none exceeds quote, names closest category with a stable tie break", () => {
  const value = input();
  expect(
    service.calculate(
      {
        ...value,
        actual: {
          ...record(true, [
            ["A", "60.00"],
            ["B", "20.00"],
          ]),
          totalAmount: "80.00",
        },
      },
      "2026-11-22",
    ),
  ).toMatchObject({ categoryId: "A", difference: "-10.00", exceeded: false });
});
it("rejects missing evidence, unreconciled totals, conflict and wrong authority", () => {
  const value = input();
  if (!value.actual) throw new Error("actual");
  for (const change of [
    { totalAmount: "101" },
    { authorityState: "HUMAN_REVIEWED" as const },
    { conflictIds: ["conflict"] },
    { lines: value.actual.lines.map((line) => ({ ...line, evidenceReferenceIds: [] })) },
  ])
    expect(
      service.calculate({ ...value, actual: { ...value.actual, ...change } }, "2026-11-22"),
    ).toBeNull();
});
it("never combines a quote or actual cost belonging to another job", () => {
  const value = input();
  expect(
    service.calculate(
      { ...value, quote: { ...value.quote!, projectId: "other-job" } },
      "2026-11-22",
    ),
  ).toBeNull();
  expect(
    service.calculate(
      { ...value, actual: { ...value.actual!, projectId: "other-job" } },
      "2026-11-22",
    ),
  ).toBeNull();
});
it("exposes all category differences from the same reconciled analysis", () => {
  expect(
    service
      .categoryDifferences(input(), "2026-11-22")
      .map(({ categoryId, difference, exceeded }) => ({ categoryId, difference, exceeded })),
  ).toEqual([
    { categoryId: "B", difference: "10.00", exceeded: true },
    { categoryId: "A", difference: "-10.00", exceeded: false },
  ]);
});

it("excludes a percentage fee from its mapped category and evidence while keeping it in the quote total", () => {
  const value = input(),
    quote = value.quote!;
  const withFee: FinancialObservationRecord = {
    ...quote,
    totalAmount: "200.00",
    quoteDocument: { discountAmount: "0.00" },
    lines: [
      ...quote.lines.map((line) => ({ ...line, quoteCalculation: { kind: "ITEM" as const } })),
      {
        ...quote.lines[1]!,
        id: "fee",
        amount: "100.00",
        quantity: "0",
        unitRate: "0",
        evidenceReferenceIds: ["fee-source"],
        quoteCalculation: { kind: "PERCENTAGE", percentage: "100" },
      },
    ],
  };
  expect(service.calculate({ ...value, quote: withFee }, "2026-11-22")).toMatchObject({
    quoteBeforeTax: "200.00",
    categoryId: "B",
    difference: "10.00",
    exceeded: true,
    evidenceReferenceIds: ["source-false-B", "source-true-B"],
  });
});
