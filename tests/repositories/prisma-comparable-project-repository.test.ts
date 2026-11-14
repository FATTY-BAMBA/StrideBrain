import { describe, expect, it, vi } from "vitest";

import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import {
  PrismaComparableProjectRepository,
  type PrismaComparableProjectDatabase,
} from "@/repositories/prisma/prisma-comparable-project-repository";

const ORGANIZATION_ID = "org_horizon";
const PROJECT_ID = "prj_xinyi_026";

function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: "REQ-REPO-STAGE4",
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

function projectRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "prj_neihu_021",
    organizationId: ORGANIZATION_ID,
    businessKey: "PRJ-NEIHU-021",
    nameEn: "Neihu Tech Flagship",
    nameZhTw: "內湖科技旗艦店",
    comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
    subtype: "RETAIL_FLAGSHIP",
    status: "COMPLETED",
    locationCity: "Taipei City",
    locationDistrict: "Neihu District",
    areaQuantity: { toString: () => "610.000" },
    areaUnit: "m2",
    currency: "TWD",
    completedAt: new Date("2025-06-30T00:00:00.000Z"),
    metadataAuthority: "HUMAN_REVIEWED",
    dataClassification: "DEMO_SYNTHETIC",
    updatedAt: new Date("2026-11-01T00:00:00.000Z"),
    scopes: [{ categoryId: "CUSTOM_MILLWORK" }, { categoryId: "IMPORTED_STONE" }],
    projectMaterials: [
      { material: { businessKey: "MAT-CUSTOM-MILLWORK" } },
      { material: { businessKey: "MAT-IMPORTED-STONE" } },
    ],
    projectSuppliers: [
      { supplier: { businessKey: "SUP-01" } },
      { supplier: { businessKey: "SUP-05" } },
    ],
    quotes: [
      {
        businessKey: "Q-NEIHU-021",
        versions: [
          {
            id: "qv_neihu_021_v2",
            versionNumber: 2,
            createdAt: new Date("2025-06-15T00:00:00.000Z"),
            items: [
              { id: "qi_neihu_021_v2_01", categoryId: "CUSTOM_MILLWORK" },
              { id: "qi_neihu_021_v2_02", categoryId: "IMPORTED_STONE" },
            ],
          },
        ],
      },
    ],
    documents: [{ versions: [{ id: "docv_prj_neihu_021_1" }] }],
    ...overrides,
  };
}

function database(
  overrides: Partial<PrismaComparableProjectDatabase> = {},
): PrismaComparableProjectDatabase {
  return {
    project: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    evidenceReference: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    ...overrides,
  } as PrismaComparableProjectDatabase;
}

