import { describe, expect, it, vi } from "vitest";

import { ListAuthorizedProjects } from "@/modules/projects/application/list-authorized-projects";
import type { Role, RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectListRecord } from "@/repositories/ports/project-list-repository";
import { PrismaProjectListRepository } from "@/repositories/prisma/prisma-project-list-repository";

const xinyi: ProjectListRecord = {
  id: "prj_xinyi_026",
  organizationId: "org_horizon",
  businessKey: "PRJ-XINYI-026",
  nameEn: "Xinyi Flagship Renovation",
  nameZhTw: "信義旗艦店裝修",
  status: "ACTIVE",
  stage: "QUOTE_REVIEW",
};
function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    requestId: "test",
    userId: "mei",
    membershipId: "membership-mei",
    organizationId: "org_horizon",
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: new Set(["project:read"]),
    assignedProjectIds: new Set([xinyi.id]),
    locale: "en",
    dataMode: "DEMO_SYNTHETIC",
    ...overrides,
  };
}
function service(rows: readonly ProjectListRecord[] = [xinyi]) {
  const listReadableProjects = vi.fn().mockResolvedValue(rows);
  return { useCase: new ListAuthorizedProjects({ listReadableProjects }), listReadableProjects };
}

describe("ListAuthorizedProjects authorization before presentation", () => {
  it.each(["en", "zh-TW"] as const)(
    "returns minimal localized navigation data in %s",
    async (locale) => {
      const { useCase } = service();
      expect(await useCase.execute(context({ locale }))).toEqual({
        kind: "AVAILABLE",
        projects: [
          {
            businessKey: xinyi.businessKey,
            nameEn: xinyi.nameEn,
            nameZhTw: xinyi.nameZhTw,
            name: locale === "en" ? xinyi.nameEn : xinyi.nameZhTw,
            active: true,
            stage: "QUOTE_REVIEW" as const,
          },
        ],
      });
    },
  );
  it.each([
    "PROJECT_MANAGER_ESTIMATOR",
    "FINANCIAL_REVIEWER",
    "VIEWER",
    "ORGANIZATION_ADMIN",
  ] as Role[])("preserves assigned %s project-read policy", async (role) => {
    expect((await service().useCase.execute(context({ role }))).kind).toBe("AVAILABLE");
    expect(await service().useCase.execute(context({ role }))).toHaveProperty(
      "projects.0.businessKey",
      xinyi.businessKey,
    );
  });
  it.each(["PROJECT_MANAGER_ESTIMATOR", "FINANCIAL_REVIEWER", "VIEWER"] as Role[])(
    "excludes an unassigned record for %s",
    async (role) => {
      expect(
        await service().useCase.execute(context({ role, assignedProjectIds: new Set() })),
      ).toEqual({ kind: "AVAILABLE", projects: [] });
    },
  );
  it("allows an administrator's same-organization entries without assignments", async () => {
    expect(
      await service().useCase.execute(
        context({ role: "ORGANIZATION_ADMIN", assignedProjectIds: new Set() }),
      ),
    ).toHaveProperty("projects.0.businessKey", xinyi.businessKey);
  });
  it("rejects missing/explicitly denied read capability before querying", async () => {
    const s = service();
    expect(
      await s.useCase.execute(context({ role: "ORGANIZATION_ADMIN", capabilities: new Set() })),
    ).toEqual({ kind: "UNAVAILABLE" });
    expect(s.listReadableProjects).not.toHaveBeenCalled();
  });
  it.each(["VIEWER", "ORGANIZATION_ADMIN"] as Role[])(
    "never maps Horizon records for a Northern %s",
    async (role) => {
      expect(
        await service().useCase.execute(context({ role, organizationId: "org_northern" })),
      ).toEqual({ kind: "AVAILABLE", projects: [] });
    },
  );
  it("does not read a denied record's name/key while producing display data", async () => {
    const hidden = { ...xinyi, id: "unassigned" };
    for (const key of ["businessKey", "nameEn", "nameZhTw", "status"])
      Object.defineProperty(hidden, key, {
        get() {
          throw new Error("DENIED_FIELD_ACCESSED");
        },
      });
    expect(await service([hidden, xinyi]).useCase.execute(context())).toEqual({
      kind: "AVAILABLE",
      projects: [
        {
          businessKey: xinyi.businessKey,
          nameEn: xinyi.nameEn,
          nameZhTw: xinyi.nameZhTw,
          name: xinyi.nameEn,
          active: true,
          stage: "QUOTE_REVIEW" as const,
        },
      ],
    });
  });
  it("never forwards financial/evidence data, internal IDs, or hidden counts", async () => {
    const row = {
      ...xinyi,
      quoteAmount: "restricted",
      evidence: ["restricted"],
      organizationId: "org_horizon",
      hiddenCount: 99,
    };
    const result = await service([row]).useCase.execute(context());
    expect(result).toEqual({
      kind: "AVAILABLE",
      projects: [
        {
          businessKey: xinyi.businessKey,
          nameEn: xinyi.nameEn,
          nameZhTw: xinyi.nameZhTw,
          name: xinyi.nameEn,
          active: true,
          stage: "QUOTE_REVIEW" as const,
        },
      ],
    });
  });
  it("returns a safe empty outcome without inventing fixture entries", async () => {
    expect(await service([]).useCase.execute(context())).toEqual({
      kind: "AVAILABLE",
      projects: [],
    });
  });
  it("contains storage failure without returning private diagnostics or partial entries", async () => {
    const listReadableProjects = vi
      .fn()
      .mockRejectedValue(new Error("private database diagnostics"));
    expect(await new ListAuthorizedProjects({ listReadableProjects }).execute(context())).toEqual({
      kind: "UNAVAILABLE",
    });
  });
});

