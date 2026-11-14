# StrideBrain v0.1 — Shared DTO and State Contract

**Status:** UX/Technical reconciliation contract for review  
**Scope:** project workspace, comparison, evidence panel, and internal review action

## 1. DTO rules

1. DTOs are permission-specific application views, not persistence records.
2. All IDs are opaque/business selectors; server context remains authoritative.
3. Money is serialized as decimal strings with explicit currency.
4. Unknown, unavailable, restricted, conflicted, insufficient, and zero are distinct states.
5. Observation type and authority accompany financial values.
6. Evidence uses claim IDs and exact authorized references.
7. Optional model prose never changes a DTO’s structured fields.
8. Localization catalogs render labels; DTO enums remain language-neutral.
9. DTOs are runtime validated and versioned.
10. Sensitive raw source content/storage keys are never included.

## 2. Common types

```ts
type Locale = "zh-TW" | "en";
type DecimalString = string;
type ISODate = string;
type ISODateTime = string;

type MoneyDTO = {
  amount: DecimalString;
  currency: "TWD" | string;
  formatted?: string; // server/client locale presentation only, not authority
};

type QuantityDTO = {
  value: DecimalString;
  unit: "M2" | string;
};

type LocalizedNameDTO = {
  en?: string;
  zhTw?: string;
  display: string;
};
```

## 3. Project workspace DTO

```ts
type ProjectWorkspaceDTO = {
  version: "project-workspace.v1";
  project: {
    id: string;
    businessKey: string;
    name: LocalizedNameDTO;
    clientName: LocalizedNameDTO;
    stage: string;
    comparisonClass: string;
    subtype: string;
    location: {
      country: string;
      city: string;
      district?: string;
      display: string;
    };
    area: QuantityDTO;
    programmeWeeks?: DecimalString;
    targetHandover?: ISODate;
    owner?: LocalizedNameDTO;
    demoData: boolean;
  };
  activeQuote?: CommercialSummaryDTO;
  activeForecast?: CommercialSummaryDTO;
  evidenceHealth: {
    state: "GOOD" | "PARTIAL" | "INSUFFICIENT" | "CONFLICTED";
    coveragePercent?: number;
    labelKey: string;
    openIssueCount: number;
  };
  openActions: ActionSummaryDTO[];
  permissions: ProjectWorkspacePermissionDTO;
  suggestedQuestions: SuggestedQuestionDTO[];
};
```

`permissions` is presentation guidance only; server rechecks every operation.

## 4. Comparison API outcome

```ts
type RunComparisonResponse =
  | {
      version: "comparison-response.v1";
      kind: "COMPLETE";
      result: ComparableProjectResultDTO;
    }
  | {
      version: "comparison-response.v1";
      kind: "CONTEXT_INCOMPLETE";
      missing: MissingContextDTO[];
      safeNextActions: NextActionDTO[];
    }
  | {
      version: "comparison-response.v1";
      kind: "NO_ELIGIBLE_HISTORY";
      safeExclusionSummary: SafeExclusionSummaryDTO;
      safeNextActions: NextActionDTO[];
    }
  | {
      version: "comparison-response.v1";
      kind: "UNAVAILABLE";
      errorCode: "PROJECT_UNAVAILABLE" | "COMPARISON_FAILED";
      requestId: string;
      retryable: boolean;
    };
```

No unauthorized candidate details appear in non-complete outcomes.

## 5. Comparable project result DTO

```ts
type ComparableProjectResultDTO = {
  version: "comparable-project-result.v1";
  run: {
    id: string;
    status: "COMPLETE" | "STALE";
    generatedAt: ISODateTime;
    staleAt?: ISODateTime;
    staleReasonKey?: string;
    comparisonPolicyVersion: "CPI-SIM-1.0";
    authorityPolicyVersion: "EVIDENCE-AUTHORITY-1.0";
    calculationVersion: string;
  };
  activeProject: AuthorizedProjectSummaryDTO;
  summary: {
    eligibleMatchCount: number;
    actualCostEligibleProjectCount?: number;
    evidenceCoverage: EvidenceCoverageDTO;
    sufficiency: "STRONG" | "PARTIAL" | "INSUFFICIENT";
    factorsUsed: SimilarityFactorKey[];
    missingOptionalContext: MissingContextDTO[];
  };
  matches: ComparableProjectMatchDTO[];
  defaultSelectedProjectIds: string[];
  table: ComparisonTableDTO;
  synthesis: StructuredSynthesisDTO;
  proposedAction?: ProposedActionDTO;
  optionalExplanation?: OptionalExplanationStateDTO;
  permissions: ComparisonPermissionDTO;
};
```

For Viewer results, `actualCostEligibleProjectCount` may be omitted if revealing the count is restricted.

## 6. Evidence coverage DTO

