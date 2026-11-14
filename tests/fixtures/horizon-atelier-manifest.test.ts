import { describe, expect, it } from "vitest";

import { horizonAtelierManifest } from "@/fixtures/horizon-atelier/manifest";
import {
  decimalToString,
  divide,
  median,
  money,
  quantity,
  variancePercent,
} from "@/modules/finance/fixed-decimal";

function unitCost(amount: string, area: string) {
  return divide(money(amount), quantity(area), 6);
}

function variance(current: ReturnType<typeof unitCost>, baseline: ReturnType<typeof unitCost>) {
  return Number(decimalToString(variancePercent(current, baseline, 4)));
}

describe("Horizon Atelier v0.1 fixture contract", () => {
  it("keeps the canonical comparable ordering stable", () => {
    expect(horizonAtelierManifest.expectedComparableOrder).toEqual([
      "PRJ-NEIHU-021",
      "PRJ-ZHONGSHAN-018",
      "PRJ-NANJING-023",
      "PRJ-DAAN-016",
      "PRJ-SONGSHAN-020",
      "PRJ-BANQIAO-015",
    ]);
  });

  it("produces the accepted overall quoted-price finding after area normalization", () => {
    const current = unitCost("16480000.00", "640.000");
    const historical = [
      unitCost("15120000.00", "610.000"),
      unitCost("13950000.00", "590.000"),
      unitCost("17300000.00", "720.000"),
    ];
    const baseline = median(historical, 6);

    expect(baseline).not.toBeNull();
    const result = variance(current, baseline!);
    expect(result).toBeGreaterThanOrEqual(7);
    expect(result).toBeLessThan(7.3);
  });

  it("produces the accepted forecast-direct-cost finding after area normalization", () => {
    const current = unitCost("12650000.00", "640.000");
    const historical = [
      unitCost("11580000.00", "610.000"),
      unitCost("10840000.00", "590.000"),
      unitCost("13420000.00", "720.000"),
    ];
    const baseline = median(historical, 6);

    expect(baseline).not.toBeNull();
    const result = variance(current, baseline!);
    expect(result).toBeGreaterThanOrEqual(5.9);
    expect(result).toBeLessThan(6.2);
  });

  it("preserves the imported-stone and lighting findings without overclaiming evidence", () => {
    const currentStone = unitCost("2360000.00", "640.000");
    const stoneMedian = median(
      [
        unitCost("1900000.00", "610.000"),
        unitCost("2000000.00", "590.000"),
        unitCost("2100000.00", "720.000"),
      ],
      6,
    );
    expect(stoneMedian).not.toBeNull();
    expect(variance(currentStone, stoneMedian!)).toBeGreaterThanOrEqual(18);
    expect(variance(currentStone, stoneMedian!)).toBeLessThan(19);

    const currentLighting = unitCost("3100000.00", "640.000");
    const lightingQuotedMedian = median(
      [
        unitCost("2700000.00", "610.000"),
        unitCost("2844000.00", "590.000"),
        unitCost("3000000.00", "720.000"),
      ],
      6,
    );
    expect(lightingQuotedMedian).not.toBeNull();
    expect(variance(currentLighting, lightingQuotedMedian!)).toBeGreaterThanOrEqual(9);
    expect(variance(currentLighting, lightingQuotedMedian!)).toBeLessThan(10);
    expect(horizonAtelierManifest.heroEconomics.lightingEligibleActualObservationCount).toBe(2);
  });

  it("keeps the fixture intentionally imperfect", () => {
    expect(horizonAtelierManifest.imperfectCases).toEqual({
      supersededQuoteProjectKey: "PRJ-XINYI-026",
      staleSupplierOfferKey: "SUP-OFFER-STONE-2025-041",
      openConflictKey: "final-cost:PRJ-HIST-018:IMPORTED_STONE",
      inaccessibleOrganizationKey: "NORTHERN_STUDIO",
      inaccessibleProjectKey: "PRJ-NORTH-001",
    });
  });
});
