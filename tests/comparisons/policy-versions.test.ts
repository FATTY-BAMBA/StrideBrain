import { describe, expect, it } from "vitest";

import {
  CALCULATION_VERSION,
  ELIGIBILITY_POLICY_VERSION,
  SIMILARITY_POLICY_VERSION,
} from "@/modules/comparisons/domain/contracts";

describe("Stage 4 policy versions", () => {
  it("keeps the accepted version identifiers stable", () => {
    expect({
      eligibility: ELIGIBILITY_POLICY_VERSION,
      similarity: SIMILARITY_POLICY_VERSION,
      calculation: CALCULATION_VERSION,
    }).toEqual({
      eligibility: "CPI-ELIGIBILITY-1.0",
      similarity: "CPI-SIM-1.0",
      calculation: "CPI-CALC-1.0",
    });
  });
});
