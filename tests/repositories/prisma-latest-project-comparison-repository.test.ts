import { expect, it, vi } from "vitest";
import { PrismaLatestProjectComparisonRepository } from "@/repositories/prisma/prisma-latest-project-comparison-repository";
import { jobContext } from "../projects/job-fixture";
it("checks capability and assignment before looking up a saved Home comparison", async () => {
  const findFirst = vi.fn();
  const repo = new PrismaLatestProjectComparisonRepository({ comparisonRun: { findFirst } });
  expect(await repo.findLatest(jobContext({ capabilities: new Set() }), "private-job")).toBeNull();
  expect(
    await repo.findLatest(jobContext({ assignedProjectIds: new Set() }), "private-job"),
  ).toBeNull();
  expect(findFirst).not.toHaveBeenCalled();
});
it("scopes both comparison and economics lookup and rejects foreign ownership", async () => {
  const findFirst = vi.fn().mockResolvedValue({
    id: "run",
    organizationId: "other",
    activeProjectId: "private-job",
    economicsEnrichment: [{ id: "econ" }],
  });
  const repo = new PrismaLatestProjectComparisonRepository({ comparisonRun: { findFirst } });
  expect(
    await repo.findLatest(jobContext({ role: "ORGANIZATION_ADMIN" }), "private-job"),
  ).toBeNull();
  expect(findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { organizationId: "org_horizon", activeProjectId: "private-job", status: "COMPLETED" },
      select: expect.objectContaining({
        economicsEnrichment: expect.objectContaining({
          where: {
            organizationId: "org_horizon",
            activeProjectId: "private-job",
            status: "COMPLETED",
          },
        }),
      }),
    }),
  );
});
