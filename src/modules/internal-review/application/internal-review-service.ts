import { randomUUID } from "node:crypto";
import { AuthorizationService } from "@/modules/authorization/authorization-service";
import { sha256 } from "@/modules/comparisons/application/fingerprints";
import {
  actionAccess,
  currentMaterial,
  evidenceScopesAllowed,
  preliminaryAccess,
} from "@/modules/internal-review/application/freshness";
import {
  ACTION_SNAPSHOT_VERSION,
  INTERNAL_REVIEW_POLICY,
  PROPOSAL_SNAPSHOT_VERSION,
  type ActionContent,
  type ActionListOutcome,
  type ActionReceiptDTO,
  type ConfirmationOutcome,
  type ConfirmInternalReviewInput,
  type PrepareInternalReviewInput,
  type ProposalContent,
  type ProposalOutcome,
  type ProposedActionDTO,
  type ReceiptOutcome,
  type ReturnContext,
} from "@/modules/internal-review/domain/contracts";
import {
  addCalendarDays,
  calendarDate,
  CONFIRMATION_KEY,
  dateBounds,
  findWording,
  fullRationale,
  localize,
  PROPOSAL_TTL_MS,
  proposalWording,
  SAFE_REVIEW_KEY,
  validateEdits,
} from "@/modules/internal-review/domain/proposal-policy";
import { parseEvidenceSelection } from "@/modules/evidence-panel/route-state";
import type { Locale } from "@/modules/localization/config";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  ActionMetadata,
  ActorRecord,
  EvidenceScope,
  InternalReviewRepositoryPort,
  InternalReviewTransaction,
  MemberRecord,
  ProposalRecord,
  ReviewProject,
} from "@/repositories/ports/internal-review-repository";

const authorization = new AuthorizationService();
type Trace = (event: Readonly<{ requestId: string; outcome: string }>) => void;
const validLocale = (value: unknown): value is Locale => value === "en" || value === "zh-TW";
function safeContext(
  input: PrepareInternalReviewInput,
  selected: readonly string[],
): ReturnContext {
  const proposed = input.returnContext;
  const result: ReturnContext = { selectedProjectKeys: selected };
  if (!proposed?.evidenceSelection)
    return {
      ...result,
      ...(proposed?.evidenceReturnId && SAFE_REVIEW_KEY.test(proposed.evidenceReturnId)
        ? { evidenceReturnId: proposed.evidenceReturnId }
        : {}),
    };
  const selection = proposed.evidenceSelection;
  if (
    selection.comparisonRunId !== input.comparisonRunId ||
    ("enrichmentRunId" in selection &&
      selection.enrichmentRunId &&
      selection.enrichmentRunId !== input.enrichmentRunId)
  )
    return result;
  const validated = parseEvidenceSelection({
    comparisonRunId: input.comparisonRunId,
    economicsRunId: input.enrichmentRunId,
    evidenceMode: selection.mode,
    evidenceClaimKey: "claimKey" in selection ? selection.claimKey : undefined,
    evidenceCandidateProjectKey:
      "candidateProjectKey" in selection ? selection.candidateProjectKey : undefined,
    evidenceFactorKey: "factorKey" in selection ? selection.factorKey : undefined,
    evidenceSourceKey: "sourceKey" in selection ? selection.sourceKey : undefined,
    evidenceConflictKey: "conflictKey" in selection ? selection.conflictKey : undefined,
  });
  return {
    ...result,
    ...(validated ? { evidenceSelection: validated } : {}),
    ...(proposed.evidenceReturnId && SAFE_REVIEW_KEY.test(proposed.evidenceReturnId)
      ? { evidenceReturnId: proposed.evidenceReturnId }
      : {}),
  };
}
function eligibleMembers(
  members: readonly MemberRecord[],
  projectId: string,
  scopes: readonly EvidenceScope[],
  references: readonly string[],
): readonly MemberRecord[] {
  return members
    .filter(
      (member) =>
        actionAccess(member.context, projectId) &&
        evidenceScopesAllowed(member.context, projectId, scopes, references),
    )
    .sort((a, b) => a.key.localeCompare(b.key));
}
function proposalView(
  record: ProposalRecord,
  members: readonly MemberRecord[],
  context: RuntimeContext,
  now: Date,
  locale: Locale,
): ProposedActionDTO {
  const content = record.content;
  const canAssign = authorization.canAssignInternalReview(context, record.projectId).allowed;
  const defaultMember = members.find(
    (member) => member.context.membershipId === record.suggestedAssigneeMembershipId,
  );
  const exposed = canAssign ? members : defaultMember ? [defaultMember] : [];
  const bounds = dateBounds(now, content.timezone);
  return {
    version: "internal-review-proposal.v1",
    businessKey: record.businessKey,
    project: {
      projectKey: content.project.projectKey,
      name: localize(content.project.name, locale),
    },
    comparisonRunId: record.comparisonRunId,
    enrichmentRunId: record.enrichmentRunId,
    locale,
    timezone: content.timezone,
    titleOptions: content.titleOptions.map((option) => ({
      key: option.key,
      text: localize(option.text, locale),
    })),
    rationaleOptions: content.rationaleOptions.map((option) => ({
      key: option.key,
      text: localize(option.text, locale),
    })),
    title: localize(content.titleOptions[0]!.text, locale),
    rationale: localize(content.rationaleOptions[0]!.text, locale),
    titleKey: content.titleOptions[0]!.key,
    rationaleKey: content.rationaleOptions[0]!.key,
    mandatoryStatements: content.mandatoryStatements.map((statement) => ({
      key: statement.key,
      text: localize(statement.text, locale),
      ...(statement.claimKey ? { claimKey: statement.claimKey } : {}),
    })),
    warnings: content.warnings.map((warning) => ({
      key: warning.key,
      text: localize(warning.text, locale),
    })),
    assignees: exposed.map((member) => ({
      key: member.key,
      displayName: localize(member.name, locale),
    })),
    suggestedAssigneeKey: defaultMember?.key ?? null,
    canAssign,
    suggestedDueDate: record.suggestedDueDate,
    minDueDate: bounds.min,
    maxDueDate: bounds.max,
    expiresAt: record.expiresAt,
    idempotencyKey: record.confirmationKey,
    evidenceLinks: content.mandatoryStatements
      .filter((statement) => statement.claimKey)
      .map((statement) => ({
        claimKey: statement.claimKey!,
        label: localize(statement.text, locale),
      })),
    returnContext: content.returnContext,
  };
}

