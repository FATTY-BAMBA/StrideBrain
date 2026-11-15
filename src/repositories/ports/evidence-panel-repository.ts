import type { SimilarityFactorKey } from "@/modules/comparisons/domain/contracts";
import type {
  DataClassification,
  EconomicsSubjectType,
} from "@/modules/economics/domain/contracts";
import type { AuthorityState, ObservationType } from "@/modules/projects/domain/project-workspace";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";

export type EvidenceSourceRecord = Readonly<{
  referenceId: string;
  subjectType:
    EconomicsSubjectType | "DOCUMENT_VERSION" | "PROJECT_SCOPE" | "COMPARISON_CLAIM" | "ACTION";
  subjectId: string;
  documentVersionId?: string | undefined;
  claimKey: string;
  locator: Readonly<Record<string, unknown>>;
  supportedValue?: Readonly<Record<string, unknown>> | undefined;
  authorityState: AuthorityState;
  observationType?: ObservationType | undefined;
  dataClassification: DataClassification;
  effectiveAt?: string | undefined;
  staleAt?: string | undefined;
  projectId: string;
  projectKey: string;
  projectNameEn: string;
  projectNameZhTw: string;
  titleEn: string;
  titleZhTw: string;
  versionLabel?: string | undefined;
  supersededByLabel?: string | undefined;
  previewFields: readonly Readonly<{ key: string; value: string }>[];
  previewState: "STRUCTURED" | "UNSUPPORTED" | "UNAVAILABLE";
  conflictKeys: readonly string[];
}>;

export type EvidenceFactorRecord = Readonly<{
  comparisonRunId: string;
  candidateProjectId: string;
  candidateProjectKey: string;
  candidateProjectNameEn: string;
  candidateProjectNameZhTw: string;
  factorKey: SimilarityFactorKey;
  state: "KNOWN" | "UNKNOWN" | "NOT_APPLICABLE";
  weight: string;
  normalizedValue?: string | undefined;
  contribution?: string | undefined;
  explanation: Readonly<Record<string, unknown>>;
  evidenceReferenceIds: readonly string[];
  totalScore: string;
  evidenceCoverage: string;
}>;

export type EvidenceConflictRecord = Readonly<{
  conflictKey: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  resolutionNote?: string | undefined;
  sources: readonly EvidenceSourceRecord[];
}>;

export type AuthorizedEvidenceSourcesResult =
  | Readonly<{ kind: "COMPLETE"; sources: readonly EvidenceSourceRecord[] }>
  | Readonly<{ kind: "ACCESS_CHANGED" }>
  | Readonly<{ kind: "UNAVAILABLE" }>;

export interface EvidencePanelRepositoryPort {
  getAuthorizedSources(
    context: RuntimeContext,
    comparisonRunId: string,
    referenceIds: readonly string[],
  ): Promise<AuthorizedEvidenceSourcesResult>;

  getAuthorizedFactor(
    context: RuntimeContext,
    comparisonRunId: string,
    candidateProjectKey: string,
    factorKey: SimilarityFactorKey,
  ): Promise<EvidenceFactorRecord | null>;

  getAuthorizedConflict(
    context: RuntimeContext,
    comparisonRunId: string,
    conflictKey: string,
  ): Promise<EvidenceConflictRecord | null>;
}