describe("Prisma project navigation query", () => {
  it("applies trusted organization, assignment and deletion filters before reading names", async () => {
    const findMany = vi.fn().mockResolvedValue([xinyi]);
    await new PrismaProjectListRepository({ project: { findMany } }).listReadableProjects(
      context(),
    );
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: { organizationId: "org_horizon", deletedAt: null, id: { in: [xinyi.id] } },
      orderBy: [{ status: "asc" }, { businessKey: "asc" }],
      select: {
        id: true,
        organizationId: true,
        businessKey: true,
        nameEn: true,
        nameZhTw: true,
        status: true,
        stage: true,
      },
    });
  });
  it("keeps the organization boundary for administrators", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await new PrismaProjectListRepository({ project: { findMany } }).listReadableProjects(
      context({ role: "ORGANIZATION_ADMIN", organizationId: "org_northern" }),
    );
    expect(findMany.mock.calls[0]![0].where).toEqual({
      organizationId: "org_northern",
      deletedAt: null,
    });
  });
  it.each(["missing capability", "missing assignments", "empty assignments"])(
    "does not enumerate for absent read capability or assignment",
    async (reason) => {
      const findMany = vi.fn();
      const actor = context();
      if (reason === "missing capability") actor.capabilities = new Set();
      if (reason === "missing assignments") delete actor.assignedProjectIds;
      if (reason === "empty assignments") actor.assignedProjectIds = new Set();
      await new PrismaProjectListRepository({ project: { findMany } }).listReadableProjects(actor);
      expect(findMany).not.toHaveBeenCalled();
    },
  );
  it("uses one query and no per-project authorization reads as cardinality increases", async () => {
    const rows = Array.from({ length: 300 }, (_, i) => ({
      ...xinyi,
      id: `p-${i}`,
      businessKey: `PRJ-${i}`,
    }));
    const findMany = vi.fn().mockResolvedValue(rows);
    const result = await new ListAuthorizedProjects(
      new PrismaProjectListRepository({ project: { findMany } }),
    ).execute(context({ role: "ORGANIZATION_ADMIN" }));
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result.kind === "AVAILABLE" && result.projects).toHaveLength(300);
  });
});
