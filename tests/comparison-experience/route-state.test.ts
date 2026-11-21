import { describe, expect, it } from "vitest";

import {
  comparisonHref,
  parseComparisonRouteSearch,
  sanitizeSelectedProjectKeys,
  selectedKeysFromFormData,
} from "@/modules/comparison-experience/route-state";

describe("Stage 6 comparison route state", () => {
  it("accepts only bounded safe identifiers and at most three unique selections", () => {
    const state = parseComparisonRouteSearch({
      run: "cmprun_123",
      economics: "econrun_456",
      selected: "PRJ-A,PRJ-B,PRJ-A,PRJ-C,PRJ-D,../secret",
      requestId: "request_789",
    });

    expect(state).toEqual({
      comparisonRunId: "cmprun_123",
      economicsRunId: "econrun_456",
      selectedProjectKeys: ["PRJ-A", "PRJ-B", "PRJ-C"],
      outcome: undefined,
      requestId: "request_789",
      missingFields: [],
    });
  });

  it("filters requested selections against the authorized structural result", () => {
    expect(
      sanitizeSelectedProjectKeys(
        ["PRJ-A", "PRJ-FOREIGN", "PRJ-C"],
        ["PRJ-A", "PRJ-B", "PRJ-C"],
        ["PRJ-B", "PRJ-C"],
      ),
    ).toEqual(["PRJ-A", "PRJ-C"]);
  });

  it("uses authorized defaults when the request has no valid selection", () => {
    expect(
      sanitizeSelectedProjectKeys(
        ["PRJ-FOREIGN"],
        ["PRJ-A", "PRJ-B", "PRJ-C"],
        ["PRJ-B", "PRJ-C", "PRJ-A"],
      ),
    ).toEqual(["PRJ-B", "PRJ-C", "PRJ-A"]);
  });

  it("round-trips immutable run and selection state in the canonical URL", () => {
    const href = comparisonHref("zh-TW", "PRJ-XINYI-026", {
      comparisonRunId: "cmprun_stage4",
      economicsRunId: "econrun_stage5",
      selectedProjectKeys: ["PRJ-NEIHU-021", "PRJ-ZHONGSHAN-018"],
    });

    expect(href).toBe(
      "/zh-TW/projects/PRJ-XINYI-026/compare?run=cmprun_stage4&economics=econrun_stage5&selected=PRJ-NEIHU-021%2CPRJ-ZHONGSHAN-018",
    );
  });

  it("reads a bounded selection from server-action form data", () => {
    const form = new FormData();
    form.append("selectedProjectKey", "PRJ-A");
    form.append("selectedProjectKey", "PRJ-B");
    form.append("selectedProjectKey", "PRJ-C");
    form.append("selectedProjectKey", "PRJ-D");

    expect(selectedKeysFromFormData(form)).toEqual(["PRJ-A", "PRJ-B", "PRJ-C"]);
  });
  it("preserves bounded Stage 7 evidence route state", () => {
    const state = parseComparisonRouteSearch({
      run: "cmprun_123",
      economics: "econrun_456",
      selected: "PRJ-A,PRJ-B",
      evidenceMode: "claim",
      evidenceClaim: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      evidenceSource: "abcdef0123456789abcdef01",
      evidenceConflict: "conflict_stone_1",
      evidenceReturn: "evidence-cell-imported-stone",
    });

    expect(state.evidenceMode).toBe("claim");
    expect(state.evidenceClaimKey).toBe("IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE");
    expect(state.evidenceSourceKey).toBe("abcdef0123456789abcdef01");
    expect(state.evidenceConflictKey).toBe("conflict_stone_1");
    expect(state.evidenceReturnId).toBe("evidence-cell-imported-stone");
  });
});
