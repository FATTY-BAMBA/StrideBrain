import { describe, expect, it, vi } from "vitest";

import { RunComparableProjectAnalysis } from "@/modules/comparisons/application/run-comparable-project-analysis";
import type { ComparisonProjectProfile } from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ComparableProjectRepositoryPort } from "@/repositories/ports/comparable-project-repository";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { ProjectRepositoryPort } from "@/repositories/ports/project-repository";

const PROJECT_ID = "prj_xinyi_026";
const PROJECT_KEY = "PRJ-XINYI-026";
const ORGANIZATION_ID = "org_horizon";
const NOW = new Date("2026-11-14T08:30:00.000Z");
const SCOPES = [
  "SELECTIVE_DEMOLITION",
  "PARTITIONS_CEILINGS",
  "CUSTOM_MILLWORK",
  "LIGHTING_ELECTRICAL",
  "IMPORTED_STONE",
  "SIGNAGE",
  "COORDINATION",
] as const;
const COMMERCIAL = [
  "DEMOLITION_CEILING",
  "CUSTOM_MILLWORK",
  "LIGHTING_ELECTRICAL",
  "IMPORTED_STONE",
  "SIGNAGE",
  "COORDINATION",
] as const;

function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: "REQ-STAGE4-001",
    userId: "person_horizon_mei",
    membershipId: "membership_horizon_mei",
    organizationId: ORGANIZATION_ID,
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: new Set([
      "project:read",
      "project:compare",
      "quote:read",
      "commercial:forecast-read",
      "evidence:read",
    ]),
    assignedProjectIds: new Set([PROJECT_ID]),
    projectAssignments: new Map([
      [PROJECT_ID, { projectId: PROJECT_ID, canReadActuals: false, canCreateAction: true }],
    ]),
    locale: "zh-TW",
    dataMode: "DEMO_SYNTHETIC",
    ...overrides,
  };
}

function profile(overrides: Partial<ComparisonProjectProfile> = {}): ComparisonProjectProfile {
  return {
    internalId: "prj_neihu_021",
    organizationId: ORGANIZATION_ID,
    businessKey: "PRJ-NEIHU-021",
    nameEn: "Neihu Tech Flagship",
    nameZhTw: "內湖科技旗艦店",
    comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
    subtype: "RETAIL_FLAGSHIP",
    status: "COMPLETED",
    location: { city: "Taipei City", district: "Neihu District" },
    areaValue: "610.000",
    areaUnit: "m2",
    currency: "TWD",
    completedAt: "2025-06-30",
    metadataAuthority: "HUMAN_REVIEWED",
    dataClassification: "DEMO_SYNTHETIC",
    scopeCategoryIds: SCOPES,
    commercialCategoryIds: COMMERCIAL,
    materialIds: ["MAT-IMPORTED-STONE", "MAT-DOMESTIC-LIGHTING", "MAT-CUSTOM-MILLWORK"],
    supplierIds: ["SUP-01", "SUP-04", "SUP-05"],
    factorEvidence: {
      SUBTYPE: ["EVID-NEIHU-PROJECT"],
      SCOPE_OVERLAP: ["EVID-NEIHU-PROJECT"],
      AREA_SIMILARITY: ["EVID-NEIHU-PROJECT"],
      COMMERCIAL_CATEGORY_OVERLAP: ["EVID-NEIHU-QUOTE"],
      MATERIAL_OVERLAP: ["EVID-NEIHU-QUOTE"],
      SUPPLIER_OVERLAP: ["EVID-NEIHU-QUOTE"],
      COMPLETION_RECENCY: ["EVID-NEIHU-PROJECT"],
      LOCATION_PROXIMITY: ["EVID-NEIHU-PROJECT"],
    },
    recordVersion: "2025-06-30T00:00:00.000Z|qv_neihu_021_v2",
    ...overrides,
  };
}

const activeProfile: ComparisonProjectProfile = profile({
  internalId: PROJECT_ID,
  businessKey: PROJECT_KEY,
  nameEn: "Xinyi Flagship Renovation",
  nameZhTw: "信義旗艦店裝修",
  status: "ACTIVE",
  location: { city: "Taipei City", district: "Xinyi District" },
  areaValue: "640.000",
  completedAt: undefined,
  materialIds: ["MAT-IMPORTED-STONE", "MAT-PREMIUM-LIGHTING", "MAT-CUSTOM-MILLWORK"],
  supplierIds: ["SUP-01", "SUP-03", "SUP-05"],
  recordVersion: "2026-11-14T00:00:00.000Z|qv_xinyi_026_v3",
});

