# Comparable Project Intelligence — Service Contract

**Status:** Implementation contract for review  
**Policy versions:** `CPI-ELIGIBILITY-1.0`, `CPI-SIM-1.0`, `EVIDENCE-AUTHORITY-1.0`

## 1. Purpose

Define the deterministic services that answer:

> Have we done something like this before?

The service contract must produce a complete structured result without a language model.

## 2. Public application use case

```ts
interface RunComparableProjectAnalysis {
  execute(
    ctx: RuntimeContext,
    input: RunComparableProjectInput
  ): Promise<RunComparableProjectOutcome>;
}

type RunComparableProjectInput = {
  activeProjectId: string;
  activeQuoteVersionId?: string;
  selectedCandidateIds?: string[];
  requestedPolicyVersion?: "CPI-SIM-1.0";
};

type RunComparableProjectOutcome =
  | { kind: "COMPLETE"; result: ComparableProjectResult }
  | { kind: "CONTEXT_INCOMPLETE"; missing: MissingContextField[] }
  | { kind: "NO_ELIGIBLE_HISTORY"; safeExclusionSummary: SafeExclusionSummary }
  | { kind: "UNAVAILABLE"; errorCode: SafeComparisonErrorCode; requestId: string };
```

Organization, user, role, locale, and permissions are never accepted as trusted input fields.

## 3. Service composition

```text
ComparableProjectOrchestrator
  ├─ ActiveProjectContextService
  ├─ HistoricalEligibilityService
  ├─ StructuredSimilarityService
  ├─ HistoricalEconomicsService
  ├─ ComparisonEvidenceService
  ├─ StructuredSynthesisService
  ├─ ProposedActionService
  └─ ComparisonRunRepository
```

All services receive authorized domain snapshots, not raw browser state.

## 4. Active project context

```ts
type ActiveProjectComparisonContext = {
  organizationId: string;
  project: {
    id: string;
    businessKey: string;
    name: LocalizedName;
    comparisonClass: string;
    subtype: string;
    status: ProjectStatus;
    location: LocationValue;
    area: QuantityValue;
    programmeWeeks?: number;
    completionOrTargetDate?: string;
    recordVersion: number;
  };
  scopeCategoryIds: string[];
  commercialCategoryIds: string[];
  materialCategoryIds: string[];
  supplierIds: string[];
  activeQuote?: QuoteVersionSnapshot;
  activeForecast?: ForecastCostSnapshot;
  evidenceCoverage: EvidenceCoverage;
  sourceFingerprint: string;
};
```

### Mandatory current-project fields

- comparison class;
- subtype;
- area quantity and unit;
- scope categories;
- commercial comparison categories;
- location city;
- project metadata authority at least `HUMAN_REVIEWED`;
- active organization and authorization.

Missing mandatory fields return `CONTEXT_INCOMPLETE`; they do not receive default values from a model.

## 5. Eligibility service

```ts
interface HistoricalEligibilityService {
  evaluate(
    ctx: RuntimeContext,
    active: ActiveProjectComparisonContext,
    candidates: HistoricalProjectSnapshot[]
  ): EligibilityBatchResult;
}

type EligibilityDecision = {
  projectId: string;
  eligible: boolean;
  reasonCodes: EligibilityReasonCode[];
  similarityDimensionsAvailable: SimilarityDimension[];
  economicsDimensionsAvailable: EconomicsDimension[];
};
```

### Eligibility checks

Evaluation order:

1. organization scope;
2. record existence and access;
3. completed/closed status;
4. same `comparisonClass`;
5. compatible currency/unit;
6. mandatory structured fields;
7. project metadata authority;
8. duplicate/test/deleted/policy exclusion;
9. evidence coverage threshold for primary ranking.

### Reason codes

Internal reason codes may include:

```text
OTHER_ORGANIZATION
NOT_AUTHORIZED
NOT_COMPLETED
WRONG_COMPARISON_CLASS
INCOMPATIBLE_UNIT
INCOMPATIBLE_CURRENCY
MISSING_SUBTYPE
MISSING_AREA
MISSING_SCOPE
MISSING_COMMERCIAL_CATEGORIES
MISSING_COMPLETION_DATE
INSUFFICIENT_METADATA_AUTHORITY
DUPLICATE_RECORD
TEST_RECORD_NOT_ALLOWED
DELETED
POLICY_EXCLUDED
```

The user-facing response never exposes unauthorized candidate existence or exact counts. `SafeExclusionSummary` aggregates only disclosure-safe categories.

## 6. Similarity service

