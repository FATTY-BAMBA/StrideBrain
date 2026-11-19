import type { EvidencePanelSelection } from "@/modules/evidence-panel/contracts";
import type { Locale } from "@/modules/localization/config";
import type { StructuredEconomicsClaimDTO } from "@/modules/economics/domain/contracts";
import type { EvidenceSourceRecord } from "@/repositories/ports/evidence-panel-repository";

export const INTERNAL_REVIEW_POLICY = "INTERNAL-REVIEW-ACTION-1.0" as const;
export const PROPOSAL_SNAPSHOT_VERSION = "internal-review-proposal-snapshot.v1" as const;
export const ACTION_SNAPSHOT_VERSION = "internal-review-action-snapshot.v1" as const;

export type LocalizedText = Readonly<{ en: string; zhTw: string }>;
export type WordingOption = Readonly<{ key: string; text: string }>;
export type LocalizedWordingOption = Readonly<{ key: string; text: LocalizedText }>;
export type ReturnContext = Readonly<{
  selectedProjectKeys: readonly string[];
  evidenceSelection?: EvidencePanelSelection | undefined;
  evidenceReturnId?: string | undefined;
}>;
export type ReviewStatement = Readonly<{
  key: string;
  text: LocalizedText;
  claimKey?: string | undefined;
}>;
export type AssigneeDTO = Readonly<{ key: string; displayName: string }>;
export type ReviewProjectDTO = Readonly<{ projectKey: string; name: string }>;

export type DueDatePolicyDTO = Readonly<{
  minDueDate: string;
  maxDueDate: string;
  datePolicyEvaluatedAt: string;
  nextDatePolicyBoundaryAt: string;
}>;

export type ProposedActionDTO = DueDatePolicyDTO &
  Readonly<{
    version: "internal-review-proposal.v1";
    businessKey: string;
    project: ReviewProjectDTO;
    comparisonRunId: string;
    enrichmentRunId: string;
    locale: Locale;
    timezone: string;
    titleOptions: readonly WordingOption[];
    rationaleOptions: readonly WordingOption[];
    title: string;
    rationale: string;
    titleKey: string;
    rationaleKey: string;
    mandatoryStatements: readonly Readonly<{
      key: string;
      text: string;
      claimKey?: string | undefined;
    }>[];
    warnings: readonly Readonly<{ key: string; text: string }>[];
    assignees: readonly AssigneeDTO[];
    suggestedAssigneeKey: string | null;
    canAssign: boolean;
    suggestedDueDate: string | null;
    expiresAt: string;
    idempotencyKey: string;
    evidenceLinks: readonly Readonly<{ claimKey: string; label: string }>[];
    returnContext: ReturnContext;
  }>;

export type ActionReceiptDTO = Readonly<{
  version: "action-receipt.v1";
  timezone: string;
  businessKey: string;
  title: string;
  rationale: string;
  project: ReviewProjectDTO;
  assigneeDisplayName: string | null;
  dueDate: string | null;
  status: "OPEN";
  createdAt: string;
  createdByDisplay: string;
  comparisonRunId: string;
  enrichmentRunId: string;
  evidenceCount: number;
  returnContext: ReturnContext;
}>;

export type PrepareInternalReviewInput = Readonly<{
  projectKey: string;
  comparisonRunId: string;
  enrichmentRunId: string;
  locale: Locale;
  returnContext?: ReturnContext | undefined;
}>;
export type ConfirmInternalReviewInput = Readonly<{
  version: "internal-review-command.v1";
  proposalKey: string;
  title: string;
  rationale: string;
  assigneeKey?: string | null | undefined;
  dueDate?: string | null | undefined;
  confirmation: boolean;
  idempotencyKey: string;
  locale: Locale;
}>;
export type ProposalFailure =
  | "PROPOSAL_UNAVAILABLE"
  | "PROPOSAL_EXPIRED"
  | "PROPOSAL_STALE"
  | "PROPOSAL_NOT_AUTHORIZED"
  | "PROPOSAL_FAILED";