```ts
type EvidenceCoverageDTO = {
  percent: number;
  state: "GOOD" | "PARTIAL" | "INSUFFICIENT";
  supportedWeight: number;
  totalWeight: number;
  labelKey: string;
  explanationKey: string;
};
```

UI presents label + percent + explanation, never percent alone.

## 7. Match DTO

```ts
type ComparableProjectMatchDTO = {
  project: AuthorizedProjectSummaryDTO;
  rank: number;
  score: number;
  band: "STRONG" | "RELEVANT" | "PARTIAL" | "BROADER";
  evidenceCoverage: EvidenceCoverageDTO;
  strongestFactors: FactorSummaryDTO[];
  differences: DifferenceDTO[];
  unknowns: UnknownFactorDTO[];
  economics: AuthorizedEconomicsSummaryDTO;
  warnings: ResultWarningDTO[];
  evidenceChips: EvidenceChipDTO[];
  evidenceCount?: number;
  actions: Array<"OPEN_PROJECT" | "COMPARE" | "OPEN_EVIDENCE">;
};
```

An omitted evidence count differs from zero and may reflect non-disclosure.

## 8. Factor DTOs

```ts
type SimilarityFactorKey =
  | "SUBTYPE"
  | "SCOPE_OVERLAP"
  | "AREA_SIMILARITY"
  | "COMMERCIAL_CATEGORY_OVERLAP"
  | "MATERIAL_CATEGORY_OVERLAP"
  | "SUPPLIER_OVERLAP"
  | "COMPLETION_RECENCY"
  | "LOCATION_PROXIMITY";

type FactorSummaryDTO = {
  key: SimilarityFactorKey;
  state: "KNOWN";
  labelKey: string;
  summaryKey: string;
  currentDisplay: string;
  candidateDisplay: string;
  contribution: number;
};

type FactorDetailDTO = {
  key: SimilarityFactorKey;
  state: "KNOWN" | "UNKNOWN" | "NOT_APPLICABLE";
  labelKey: string;
  currentValue?: JsonValue;
  candidateValue?: JsonValue;
  normalizedScore: DecimalString;
  weight: DecimalString;
  contribution: DecimalString;
  evidenceReferenceIds: string[];
  explanationKey: string;
};
```

The score-detail endpoint/view must reconcile factor contributions to the stored result.

## 9. Difference/unknown DTOs

```ts
type DifferenceDTO = {
  key: string;
  dimension: string;
  severity: "MATERIAL" | "NOTABLE" | "INFORMATIONAL";
  state: "KNOWN_DIFFERENCE" | "INSUFFICIENT_EVIDENCE";
  currentDisplay?: string;
  historicalDisplay?: string;
  labelKey: string;
  explanationKey: string;
  claimId?: string;
};

type UnknownFactorDTO = {
  key: string;
  labelKey: string;
  explanationKey: string;
};
```

Unknown is never rendered as confirmed mismatch.

## 10. Commercial value DTO

```ts
type CommercialValueState =
  | "VALUE"
  | "UNKNOWN"
  | "NOT_APPLICABLE"
  | "RESTRICTED"
  | "CONFLICTED"
  | "INSUFFICIENT";

type CommercialObservationDTO = {
  state: CommercialValueState;
  observationType?:
    | "QUOTED_PRICE"
    | "SUPPLIER_OFFER"
    | "FORECAST_DIRECT_COST"
    | "RECONCILED_ACTUAL_COST";
  authorityState?:
    | "OBSERVED"
    | "HUMAN_REVIEWED"
    | "APPROVED_COMMERCIAL"
    | "RECONCILED_ACTUAL"
    | "SUPERSEDED"
    | "CONFLICTED";
  money?: MoneyDTO;
  normalized?: {
    money: MoneyDTO;
    per: QuantityDTO;
  };
  freshness?: "CURRENT" | "HISTORICAL" | "STALE";
  effectiveAt?: ISODateTime;
  validUntil?: ISODateTime;
  claimId?: string;
  labelKey: string;
  warningCodes: string[];
};
```

`state: RESTRICTED` contains no hidden amount, range, source ID, or masked digits.

## 11. Economics summary DTO

```ts
type AuthorizedEconomicsSummaryDTO = {
  quoted?: CommercialObservationDTO;
  forecast?: CommercialObservationDTO;
  actual?: CommercialObservationDTO;
  supplierOffer?: CommercialObservationDTO;
  categoryFindings: CategoryFindingDTO[];
  overallSufficiency: "STRONG" | "PARTIAL" | "INSUFFICIENT" | "RESTRICTED";
};

type CategoryFindingDTO = {
  categoryId: string;
  categoryName: LocalizedNameDTO;
  findingState: "VARIANCE" | "ALIGNED" | "INSUFFICIENT" | "CONFLICTED" | "RESTRICTED";
  variancePercent?: DecimalString;
  basisObservationType?: "QUOTED_PRICE" | "RECONCILED_ACTUAL_COST";
  eligibleObservationCount?: number;
  requiredObservationCount?: number;
  claimId?: string;
  explanationKey: string;
};
```

