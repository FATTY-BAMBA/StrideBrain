import type {
  ProjectRecordStatus,
  Stage4ComparisonResult,
} from "@/modules/comparisons/domain/contracts";
import type { AuthorityState, ObservationType } from "@/modules/projects/domain/project-workspace";

export const EVIDENCE_AUTHORITY_POLICY_VERSION = "EVIDENCE-AUTHORITY-1.0" as const;
export const ECONOMICS_CALCULATION_VERSION = "CPI-ECON-1.0" as const;
export const STAGE5_RESULT_VERSION = "comparable-project-stage5.v1" as const;

export type EvidenceAuthorityPolicyVersion = typeof EVIDENCE_AUTHORITY_POLICY_VERSION;
export type EconomicsCalculationVersion = typeof ECONOMICS_CALCULATION_VERSION;

export type EconomicsAccessScope =
  "STRUCTURAL_ONLY" | "QUOTE_ONLY" | "QUOTE_AND_FORECAST" | "FULL_ACTUAL";

export type EconomicsSubjectType =
  | "PROJECT"
  | "QUOTE_VERSION"
  | "QUOTE_ITEM"
  | "FORECAST_COST_VERSION"
  | "FORECAST_COST_LINE"
  | "PROJECT_COST_VERSION"
  | "COST_LINE"
  | "SUPPLIER_OFFER"
  | "SUPPLIER_OFFER_ITEM";

export type DataClassification =
  | "DEMO_SYNTHETIC"
  | "PUBLIC_REFERENCE"
  | "TENANT_PRIVATE"
  | "TENANT_RESTRICTED"
  | "TENANT_APPROVED";

export type FreshnessState = "CURRENT" | "HISTORICAL" | "STALE";

export type ObservationPurpose =
  | "CURRENT_QUOTE"
  | "QUOTED_HISTORY"
  | "CURRENT_FORECAST"
  | "ACTUAL_HISTORY"
  | "SUPPLIER_HISTORY"
  | "SUPPLIER_CURRENT";

export type AuthorityReasonCode =
  | "WRONG_OBSERVATION_TYPE"
  | "INSUFFICIENT_AUTHORITY"
  | "PROJECT_NOT_COMPLETED"
  | "SUPERSEDED"
  | "CONFLICTED"
  | "STALE"
  | "INCOMPATIBLE_CURRENCY"
  | "INCOMPATIBLE_UNIT"
  | "MISSING_TAXONOMY"
  | "MISSING_EVIDENCE"
  | "NOT_AUTHORIZED"
  | "POLICY_EXCLUDED"
  | "MISSING_AREA"
  | "AMOUNT_INVALID"
  | "LINE_NOT_RECONCILED"
  | "TOTAL_NOT_RECONCILED";

export type EconomicsProjectSnapshot = Readonly<{
  internalId: string;
  businessKey: string;
  status: ProjectRecordStatus;
  areaValue: string;
  areaUnit: string;
  currency: string;
  programmeWeeks?: string | undefined;
  dataClassification: DataClassification;
  evidenceReferenceIds: readonly string[];
}>;

export type EconomicsLineSnapshot = Readonly<{
  id: string;
  subjectType: Extract<
    EconomicsSubjectType,
    "QUOTE_ITEM" | "FORECAST_COST_LINE" | "COST_LINE" | "SUPPLIER_OFFER_ITEM"
  >;
  lineNumber: number;
  categoryId: string;
  amount: string;
  quantity: string;
  unitRate: string;
  unit: string;
  authorityState: AuthorityState;
  evidenceReferenceIds: readonly string[];
}>;

