import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "../../../.generated/prisma/client";
import { sha256 } from "@/modules/comparisons/application/fingerprints";
import {
  ACTION_SNAPSHOT_VERSION,
  INTERNAL_REVIEW_POLICY,
  PROPOSAL_SNAPSHOT_VERSION,
  type ActionContent,
  type ProposalContent,
} from "@/modules/internal-review/domain/contracts";
import { fullRationale } from "@/modules/internal-review/domain/proposal-policy";
import { isCapability, resolveCapabilities } from "@/modules/runtime-context/capabilities";
import type {
  Capability,
  CapabilityGrantEffect,
  RuntimeContext,
} from "@/modules/runtime-context/contracts";
import type {
  ActorRecord,
  ActionMetadata,
  ActionRecord,
  CommitActionInput,
  EvidenceScope,
  InternalReviewRepositoryPort,
  InternalReviewTransaction,
  MemberRecord,
  PersistProposal,
  ProposalMetadata,
  ProposalRecord,
  ReceiptRecord,
  ReviewProject,
  StoredRunState,
  TransactionCheckpoint,
} from "@/repositories/ports/internal-review-repository";
import {
  PrismaProjectRepository,
  type PrismaProjectReader,
} from "@/repositories/prisma/prisma-project-repository";
import {
  PrismaComparableProjectRepository,
  type PrismaComparableProjectDatabase,
} from "@/repositories/prisma/prisma-comparable-project-repository";
import {
  PrismaComparisonRunRepository,
  type PrismaComparisonRunDatabase,
} from "@/repositories/prisma/prisma-comparison-run-repository";
import {
  PrismaEconomicsObservationRepository,
  type PrismaEconomicsObservationDatabase,
} from "@/repositories/prisma/prisma-economics-observation-repository";
import {
  PrismaEconomicsEnrichmentRunRepository,
  type PrismaEconomicsEnrichmentDatabase,
} from "@/repositories/prisma/prisma-economics-enrichment-run-repository";
import {
  PrismaEvidencePanelRepository,
  type PrismaEvidencePanelDatabase,
} from "@/repositories/prisma/prisma-evidence-panel-repository";

