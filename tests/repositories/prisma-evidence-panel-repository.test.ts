import { describe, expect, it, vi } from "vitest";

import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import {
  PrismaEvidencePanelRepository,
  type PrismaEvidencePanelDatabase,
} from "@/repositories/prisma/prisma-evidence-panel-repository";

const FULL_CONTEXT: RuntimeContext = {
  requestId: "REQ-EVIDENCE-REPO",
  userId: "person-mei",
  membershipId: "membership-mei",
  organizationId: "org-horizon",
  role: "PROJECT_MANAGER_ESTIMATOR",
  capabilities: new Set([
    "project:read",
    "project:compare",
    "quote:read",
    "commercial:forecast-read",
    "commercial:actual-read",
    "evidence:read",
  ]),
  assignedProjectIds: new Set(["prj-xinyi", "prj-neihu"]),
  projectAssignments: new Map([
    ["prj-xinyi", { projectId: "prj-xinyi", canReadActuals: true, canCreateAction: false }],
    ["prj-neihu", { projectId: "prj-neihu", canReadActuals: true, canCreateAction: false }],
  ]),
  locale: "en",
  dataMode: "DEMO_SYNTHETIC",
};

function viewerContext(): RuntimeContext {
  return {
    ...FULL_CONTEXT,
    role: "VIEWER",
    capabilities: new Set(["project:read", "project:compare", "evidence:read"]),
    projectAssignments: new Map([
      ["prj-xinyi", { projectId: "prj-xinyi", canReadActuals: false, canCreateAction: false }],
      ["prj-neihu", { projectId: "prj-neihu", canReadActuals: false, canCreateAction: false }],
    ]),
  };
}

function emptyModel() {
  return { findMany: vi.fn().mockResolvedValue([]) };
}

function database() {
  const evidenceReference = vi.fn().mockResolvedValue([
    {
      id: "evid-cost-stone",
      organizationId: "org-horizon",
      subjectType: "COST_LINE",
      subjectId: "cost-line-stone",
      documentVersionId: null,
      locator: { lineNumber: 1, categoryId: "IMPORTED_STONE" },
      claimKey: "actual-cost:IMPORTED_STONE",
      supportedValue: { amount: "1900000.00" },
      authorityState: "RECONCILED_ACTUAL",
      observationType: "RECONCILED_ACTUAL_COST",
      dataClassification: "DEMO_SYNTHETIC",
      effectiveAt: new Date("2025-07-01T00:00:00.000Z"),
      staleAt: null,
    },
  ]);
  const costLine = vi.fn().mockImplementation(async (args: unknown) => {
    const select = (args as { select?: Record<string, unknown> }).select ?? {};
    const version = select.projectCostVersion as { select?: Record<string, unknown> } | undefined;
    const versionSelect = version?.select ?? {};
    const ownershipOnly =
      !Object.hasOwn(select, "amount") && !Object.hasOwn(versionSelect, "currency");
    if (ownershipOnly) {
      return [
        {
          id: "cost-line-stone",
          projectCostVersion: {
            project: {
              id: "prj-neihu",
              businessKey: "PRJ-NEIHU-021",
              nameEn: "Neihu Tech Flagship",
              nameZhTw: "內湖科技旗艦店",
            },
          },
        },
      ];
    }
    return [
      {
        id: "cost-line-stone",
        lineNumber: 1,
        categoryId: "IMPORTED_STONE",
        descriptionEn: "Imported stone final cost",
        descriptionZhTw: "進口石材最終成本",
        quantity: "610.000",
        unit: "m2",
        unitCost: "3114.754098",
        amount: "1900000.00",
        projectCostVersion: {
          versionNumber: 1,
          currency: "TWD",
          reconciledAt: new Date("2025-07-01T00:00:00.000Z"),
          project: {
            id: "prj-neihu",
            businessKey: "PRJ-NEIHU-021",
            nameEn: "Neihu Tech Flagship",
            nameZhTw: "內湖科技旗艦店",
          },
        },
      },
    ];
  });
  const factorFindFirst = vi.fn().mockResolvedValue({
    factorKey: "AREA_SIMILARITY",
    state: "KNOWN",
    weight: "20.0000",
    normalizedValue: "0.9314",
    contribution: "18.6280",
    explanation: { activeArea: "640", candidateArea: "610" },
    evidenceReferenceIds: ["evid-cost-stone"],
    comparisonCandidate: {
      score: "88.0000",
      evidenceCoverage: "100.0000",
      candidateProject: {
        id: "prj-neihu",
        businessKey: "PRJ-NEIHU-021",
        nameEn: "Neihu Tech Flagship",
        nameZhTw: "內湖科技旗艦店",
      },
      comparisonRun: { id: "cmprun-1", activeProjectId: "prj-xinyi" },
    },
  });
  const db = {
    evidenceReference: { findMany: evidenceReference },
    evidenceConflict: { findMany: vi.fn().mockResolvedValue([]) },
    comparisonFactor: { findFirst: factorFindFirst },
    comparisonRun: {
      findFirst: vi.fn().mockResolvedValue({ id: "cmprun-1", activeProjectId: "prj-xinyi" }),
    },
    project: emptyModel(),
    projectScope: emptyModel(),
    documentVersion: emptyModel(),
    quoteVersion: emptyModel(),
    quoteItem: emptyModel(),
    forecastCostVersion: emptyModel(),
    forecastCostLine: emptyModel(),
    projectCostVersion: emptyModel(),
    costLine: { findMany: costLine },
    supplierOffer: emptyModel(),
    supplierOfferItem: emptyModel(),
  } as unknown as PrismaEvidencePanelDatabase;
  return { db, evidenceReference, costLine, factorFindFirst };
}

