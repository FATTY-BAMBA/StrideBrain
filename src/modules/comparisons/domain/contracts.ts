import type { AuthorityState } from "@/modules/projects/domain/project-workspace";

export const ELIGIBILITY_POLICY_VERSION = "CPI-ELIGIBILITY-1.0" as const;
export const SIMILARITY_POLICY_VERSION = "CPI-SIM-1.0" as const;
export const CALCULATION_VERSION = "CPI-CALC-1.0" as const;

export type ComparisonPolicyVersion = typeof SIMILARITY_POLICY_VERSION;
export type EligibilityPolicyVersion = typeof ELIGIBILITY_POLICY_VERSION;
export type CalculationVersion = typeof CALCULATION_VERSION;

export type SimilarityFactorKey =
  | "SUBTYPE"
  | "SCOPE_OVERLAP"
  | "AREA_SIMILARITY"
  | "COMMERCIAL_CATEGORY_OVERLAP"
  | "MATERIAL_OVERLAP"
  | "SUPPLIER_OVERLAP"
  | "COMPLETION_RECENCY"
  | "LOCATION_PROXIMITY";

export type FactorState = "KNOWN" | "UNKNOWN" | "NOT_APPLICABLE";
export type MatchBand = "STRONG" | "RELEVANT" | "PARTIAL" | "BROADER";
export type CandidateTier = "PRIMARY" | "BROADER";

export type ProjectRecordStatus = "ACTIVE" | "COMPLETED" | "CLOSED" | "ARCHIVED" | "CANCELLED";

export type DataClassification =
  | "DEMO_SYNTHETIC"
  | "PUBLIC_REFERENCE"
  | "TENANT_PRIVATE"
  | "TENANT_RESTRICTED"
  | "TENANT_APPROVED";

export type ComparisonLocation = Readonly<{
  city: string;
  district?: string | undefined;
}>;

export type ComparisonFactorEvidence = Readonly<
  Partial<Record<SimilarityFactorKey, readonly string[]>>
>;

export type ComparisonProjectProfile = Readonly<{
  internalId: string;
  organizationId: string;
  businessKey: string;
  nameEn: string;
  nameZhTw: string;
  comparisonClass: string;
  subtype: string;
  status: ProjectRecordStatus;
  location: ComparisonLocation;
  areaValue: string;
  areaUnit: string;
  currency: string;
  completedAt?: string | undefined;
  metadataAuthority: AuthorityState;
  dataClassification: DataClassification;
  scopeCategoryIds: readonly string[];
  commercialCategoryIds: readonly string[];
  materialIds: readonly string[];
  supplierIds: readonly string[];
  factorEvidence: ComparisonFactorEvidence;
  recordVersion: string;
  policyExcluded?: boolean | undefined;
  testRecord?: boolean | undefined;
  duplicateOfProjectId?: string | undefined;
}>;

export type ActiveProjectComparisonContext = ComparisonProjectProfile &
  Readonly<{
    snapshotDate: string;
    activeQuoteVersionKey?: string | undefined;
    sourceFingerprint: string;
    permissionFingerprint: string;
  }>;

export type MissingContextField =
  | "COMPARISON_CLASS"
  | "SUBTYPE"
  | "AREA"
  | "AREA_UNIT"
  | "CURRENCY"
  | "SCOPE_CATEGORIES"
  | "COMMERCIAL_CATEGORIES"
  | "LOCATION_CITY"
  | "METADATA_AUTHORITY"
  | "SNAPSHOT_DATE";

export type EligibilityReasonCode =
  | "ORGANIZATION_MISMATCH"
  | "STATUS_NOT_HISTORICAL"
  | "COMPARISON_CLASS_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "AREA_UNIT_MISMATCH"
  | "MANDATORY_CONTEXT_MISSING"
  | "METADATA_AUTHORITY_INSUFFICIENT"
  | "COMPLETION_DATE_INVALID"
  | "DUPLICATE_RECORD"
  | "TEST_RECORD"
  | "POLICY_EXCLUDED";

export type CandidateEligibilityDecision = Readonly<{
  eligible: boolean;
  reasonCodes: readonly EligibilityReasonCode[];
}>;

export type FactorCalculation = Readonly<{
  factorKey: SimilarityFactorKey;
  state: FactorState;
  weight: number;
  normalizedMicros?: number | undefined;
  normalizedValue?: string | undefined;
  contributionTenThousandths?: number | undefined;
  contribution?: string | undefined;
  explanationCode: string;
  evidenceReferenceIds: readonly string[];
}>;

export type FactorSummaryDTO = Readonly<{
  factorKey: SimilarityFactorKey;
  normalizedValue: string;
  contribution: string;
  labelKey: string;
}>;

export type DifferenceDTO = Readonly<{
  factorKey: SimilarityFactorKey;
  normalizedValue: string;
  lostContribution: string;
  labelKey: string;
}>;

export type UnknownFactorDTO = Readonly<{
  factorKey: SimilarityFactorKey;
  weight: number;
  labelKey: string;
}>;

