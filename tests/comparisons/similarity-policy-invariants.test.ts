import { describe, expect, it } from "vitest";

import {
  FACTOR_ORDER,
  FACTOR_WEIGHTS,
  similarityPolicyDescriptor,
} from "@/modules/comparisons/domain/similarity-policy";

describe("CPI-SIM-1.0 policy invariants", () => {
  it("contains eight unique factors whose weights total exactly 100", () => {
    expect(FACTOR_ORDER).toHaveLength(8);
    expect(new Set(FACTOR_ORDER).size).toBe(8);
    expect(Object.keys(FACTOR_WEIGHTS).sort()).toEqual(
      [...FACTOR_ORDER].sort(),
    );
    expect(
      Object.values(FACTOR_WEIGHTS).reduce(
        (total, weight) => total + weight,
        0,
      ),
    ).toBe(100);
  });

  it("publishes the accepted primary thresholds and result limit", () => {
    expect(similarityPolicyDescriptor()).toEqual({
      version: "CPI-SIM-1.0",
      weights: FACTOR_WEIGHTS,
      factorOrder: FACTOR_ORDER,
      primaryMinimumScore: 50,
      primaryMinimumCoverage: 75,
      primaryMaximum: 6,
    });
  });
});