```ts
interface StructuredSimilarityService {
  score(
    active: ActiveProjectComparisonContext,
    candidate: EligibleHistoricalProject,
    policy: SimilarityPolicy
  ): CandidateSimilarityResult;
}

type CandidateSimilarityResult = {
  candidateProjectId: string;
  policyVersion: "CPI-SIM-1.0";
  score: number;
  band: "STRONG" | "RELEVANT" | "PARTIAL" | "BROADER";
  evidenceCoverage: number;
  factors: SimilarityFactorResult[];
  strongestPositiveFactors: SimilarityFactorKey[];
  importantDifferences: Difference[];
  unknowns: UnknownFactor[];
};
```

### Factor keys and weights

```ts
const CPI_SIM_1_0 = {
  subtype: 15,
  scopeOverlap: 25,
  areaSimilarity: 20,
  commercialCategoryOverlap: 15,
  materialCategoryOverlap: 10,
  supplierOverlap: 5,
  completionRecency: 5,
  locationProximity: 5,
} as const;
```

### Factor result

```ts
type SimilarityFactorResult = {
  key: SimilarityFactorKey;
  state: "KNOWN" | "UNKNOWN" | "NOT_APPLICABLE";
  currentValue?: JsonValue;
  candidateValue?: JsonValue;
  normalizedScore: number;
  weight: number;
  contribution: number;
  evidenceReferenceIds: string[];
  explanationKey: string;
};
```

### Factor functions

#### Subtype

```text
exact subtype = 1.0
configured adjacent subtype = 0.6
otherwise = 0.0
```

#### Set overlaps

Scope, commercial categories, material categories, and suppliers:

```text
Jaccard = intersection / union
```

Canonical IDs only.

If both optional sets are empty, state is `UNKNOWN`, not `1.0`.

#### Area

```text
max(0, 1 - abs(ln(candidate / current)) / ln(2))
```

Quantities must be positive and normalized to compatible units.

#### Recency

```text
max(0, 1 - monthsSinceCompletion / 60)
```

The run snapshot date, not browser current time, is used.

#### Location

```text
same district = 1.0
same city = 0.6
configured adjacent region = 0.3
otherwise = 0.0
```

### Rounding

- factor normalized scores calculated at high precision;
- contributions retained at a defined decimal precision;
- displayed total rounded to whole score;
- stored trace preserves enough precision to reconcile the displayed total;
- policy calculation version records rounding behavior.

### Evidence coverage

```text
known weight / total weight × 100
```

Primary match requires ≥75% known weighted-factor coverage.

### Bands

```text
80–100 STRONG
65–79 RELEVANT
50–64 PARTIAL
<50 BROADER
```

### Tie behavior

Scores within two points share equivalent match-band treatment.

Display ordering:

1. score descending;
2. evidence coverage descending for scores within two points;
3. completion date descending;
4. stable business key.

Stable key is a display tie-breaker only.

## 7. Candidate selection

```ts
type RankedCandidateSet = {
  primary: CandidateSimilarityResult[]; // max 6
  broader: CandidateSimilarityResult[]; // bounded optional
};
```

- primary set includes score ≥50 and coverage ≥75%;
- below-50 candidates appear only under broader matches when product policy allows;
- default table selection is top three primary matches;
- selected candidate IDs are validated against the run’s eligible result set.

## 8. Historical economics service

```ts
interface HistoricalEconomicsService {
  assemble(
    ctx: RuntimeContext,
    active: ActiveProjectComparisonContext,
    ranked: RankedCandidateSet,
    policy: EvidenceAuthorityPolicy
  ): HistoricalEconomicsResult;
}
```

### Observation DTO

```ts
type AmountObservation = {
  id: string;
  projectId: string;
  observationType:
    | "QUOTED_PRICE"
    | "SUPPLIER_OFFER"
    | "FORECAST_DIRECT_COST"
    | "RECONCILED_ACTUAL_COST";
  authorityState: AuthorityState;
  amount: DecimalString;
  currency: string;
  unitBasis?: QuantityValue;
  normalizedAmount?: DecimalString;
  effectiveAt?: string;
  validUntil?: string;
  freshness: "CURRENT" | "HISTORICAL" | "STALE";
  evidenceReferenceIds: string[];
  warnings: EconomicsWarningCode[];
};
```

### Actual-cost eligibility

The service enforces ADR-002.

It returns explicit internal exclusion decisions for:

- quote-only;
- forecast-only;
- supplier offer;
- not completed;
- wrong authority;
- superseded;
- conflicted;
- missing taxonomy;
- incompatible unit/currency;
- missing evidence;
- unauthorized.

