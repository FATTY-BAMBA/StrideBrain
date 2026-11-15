import { describe, expect, it, vi } from "vitest";

import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import { RunHistoricalEconomicsEnrichment } from "@/modules/economics/application/run-historical-economics-enrichment";
import type { AuthorizedEconomicsBatch } from "@/modules/economics/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";
import type { EconomicsObservationRepositoryPort } from "@/repositories/ports/economics-observation-repository";

const ORGANIZATION_ID = "org_horizon";
const ACTIVE_PROJECT_ID = "prj_xinyi_026";
const COMPARISON_RUN_ID = "cmprun_stage4";

function runtimeContext(): RuntimeContext {
  return {
    requestId: "REQ-STAGE5-001",
    userId: "person_horizon_viewer",
    membershipId: "membership_horizon_viewer",
    organizationId: ORGANIZATION_ID,
    role: "VIEWER",
    capabilities: new Set(["project:read", "project:compare", "evidence:read"]),
    assignedProjectIds: new Set([ACTIVE_PROJECT_ID]),
    projectAssignments: new Map([
      [
        ACTIVE_PROJECT_ID,
        { projectId: ACTIVE_PROJECT_ID, canReadActuals: false, canCreateAction: false },
      ],
    ]),
    locale: "en",
    dataMode: "DEMO_SYNTHETIC",
  };
}

function stage4Result(): Stage4ComparisonResult {
  return {
    version: "comparable-project-stage4.v1",
    run: {
      id: COMPARISON_RUN_ID,
      generatedAt: "2026-11-14T08:30:00.000Z",
      snapshotDate: "2026-11-14",
      status: "COMPLETE",
      eligibilityPolicyVersion: "CPI-ELIGIBILITY-1.0",
      policyVersion: "CPI-SIM-1.0",
      calculationVersion: "CPI-CALC-1.0",
      inputFingerprint: "stage4-input",
    },
    activeContext: {
      projectKey: "PRJ-XINYI-026",
      nameEn: "Xinyi Flagship Renovation",
      nameZhTw: "信義旗艦店裝修",
      comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
      subtype: "RETAIL_FLAGSHIP",
      areaValue: "640.000",
      areaUnit: "m2",
      currency: "TWD",
      location: { city: "Taipei City", district: "Xinyi District" },
      activeQuoteVersionKey: "Q-PRJ-XINYI-026-v3",
    },
    summary: {
      authorizedCandidatesConsidered: 1,
      eligibleForScoring: 1,
      primaryMatchCount: 1,
      broaderMatchCount: 0,
      excludedByReason: {},
      factorsUsed: [],
      missingOptionalContext: [],
    },
    matches: [
      {
        project: {
          projectKey: "PRJ-NEIHU-021",
          nameEn: "Neihu Tech Flagship",
          nameZhTw: "內湖科技旗艦店",
          subtype: "RETAIL_FLAGSHIP",
          location: { city: "Taipei City", district: "Neihu District" },
          areaValue: "610.000",
          areaUnit: "m2",
          completedAt: "2025-06-30",
        },
        rank: 1,
        score: "87.7350",
        displayScore: 88,
        band: "STRONG",
        evidenceCoverage: "100.0000",
        displayEvidenceCoverage: 100,
        tier: "PRIMARY",
        strongestFactors: [],
        differences: [],
        unknowns: [],
        equivalentWithinTwoPoints: [],
        policyVersion: "CPI-SIM-1.0",
      },
    ],
    broaderMatches: [],
    defaultSelectedProjectKeys: ["PRJ-NEIHU-021"],
  };
}

function structuralBatch(stage4: Stage4ComparisonResult): AuthorizedEconomicsBatch {
  return {
    structuralResult: stage4,
    comparisonRunId: COMPARISON_RUN_ID,
    activeProjectId: ACTIVE_PROJECT_ID,
    activeProjectKey: "PRJ-XINYI-026",
    selectedProjectIds: ["prj_neihu_021"],
    selectedProjectKeys: ["PRJ-NEIHU-021"],
    accessScope: "STRUCTURAL_ONLY",
    canReadEvidence: true,
    projects: [
      {
        internalId: ACTIVE_PROJECT_ID,
        businessKey: "PRJ-XINYI-026",
        status: "ACTIVE",
        areaValue: "640.000",
        areaUnit: "m2",
        currency: "TWD",
        dataClassification: "DEMO_SYNTHETIC",
        evidenceReferenceIds: [],
      },
      {
        internalId: "prj_neihu_021",
        businessKey: "PRJ-NEIHU-021",
        status: "COMPLETED",
        areaValue: "610.000",
        areaUnit: "m2",
        currency: "TWD",
        dataClassification: "DEMO_SYNTHETIC",
        evidenceReferenceIds: [],
      },
    ],
    records: [],
    evidence: [],
    diagnostics: {
      databaseQueries: 1,
      projectRowsReturned: 2,
      financialRecordsReturned: 0,
      evidenceRowsReturned: 0,
      maximumSelectedProjects: 3,
    },
  };
}

