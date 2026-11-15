import { describe, expect, it, vi } from "vitest";

import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import {
  PrismaEconomicsObservationRepository,
  type PrismaEconomicsObservationDatabase,
} from "@/repositories/prisma/prisma-economics-observation-repository";

const ORGANIZATION_ID = "org_horizon";
const ACTIVE_PROJECT_ID = "prj_xinyi_026";
const HISTORICAL_PROJECT_ID = "prj_neihu_021";
const COMPARISON_RUN_ID = "cmprun_stage4";

function context(
  role: RuntimeContext["role"] = "FINANCIAL_REVIEWER",
  capabilities: RuntimeContext["capabilities"] = new Set([
    "project:read",
    "project:compare",
    "quote:read",
    "commercial:forecast-read",
    "commercial:actual-read",
    "evidence:read",
  ]),
): RuntimeContext {
  return {
    requestId: "REQ-STAGE5-REPOSITORY",
    userId: `person_${role.toLowerCase()}`,
    membershipId: `membership_${role.toLowerCase()}`,
    organizationId: ORGANIZATION_ID,
    role,
    capabilities,
    assignedProjectIds: new Set([ACTIVE_PROJECT_ID, HISTORICAL_PROJECT_ID]),
    projectAssignments: new Map([
      [
        ACTIVE_PROJECT_ID,
        { projectId: ACTIVE_PROJECT_ID, canReadActuals: true, canCreateAction: true },
      ],
      [
        HISTORICAL_PROJECT_ID,
        { projectId: HISTORICAL_PROJECT_ID, canReadActuals: true, canCreateAction: false },
      ],
    ]),
    locale: "en",
    dataMode: "DEMO_SYNTHETIC",
  };
}

