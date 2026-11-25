import { describe, expect, it, vi } from "vitest";

import type {
  PersistStage5EconomicsInput,
  Stage5EconomicsResult,
} from "@/modules/economics/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import {
  PrismaEconomicsEnrichmentRunRepository,
  type PrismaEconomicsEnrichmentDatabase,
} from "@/repositories/prisma/prisma-economics-enrichment-run-repository";

const ORGANIZATION_ID = "org_horizon";
const PROJECT_ID = "prj_xinyi_026";

function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: "REQ-ECON-READ",
    userId: "person_horizon_finance",
    membershipId: "membership_horizon_finance",
    organizationId: ORGANIZATION_ID,
    role: "FINANCIAL_REVIEWER",
    capabilities: new Set([
      "project:read",
      "project:compare",
      "quote:read",
      "commercial:forecast-read",
      "commercial:actual-read",
      "evidence:read",
    ]),
    assignedProjectIds: new Set([PROJECT_ID]),
    projectAssignments: new Map([
      [PROJECT_ID, { projectId: PROJECT_ID, canReadActuals: true, canCreateAction: true }],
    ]),
    locale: "en",
    dataMode: "DEMO_SYNTHETIC",
    ...overrides,
  };
}

const result: Stage5EconomicsResult = {
  version: "comparable-project-stage5.v1",
  run: {
    id: "econrun_stage5",
    comparisonRunId: "cmprun_stage4",
    generatedAt: "2026-11-15T01:00:00.000Z",
    snapshotDate: "2026-11-14",
    status: "COMPLETE",
    authorityPolicyVersion: "EVIDENCE-AUTHORITY-1.0",
    calculationVersion: "CPI-ECON-1.0",
    inputFingerprint: "input-fingerprint",
    sourceFingerprint: "source-fingerprint",
    permissionFingerprint: "permission-fingerprint",
  },
  accessScope: "FULL_ACTUAL",
  structuralResultFingerprint: "structural-fingerprint",
  selectedProjectKeys: ["PRJ-NEIHU-021"],
  states: ["COMPLETE"],
  summary: {
    quotedHistoryState: "SUFFICIENT",
    actualHistoryState: "SUFFICIENT",
    actualEligibleProjectCount: 3,
    staleSupplierOfferCount: 0,
    conflictCount: 0,
  },
  current: {
    quoteBeforeTax: "16480000.00",
    forecastDirectCost: "12650000.00",
    currency: "TWD",
  },
  overall: {
    quotedHistory: {
      state: "SUFFICIENT",
      observationType: "QUOTED_PRICE",
      requiredObservationCount: 3,
      eligibleObservationCount: 3,
    },
    actualHistory: {
      state: "SUFFICIENT",
      observationType: "RECONCILED_ACTUAL_COST",
      requiredObservationCount: 3,
      eligibleObservationCount: 3,
    },
    quoteVariance: {
      state: "VALUE",
      currentBasis: "QUOTE",
      historyBasis: "QUOTED_PRICE",
      variancePercent: "7.1676",
    },
    forecastVariance: {
      state: "VALUE",
      currentBasis: "FORECAST",
      historyBasis: "RECONCILED_ACTUAL_COST",
      variancePercent: "6.0451",
    },
  },
  categories: [],
  programmeDifference: {
    state: "UNAVAILABLE",
    quantifiedPremiumState: "UNQUANTIFIED",
    evidenceReferenceIds: [],
  },
  supplierOffers: [],
  claims: [
    {
      claimKey: "overall:quoted-variance",
      kind: "OVERALL_QUOTED_VARIANCE",
      titleEn: "Current quote versus quoted history",
      titleZhTw: "目前報價與歷史報價比較",
      value: { variancePercent: "7.1676" },
      observationType: "QUOTED_PRICE",
      evidenceReferenceIds: ["evid_quote_1"],
      warningCodes: [],
    },
  ],
  evidenceBundles: [
    {
      claimKey: "overall:quoted-variance",
      sources: [
        {
          referenceId: "evid_quote_1",
          subjectType: "QUOTE_ITEM",
          subjectId: "qi_quote_1",
          locator: { lineNumber: 1 },
          claimKey: "quoted-price:IMPORTED_STONE",
          authorityState: "APPROVED_COMMERCIAL",
          observationType: "QUOTED_PRICE",
          dataClassification: "DEMO_SYNTHETIC",
          conflictIds: [],
        },
      ],
      warningCodes: [],
    },
  ],
};