function projectPort(found = true): ProjectRepositoryPort {
  return {
    getAuthorizedByBusinessKey: vi.fn().mockResolvedValue(
      found
        ? {
            id: PROJECT_ID,
            businessKey: PROJECT_KEY,
            organizationId: ORGANIZATION_ID,
            recordVersion: 1,
          }
        : null,
    ),
  };
}

function candidatePort(
  profiles: readonly ComparisonProjectProfile[] = [profile()],
  active: ComparisonProjectProfile = activeProfile,
): ComparableProjectRepositoryPort {
  return {
    getActiveComparisonProfile: vi.fn().mockResolvedValue({
      profile: active,
      activeQuoteVersionId: "qv_xinyi_026_v3",
      activeQuoteVersionKey: "Q-XINYI-026-v3",
    }),
    listAuthorizedHistoricalProfiles: vi.fn().mockResolvedValue({
      profiles,
      diagnostics: {
        databaseQueries: 2,
        authorizedRowsReturned: profiles.length,
        maximumRows: 100,
      },
    }),
  };
}

function runPort(): ComparisonRunRepositoryPort & {
  persistComplete: ReturnType<typeof vi.fn>;
} {
  return {
    persistComplete: vi.fn().mockResolvedValue(undefined),
    getAuthorizedResult: vi.fn().mockResolvedValue(null),
  };
}

function idFactory() {
  const ids = ["intelrun_stage4", "cmprun_stage4"];
  return vi.fn(() => ids.shift() ?? "unexpected_id");
}