Lighting’s actual finding is `INSUFFICIENT` with 2/3 for authorized users.

## 12. Comparison table DTO

```ts
type ComparisonTableDTO = {
  columns: Array<{
    id: string;
    kind: "CURRENT" | "HISTORICAL";
    project: AuthorizedProjectSummaryDTO;
  }>;
  groups: Array<{
    key: "CONTEXT" | "SCOPE" | "COMMERCIAL" | "PROGRAMME" | "EVIDENCE";
    labelKey: string;
    rows: ComparisonRowDTO[];
  }>;
};

type ComparisonRowDTO = {
  key: string;
  labelKey: string;
  cells: Record<string, ComparisonCellDTO>;
};

type ComparisonCellDTO =
  | { state: "VALUE"; display: string; claimId?: string; emphasis?: "PRIMARY" | "WARNING" | "NEUTRAL" }
  | { state: "UNKNOWN"; explanationKey: string }
  | { state: "NOT_APPLICABLE"; explanationKey: string }
  | { state: "RESTRICTED"; explanationKey: string }
  | { state: "CONFLICTED"; claimId: string; explanationKey: string }
  | { state: "INSUFFICIENT"; claimId?: string; eligibleCount?: number; requiredCount: number; explanationKey: string };
```

Zero appears as `VALUE`, never empty.

## 13. Structured synthesis DTO

```ts
type StructuredSynthesisDTO = {
  whatHistorySuggests: SynthesisItemDTO[];
  importantDifferences: SynthesisItemDTO[];
  evidenceGaps: SynthesisItemDTO[];
  recommendedNextStep?: SynthesisItemDTO;
};

type SynthesisItemDTO = {
  id: string;
  labelKey: string;
  textKey: string;
  params: Record<string, string | number>;
  claimIds: string[];
  severity?: "INFO" | "REVIEW" | "WARNING";
};
```

Deterministic items are localized via catalogs/params. Optional model text is separate.

## 14. Optional explanation DTO

```ts
type OptionalExplanationStateDTO =
  | { state: "NOT_REQUESTED" }
  | { state: "PENDING" }
  | { state: "AVAILABLE"; text: string; citedClaimIds: string[] }
  | { state: "UNAVAILABLE"; errorCode: string; retryable: boolean };
```

The `AVAILABLE` explanation contains no authoritative values not already present in authorized claims.

## 15. Evidence chip and bundle DTOs

```ts
type EvidenceChipDTO = {
  claimId: string;
  label: string;
  sourceType: string;
  condition?: "STALE" | "CONFLICTED" | "SUPERSEDED" | "INSUFFICIENT";
};

type AuthorizedEvidenceBundleDTO = {
  version: "evidence-bundle.v1";
  runId: string;
  claim: AuthorizedClaimDTO;
  authority: AuthoritySummaryDTO;
  sources: AuthorizedEvidenceSourceDTO[];
  calculation?: AuthorizedCalculationTraceDTO;
  conflict?: AuthorizedConflictDTO;
  exclusions?: SafeExclusionSummaryDTO;
};

type AuthorizedClaimDTO = {
  id: string;
  labelKey: string;
  valueDisplay: string;
  observationType?: string;
  authorityState?: string;
  warningCodes: string[];
};

type AuthorizedEvidenceSourceDTO = {
  evidenceReferenceId: string;
  sourceType: string;
  sourceId: string;
  versionLabel?: string;
  title: string;
  effectiveAt?: ISODateTime;
  validUntil?: ISODateTime;
  locatorDisplay: string;
  supportsDisplay: string;
  observationType?: string;
  authorityState: string;
  classificationLabelKey: string;
  freshness?: "CURRENT" | "HISTORICAL" | "STALE";
  condition?: "ACTIVE" | "SUPERSEDED" | "CONFLICTED";
  preview?: AuthorizedSourcePreviewDTO;
  openObjectHref?: string;
};
```

No raw storage URL or unauthorized count appears.

## 16. Conflict DTO

```ts
type AuthorizedConflictDTO = {
  id: string;
  fieldLabelKey: string;
  impact: "EXCLUDE_FROM_AGGREGATE" | "WARN_ONLY";
  items: Array<{
    sourceId: string;
    versionLabel?: string;
    valueDisplay: string;
    authorityState: string;
    effectiveAt?: ISODateTime;
  }>;
  resolutionCapability: "NONE" | "VIEW_ONLY" | "CAN_RESOLVE_FUTURE";
  explanationKey: string;
};
```

v0.1 never exposes a resolution mutation.

## 17. Proposed action DTO