function stage4(): Stage4ComparisonResult {
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

const activeProject = {
  id: ACTIVE_PROJECT_ID,
  businessKey: "PRJ-XINYI-026",
  status: "ACTIVE" as const,
  areaQuantity: "640.000",
  areaUnit: "m2",
  currency: "TWD",
  programmeWeeks: "16.00",
  dataClassification: "DEMO_SYNTHETIC" as const,
};

const historicalProject = {
  id: HISTORICAL_PROJECT_ID,
  businessKey: "PRJ-NEIHU-021",
  status: "COMPLETED" as const,
  areaQuantity: "610.000",
  areaUnit: "m2",
  currency: "TWD",
  programmeWeeks: "20.00",
  dataClassification: "DEMO_SYNTHETIC" as const,
};

function database() {
  const comparisonRun = vi.fn().mockResolvedValue({
    id: COMPARISON_RUN_ID,
    organizationId: ORGANIZATION_ID,
    activeProjectId: ACTIVE_PROJECT_ID,
    status: "COMPLETED",
    activeProject,
    candidates: [
      {
        candidateProjectId: HISTORICAL_PROJECT_ID,
        rank: 1,
        candidateProject: historicalProject,
      },
    ],
  });
  const quoteVersion = vi.fn().mockResolvedValue([
    {
      id: "qv_xinyi_v3",
      organizationId: ORGANIZATION_ID,
      versionNumber: 3,
      observationType: "QUOTED_PRICE",
      authorityState: "HUMAN_REVIEWED",
      currency: "TWD",
      amountBeforeTax: "16480000.00",
      approvedAt: null,
      createdAt: new Date("2026-11-14T00:00:00.000Z"),
      supersededById: null,
      quote: { businessKey: "Q-PRJ-XINYI-026", projectId: ACTIVE_PROJECT_ID },
      items: [
        {
          id: "qi_xinyi_stone",
          lineNumber: 1,
          categoryId: "IMPORTED_STONE",
          amount: "3000000.00",
          quantity: "1.000",
          unitPrice: "3000000.000000",
          unit: "lot",
          authorityState: "HUMAN_REVIEWED",
        },
      ],
    },
    {
      id: "qv_neihu_v2",
      organizationId: ORGANIZATION_ID,
      versionNumber: 2,
      observationType: "QUOTED_PRICE",
      authorityState: "APPROVED_COMMERCIAL",
      currency: "TWD",
      amountBeforeTax: "15120000.00",
      approvedAt: new Date("2025-02-01T00:00:00.000Z"),
      createdAt: new Date("2025-02-01T00:00:00.000Z"),
      supersededById: null,
      quote: { businessKey: "Q-PRJ-NEIHU-021", projectId: HISTORICAL_PROJECT_ID },
      items: [
        {
          id: "qi_neihu_stone",
          lineNumber: 1,
          categoryId: "IMPORTED_STONE",
          amount: "2000000.00",
          quantity: "1.000",
          unitPrice: "2000000.000000",
          unit: "lot",
          authorityState: "APPROVED_COMMERCIAL",
        },
      ],
    },
  ]);
  const forecastCostVersion = vi.fn().mockResolvedValue([
    {
      id: "fcv_xinyi_v1",
      organizationId: ORGANIZATION_ID,
      projectId: ACTIVE_PROJECT_ID,
      versionNumber: 1,
      observationType: "FORECAST_DIRECT_COST",
      authorityState: "HUMAN_REVIEWED",
      currency: "TWD",
      totalDirectCost: "12650000.00",
      effectiveAt: new Date("2026-11-14T00:00:00.000Z"),
      supersededById: null,
      lines: [
        {
          id: "fcl_xinyi_stone",
          lineNumber: 1,
          categoryId: "IMPORTED_STONE",
          amount: "2360000.00",
          quantity: "1.000",
          unitCost: "2360000.000000",
          unit: "lot",
          authorityState: "HUMAN_REVIEWED",
        },
      ],
    },
  ]);
  const projectCostVersion = vi.fn().mockResolvedValue([
    {
      id: "pcv_neihu_v1",
      organizationId: ORGANIZATION_ID,
      projectId: HISTORICAL_PROJECT_ID,
      versionNumber: 1,
      observationType: "RECONCILED_ACTUAL_COST",
      authorityState: "RECONCILED_ACTUAL",
      currency: "TWD",
      totalDirectCost: "11580000.00",
      reconciledAt: new Date("2025-07-20T00:00:00.000Z"),
      supersededById: null,
      lines: [
        {
          id: "cl_neihu_stone",
          lineNumber: 1,
          categoryId: "IMPORTED_STONE",
          amount: "1900000.00",
          quantity: "1.000",
          unitCost: "1900000.000000",
          unit: "lot",
          authorityState: "RECONCILED_ACTUAL",
        },
      ],
    },
  ]);
  const supplierOffer = vi.fn().mockResolvedValue([
    {
      id: "offer_stone_2025",
      organizationId: ORGANIZATION_ID,
      businessKey: "SUP-OFFER-STONE-2025",
      projectId: HISTORICAL_PROJECT_ID,
      observationType: "SUPPLIER_OFFER",
      authorityState: "APPROVED_COMMERCIAL",
      currency: "TWD",
      amountBeforeTax: "1850000.00",
      offeredAt: new Date("2025-01-15T00:00:00.000Z"),
      validUntil: new Date("2025-02-15T00:00:00.000Z"),
      items: [
        {
          id: "soi_stone_2025",
          lineNumber: 1,
          categoryId: "IMPORTED_STONE",
          amount: "1850000.00",
          quantity: "1.000",
          unitPrice: "1850000.000000",
          unit: "lot",
        },
      ],
    },
  ]);
  const evidenceReference = vi.fn().mockResolvedValue([
    {
      id: "evid_project_xinyi",
      subjectType: "PROJECT",
      subjectId: ACTIVE_PROJECT_ID,
      documentVersionId: null,
      locator: { field: "programmeWeeks" },
      claimKey: "project:programmeWeeks",
      supportedValue: { value: "16.00" },
      authorityState: "HUMAN_REVIEWED",
      observationType: null,
      dataClassification: "DEMO_SYNTHETIC",
      effectiveAt: new Date("2026-11-14T00:00:00.000Z"),
      staleAt: null,
    },
    {
      id: "evid_quote_xinyi",
      subjectType: "QUOTE_ITEM",
      subjectId: "qi_xinyi_stone",
      documentVersionId: null,
      locator: { lineNumber: 1 },
      claimKey: "quoted-price:IMPORTED_STONE",
      supportedValue: { amount: "3000000.00" },
      authorityState: "HUMAN_REVIEWED",
      observationType: "QUOTED_PRICE",
      dataClassification: "DEMO_SYNTHETIC",
      effectiveAt: new Date("2026-11-14T00:00:00.000Z"),
      staleAt: null,
    },
    {
      id: "evid_forecast_xinyi",
      subjectType: "FORECAST_COST_LINE",
      subjectId: "fcl_xinyi_stone",
      documentVersionId: null,
      locator: { lineNumber: 1 },
      claimKey: "forecast-cost:IMPORTED_STONE",
      supportedValue: { amount: "2360000.00" },
      authorityState: "HUMAN_REVIEWED",
      observationType: "FORECAST_DIRECT_COST",
      dataClassification: "DEMO_SYNTHETIC",
      effectiveAt: new Date("2026-11-14T00:00:00.000Z"),
      staleAt: null,
    },
    {
      id: "evid_actual_neihu",
      subjectType: "COST_LINE",
      subjectId: "cl_neihu_stone",
      documentVersionId: null,
      locator: { lineNumber: 1 },
      claimKey: "actual-cost:IMPORTED_STONE",
      supportedValue: { amount: "1900000.00" },
      authorityState: "RECONCILED_ACTUAL",
      observationType: "RECONCILED_ACTUAL_COST",
      dataClassification: "DEMO_SYNTHETIC",
      effectiveAt: new Date("2025-07-20T00:00:00.000Z"),
      staleAt: null,
    },
    {
      id: "evid_offer_neihu",
      subjectType: "SUPPLIER_OFFER",
      subjectId: "offer_stone_2025",
      documentVersionId: null,
      locator: { offer: "SUP-OFFER-STONE-2025" },
      claimKey: "supplier-offer:stone",
      supportedValue: { amount: "1850000.00" },
      authorityState: "APPROVED_COMMERCIAL",
      observationType: "SUPPLIER_OFFER",
      dataClassification: "DEMO_SYNTHETIC",
      effectiveAt: new Date("2025-01-15T00:00:00.000Z"),
      staleAt: new Date("2025-02-15T00:00:00.000Z"),
    },
  ]);
  const evidenceConflict = vi.fn().mockResolvedValue([]);

  return {
    database: {
      comparisonRun: { findFirst: comparisonRun },
      quoteVersion: { findMany: quoteVersion },
      forecastCostVersion: { findMany: forecastCostVersion },
      projectCostVersion: { findMany: projectCostVersion },
      supplierOffer: { findMany: supplierOffer },
      evidenceReference: { findMany: evidenceReference },
      evidenceConflict: { findMany: evidenceConflict },
    } as PrismaEconomicsObservationDatabase,
    comparisonRun,
    quoteVersion,
    forecastCostVersion,
    projectCostVersion,
    supplierOffer,
    evidenceReference,
    evidenceConflict,
  };
}

describe("PrismaEconomicsObservationRepository", () => {
  it("loads one bounded FULL_ACTUAL snapshot with authorized evidence", async () => {
    const db = database();
    const repository = new PrismaEconomicsObservationRepository(db.database);

    const batch = await repository.loadAuthorizedBatch(context(), COMPARISON_RUN_ID, stage4());

    expect(batch).not.toBeNull();
    expect(batch).toMatchObject({
      comparisonRunId: COMPARISON_RUN_ID,
      activeProjectId: ACTIVE_PROJECT_ID,
      selectedProjectKeys: ["PRJ-NEIHU-021"],
      accessScope: "FULL_ACTUAL",
      canReadEvidence: true,
      diagnostics: {
        databaseQueries: 7,
        projectRowsReturned: 2,
        financialRecordsReturned: 5,
        evidenceRowsReturned: 5,
        maximumSelectedProjects: 3,
      },
    });
    expect(batch?.records.map((record) => record.id)).toEqual([
      "fcv_xinyi_v1",
      "offer_stone_2025",
      "pcv_neihu_v1",
      "qv_neihu_v2",
      "qv_xinyi_v3",
    ]);
    expect(batch?.records.find((record) => record.id === "pcv_neihu_v1")).toMatchObject({
      observationType: "RECONCILED_ACTUAL_COST",
      evidenceReferenceIds: ["evid_actual_neihu"],
    });
    expect(db.quoteVersion).toHaveBeenCalledTimes(1);
    expect(db.forecastCostVersion).toHaveBeenCalledTimes(1);
    expect(db.projectCostVersion).toHaveBeenCalledTimes(1);
    expect(db.supplierOffer).toHaveBeenCalledTimes(1);
    expect(db.evidenceReference).toHaveBeenCalledTimes(1);
    expect(db.evidenceConflict).toHaveBeenCalledTimes(1);
  });

  it("does not query or disclose financial data for a Viewer", async () => {
    const db = database();
    const viewer = context("VIEWER", new Set(["project:read", "project:compare", "evidence:read"]));
    viewer.projectAssignments = new Map([
      [
        ACTIVE_PROJECT_ID,
        { projectId: ACTIVE_PROJECT_ID, canReadActuals: false, canCreateAction: false },
      ],
      [
        HISTORICAL_PROJECT_ID,
        { projectId: HISTORICAL_PROJECT_ID, canReadActuals: false, canCreateAction: false },
      ],
    ]);
    const repository = new PrismaEconomicsObservationRepository(db.database);

    const batch = await repository.loadAuthorizedBatch(viewer, COMPARISON_RUN_ID, stage4());

    expect(batch).toMatchObject({
      accessScope: "STRUCTURAL_ONLY",
      records: [],
      evidence: [],
      diagnostics: {
        databaseQueries: 1,
        financialRecordsReturned: 0,
        evidenceRowsReturned: 0,
      },
    });
    expect(db.quoteVersion).not.toHaveBeenCalled();
    expect(db.forecastCostVersion).not.toHaveBeenCalled();
    expect(db.projectCostVersion).not.toHaveBeenCalled();
    expect(db.supplierOffer).not.toHaveBeenCalled();
    expect(db.evidenceReference).not.toHaveBeenCalled();
    expect(db.evidenceConflict).not.toHaveBeenCalled();
  });

  it("rejects a currently inaccessible private selected project before financial reads", async () => {
    const db = database();
    db.comparisonRun.mockResolvedValueOnce({
      id: COMPARISON_RUN_ID,
      organizationId: ORGANIZATION_ID,
      activeProjectId: ACTIVE_PROJECT_ID,
      status: "COMPLETED",
      activeProject,
      candidates: [
        {
          candidateProjectId: HISTORICAL_PROJECT_ID,
          rank: 1,
          candidateProject: {
            ...historicalProject,
            dataClassification: "TENANT_PRIVATE",
          },
        },
      ],
    });
    const estimator = context(
      "PROJECT_MANAGER_ESTIMATOR",
      new Set([
        "project:read",
        "project:compare",
        "quote:read",
        "commercial:forecast-read",
        "evidence:read",
      ]),
    );
    estimator.assignedProjectIds = new Set([ACTIVE_PROJECT_ID]);
    estimator.projectAssignments = new Map([
      [
        ACTIVE_PROJECT_ID,
        { projectId: ACTIVE_PROJECT_ID, canReadActuals: false, canCreateAction: true },
      ],
    ]);
    const repository = new PrismaEconomicsObservationRepository(db.database);

    await expect(
      repository.loadAuthorizedBatch(estimator, COMPARISON_RUN_ID, stage4()),
    ).resolves.toBeNull();
    expect(db.quoteVersion).not.toHaveBeenCalled();
  });

  it("returns null identically for a cross-organization run", async () => {
    const db = database();
    db.comparisonRun.mockResolvedValueOnce({
      id: COMPARISON_RUN_ID,
      organizationId: "org_northern",
      activeProjectId: "prj_northern",
      status: "COMPLETED",
      activeProject: { ...activeProject, id: "prj_northern" },
      candidates: [],
    });
    const repository = new PrismaEconomicsObservationRepository(db.database);

    await expect(
      repository.loadAuthorizedBatch(context(), COMPARISON_RUN_ID, stage4()),
    ).resolves.toBeNull();
    expect(db.quoteVersion).not.toHaveBeenCalled();
  });
});