export type CandidateSimilarityCalculation = Readonly<{
  candidate: ComparisonProjectProfile;
  eligibility: CandidateEligibilityDecision;
  factors: readonly FactorCalculation[];
  scoreTenThousandths: number;
  score: string;
  displayScore: number;
  band: MatchBand;
  evidenceCoverageTenThousandths: number;
  evidenceCoverage: string;
  displayEvidenceCoverage: number;
  tier: CandidateTier;
  strongestFactors: readonly FactorSummaryDTO[];
  differences: readonly DifferenceDTO[];
  unknowns: readonly UnknownFactorDTO[];
  equivalentWithinTwoPoints: readonly string[];
}>;

export type AuthorizedProjectSummaryDTO = Readonly<{
  projectKey: string;
  nameEn: string;
  nameZhTw: string;
  subtype: string;
  location: ComparisonLocation;
  areaValue: string;
  areaUnit: string;
  completedAt: string;
}>;

export type ComparableProjectMatchDTO = Readonly<{
  project: AuthorizedProjectSummaryDTO;
  rank: number;
  score: string;
  displayScore: number;
  band: MatchBand;
  evidenceCoverage: string;
  displayEvidenceCoverage: number;
  tier: CandidateTier;
  strongestFactors: readonly FactorSummaryDTO[];
  differences: readonly DifferenceDTO[];
  unknowns: readonly UnknownFactorDTO[];
  equivalentWithinTwoPoints: readonly string[];
  policyVersion: ComparisonPolicyVersion;
}>;

export type SafeEligibilitySummary = Readonly<{
  authorizedCandidatesConsidered: number;
  eligibleForScoring: number;
  primaryMatchCount: number;
  broaderMatchCount: number;
  excludedByReason: Readonly<Partial<Record<EligibilityReasonCode, number>>>;
}>;

export type Stage4ComparisonResult = Readonly<{
  version: "comparable-project-stage4.v1";
  run: Readonly<{
    id: string;
    generatedAt: string;
    snapshotDate: string;
    status: "COMPLETE";
    eligibilityPolicyVersion: EligibilityPolicyVersion;
    policyVersion: ComparisonPolicyVersion;
    calculationVersion: CalculationVersion;
    inputFingerprint: string;
  }>;
  activeContext: Readonly<{
    // Legacy snapshots lack this metadata and cannot be reused as current Home findings.
    sourceFingerprint?: string;
    permissionFingerprint?: string;
    dataClassification?: DataClassification;
    projectKey: string;
    nameEn: string;
    nameZhTw: string;
    comparisonClass: string;
    subtype: string;
    areaValue: string;
    areaUnit: string;
    currency: string;
    location: ComparisonLocation;
    activeQuoteVersionKey?: string | undefined;
  }>;
  summary: SafeEligibilitySummary &
    Readonly<{
      factorsUsed: readonly SimilarityFactorKey[];
      missingOptionalContext: readonly SimilarityFactorKey[];
    }>;
  matches: readonly ComparableProjectMatchDTO[];
  broaderMatches: readonly ComparableProjectMatchDTO[];
  defaultSelectedProjectKeys: readonly string[];
}>;

export type Stage4ComparisonOutcome =
  | Readonly<{
      kind: "COMPLETE";
      result: Stage4ComparisonResult;
    }>
  | Readonly<{
      kind: "CONTEXT_INCOMPLETE";
      errorCode: "PROJECT_CONTEXT_INCOMPLETE";
      requestId: string;
      missingFields: readonly MissingContextField[];
    }>
  | Readonly<{
      kind: "NO_ELIGIBLE_HISTORY";
      errorCode: "COMPARISON_NO_ELIGIBLE_HISTORY";
      requestId: string;
      summary: SafeEligibilitySummary;
    }>
  | Readonly<{
      kind: "UNAVAILABLE";
      errorCode: "PROJECT_UNAVAILABLE";
      requestId: string;
    }>
  | Readonly<{
      kind: "FAILED";
      errorCode: "COMPARISON_FAILED";
      requestId: string;
    }>;

export type PersistableComparisonFactor = Readonly<{
  factorKey: SimilarityFactorKey;
  state: FactorState;
  weight: string;
  normalizedValue?: string | undefined;
  contribution?: string | undefined;
  explanation: Readonly<Record<string, unknown>>;
  evidenceReferenceIds: readonly string[];
}>;

export type PersistableComparisonCandidate = Readonly<{
  candidateProjectId: string;
  candidateProjectKey: string;
  rank: number;
  score: string;
  band: MatchBand;
  evidenceCoverage: string;
  economicsState: "NOT_EVALUATED_STAGE4";
  warnings: readonly string[];
  factors: readonly PersistableComparisonFactor[];
}>;

export type PersistCompleteComparisonInput = Readonly<{
  organizationId: string;
  requestId: string;
  actorUserId: string;
  actorMembershipId: string;
  intelligenceRunId: string;
  comparisonRunId: string;
  activeProjectId: string;
  activeProjectKey: string;
  activeQuoteVersionId?: string | undefined;
  generatedAt: string;
  snapshotDate: string;
  inputFingerprint: string;
  sourceFingerprint: string;
  permissionFingerprint: string;
  result: Stage4ComparisonResult;
  candidates: readonly PersistableComparisonCandidate[];
}>;
