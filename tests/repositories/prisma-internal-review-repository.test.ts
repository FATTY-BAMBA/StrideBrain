import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../../.generated/prisma/client";
import {
  ACTION_SNAPSHOT_VERSION,
  PROPOSAL_SNAPSHOT_VERSION,
} from "@/modules/internal-review/domain/contracts";
import { resolveCapabilities } from "@/modules/runtime-context/capabilities";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ActionMetadata,
  InternalReviewTransaction,
  PersistProposal,
  ProposalMetadata,
} from "@/repositories/ports/internal-review-repository";
import { PrismaInternalReviewRepository } from "@/repositories/prisma/prisma-internal-review-repository";

const NOW = new Date("2026-11-15T12:00:00Z");
const CONTEXT: RuntimeContext = {
  requestId: "request-repository",
  sessionId: "signed-session",
  organizationId: "org-one",
  userId: "person-one",
  membershipId: "member-one",
  role: "FINANCIAL_REVIEWER",
  capabilities: resolveCapabilities("FINANCIAL_REVIEWER", []),
  assignedProjectIds: new Set(["project-one"]),
  projectAssignments: new Map([
    ["project-one", { projectId: "project-one", canReadActuals: true, canCreateAction: true }],
  ]),
  locale: "en",
  dataMode: "DEMO_SYNTHETIC",
};
const PROPOSAL: ProposalMetadata = {
  id: "proposal-id",
  businessKey: "proposal-key",
  projectId: "project-one",
  comparisonRunId: "comparison-one",
  enrichmentRunId: "economics-one",
  preparedByMembershipId: "member-one",
  status: "PREPARED",
  expiresAt: "2026-11-15T12:30:00Z",
  consumedAt: null,
  confirmationKey: "8e33a52e-78fd-4ec9-ad1d-46613eed8942",
  suggestedAssigneeMembershipId: null,
  suggestedDueDate: "2026-11-22",
  evidenceReferenceIds: ["reference-one"],
};
const ACTION: ActionMetadata = {
  id: "action-id",
  businessKey: "action-key",
  projectId: "project-one",
  proposedActionId: "proposal-id",
  comparisonRunId: "comparison-one",
  enrichmentRunId: "economics-one",
  evidenceReferenceIds: ["reference-one"],
};
function member() {
  return {
    id: CONTEXT.membershipId,
    organizationId: CONTEXT.organizationId,
    active: true,
    role: "FINANCIAL_REVIEWER",
    personId: CONTEXT.userId,
    person: {
      id: CONTEXT.userId,
      organizationId: CONTEXT.organizationId,
      active: true,
      nameEn: "Mei",
      nameZhTw: "美玲",
    },
    capabilityGrants: [] as { organizationId: string; capability: string; effect: string }[],
    assignments: [
      {
        organizationId: CONTEXT.organizationId,
        projectId: "project-one",
        canReadActuals: true,
        canCreateAction: true,
      },
    ],
  };
}
function setup() {
  const db = {
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    $executeRaw: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn().mockResolvedValue([]),
    demoSession: {
      findFirst: vi.fn().mockResolvedValue({
        organization: { dataClassification: "DEMO_SYNTHETIC", timezone: "Asia/Taipei" },
        membership: member(),
      }),
    },
    membership: { findMany: vi.fn().mockResolvedValue([member()]) },
    project: { findFirst: vi.fn().mockResolvedValue(null) },
    comparisonRun: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "comparison-one",
          activeProjectId: "project-one",
          candidates: [{ candidateProjectId: "project-history" }],
        },
      ]),
    },
    economicsEnrichmentRun: { findFirst: vi.fn().mockResolvedValue(null) },
    evidenceReference: { findMany: vi.fn().mockResolvedValue([]) },
    costLine: { findMany: vi.fn().mockResolvedValue([]) },
    proposedAction: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    },
    action: { findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) },
    internalReviewReceipt: { findFirst: vi.fn().mockResolvedValue(null) },
  };
  const database = {
    $transaction: vi.fn<
      (work: (tx: unknown) => Promise<unknown>, options: unknown) => Promise<unknown>
    >(async (work) => work(db)),
  };
  const repository = new PrismaInternalReviewRepository(database as unknown as PrismaClient);
  return { db, database, repository };
}
function owner(id = "project-history", organizationId = "org-one") {
  return { id, organizationId, dataClassification: "DEMO_SYNTHETIC", deletedAt: null };
}

