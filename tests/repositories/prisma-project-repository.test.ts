import { describe, expect, it, vi } from "vitest";

import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import {
  PrismaProjectRepository,
  type PrismaProjectReader,
} from "@/repositories/prisma/prisma-project-repository";

function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: "request-1",
    userId: "user-1",
    membershipId: "membership-1",
    organizationId: "org_horizon",
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: new Set(["project:read"]),
    assignedProjectIds: new Set(["prj_xinyi_026"]),
    locale: "zh-TW",
    dataMode: "DEMO_SYNTHETIC",
    ...overrides,
  };
}

function readerFor(project: { id: string; businessKey: string; organizationId?: string }): {
  reader: PrismaProjectReader;
  findFirst: ReturnType<typeof vi.fn>;
} {
  const findFirst = vi.fn().mockResolvedValue({
    ...project,
    organizationId: project.organizationId ?? "org_horizon",
    updatedAt: new Date("2026-11-14T00:00:00Z"),
  });
  return {
    reader: { project: { findFirst } } as PrismaProjectReader,
    findFirst,
  };
}

describe("PrismaProjectRepository", () => {
  it("places the trusted organization boundary in the database query", async () => {
    const { reader, findFirst } = readerFor({
      id: "prj_xinyi_026",
      businessKey: "PRJ-XINYI-026",
    });
    const repository = new PrismaProjectRepository(reader);

    const result = await repository.getAuthorizedByBusinessKey(context(), "PRJ-XINYI-026");

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org_horizon",
        businessKey: "PRJ-XINYI-026",
        deletedAt: null,
      },
      select: {
        id: true,
        businessKey: true,
        organizationId: true,
        updatedAt: true,
      },
    });
    expect(result).toMatchObject({
      id: "prj_xinyi_026",
      organizationId: "org_horizon",
    });
  });

  it("does not query when project-read capability is absent", async () => {
    const findFirst = vi.fn();
    const repository = new PrismaProjectRepository({
      project: { findFirst },
    } as unknown as PrismaProjectReader);

    const result = await repository.getAuthorizedByBusinessKey(
      context({ capabilities: new Set() }),
      "PRJ-XINYI-026",
    );

    expect(result).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("denies an unassigned project without leaking a different response shape", async () => {
    const { reader } = readerFor({
      id: "prj_neihu_021",
      businessKey: "PRJ-NEIHU-021",
    });
    const repository = new PrismaProjectRepository(reader);

    const result = await repository.getAuthorizedByBusinessKey(context(), "PRJ-NEIHU-021");

    expect(result).toBeNull();
  });

  it("fails closed when a non-admin context has no assignment set", async () => {
    const { reader } = readerFor({
      id: "prj_xinyi_026",
      businessKey: "PRJ-XINYI-026",
    });
    const repository = new PrismaProjectRepository(reader);
    const missingAssignmentContext = context();
    delete missingAssignmentContext.assignedProjectIds;

    const result = await repository.getAuthorizedByBusinessKey(
      missingAssignmentContext,
      "PRJ-XINYI-026",
    );

    expect(result).toBeNull();
  });

  it("requires an explicit assignment for a financial reviewer", async () => {
    const { reader } = readerFor({
      id: "prj_neihu_021",
      businessKey: "PRJ-NEIHU-021",
    });
    const repository = new PrismaProjectRepository(reader);

    const result = await repository.getAuthorizedByBusinessKey(
      context({
        role: "FINANCIAL_REVIEWER",
        assignedProjectIds: new Set(["prj_xinyi_026"]),
      }),
      "PRJ-NEIHU-021",
    );

    expect(result).toBeNull();
  });

  it("allows organization administrators to read authorized organization projects", async () => {
    const { reader } = readerFor({
      id: "prj_neihu_021",
      businessKey: "PRJ-NEIHU-021",
    });
    const repository = new PrismaProjectRepository(reader);

    const result = await repository.getAuthorizedByBusinessKey(
      context({ role: "ORGANIZATION_ADMIN", assignedProjectIds: new Set() }),
      "PRJ-NEIHU-021",
    );

    expect(result?.businessKey).toBe("PRJ-NEIHU-021");
  });
});
