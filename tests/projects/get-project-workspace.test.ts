import { seededFirmLists } from "@/fixtures/firm-lists";
import { describe, expect, it, vi } from "vitest";

import { GetProjectWorkspace } from "@/modules/projects/application/get-project-workspace";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectRepositoryPort } from "@/repositories/ports/project-repository";
import type {
  ProjectWorkspaceBaseRecord,
  ProjectWorkspaceRepositoryPort,
} from "@/repositories/ports/project-workspace-repository";

const NOW = new Date("2026-11-15T00:00:00.000Z");
const PROJECT_ID = "prj_xinyi_026";
const PROJECT_KEY = "PRJ-XINYI-026";
const ORGANIZATION_ID = "org_horizon";

const baseProject: ProjectWorkspaceBaseRecord = {
  id: PROJECT_ID,
  organizationId: ORGANIZATION_ID,
  businessKey: PROJECT_KEY,
  nameEn: "Xinyi Flagship Renovation",
  nameZhTw: "信義旗艦店裝修",
  status: "ACTIVE",
  stage: "QUOTE_REVIEW",
  comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
  subtype: "RETAIL_FLAGSHIP",
  locationCity: "Taipei City",
  locationDistrict: "Xinyi District",
  areaQuantity: "640.000",
  areaUnit: "m2",
  currency: "TWD",
  programmeWeeks: "16.00",
  targetCompletionAt: new Date("2027-02-20T00:00:00.000Z"),
  metadataAuthority: "HUMAN_REVIEWED",
  dataClassification: "DEMO_SYNTHETIC",
  client: {
    businessKey: "CLIENT-01",
    nameEn: "Aster Retail Taiwan",
    nameZhTw: "星序零售台灣",
  },
  manager: {
    businessKey: "PERSON-MEI",
    nameEn: "Mei Lin",
    nameZhTw: "林美玲",
  },
  scopes: [
    {
      categoryId: "IMPORTED_STONE",
      labelEn: "Imported stone and hard finishes",
      labelZhTw: "進口石材與硬質飾面",
      authorityState: "HUMAN_REVIEWED",
    },
  ],
  suppliers: [
    {
      businessKey: "SUP-01",
      nameEn: "Stonefield Surfaces",
      nameZhTw: "石境材料",
      categoryId: "STONE",
      relationship: "PROPOSED",
    },
  ],
  materials: [
    {
      businessKey: "MAT-STONE-01",
      nameEn: "Imported stone",
      nameZhTw: "進口石材",
      categoryId: "IMPORTED_STONE",
      relationship: "SPECIFIED",
    },
  ],
};

function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: "REQ-STAGE3-001",
    userId: "person_horizon_mei",
    membershipId: "membership_horizon_mei",
    organizationId: ORGANIZATION_ID,
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: new Set([
      "project:read",
      "project:compare",
      "quote:read",
      "commercial:forecast-read",
      "commercial:actual-read",
      "evidence:read",
      "action:internal-review:propose",
      "action:internal-review:create",
      "action:assign",
    ]),
    assignedProjectIds: new Set([PROJECT_ID]),
    projectAssignments: new Map([
      [PROJECT_ID, { projectId: PROJECT_ID, canReadActuals: true, canCreateAction: true }],
    ]),
    locale: "zh-TW",
    dataMode: "DEMO_SYNTHETIC",
    firmLists: seededFirmLists,
    ...overrides,
  };
}

function projectPort(
  record: Awaited<ReturnType<ProjectRepositoryPort["getAuthorizedByBusinessKey"]>> = {
    id: PROJECT_ID,
    businessKey: PROJECT_KEY,
    organizationId: ORGANIZATION_ID,
    recordVersion: 1,
  },
): ProjectRepositoryPort {
  return {
    getAuthorizedByBusinessKey: vi.fn().mockResolvedValue(record),
  };
}

