import { describe, expect, it, vi } from "vitest";

import { ProjectWorkspaceQuery } from "@/modules/projects/application/project-workspace-query";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectRepositoryPort } from "@/repositories/ports/project-repository";

const context: RuntimeContext = {
  requestId: "REQ-001",
  userId: "USR-001",
  membershipId: "MEM-001",
  organizationId: "ORG-001",
  role: "PROJECT_MANAGER_ESTIMATOR",
  capabilities: new Set(["project:read"]),
  assignedProjectIds: new Set(["PROJECT-ID-001"]),
  locale: "zh-TW",
  dataMode: "DEMO_SYNTHETIC",
};

describe("ProjectWorkspaceQuery", () => {
  it("returns only the project supplied by the authorized repository port", async () => {
    const getAuthorizedByBusinessKey = vi.fn<ProjectRepositoryPort["getAuthorizedByBusinessKey"]>();
    getAuthorizedByBusinessKey.mockResolvedValue({
      id: "PROJECT-ID-001",
      businessKey: "PRJ-TEST-001",
      organizationId: "ORG-001",
      recordVersion: 1,
    });

    const query = new ProjectWorkspaceQuery({ getAuthorizedByBusinessKey });
    const outcome = await query.execute(context, "PRJ-TEST-001");

    expect(getAuthorizedByBusinessKey).toHaveBeenCalledWith(context, "PRJ-TEST-001");
    expect(outcome).toEqual({
      kind: "AVAILABLE",
      project: {
        id: "PROJECT-ID-001",
        businessKey: "PRJ-TEST-001",
        organizationId: "ORG-001",
        recordVersion: 1,
      },
    });
  });

  it("returns a non-disclosing unavailable outcome", async () => {
    const repository: ProjectRepositoryPort = {
      getAuthorizedByBusinessKey: vi.fn().mockResolvedValue(null),
    };

    const query = new ProjectWorkspaceQuery(repository);

    await expect(query.execute(context, "PRJ-HIDDEN-999")).resolves.toEqual({
      kind: "UNAVAILABLE",
    });
  });
});
