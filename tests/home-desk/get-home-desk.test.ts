import { describe, expect, it, vi } from "vitest";
import { GetHomeDesk } from "@/modules/home-desk/application/get-home-desk";
import type { HomeDeskRepositoryPort } from "@/repositories/ports/home-desk-repository";
import type { ProjectListRecord } from "@/repositories/ports/project-list-repository";
import type { HomeComparisonOutcome } from "@/modules/home-intelligence/application/get-home-comparison";
import { roleBundle } from "@/modules/runtime-context/capabilities";
import { jobContext } from "../projects/job-fixture";

const context = jobContext({
  role: "ORGANIZATION_ADMIN",
  capabilities: roleBundle("ORGANIZATION_ADMIN"),
});
const job = (
  key: string,
  stage: ProjectListRecord["stage"] = "QUOTE_REVIEW",
): ProjectListRecord => ({
  id: key,
  businessKey: key,
  organizationId: context.organizationId,
  nameEn: key,
  nameZhTw: `專案${key}`,
  status: "ACTIVE",
  stage,
});
function setup(jobs = [job("A"), job("B", "DISCOVERY")]) {
  const repository = {
    listReadableProjects: vi.fn().mockResolvedValue(jobs),
    listDecisionSources: vi.fn().mockResolvedValue([]),
    listComparedProjectIds: vi.fn().mockResolvedValue(["A"]),
    listClosedJobs: vi.fn().mockResolvedValue([]),
  } satisfies HomeDeskRepositoryPort;
  const comparisons = {
    execute: vi.fn().mockResolvedValue({
      kind: "AVAILABLE",
      comparison: { run: { id: "run" } },
      economics: {
        run: { id: "economics" },
        accessScope: "FULL_ACTUAL",
        selectedProjectKeys: ["history"],
        claims: [
          {
            claimKey: "quote",
            kind: "CATEGORY_QUOTED_VARIANCE",
            categoryId: "SIGNAGE",
            value: { direction: "ABOVE", variancePercent: "15.00" },
            evidenceReferenceIds: ["evidence"],
          },
        ],
      },
    } as unknown as HomeComparisonOutcome),
  };
  return {
    repository,
    comparisons,
    service: new GetHomeDesk(repository, comparisons, () => new Date("2026-11-22")),
  };
}
describe("authorized Home desk", () => {
  it("uses fixed ordering, existing claims and all readable jobs for counts", async () => {
    const f = setup();
    f.repository.listDecisionSources.mockResolvedValue([
      {
        kind: "PREPARED_REVIEW",
        organizationId: context.organizationId,
        projectId: "A",
        membershipId: context.membershipId,
        key: "proposal",
        comparisonRunId: "run",
        enrichmentRunId: "economics",
        expiresAt: "2026-11-23",
      },
    ]);
    const result = await f.service.execute(context);
    expect(result.kind).toBe("AVAILABLE");
    if (result.kind !== "AVAILABLE") throw new Error("required");
    expect(result.decisions.map((item) => item.kind)).toEqual(["CONFIRM_REVIEW"]);
    expect(new Set(result.decisions.map((row) => row.project.businessKey)).size).toBe(
      result.decisions.length,
    );
    expect(result.stageCounts.map((item) => item.count)).toEqual([1, 1, 0, 0, 0]);
    expect(result.canCreate).toBe(true);
  });
  it("Viewer retains assigned lists but has no create, financial claims or review confirmation", async () => {
    const f = setup();
    const result = await f.service.execute({
      ...context,
      role: "VIEWER",
      capabilities: roleBundle("VIEWER"),
      assignedProjectIds: new Set(["A", "B"]),
    });
    expect(result.kind === "AVAILABLE" && result.canCreate).toBe(false);
    expect(result.kind === "AVAILABLE" && result.projects.length).toBe(2);
    expect(result.kind === "AVAILABLE" && result.decisions.map((item) => item.kind)).toEqual([]);
    expect(JSON.stringify(result)).not.toMatch(/variancePercent|15.00|evidence/);
  });
  it("denies without project:read before querying", async () => {
    const f = setup();
    expect(await f.service.execute({ ...context, capabilities: new Set() })).toEqual({
      kind: "UNAVAILABLE",
    });
    expect(f.repository.listReadableProjects).not.toHaveBeenCalled();
  });
  it("drops another organization and unassigned records even from an overbroad adapter", async () => {
    const f = setup([job("A"), { ...job("private"), organizationId: "other" }, job("unassigned")]);
    const result = await f.service.execute({
      ...context,
      role: "VIEWER",
      assignedProjectIds: new Set(["A", "private"]),
    });
    expect(result.kind === "AVAILABLE" && result.projects.map((item) => item.businessKey)).toEqual([
      "A",
    ]);
    expect(JSON.stringify(result)).not.toMatch(/private|unassigned/);
  });
  it("returns an authorized empty firm and retains every overflow decision", async () => {
    const empty = await setup([]).service.execute(context);
    expect(empty.kind === "AVAILABLE" && empty.projects).toEqual([]);
    const f = setup(Array.from({ length: 8 }, (_, i) => job(`job-${i}`, "DISCOVERY")));
    f.repository.listDecisionSources.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => ({
        kind: "DRAFT_QUOTE" as const,
        organizationId: context.organizationId,
        projectId: `job-${i}`,
        key: `draft:${i}`,
      })),
    );
    const result = await f.service.execute(context);
    expect(result.kind === "AVAILABLE" && result.decisions.length).toBe(8);
  });
  it.each(["OUT_OF_DATE", "UNAVAILABLE"] as const)(
    "never uses %s saved financial claims",
    async (kind) => {
      const f = setup();
      f.comparisons.execute.mockResolvedValue({ kind });
      const result = await f.service.execute(context);
      expect(result.kind === "AVAILABLE" && result.decisions.map((item) => item.kind)).toEqual([]);
      expect(result.kind === "AVAILABLE" && result.findingsNotices[0]?.kind).toBe(kind);
    },
  );
  it("preserves jobs and counts when findings and closed-job reads fail", async () => {
    const f = setup();
    f.comparisons.execute.mockRejectedValue(new Error("read"));
    f.repository.listClosedJobs.mockRejectedValue(new Error("read"));
    const result = await f.service.execute(context);
    expect(result.kind === "AVAILABLE" && result.projects.length).toBe(2);
    expect(result.kind === "AVAILABLE" && result.findingsNotices[0]?.kind).toBe("UNAVAILABLE");
    expect(result.kind === "AVAILABLE" && result.closedJobsUnavailable).toBe(true);
  });
  it("rejects expired and other-member proposals", async () => {
    const f = setup();
    f.repository.listDecisionSources.mockResolvedValue([
      {
        kind: "PREPARED_REVIEW",
        organizationId: context.organizationId,
        projectId: "A",
        membershipId: "other",
        key: "other",
        expiresAt: "2027-01-01",
      },
      {
        kind: "PREPARED_REVIEW",
        organizationId: context.organizationId,
        projectId: "A",
        membershipId: context.membershipId,
        key: "old",
        expiresAt: "2026-11-21",
      },
    ]);
    const result = await f.service.execute(context);
    expect(
      result.kind === "AVAILABLE" &&
        result.decisions.some((item) => item.kind === "CONFIRM_REVIEW"),
    ).toBe(false);
  });
});
it("marks a saved comparison with missing economics unavailable rather than all clear", async () => {
  const f = setup();
  f.comparisons.execute.mockResolvedValue({
    kind: "AVAILABLE",
    comparison: { run: { id: "run" } },
  } as unknown as HomeComparisonOutcome);
  const result = await f.service.execute(context);
  expect(result.kind === "AVAILABLE" && result.findingsNotices[0]?.kind).toBe("UNAVAILABLE");
  expect(
    result.kind === "AVAILABLE" && result.decisions.some((item) => item.kind === "REVIEW_QUOTE"),
  ).toBe(false);
});