export type ConfirmationFailure =
  | "ACTION_NOT_AUTHORIZED"
  | "ASSIGNEE_UNAVAILABLE"
  | "EVIDENCE_UNAVAILABLE"
  | "STALE_COMPARISON"
  | "PROPOSAL_EXPIRED"
  | "PROPOSAL_ALREADY_CONSUMED"
  | "IDEMPOTENCY_CONFLICT"
  | "ACTION_CREATE_FAILED";
export type FieldError =
  | "INVALID_TITLE"
  | "INVALID_RATIONALE"
  | "INVALID_DUE_DATE"
  | "CONFIRMATION_REQUIRED"
  | "INVALID_REQUEST";
export type FieldErrors = Readonly<
  Partial<Record<"title" | "rationale" | "assigneeKey" | "dueDate" | "confirmation", FieldError>>
>;
export type ProposalOutcome =
  | Readonly<{ kind: "PREPARED"; proposal: ProposedActionDTO }>
  | Readonly<{ kind: ProposalFailure; requestId: string }>;
export type ConfirmationOutcome =
  | Readonly<{ kind: "CREATED" | "IDEMPOTENT_REPLAY"; receipt: ActionReceiptDTO }>
  | Readonly<{ kind: ConfirmationFailure; requestId: string }>
  | Readonly<{
      kind: "VALIDATION_FAILED";
      requestId: string;
      fieldErrors: FieldErrors;
      datePolicy?: DueDatePolicyDTO;
    }>;
export type ReceiptOutcome =
  | Readonly<{ kind: "AVAILABLE"; receipt: ActionReceiptDTO }>
  | Readonly<{ kind: "ACTION_NOT_AUTHORIZED"; requestId: string }>;
export type ActionListOutcome =
  | Readonly<{
      kind: "AVAILABLE";
      version: "internal-review-action-list.v1";
      project: ReviewProjectDTO;
      actions: readonly ActionReceiptDTO[];
    }>
  | Readonly<{ kind: "ACTION_NOT_AUTHORIZED"; requestId: string }>;

export type ProposalDTO = ProposedActionDTO;
export type ReceiptDTO = ActionReceiptDTO;
export type PrepareOutcome = ProposalOutcome;
export type ConfirmOutcome = ConfirmationOutcome;

export type MaterialFingerprints = Readonly<{
  project: string;
  comparisonSource: string;
  comparisonInput: string;
  comparisonPermission: string;
  comparisonResult: string;
  economicsSource: string;
  economicsInput: string;
  economicsPermission: string;
  economicsStructural: string;
  economicsResult: string;
  permission: string;
  evidence: string;
}>;
export type ProposalContent = Readonly<{
  version: typeof PROPOSAL_SNAPSHOT_VERSION;
  policyVersion: typeof INTERNAL_REVIEW_POLICY;
  project: Readonly<{ projectKey: string; name: LocalizedText }>;
  comparisonRunId: string;
  enrichmentRunId: string;
  actorUserId: string;
  actorMembershipId: string;
  titleOptions: readonly LocalizedWordingOption[];
  rationaleOptions: readonly LocalizedWordingOption[];
  mandatoryStatements: readonly ReviewStatement[];
  warnings: readonly ReviewStatement[];
  claims: readonly StructuredEconomicsClaimDTO[];
  evidence: readonly EvidenceSourceRecord[];
  fingerprints: MaterialFingerprints;
  policyVersions: Readonly<Record<string, string>>;
  returnContext: ReturnContext;
  locale: Locale;
  timezone: string;
}>;
export type ActionContent = Readonly<{
  version: typeof ACTION_SNAPSHOT_VERSION;
  timezone: string;
  policyVersion: typeof INTERNAL_REVIEW_POLICY;
  project: ProposalContent["project"];
  title: LocalizedText;
  rationale: LocalizedText;
  titleKey: string;
  rationaleKey: string;
  createdBy: LocalizedText;
  assignee: LocalizedText | null;
  comparisonRunId: string;
  enrichmentRunId: string;
  returnContext: ReturnContext;
}>;