Unauthorized observations are not included in result/exclusion DTOs sent to users.

### Sufficiency

- overall actual range: ≥3 eligible completed projects;
- category actual range: ≥3 eligible line observations;
- otherwise `INSUFFICIENT_ACTUAL_COST_EVIDENCE`;
- minimum count is not described as statistical confidence.

### Aggregates

For v0.1:

- median is the primary center statistic;
- range may use minimum/maximum or approved percentile method only when versioned in calculation policy;
- all observations and exclusions are preserved in trace;
- quoted and actual aggregates are separate;
- normalized per-m² values use authoritative area units;
- no escalation to current market price is inferred.

### Hero findings contract

The fixture/evals must support:

- Xinyi quoted price per m² ~7% above top-three quoted median;
- Xinyi forecast direct cost per m² ~6% above top-three actual median;
- imported stone ~18% above eligible actual median;
- lighting ~9% above quoted median and actual-cost abstention with two observations;
- millwork ~2% alignment;
- signage ~5% below quote history with material scope warning;
- programme difference without quantified cost cause.

Tolerance is defined in eval fixtures, not UI copy.

## 9. Evidence service

```ts
interface ComparisonEvidenceService {
  build(
    ctx: RuntimeContext,
    input: EvidenceAssemblyInput
  ): Promise<ComparisonEvidenceResult>;
}
```

### Responsibilities

- verify source access;
- bind exact claims/values to EvidenceReferences;
- include observation/authority/freshness;
- identify supersession/conflict;
- construct factor evidence;
- construct calculation traces;
- omit/redact inaccessible content before result/model use;
- return stable claim and bundle IDs.

### Claim contract

```ts
type StructuredClaim = {
  id: string;
  kind: ClaimKind;
  subject: { type: string; id: string };
  value: JsonValue;
  unit?: string;
  observationType?: ObservationType;
  authorityState?: AuthorityState;
  evidenceReferenceIds: string[];
  calculationTrace?: CalculationTrace;
  warningCodes: string[];
};
```

A source ID alone is not sufficient. The source must support the exact claim.

## 10. Difference service

Differences are deterministic and typed.

```ts
type Difference = {
  key: string;
  dimension: SimilarityDimension | EconomicsDimension;
  severity: "MATERIAL" | "NOTABLE" | "INFORMATIONAL";
  currentValue?: JsonValue;
  historicalValue?: JsonValue;
  state: "KNOWN_DIFFERENCE" | "UNKNOWN" | "INSUFFICIENT_EVIDENCE";
  evidenceReferenceIds: string[];
  explanationKey: string;
};
```

A difference is not a cause.

Example:

- `programmeWeeks: 16 versus historical 18–22` is a known difference;
- `programmePremium` remains unknown because no authority supports a value.

## 11. Structured synthesis service

```ts
interface StructuredSynthesisService {
  synthesize(input: VerifiedComparisonData): StructuredSynthesis;
}

type StructuredSynthesis = {
  whatHistorySuggests: SynthesisItem[];
  importantDifferences: SynthesisItem[];
  evidenceGaps: SynthesisItem[];
  recommendedNextStep?: SynthesisItem;
};
```

Synthesis uses rule/templates over verified claims.

It must not:

- judge the quote “wrong” or “overpriced”;
- infer supplier misconduct;
- quantify unsupported schedule premium;
- call historical values current market rates;
- suggest automatic price change.

The optional model may rewrite these items concisely but cannot add material facts.

## 12. Proposed action service

```ts
interface ProposedActionService {
  proposeInternalReview(
    ctx: RuntimeContext,
    run: ComparisonRun,
    synthesis: StructuredSynthesis
  ): ProposedAction | null;
}
```

It proposes only when:

- user has proposal capability;
- run is complete/current;
- material review finding exists;
- required evidence is accessible;
- no policy prohibits action.

Default hero proposal follows ADR-004.

The proposal does not create Action state.

## 13. Result contract

```ts
type ComparableProjectResult = {
  run: {
    id: string;
    status: "COMPLETE";
    generatedAt: string;
    policyVersion: "CPI-SIM-1.0";
    authorityPolicyVersion: "EVIDENCE-AUTHORITY-1.0";
    calculationVersion: string;
    stale: false;
  };
  activeContext: ActiveProjectComparisonContextDTO;
  summary: {
    eligibleMatchCount: number;
    actualCostEligibleProjectCount: number;
    evidenceCoverage: number;
    sufficiency: EvidenceSufficiency;
    factorsUsed: SimilarityFactorKey[];
    missingOptionalContext: string[];
  };
  matches: ComparableProjectMatchDTO[];
  defaultSelectedProjectIds: string[];
  comparisonTable: ComparisonTableDTO;
  claims: StructuredClaim[];
  synthesis: StructuredSynthesis;
  proposedAction?: ProposedActionDTO;
};
```