const input: PersistStage5EconomicsInput = {
  organizationId: ORGANIZATION_ID,
  requestId: "REQ-STAGE5-001",
  actorUserId: "person_horizon_finance",
  actorMembershipId: "membership_horizon_finance",
  enrichmentRunId: "econrun_stage5",
  comparisonRunId: "cmprun_stage4",
  activeProjectId: PROJECT_ID,
  generatedAt: "2026-11-15T01:00:00.000Z",
  inputFingerprint: "input-fingerprint",
  sourceFingerprint: "source-fingerprint",
  permissionFingerprint: "permission-fingerprint",
  accessScope: "FULL_ACTUAL",
  result,
  decisions: [
    {
      observationId: "pcv_neihu_021_v1",
      projectId: "prj_neihu_021",
      observationType: "RECONCILED_ACTUAL_COST",
      authorityState: "RECONCILED_ACTUAL",
      included: true,
      reasonCodes: [],
      normalizedAmount: "18983.606557",
      normalizedUnit: "TWD_PER_M2",
      evidenceReferenceIds: ["evid_cost_1"],
    },
  ],
  claims: result.claims,
};

function database() {
  const auditCreate = vi.fn().mockResolvedValue({});
  const enrichmentCreate = vi.fn().mockResolvedValue({ id: "econrun_stage5" });
  const claimCreateMany = vi.fn().mockResolvedValue({ count: 1 });
  const transaction = vi.fn(async (work: (tx: unknown) => Promise<unknown>) =>
    work({
      auditEvent: { create: auditCreate },
      economicsEnrichmentRun: { create: enrichmentCreate },
      comparisonClaim: { createMany: claimCreateMany },
    }),
  );
  const findFirst = vi.fn().mockResolvedValue(null);
  return {
    database: {
      $transaction: transaction,
      economicsEnrichmentRun: { findFirst },
    } as PrismaEconomicsEnrichmentDatabase,
    transaction,
    auditCreate,
    enrichmentCreate,
    claimCreateMany,
    findFirst,
  };
}