export type FinancialObservationRecord = Readonly<{
  id: string;
  projectId: string;
  projectKey: string;
  recordKey: string;
  versionNumber?: number | undefined;
  subjectType: Extract<
    EconomicsSubjectType,
    "QUOTE_VERSION" | "FORECAST_COST_VERSION" | "PROJECT_COST_VERSION" | "SUPPLIER_OFFER"
  >;
  observationType: ObservationType;
  authorityState: AuthorityState;
  currency: string;
  totalAmount: string;
  effectiveAt?: string | undefined;
  validUntil?: string | undefined;
  supersededById?: string | undefined;
  conflictIds: readonly string[];
  evidenceReferenceIds: readonly string[];
  dataClassification: DataClassification;
  policyExcluded?: boolean | undefined;
  lines: readonly EconomicsLineSnapshot[];
}>;

export type EvidenceReferenceSnapshot = Readonly<{
  id: string;
  subjectType: EconomicsSubjectType;
  subjectId: string;
  documentVersionId?: string | undefined;
  locator: Readonly<Record<string, unknown>>;
  claimKey: string;
  supportedValue?: Readonly<Record<string, unknown>> | undefined;
  authorityState: AuthorityState;
  observationType?: ObservationType | undefined;
  dataClassification: DataClassification;
  effectiveAt?: string | undefined;
  staleAt?: string | undefined;
  conflictIds: readonly string[];
}>;

export type ObservationAuthorityDecision = Readonly<{
  recordId: string;
  purpose: ObservationPurpose;
  eligible: boolean;
  reasonCodes: readonly AuthorityReasonCode[];
  freshness: FreshnessState;
  conflictIds: readonly string[];
  evidenceReferenceIds: readonly string[];
}>;

export type EconomicsQueryDiagnostics = Readonly<{
  databaseQueries: number;
  projectRowsReturned: number;
  financialRecordsReturned: number;
  evidenceRowsReturned: number;
  maximumSelectedProjects: number;
}>;

export type AuthorizedEconomicsBatch = Readonly<{
  structuralResult: Stage4ComparisonResult;
  comparisonRunId: string;
  activeProjectId: string;
  activeProjectKey: string;
  selectedProjectIds: readonly string[];
  selectedProjectKeys: readonly string[];
  accessScope: EconomicsAccessScope;
  canReadEvidence: boolean;
  projects: readonly EconomicsProjectSnapshot[];
  records: readonly FinancialObservationRecord[];
  evidence: readonly EvidenceReferenceSnapshot[];
  diagnostics: EconomicsQueryDiagnostics;
}>;

export type CalculationTraceInputDTO = Readonly<{
  observationId: string;
  projectKey: string;
  normalizedValue: string;
  unit: string;
  evidenceReferenceIds: readonly string[];
}>;

export type CalculationTraceDTO = Readonly<{
  calculationVersion: EconomicsCalculationVersion;
  policyVersions: readonly [EvidenceAuthorityPolicyVersion];
  operation: string;
  inputs: readonly CalculationTraceInputDTO[];
  aggregation: string;
  result: Readonly<Record<string, unknown>>;
  rounding: string;
  generatedAt: string;
}>;

export type AggregateState =
  "SUFFICIENT" | "INSUFFICIENT" | "RESTRICTED" | "UNAVAILABLE" | "CONFLICTED";

export type HistoricalAggregateDTO = Readonly<{
  state: AggregateState;
  observationType: ObservationType;
  requiredObservationCount: number;
  eligibleObservationCount?: number | undefined;
  currency?: string | undefined;
  normalizedUnit?: string | undefined;
  medianNormalizedAmount?: string | undefined;
  minimumNormalizedAmount?: string | undefined;
  maximumNormalizedAmount?: string | undefined;
  equivalentAmountForActiveProject?: string | undefined;
  observationProjectKeys?: readonly string[] | undefined;
  evidenceReferenceIds?: readonly string[] | undefined;
  calculationTrace?: CalculationTraceDTO | undefined;
}>;

export type VarianceFindingState = "VALUE" | "INSUFFICIENT" | "RESTRICTED" | "UNAVAILABLE";