it("selects the largest saved variance with a count and preserves its evidence destination", async () => {
  const f = setup();
  const saved = await f.comparisons.execute();
  if (saved?.kind !== "AVAILABLE" || !saved.economics) throw new Error("required");
  const base = saved.economics.claims[0]!;
  f.comparisons.execute.mockResolvedValue({
    ...saved,
    economics: {
      ...saved.economics,
      claims: [
        {
          ...base,
          categoryId: "COORDINATION",
          value: { direction: "BELOW", variancePercent: "-15.9000" },
        },
        {
          ...base,
          categoryId: "IMPORTED_STONE",
          claimKey: "stone",
          evidenceReferenceIds: ["stone-source"],
          value: { direction: "ABOVE", variancePercent: "43.0000" },
        },
      ],
    },
  });
  const result = await f.service.execute({
    ...context,
    capabilities: roleBundle("FINANCIAL_REVIEWER"),
  });
  expect(
    result.kind === "AVAILABLE" && result.decisions.find((item) => item.kind === "REVIEW_QUOTE"),
  ).toMatchObject({
    claim: { claimKey: "stone", evidenceReferenceIds: ["stone-source"] },
    additionalFindingCount: 1,
    comparisonRunId: "run",
    enrichmentRunId: "economics",
  });
});
it("orders Draft quote after review, and hides it without drafting permission", async () => {
  const f = setup([job("A"), job("B", "DESIGN"), job("C", "DISCOVERY")]);
  f.repository.listComparedProjectIds.mockResolvedValue(["A", "B"]);
  f.repository.listDecisionSources.mockResolvedValue([
    { kind: "DRAFT_QUOTE", organizationId: context.organizationId, projectId: "B", key: "draft:B" },
  ]);
  const result = await f.service.execute({
    ...context,
    capabilities: new Set([...context.capabilities].filter((cap) => cap !== "quote:issue")),
  });
  expect(result.kind === "AVAILABLE" && result.decisions.map((decision) => decision.kind)).toEqual([
    "REVIEW_QUOTE",
    "DRAFT_QUOTE",
  ]);
  const finance = await f.service.execute({
    ...context,
    capabilities: roleBundle("FINANCIAL_REVIEWER"),
  });
  expect(
    finance.kind === "AVAILABLE" &&
      finance.decisions.some((decision) => decision.kind === "DRAFT_QUOTE"),
  ).toBe(false);
});
it("shows an out-of-date saved comparison after a draft save even before moving Discovery to Quote review", async () => {
  const f = setup([job("A", "DISCOVERY")]);
  f.comparisons.execute.mockResolvedValue({ kind: "OUT_OF_DATE" });
  const result = await f.service.execute(context);
  expect(result.kind === "AVAILABLE" && result.findingsNotices).toEqual([
    {
      project: { businessKey: "A", name: "A", stage: "DISCOVERY", active: true },
      kind: "OUT_OF_DATE",
    },
  ]);
});