describe("Prisma Stage 8 identity and scope boundary", () => {
  it("reloads the signed session with current membership and honors an explicit capability denial", async () => {
    const state = setup();
    const row = member();
    row.capabilityGrants = [
      { organizationId: "org-one", capability: "commercial:actual-read", effect: "DENY" },
    ];
    state.db.demoSession.findFirst.mockResolvedValue({
      organization: { dataClassification: "DEMO_SYNTHETIC", timezone: "Asia/Taipei" },
      membership: row,
    });
    const result = await state.repository.transaction((tx) => tx.refreshActor(CONTEXT, NOW));
    expect(result?.context.capabilities.has("commercial:actual-read")).toBe(false);
    expect(result?.context.projectAssignments?.get("project-one")?.canCreateAction).toBe(true);
    expect(state.db.demoSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "signed-session",
          organizationId: "org-one",
          membershipId: "member-one",
          revokedAt: null,
          expiresAt: { gt: NOW },
        },
      }),
    );
  });

  it("cannot derive identity from a runtime context lacking a verified session selector", async () => {
    const state = setup();
    const unsigned = { ...CONTEXT };
    delete unsigned.sessionId;
    expect(await state.repository.transaction((tx) => tx.refreshActor(unsigned, NOW))).toBeNull();
    expect(state.db.demoSession.findFirst).not.toHaveBeenCalled();
  });

  it.each([
    "inactive member",
    "inactive person",
    "foreign member",
    "foreign person",
    "foreign grant",
    "foreign assignment",
    "mismatched person",
  ])("rejects %s even if returned by a malformed row", async (defect) => {
    const state = setup();
    const row = member();
    if (defect === "inactive member") row.active = false;
    if (defect === "inactive person") row.person.active = false;
    if (defect === "foreign member") row.organizationId = "org-foreign";
    if (defect === "foreign person") row.person.organizationId = "org-foreign";
    if (defect === "foreign grant")
      row.capabilityGrants = [
        { organizationId: "org-foreign", capability: "commercial:actual-read", effect: "ALLOW" },
      ];
    if (defect === "foreign assignment") row.assignments[0]!.organizationId = "org-foreign";
    if (defect === "mismatched person") row.person.id = "different-person";
    state.db.demoSession.findFirst.mockResolvedValue({
      organization: { dataClassification: "DEMO_SYNTHETIC", timezone: "Asia/Taipei" },
      membership: row,
    });
    expect(await state.repository.transaction((tx) => tx.refreshActor(CONTEXT, NOW))).toBeNull();
  });

  it("scopes project lookup to tenant and assignment before returning names", async () => {
    const state = setup();
    expect(
      await state.repository.transaction((tx) => tx.getProject(CONTEXT, "foreign-key")),
    ).toBeNull();
    expect(state.db.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org-one",
          deletedAt: null,
          OR: [{ id: "foreign-key" }, { businessKey: "foreign-key" }],
          id: { in: ["project-one"] },
        },
      }),
    );
  });

  it("binds proposal metadata and its lock to tenant and preparing actor without selecting sensitive text", async () => {
    const state = setup();
    await state.repository.transaction((tx) => tx.findProposal(CONTEXT, "foreign-proposal", true));
    expect(state.db.$queryRaw.mock.calls[0]!.slice(1)).toEqual([
      "org-one",
      "foreign-proposal",
      "member-one",
    ]);
    const query = state.db.proposedAction.findFirst.mock.calls[0]![0];
    expect(query.where).toEqual({
      organizationId: "org-one",
      businessKey: "foreign-proposal",
      preparedByMembershipId: "member-one",
      snapshotVersion: PROPOSAL_SNAPSHOT_VERSION,
    });
    expect(query.select).not.toHaveProperty("contentSnapshot");
    expect(query.select).not.toHaveProperty("title");
    expect(query.select).not.toHaveProperty("rationale");
  });

  it("rebinds every proposal snapshot selector to the previously authorized scope", async () => {
    const state = setup();
    await state.repository.transaction((tx) => tx.getProposal(CONTEXT, PROPOSAL));
    expect(state.db.proposedAction.findFirst).toHaveBeenCalledWith({
      where: {
        id: PROPOSAL.id,
        organizationId: "org-one",
        preparedByMembershipId: "member-one",
        projectId: "project-one",
        comparisonRunId: "comparison-one",
        enrichmentRunId: "economics-one",
        snapshotVersion: PROPOSAL_SNAPSHOT_VERSION,
      },
      select: { contentSnapshot: true },
    });
  });

  it("does not turn legacy or unsupported snapshot JSON into Stage 8 proposal/action records", async () => {
    const state = setup();
    state.db.proposedAction.findFirst.mockResolvedValue({
      contentSnapshot: { version: "legacy", title: "hidden" },
    });
    state.db.action.findFirst.mockResolvedValue({
      contentSnapshot: { version: "legacy", title: "hidden" },
    });
    expect(
      await state.repository.transaction((tx) => tx.getProposal(CONTEXT, PROPOSAL)),
    ).toBeNull();
    expect(await state.repository.transaction((tx) => tx.getAction(CONTEXT, ACTION))).toBeNull();
  });

  it("loads only bounded action metadata before evidence authorization and scopes durable receipt lookup", async () => {
    const state = setup();
    await state.repository.transaction(async (tx) => {
      await tx.findAction(CONTEXT, "action-key");
      await tx.listActionMetadata(CONTEXT, "project-one");
      await tx.getReceiptRecord(CONTEXT, "known-key");
    });
    for (const query of [
      state.db.action.findFirst.mock.calls[0]![0],
      state.db.action.findMany.mock.calls[0]![0],
    ]) {
      expect(query.where).toMatchObject({
        organizationId: "org-one",
        snapshotVersion: ACTION_SNAPSHOT_VERSION,
      });
      for (const sensitive of [
        "title",
        "rationale",
        "contentSnapshot",
        "evidenceSnapshot",
        "assigneePersonId",
      ])
        expect(query.select).not.toHaveProperty(sensitive);
    }
    expect(state.db.action.findMany.mock.calls[0]![0]).toMatchObject({
      where: { projectId: "project-one", status: "OPEN" },
      take: 25,
    });
    expect(state.db.internalReviewReceipt.findFirst.mock.calls[0]![0].where).toEqual({
      organizationId: "org-one",
      idempotencyKey: "known-key",
    });
  });

  it("binds authorized action snapshot reads to tenant/project and excludes legacy records", async () => {
    const state = setup();
    await state.repository.transaction((tx) => tx.getAction(CONTEXT, ACTION));
    expect(state.db.action.findFirst.mock.calls[0]![0].where).toEqual({
      id: "action-id",
      organizationId: "org-one",
      projectId: "project-one",
      snapshotVersion: ACTION_SNAPSHOT_VERSION,
    });
  });
});