export type VarianceFindingDTO = Readonly<{
  state: VarianceFindingState;
  currentBasis: "QUOTE" | "FORECAST";
  historyBasis: "QUOTED_PRICE" | "RECONCILED_ACTUAL_COST";
  currency?: string | undefined;
  currentAmount?: string | undefined;
  currentNormalizedAmount?: string | undefined;
  baselineMedianNormalizedAmount?: string | undefined;
  baselineEquivalentAmount?: string | undefined;
  normalizedUnit?: string | undefined;
  variancePercent?: string | undefined;
  direction?: "ABOVE" | "BELOW" | "ALIGNED" | undefined;
  evidenceReferenceIds?: readonly string[] | undefined;
  calculationTrace?: CalculationTraceDTO | undefined;
}>;

export type CategoryEconomicsDTO = Readonly<{
  categoryId: string;
  quotedHistory: HistoricalAggregateDTO;
  actualHistory: HistoricalAggregateDTO;
  quoteVariance: VarianceFindingDTO;
  forecastVariance: VarianceFindingDTO;
  warningCodes: readonly string[];
}>;

export type SupplierOfferEconomicsDTO = Readonly<{
  recordKey: string;
  projectKey: string;
  authorityState: AuthorityState;
  freshness: FreshnessState;
  amount?: string | undefined;
  currency?: string | undefined;
  validUntil?: string | undefined;
  state: "HISTORICAL" | "CURRENT_CONTEXT" | "EXCLUDED";
  reasonCodes: readonly AuthorityReasonCode[];
  evidenceReferenceIds: readonly string[];
}>;

export type ProgrammeDifferenceDTO = Readonly<{
  state: "KNOWN_DIFFERENCE" | "UNAVAILABLE";
  activeProgrammeWeeks?: string | undefined;
  historicalMinimumWeeks?: string | undefined;
  historicalMaximumWeeks?: string | undefined;
  quantifiedPremiumState: "UNQUANTIFIED";
  evidenceReferenceIds: readonly string[];
}>;

export type EconomicsClaimKind =
  | "OVERALL_QUOTED_VARIANCE"
  | "OVERALL_FORECAST_ACTUAL_VARIANCE"
  | "CATEGORY_QUOTED_VARIANCE"
  | "CATEGORY_FORECAST_ACTUAL_VARIANCE"
  | "CATEGORY_ACTUAL_INSUFFICIENT"
  | "PROGRAMME_DIFFERENCE_UNQUANTIFIED"
  | "STALE_SUPPLIER_EVIDENCE";

export type StructuredEconomicsClaimDTO = Readonly<{
  claimKey: string;
  kind: EconomicsClaimKind;
  titleEn: string;
  titleZhTw: string;
  value: Readonly<Record<string, unknown>>;
  observationType?: ObservationType | undefined;
  authorityState?: AuthorityState | undefined;
  sufficiencyCode?: string | undefined;
  evidenceReferenceIds: readonly string[];
  warningCodes: readonly string[];
  calculationTrace?: CalculationTraceDTO | undefined;
}>;

export type AuthorizedEvidenceSourceDTO = Readonly<{
  referenceId: string;
  subjectType: EconomicsSubjectType;
  subjectId: string;
  documentVersionId?: string | undefined;
  locator: Readonly<Record<string, unknown>>;
  claimKey: string;
  supportedValue?: Readonly<Record<string, unknown>> | undefined;
  authorityState: AuthorityState;
  observationType?: ObservationType | undefined;
  dataClassification: DataClassification;
  effectiveAt?: string | undefined;
  staleAt?: string | undefined;
  conflictIds: readonly string[];
}>;

export type AuthorizedEvidenceBundleDTO = Readonly<{
  claimKey: string;
  sources: readonly AuthorizedEvidenceSourceDTO[];
  calculationTrace?: CalculationTraceDTO | undefined;
  warningCodes: readonly string[];
}>;

export type Stage5EconomicsState =
  | "COMPLETE"
  | "PARTIAL_ECONOMICS"
  | "INSUFFICIENT_ACTUAL_EVIDENCE"
  | "CONFLICTED_EVIDENCE"
  | "STALE_SUPPLIER_EVIDENCE";