it("merges fresh findings into Issue quote, deduplicates jobs and gates both new sources", async () => {
  const f = setup([job("A"), job("B", "DESIGN"), job("C", "DISCOVERY")]);
  f.repository.listComparedProjectIds.mockResolvedValue(["A", "B"]);
  f.repository.listDecisionSources.mockResolvedValue([
    { kind: "ISSUE_QUOTE", organizationId: context.organizationId, projectId: "A", key: "issue:A" },
    {
      kind: "AWAITING_CLIENT",
      organizationId: context.organizationId,
      projectId: "A",
      key: "awaiting:A",
      documentNumber: "A-Q1",
      validUntil: "2026-12-22",
    },
    {
      kind: "AWAITING_CLIENT",
      organizationId: context.organizationId,
      projectId: "B",
      key: "awaiting:B",
      documentNumber: "B-Q1",
      validUntil: "2026-12-22",
    },
  ]);
  const result = await f.service.execute(context);
  expect(result.kind === "AVAILABLE" && result.decisions.map((row) => row.kind)).toEqual([
    "ISSUE_QUOTE",
    "AWAITING_CLIENT",
  ]);
  expect(result.kind === "AVAILABLE" && result.decisions[0]).toMatchObject({
    claim: { claimKey: "quote", evidenceReferenceIds: ["evidence"] },
    additionalFindingCount: 0,
  });
  expect(result.kind === "AVAILABLE" && result.decisions[1]).toMatchObject({
    documentNumber: "B-Q1",
    validUntil: "2026-12-22",
    canAccept: true,
  });
  const pm = await f.service.execute({
    ...context,
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: roleBundle("PROJECT_MANAGER_ESTIMATOR"),
    assignedProjectIds: new Set(["A", "B", "C"]),
  });
  expect(pm.kind === "AVAILABLE" && pm.decisions.map((row) => row.kind)).toEqual([
    "REVIEW_QUOTE",
    "AWAITING_CLIENT",
  ]);
  const viewer = await f.service.execute({
    ...context,
    role: "VIEWER",
    capabilities: roleBundle("VIEWER"),
    assignedProjectIds: new Set(["A", "B", "C"]),
  });
  expect(JSON.stringify(viewer)).not.toMatch(/ISSUE_QUOTE|AWAITING_CLIENT|Q1|variancePercent/);
  f.comparisons.execute.mockResolvedValue({ kind: "OUT_OF_DATE" });
  const stale = await f.service.execute(context);
  expect(stale.kind === "AVAILABLE" && stale.decisions[0]?.kind).toBe("ISSUE_QUOTE");
  expect(stale.kind === "AVAILABLE" && stale.decisions[0]?.claim).toBeUndefined();
});

it.each([
  "DISCOVERY",
  "DESIGN",
  "QUOTE_REVIEW",
  "APPROVED",
  "PROCUREMENT",
  "CONSTRUCTION",
  "HANDOVER",
  "COMPLETE",
] as const)("never asks for a comparison on Home at %s", async (stage) => {
  const f = setup([job("never-compared", stage)]);
  f.repository.listComparedProjectIds.mockResolvedValue([]);
  const result = await f.service.execute(context);
  if (result.kind !== "AVAILABLE") throw Error("AVAILABLE_REQUIRED");
  expect(result.decisions).toEqual([]);
  expect(f.comparisons.execute).not.toHaveBeenCalled();
});