function workspacePort(
  overrides: Partial<ProjectWorkspaceRepositoryPort> = {},
): ProjectWorkspaceRepositoryPort {
  return {
    getProjectContext: vi.fn().mockResolvedValue(baseProject),
    getCurrentQuote: vi.fn().mockResolvedValue({
      quoteBusinessKey: "Q-XINYI-026",
      versionId: "quote_xinyi_v3",
      versionNumber: 3,
      status: "DRAFT_REVIEW",
      observationType: "QUOTED_PRICE",
      authorityState: "APPROVED_COMMERCIAL",
      currency: "TWD",
      amountBeforeTax: "16480000.00",
      validUntil: new Date("2026-12-31T00:00:00.000Z"),
      approvedAt: new Date("2026-11-10T00:00:00.000Z"),
    }),
    getCurrentForecast: vi.fn().mockResolvedValue({
      versionId: "forecast_xinyi_v3",
      versionNumber: 3,
      observationType: "FORECAST_DIRECT_COST",
      authorityState: "HUMAN_REVIEWED",
      currency: "TWD",
      totalDirectCost: "12650000.00",
      effectiveAt: new Date("2026-11-10T00:00:00.000Z"),
    }),
    getCurrentActual: vi.fn().mockResolvedValue(null),
    listEvidence: vi.fn().mockResolvedValue([
      {
        evidenceReferenceId: "EVID-XINYI-QUOTE-V3",
        subjectType: "QUOTE_VERSION",
        subjectId: "quote_xinyi_v3",
        claimKey: "quote.amount-before-tax",
        authorityState: "APPROVED_COMMERCIAL",
        observationType: "QUOTED_PRICE",
        dataClassification: "DEMO_SYNTHETIC",
        effectiveAt: new Date("2026-11-10T00:00:00.000Z"),
        staleAt: null,
        document: {
          businessKey: "DOC-XINYI-QUOTE-03",
          titleEn: "Xinyi quotation version 3",
          titleZhTw: "信義報價第 3 版",
          documentType: "QUOTATION",
          versionLabel: "v3",
          versionAuthorityState: "APPROVED_COMMERCIAL",
        },
      },
    ]),
    listOpenEvidenceConflicts: vi.fn().mockResolvedValue([]),
    listSupplierOffers: vi.fn().mockResolvedValue([]),
    listOpenActions: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function availableWorkspace(outcome: Awaited<ReturnType<GetProjectWorkspace["execute"]>>) {
  if (outcome.kind !== "AVAILABLE") throw new Error("Expected an available workspace");
  return outcome.workspace;
}

describe("GetProjectWorkspace", () => {
  it("returns Mei's complete authorized Xinyi context with exact decimal strings", async () => {
    const useCase = new GetProjectWorkspace(projectPort(), workspacePort(), undefined, () => NOW);

    const workspace = availableWorkspace(await useCase.execute(context(), PROJECT_KEY));

    expect(workspace.state).toBe("READY");
    expect(workspace.project.id).toBe(PROJECT_KEY);
    expect(workspace.project.name.display).toBe("信義旗艦店裝修");
    expect(workspace.project.area).toEqual({
      value: "640.000",
      unit: "m2",
      displayValue: "640",
      displayUnit: "m²",
    });
    expect(workspace.commercial.activeQuote).toMatchObject({
      state: "VALUE",
      recordKey: "Q-XINYI-026-v3",
      money: { amount: "16480000.00", currency: "TWD" },
    });
    expect(workspace.commercial.activeForecast).toMatchObject({
      state: "VALUE",
      money: { amount: "12650000.00", currency: "TWD" },
    });
    expect(workspace.commercial.reconciledActual).toEqual({
      state: "UNAVAILABLE",
      observationType: "RECONCILED_ACTUAL_COST",
      warningCodes: ["ACTUAL_UNAVAILABLE"],
    });
    expect(workspace.permissions).toMatchObject({
      canRunComparison: true,
      canReadActual: true,
      canCreateInternalReview: true,
    });
  });

  it("does not query or disclose commercial values for a Viewer", async () => {
    const repositories = workspacePort();
    const viewer = context({
      userId: "person_horizon_viewer",
      membershipId: "membership_horizon_viewer",
      role: "VIEWER",
      capabilities: new Set(["project:read", "project:compare", "evidence:read"]),
      projectAssignments: new Map([
        [PROJECT_ID, { projectId: PROJECT_ID, canReadActuals: false, canCreateAction: false }],
      ]),
    });
    const useCase = new GetProjectWorkspace(projectPort(), repositories, undefined, () => NOW);

    const workspace = availableWorkspace(await useCase.execute(viewer, PROJECT_KEY));

    expect(repositories.getCurrentQuote).not.toHaveBeenCalled();
    expect(repositories.getCurrentForecast).not.toHaveBeenCalled();
    expect(repositories.getCurrentActual).not.toHaveBeenCalled();
    expect(repositories.listSupplierOffers).not.toHaveBeenCalled();
    expect(repositories.listOpenActions).not.toHaveBeenCalled();
    expect(repositories.listEvidence).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      PROJECT_ID,
      "NON_SENSITIVE",
    );
    expect(workspace.state).toBe("PERMISSION_RESTRICTED");
    expect(workspace.commercial.activeQuote).toEqual({
      state: "RESTRICTED",
      observationType: "QUOTED_PRICE",
      warningCodes: ["QUOTE_RESTRICTED"],
    });
    expect(workspace.commercial.activeForecast).toEqual({
      state: "RESTRICTED",
      observationType: "FORECAST_DIRECT_COST",
      warningCodes: ["FORECAST_RESTRICTED"],
    });
    expect(workspace.commercial.reconciledActual).toEqual({
      state: "RESTRICTED",
      observationType: "RECONCILED_ACTUAL_COST",
      warningCodes: ["ACTUAL_RESTRICTED"],
    });
    expect(workspace.commercial.supplierOffers).toEqual([]);
    expect(workspace.permissions.canCreateInternalReview).toBe(false);
    expect(JSON.stringify(workspace)).not.toContain("16480000");
    expect(JSON.stringify(workspace)).not.toContain("12650000");
  });

  it("returns the same non-disclosing unavailable result before workspace reads", async () => {
    const repositories = workspacePort();
    const useCase = new GetProjectWorkspace(projectPort(null), repositories);

    await expect(useCase.execute(context(), "PRJ-NORTH-001")).resolves.toEqual({
      kind: "UNAVAILABLE",
      errorCode: "PROJECT_UNAVAILABLE",
      requestId: "REQ-STAGE3-001",
    });
    expect(repositories.getProjectContext).not.toHaveBeenCalled();
    expect(repositories.getCurrentQuote).not.toHaveBeenCalled();
  });

  it("never exposes a conflicted actual amount and promotes the workspace state", async () => {
    const repositories = workspacePort({
      getCurrentActual: vi.fn().mockResolvedValue({
        versionId: "actual_conflicted",
        versionNumber: 2,
        observationType: "RECONCILED_ACTUAL_COST",
        authorityState: "CONFLICTED",
        currency: "TWD",
        totalDirectCost: "99999999.99",
        reconciledAt: new Date("2026-11-01T00:00:00.000Z"),
      }),
      listOpenEvidenceConflicts: vi.fn().mockResolvedValue([
        {
          conflictKey: "final-cost:PRJ-XINYI-026:IMPORTED_STONE",
          primaryEvidenceId: "EVID-XINYI-QUOTE-V3",
          conflictingEvidenceId: "EVID-XINYI-CONFLICT",
        },
      ]),
    });
    const useCase = new GetProjectWorkspace(projectPort(), repositories, undefined, () => NOW);

    const workspace = availableWorkspace(await useCase.execute(context(), PROJECT_KEY));

    expect(workspace.state).toBe("CONFLICTED");
    expect(workspace.commercial.reconciledActual).toEqual({
      state: "CONFLICTED",
      recordKey: "ACTUAL-v2",
      versionNumber: 2,
      observationType: "RECONCILED_ACTUAL_COST",
      authorityState: "CONFLICTED",
      warningCodes: ["EVIDENCE_CONFLICT"],
    });
    expect(JSON.stringify(workspace.commercial.reconciledActual)).not.toContain("99999999");
  });

  it("surfaces stale authorized supplier evidence without presenting it as current", async () => {
    const repositories = workspacePort({
      listSupplierOffers: vi.fn().mockResolvedValue([
        {
          businessKey: "SUP-OFFER-STONE-2025-041",
          authorityState: "APPROVED_COMMERCIAL",
          observationType: "SUPPLIER_OFFER",
          currency: "TWD",
          amountBeforeTax: "2100000.00",
          offeredAt: new Date("2025-04-01T00:00:00.000Z"),
          validUntil: new Date("2025-05-01T00:00:00.000Z"),
          supplier: {
            businessKey: "SUP-01",
            nameEn: "Stonefield Surfaces",
            nameZhTw: "石境材料",
          },
        },
      ]),
    });
    const useCase = new GetProjectWorkspace(projectPort(), repositories, undefined, () => NOW);

    const workspace = availableWorkspace(await useCase.execute(context(), PROJECT_KEY));

    expect(workspace.state).toBe("STALE");
    expect(workspace.commercial.supplierOffers[0]).toMatchObject({
      recordKey: "SUP-OFFER-STONE-2025-041",
      freshness: "STALE",
    });
    expect(workspace.warnings).toContain("SUPPLIER_OFFER_STALE");
  });

  it("uses a deterministic partial state for missing authorized project context", async () => {
    const repositories = workspacePort({
      getProjectContext: vi.fn().mockResolvedValue({
        ...baseProject,
        manager: null,
        scopes: [],
      }),
      listEvidence: vi.fn().mockResolvedValue([]),
    });
    const useCase = new GetProjectWorkspace(projectPort(), repositories, undefined, () => NOW);

    const workspace = availableWorkspace(await useCase.execute(context(), PROJECT_KEY));

    expect(workspace.state).toBe("PARTIAL");
    expect(workspace.warnings).toEqual(
      expect.arrayContaining([
        "PROJECT_MANAGER_UNRECORDED",
        "PROJECT_CONTEXT_PARTIAL",
        "EVIDENCE_PARTIAL",
      ]),
    );
  });

  it("allows an Organization Admin to read an organization project without an explicit assignment", async () => {
    const admin = context({
      userId: "person_horizon_admin",
      membershipId: "membership_horizon_admin",
      role: "ORGANIZATION_ADMIN",
      assignedProjectIds: new Set(),
      projectAssignments: new Map(),
      locale: "en",
    });
    const useCase = new GetProjectWorkspace(projectPort(), workspacePort(), undefined, () => NOW);

    const workspace = availableWorkspace(await useCase.execute(admin, PROJECT_KEY));

    expect(workspace.state).toBe("READY");
    expect(workspace.project.name.display).toBe("Xinyi Flagship Renovation");
    expect(workspace.project.clientName.display).toBe("Aster Retail Taiwan");
    expect(workspace.permissions).toMatchObject({
      role: "ORGANIZATION_ADMIN",
      canReadQuote: true,
      canReadForecast: true,
      canReadActual: true,
      canCreateInternalReview: true,
      canAssignInternalReview: true,
    });
  });

  it("allows an explicitly assigned Financial Reviewer to receive authorized commercial context", async () => {
    const reviewer = context({
      userId: "person_horizon_finance",
      membershipId: "membership_horizon_finance",
      role: "FINANCIAL_REVIEWER",
      assignedProjectIds: new Set([PROJECT_ID]),
      projectAssignments: new Map([
        [
          PROJECT_ID,
          {
            projectId: PROJECT_ID,
            canReadActuals: true,
            canCreateAction: true,
          },
        ],
      ]),
      locale: "en",
    });
    const useCase = new GetProjectWorkspace(projectPort(), workspacePort(), undefined, () => NOW);

    const workspace = availableWorkspace(await useCase.execute(reviewer, PROJECT_KEY));

    expect(workspace.project.name.display).toBe("Xinyi Flagship Renovation");
    expect(workspace.permissions).toMatchObject({
      role: "FINANCIAL_REVIEWER",
      canRunComparison: true,
      canReadActual: true,
      canCreateInternalReview: true,
    });
  });

  it("returns the non-disclosing unavailable outcome for an unassigned Financial Reviewer", async () => {
    const repositories = workspacePort();
    const reviewer = context({
      userId: "person_horizon_finance",
      membershipId: "membership_horizon_finance",
      role: "FINANCIAL_REVIEWER",
      assignedProjectIds: new Set(),
      projectAssignments: new Map(),
      locale: "en",
    });
    const useCase = new GetProjectWorkspace(projectPort(), repositories);

    await expect(useCase.execute(reviewer, PROJECT_KEY)).resolves.toEqual({
      kind: "UNAVAILABLE",
      errorCode: "PROJECT_UNAVAILABLE",
      requestId: "REQ-STAGE3-001",
    });
    expect(repositories.getProjectContext).not.toHaveBeenCalled();
    expect(repositories.getCurrentQuote).not.toHaveBeenCalled();
  });
});