describe("PrismaEconomicsEnrichmentRunRepository", () => {
  it("persists the immutable result, decisions, and claims atomically", async () => {
    const db = database();
    const repository = new PrismaEconomicsEnrichmentRunRepository(db.database);

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
    expect(db.enrichmentCreate).toHaveBeenCalledTimes(1);
    expect(db.claimCreateMany).toHaveBeenCalledTimes(1);
    const data = db.enrichmentCreate.mock.calls[0]?.[0]?.data;
    expect(data).toMatchObject({
      id: "econrun_stage5",
      organizationId: ORGANIZATION_ID,
      comparisonRunId: "cmprun_stage4",
      activeProjectId: PROJECT_ID,
      accessScope: "FULL_ACTUAL",
      status: "COMPLETED",
      authorityPolicyVersion: "EVIDENCE-AUTHORITY-1.0",
      calculationVersion: "CPI-ECON-1.0",
    });
    expect(data.observationDecisions.create).toHaveLength(1);
    expect(data.observationDecisions.create[0]).toMatchObject({
      observationId: "pcv_neihu_021_v1",
      normalizedAmount: "18983.606557",
      included: true,
    });
  });

  it("persists six-decimal values without JavaScript Number coercion", async () => {
    const db = database();
    const repository = new PrismaEconomicsEnrichmentRunRepository(db.database);
    const exact = "12345678901234.123456";

    await repository.persistComplete({
      ...input,
      enrichmentRunId: "econrun_exact_decimal",
      decisions: [
        {
          ...input.decisions[0]!,
          normalizedAmount: exact,
        },
      ],
    });

    const data = db.enrichmentCreate.mock.calls[0]?.[0]?.data;
    expect(data.observationDecisions.create[0].normalizedAmount).toBe(exact);
  });

  it("reopens the stored result only when current scope is at least as strong", async () => {
    const db = database();
    db.findFirst.mockResolvedValue({
      id: "econrun_stage5",
      organizationId: ORGANIZATION_ID,
      activeProjectId: PROJECT_ID,
      status: "COMPLETED",
      accessScope: "FULL_ACTUAL",
      resultSnapshot: {
        schemaVersion: "economics-enrichment-snapshot.v1",
        result,
        fingerprints: {
          source: "source-fingerprint",
          permission: "permission-fingerprint",
          input: "input-fingerprint",
        },
      },
    });
    const repository = new PrismaEconomicsEnrichmentRunRepository(db.database);

    await expect(repository.getAuthorizedResult(context(), "econrun_stage5")).resolves.toEqual(
      result,
    );
  });

  it("attaches migrated category identity while preserving historical snapshot keys and evidence links", async () => {
    const db = database();
    const oldKey = "XINYI_CUSTOM_MILLWORK_QUOTED_VARIANCE";
    const legacy = {
      ...result,
      claims: [
        { ...result.claims[0]!, claimKey: oldKey, kind: "CATEGORY_QUOTED_VARIANCE" as const },
      ],
      evidenceBundles: [{ ...result.evidenceBundles[0]!, claimKey: oldKey }],
    };
    const snapshot = { schemaVersion: "economics-enrichment-snapshot.v1", result: legacy };
    const before = JSON.stringify(snapshot);
    db.findFirst.mockResolvedValue({
      id: result.run.id,
      organizationId: ORGANIZATION_ID,
      activeProjectId: PROJECT_ID,
      status: "COMPLETED",
      accessScope: "FULL_ACTUAL",
      resultSnapshot: snapshot,
      claims: [
        {
          claimKey: "CUSTOM_MILLWORK_QUOTED_VARIANCE",
          originalClaimKey: oldKey,
          categoryId: "CUSTOM_MILLWORK",
        },
      ],
    });
    const reopened = await new PrismaEconomicsEnrichmentRunRepository(
      db.database,
    ).getAuthorizedResult(context(), result.run.id);
    expect(reopened?.claims[0]).toMatchObject({ claimKey: oldKey, categoryId: "CUSTOM_MILLWORK" });
    expect(reopened?.evidenceBundles[0]?.claimKey).toBe(oldKey);
    expect(JSON.stringify(snapshot)).toBe(before);
  });
  it("does not disclose a stored FULL_ACTUAL result to a Viewer", async () => {
    const db = database();
    db.findFirst.mockResolvedValue({
      id: "econrun_stage5",
      organizationId: ORGANIZATION_ID,
      activeProjectId: PROJECT_ID,
      status: "COMPLETED",
      accessScope: "FULL_ACTUAL",
      resultSnapshot: {
        schemaVersion: "economics-enrichment-snapshot.v1",
        result,
        fingerprints: {},
      },
    });
    const viewer = context({
      role: "VIEWER",
      capabilities: new Set(["project:read", "project:compare", "evidence:read"]),
      projectAssignments: new Map([
        [PROJECT_ID, { projectId: PROJECT_ID, canReadActuals: false, canCreateAction: false }],
      ]),
    });
    const repository = new PrismaEconomicsEnrichmentRunRepository(db.database);

    await expect(repository.getAuthorizedResult(viewer, "econrun_stage5")).resolves.toBeNull();
  });

  it("does not query without project:compare", async () => {
    const db = database();
    const repository = new PrismaEconomicsEnrichmentRunRepository(db.database);

    await expect(
      repository.getAuthorizedResult(
        context({ capabilities: new Set(["project:read"]) }),
        "econrun_stage5",
      ),
    ).resolves.toBeNull();
    expect(db.findFirst).not.toHaveBeenCalled();
  });

  it("propagates transaction failure without claiming partial success", async () => {
    const db = database();
    db.claimCreateMany.mockRejectedValueOnce(new Error("claim insert failed"));
    const repository = new PrismaEconomicsEnrichmentRunRepository(db.database);

    await expect(repository.persistComplete(input)).rejects.toThrow("claim insert failed");
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });
});
