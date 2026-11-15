import { describe, expect, it, vi } from "vitest";

import { GetProjectWorkspace } from "@/modules/projects/application/get-project-workspace";
import { resolveCapabilities } from "@/modules/runtime-context/capabilities";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectWorkspaceBaseRecord } from "@/repositories/ports/project-workspace-repository";

describe("Stage 8 workspace action authorization dependency", () => {
  it.each([
    "PROJECT_MANAGER_ESTIMATOR",
    "FINANCIAL_REVIEWER",
    "ORGANIZATION_ADMIN",
    "VIEWER",
  ] as const)(
    "does not read or expose legacy action titles for %s when the authorized action port is omitted",
    async (role) => {
      const context: RuntimeContext = {
        requestId: "workspace-regression",
        organizationId: "org-one",
        userId: "person-one",
        membershipId: "member-one",
        role,
        capabilities: resolveCapabilities(role, []),
        assignedProjectIds: new Set(["project-one"]),
        projectAssignments: new Map([
          [
            "project-one",
            { projectId: "project-one", canReadActuals: true, canCreateAction: true },
          ],
        ]),
        locale: "en",
        dataMode: "DEMO_SYNTHETIC",
      };
      const base: ProjectWorkspaceBaseRecord = {
        id: "project-one",
        organizationId: "org-one",
        businessKey: "PRJ-ONE",
        nameEn: "Project",
        nameZhTw: "專案",
        status: "ACTIVE",
        stage: "QUOTE_REVIEW",
        comparisonClass: "COMMERCIAL_INTERIOR_FIT_OUT",
        subtype: "RETAIL_FLAGSHIP",
        locationCity: "Taipei City",
        locationDistrict: null,
        areaQuantity: "640.000",
        areaUnit: "m2",
        currency: "TWD",
        programmeWeeks: null,
        targetCompletionAt: null,
        metadataAuthority: "HUMAN_REVIEWED",
        dataClassification: "DEMO_SYNTHETIC",
        client: { businessKey: "CLIENT-ONE", nameEn: "Client", nameZhTw: "客戶" },
        manager: null,
        scopes: [],
        suppliers: [],
        materials: [],
      };
      const projects = {
        getAuthorizedByBusinessKey: vi.fn().mockResolvedValue({
          id: base.id,
          organizationId: base.organizationId,
          businessKey: base.businessKey,
          recordVersion: 1,
        }),
      };
      const workspace = {
        getProjectContext: vi.fn().mockResolvedValue(base),
        getCurrentQuote: vi.fn().mockResolvedValue(null),
        getCurrentForecast: vi.fn().mockResolvedValue(null),
        getCurrentActual: vi.fn().mockResolvedValue(null),
        listEvidence: vi.fn().mockResolvedValue([]),
        listOpenEvidenceConflicts: vi.fn().mockResolvedValue([]),
        listSupplierOffers: vi.fn().mockResolvedValue([]),
        listOpenActions: vi.fn().mockResolvedValue([
          {
            id: "hidden-action",
            title: "Sensitive reconciled-actual finding",
            status: "OPEN",
            dueDate: null,
          },
        ]),
      };
      const service = new GetProjectWorkspace(projects, workspace);
      const result = await service.execute(context, "PRJ-ONE");
      expect(result).toMatchObject({ kind: "AVAILABLE", workspace: { openActions: [] } });
      expect(workspace.listOpenActions).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toContain("hidden-action");
      expect(JSON.stringify(result)).not.toContain("Sensitive reconciled-actual finding");
    },
  );
});