describe("Prisma Stage 8 bounded evidence and assignee loading", () => {
  it("loads evidence ownership in one batch per source type, without sensitive financial values", async () => {
    const state = setup();
    const ids = Array.from({ length: 50 }, (_, index) => `reference-${index}`);
    state.db.evidenceReference.findMany.mockResolvedValue(
      ids.map((id, index) => ({
        id,
        organizationId: "org-one",
        subjectType: "COST_LINE",
        subjectId: `cost-${index}`,
        dataClassification: "DEMO_SYNTHETIC",
        observationType: "RECONCILED_ACTUAL_COST",
      })),
    );
    state.db.costLine.findMany.mockResolvedValue(
      ids.map((_, index) => ({ id: `cost-${index}`, projectCostVersion: { project: owner() } })),
    );
    const result = await state.repository.transaction((tx) =>
      tx.getEvidenceScopes(CONTEXT, ["comparison-one"], ids),
    );
    expect(result).toHaveLength(50);
    expect(result[0]).toMatchObject({
      referenceId: "reference-0",
      subjectId: "cost-0",
      projectId: "project-history",
      comparisonRunIds: ["comparison-one"],
      inComparison: true,
    });
    expect(state.db.evidenceReference.findMany).toHaveBeenCalledTimes(1);
    expect(state.db.costLine.findMany).toHaveBeenCalledTimes(1);
    expect(state.db.comparisonRun.findMany).toHaveBeenCalledTimes(1);
    const read = state.db.costLine.findMany.mock.calls[0]![0];
    expect(read.where).toMatchObject({
      organizationId: "org-one",
      id: { in: Array.from({ length: 50 }, (_, index) => `cost-${index}`) },
    });
    expect(JSON.stringify(read.select)).not.toMatch(
      /amount|unitCost|currency|description|title|nameEn|supportedValue/,
    );
    expect(state.db.evidenceReference.findMany.mock.calls[0]![0].select).not.toHaveProperty(
      "supportedValue",
    );
  });

  it("checks reference classification separately from its subject-project classification", async () => {
    const state = setup();
    state.db.evidenceReference.findMany.mockResolvedValue([
      {
        id: "reference-one",
        organizationId: "org-one",
        subjectType: "COST_LINE",
        subjectId: "cost-one",
        dataClassification: "TENANT_RESTRICTED",
        observationType: "RECONCILED_ACTUAL_COST",
      },
    ]);
    state.db.costLine.findMany.mockResolvedValue([
      { id: "cost-one", projectCostVersion: { project: owner() } },
    ]);
    expect(
      await state.repository.transaction((tx) =>
        tx.getEvidenceScopes(CONTEXT, "comparison-one", ["reference-one"]),
      ),
    ).toMatchObject([
      { classification: "TENANT_RESTRICTED", projectClassification: "DEMO_SYNTHETIC" },
    ]);
  });

  it.each(["missing owner", "foreign owner", "unknown subject"])(
    "omits %s evidence without treating it as authorized support",
    async (defect) => {
      const state = setup();
      state.db.evidenceReference.findMany.mockResolvedValue([
        {
          id: "reference-one",
          organizationId: "org-one",
          subjectType: defect === "unknown subject" ? "UNSUPPORTED" : "COST_LINE",
          subjectId: "cost-one",
          dataClassification: "DEMO_SYNTHETIC",
          observationType: "RECONCILED_ACTUAL_COST",
        },
      ]);
      state.db.costLine.findMany.mockResolvedValue(
        defect === "missing owner"
          ? []
          : [
              {
                id: "cost-one",
                projectCostVersion: { project: owner("project-history", "org-foreign") },
              },
            ],
      );
      expect(
        await state.repository.transaction((tx) =>
          tx.getEvidenceScopes(CONTEXT, "comparison-one", ["reference-one"]),
        ),
      ).toEqual([]);
    },
  );

  it("performs no scope query when evidence access is denied or selectors exceed the bound", async () => {
    const state = setup();
    const denied = {
      ...CONTEXT,
      capabilities: new Set(
        [...CONTEXT.capabilities].filter((capability) => capability !== "evidence:read"),
      ),
    };
    await state.repository.transaction(async (tx) => {
      expect(await tx.getEvidenceScopes(denied, "comparison-one", ["reference-one"])).toEqual([]);
      expect(await tx.getEvidenceScopes(CONTEXT, "comparison-one", [])).toEqual([]);
      expect(
        await tx.getEvidenceScopes(
          CONTEXT,
          "comparison-one",
          Array.from({ length: 2501 }, (_, index) => `ref-${index}`),
        ),
      ).toEqual([]);
    });
    expect(state.db.evidenceReference.findMany).not.toHaveBeenCalled();
    expect(state.db.comparisonRun.findMany).not.toHaveBeenCalled();
  });

  it("loads candidate memberships once and returns opaque selectors rather than raw membership IDs", async () => {
    const state = setup();
    const records = await state.repository.transaction((tx) => tx.listMembers(CONTEXT));
    expect(records).toHaveLength(1);
    expect(records[0]!.key).toMatch(/^assignee_[a-f0-9]{32}$/);
    expect(records[0]!.key).not.toContain(CONTEXT.membershipId);
    expect(state.db.membership.findMany).toHaveBeenCalledTimes(1);
    expect(state.db.membership.findMany.mock.calls[0]![0]).toMatchObject({
      where: {
        organizationId: "org-one",
        active: true,
        role: { not: "VIEWER" },
        person: { organizationId: "org-one", active: true },
      },
      take: 100,
    });
  });
});