function comparisonPort(result: Stage4ComparisonResult | null): ComparisonRunRepositoryPort {
  return {
    persistComplete: vi.fn(),
    getAuthorizedResult: vi.fn().mockResolvedValue(result),
  };
}

function observationPort(
  batch: AuthorizedEconomicsBatch | null,
): EconomicsObservationRepositoryPort {
  return {
    loadAuthorizedBatch: vi.fn().mockResolvedValue(batch),
  };
}

function enrichmentPort(): EconomicsEnrichmentRunRepositoryPort & {
  persistComplete: ReturnType<typeof vi.fn>;
} {
  return {
    persistComplete: vi.fn().mockResolvedValue(undefined),
    getAuthorizedResult: vi.fn().mockResolvedValue(null),
  };
}

describe("RunHistoricalEconomicsEnrichment", () => {
  it("assembles and persists an immutable restricted Stage 5 result", async () => {
    const stage4 = stage4Result();
    const observations = observationPort(structuralBatch(stage4));
    const enrichments = enrichmentPort();
    const useCase = new RunHistoricalEconomicsEnrichment(
      comparisonPort(stage4),
      observations,
      enrichments,
      undefined,
      () => new Date("2026-11-15T01:00:00.000Z"),
      () => "econrun_stage5",
    );

    const outcome = await useCase.execute(runtimeContext(), COMPARISON_RUN_ID);

    expect(outcome.kind).toBe("PARTIAL_ECONOMICS");
    if (outcome.kind === "UNAVAILABLE" || outcome.kind === "FAILED") return;
    expect(outcome.result).toMatchObject({
      version: "comparable-project-stage5.v1",
      accessScope: "STRUCTURAL_ONLY",
      run: {
        id: "econrun_stage5",
        comparisonRunId: COMPARISON_RUN_ID,
        status: "PARTIAL_ECONOMICS",
      },
      summary: {
        quotedHistoryState: "RESTRICTED",
        actualHistoryState: "RESTRICTED",
      },
      current: { currency: "TWD" },
    });
    expect(enrichments.persistComplete).toHaveBeenCalledTimes(1);
    expect(enrichments.persistComplete.mock.calls[0]?.[0]).toMatchObject({
      organizationId: ORGANIZATION_ID,
      enrichmentRunId: "econrun_stage5",
      comparisonRunId: COMPARISON_RUN_ID,
      activeProjectId: ACTIVE_PROJECT_ID,
      accessScope: "STRUCTURAL_ONLY",
    });
  });

  it("returns a non-disclosing unavailable result before observation reads", async () => {
    const observations = observationPort(null);
    const enrichments = enrichmentPort();
    const useCase = new RunHistoricalEconomicsEnrichment(
      comparisonPort(null),
      observations,
      enrichments,
    );

    await expect(useCase.execute(runtimeContext(), "missing-run")).resolves.toEqual({
      kind: "UNAVAILABLE",
      errorCode: "ECONOMICS_UNAVAILABLE",
      requestId: "REQ-STAGE5-001",
    });
    expect(observations.loadAuthorizedBatch).not.toHaveBeenCalled();
    expect(enrichments.persistComplete).not.toHaveBeenCalled();
  });

  it("fails closed if atomic persistence rejects", async () => {
    const stage4 = stage4Result();
    const enrichments = enrichmentPort();
    enrichments.persistComplete.mockRejectedValueOnce(new Error("write failed"));
    const useCase = new RunHistoricalEconomicsEnrichment(
      comparisonPort(stage4),
      observationPort(structuralBatch(stage4)),
      enrichments,
      undefined,
      () => new Date("2026-11-15T01:00:00.000Z"),
      () => "econrun_stage5",
    );

    await expect(useCase.execute(runtimeContext(), COMPARISON_RUN_ID)).resolves.toEqual({
      kind: "FAILED",
      errorCode: "ECONOMICS_FAILED",
      requestId: "REQ-STAGE5-001",
    });
  });
});