export type InternalReviewRepositoryOptions = Readonly<{
  checkpoint?: ((step: TransactionCheckpoint) => void | Promise<void>) | undefined;
}>;
const SOURCE_LOCKS = `LOCK TABLE "Organization", "Person", "Membership", "MembershipCapabilityGrant", "DemoSession", "ProjectAssignment", "Project", "ProjectScope", "ProjectMaterial", "Material", "ProjectSupplier", "Supplier", "Quote", "QuoteVersion", "QuoteSection", "QuoteItem", "ForecastCostVersion", "ForecastCostLine", "ProjectCostVersion", "CostLine", "SupplierOffer", "SupplierOfferItem", "Document", "DocumentVersion", "EvidenceReference", "EvidenceConflict", "IntelligenceRun", "ComparisonRun", "ComparisonCandidate", "ComparisonFactor", "ComparisonClaim", "EconomicsEnrichmentRun", "EconomicsObservationDecision" IN SHARE MODE`;
const memberSelect = {
  id: true,
  organizationId: true,
  active: true,
  role: true,
  personId: true,
  person: {
    select: { id: true, organizationId: true, active: true, nameEn: true, nameZhTw: true },
  },
  capabilityGrants: { select: { organizationId: true, capability: true, effect: true } },
  assignments: {
    select: { organizationId: true, projectId: true, canReadActuals: true, canCreateAction: true },
  },
} as const;
type MembershipRow = Prisma.MembershipGetPayload<{ select: typeof memberSelect }>;
const proposalSelect = {
  id: true,
  organizationId: true,
  businessKey: true,
  projectId: true,
  comparisonRunId: true,
  enrichmentRunId: true,
  preparedByMembershipId: true,
  status: true,
  expiresAt: true,
  consumedAt: true,
  confirmationKey: true,
  suggestedAssigneeMembershipId: true,
  suggestedDueDate: true,
  evidenceReferenceIds: true,
} as const;
type ProposalRow = Prisma.ProposedActionGetPayload<{ select: typeof proposalSelect }>;
const actionSelect = {
  id: true,
  businessKey: true,
  projectId: true,
  proposedActionId: true,
  comparisonRunId: true,
  enrichmentRunId: true,
  evidenceReferenceIds: true,
} as const;
type ActionRow = Prisma.ActionGetPayload<{ select: typeof actionSelect }>;
function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
function date(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}
function memberContext(row: MembershipRow, seed: RuntimeContext): RuntimeContext | null {
  if (
    !row.active ||
    !row.person.active ||
    row.organizationId !== seed.organizationId ||
    row.person.organizationId !== seed.organizationId ||
    row.personId !== row.person.id ||
    row.capabilityGrants.some(
      (grant) => grant.organizationId !== seed.organizationId || !isCapability(grant.capability),
    ) ||
    row.assignments.some((assignment) => assignment.organizationId !== seed.organizationId)
  )
    return null;
  const assignments = new Map(
    row.assignments.map((assignment) => [
      assignment.projectId,
      {
        projectId: assignment.projectId,
        canReadActuals: assignment.canReadActuals,
        canCreateAction: assignment.canCreateAction,
      },
    ]),
  );
  return {
    ...seed,
    userId: row.personId,
    membershipId: row.id,
    organizationId: row.organizationId,
    role: row.role,
    capabilities: resolveCapabilities(
      row.role,
      row.capabilityGrants.map((grant) => ({
        capability: grant.capability as Capability,
        effect: grant.effect as CapabilityGrantEffect,
      })),
    ),
    assignedProjectIds: new Set(assignments.keys()),
    projectAssignments: assignments,
  };
}
function proposalMetadata(row: ProposalRow): ProposalMetadata | null {
  if (
    !row.businessKey ||
    !row.enrichmentRunId ||
    !row.preparedByMembershipId ||
    !row.confirmationKey ||
    !row.expiresAt
  )
    return null;
  return {
    id: row.id,
    businessKey: row.businessKey,
    projectId: row.projectId,
    comparisonRunId: row.comparisonRunId,
    enrichmentRunId: row.enrichmentRunId,
    preparedByMembershipId: row.preparedByMembershipId,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
    consumedAt: row.consumedAt?.toISOString() ?? null,
    confirmationKey: row.confirmationKey,
    suggestedAssigneeMembershipId: row.suggestedAssigneeMembershipId,
    suggestedDueDate: date(row.suggestedDueDate),
    evidenceReferenceIds: row.evidenceReferenceIds,
  };
}
function actionMetadata(row: ActionRow): ActionMetadata | null {
  if (!row.businessKey || !row.proposedActionId || !row.enrichmentRunId) return null;
  return {
    ...row,
    businessKey: row.businessKey,
    proposedActionId: row.proposedActionId,
    enrichmentRunId: row.enrichmentRunId,
  };
}

