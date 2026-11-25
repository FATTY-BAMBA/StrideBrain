import { describe, expect, it, vi } from "vitest";

import type {
  PersistCompleteComparisonInput,
  Stage4ComparisonResult,
} from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import {
  PrismaComparisonRunRepository,
  type PrismaComparisonRunDatabase,
} from "@/repositories/prisma/prisma-comparison-run-repository";

const ORGANIZATION_ID = "org_horizon";
const PROJECT_ID = "prj_xinyi_026";

function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: "REQ-RUN-READ",
    userId: "person_horizon_mei",
    membershipId: "membership_horizon_mei",
    organizationId: ORGANIZATION_ID,
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: new Set(["project:read", "project:compare", "evidence:read"]),
    assignedProjectIds: new Set([PROJECT_ID]),
    projectAssignments: new Map([
      [PROJECT_ID, { projectId: PROJECT_ID, canReadActuals: false, canCreateAction: true }],
    ]),
    locale: "zh-TW",
    dataMode: "DEMO_SYNTHETIC",
    ...overrides,
  };
}

const result: Stage4ComparisonResult = {
  version: "comparable-project-stage4.v1",
  run: {
    id: "cmprun_stage4",
    generatedAt: "2026-11-14T08:30:00.000Z",
    snapshotDate: "2026-11-14",
    status: "COMPLETE",
    eligibilityPolicyVersion: "CPI-ELIGIBILITY-1.0",
    policyVersion: "CPI-SIM-1.0",
    calculationVersion: "CPI-CALC-1.0",
    inputFingerprint: "input-fingerprint",
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
    activeQuoteVersionKey: "Q-XINYI-026-v3",
  },
  summary: {
    authorizedCandidatesConsidered: 1,
    eligibleForScoring: 1,
    primaryMatchCount: 1,
    broaderMatchCount: 0,
    excludedByReason: {},
    factorsUsed: [
      "SUBTYPE",
      "SCOPE_OVERLAP",
      "AREA_SIMILARITY",
      "COMMERCIAL_CATEGORY_OVERLAP",
      "MATERIAL_OVERLAP",
      "SUPPLIER_OVERLAP",
      "COMPLETION_RECENCY",
      "LOCATION_PROXIMITY",
    ],
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

const input: PersistCompleteComparisonInput = {
  organizationId: ORGANIZATION_ID,
  requestId: "REQ-STAGE4-001",
  actorUserId: "person_horizon_mei",
  actorMembershipId: "membership_horizon_mei",
  intelligenceRunId: "intelrun_stage4",
  comparisonRunId: "cmprun_stage4",
  activeProjectId: PROJECT_ID,
  activeProjectKey: "PRJ-XINYI-026",
  activeQuoteVersionId: "qv_xinyi_026_v3",
  generatedAt: "2026-11-14T08:30:00.000Z",
  snapshotDate: "2026-11-14",
  inputFingerprint: "input-fingerprint",
  sourceFingerprint: "source-fingerprint",
  permissionFingerprint: "permission-fingerprint",
  result,
  candidates: [
    {
      candidateProjectId: "prj_neihu_021",
      candidateProjectKey: "PRJ-NEIHU-021",
      rank: 1,
      score: "87.7350",
      band: "STRONG",
      evidenceCoverage: "100.0000",
      economicsState: "NOT_EVALUATED_STAGE4",
      warnings: [],
      factors: [
        {
          factorKey: "SUBTYPE",
          state: "KNOWN",
          weight: "15.0000",
          normalizedValue: "1.000000",
          contribution: "15.0000",
          explanation: { code: "subtype.compatibility" },
          evidenceReferenceIds: ["EVID-NEIHU-PROJECT"],
        },
        ...Array.from({ length: 7 }, (_, index) => ({
          factorKey: [
            "SCOPE_OVERLAP",
            "AREA_SIMILARITY",
            "COMMERCIAL_CATEGORY_OVERLAP",
            "MATERIAL_OVERLAP",
            "SUPPLIER_OVERLAP",
            "COMPLETION_RECENCY",
            "LOCATION_PROXIMITY",
          ][index] as
            | "SCOPE_OVERLAP"
            | "AREA_SIMILARITY"
            | "COMMERCIAL_CATEGORY_OVERLAP"
            | "MATERIAL_OVERLAP"
            | "SUPPLIER_OVERLAP"
            | "COMPLETION_RECENCY"
            | "LOCATION_PROXIMITY",
          state: "KNOWN" as const,
          weight: "5.0000",
          normalizedValue: "0.600000",
          contribution: "3.0000",
          explanation: { code: "fixture" },
          evidenceReferenceIds: [],
        })),
      ],
    },
  ],
};

function database() {
  const auditCreate = vi.fn().mockResolvedValue({});
  const intelligenceCreate = vi.fn().mockResolvedValue({ id: "intelrun_stage4" });
  const comparisonCreate = vi.fn().mockResolvedValue({ id: "cmprun_stage4" });
  const transaction = vi.fn(async (work: (tx: unknown) => Promise<unknown>) =>
    work({
      auditEvent: { create: auditCreate },
      intelligenceRun: { create: intelligenceCreate },
      comparisonRun: { create: comparisonCreate },
    }),
  );
  const findFirst = vi.fn().mockResolvedValue(null);
  return {
    database: {
      $transaction: transaction,
      comparisonRun: { findFirst },
    } as PrismaComparisonRunDatabase,
    transaction,
    auditCreate,
    intelligenceCreate,
    comparisonCreate,
    findFirst,
  };
}

describe("PrismaComparisonRunRepository", () => {
  it("persists the intelligence run, comparison, candidates, and factors in one transaction", async () => {
    const db = database();
    const repository = new PrismaComparisonRunRepository(db.database);

    await repository.persistComplete(input);
    expect(db.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: input.organizationId,
        actorMembershipId: input.actorMembershipId,
        comparisonRunId: input.comparisonRunId,
        requestId: input.requestId,
        result: "COMPLETED",
      }),
    });

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.intelligenceCreate).toHaveBeenCalledTimes(1);
    expect(db.comparisonCreate).toHaveBeenCalledTimes(1);
    expect(db.intelligenceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: "intelrun_stage4",
          organizationId: ORGANIZATION_ID,
          projectId: PROJECT_ID,
          status: "COMPLETED",
          policyVersion: "CPI-SIM-1.0",
        }),
      }),
    );
    const comparisonData = db.comparisonCreate.mock.calls[0]?.[0]?.data;
    expect(comparisonData).toMatchObject({
      id: "cmprun_stage4",
      organizationId: ORGANIZATION_ID,
      activeProjectId: PROJECT_ID,
      activeQuoteVersionId: "qv_xinyi_026_v3",
      status: "COMPLETED",
      inputFingerprint: "input-fingerprint",
    });
    expect(comparisonData.candidates.create).toHaveLength(1);
    expect(comparisonData.candidates.create[0].factors.create).toHaveLength(8);
    expect(comparisonData.candidates.create[0]).toMatchObject({
      candidateProjectId: "prj_neihu_021",
      score: "87.7350",
      evidenceCoverage: "100.0000",
      economicsState: "NOT_EVALUATED_STAGE4",
    });
  });

  it("reopens the stored immutable public result after current-context authorization", async () => {
    const db = database();
    db.findFirst.mockResolvedValue({
      id: "cmprun_stage4",
      organizationId: ORGANIZATION_ID,
      activeProjectId: PROJECT_ID,
      status: "COMPLETED",
      resultSnapshot: {
        schemaVersion: "comparison-run-snapshot.v1",
        result,
        fingerprints: {
          source: "source-fingerprint",
          permission: "permission-fingerprint",
          input: "input-fingerprint",
        },
      },
    });
    const repository = new PrismaComparisonRunRepository(db.database);

    await expect(repository.getAuthorizedResult(context(), "cmprun_stage4")).resolves.toEqual(
      result,
    );
    expect(db.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "cmprun_stage4",
          organizationId: ORGANIZATION_ID,
          status: "COMPLETED",
        },
      }),
    );
  });

  it("returns null identically for an unassigned reviewer after the organization-scoped lookup", async () => {
    const db = database();
    db.findFirst.mockResolvedValue({
      id: "cmprun_stage4",
      organizationId: ORGANIZATION_ID,
      activeProjectId: PROJECT_ID,
      status: "COMPLETED",
      resultSnapshot: {
        schemaVersion: "comparison-run-snapshot.v1",
        result,
        fingerprints: {},
      },
    });
    const repository = new PrismaComparisonRunRepository(db.database);
    const unassigned = context({
      role: "FINANCIAL_REVIEWER",
      assignedProjectIds: new Set(),
      projectAssignments: new Map(),
    });

    await expect(repository.getAuthorizedResult(unassigned, "cmprun_stage4")).resolves.toBeNull();
  });

  it("does not query a run without project:compare", async () => {
    const db = database();
    const repository = new PrismaComparisonRunRepository(db.database);

    await expect(
      repository.getAuthorizedResult(
        context({ capabilities: new Set(["project:read"]) }),
        "cmprun_stage4",
      ),
    ).resolves.toBeNull();
    expect(db.findFirst).not.toHaveBeenCalled();
  });

  it("propagates transaction failure without a partially successful return", async () => {
    const db = database();
    db.comparisonCreate.mockRejectedValueOnce(new Error("comparison insert failed"));
    const repository = new PrismaComparisonRunRepository(db.database);

    await expect(repository.persistComplete(input)).rejects.toThrow("comparison insert failed");
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });
});
