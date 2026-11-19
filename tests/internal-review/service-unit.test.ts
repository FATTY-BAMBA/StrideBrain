import { describe, expect, it, vi } from "vitest";

import {
  currentMaterial,
  evidenceScopesAllowed,
} from "@/modules/internal-review/application/freshness";
import type * as FreshnessModule from "@/modules/internal-review/application/freshness";
import { InternalReviewService } from "@/modules/internal-review/application/internal-review-service";
import {
  ACTION_SNAPSHOT_VERSION,
  INTERNAL_REVIEW_POLICY,
  PROPOSAL_SNAPSHOT_VERSION,
  type ConfirmInternalReviewInput,
  type MaterialFingerprints,
  type ProposalContent,
} from "@/modules/internal-review/domain/contracts";
import { resolveCapabilities } from "@/modules/runtime-context/capabilities";
import type { Capability, RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ActionRecord,
  CommitActionInput,
  EvidenceScope,
  InternalReviewRepositoryPort,
  InternalReviewTransaction,
  MemberRecord,
  ProposalRecord,
  ReviewProject,
  StoredRunState,
} from "@/repositories/ports/internal-review-repository";

// Isolate orchestration from source reconstruction; evidence authorization remains real.
// Real PostgreSQL reconstruction, transaction rollback and races are tested separately.
vi.mock("@/modules/internal-review/application/freshness", async (original) => ({
  ...(await original<typeof FreshnessModule>()),
  currentMaterial: vi.fn(),
}));