### Match DTO

```ts
type ComparableProjectMatchDTO = {
  project: AuthorizedProjectSummary;
  rank: number;
  score: number;
  band: MatchBand;
  evidenceCoverage: number;
  strongestFactors: FactorSummary[];
  differences: Difference[];
  unknowns: UnknownFactor[];
  economics: AuthorizedEconomicsSummary;
  warnings: WarningDTO[];
  topEvidence: EvidenceChipDTO[];
  evidenceCount: number;
};
```

No raw persistence object is sent to the client.

## 14. Comparison table contract

The table is generated from selected candidates already in the run.

```ts
type ComparisonTableDTO = {
  columns: ComparisonColumn[];
  groups: Array<{
    key: "CONTEXT" | "SCOPE" | "COMMERCIAL" | "PROGRAMME" | "EVIDENCE";
    rows: ComparisonRow[];
  }>;
};
```

Cell states:

```text
VALUE
UNKNOWN
NOT_APPLICABLE
RESTRICTED
CONFLICTED
INSUFFICIENT
```

Zero is a value, not an empty/unknown state.

## 15. Persistence and immutability

The orchestrator persists:

- IntelligenceRun;
- ComparisonRun;
- candidate/factor rows;
- claims and evidence bindings;
- immutable result snapshot;
- input/evidence/permission fingerprints.

Past runs do not silently recompute. A refresh creates a new run and may mark the old run stale.

## 16. Staleness

Material staleness triggers:

- active quote version changed;
- active forecast version changed;
- project comparison profile changed;
- policy/calculation version changed;
- candidate authority/conflict/supersession changed;
- evidence access changed;
- user permission scope changed materially.

Stale runs remain inspectable if authorized but cannot create actions.

## 17. Redaction

Before the result is persisted/returned for a Viewer or other restricted role:

- sensitive amounts are omitted or replaced with explicit `RESTRICTED` cell state;
- hidden source IDs/titles/counts are omitted;
- factors not commercially sensitive may remain;
- proposedAction is omitted;
- permission-restricted actual-cost observations are never sent to optional model context.

Prefer creating a role-specific authorized result view from canonical run data. If canonical run persistence contains sensitive data, access checks are required on every read.

## 18. Error contract

```ts
type SafeComparisonErrorCode =
  | "PROJECT_UNAVAILABLE"
  | "PROJECT_CONTEXT_INCOMPLETE"
  | "COMPARISON_NO_ELIGIBLE_HISTORY"
  | "COMPARISON_FAILED";
```

Internal diagnostics may record more specific codes. User errors never expose inaccessible records or raw infrastructure messages.

## 19. Performance contract

- batch-load historical candidates and comparison facets;
- batch-load relevant commercial versions/lines;
- build evidence for selected/primary results without N+1 queries;
- persist result once per run;
- evidence panel reads stored bundles/indexed sources;
- warm deterministic comparison p95 ≤2.0 s;
- cold p95 ≤3.0 s at fixture target;
- optional explanation not included in deterministic SLA.

## 20. Canonical evals

### Ranking

Xinyi expected order:

1. Neihu 88;
2. Zhongshan 81;
3. Nanjing 79;
4. Daan 71;
5. Songshan 69;
6. Banqiao 63.

### Factor reconciliation

Every candidate’s factor contributions reconcile to its score within calculation tolerance.

### Authority

- quote-only cannot enter actual aggregate;
- lighting actual range abstains with two observations;
- conflict excluded;
- superseded excluded;
- stale offer historical only;
- Viewer actuals redacted.

### Non-disclosure

Cross-organization and inaccessible candidate/evidence IDs never appear in output, counts, logs returned to user, or optional model context.

### Resilience

Optional explanation failure does not change result or action eligibility.

## 21. Acceptance criteria

- deterministic for identical authorized inputs/policies;
- ranking and explanation reconcile exactly;
- eligibility precedes scoring;
- similarity and economics authority are independent;
- quoted/forecast/offer/actual never blend;
- claim evidence is exact and accessible;
- insufficiency/conflict/stale states are typed;
- result can be reopened by run ID;
- stale run cannot create Action;
- optional model cannot alter structured result;
- canonical hero findings pass;
- service meets performance and tenant-boundary tests.