describe("RunComparableProjectAnalysis", () => {
  it("produces and atomically submits a deterministic structured Stage 4 run", async () => {
    const runs = runPort();
    const useCase = new RunComparableProjectAnalysis(
      projectPort(),
      candidatePort(),
      runs,
      undefined,
      () => NOW,
      idFactory(),
    );

    const outcome = await useCase.execute(context(), PROJECT_KEY);

    expect(outcome.kind).toBe("COMPLETE");
    if (outcome.kind !== "COMPLETE") return;
    expect(outcome.result.run).toMatchObject({
      id: "cmprun_stage4",
      snapshotDate: "2026-11-14",
      policyVersion: "CPI-SIM-1.0",
      calculationVersion: "CPI-CALC-1.0",
    });
    expect(outcome.result.matches).toHaveLength(1);
    expect(outcome.result.matches[0]).toMatchObject({
      project: { projectKey: "PRJ-NEIHU-021" },
      displayScore: 88,
      band: "STRONG",
      tier: "PRIMARY",
    });
    expect(outcome.result.activeContext.activeQuoteVersionKey).toBe("Q-XINYI-026-v3");
    expect(runs.persistComplete).toHaveBeenCalledTimes(1);
    const persisted = runs.persistComplete.mock.calls[0]?.[0];
    expect(persisted).toMatchObject({
      intelligenceRunId: "intelrun_stage4",
      comparisonRunId: "cmprun_stage4",
      activeProjectId: PROJECT_ID,
      activeQuoteVersionId: "qv_xinyi_026_v3",
    });
    expect(persisted.candidates[0].factors).toHaveLength(8);
    expect(
      persisted.candidates[0].factors.map((factor: { factorKey: string }) => factor.factorKey),
    ).toEqual([
      "SUBTYPE",
      "SCOPE_OVERLAP",
      "AREA_SIMILARITY",
      "COMMERCIAL_CATEGORY_OVERLAP",
      "MATERIAL_OVERLAP",
      "SUPPLIER_OVERLAP",
      "COMPLETION_RECENCY",
      "LOCATION_PROXIMITY",
    ]);
  });

  it("returns the same unavailable outcome before loading candidate history", async () => {
    const candidates = candidatePort();
    const runs = runPort();
    const useCase = new RunComparableProjectAnalysis(projectPort(false), candidates, runs);

    await expect(useCase.execute(context(), "PRJ-UNKNOWN")).resolves.toEqual({
      kind: "UNAVAILABLE",
      errorCode: "PROJECT_UNAVAILABLE",
      requestId: "REQ-STAGE4-001",
    });
    expect(candidates.getActiveComparisonProfile).not.toHaveBeenCalled();
    expect(candidates.listAuthorizedHistoricalProfiles).not.toHaveBeenCalled();
    expect(runs.persistComplete).not.toHaveBeenCalled();
  });

  it("returns explicit missing active context without scoring or persistence", async () => {
    const candidates = candidatePort([profile()], {
      ...activeProfile,
      scopeCategoryIds: [],
      commercialCategoryIds: [],
    });
    const runs = runPort();
    const useCase = new RunComparableProjectAnalysis(
      projectPort(),
      candidates,
      runs,
      undefined,
      () => NOW,
    );

    const outcome = await useCase.execute(context(), PROJECT_KEY);

    expect(outcome).toMatchObject({
      kind: "CONTEXT_INCOMPLETE",
      errorCode: "PROJECT_CONTEXT_INCOMPLETE",
      missingFields: expect.arrayContaining(["SCOPE_CATEGORIES", "COMMERCIAL_CATEGORIES"]),
    });
    expect(candidates.listAuthorizedHistoricalProfiles).not.toHaveBeenCalled();
    expect(runs.persistComplete).not.toHaveBeenCalled();
  });

  it("returns a safe no-history summary for authorized but ineligible candidates", async () => {
    const candidates = candidatePort([
      profile({ comparisonClass: "COMMERCIAL_OFFICE_FIT_OUT" }),
      profile({ internalId: "prj_cancelled", businessKey: "PRJ-CANCELLED", status: "CANCELLED" }),
    ]);
    const runs = runPort();
    const useCase = new RunComparableProjectAnalysis(
      projectPort(),
      candidates,
      runs,
      undefined,
      () => NOW,
    );

    const outcome = await useCase.execute(context(), PROJECT_KEY);

    expect(outcome).toEqual({
      kind: "NO_ELIGIBLE_HISTORY",
      errorCode: "COMPARISON_NO_ELIGIBLE_HISTORY",
      requestId: "REQ-STAGE4-001",
      summary: {
        authorizedCandidatesConsidered: 2,
        eligibleForScoring: 0,
        primaryMatchCount: 0,
        broaderMatchCount: 0,
        excludedByReason: {
          COMPARISON_CLASS_MISMATCH: 1,
          STATUS_NOT_HISTORICAL: 1,
        },
      },
    });
    expect(runs.persistComplete).not.toHaveBeenCalled();
  });

  it("fails closed if a repository ever returns a cross-organization candidate", async () => {
    const candidates = candidatePort([profile({ organizationId: "org_northern" })]);
    const runs = runPort();
    const useCase = new RunComparableProjectAnalysis(
      projectPort(),
      candidates,
      runs,
      undefined,
      () => NOW,
    );

    await expect(useCase.execute(context(), PROJECT_KEY)).resolves.toEqual({
      kind: "FAILED",
      errorCode: "COMPARISON_FAILED",
      requestId: "REQ-STAGE4-001",
    });
    expect(runs.persistComplete).not.toHaveBeenCalled();
  });

  it("returns a safe failure when atomic persistence fails", async () => {
    const runs = runPort();
    runs.persistComplete.mockRejectedValueOnce(new Error("database unavailable"));
    const useCase = new RunComparableProjectAnalysis(
      projectPort(),
      candidatePort(),
      runs,
      undefined,
      () => NOW,
      idFactory(),
    );

    await expect(useCase.execute(context(), PROJECT_KEY)).resolves.toEqual({
      kind: "FAILED",
      errorCode: "COMPARISON_FAILED",
      requestId: "REQ-STAGE4-001",
    });
  });

  it("keeps Viewer output structural and free of commercial amounts", async () => {
    const viewer = context({
      userId: "person_horizon_viewer",
      membershipId: "membership_horizon_viewer",
      role: "VIEWER",
      capabilities: new Set(["project:read", "project:compare", "evidence:read"]),
      projectAssignments: new Map([
        [PROJECT_ID, { projectId: PROJECT_ID, canReadActuals: false, canCreateAction: false }],
      ]),
    });
    const useCase = new RunComparableProjectAnalysis(
      projectPort(),
      candidatePort(),
      runPort(),
      undefined,
      () => NOW,
      idFactory(),
    );

    const outcome = await useCase.execute(viewer, PROJECT_KEY);

    expect(outcome.kind).toBe("COMPLETE");
    const serialized = JSON.stringify(outcome);
    expect(serialized).not.toContain("amountBeforeTax");
    expect(serialized).not.toContain("totalDirectCost");
    expect(serialized).not.toContain("grossMargin");
    expect(serialized).not.toContain("actualCost");
  });

  it("is deterministic for identical authorized inputs and snapshot", async () => {
    const first = new RunComparableProjectAnalysis(
      projectPort(),
      candidatePort(),
      runPort(),
      undefined,
      () => NOW,
      idFactory(),
    );
    const second = new RunComparableProjectAnalysis(
      projectPort(),
      candidatePort(),
      runPort(),
      undefined,
      () => NOW,
      idFactory(),
    );

    const a = await first.execute(context(), PROJECT_KEY);
    const b = await second.execute(context(), PROJECT_KEY);

    expect(a).toEqual(b);
  });
});