export class InternalReviewService {
  constructor(
    private readonly repository: InternalReviewRepositoryPort,
    private readonly clock: () => Date = () => new Date(),
    private readonly trace: Trace = () => undefined,
  ) {}

  private failure<T extends string>(
    context: RuntimeContext,
    kind: T,
  ): Readonly<{ kind: T; requestId: string }> {
    this.trace({ requestId: context.requestId, outcome: kind });
    return { kind, requestId: context.requestId };
  }
  private async actor(
    tx: InternalReviewTransaction,
    seed: RuntimeContext,
  ): Promise<ActorRecord | null> {
    if (!preliminaryAccess(seed)) return null;
    const actor = await tx.refreshActor(seed, this.clock());
    return actor && preliminaryAccess(actor.context) ? actor : null;
  }

  async canPrepare(seed: RuntimeContext, projectKey: string): Promise<boolean> {
    if (!SAFE_REVIEW_KEY.test(projectKey) || !preliminaryAccess(seed)) return false;
    try {
      return await this.repository.transaction(async (tx) => {
        const actor = await this.actor(tx, seed);
        if (!actor) return false;
        const project = await tx.getProject(actor.context, projectKey);
        return Boolean(
          project &&
          project.status === "ACTIVE" &&
          !project.deletedAt &&
          actionAccess(actor.context, project.id),
        );
      });
    } catch {
      return false;
    }
  }

