import { seededFirmLists } from "@/fixtures/firm-lists";
import { describe, expect, it } from "vitest";
import {
  basisOutOfDate,
  draftCoverage,
  prepareDraftPolicy,
  type DraftJob,
} from "@/modules/quote-draft/domain/draft-policy";
import { quoteTotals } from "@/modules/finance/quote-totals";
import {
  REQUIRED_HISTORY_COUNT,
  type CategoryQuotedHistory,
} from "@/modules/economics/domain/historical-economics-service";
const job: DraftJob = {
  catalog: seededFirmLists,
  area: "100",
  areaUnit: "m2",
  currency: "TWD",
  scopeCategoryIds: ["IMPORTED_STONE", "SIGNAGE"],
  commercialCategoryIds: ["IMPORTED_STONE", "SIGNAGE"],
};
const baseline = (rate: string, count = REQUIRED_HISTORY_COUNT): CategoryQuotedHistory => ({
  categoryId: "IMPORTED_STONE",
  conflictEvidenceIds: ["conflict-source"],
  history: {
    state: count >= REQUIRED_HISTORY_COUNT ? "SUFFICIENT" : "INSUFFICIENT",
    observationType: "QUOTED_PRICE",
    requiredObservationCount: REQUIRED_HISTORY_COUNT,
    eligibleObservationCount: count,
    medianNormalizedAmount: rate,
    minimumNormalizedAmount: "10",
    maximumNormalizedAmount: "20",
    evidenceReferenceIds: ["quote-line"],
  },
});
const draft = (rate = "15", count = REQUIRED_HISTORY_COUNT) =>
  prepareDraftPolicy({
    job,
    baselines: [baseline(rate, count)],
    selectedProjectCount: 3,
    calculatedAt: "2026-11-22T00:00:00Z",
  });
describe("QUOTE-DRAFT-1.0", () => {
  it("combines demolition and ceilings into the job's pricing line and uses its past rate", () => {
    const combined = {
      ...job,
      scopeCategoryIds: ["SELECTIVE_DEMOLITION", "PARTITIONS_CEILINGS"],
      commercialCategoryIds: ["DEMOLITION_CEILING"],
    };
    const prepare = (scopeCategoryIds: readonly string[]) =>
      prepareDraftPolicy({
        job: { ...combined, scopeCategoryIds },
        baselines: [{ ...baseline("15"), categoryId: "DEMOLITION_CEILING" }],
        selectedProjectCount: 3,
        calculatedAt: "2026-11-22T00:00:00Z",
      });
    const full = prepare(combined.scopeCategoryIds);
    expect(full).toHaveLength(1);
    expect(full[0]).toMatchObject({
      categoryId: "DEMOLITION_CEILING",
      basis: { suggestedAmount: "2000.00" },
    });
    const partial = prepare(["PARTITIONS_CEILINGS"])[0]!;
    expect(partial.basis).toMatchObject({
      medianRate: "15",
      lowRate: "10",
      highRate: "20",
      count: 3,
      evidenceReferenceIds: ["quote-line"],
    });
    expect(partial.basis).not.toHaveProperty("suggestedAmount");
    expect(
      draftCoverage(
        partial.categoryId,
        partial.basis.scopeCategoryIds,
        seededFirmLists.workCategories,
      ),
    ).toEqual({
      all: ["SELECTIVE_DEMOLITION", "PARTITIONS_CEILINGS"],
      included: ["PARTITIONS_CEILINGS"],
      partial: true,
    });
    expect(basisOutOfDate(full[0]!.basis, combined, "DEMOLITION_CEILING")).toBe(false);
    expect(
      basisOutOfDate(
        full[0]!.basis,
        { ...combined, scopeCategoryIds: ["PARTITIONS_CEILINGS"] },
        "DEMOLITION_CEILING",
      ),
    ).toBe(true);
    expect(basisOutOfDate(partial.basis, combined, "DEMOLITION_CEILING")).toBe(true);
    expect(
      basisOutOfDate(
        full[0]!.basis,
        { ...combined, scopeCategoryIds: [...combined.scopeCategoryIds, "SIGNAGE"] },
        "DEMOLITION_CEILING",
      ),
    ).toBe(false);
  });
  it("uses median quoted rate, keeps basis and conflict sources and abstains for missing pricing-category history", () => {
    expect(draft()[0]?.basis).toMatchObject({
      suggestedAmount: "2000.00",
      count: 3,
      area: "100",
      medianRate: "15",
      evidenceReferenceIds: ["quote-line"],
      conflictEvidenceIds: ["conflict-source"],
    });
    expect(draft()[1]?.basis).not.toHaveProperty("suggestedAmount");
    expect(draft()[0]?.basis).not.toHaveProperty("actualExceeded");
  });
  it("rounds once, half up to thousands, without floating point or cents first", () => {
    expect(draft("14.999999")[0]?.basis.suggestedAmount).toBe("1000.00");
    expect(draft("15.000000")[0]?.basis.suggestedAmount).toBe("2000.00");
    expect(draft("9007199254.740993")[0]?.basis.suggestedAmount).toBe("900719925000.00");
  });
  it("uses the shared eligibility threshold even when an insufficient input has a median", () => {
    expect(draft("15", REQUIRED_HISTORY_COUNT - 1)[0]?.basis.suggestedAmount).toBeUndefined();
  });
  it.each([1, 2])(
    "shows %i eligible quoted prices as reference without suggesting an amount",
    (count) => {
      expect(draft("15", count)[0]?.basis).toMatchObject({
        count,
        medianRate: "15",
        lowRate: "10",
        highRate: "20",
        evidenceReferenceIds: ["quote-line"],
      });
      expect(draft("15", count)[0]?.basis).not.toHaveProperty("suggestedAmount");
      expect(draft("15", 0)[0]?.basis).not.toHaveProperty("medianRate");
    },
  );
  it("never relabels a cost aggregate as a quoted-price suggestion", () => {
    const value = baseline("15");
    expect(
      prepareDraftPolicy({
        job,
        baselines: [
          { ...value, history: { ...value.history, observationType: "RECONCILED_ACTUAL_COST" } },
        ],
        selectedProjectCount: 3,
        calculatedAt: "now",
      })[0]?.basis.suggestedAmount,
    ).toBeUndefined();
  });
  it("marks changed area or a removed category stale without modifying the recorded basis", () => {
    const basis = draft()[0]!.basis;
    expect(basisOutOfDate(basis, job, "IMPORTED_STONE")).toBe(false);
    expect(basisOutOfDate(basis, { ...job, area: "101" }, "IMPORTED_STONE")).toBe(true);
    expect(basisOutOfDate(basis, { ...job, scopeCategoryIds: ["SIGNAGE"] }, "IMPORTED_STONE")).toBe(
      true,
    );
    expect(basis.area).toBe("100");
  });
  it("computes server totals exactly and rounds business tax half up", () => {
    expect(quoteTotals(["90071992547409.91", "0.19"])).toEqual({
      amountBeforeTax: "90071992547410.10",
      taxAmount: "4503599627370.51",
      totalAmount: "94575592174780.61",
    });
    expect(quoteTotals(["0"])).toEqual({
      amountBeforeTax: "0.00",
      taxAmount: "0.00",
      totalAmount: "0.00",
    });
  });
});
