import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type { Stage5EconomicsResult } from "@/modules/economics/domain/contracts";
import type {
  ActionContent,
  LocalizedText,
  ProposalContent,
} from "@/modules/internal-review/domain/contracts";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type { ProjectRepositoryPort } from "@/repositories/ports/project-repository";
import type { ComparableProjectRepositoryPort } from "@/repositories/ports/comparable-project-repository";
import type { ComparisonRunRepositoryPort } from "@/repositories/ports/comparison-run-repository";
import type { EconomicsObservationRepositoryPort } from "@/repositories/ports/economics-observation-repository";
import type { EconomicsEnrichmentRunRepositoryPort } from "@/repositories/ports/economics-enrichment-run-repository";
import type { EvidencePanelRepositoryPort } from "@/repositories/ports/evidence-panel-repository";

export type TransactionCheckpoint =
  | "AFTER_ACTION"
  | "AFTER_EVIDENCE"
  | "AFTER_AUDIT"
  | "AFTER_CONSUMPTION"
  | "AFTER_RECEIPT"
  | "BEFORE_COMMIT";
export type ActorRecord = Readonly<{
  context: RuntimeContext;
  name: LocalizedText;
  timezone: string;
}>;
export type MemberRecord = Readonly<{ context: RuntimeContext; name: LocalizedText; key: string }>;
export type ReviewProject = Readonly<{
  id: string;
  organizationId: string;
  businessKey: string;
  name: LocalizedText;
  status: string;
  stage: string;
  updatedAt: string;
  deletedAt: string | null;
}>;
export type StoredRunState = Readonly<{
  comparison: Readonly<{
    id: string;
    activeProjectId: string;
    activeQuoteVersionId: string | null;
    activeQuoteValidUntil: string | null;
    policyVersion: string;
    calculationVersion: string;
    inputFingerprint: string;
    status: string;
    snapshot: unknown;
    actorSnapshot: unknown;
    intelligenceOrganizationId: string;
    intelligenceProjectId: string | null;
  }>;
  economics: Readonly<{
    id: string;
    activeProjectId: string;
    comparisonRunId: string;
    status: string;
    authorityPolicyVersion: string;
    calculationVersion: string;
    sourceFingerprint: string;
    inputFingerprint: string;
    permissionFingerprint: string;
    structuralResultFingerprint: string;
    snapshot: unknown;
  }>;
  stage4: Stage4ComparisonResult;
  stage5: Stage5EconomicsResult;
}>;
export type EvidenceScope = Readonly<{
  referenceId: string;
  organizationId: string;
  subjectType: string;
  subjectId: string;
  classification: string;
  observationType: string | null;
  projectId: string;
  projectClassification: string;
  projectDeleted: boolean;
  inComparison: boolean;
  comparisonRunIds: readonly string[];
  documentChecksum?: string | null | undefined;
  documentClassification?: string | null | undefined;
  documentAuthority?: string | null | undefined;
  documentSuperseded?: boolean | undefined;
}>;
export type ProposalMetadata = Readonly<{
  id: string;
  businessKey: string;
  projectId: string;
  comparisonRunId: string;
  enrichmentRunId: string;
  preparedByMembershipId: string;
  status: string;
  expiresAt: string;
  consumedAt: string | null;
  confirmationKey: string;
  suggestedAssigneeMembershipId: string | null;
  suggestedDueDate: string | null;
  evidenceReferenceIds: readonly string[];
}>;
export type ProposalRecord = ProposalMetadata & Readonly<{ content: ProposalContent }>;
export type PersistProposal = Readonly<{
  id: string;
  businessKey: string;
  organizationId: string;
  projectId: string;
  comparisonRunId: string;
  enrichmentRunId: string;
  preparedByMembershipId: string;
  preparationKey: string;
  confirmationKey: string;
  content: ProposalContent;
  suggestedAssigneeMembershipId: string | null;
  suggestedAssigneePersonId: string | null;
  suggestedDueDate: string;
  createdAt: string;
  expiresAt: string;
  evidenceReferenceIds: readonly string[];
}>;
export type ActionMetadata = Readonly<{
  id: string;
  businessKey: string;
  projectId: string;
  proposedActionId: string;
  comparisonRunId: string;
  enrichmentRunId: string;
  evidenceReferenceIds: readonly string[];
}>;
export type ActionRecord = ActionMetadata &
  Readonly<{
    content: ActionContent;
    evidenceSnapshot: unknown;
    dueDate: string | null;
    status: string;
    createdAt: string;
  }>;
export type ReceiptRecord = Readonly<{
  actionId: string;
  payloadFingerprint: string;
  proposedActionId: string;
  actorMembershipId: string;
}>;
export type CommitActionInput = Readonly<{
  id: string;
  businessKey: string;
  context: RuntimeContext;
  projectId: string;
  proposal: ProposalRecord;
  content: ActionContent;
  evidenceSnapshot: unknown;
  assigneeMembershipId: string | null;
  assigneePersonId: string | null;
  dueDate: string | null;
  idempotencyKey: string;
  payloadFingerprint: string;
  auditPayload: unknown;
  createdAt: string;
}>;

export interface InternalReviewTransaction {
  projects: ProjectRepositoryPort;
  candidates: ComparableProjectRepositoryPort;
  comparisons: ComparisonRunRepositoryPort;
  observations: EconomicsObservationRepositoryPort;
  economics: EconomicsEnrichmentRunRepositoryPort;
  evidence: EvidencePanelRepositoryPort;
  refreshActor(seed: RuntimeContext, now: Date): Promise<ActorRecord | null>;
  getProject(context: RuntimeContext, projectKeyOrId: string): Promise<ReviewProject | null>;
  getRunState(
    context: RuntimeContext,
    projectId: string,
    comparisonRunId: string,
    enrichmentRunId: string,
  ): Promise<StoredRunState | null>;
  getEvidenceScopes(
    context: RuntimeContext,
    comparisonRunId: string | readonly string[],
    references: readonly string[],
  ): Promise<readonly EvidenceScope[]>;
  listMembers(context: RuntimeContext): Promise<readonly MemberRecord[]>;
  findProposal(
    context: RuntimeContext,
    key: string,
    lock: boolean,
  ): Promise<ProposalMetadata | null>;
  getProposal(context: RuntimeContext, metadata: ProposalMetadata): Promise<ProposalRecord | null>;
  persistProposal(input: PersistProposal): Promise<ProposalMetadata>;
  getReceiptRecord(context: RuntimeContext, idempotencyKey: string): Promise<ReceiptRecord | null>;
  findAction(context: RuntimeContext, keyOrId: string): Promise<ActionMetadata | null>;
  listActionMetadata(
    context: RuntimeContext,
    projectId: string,
  ): Promise<readonly ActionMetadata[]>;
  getAction(context: RuntimeContext, metadata: ActionMetadata): Promise<ActionRecord | null>;
  commitAction(input: CommitActionInput): Promise<void>;
}
export interface InternalReviewRepositoryPort {
  transaction<T>(work: (transaction: InternalReviewTransaction) => Promise<T>): Promise<T>;
}