describe("PrismaEvidencePanelRepository", () => {
  it("authorizes ownership before loading sensitive cost details", async () => {
    const setup = database();
    const repository = new PrismaEvidencePanelRepository(setup.db);

    const result = await repository.getAuthorizedSources(FULL_CONTEXT, "cmprun-1", [
      "evid-cost-stone",
    ]);

    expect(result.kind).toBe("COMPLETE");
    if (result.kind !== "COMPLETE") throw new Error("COMPLETE_REQUIRED");
    expect(result.sources[0]).toMatchObject({
      referenceId: "evid-cost-stone",
      projectKey: "PRJ-NEIHU-021",
      observationType: "RECONCILED_ACTUAL_COST",
      titleEn: "Imported stone final cost",
    });
    expect(setup.costLine).toHaveBeenCalledTimes(2);
    expect(setup.evidenceReference.mock.calls[0]?.[0]).toMatchObject({
      where: { organizationId: "org-horizon" },
    });
  });

  it("does not load actual-cost values when the current role lacks actual access", async () => {
    const setup = database();
    const repository = new PrismaEvidencePanelRepository(setup.db);

    const result = await repository.getAuthorizedSources(viewerContext(), "cmprun-1", [
      "evid-cost-stone",
    ]);

    expect(result).toEqual({ kind: "ACCESS_CHANGED" });
    expect(setup.costLine).toHaveBeenCalledTimes(1);
    const ownershipSelect = setup.costLine.mock.calls[0]?.[0]?.select;
    expect(ownershipSelect).not.toHaveProperty("amount");
  });

  it("returns neutral access-changed when a requested reference disappears", async () => {
    const setup = database();
    setup.evidenceReference.mockResolvedValue([]);
    const repository = new PrismaEvidencePanelRepository(setup.db);

    await expect(
      repository.getAuthorizedSources(FULL_CONTEXT, "cmprun-1", ["missing-evidence"]),
    ).resolves.toEqual({ kind: "ACCESS_CHANGED" });
    expect(setup.costLine).not.toHaveBeenCalled();
  });

  it("returns the stored deterministic factor and never recalculates it", async () => {
    const setup = database();
    const repository = new PrismaEvidencePanelRepository(setup.db);

    const factor = await repository.getAuthorizedFactor(
      FULL_CONTEXT,
      "cmprun-1",
      "PRJ-NEIHU-021",
      "AREA_SIMILARITY",
    );

    expect(factor).toMatchObject({
      factorKey: "AREA_SIMILARITY",
      weight: "20.0000",
      contribution: "18.6280",
      totalScore: "88.0000",
      evidenceCoverage: "100.0000",
    });
    expect(setup.factorFindFirst).toHaveBeenCalledTimes(1);
  });
});
