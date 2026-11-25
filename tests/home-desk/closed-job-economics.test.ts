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

it.each([
  ["17300000.00", "13420000.00", "3880000.00", "2243", "22.4", "BELOW"],
  ["100.00", "125.00", "-25.00", "-2500", "25.0", "ABOVE"],
  ["100.00", "100.00", "0.00", "0", "0.0", "EQUAL"],
  ["2000.00", "1551.00", "449.00", "2245", "22.5", "BELOW"],
  ["100000.00", "77551.00", "22449.00", "2245", "22.4", "BELOW"],
  ["9007199254740993.00", "9007199254740992.99", "0.01", "0", "0.0", "BELOW"],
])(
  "computes exact whole-job difference for quote %s and actual %s",
  (quoteBeforeTax, actualCost, amount, basisPoints, percentOfQuote, direction) => {
    expect(service.jobDifference({ quoteBeforeTax, actualCost })).toEqual({
      amount,
      absoluteAmount: amount.replace("-", ""),
      basisPoints,
      percentOfQuote,
      direction,
    });
  },
);
it("does not divide by zero or treat a negative quote as a comparable baseline", () => {
  for (const quoteBeforeTax of ["0", "-1"])
    expect(service.jobDifference({ quoteBeforeTax, actualCost: "10" })).toBeNull();
});