```ts
type ProposedActionDTO = {
  id: string;
  status: "DRAFT";
  type: "INTERNAL_REVIEW";
  project: AuthorizedProjectSummaryDTO;
  comparisonRunId: string;
  title: string;
  rationale: string;
  mandatoryStatements: string[];
  suggestedAssignee?: AuthorizedAssigneeDTO;
  allowedAssignees: AuthorizedAssigneeDTO[];
  suggestedDueDate?: ISODate;
  evidence: EvidenceChipDTO[];
  evidenceCount: number;
  expiresAt?: ISODateTime;
  policyVersion: "INTERNAL-REVIEW-ACTION-1.0";
};
```

`mandatoryStatements` must be present in the confirmed rationale or represented as immutable evidence-gap fields.

Viewer receives no ProposedActionDTO.

## 18. Create action request/response

```ts
type CreateInternalReviewActionRequest = {
  proposedActionId: string;
  title: string;
  rationale: string;
  assigneeMembershipId?: string;
  dueDate?: ISODate;
  confirmation: true;
  idempotencyKey: string;
};

type CreateInternalReviewActionResponse =
  | { kind: "CREATED"; receipt: ActionReceiptDTO }
  | { kind: "ALREADY_CREATED"; receipt: ActionReceiptDTO }
  | { kind: "STALE"; errorCode: "ACTION_STALE"; refreshRunHref: string }
  | { kind: "NOT_AUTHORIZED"; errorCode: "ACTION_NOT_AUTHORIZED" }
  | { kind: "ASSIGNEE_INVALID"; errorCode: "ACTION_ASSIGNEE_INVALID"; allowedAssignees: AuthorizedAssigneeDTO[] }
  | { kind: "FAILED"; errorCode: "ACTION_CREATE_FAILED"; requestId: string; retryable: boolean };

type ActionReceiptDTO = {
  version: "action-receipt.v1";
  actionId: string;
  businessKey: string;
  title: string;
  project: AuthorizedProjectSummaryDTO;
  assignee?: AuthorizedAssigneeDTO;
  dueDate?: ISODate;
  status: "OPEN";
  originComparisonRunId: string;
  comparisonPolicyVersion: string;
  evidenceCount: number;
  createdAt: ISODateTime;
  auditEventId: string;
  viewActionHref: string;
  returnToComparisonHref: string;
};
```

## 19. UI state machine

```text
PROJECT_LOADING
  → PROJECT_READY
  → COMPARISON_IDLE
  → COMPARISON_RUNNING
  → COMPARISON_SUCCESS | CONTEXT_INCOMPLETE | NO_ELIGIBLE_HISTORY | COMPARISON_FAILED

COMPARISON_SUCCESS
  → evidence panel states
  → optional explanation states
  → PROPOSED_ACTION_READY (authorized only)

PROPOSED_ACTION_READY
  → PROPOSED_ACTION_EDITED
  → ACTION_CONFIRMING
  → ACTION_CREATED | ACTION_STALE_REJECTED | ACTION_PERMISSION_REJECTED |
    ACTION_ASSIGNEE_REJECTED | ACTION_SERVICE_FAILED
```

A run may transition from `COMPARISON_SUCCESS` to `COMPARISON_STALE` after revalidation.

## 20. Client-state contract

Safe client state may include:

- current run ID;
- selected comparable project IDs;
- selected claim ID/evidence panel mode;
- table row focus;
- optional explanation UI state;
- unsaved action draft fields;
- locale route.

Client state must not include:

- trusted organization/role/capabilities;
- raw hidden economics;
- unrestricted evidence bodies;
- database/model credentials;
- business success without receipt;
- authority transitions.

Unsaved action drafts may use session memory/storage if bounded and clearly not business state. They are cleared after receipt/cancel/expiry/access loss.

## 21. Route-state restoration

On route/load:

1. resolve RuntimeContext;
2. load project;
3. if `run` present, authorize/load permission-specific result;
4. validate `selected` against result;
5. validate `claim`/evidence selection if present;
6. render read-only stale state when applicable;
7. never trust cached client DTO after permission change.

## 22. Versioning

Each DTO contains a version string. Breaking changes require:

- version increment;
- route/client compatibility update;
- eval/fixture update;
- migration strategy for persisted result snapshots where required.

## 23. Acceptance criteria

- every accepted UX state maps to an explicit DTO outcome;
- every commercial value carries state/type/authority or explicit restriction;
- evidence panel can render from AuthorizedEvidenceBundleDTO;
- Viewer cannot infer restricted values/sources/counts;
- optional explanation is independent;
- action response distinguishes stale, denied, invalid assignee, duplicate, and failure;
- zero/unknown/insufficient/conflicted/restricted remain distinct;
- route restoration reauthorizes every run/evidence read;
- `zh-TW`/`en` rendering uses the same semantic DTOs.