import { describe, expect, it, vi } from "vitest";

import {
  PrismaProjectWorkspaceRepository,
  type PrismaProjectWorkspaceDatabase,
} from "@/repositories/prisma/prisma-project-workspace-repository";

function database(overrides: Partial<PrismaProjectWorkspaceDatabase> = {}) {
  return {
    project: { findFirst: vi.fn().mockResolvedValue(null) },
    quoteVersion: { findFirst: vi.fn().mockResolvedValue(null) },
    forecastCostVersion: { findFirst: vi.fn().mockResolvedValue(null) },
    projectCostVersion: { findFirst: vi.fn().mockResolvedValue(null) },
    evidenceReference: { findMany: vi.fn().mockResolvedValue([]) },
    evidenceConflict: { findMany: vi.fn().mockResolvedValue([]) },
    supplierOffer: { findMany: vi.fn().mockResolvedValue([]) },
    action: { findMany: vi.fn().mockResolvedValue([]) },
    ...overrides,
  } as PrismaProjectWorkspaceDatabase;
}

describe("PrismaProjectWorkspaceRepository", () => {
  it("loads project context inside the trusted organization boundary", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "prj_xinyi_026",
      organizationId: "org_horizon",
      businessKey: "PRJ-XINYI-026",
      nameEn: "Xinyi Flagship Renovation",
      nameZhTw: "信義旗艦店裝修",
      status: "ACTIVE",
      stage: "QUOTE_REVIEW",
      comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
      subtype: "RETAIL_FLAGSHIP",
      locationCity: "Taipei City",
      locationDistrict: "Xinyi District",
      areaQuantity: { toString: () => "640.000" },
      areaUnit: "m2",
      currency: "TWD",
      programmeWeeks: { toString: () => "16.00" },
      targetCompletionAt: new Date("2027-02-20T00:00:00.000Z"),
      metadataAuthority: "HUMAN_REVIEWED",
      dataClassification: "DEMO_SYNTHETIC",
      client: {
        businessKey: "CLIENT-01",
        nameEn: "Aster Retail Taiwan",
        nameZhTw: "星序零售台灣",
      },
      assignments: [
        {
          membership: {
            person: {
              businessKey: "PERSON-MEI",
              nameEn: "Mei Lin",
              nameZhTw: "林美玲",
            },
          },
        },
      ],
      scopes: [
        {
          categoryId: "IMPORTED_STONE",
          labelEn: "Imported stone",
          labelZhTw: "進口石材",
          sourceState: "HUMAN_REVIEWED",
        },
      ],
      projectSuppliers: [],
      projectMaterials: [],
    });
    const repository = new PrismaProjectWorkspaceRepository(
      database({ project: { findFirst } }),
    );

    const result = await repository.getProjectContext("org_horizon", "prj_xinyi_026");

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "prj_xinyi_026",
          organizationId: "org_horizon",
          deletedAt: null,
        },
      }),
    );
    expect(result).toMatchObject({
      organizationId: "org_horizon",
      businessKey: "PRJ-XINYI-026",
      areaQuantity: "640.000",
      programmeWeeks: "16.00",
      manager: { businessKey: "PERSON-MEI" },
    });
  });

  it("selects only the current non-superseded quote inside the organization and project", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "quote_xinyi_v3",
      versionNumber: 3,
      status: "DRAFT_REVIEW",
      observationType: "QUOTED_PRICE",
      authorityState: "APPROVED_COMMERCIAL",
      currency: "TWD",
      amountBeforeTax: { toString: () => "16480000.00" },
      validUntil: new Date("2026-12-31T00:00:00.000Z"),
      approvedAt: new Date("2026-11-10T00:00:00.000Z"),
      quote: { businessKey: "Q-XINYI-026" },
    });
    const repository = new PrismaProjectWorkspaceRepository(
      database({ quoteVersion: { findFirst } }),
    );

    const result = await repository.getCurrentQuote("org_horizon", "prj_xinyi_026");

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org_horizon",
          quote: { organizationId: "org_horizon", projectId: "prj_xinyi_026" },
          supersededById: null,
          authorityState: { not: "SUPERSEDED" },
        },
      }),
    );
    expect(result).toMatchObject({
      quoteBusinessKey: "Q-XINYI-026",
      versionNumber: 3,
      amountBeforeTax: "16480000.00",
    });
  });

  it("limits non-sensitive evidence classifications in the database query", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new PrismaProjectWorkspaceRepository(
      database({ evidenceReference: { findMany } }),
    );

    await repository.listEvidence("org_horizon", "prj_xinyi_026", "NON_SENSITIVE");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org_horizon",
          dataClassification: {
            in: ["DEMO_SYNTHETIC", "PUBLIC_REFERENCE", "TENANT_APPROVED"],
          },
        }),
      }),
    );
  });

  it("queries conflicts only through evidence references already authorized by the caller", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new PrismaProjectWorkspaceRepository(
      database({ evidenceConflict: { findMany } }),
    );

    await repository.listOpenEvidenceConflicts("org_horizon", ["EVID-1", "EVID-2"]);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org_horizon",
          status: "OPEN",
          OR: [
            { primaryEvidenceId: { in: ["EVID-1", "EVID-2"] } },
            { conflictingEvidenceId: { in: ["EVID-1", "EVID-2"] } },
          ],
        }),
      }),
    );
  });

  it("keeps supplier-offer amounts organization and project scoped", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        businessKey: "SUP-OFFER-STONE-2025-041",
        authorityState: "APPROVED_COMMERCIAL",
        observationType: "SUPPLIER_OFFER",
        currency: "TWD",
        amountBeforeTax: { toString: () => "2100000.00" },
        offeredAt: new Date("2025-04-01T00:00:00.000Z"),
        validUntil: new Date("2025-05-01T00:00:00.000Z"),
        supplier: {
          businessKey: "SUP-01",
          nameEn: "Stonefield Surfaces",
          nameZhTw: "石境材料",
        },
      },
    ]);
    const repository = new PrismaProjectWorkspaceRepository(
      database({ supplierOffer: { findMany } }),
    );

    const result = await repository.listSupplierOffers("org_horizon", "prj_xinyi_026");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org_horizon",
          projectId: "prj_xinyi_026",
          authorityState: { not: "SUPERSEDED" },
        },
      }),
    );
    expect(result[0]?.amountBeforeTax).toBe("2100000.00");
  });
});