describe("PrismaComparableProjectRepository", () => {
  it("loads an active profile with organization scope on every nested relation", async () => {
    const findFirst = vi.fn().mockResolvedValue(
      projectRow({
        id: PROJECT_ID,
        businessKey: "PRJ-XINYI-026",
        nameEn: "Xinyi Flagship Renovation",
        nameZhTw: "信義旗艦店裝修",
        status: "ACTIVE",
        completedAt: null,
        areaQuantity: { toString: () => "640.000" },
        quotes: [
          {
            businessKey: "Q-XINYI-026",
            versions: [
              {
                id: "qv_xinyi_026_v3",
                versionNumber: 3,
                createdAt: new Date("2026-11-10T00:00:00.000Z"),
                items: [{ id: "qi_xinyi_026_v3_01", categoryId: "IMPORTED_STONE" }],
              },
            ],
          },
        ],
      }),
    );
    const findEvidence = vi.fn().mockResolvedValue([
      {
        id: "EVID-XINYI-PROJECT",
        subjectType: "DOCUMENT_VERSION",
        subjectId: "docv_prj_neihu_021_1",
      },
      {
        id: "EVID-XINYI-QUOTE",
        subjectType: "QUOTE_ITEM",
        subjectId: "qi_xinyi_026_v3_01",
      },
    ]);
    const repository = new PrismaComparableProjectRepository(
      database({
        project: { findFirst, findMany: vi.fn().mockResolvedValue([]) },
        evidenceReference: { findMany: findEvidence },
      }),
    );

    const result = await repository.getActiveComparisonProfile(context(), PROJECT_ID);

    expect(result).toMatchObject({
      activeQuoteVersionId: "qv_xinyi_026_v3",
      activeQuoteVersionKey: "Q-XINYI-026-v3",
      profile: {
        businessKey: "PRJ-XINYI-026",
        areaValue: "640.000",
        commercialCategoryIds: ["IMPORTED_STONE"],
      },
    });
    const query = findFirst.mock.calls[0]?.[0];
    const serialized = JSON.stringify(query);
    expect(serialized).toContain(`"organizationId":"${ORGANIZATION_ID}"`);
    expect(serialized).toContain('"scopes":{"where":{"organizationId":"org_horizon"}');
    expect(serialized).toContain('"projectMaterials":{"where":{"organizationId":"org_horizon"');
    expect(serialized).toContain('"projectSuppliers":{"where":{"organizationId":"org_horizon"');
    expect(serialized).toContain('"quotes":{"where":{"organizationId":"org_horizon"');
    expect(serialized).toContain('"items":{"where":{"organizationId":"org_horizon"');
    expect(serialized).toContain('"documents":{"where":{"organizationId":"org_horizon"');
    expect(serialized).not.toContain("amountBeforeTax");
    expect(serialized).not.toContain("unitPrice");
    expect(serialized).not.toContain("totalDirectCost");
  });

  it("loads all historical profiles in one project query and one evidence query", async () => {
    const findMany = vi.fn().mockResolvedValue([
      projectRow(),
      projectRow({
        id: "prj_zhongshan_018",
        businessKey: "PRJ-ZHONGSHAN-018",
        nameEn: "Zhongshan Lifestyle Store",
        nameZhTw: "中山生活概念店",
      }),
    ]);
    const findEvidence = vi.fn().mockResolvedValue([
      {
        id: "EVID-NEIHU-PROJECT",
        subjectType: "DOCUMENT_VERSION",
        subjectId: "docv_prj_neihu_021_1",
      },
      {
        id: "EVID-NEIHU-QUOTE",
        subjectType: "QUOTE_ITEM",
        subjectId: "qi_neihu_021_v2_01",
      },
    ]);
    const repository = new PrismaComparableProjectRepository(
      database({
        project: { findFirst: vi.fn().mockResolvedValue(null), findMany },
        evidenceReference: { findMany: findEvidence },
      }),
    );

    const batch = await repository.listAuthorizedHistoricalProfiles(context(), PROJECT_ID);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findEvidence).toHaveBeenCalledTimes(1);
    expect(batch.diagnostics).toEqual({
      databaseQueries: 2,
      authorizedRowsReturned: 2,
      maximumRows: 100,
    });
    expect(batch.profiles.map((profile) => profile.businessKey)).toEqual([
      "PRJ-NEIHU-021",
      "PRJ-ZHONGSHAN-018",
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: ORGANIZATION_ID,
          id: { not: PROJECT_ID },
          status: { in: ["COMPLETED", "CLOSED", "ARCHIVED"] },
          deletedAt: null,
        }),
        take: 100,
      }),
    );
  });

  it("combines the approved comparison library with assignment-bound private history for Viewers", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new PrismaComparableProjectRepository(
      database({
        project: { findFirst: vi.fn().mockResolvedValue(null), findMany },
      }),
    );

    await repository.listAuthorizedHistoricalProfiles(
      context({
        role: "VIEWER",
        capabilities: new Set(["project:read", "project:compare", "evidence:read"]),
      }),
      PROJECT_ID,
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            {
              dataClassification: {
                in: ["DEMO_SYNTHETIC", "PUBLIC_REFERENCE", "TENANT_APPROVED"],
              },
            },
            {
              id: { in: [PROJECT_ID] },
              dataClassification: "TENANT_PRIVATE",
            },
          ],
        }),
      }),
    );
  });

  it("allows organization-wide tenant-private history only for Admin and Financial Reviewer", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new PrismaComparableProjectRepository(
      database({
        project: { findFirst: vi.fn().mockResolvedValue(null), findMany },
      }),
    );

    await repository.listAuthorizedHistoricalProfiles(
      context({
        role: "FINANCIAL_REVIEWER",
        assignedProjectIds: new Set(),
        projectAssignments: new Map(),
      }),
      PROJECT_ID,
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            {
              dataClassification: {
                in: ["DEMO_SYNTHETIC", "PUBLIC_REFERENCE", "TENANT_APPROVED"],
              },
            },
            { dataClassification: "TENANT_PRIVATE" },
          ],
        }),
      }),
    );
  });

  it("does not query any project or evidence data without project:compare", async () => {
    const findFirst = vi.fn();
    const findMany = vi.fn();
    const findEvidence = vi.fn();
    const repository = new PrismaComparableProjectRepository(
      database({
        project: { findFirst, findMany },
        evidenceReference: { findMany: findEvidence },
      }),
    );
    const denied = context({ capabilities: new Set(["project:read"]) });

    await expect(repository.getActiveComparisonProfile(denied, PROJECT_ID)).resolves.toBeNull();
    await expect(repository.listAuthorizedHistoricalProfiles(denied, PROJECT_ID)).resolves.toEqual({
      profiles: [],
      diagnostics: { databaseQueries: 0, authorizedRowsReturned: 0, maximumRows: 100 },
    });
    expect(findFirst).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
    expect(findEvidence).not.toHaveBeenCalled();
  });
});