  async prepare(seed: RuntimeContext, input: PrepareInternalReviewInput): Promise<ProposalOutcome> {
    if (!preliminaryAccess(seed)) return this.failure(seed, "PROPOSAL_NOT_AUTHORIZED");
    if (
      !validLocale(input.locale) ||
      ![input.projectKey, input.comparisonRunId, input.enrichmentRunId].every(
        (key) => typeof key === "string" && SAFE_REVIEW_KEY.test(key),
      )
    )
      return this.failure(seed, "PROPOSAL_UNAVAILABLE");
    try {
      return await this.repository.transaction(async (tx) => {
        const actor = await this.actor(tx, seed);
        if (!actor) return this.failure(seed, "PROPOSAL_NOT_AUTHORIZED");
        const context = actor.context;
        const project = await tx.getProject(context, input.projectKey);
        if (!project || project.deletedAt || !actionAccess(context, project.id))
          return this.failure(seed, "PROPOSAL_UNAVAILABLE");
        if (project.status !== "ACTIVE") return this.failure(seed, "PROPOSAL_STALE");
        const now = this.clock();
        const current = await currentMaterial(
          tx,
          context,
          project,
          input.comparisonRunId,
          input.enrichmentRunId,
          now,
          actor.timezone,
        );
        if (current.kind !== "READY")
          return this.failure(
            seed,
            current.kind === "STALE_COMPARISON" ? "PROPOSAL_STALE" : "PROPOSAL_UNAVAILABLE",
          );
        const material = current.material;
        const members = eligibleMembers(
          await tx.listMembers(context),
          project.id,
          material.scopes,
          material.references,
        );
        const assignee =
          members.find((member) => member.context.role === "FINANCIAL_REVIEWER") ??
          members.find((member) => member.context.membershipId === context.membershipId);
        const wording = proposalWording(
          material.runs.stage4,
          material.runs.stage5,
          material.claims,
        );
        const content: ProposalContent = {
          version: PROPOSAL_SNAPSHOT_VERSION,
          policyVersion: INTERNAL_REVIEW_POLICY,
          project: { projectKey: project.businessKey, name: project.name },
          comparisonRunId: input.comparisonRunId,
          enrichmentRunId: input.enrichmentRunId,
          actorUserId: context.userId,
          actorMembershipId: context.membershipId,
          ...wording,
          claims: material.claims,
          evidence: material.evidence,
          fingerprints: material.fingerprints,
          policyVersions: {
            action: INTERNAL_REVIEW_POLICY,
            eligibility: material.runs.stage4.run.eligibilityPolicyVersion,
            comparison: material.runs.stage4.run.policyVersion,
            comparisonCalculation: material.runs.stage4.run.calculationVersion,
            economics: material.runs.stage5.run.calculationVersion,
            authority: material.runs.stage5.run.authorityPolicyVersion,
          },
          returnContext: safeContext(input, material.runs.stage5.selectedProjectKeys),
          locale: input.locale,
          timezone: actor.timezone,
        };
        const metadata = await tx.persistProposal({
          id: `proposal_${randomUUID()}`,
          businessKey: `proposal_${randomUUID()}`,
          organizationId: context.organizationId,
          projectId: project.id,
          comparisonRunId: input.comparisonRunId,
          enrichmentRunId: input.enrichmentRunId,
          preparedByMembershipId: context.membershipId,
          preparationKey: sha256({
            organizationId: context.organizationId,
            membershipId: context.membershipId,
            comparisonRunId: input.comparisonRunId,
            enrichmentRunId: input.enrichmentRunId,
            policy: INTERNAL_REVIEW_POLICY,
            fingerprints: material.fingerprints,
          }),
          confirmationKey: randomUUID(),
          content,
          suggestedAssigneeMembershipId: assignee?.context.membershipId ?? null,
          suggestedAssigneePersonId: assignee?.context.userId ?? null,
          suggestedDueDate: addCalendarDays(calendarDate(now, actor.timezone), 7),
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + PROPOSAL_TTL_MS).toISOString(),
          evidenceReferenceIds: material.references,
        });
        if (metadata.status !== "PREPARED") return this.failure(seed, "PROPOSAL_UNAVAILABLE");
        if (new Date(metadata.expiresAt).getTime() <= now.getTime())
          return this.failure(seed, "PROPOSAL_EXPIRED");
        const record = await tx.getProposal(context, metadata);
        if (!record) return this.failure(seed, "PROPOSAL_UNAVAILABLE");
        return {
          kind: "PREPARED",
          proposal: proposalView(record, members, context, now, input.locale),
        };
      });
    } catch {
      return this.failure(seed, "PROPOSAL_FAILED");
    }
  }

  async reopenProposal(
    seed: RuntimeContext,
    proposalKey: string,
    locale: Locale,
  ): Promise<ProposalOutcome> {
    if (!preliminaryAccess(seed)) return this.failure(seed, "PROPOSAL_NOT_AUTHORIZED");
    if (!SAFE_REVIEW_KEY.test(proposalKey) || !validLocale(locale))
      return this.failure(seed, "PROPOSAL_UNAVAILABLE");
    try {
      return await this.repository.transaction(async (tx) => {
        const actor = await this.actor(tx, seed);
        if (!actor) return this.failure(seed, "PROPOSAL_NOT_AUTHORIZED");
        const context = actor.context;
        const metadata = await tx.findProposal(context, proposalKey, false);
        if (!metadata) return this.failure(seed, "PROPOSAL_UNAVAILABLE");
        const project = await tx.getProject(context, metadata.projectId);
        if (!project || !actionAccess(context, project.id))
          return this.failure(seed, "PROPOSAL_UNAVAILABLE");
        const now = this.clock();
        if (metadata.status !== "PREPARED") return this.failure(seed, "PROPOSAL_UNAVAILABLE");
        if (new Date(metadata.expiresAt).getTime() <= now.getTime())
          return this.failure(seed, "PROPOSAL_EXPIRED");
        if (project.status !== "ACTIVE") return this.failure(seed, "PROPOSAL_STALE");
        const material = await currentMaterial(
          tx,
          context,
          project,
          metadata.comparisonRunId,
          metadata.enrichmentRunId,
          now,
          actor.timezone,
        );
        if (material.kind !== "READY")
          return this.failure(
            seed,
            material.kind === "STALE_COMPARISON" ? "PROPOSAL_STALE" : "PROPOSAL_UNAVAILABLE",
          );
        const record = await tx.getProposal(context, metadata);
        if (
          !record ||
          sha256(record.content.fingerprints) !== sha256(material.material.fingerprints)
        )
          return this.failure(seed, "PROPOSAL_STALE");
        const members = eligibleMembers(
          await tx.listMembers(context),
          project.id,
          material.material.scopes,
          material.material.references,
        );
        if (
          metadata.suggestedAssigneeMembershipId &&
          !members.some(
            (member) => member.context.membershipId === metadata.suggestedAssigneeMembershipId,
          )
        )
          return this.failure(seed, "PROPOSAL_UNAVAILABLE");
        return { kind: "PREPARED", proposal: proposalView(record, members, context, now, locale) };
      });
    } catch {
      return this.failure(seed, "PROPOSAL_FAILED");
    }
  }

  async confirm(
    seed: RuntimeContext,
    command: ConfirmInternalReviewInput,
  ): Promise<ConfirmationOutcome> {
    if (!preliminaryAccess(seed)) return this.failure(seed, "ACTION_NOT_AUTHORIZED");
    if (
      !command ||
      command.version !== "internal-review-command.v1" ||
      !validLocale(command.locale) ||
      typeof command.proposalKey !== "string" ||
      !SAFE_REVIEW_KEY.test(command.proposalKey) ||
      typeof command.idempotencyKey !== "string" ||
      !CONFIRMATION_KEY.test(command.idempotencyKey)
    )
      return this.failure(seed, "ACTION_NOT_AUTHORIZED");
    try {
      return await this.repository.transaction(async (tx) => {
        const actor = await this.actor(tx, seed);
        if (!actor) return this.failure(seed, "ACTION_NOT_AUTHORIZED");
        const context = actor.context;
        const metadata = await tx.findProposal(context, command.proposalKey, true);
        if (!metadata) return this.failure(seed, "ACTION_NOT_AUTHORIZED");
        const project = await tx.getProject(context, metadata.projectId);
        if (!project || !actionAccess(context, project.id))
          return this.failure(seed, "ACTION_NOT_AUTHORIZED");
        if (metadata.confirmationKey !== command.idempotencyKey)
          return this.failure(
            seed,
            metadata.status === "CONFIRMED" ? "PROPOSAL_ALREADY_CONSUMED" : "IDEMPOTENCY_CONFLICT",
          );
        const scopes = await tx.getEvidenceScopes(
          context,
          metadata.comparisonRunId,
          metadata.evidenceReferenceIds,
        );
        if (!evidenceScopesAllowed(context, project.id, scopes, metadata.evidenceReferenceIds))
          return this.failure(seed, "EVIDENCE_UNAVAILABLE");
        const record = await tx.getProposal(context, metadata);
        if (!record) return this.failure(seed, "ACTION_NOT_AUTHORIZED");
        const title = findWording(record.content.titleOptions, command.title);
        const rationale = findWording(record.content.rationaleOptions, command.rationale);
        const payload = sha256({
          proposalKey: command.proposalKey,
          actorMembershipId: context.membershipId,
          title: title?.key ?? command.title,
          rationale: rationale?.key ?? command.rationale,
          assigneeKey: command.assigneeKey || null,
          dueDate: command.dueDate || null,
          confirmation: command.confirmation === true,
        });
        const previous = await tx.getReceiptRecord(context, command.idempotencyKey);
        if (previous) {
          if (
            previous.payloadFingerprint !== payload ||
            previous.proposedActionId !== metadata.id ||
            previous.actorMembershipId !== context.membershipId
          )
            return this.failure(seed, "IDEMPOTENCY_CONFLICT");
          const action = await tx.findAction(context, previous.actionId);
          const receipt = action
            ? await this.receipt(tx, context, project, action, command.locale, scopes)
            : null;
          return receipt
            ? { kind: "IDEMPOTENT_REPLAY", receipt }
            : this.failure(seed, "ACTION_NOT_AUTHORIZED");
        }
        if (metadata.status !== "PREPARED" || metadata.consumedAt)
          return this.failure(seed, "PROPOSAL_ALREADY_CONSUMED");
        const now = this.clock();
        if (new Date(metadata.expiresAt).getTime() <= now.getTime())
          return this.failure(seed, "PROPOSAL_EXPIRED");
        if (project.status !== "ACTIVE" || record.content.policyVersion !== INTERNAL_REVIEW_POLICY)
          return this.failure(seed, "STALE_COMPARISON");
        const errors = validateEdits(record.content, command, now);
        if (Object.keys(errors).length > 0)
          return { kind: "VALIDATION_FAILED", requestId: seed.requestId, fieldErrors: errors };
        const current = await currentMaterial(
          tx,
          context,
          project,
          metadata.comparisonRunId,
          metadata.enrichmentRunId,
          now,
          actor.timezone,
        );
        if (current.kind !== "READY") return this.failure(seed, current.kind);
        if (sha256(current.material.fingerprints) !== sha256(record.content.fingerprints))
          return this.failure(seed, "STALE_COMPARISON");
        const members = eligibleMembers(
          await tx.listMembers(context),
          project.id,
          current.material.scopes,
          current.material.references,
        );
        const assignee = command.assigneeKey
          ? members.find((member) => member.key === command.assigneeKey)
          : null;
        if (command.assigneeKey && !assignee) return this.failure(seed, "ASSIGNEE_UNAVAILABLE");
        if (
          !authorization.canAssignInternalReview(context, project.id).allowed &&
          (assignee?.context.membershipId ?? null) !== metadata.suggestedAssigneeMembershipId
        )
          return this.failure(seed, "ASSIGNEE_UNAVAILABLE");
        const content: ActionContent = {
          version: ACTION_SNAPSHOT_VERSION,
          timezone: record.content.timezone,
          policyVersion: INTERNAL_REVIEW_POLICY,
          project: record.content.project,
          title: title!.text,
          rationale: fullRationale(record.content, rationale!.text),
          titleKey: title!.key,
          rationaleKey: rationale!.key,
          createdBy: actor.name,
          assignee: assignee?.name ?? null,
          comparisonRunId: metadata.comparisonRunId,
          enrichmentRunId: metadata.enrichmentRunId,
          returnContext: record.content.returnContext,
        };
        const id = `action_${randomUUID()}`;
        const businessKey = `action_${randomUUID()}`;
        const createdAt = now.toISOString();
        const evidenceSnapshot = {
          version: "internal-review-evidence-snapshot.v1",
          policyVersion: INTERNAL_REVIEW_POLICY,
          comparisonRunId: metadata.comparisonRunId,
          enrichmentRunId: metadata.enrichmentRunId,
          fingerprints: current.material.fingerprints,
          claims: current.material.claims,
          sources: current.material.evidence,
          scopes: current.material.scopes,
          evidenceReferenceIds: current.material.references,
        };
        const auditPayload = {
          version: "internal-review-audit.v1",
          actor: { userId: context.userId, membershipId: context.membershipId },
          organizationId: context.organizationId,
          projectId: project.id,
          projectKey: project.businessKey,
          proposalKey: metadata.businessKey,
          actionKey: businessKey,
          comparisonRunId: metadata.comparisonRunId,
          enrichmentRunId: metadata.enrichmentRunId,
          policyVersions: record.content.policyVersions,
          claimKeys: current.material.claims.map((claim) => claim.claimKey),
          evidenceReferenceIds: current.material.references,
          fingerprints: current.material.fingerprints,
          original: {
            title: record.content.titleOptions[0]!.text,
            rationale: fullRationale(record.content, record.content.rationaleOptions[0]!.text),
            titleKey: record.content.titleOptions[0]!.key,
            rationaleKey: record.content.rationaleOptions[0]!.key,
            assigneeMembershipId: metadata.suggestedAssigneeMembershipId,
            dueDate: metadata.suggestedDueDate,
          },
          final: {
            title: content.title,
            rationale: content.rationale,
            titleKey: content.titleKey,
            rationaleKey: content.rationaleKey,
            assigneeMembershipId: assignee?.context.membershipId ?? null,
            assigneePersonId: assignee?.context.userId ?? null,
            dueDate: command.dueDate || null,
          },
          requestId: context.requestId,
          correlationId: context.requestId,
          idempotencyKey: command.idempotencyKey,
          payloadFingerprint: payload,
          timestamp: createdAt,
          result: "SUCCESS",
        };
        await tx.commitAction({
          id,
          businessKey,
          context,
          projectId: project.id,
          proposal: record,
          content,
          evidenceSnapshot,
          assigneeMembershipId: assignee?.context.membershipId ?? null,
          assigneePersonId: assignee?.context.userId ?? null,
          dueDate: command.dueDate || null,
          idempotencyKey: command.idempotencyKey,
          payloadFingerprint: payload,
          auditPayload,
          createdAt,
        });
        return {
          kind: "CREATED",
          receipt: {
            version: "action-receipt.v1",
            timezone: content.timezone,
            businessKey,
            title: localize(content.title, command.locale),
            rationale: localize(content.rationale, command.locale),
            project: {
              projectKey: project.businessKey,
              name: localize(project.name, command.locale),
            },
            assigneeDisplayName: content.assignee
              ? localize(content.assignee, command.locale)
              : null,
            dueDate: command.dueDate || null,
            status: "OPEN",
            createdAt,
            createdByDisplay: localize(content.createdBy, command.locale),
            comparisonRunId: metadata.comparisonRunId,
            enrichmentRunId: metadata.enrichmentRunId,
            evidenceCount: current.material.references.length,
            returnContext: content.returnContext,
          },
        };
      });
    } catch {
      return this.failure(seed, "ACTION_CREATE_FAILED");
    }
  }

  private async receipt(
    tx: InternalReviewTransaction,
    context: RuntimeContext,
    project: ReviewProject,
    metadata: ActionMetadata,
    locale: Locale,
    knownScopes?: readonly EvidenceScope[],
  ): Promise<ActionReceiptDTO | null> {
    if (!actionAccess(context, project.id) || project.id !== metadata.projectId) return null;
    const scopes =
      knownScopes ??
      (await tx.getEvidenceScopes(
        context,
        metadata.comparisonRunId,
        metadata.evidenceReferenceIds,
      ));
    const relevant = scopes.filter((scope) =>
      metadata.evidenceReferenceIds.includes(scope.referenceId),
    );
    if (
      !evidenceScopesAllowed(context, project.id, relevant, metadata.evidenceReferenceIds) ||
      relevant.some((scope) => !scope.comparisonRunIds.includes(metadata.comparisonRunId))
    )
      return null;
    const action = await tx.getAction(context, metadata);
    if (!action || action.content.version !== ACTION_SNAPSHOT_VERSION || action.status !== "OPEN")
      return null;
    const snapshot = action.evidenceSnapshot as {
      sources?: readonly { referenceId: string; subjectId: string; subjectType: string }[];
    };
    if (
      !snapshot.sources ||
      snapshot.sources.length !== relevant.length ||
      relevant.some(
        (scope) =>
          !snapshot.sources!.some(
            (source) =>
              source.referenceId === scope.referenceId &&
              source.subjectId === scope.subjectId &&
              source.subjectType === scope.subjectType,
          ),
      )
    )
      return null;
    const content = action.content;
    return {
      version: "action-receipt.v1",
      timezone: content.timezone,
      businessKey: action.businessKey,
      title: localize(content.title, locale),
      rationale: localize(content.rationale, locale),
      project: { projectKey: project.businessKey, name: localize(project.name, locale) },
      assigneeDisplayName: content.assignee ? localize(content.assignee, locale) : null,
      dueDate: action.dueDate,
      status: "OPEN",
      createdAt: action.createdAt,
      createdByDisplay: localize(content.createdBy, locale),
      comparisonRunId: metadata.comparisonRunId,
      enrichmentRunId: metadata.enrichmentRunId,
      evidenceCount: metadata.evidenceReferenceIds.length,
      returnContext: content.returnContext,
    };
  }

  async getReceipt(
    seed: RuntimeContext,
    actionKey: string,
    locale: Locale,
  ): Promise<ReceiptOutcome> {
    if (!preliminaryAccess(seed) || !SAFE_REVIEW_KEY.test(actionKey) || !validLocale(locale))
      return this.failure(seed, "ACTION_NOT_AUTHORIZED");
    try {
      return await this.repository.transaction(async (tx) => {
        const actor = await this.actor(tx, seed);
        if (!actor) return this.failure(seed, "ACTION_NOT_AUTHORIZED");
        const metadata = await tx.findAction(actor.context, actionKey);
        if (!metadata) return this.failure(seed, "ACTION_NOT_AUTHORIZED");
        const project = await tx.getProject(actor.context, metadata.projectId);
        const receipt = project
          ? await this.receipt(tx, actor.context, project, metadata, locale)
          : null;
        return receipt
          ? { kind: "AVAILABLE", receipt }
          : this.failure(seed, "ACTION_NOT_AUTHORIZED");
      });
    } catch {
      return this.failure(seed, "ACTION_NOT_AUTHORIZED");
    }
  }

  async listProjectActions(
    seed: RuntimeContext,
    projectKey: string,
    locale: Locale,
  ): Promise<ActionListOutcome> {
    if (!preliminaryAccess(seed) || !SAFE_REVIEW_KEY.test(projectKey) || !validLocale(locale))
      return this.failure(seed, "ACTION_NOT_AUTHORIZED");
    try {
      return await this.repository.transaction(async (tx) => {
        const actor = await this.actor(tx, seed);
        if (!actor) return this.failure(seed, "ACTION_NOT_AUTHORIZED");
        const context = actor.context;
        const project = await tx.getProject(context, projectKey);
        if (!project || !actionAccess(context, project.id))
          return this.failure(seed, "ACTION_NOT_AUTHORIZED");
        const metadata = await tx.listActionMetadata(context, project.id);
        const scopes =
          metadata.length > 0
            ? await tx.getEvidenceScopes(
                context,
                [...new Set(metadata.map((action) => action.comparisonRunId))],
                [...new Set(metadata.flatMap((action) => action.evidenceReferenceIds))],
              )
            : [];
        const actions: ActionReceiptDTO[] = [];
        for (const action of metadata) {
          const receipt = await this.receipt(tx, context, project, action, locale, scopes);
          if (receipt) actions.push(receipt);
        }
        return {
          kind: "AVAILABLE",
          version: "internal-review-action-list.v1",
          project: { projectKey: project.businessKey, name: localize(project.name, locale) },
          actions,
        };
      });
    } catch {
      return this.failure(seed, "ACTION_NOT_AUTHORIZED");
    }
  }
}