const NOW = new Date("2026-11-15T15:55:00.000Z");
const KEY = "8e33a52e-78fd-4ec9-ad1d-46613eed8942";
function context(): RuntimeContext {
  return {
    requestId: "request-unit",
    sessionId: "signed-session",
    organizationId: "org-one",
    userId: "person-mei",
    membershipId: "member-mei",
    role: "PROJECT_MANAGER_ESTIMATOR",
    capabilities: resolveCapabilities("PROJECT_MANAGER_ESTIMATOR", [
      { capability: "commercial:actual-read", effect: "ALLOW" },
    ]),
    assignedProjectIds: new Set(["project-one"]),
    projectAssignments: new Map([
      ["project-one", { projectId: "project-one", canReadActuals: true, canCreateAction: true }],
    ]),
    locale: "en",
    dataMode: "DEMO_SYNTHETIC",
  };
}
function without(seed: RuntimeContext, capability: Capability): RuntimeContext {
  return {
    ...seed,
    capabilities: new Set([...seed.capabilities].filter((value) => value !== capability)),
  };
}
const fingerprints: MaterialFingerprints = {
  project: "project",
  comparisonSource: "c-source",
  comparisonInput: "c-input",
  comparisonPermission: "c-permission",
  comparisonResult: "c-result",
  economicsSource: "e-source",
  economicsInput: "e-input",
  economicsPermission: "e-permission",
  economicsStructural: "e-structure",
  economicsResult: "e-result",
  permission: "permission",
  evidence: "evidence",
};
function proposal(): ProposalRecord {
  const content: ProposalContent = {
    version: PROPOSAL_SNAPSHOT_VERSION,
    policyVersion: INTERNAL_REVIEW_POLICY,
    project: { projectKey: "PRJ-ONE", name: { en: "Private project", zhTw: "內部專案" } },
    comparisonRunId: "comparison-one",
    enrichmentRunId: "economics-one",
    actorUserId: "person-mei",
    actorMembershipId: "member-mei",
    titleOptions: [
      { key: "VALIDATE", text: { en: "Validate assumptions", zhTw: "檢核假設" } },
      { key: "REVIEW", text: { en: "Review assumptions", zhTw: "審查假設" } },
    ],
    rationaleOptions: [
      {
        key: "REVIEW_NEXT",
        text: { en: "Review before next quotation review.", zhTw: "下次報價審查前檢核。" },
      },
    ],
    mandatoryStatements: [
      {
        key: "VERIFIED",
        text: {
          en: "Actual evidence is insufficient: 2 of 3 observations.",
          zhTw: "實際成本佐證不足：2 筆，需要 3 筆。",
        },
        claimKey: "claim-one",
      },
    ],
    warnings: [
      {
        key: "REVIEW_ONLY",
        text: { en: "This does not approve or issue a quote.", zhTw: "此操作不會核准或發出報價。" },
      },
    ],
    claims: [],
    evidence: [],
    fingerprints,
    policyVersions: { action: INTERNAL_REVIEW_POLICY },
    returnContext: { selectedProjectKeys: ["PRJ-HISTORY"] },
    locale: "en",
    timezone: "Asia/Taipei",
  };
  return {
    id: "proposal-id",
    businessKey: "proposal-one",
    projectId: "project-one",
    comparisonRunId: "comparison-one",
    enrichmentRunId: "economics-one",
    preparedByMembershipId: "member-mei",
    status: "PREPARED",
    expiresAt: "2026-11-15T16:25:00.000Z",
    consumedAt: null,
    confirmationKey: KEY,
    suggestedAssigneeMembershipId: "member-mei",
    suggestedDueDate: "2026-11-22",
    evidenceReferenceIds: ["reference-one"],
    content,
  };
}
function command(overrides: Partial<ConfirmInternalReviewInput> = {}): ConfirmInternalReviewInput {
  return {
    version: "internal-review-command.v1",
    proposalKey: "proposal-one",
    title: "Validate assumptions",
    rationale: "Review before next quotation review.",
    assigneeKey: "assignee-mei",
    dueDate: "2026-11-22",
    confirmation: true,
    idempotencyKey: KEY,
    locale: "en",
    ...overrides,
  };
}
function setup() {
  const actor = context();
  const record = proposal();
  const project: ReviewProject = {
    id: "project-one",
    organizationId: "org-one",
    businessKey: "PRJ-ONE",
    name: record.content.project.name,
    status: "ACTIVE",
    stage: "QUOTATION",
    updatedAt: "2026-11-01T00:00:00Z",
    deletedAt: null,
  };
  const scopes: EvidenceScope[] = [
    {
      referenceId: "reference-one",
      organizationId: "org-one",
      subjectType: "COST_LINE",
      subjectId: "cost-line-one",
      classification: "DEMO_SYNTHETIC",
      observationType: "RECONCILED_ACTUAL_COST",
      projectId: "project-history",
      projectClassification: "DEMO_SYNTHETIC",
      projectDeleted: false,
      inComparison: true,
      comparisonRunIds: ["comparison-one"],
    },
  ];
  const member: MemberRecord = {
    context: actor,
    key: "assignee-mei",
    name: { en: "Mei", zhTw: "美玲" },
  };
  const action: ActionRecord = {
    id: "action-id",
    businessKey: "action-one",
    projectId: project.id,
    proposedActionId: record.id,
    comparisonRunId: record.comparisonRunId,
    enrichmentRunId: record.enrichmentRunId,
    evidenceReferenceIds: record.evidenceReferenceIds,
    dueDate: record.suggestedDueDate,
    status: "OPEN",
    createdAt: NOW.toISOString(),
    evidenceSnapshot: {
      sources: [
        { referenceId: "reference-one", subjectType: "COST_LINE", subjectId: "cost-line-one" },
      ],
    },
    content: {
      version: ACTION_SNAPSHOT_VERSION,
      policyVersion: INTERNAL_REVIEW_POLICY,
      timezone: "Asia/Taipei",
      project: record.content.project,
      title: record.content.titleOptions[0]!.text,
      rationale: { en: "Approved original wording", zhTw: "已確認的原始文字" },
      titleKey: "VALIDATE",
      rationaleKey: "REVIEW_NEXT",
      createdBy: member.name,
      assignee: member.name,
      comparisonRunId: record.comparisonRunId,
      enrichmentRunId: record.enrichmentRunId,
      returnContext: record.content.returnContext,
    },
  };
  const tx = {
    refreshActor: vi
      .fn()
      .mockResolvedValue({ context: actor, name: member.name, timezone: "Asia/Taipei" }),
    getProject: vi.fn().mockResolvedValue(project),
    getRunState: vi.fn(),
    getEvidenceScopes: vi.fn().mockResolvedValue(scopes),
    listMembers: vi.fn().mockResolvedValue([member]),
    findProposal: vi.fn().mockResolvedValue(record),
    getProposal: vi.fn().mockResolvedValue(record),
    persistProposal: vi.fn(),
    getReceiptRecord: vi.fn().mockResolvedValue(null),
    findAction: vi.fn().mockResolvedValue(action),
    listActionMetadata: vi.fn().mockResolvedValue([action]),
    getAction: vi.fn().mockResolvedValue(action),
    commitAction: vi.fn().mockResolvedValue(undefined),
  };
  const repository: InternalReviewRepositoryPort = {
    transaction: vi.fn(async (work) => work(tx as unknown as InternalReviewTransaction)),
  };
  const trace = vi.fn();
  const clock = vi.fn(() => NOW);
  const service = new InternalReviewService(repository, clock, trace);
  vi.mocked(currentMaterial)
    .mockReset()
    .mockResolvedValue({
      kind: "READY",
      material: {
        runs: {} as StoredRunState,
        claims: [],
        evidence: [],
        scopes,
        fingerprints,
        references: record.evidenceReferenceIds,
      },
    });
  return { actor, record, project, scopes, member, action, tx, repository, trace, clock, service };
}

