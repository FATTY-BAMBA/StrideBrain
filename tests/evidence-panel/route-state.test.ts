import { describe, expect, it } from "vitest";

import {
  parseEvidenceSelection,
  evidenceSelectionParams,
} from "@/modules/evidence-panel/route-state";

describe("Stage 7 evidence route state", () => {
  it("parses a claim selection only with immutable run identifiers", () => {
    expect(
      parseEvidenceSelection({
        comparisonRunId: "cmprun-1",
        economicsRunId: "econrun-1",
        evidenceMode: "claim",
        evidenceClaimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      }),
    ).toEqual({
      mode: "CLAIM",
      comparisonRunId: "cmprun-1",
      enrichmentRunId: "econrun-1",
      claimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
    });
  });

  it("parses a deterministic factor selection and rejects unknown factor keys", () => {
    expect(
      parseEvidenceSelection({
        comparisonRunId: "cmprun-1",
        evidenceMode: "FACTOR",
        evidenceCandidateProjectKey: "PRJ-NEIHU-021",
        evidenceFactorKey: "AREA_SIMILARITY",
      }),
    ).toMatchObject({ mode: "FACTOR", factorKey: "AREA_SIMILARITY" });

    expect(
      parseEvidenceSelection({
        comparisonRunId: "cmprun-1",
        evidenceMode: "FACTOR",
        evidenceCandidateProjectKey: "PRJ-NEIHU-021",
        evidenceFactorKey: "AI_GUESS",
      }),
    ).toBeNull();
  });

  it("requires opaque hexadecimal source keys and an authorized origin", () => {
    expect(
      parseEvidenceSelection({
        comparisonRunId: "cmprun-1",
        economicsRunId: "econrun-1",
        evidenceMode: "SOURCE",
        evidenceSourceKey: "0123456789abcdef01234567",
        evidenceClaimKey: "OVERALL_QUOTED_VARIANCE",
      }),
    ).toMatchObject({ mode: "SOURCE", sourceKey: "0123456789abcdef01234567" });

    expect(
      parseEvidenceSelection({
        comparisonRunId: "cmprun-1",
        evidenceMode: "SOURCE",
        evidenceSourceKey: "evid_cost_internal_id",
        evidenceClaimKey: "OVERALL_QUOTED_VARIANCE",
      }),
    ).toBeNull();
  });

  it("serializes only the public evidence selection contract", () => {
    expect(
      evidenceSelectionParams({
        mode: "FACTOR",
        comparisonRunId: "cmprun-1",
        candidateProjectKey: "PRJ-NEIHU-021",
        factorKey: "SCOPE_OVERLAP",
      }),
    ).toEqual({
      evidenceMode: "factor",
      evidenceCandidate: "PRJ-NEIHU-021",
      evidenceFactor: "SCOPE_OVERLAP",
    });
  });
  it("requires conflict selections to stay bound to an authorized claim or factor source", () => {
    expect(
      parseEvidenceSelection({
        comparisonRunId: "cmprun-1",
        economicsRunId: "econrun-1",
        evidenceMode: "CONFLICT",
        evidenceConflictKey: "CONFLICT-STONE-1",
        evidenceSourceKey: "0123456789abcdef01234567",
        evidenceClaimKey: "IMPORTED_STONE_FORECAST_ACTUAL_VARIANCE",
      }),
    ).toMatchObject({
      mode: "CONFLICT",
      conflictKey: "CONFLICT-STONE-1",
      sourceKey: "0123456789abcdef01234567",
    });

    expect(
      parseEvidenceSelection({
        comparisonRunId: "cmprun-1",
        evidenceMode: "CONFLICT",
        evidenceConflictKey: "CONFLICT-STONE-1",
      }),
    ).toBeNull();
  });
});