class Transaction implements InternalReviewTransaction {
  readonly projects;
  readonly candidates;
  readonly comparisons;
  readonly observations;
  readonly economics;
  readonly evidence;
  constructor(
    private readonly database: Prisma.TransactionClient,
    private readonly options: InternalReviewRepositoryOptions,
  ) {
    this.projects = new PrismaProjectRepository(database as unknown as PrismaProjectReader);
    this.candidates = new PrismaComparableProjectRepository(
      database as unknown as PrismaComparableProjectDatabase,
    );
    this.comparisons = new PrismaComparisonRunRepository(
      database as unknown as PrismaComparisonRunDatabase,
    );
    this.observations = new PrismaEconomicsObservationRepository(
      database as unknown as PrismaEconomicsObservationDatabase,
    );
    this.economics = new PrismaEconomicsEnrichmentRunRepository(
      database as unknown as PrismaEconomicsEnrichmentDatabase,
    );
    this.evidence = new PrismaEvidencePanelRepository(
      database as unknown as PrismaEvidencePanelDatabase,
    );
  }
  async refreshActor(seed: RuntimeContext, now: Date): Promise<ActorRecord | null> {
    if (!seed.sessionId) return null;
    if (seed.identityKind === "real") {
      await this.database.$executeRawUnsafe(
        'LOCK TABLE "AuthSession", "AuthUser", "IdentityLink" IN SHARE MODE',
      );
      const real = await this.database.authSession.findFirst({
        where: {
          id: seed.sessionId,
          expiresAt: { gt: now },
          createdAt: { gt: new Date(now.getTime() - 30 * 86400_000) },
          user: {
            emailVerified: true,
            identityLinks: { some: { organizationId: seed.organizationId, personId: seed.userId } },
          },
        },
      });
      if (real) {
        if (real.selectedMembershipId && real.selectedMembershipId !== seed.membershipId)
          return null;
        const membership = await this.database.membership.findFirst({
          where: {
            id: seed.membershipId,
            organizationId: seed.organizationId,
            personId: seed.userId,
            invitationStatus: "JOINED",
          },
          select: memberSelect,
        });
        const organization = await this.database.organization.findUnique({
          where: { id: seed.organizationId },
          select: { timezone: true },
        });
        const context = membership ? memberContext(membership, seed) : null;
        return context && membership && organization
          ? {
              context,
              name: { en: membership.person.nameEn, zhTw: membership.person.nameZhTw },
              timezone: organization.timezone,
            }
          : null;
      }
      return null;
    }
    const row = await this.database.demoSession.findFirst({
      where: {
        id: seed.sessionId,
        organizationId: seed.organizationId,
        membershipId: seed.membershipId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        organization: { select: { dataClassification: true, timezone: true } },
        membership: { select: memberSelect },
      },
    });
    if (
      !row ||
      row.organization.dataClassification !== "DEMO_SYNTHETIC" ||
      row.membership.personId !== seed.userId
    )
      return null;
    const context = memberContext(row.membership, seed);
    return context
      ? {
          context,
          name: { en: row.membership.person.nameEn, zhTw: row.membership.person.nameZhTw },
          timezone: row.organization.timezone,
        }
      : null;
  }
  async getProject(context: RuntimeContext, projectKeyOrId: string): Promise<ReviewProject | null> {
    if (!context.capabilities.has("project:read")) return null;
    const row = await this.database.project.findFirst({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        OR: [{ id: projectKeyOrId }, { businessKey: projectKeyOrId }],
        ...(context.role === "ORGANIZATION_ADMIN"
          ? {}
          : { id: { in: [...(context.assignedProjectIds ?? [])] } }),
      },
      select: {
        id: true,
        organizationId: true,
        businessKey: true,
        nameEn: true,
        nameZhTw: true,
        status: true,
        stage: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
    return row
      ? {
          id: row.id,
          organizationId: row.organizationId,
          businessKey: row.businessKey,
          name: { en: row.nameEn, zhTw: row.nameZhTw },
          status: row.status,
          stage: row.stage,
          updatedAt: row.updatedAt.toISOString(),
          deletedAt: row.deletedAt?.toISOString() ?? null,
        }
      : null;
  }
  async getRunState(
    context: RuntimeContext,
    projectId: string,
    comparisonRunId: string,
    enrichmentRunId: string,
  ): Promise<StoredRunState | null> {
    const comparison = await this.database.comparisonRun.findFirst({
      where: {
        id: comparisonRunId,
        organizationId: context.organizationId,
        activeProjectId: projectId,
      },
      select: {
        id: true,
        activeProjectId: true,
        activeQuoteVersionId: true,
        activeQuoteVersion: { select: { validUntil: true, organizationId: true } },
        policyVersion: true,
        calculationVersion: true,
        inputFingerprint: true,
        status: true,
        resultSnapshot: true,
        intelligenceRun: {
          select: { organizationId: true, projectId: true, activeContextSnapshot: true },
        },
      },
    });
    if (!comparison) return null;
    const economics = await this.database.economicsEnrichmentRun.findFirst({
      where: {
        id: enrichmentRunId,
        organizationId: context.organizationId,
        activeProjectId: projectId,
        comparisonRunId,
      },
      select: {
        id: true,
        activeProjectId: true,
        comparisonRunId: true,
        status: true,
        authorityPolicyVersion: true,
        calculationVersion: true,
        sourceFingerprint: true,
        inputFingerprint: true,
        permissionFingerprint: true,
        structuralResultFingerprint: true,
        resultSnapshot: true,
      },
    });
    if (!economics) return null;
    const stage4 = await this.comparisons.getAuthorizedResult(context, comparisonRunId);
    const stage5 = await this.economics.getAuthorizedResult(context, enrichmentRunId);
    if (!stage4 || !stage5) return null;
    return {
      comparison: {
        ...comparison,
        snapshot: comparison.resultSnapshot,
        actorSnapshot: comparison.intelligenceRun.activeContextSnapshot,
        intelligenceOrganizationId: comparison.intelligenceRun.organizationId,
        intelligenceProjectId: comparison.intelligenceRun.projectId,
        activeQuoteValidUntil: date(comparison.activeQuoteVersion?.validUntil ?? null),
      },
      economics: { ...economics, snapshot: economics.resultSnapshot },
      stage4,
      stage5,
    };
  }
  async listMembers(context: RuntimeContext): Promise<readonly MemberRecord[]> {
    const rows = await this.database.membership.findMany({
      where: {
        organizationId: context.organizationId,
        active: true,
        person: { organizationId: context.organizationId, active: true },
        role: { not: "VIEWER" },
      },
      orderBy: { id: "asc" },
      take: 100,
      select: memberSelect,
    });
    return rows.flatMap((row) => {
      const member = memberContext(row, context);
      return member
        ? [
            {
              context: member,
              name: { en: row.person.nameEn, zhTw: row.person.nameZhTw },
              key: `assignee_${sha256({ organizationId: context.organizationId, membershipId: row.id }).slice(0, 32)}`,
            },
          ]
        : [];
    });
  }
  async getEvidenceScopes(
    context: RuntimeContext,
    comparisonRunId: string | readonly string[],
    references: readonly string[],
  ): Promise<readonly EvidenceScope[]> {
    if (
      !context.capabilities.has("evidence:read") ||
      references.length === 0 ||
      references.length > 2500
    )
      return [];
    const runIds = typeof comparisonRunId === "string" ? [comparisonRunId] : comparisonRunId;
    const runs = await this.database.comparisonRun.findMany({
      where: { organizationId: context.organizationId, id: { in: [...runIds] } },
      orderBy: { id: "asc" },
      select: {
        id: true,
        activeProjectId: true,
        candidates: {
          where: {
            organizationId: context.organizationId,
            candidateProject: { organizationId: context.organizationId },
          },
          select: { candidateProjectId: true },
        },
      },
    });
    const rows = await this.database.evidenceReference.findMany({
      where: { organizationId: context.organizationId, id: { in: [...references] } },
      orderBy: { id: "asc" },
      select: {
        id: true,
        organizationId: true,
        subjectType: true,
        subjectId: true,
        dataClassification: true,
        observationType: true,
        documentVersionId: true,
        documentVersion: {
          select: {
            organizationId: true,
            checksum: true,
            authorityState: true,
            supersededById: true,
            document: {
              select: {
                organizationId: true,
                projectId: true,
                dataClassification: true,
                project: {
                  select: { organizationId: true, dataClassification: true, deletedAt: true },
                },
              },
            },
          },
        },
      },
    });
    const groups = new Map<string, string[]>();
    for (const row of rows)
      groups.set(row.subjectType, [...(groups.get(row.subjectType) ?? []), row.subjectId]);
    const owners = new Map<string, Record<string, unknown>>();
    const project = {
      select: { id: true, organizationId: true, dataClassification: true, deletedAt: true },
    };
    const specifications: Record<
      string,
      { model: string; select: object; path: readonly string[] }
    > = {
      PROJECT: { model: "project", select: project.select, path: [] },
      PROJECT_SCOPE: { model: "projectScope", select: { id: true, project }, path: ["project"] },
      DOCUMENT_VERSION: {
        model: "documentVersion",
        select: { id: true, document: { select: { project } } },
        path: ["document", "project"],
      },
      QUOTE_VERSION: {
        model: "quoteVersion",
        select: { id: true, quote: { select: { project } } },
        path: ["quote", "project"],
      },
      QUOTE_ITEM: {
        model: "quoteItem",
        select: { id: true, quoteVersion: { select: { quote: { select: { project } } } } },
        path: ["quoteVersion", "quote", "project"],
      },
      FORECAST_COST_VERSION: {
        model: "forecastCostVersion",
        select: { id: true, project },
        path: ["project"],
      },
      FORECAST_COST_LINE: {
        model: "forecastCostLine",
        select: { id: true, forecastCostVersion: { select: { project } } },
        path: ["forecastCostVersion", "project"],
      },
      PROJECT_COST_VERSION: {
        model: "projectCostVersion",
        select: { id: true, project },
        path: ["project"],
      },
      COST_LINE: {
        model: "costLine",
        select: { id: true, projectCostVersion: { select: { project } } },
        path: ["projectCostVersion", "project"],
      },
      SUPPLIER_OFFER: { model: "supplierOffer", select: { id: true, project }, path: ["project"] },
      SUPPLIER_OFFER_ITEM: {
        model: "supplierOfferItem",
        select: { id: true, supplierOffer: { select: { project } } },
        path: ["supplierOffer", "project"],
      },
    };
    const readers = this.database as unknown as Record<
      string,
      { findMany(args: unknown): Promise<unknown[]> }
    >;
    for (const [type, ids] of groups) {
      const spec = specifications[type];
      if (!spec) continue;
      const found = await readers[spec.model]!.findMany({
        where: { organizationId: context.organizationId, id: { in: ids } },
        select: spec.select,
      });
      for (const value of found) {
        const row = object(value);
        let owner = row;
        for (const key of spec.path) owner = object(owner[key]);
        owners.set(`${type}:${String(row.id)}`, owner);
      }
    }
    return rows.flatMap((row) => {
      const owner = owners.get(`${row.subjectType}:${row.subjectId}`);
      if (
        !owner ||
        typeof owner.id !== "string" ||
        owner.organizationId !== context.organizationId ||
        typeof owner.dataClassification !== "string"
      )
        return [];
      const matchingRuns = runs
        .filter(
          (run) =>
            run.activeProjectId === owner.id ||
            run.candidates.some((candidate) => candidate.candidateProjectId === owner.id),
        )
        .map((run) => run.id);
      return [
        {
          referenceId: row.id,
          organizationId: row.organizationId,
          subjectType: row.subjectType,
          subjectId: row.subjectId,
          classification: row.dataClassification,
          observationType: row.observationType,
          projectId: owner.id,
          projectClassification: owner.dataClassification,
          projectDeleted: Boolean(owner.deletedAt),
          inComparison: matchingRuns.length > 0,
          comparisonRunIds: matchingRuns,
          documentChecksum: row.documentVersion?.checksum ?? null,
          documentVersionId: row.documentVersionId,
          documentClassification:
            row.documentVersion &&
            (row.documentVersion.organizationId !== context.organizationId ||
              row.documentVersion.document.organizationId !== context.organizationId ||
              (row.documentVersion.document.project &&
                row.documentVersion.document.project.organizationId !== context.organizationId))
              ? "TENANT_RESTRICTED"
              : (row.documentVersion?.document.dataClassification ?? null),
          documentAuthority: row.documentVersion?.authorityState ?? null,
          documentSuperseded: Boolean(row.documentVersion?.supersededById),
          documentProjectId: row.documentVersion?.document.projectId ?? null,
          documentProjectClassification:
            row.documentVersion?.document.project?.dataClassification ?? null,
          documentProjectDeleted: Boolean(row.documentVersion?.document.project?.deletedAt),
        },
      ];
    });
  }
  async findProposal(
    context: RuntimeContext,
    key: string,
    lock: boolean,
  ): Promise<ProposalMetadata | null> {
    if (lock)
      await this.database
        .$queryRaw`SELECT "id" FROM "ProposedAction" WHERE "organizationId" = ${context.organizationId} AND "businessKey" = ${key} AND "preparedByMembershipId" = ${context.membershipId} FOR UPDATE`;
    const row = await this.database.proposedAction.findFirst({
      where: {
        organizationId: context.organizationId,
        businessKey: key,
        preparedByMembershipId: context.membershipId,
        snapshotVersion: PROPOSAL_SNAPSHOT_VERSION,
      },
      select: proposalSelect,
    });
    return row ? proposalMetadata(row) : null;
  }
  async getProposal(
    context: RuntimeContext,
    metadata: ProposalMetadata,
  ): Promise<ProposalRecord | null> {
    const row = await this.database.proposedAction.findFirst({
      where: {
        id: metadata.id,
        organizationId: context.organizationId,
        preparedByMembershipId: context.membershipId,
        projectId: metadata.projectId,
        comparisonRunId: metadata.comparisonRunId,
        enrichmentRunId: metadata.enrichmentRunId,
        snapshotVersion: PROPOSAL_SNAPSHOT_VERSION,
      },
      select: { contentSnapshot: true },
    });
    if (!row || object(row.contentSnapshot).version !== PROPOSAL_SNAPSHOT_VERSION) return null;
    return { ...metadata, content: row.contentSnapshot as unknown as ProposalContent };
  }
  async persistProposal(input: PersistProposal): Promise<ProposalMetadata> {
    // Serialize only repeated preparation of this intent; never UPDATE an immutable proposal.
    await this.database
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${input.organizationId}:${input.preparationKey}`}, 0))`;
    const existing = await this.database.proposedAction.findUnique({
      where: {
        organizationId_preparationKey: {
          organizationId: input.organizationId,
          preparationKey: input.preparationKey,
        },
      },
      select: proposalSelect,
    });
    if (existing) {
      const metadata = proposalMetadata(existing);
      if (!metadata) throw new Error("PROPOSAL_STORAGE_INVALID");
      return metadata;
    }
    const row = await this.database.proposedAction.create({
      data: {
        id: input.id,
        businessKey: input.businessKey,
        organizationId: input.organizationId,
        projectId: input.projectId,
        comparisonRunId: input.comparisonRunId,
        enrichmentRunId: input.enrichmentRunId,
        preparedByMembershipId: input.preparedByMembershipId,
        preparationKey: input.preparationKey,
        confirmationKey: input.confirmationKey,
        snapshotVersion: PROPOSAL_SNAPSHOT_VERSION,
        contentSnapshot: json(input.content),
        type: "INTERNAL_REVIEW",
        status: "PREPARED",
        title: input.content.titleOptions[0]!.text.en,
        rationale: fullRationale(input.content, input.content.rationaleOptions[0]!.text).en,
        suggestedAssigneeId: input.suggestedAssigneePersonId,
        suggestedAssigneeMembershipId: input.suggestedAssigneeMembershipId,
        suggestedDueDate: new Date(`${input.suggestedDueDate}T00:00:00Z`),
        evidenceReferenceIds: [...input.evidenceReferenceIds],
        policyVersion: INTERNAL_REVIEW_POLICY,
        createdBy: "SYSTEM",
        createdAt: new Date(input.createdAt),
        updatedAt: new Date(input.createdAt),
        expiresAt: new Date(input.expiresAt),
      },
      select: proposalSelect,
    });
    const metadata = proposalMetadata(row);
    if (!metadata) throw new Error("PROPOSAL_STORAGE_INVALID");
    return metadata;
  }
  async getReceiptRecord(
    context: RuntimeContext,
    idempotencyKey: string,
  ): Promise<ReceiptRecord | null> {
    return this.database.internalReviewReceipt.findFirst({
      where: { organizationId: context.organizationId, idempotencyKey },
      select: {
        actionId: true,
        payloadFingerprint: true,
        proposedActionId: true,
        actorMembershipId: true,
      },
    });
  }
  async findAction(context: RuntimeContext, keyOrId: string): Promise<ActionMetadata | null> {
    const row = await this.database.action.findFirst({
      where: {
        organizationId: context.organizationId,
        snapshotVersion: ACTION_SNAPSHOT_VERSION,
        OR: [{ businessKey: keyOrId }, { id: keyOrId }],
      },
      select: actionSelect,
    });
    return row ? actionMetadata(row) : null;
  }
  async listActionMetadata(
    context: RuntimeContext,
    projectId: string,
  ): Promise<readonly ActionMetadata[]> {
    const rows = await this.database.action.findMany({
      where: {
        organizationId: context.organizationId,
        projectId,
        snapshotVersion: ACTION_SNAPSHOT_VERSION,
        status: "OPEN",
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 25,
      select: actionSelect,
    });
    return rows.flatMap((row) => {
      const metadata = actionMetadata(row);
      return metadata ? [metadata] : [];
    });
  }
  async getAction(context: RuntimeContext, metadata: ActionMetadata): Promise<ActionRecord | null> {
    const row = await this.database.action.findFirst({
      where: {
        id: metadata.id,
        organizationId: context.organizationId,
        projectId: metadata.projectId,
        snapshotVersion: ACTION_SNAPSHOT_VERSION,
      },
      select: {
        contentSnapshot: true,
        evidenceSnapshot: true,
        dueDate: true,
        status: true,
        createdAt: true,
      },
    });
    if (!row || object(row.contentSnapshot).version !== ACTION_SNAPSHOT_VERSION) return null;
    return {
      ...metadata,
      content: row.contentSnapshot as unknown as ActionContent,
      evidenceSnapshot: row.evidenceSnapshot,
      dueDate: date(row.dueDate),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
  async commitAction(input: CommitActionInput): Promise<void> {
    const { context, proposal } = input;
    await this.database.action.create({
      data: {
        id: input.id,
        businessKey: input.businessKey,
        organizationId: context.organizationId,
        projectId: input.projectId,
        comparisonRunId: proposal.comparisonRunId,
        enrichmentRunId: proposal.enrichmentRunId,
        proposedActionId: proposal.id,
        type: "INTERNAL_REVIEW",
        title: input.content.title.en,
        rationale: input.content.rationale.en,
        assigneePersonId: input.assigneePersonId,
        assigneeMembershipId: input.assigneeMembershipId,
        dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00Z`) : null,
        status: "OPEN",
        evidenceReferenceIds: [...proposal.evidenceReferenceIds],
        createdByUserId: context.userId,
        createdByMembershipId: context.membershipId,
        snapshotVersion: ACTION_SNAPSHOT_VERSION,
        contentSnapshot: json(input.content),
        evidenceSnapshot: json(input.evidenceSnapshot),
        createdAt: new Date(input.createdAt),
        updatedAt: new Date(input.createdAt),
      },
    });
    await this.options.checkpoint?.("AFTER_ACTION");
    await this.options.checkpoint?.("AFTER_EVIDENCE");
    await this.database.auditEvent.create({
      data: {
        id: `audit_${randomUUID()}`,
        organizationId: context.organizationId,
        actorMembershipId: context.membershipId,
        comparisonRunId: proposal.comparisonRunId,
        proposedActionId: proposal.id,
        actionId: input.id,
        eventType: "INTERNAL_REVIEW_CREATED",
        requestId: context.requestId,
        payload: json(input.auditPayload),
        result: "SUCCESS",
        createdAt: new Date(input.createdAt),
      },
    });
    await this.options.checkpoint?.("AFTER_AUDIT");
    const consumed = await this.database.proposedAction.updateMany({
      where: {
        id: proposal.id,
        organizationId: context.organizationId,
        preparedByMembershipId: context.membershipId,
        status: "PREPARED",
        consumedAt: null,
      },
      data: {
        status: "CONFIRMED",
        consumedAt: new Date(input.createdAt),
        updatedAt: new Date(input.createdAt),
      },
    });
    if (consumed.count !== 1) throw new Error("PROPOSAL_CONSUMED");
    await this.options.checkpoint?.("AFTER_CONSUMPTION");
    await this.database.internalReviewReceipt.create({
      data: {
        id: `receipt_${randomUUID()}`,
        organizationId: context.organizationId,
        projectId: input.projectId,
        proposedActionId: proposal.id,
        actionId: input.id,
        actorMembershipId: context.membershipId,
        comparisonRunId: proposal.comparisonRunId,
        enrichmentRunId: proposal.enrichmentRunId,
        idempotencyKey: input.idempotencyKey,
        payloadFingerprint: input.payloadFingerprint,
        createdAt: new Date(input.createdAt),
      },
    });
    await this.options.checkpoint?.("AFTER_RECEIPT");
    await this.options.checkpoint?.("BEFORE_COMMIT");
  }
}

export class PrismaInternalReviewRepository implements InternalReviewRepositoryPort {
  constructor(
    private readonly database: PrismaClient,
    private readonly options: InternalReviewRepositoryOptions = {},
  ) {}
  async transaction<T>(work: (transaction: InternalReviewTransaction) => Promise<T>): Promise<T> {
    return this.database.$transaction(
      async (database) => {
        await database.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
        await database.$executeRawUnsafe("SET LOCAL statement_timeout = '5s'");
        await database.$executeRawUnsafe(SOURCE_LOCKS);
        return work(new Transaction(database, this.options));
      },
      { isolationLevel: "ReadCommitted", maxWait: 3_000, timeout: 10_000 },
    );
  }
}