describe("Stage 8 capability gates and safe failures", () => {
  it("offers creation only for a currently verified immutable pair without preparing business state", async () => {
    const state = setup();
    const pair = { comparisonRunId: "comparison-one", enrichmentRunId: "economics-one" };
    expect(await state.service.canPrepare(state.actor, "PRJ-ONE", pair)).toBe(true);
    expect(currentMaterial).toHaveBeenCalledWith(
      state.tx,
      state.actor,
      state.project,
      pair.comparisonRunId,
      pair.enrichmentRunId,
      NOW,
      "Asia/Taipei",
    );
    expect(state.tx.persistProposal).not.toHaveBeenCalled();
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it.each(["STALE_COMPARISON", "EVIDENCE_UNAVAILABLE"] as const)(
    "hides the entry when current source or mandatory claim verification returns %s",
    async (kind) => {
      const state = setup();
      vi.mocked(currentMaterial).mockResolvedValue({ kind });
      expect(
        await state.service.canPrepare(state.actor, "PRJ-ONE", {
          comparisonRunId: "comparison-one",
          enrichmentRunId: "economics-one",
        }),
      ).toBe(false);
      expect(state.tx.persistProposal).not.toHaveBeenCalled();
      expect(state.tx.commitAction).not.toHaveBeenCalled();
    },
  );

  it("requires a bounded run pair before opening a preflight transaction", async () => {
    const state = setup();
    expect(await state.service.canPrepare(state.actor, "PRJ-ONE")).toBe(false);
    expect(
      await state.service.canPrepare(state.actor, "PRJ-ONE", {
        comparisonRunId: "comparison-one",
        enrichmentRunId: "https://foreign.example/run",
      }),
    ).toBe(false);
    expect(state.repository.transaction).not.toHaveBeenCalled();
  });

  it("hides the entry after session revocation without attempting source validation", async () => {
    const state = setup();
    state.tx.refreshActor.mockResolvedValue(null);
    expect(
      await state.service.canPrepare(state.actor, "PRJ-ONE", {
        comparisonRunId: "comparison-one",
        enrichmentRunId: "economics-one",
      }),
    ).toBe(false);
    expect(currentMaterial).not.toHaveBeenCalled();
    expect(state.tx.persistProposal).not.toHaveBeenCalled();
  });

  it("hides the entry safely when source verification fails unexpectedly", async () => {
    const state = setup();
    vi.mocked(currentMaterial).mockRejectedValue(new Error("private source detail"));
    expect(
      await state.service.canPrepare(state.actor, "PRJ-ONE", {
        comparisonRunId: "comparison-one",
        enrichmentRunId: "economics-one",
      }),
    ).toBe(false);
    expect(state.tx.persistProposal).not.toHaveBeenCalled();
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it.each(["VIEWER", "actual capability denied", "create capability denied"])(
    "denies every entry before transaction or sensitive reads for %s",
    async (denial) => {
      const state = setup();
      const actor =
        denial === "VIEWER"
          ? { ...state.actor, role: "VIEWER" as const }
          : without(
              state.actor,
              denial === "actual capability denied"
                ? "commercial:actual-read"
                : "action:internal-review:create",
            );
      expect(await state.service.canPrepare(actor, "PRJ-ONE")).toBe(false);
      expect(
        await state.service.prepare(actor, {
          projectKey: "PRJ-ONE",
          comparisonRunId: "comparison-one",
          enrichmentRunId: "economics-one",
          locale: "en",
        }),
      ).toEqual({ kind: "PROPOSAL_NOT_AUTHORIZED", requestId: actor.requestId });
      expect(await state.service.reopenProposal(actor, "proposal-one", "en")).toEqual({
        kind: "PROPOSAL_NOT_AUTHORIZED",
        requestId: actor.requestId,
      });
      expect(await state.service.confirm(actor, command())).toEqual({
        kind: "ACTION_NOT_AUTHORIZED",
        requestId: actor.requestId,
      });
      expect(await state.service.getReceipt(actor, "action-one", "en")).toEqual({
        kind: "ACTION_NOT_AUTHORIZED",
        requestId: actor.requestId,
      });
      expect(await state.service.listProjectActions(actor, "PRJ-ONE", "en")).toEqual({
        kind: "ACTION_NOT_AUTHORIZED",
        requestId: actor.requestId,
      });
      expect(state.repository.transaction).not.toHaveBeenCalled();
    },
  );

  it.each(["revoked", "downgraded"])(
    "refreshes signed identity and rejects %s membership before loading proposal",
    async (change) => {
      const state = setup();
      state.tx.refreshActor.mockResolvedValue(
        change === "revoked"
          ? null
          : {
              context: without(state.actor, "commercial:actual-read"),
              name: state.member.name,
              timezone: "Asia/Taipei",
            },
      );
      expect(await state.service.confirm(state.actor, command())).toEqual({
        kind: "ACTION_NOT_AUTHORIZED",
        requestId: state.actor.requestId,
      });
      expect(state.tx.findProposal).not.toHaveBeenCalled();
      expect(state.tx.getEvidenceScopes).not.toHaveBeenCalled();
      expect(state.tx.commitAction).not.toHaveBeenCalled();
    },
  );

  it("returns the same neutral result for missing or foreign proposals without exposing snapshots", async () => {
    const state = setup();
    state.tx.findProposal.mockResolvedValue(null);
    for (const proposalKey of ["missing-proposal", "foreign-proposal"]) {
      expect(await state.service.confirm(state.actor, command({ proposalKey }))).toEqual({
        kind: "ACTION_NOT_AUTHORIZED",
        requestId: state.actor.requestId,
      });
    }
    expect(state.tx.getProposal).not.toHaveBeenCalled();
    expect(state.tx.getEvidenceScopes).not.toHaveBeenCalled();
  });

  it("never reads proposal details for a user whose active-project assignment was removed", async () => {
    const state = setup();
    state.tx.refreshActor.mockResolvedValue({
      context: { ...state.actor, assignedProjectIds: new Set(), projectAssignments: new Map() },
      name: state.member.name,
      timezone: "Asia/Taipei",
    });
    expect(await state.service.confirm(state.actor, command())).toMatchObject({
      kind: "ACTION_NOT_AUTHORIZED",
    });
    expect(state.tx.getProposal).not.toHaveBeenCalled();
    expect(state.tx.getEvidenceScopes).not.toHaveBeenCalled();
  });

  it("keeps unexpected repository errors out of safe responses and operator traces", async () => {
    const state = setup();
    state.tx.findProposal.mockRejectedValue(new Error("private-title org-foreign SQL password"));
    expect(await state.service.confirm(state.actor, command())).toEqual({
      kind: "ACTION_CREATE_FAILED",
      requestId: state.actor.requestId,
    });
    expect(state.trace).toHaveBeenLastCalledWith({
      requestId: state.actor.requestId,
      outcome: "ACTION_CREATE_FAILED",
    });
  });
});

describe("Stage 8 confirmation boundaries", () => {
  it("traces field validation with only the request ID and safe outcome", async () => {
    const state = setup();
    expect(
      await state.service.confirm(
        state.actor,
        command({ title: "Private client claim: supplier overcharges" }),
      ),
    ).toMatchObject({ kind: "VALIDATION_FAILED", fieldErrors: { title: "INVALID_TITLE" } });
    expect(state.trace.mock.calls).toEqual([
      [{ requestId: state.actor.requestId, outcome: "VALIDATION_FAILED" }],
    ]);
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it("does not reopen a reused proposal whose stored suggested assignee has become ineligible", async () => {
    const state = setup();
    const values = [
      { variancePercent: "18.2" },
      { variancePercent: "12.3" },
      { eligibleObservationCount: 2, requiredObservationCount: 3 },
      {
        activeProgrammeWeeks: "12",
        historicalMinimumWeeks: "16",
        historicalMaximumWeeks: "20",
        quantifiedPremiumState: "UNQUANTIFIED",
      },
    ];
    const kinds = [
      "CATEGORY_FORECAST_ACTUAL_VARIANCE",
      "CATEGORY_QUOTED_VARIANCE",
      "CATEGORY_ACTUAL_INSUFFICIENT",
      "PROGRAMME_DIFFERENCE_UNQUANTIFIED",
    ] as const;
    vi.mocked(currentMaterial).mockResolvedValue({
      kind: "READY",
      material: {
        runs: {
          stage4: {
            run: { id: "comparison-one" },
            activeContext: {
              nameEn: "Private project",
              nameZhTw: "內部專案",
              location: { district: "Xinyi District" },
              activeQuoteVersionKey: "quote-v3",
            },
          },
          stage5: { run: { id: "economics-one" }, selectedProjectKeys: ["PRJ-HISTORY"] },
        } as unknown as StoredRunState,
        claims: kinds.map((kind, index) => ({
          kind,
          claimKey: `claim-${index}`,
          titleEn: "Finding",
          titleZhTw: "發現",
          value: values[index]!,
          evidenceReferenceIds: ["reference-one"],
          warningCodes: [],
        })),
        evidence: [],
        scopes: state.scopes,
        fingerprints,
        references: state.record.evidenceReferenceIds,
      },
    });
    state.tx.persistProposal.mockResolvedValue({
      ...state.record,
      suggestedAssigneeMembershipId: "member-no-longer-eligible",
    });
    expect(
      await state.service.prepare(state.actor, {
        projectKey: "PRJ-ONE",
        comparisonRunId: "comparison-one",
        enrichmentRunId: "economics-one",
        locale: "en",
      }),
    ).toEqual({ kind: "PROPOSAL_UNAVAILABLE", requestId: state.actor.requestId });
    expect(state.tx.getProposal).not.toHaveBeenCalled();
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it("stores bilingual edited fields and all locked warnings only after explicit confirmation", async () => {
    const state = setup();
    expect(
      await state.service.confirm(
        state.actor,
        command({ title: "審查假設", rationale: "下次報價審查前檢核。", locale: "zh-TW" }),
      ),
    ).toMatchObject({
      kind: "CREATED",
      receipt: { title: "審查假設", status: "OPEN", project: { name: "內部專案" } },
    });
    const commit = state.tx.commitAction.mock.calls[0]![0] as CommitActionInput;
    expect(commit.content.title).toEqual({ en: "Review assumptions", zhTw: "審查假設" });
    for (const locked of [
      ...state.record.content.mandatoryStatements,
      ...state.record.content.warnings,
    ]) {
      expect(commit.content.rationale.en).toContain(locked.text.en);
      expect(commit.content.rationale.zhTw).toContain(locked.text.zhTw);
    }
    expect(commit.auditPayload).toMatchObject({
      original: { titleKey: "VALIDATE" },
      final: { titleKey: "REVIEW" },
      actor: { membershipId: state.actor.membershipId },
      idempotencyKey: KEY,
      result: "SUCCESS",
    });
  });

  it.each([false, undefined])(
    "does not commit when explicit confirmation is %s",
    async (confirmation) => {
      const state = setup();
      expect(
        await state.service.confirm(
          state.actor,
          command({ confirmation: confirmation as boolean }),
        ),
      ).toMatchObject({
        kind: "VALIDATION_FAILED",
        fieldErrors: { confirmation: "CONFIRMATION_REQUIRED" },
      });
      expect(currentMaterial).not.toHaveBeenCalled();
      expect(state.tx.commitAction).not.toHaveBeenCalled();
    },
  );

  it("expires exactly at the 30-minute boundary without resetting the proposal", async () => {
    const state = setup();
    state.clock.mockReturnValue(new Date(state.record.expiresAt));
    expect(await state.service.confirm(state.actor, command())).toMatchObject({
      kind: "PROPOSAL_EXPIRED",
    });
    expect(await state.service.reopenProposal(state.actor, "proposal-one", "en")).toMatchObject({
      kind: "PROPOSAL_EXPIRED",
    });
    expect(state.tx.persistProposal).not.toHaveBeenCalled();
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it("revalidates the due date when the organization has crossed midnight since preparation", async () => {
    const state = setup();
    state.clock.mockReturnValue(new Date("2026-11-15T16:00:00Z"));
    expect(
      await state.service.confirm(state.actor, command({ dueDate: "2026-11-15" })),
    ).toMatchObject({
      kind: "VALIDATION_FAILED",
      fieldErrors: { dueDate: "INVALID_DUE_DATE" },
      datePolicy: {
        minDueDate: "2026-11-16",
        maxDueDate: "2027-11-16",
        datePolicyEvaluatedAt: "2026-11-15T16:00:00.000Z",
        nextDatePolicyBoundaryAt: "2026-11-16T16:00:00.000Z",
      },
    });
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it.each([
    "project",
    "comparisonSource",
    "comparisonInput",
    "comparisonPermission",
    "comparisonResult",
    "economicsSource",
    "economicsInput",
    "economicsPermission",
    "economicsStructural",
    "economicsResult",
    "permission",
    "evidence",
  ] as const)("rejects changed %s fingerprint", async (field) => {
    const state = setup();
    state.tx.getProposal.mockResolvedValue({
      ...state.record,
      content: {
        ...state.record.content,
        fingerprints: { ...fingerprints, [field]: "previous-value" },
      },
    });
    expect(await state.service.confirm(state.actor, command())).toMatchObject({
      kind: "STALE_COMPARISON",
    });
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it.each(["TENANT_RESTRICTED", "foreign organization", "missing reference", "outside comparison"])(
    "rejects %s evidence before reading proposal text",
    async (change) => {
      const state = setup();
      state.tx.getEvidenceScopes.mockResolvedValue(
        change === "missing reference"
          ? []
          : [
              {
                ...state.scopes[0]!,
                ...(change === "TENANT_RESTRICTED" ? { classification: "TENANT_RESTRICTED" } : {}),
                ...(change === "foreign organization" ? { organizationId: "org-foreign" } : {}),
                ...(change === "outside comparison"
                  ? { inComparison: false, comparisonRunIds: [] }
                  : {}),
              },
            ],
      );
      expect(await state.service.confirm(state.actor, command())).toMatchObject({
        kind: "EVIDENCE_UNAVAILABLE",
      });
      expect(state.tx.getProposal).not.toHaveBeenCalled();
      expect(state.tx.commitAction).not.toHaveBeenCalled();
    },
  );

  it("allows only the policy default without assign capability, rejecting alternate and cleared assignments", async () => {
    const state = setup();
    const actor = without(state.actor, "action:assign");
    state.tx.refreshActor.mockResolvedValue({
      context: actor,
      name: state.member.name,
      timezone: "Asia/Taipei",
    });
    state.tx.listMembers.mockResolvedValue([
      state.member,
      {
        ...state.member,
        key: "assignee-other",
        context: { ...state.actor, membershipId: "member-other", userId: "person-other" },
      },
    ]);
    for (const assigneeKey of ["assignee-other", "assignee-foreign", null]) {
      expect(await state.service.confirm(actor, command({ assigneeKey }))).toMatchObject({
        kind: "ASSIGNEE_UNAVAILABLE",
      });
    }
    expect(state.tx.commitAction).not.toHaveBeenCalled();
    expect(await state.service.confirm(actor, command())).toMatchObject({ kind: "CREATED" });
  });

  it("rejects a default assignee who has lost evidence access", async () => {
    const state = setup();
    state.tx.listMembers.mockResolvedValue([
      { ...state.member, context: without(state.member.context, "commercial:actual-read") },
    ]);
    expect(await state.service.confirm(state.actor, command())).toMatchObject({
      kind: "ASSIGNEE_UNAVAILABLE",
    });
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it("replays the durable result across locale, request ID, expiry, and later source changes", async () => {
    const state = setup();
    expect(await state.service.confirm(state.actor, command())).toMatchObject({ kind: "CREATED" });
    const saved = state.tx.commitAction.mock.calls[0]![0] as CommitActionInput;
    state.tx.getReceiptRecord.mockResolvedValue({
      actionId: state.action.id,
      proposedActionId: state.record.id,
      actorMembershipId: state.actor.membershipId,
      payloadFingerprint: saved.payloadFingerprint,
    });
    state.tx.findProposal.mockResolvedValue({
      ...state.record,
      status: "CONFIRMED",
      consumedAt: NOW.toISOString(),
    });
    state.clock.mockReturnValue(new Date("2027-01-01T00:00:00Z"));
    vi.mocked(currentMaterial).mockClear().mockResolvedValue({ kind: "STALE_COMPARISON" });
    const retry = { ...state.actor, requestId: "request-retry" };
    expect(
      await state.service.confirm(
        retry,
        command({ title: "檢核假設", rationale: "下次報價審查前檢核。", locale: "zh-TW" }),
      ),
    ).toMatchObject({
      kind: "IDEMPOTENT_REPLAY",
      receipt: { businessKey: "action-one", title: "檢核假設" },
    });
    expect(currentMaterial).not.toHaveBeenCalled();
    expect(state.tx.commitAction).toHaveBeenCalledTimes(1);
    expect(
      await state.service.confirm(retry, command({ title: "Review assumptions" })),
    ).toMatchObject({ kind: "IDEMPOTENCY_CONFLICT" });
    expect(
      await state.service.confirm(
        retry,
        command({ idempotencyKey: "4e33a52e-78fd-4ec9-ad1d-46613eed8942" }),
      ),
    ).toMatchObject({ kind: "PROPOSAL_ALREADY_CONSUMED" });
    expect(state.tx.commitAction).toHaveBeenCalledTimes(1);
  });
});

describe("Stage 8 current-authorized receipt and workspace reads", () => {
  it("checks a linked private document's project independently from the readable source subject", () => {
    const state = setup();
    const scope: EvidenceScope = {
      ...state.scopes[0]!,
      documentVersionId: "document-v1",
      documentClassification: "TENANT_PRIVATE",
      documentProjectId: "document-owner",
      documentProjectClassification: "TENANT_PRIVATE",
      documentProjectDeleted: false,
    };
    const subjectAssigned = {
      ...state.actor,
      assignedProjectIds: new Set(["project-one", "project-history"]),
    };
    expect(evidenceScopesAllowed(subjectAssigned, "project-one", [scope], ["reference-one"])).toBe(
      false,
    );
    const documentAssigned = {
      ...subjectAssigned,
      assignedProjectIds: new Set([...subjectAssigned.assignedProjectIds, "document-owner"]),
    };
    expect(evidenceScopesAllowed(documentAssigned, "project-one", [scope], ["reference-one"])).toBe(
      true,
    );
    expect(
      evidenceScopesAllowed(
        documentAssigned,
        "project-one",
        [{ ...scope, documentProjectClassification: "TENANT_RESTRICTED" }],
        ["reference-one"],
      ),
    ).toBe(false);
    expect(
      evidenceScopesAllowed(
        documentAssigned,
        "project-one",
        [{ ...scope, documentProjectDeleted: true }],
        ["reference-one"],
      ),
    ).toBe(false);
    expect(
      evidenceScopesAllowed(
        subjectAssigned,
        "project-one",
        [{ ...scope, documentProjectId: null, documentProjectClassification: null }],
        ["reference-one"],
      ),
    ).toBe(false);
  });

  it("rejects repeated scopes that would otherwise conceal a missing mandatory reference", () => {
    const state = setup();
    expect(
      evidenceScopesAllowed(
        state.actor,
        "project-one",
        [state.scopes[0]!, state.scopes[0]!],
        ["reference-one", "reference-missing"],
      ),
    ).toBe(false);
  });

  it("rejects document-version retargeting even when the reference and subject remain currently accessible", async () => {
    const state = setup();
    const scope = {
      ...state.scopes[0]!,
      documentVersionId: "document-v1",
      documentClassification: "DEMO_SYNTHETIC",
      documentProjectId: "project-history",
      documentProjectClassification: "DEMO_SYNTHETIC",
      documentProjectDeleted: false,
    };
    state.tx.getEvidenceScopes.mockResolvedValue([scope]);
    state.tx.getAction.mockResolvedValue({
      ...state.action,
      evidenceSnapshot: {
        sources: [
          {
            referenceId: scope.referenceId,
            subjectType: scope.subjectType,
            subjectId: scope.subjectId,
            documentVersionId: "document-v1",
          },
        ],
      },
    });
    expect(await state.service.getReceipt(state.actor, "action-one", "en")).toMatchObject({
      kind: "AVAILABLE",
    });
    state.tx.getEvidenceScopes.mockResolvedValue([{ ...scope, documentVersionId: "document-v2" }]);
    expect(await state.service.getReceipt(state.actor, "action-one", "en")).toEqual({
      kind: "ACTION_NOT_AUTHORIZED",
      requestId: state.actor.requestId,
    });
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it("shows only the eligible default when the current actor cannot browse assignees", async () => {
    const state = setup();
    const actor = without(state.actor, "action:assign");
    state.tx.refreshActor.mockResolvedValue({
      context: actor,
      name: state.member.name,
      timezone: "Asia/Taipei",
    });
    state.tx.listMembers.mockResolvedValue([
      state.member,
      {
        ...state.member,
        key: "assignee-other",
        name: { en: "Hidden candidate", zhTw: "其他人員" },
        context: { ...state.actor, userId: "person-other", membershipId: "member-other" },
      },
    ]);
    const result = await state.service.reopenProposal(actor, "proposal-one", "en");
    expect(result).toMatchObject({
      kind: "PREPARED",
      proposal: {
        canAssign: false,
        suggestedAssigneeKey: "assignee-mei",
        assignees: [{ key: "assignee-mei", displayName: "Mei" }],
      },
    });
    expect(JSON.stringify(result)).not.toContain("Hidden candidate");
    expect(state.tx.persistProposal).not.toHaveBeenCalled();
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it("reopens a bilingual immutable receipt without preparing or creating anything", async () => {
    const state = setup();
    expect(await state.service.getReceipt(state.actor, "action-one", "zh-TW")).toMatchObject({
      kind: "AVAILABLE",
      receipt: { businessKey: "action-one", title: "檢核假設", evidenceCount: 1 },
    });
    expect(currentMaterial).not.toHaveBeenCalled();
    expect(state.tx.persistProposal).not.toHaveBeenCalled();
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });

  it.each(["TENANT_RESTRICTED", "TENANT_PRIVATE", "UNKNOWN_CLASSIFICATION"])(
    "withholds stored titles and counts after source reclassification to %s",
    async (classification) => {
      const state = setup();
      state.tx.getEvidenceScopes.mockResolvedValue([{ ...state.scopes[0]!, classification }]);
      expect(await state.service.getReceipt(state.actor, "action-one", "en")).toEqual({
        kind: "ACTION_NOT_AUTHORIZED",
        requestId: state.actor.requestId,
      });
      expect(await state.service.listProjectActions(state.actor, "PRJ-ONE", "en")).toMatchObject({
        kind: "AVAILABLE",
        actions: [],
      });
      expect(state.tx.getAction).not.toHaveBeenCalled();
    },
  );

  it("rejects retargeted evidence even when its new project is readable", async () => {
    const state = setup();
    state.tx.getEvidenceScopes.mockResolvedValue([
      { ...state.scopes[0]!, subjectId: "replacement-cost-line" },
    ]);
    expect(await state.service.getReceipt(state.actor, "action-one", "en")).toEqual({
      kind: "ACTION_NOT_AUTHORIZED",
      requestId: state.actor.requestId,
    });
  });

  it("requires each source to belong to this action's comparison, not merely another listed run", async () => {
    const state = setup();
    state.tx.getEvidenceScopes.mockResolvedValue([
      { ...state.scopes[0]!, comparisonRunIds: ["comparison-other"] },
    ]);
    expect(await state.service.listProjectActions(state.actor, "PRJ-ONE", "en")).toMatchObject({
      kind: "AVAILABLE",
      actions: [],
    });
    expect(state.tx.getAction).not.toHaveBeenCalled();
  });

  it("loads current evidence scope once for a multi-action workspace list", async () => {
    const state = setup();
    state.tx.listActionMetadata.mockResolvedValue([
      state.action,
      { ...state.action, id: "action-two", businessKey: "action-two" },
    ]);
    expect(await state.service.listProjectActions(state.actor, "PRJ-ONE", "en")).toMatchObject({
      kind: "AVAILABLE",
      actions: [
        expect.objectContaining({ title: "Validate assumptions" }),
        expect.objectContaining({ title: "Validate assumptions" }),
      ],
    });
    expect(state.tx.getEvidenceScopes).toHaveBeenCalledTimes(1);
    expect(state.tx.persistProposal).not.toHaveBeenCalled();
    expect(state.tx.commitAction).not.toHaveBeenCalled();
  });
});