describe("Prisma Stage 8 transactional preparation protocol", () => {
  it("takes source locks before repository reads and uses bounded transaction/lock timeouts", async () => {
    const state = setup();
    const visited: string[] = [];
    state.db.$executeRawUnsafe.mockImplementation(async (sql: string) => {
      visited.push(sql);
      return 0;
    });
    await state.repository.transaction(async () => {
      visited.push("application-read");
    });
    expect(visited[0]).toContain("lock_timeout = '2s'");
    expect(visited[1]).toContain("statement_timeout = '5s'");
    expect(visited[2]).toMatch(/^LOCK TABLE .* IN SHARE MODE$/);
    for (const source of [
      "DemoSession",
      "MembershipCapabilityGrant",
      "QuoteVersion",
      "EvidenceReference",
      "EvidenceConflict",
      "ComparisonClaim",
      "EconomicsObservationDecision",
    ])
      expect(visited[2]).toContain(`"${source}"`);
    expect(visited[2]).not.toMatch(
      /"ProposedAction"|"Action"|"AuditEvent"|"InternalReviewReceipt"/,
    );
    expect(visited[3]).toBe("application-read");
    expect(state.database.$transaction.mock.calls[0]![1]).toEqual({
      isolationLevel: "ReadCommitted",
      maxWait: 3000,
      timeout: 10000,
    });
  });

  it("reopens expired or consumed preparatory identity without updating it or generating a replacement key", async () => {
    const state = setup();
    const row = {
      ...PROPOSAL,
      organizationId: "org-one",
      status: "CONFIRMED",
      expiresAt: new Date(PROPOSAL.expiresAt),
      consumedAt: NOW,
      suggestedDueDate: new Date("2026-11-22T00:00:00Z"),
    };
    state.db.proposedAction.findUnique.mockResolvedValue(row);
    const existing = await state.repository.transaction((tx) =>
      tx.persistProposal({
        organizationId: "org-one",
        preparationKey: "stable-intent",
      } as PersistProposal),
    );
    expect(existing).toMatchObject({
      businessKey: PROPOSAL.businessKey,
      status: "CONFIRMED",
      confirmationKey: PROPOSAL.confirmationKey,
    });
    expect(state.db.proposedAction.create).not.toHaveBeenCalled();
    expect(state.db.proposedAction.findUnique.mock.calls[0]![0].where).toEqual({
      organizationId_preparationKey: { organizationId: "org-one", preparationKey: "stable-intent" },
    });
    expect(state.db.$executeRaw.mock.calls[0]!.slice(1)).toEqual(["org-one:stable-intent"]);
  });

  it("propagates source-lock failure before executing any authorized work", async () => {
    const state = setup();
    state.db.$executeRawUnsafe.mockRejectedValue(new Error("lock timeout"));
    const work = vi.fn<(tx: InternalReviewTransaction) => Promise<void>>();
    await expect(state.repository.transaction(work)).rejects.toThrow("lock timeout");
    expect(work).not.toHaveBeenCalled();
  });
});