export type Stage5EconomicsResult = Readonly<{
  version: typeof STAGE5_RESULT_VERSION;
  run: Readonly<{
    id: string;
    comparisonRunId: string;
    generatedAt: string;
    snapshotDate: string;
    status: "COMPLETE" | "PARTIAL_ECONOMICS";
    authorityPolicyVersion: EvidenceAuthorityPolicyVersion;
    calculationVersion: EconomicsCalculationVersion;
    inputFingerprint: string;
    sourceFingerprint: string;
    permissionFingerprint: string;
  }>;
  accessScope: EconomicsAccessScope;
  structuralResultFingerprint: string;
  selectedProjectKeys: readonly string[];
  states: readonly Stage5EconomicsState[];
  summary: Readonly<{
    quotedHistoryState: AggregateState;
    actualHistoryState: AggregateState;
    actualEligibleProjectCount?: number | undefined;
    staleSupplierOfferCount?: number | undefined;
    conflictCount?: number | undefined;
  }>;
  current: Readonly<{
    quoteBeforeTax?: string | undefined;
    forecastDirectCost?: string | undefined;
    currency: string;
  }>;
  overall: Readonly<{
    quotedHistory: HistoricalAggregateDTO;
    actualHistory: HistoricalAggregateDTO;
    quoteVariance: VarianceFindingDTO;
    forecastVariance: VarianceFindingDTO;
  }>;
  categories: readonly CategoryEconomicsDTO[];
  programmeDifference: ProgrammeDifferenceDTO;
  supplierOffers: readonly SupplierOfferEconomicsDTO[];
  claims: readonly StructuredEconomicsClaimDTO[];
  evidenceBundles: readonly AuthorizedEvidenceBundleDTO[];
}>;

export type Stage5EconomicsOutcome =
  | Readonly<{
      kind:
        | "COMPLETE"
        | "PARTIAL_ECONOMICS"
        | "INSUFFICIENT_ACTUAL_EVIDENCE"
        | "CONFLICTED_EVIDENCE"
        | "STALE_SUPPLIER_EVIDENCE";
      result: Stage5EconomicsResult;
    }>
  | Readonly<{
      kind: "UNAVAILABLE";
      errorCode: "ECONOMICS_UNAVAILABLE";
      requestId: string;
    }>
  | Readonly<{
      kind: "FAILED";
      errorCode: "ECONOMICS_FAILED";
      requestId: string;
    }>;

export type HistoricalEconomicsAssembly = Readonly<{
  result: Stage5EconomicsResult;
  decisions: readonly PersistableObservationDecision[];
}>;

export type HistoricalEconomicsAssemblyInput = Readonly<{
  stage4: Stage4ComparisonResult;
  batch: AuthorizedEconomicsBatch;
  enrichmentRunId: string;
  generatedAt: string;
  snapshotDate: string;
  inputFingerprint: string;
  sourceFingerprint: string;
  permissionFingerprint: string;
  structuralResultFingerprint: string;
}>;

export type PersistableObservationDecision = Readonly<{
  observationId: string;
  projectId: string;
  categoryId?: string | undefined;
  observationType: ObservationType;
  authorityState: AuthorityState;
  included: boolean;
  reasonCodes: readonly AuthorityReasonCode[];
  normalizedAmount?: string | undefined;
  normalizedUnit?: string | undefined;
  evidenceReferenceIds: readonly string[];
}>;

export type PersistStage5EconomicsInput = Readonly<{
  organizationId: string;
  requestId: string;
  actorUserId: string;
  actorMembershipId: string;
  enrichmentRunId: string;
  comparisonRunId: string;
  activeProjectId: string;
  generatedAt: string;
  inputFingerprint: string;
  sourceFingerprint: string;
  permissionFingerprint: string;
  accessScope: EconomicsAccessScope;
  result: Stage5EconomicsResult;
  decisions: readonly PersistableObservationDecision[];
  claims: readonly StructuredEconomicsClaimDTO[];
}>;