it.each([
  "ORGANIZATION_ADMIN",
  "PROJECT_MANAGER_ESTIMATOR",
  "FINANCIAL_REVIEWER",
  "VIEWER",
] as const)("never asks %s to compare, whether or not they can draft", async (role) => {
  const f = setup([job("without-quote"), job("with-quote")]);
  f.repository.listComparedProjectIds.mockResolvedValue([]);
  f.repository.listDecisionSources.mockResolvedValue([
    {
      kind: "DRAFT_QUOTE",
      organizationId: context.organizationId,
      projectId: "without-quote",
      key: "draft",
    },
  ]);
  const result = await f.service.execute({
    ...context,
    role,
    capabilities: roleBundle(role),
    assignedProjectIds: new Set(["without-quote", "with-quote"]),
  });
  expect(JSON.stringify(result)).not.toContain('"COMPARE"');
  expect(result.kind === "AVAILABLE" && result.decisions.map((d) => d.kind)).toEqual(
    role === "ORGANIZATION_ADMIN" || role === "PROJECT_MANAGER_ESTIMATOR" ? ["DRAFT_QUOTE"] : [],
  );
  expect(f.comparisons.execute).not.toHaveBeenCalled();
});

it.each(["NOT_RUN", "OUT_OF_DATE", "CURRENT"] as const)(
  "adds only the %s state hint to an issue row using its existing saved read",
  async (state) => {
    const f = setup([job("A")]);
    f.repository.listDecisionSources.mockResolvedValue([
      {
        kind: "ISSUE_QUOTE",
        organizationId: context.organizationId,
        projectId: "A",
        key: "issue:A",
      },
    ]);
    if (state === "NOT_RUN") f.repository.listComparedProjectIds.mockResolvedValue([]);
    if (state === "OUT_OF_DATE") f.comparisons.execute.mockResolvedValue({ kind: state });
    const result = await f.service.execute(context);
    if (result.kind !== "AVAILABLE") throw Error(result.kind);
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]?.kind).toBe("ISSUE_QUOTE");
    expect(result.decisions[0]?.comparisonHint).toBe(state === "CURRENT" ? undefined : state);
    expect(result.findingsNotices).toEqual([]);
    expect(f.comparisons.execute).toHaveBeenCalledTimes(state === "NOT_RUN" ? 0 : 1);
  },
);
it.each(["project:compare", "quote:read"] as const)(
  "shows no hint without %s",
  async (capability) => {
    const f = setup([job("A")]);
    f.repository.listDecisionSources.mockResolvedValue([
      {
        kind: "ISSUE_QUOTE",
        organizationId: context.organizationId,
        projectId: "A",
        key: "issue:A",
      },
    ]);
    f.repository.listComparedProjectIds.mockResolvedValue([]);
    const result = await f.service.execute({
      ...context,
      capabilities: new Set([...context.capabilities].filter((c) => c !== capability)),
    });
    expect(JSON.stringify(result)).not.toContain("comparisonHint");
    expect(f.comparisons.execute).not.toHaveBeenCalled();
  },
);
it("keeps a failed state read unavailable instead of asserting it never ran", async () => {
  const f = setup([job("A")]);
  f.repository.listDecisionSources.mockResolvedValue([
    { kind: "ISSUE_QUOTE", organizationId: context.organizationId, projectId: "A", key: "issue:A" },
  ]);
  f.comparisons.execute.mockRejectedValue(Error("read"));
  const result = await f.service.execute(context);
  expect(result.kind === "AVAILABLE" && result.decisions[0]?.comparisonHint).toBeUndefined();
  expect(result.kind === "AVAILABLE" && result.findingsNotices[0]?.kind).toBe("UNAVAILABLE");
});
it("adds no comparison hint to Draft quote or Awaiting client", async () => {
  const f = setup();
  f.repository.listComparedProjectIds.mockResolvedValue([]);
  f.repository.listDecisionSources.mockResolvedValue([
    { kind: "DRAFT_QUOTE", organizationId: context.organizationId, projectId: "A", key: "draft:A" },
    {
      kind: "AWAITING_CLIENT",
      organizationId: context.organizationId,
      projectId: "B",
      key: "awaiting:B",
      documentNumber: "Q1",
      validUntil: "2026-12-01",
    },
  ]);
  const result = await f.service.execute(context);
  expect(result.kind === "AVAILABLE" && result.decisions).toHaveLength(2);
  expect(JSON.stringify(result)).not.toContain("comparisonHint");
});
