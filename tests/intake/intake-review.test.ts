import { describe, expect, it } from "vitest";
import {
  INTAKE_MAX_SOURCE_BYTES,
  reviewIntakeDraft,
  type IntakeDraft,
  type IntakeIssueCode,
} from "@/modules/intake/domain/intake-review";

const taxonomy = new Set(["IMPORTED_STONE", "LIGHTING_ELECTRICAL"]);

const valid: IntakeDraft = {
  source: { kind: "CSV", sha256: "a".repeat(64), byteLength: 1000 },
  project: {
    businessKey: "PRJ-REAL-001",
    name: "Historical flagship renovation",
    status: "COMPLETED",
    completedAt: "2025-09-15",
    comparisonClass: "RETAIL",
    subtype: "FLAGSHIP",
    locationCity: "Taipei",
    areaQuantity: "120.000",
    areaUnit: "m2",
    currency: "TWD",
  },
  financialRecords: [
    {
      observationType: "QUOTED_PRICE",
      versionNumber: 1,
      amountBeforeTax: "200.00",
      rows: [
        {
          sourceRow: 2,
          categoryId: "IMPORTED_STONE",
          description: "Marble floor supply",
          quantity: "2.000",
          unit: "m2",
          unitPrice: "100.000000",
          amount: "200.00",
        },
      ],
    },
  ],
};

function codes(draft: IntakeDraft): IntakeIssueCode[] {
  return reviewIntakeDraft(draft, taxonomy).issues.map((issue) => issue.code);
}

describe("review-only real project intake", () => {
  it("validates a correctly mapped historical quote without granting commit authority", () => {
    const result = reviewIntakeDraft(valid, taxonomy);
    expect(result).toEqual({
      version: "intake-review.v0.1",
      state: "READY_FOR_HUMAN_REVIEW",
      issues: [],
      requiresServerAuthorizationAndApproval: true,
    });
  });

  it("supports a completed job's actual-cost record only when reconciliation date is explicit", () => {
    const record = { ...valid.financialRecords[0]!, observationType: "RECONCILED_ACTUAL_COST" as const, reconciledAt: "2025-09-16" };
    expect(codes({ ...valid, financialRecords: [record] })).toEqual([]);
    expect(codes({ ...valid, project: { ...valid.project, status: "ACTIVE" }, financialRecords: [record] })).toContain("INVALID_RECONCILED_ACTUAL");
    expect(codes({ ...valid, financialRecords: [{ ...record, reconciledAt: undefined }] })).toContain("INVALID_RECONCILED_ACTUAL");
  });

  it("requires an explicit financial observation type; never silently promotes cost to actual", () => {
    expect(codes({
      ...valid,
      financialRecords: [{ ...valid.financialRecords[0]!, observationType: "UNCLASSIFIED" }],
    })).toContain("UNCLASSIFIED_OBSERVATION");
  });

  it("rejects missing or impossible source fingerprints, sizes and unsupported files", () => {
    expect(codes({ ...valid, source: { ...valid.source, sha256: "bad" } })).toContain("INVALID_SOURCE");
    expect(codes({ ...valid, source: { ...valid.source, byteLength: INTAKE_MAX_SOURCE_BYTES + 1 } })).toContain("SOURCE_TOO_LARGE");
    expect(codes({ ...valid, source: { ...valid.source, byteLength: 0 } })).toContain("INVALID_SOURCE");
  });

  it("checks project identifiers, positive area and real completion dates", () => {
    expect(codes({ ...valid, project: { ...valid.project, businessKey: "../other" } })).toContain("INVALID_PROJECT");
    expect(codes({ ...valid, project: { ...valid.project, areaQuantity: "0.000" } })).toContain("INVALID_AREA");
    expect(codes({ ...valid, project: { ...valid.project, completedAt: "2025-02-30" } })).toContain("INVALID_PROJECT");
  });

  it("checks tenant-provided taxonomy and flags spreadsheet formula-like descriptions", () => {
    const row = valid.financialRecords[0]!.rows[0]!;
    const draft = {
      ...valid,
      financialRecords: [{
        ...valid.financialRecords[0]!,
        rows: [{ ...row, description: "=CMD()", categoryId: "UNREVIEWED_CATEGORY" }],
      }],
    };
    expect(codes(draft)).toEqual(expect.arrayContaining(["UNKNOWN_CATEGORY", "FORMULA_LIKE_DESCRIPTION"]));
  });

  it("does not use floating point maths for cents and rejects a false line total", () => {
    const row = valid.financialRecords[0]!.rows[0]!;
    const correct = {
      ...valid,
      financialRecords: [{
        ...valid.financialRecords[0]!,
        amountBeforeTax: "0.30",
        rows: [{ ...row, quantity: "3", unitPrice: "0.100000", amount: "0.30" }],
      }],
    };
    expect(codes(correct)).toEqual([]);
    expect(codes({
      ...correct,
      financialRecords: [{ ...correct.financialRecords[0]!, rows: [{ ...correct.financialRecords[0]!.rows[0]!, amount: "0.31" }] }],
    })).toEqual(expect.arrayContaining(["LINE_AMOUNT_MISMATCH", "TOTAL_MISMATCH"]));
  });

  it("rejects scientific notation, negatives, invalid precision and empty quantities", () => {
    const row = valid.financialRecords[0]!.rows[0]!;
    for (const quantity of ["1e4", "-1", "0", "1.1234"]) {
      expect(codes({ ...valid, financialRecords: [{ ...valid.financialRecords[0]!, rows: [{ ...row, quantity }] }] })).toContain("INVALID_QUANTITY");
    }
    expect(codes({ ...valid, financialRecords: [{ ...valid.financialRecords[0]!, rows: [{ ...row, unitPrice: "2.1234567" }] }] })).toContain("INVALID_UNIT_PRICE");
  });

  it("rejects reusing source rows or observation versions within one import", () => {
    const first = valid.financialRecords[0]!;
    expect(codes({ ...valid, financialRecords: [first, { ...first }] })).toEqual(expect.arrayContaining(["DUPLICATE_SOURCE_ROW", "INVALID_VERSION"]));
  });

  it("requires a consistent declared record total", () => {
    expect(codes({ ...valid, financialRecords: [{ ...valid.financialRecords[0]!, amountBeforeTax: "199.99" }] })).toContain("TOTAL_MISMATCH");
  });

  it("limits the number of rows before any persistence", () => {
    const row = valid.financialRecords[0]!.rows[0]!;
    const rows = Array.from({ length: 2001 }, (_, index) => ({ ...row, sourceRow: index + 1 }));
    expect(codes({ ...valid, financialRecords: [{ ...valid.financialRecords[0]!, rows }] })).toContain("TOO_MANY_ROWS");
  });
});
