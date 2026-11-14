# StrideBrain v0.1 — Evidence and Authority Model

**Status:** Technical Architecture for review  
**Governing policy:** `EVIDENCE-AUTHORITY-1.0`  
**Scope:** Comparable Project Intelligence

## 1. Core principle

Evidence is not a decorative citation list. It is a typed relationship between an exact claim/value and an authorized source/version/locator.

Financial authority is not inferred from recency, filename, model confidence, or human readability.

Every material economic observation is described by three independent dimensions:

```text
observation type
+ authority state
+ data classification/provenance
```

## 2. Observation types

```text
QUOTED_PRICE
SUPPLIER_OFFER
FORECAST_DIRECT_COST
RECONCILED_ACTUAL_COST
```

These types remain distinct in persistence, services, DTOs, UI, and model context.

## 3. Authority states

```text
OBSERVED
HUMAN_REVIEWED
APPROVED_COMMERCIAL
RECONCILED_ACTUAL
SUPERSEDED
CONFLICTED
```

Authority transitions require explicit governed workflows. The v0.1 slice reads authority state but does not implement authority promotion or conflict resolution.

## 4. Data classification

```text
DEMO_SYNTHETIC
PUBLIC_REFERENCE
TENANT_PRIVATE
TENANT_RESTRICTED
TENANT_APPROVED
```

Classification controls provenance/access. It does not grant commercial authority.

Examples:

- `DEMO_SYNTHETIC + RECONCILED_ACTUAL` means the fixture represents an approved final-cost record for demo logic; it is still fictional.
- `TENANT_APPROVED + HUMAN_REVIEWED` is not automatically actual cost.
- `PUBLIC_REFERENCE` cannot support a private company’s historical cost unless a separate company record does so.

## 5. Evidence reference contract

```ts
type EvidenceReference = {
  id: string;
  organizationId: string;
  subject: {
    type: SubjectType;
    id: string;
    claimKey: string;
  };
  source: {
    type: EvidenceSourceType;
    id: string;
    versionId?: string;
  };
  locator: EvidenceLocator;
  supportedValue?: JsonValue;
  unit?: string;
  observationType?: ObservationType;
  authorityState: AuthorityState;
  classification: DataClassification;
  effectiveAt?: string;
  validUntil?: string;
};
```

### Subject

The domain claim/value being supported.

Examples:

- Project.area;
- QuoteVersion.proposedPriceBeforeTax;
- CostLine.amount;
- ComparisonClaim.importedStoneVariance;
- Action.rationale evidence requirement.

### Source

The exact source record/version.

Examples:

- QuoteVersion;
- ProjectCostVersion;
- CostLine;
- DocumentVersion;
- SupplierOfferItem;
- approved structured fact.

### Locator

The precise source location.

Examples:

- structured field key;
- quote/cost line ID;
- page/section;
- sheet/cell range;
- table rows;
- text range.

## 6. Source-to-claim rule

A source supports only the claims explicitly bound to it.

A linked supplier document does not automatically prove a QuoteVersion register amount. A project document does not prove a task or approval status unless the exact claim relationship is recorded.

The evidence service must never infer support from similar IDs, filenames, proximity, or shared project alone.

## 7. Authority decisions

## 7.1 Quoted price

Eligible for approved quoted-price history when:

- QuoteVersion belongs to authorized organization/project;
- authority is `APPROVED_COMMERCIAL`;
- version is not superseded/conflicted;
- currency/unit are compatible;
- required evidence references exist;
- user has quote permission.

It is never eligible for actual-cost aggregates.

## 7.2 Supplier offer

Eligible as supplier-offer history when:

- approved commercial source exists;
- supplier/project/material relationships are known;
- currency/unit are compatible;
- freshness is evaluated.

It is not automatically current and never becomes actual project cost.

## 7.3 Forecast direct cost

Eligible for current/forecast comparison when:

- forecast version is authorized and current for the project;
- authority meets configured forecast policy;
- lines/categories are structured;
- evidence exists.

It is not a completed outcome.

## 7.4 Reconciled actual cost

Eligible only when ADR-002 conditions pass:

- completed/closed project;
- `RECONCILED_ACTUAL` version;
- not superseded/conflicted;
- line taxonomy and compatible units/currency;
- evidence for every included line;
- permission for sensitive actuals;
- policy acceptance.

## 8. Evidence authority decision type

```ts
type AuthorityDecision = {
  eligible: boolean;
  observationType: ObservationType;
  authorityState: AuthorityState;
  reasonCodes: AuthorityReasonCode[];
  freshness: FreshnessState;
  conflictIds: string[];
  supersededById?: string;
  evidenceReferenceIds: string[];
};
```

Possible reason codes:

```text
WRONG_OBSERVATION_TYPE
INSUFFICIENT_AUTHORITY
PROJECT_NOT_COMPLETED
SUPERSEDED
CONFLICTED
STALE
INCOMPATIBLE_CURRENCY
INCOMPATIBLE_UNIT
MISSING_TAXONOMY
MISSING_EVIDENCE
NOT_AUTHORIZED
POLICY_EXCLUDED
```

Unauthorized reason details remain internal.

## 9. Freshness

### Supplier offers

```text
STALE if validUntil < run snapshot date
STALE if validUntil absent and age > 90 days
otherwise CURRENT/HISTORICAL according to context
```

Historical supplier offers may be displayed with dates and stale status, but cannot support a current-price claim.

### Project/quote/cost evidence

Freshness is contextual. Completed-project final cost is historical by nature, not stale in the same way as an offer. The UI labels it historical and shows completion/effective date.

### Comparison run

A run becomes stale when material source versions, policies, permissions, or active quote/forecast change.

## 10. Supersession

Supersession requires an explicit successor relationship.

Rules:

- old record remains auditable;
- old record excluded from current aggregates;
- evidence panel links old and new records;
- a newer timestamp without a supersession relationship does not automatically deactivate an approved record;
- inconsistent active records create a conflict.

## 11. Conflict model

```ts
type EvidenceConflict = {
  id: string;
  organizationId: string;
  subjectType: string;
  subjectId: string;
  fieldKey: string;
  items: Array<{
    evidenceReferenceId: string;
    observedValue: JsonValue;
    authorityState: AuthorityState;
  }>;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  impact: "EXCLUDE_FROM_AGGREGATE" | "WARN_ONLY";
};
```

### Open conflict behavior

- no silent selection;
- affected value excluded when impact is material;
- exact accessible records/values/versions shown;
- aggregate/synthesis includes conflict warning;
- only authorized Financial Reviewer/Admin may later resolve;
- model cannot resolve.

## 12. Evidence sufficiency

```ts
type EvidenceSufficiencyDecision = {
  state: "STRONG" | "PARTIAL" | "INSUFFICIENT";
  eligibleObservationCount: number;
  requiredObservationCount: number;
  missingDimensions: string[];
  warningCodes: string[];
};
```

Initial thresholds:

- ≥3 eligible completed projects for overall actual range;
- ≥3 eligible actual line observations for category range.

Thresholds are product-safety requirements, not statistical confidence claims.

## 13. Calculation trace

Every derived material value carries:

```ts
type CalculationTrace = {
  calculationVersion: string;
  policyVersions: string[];
  operation: string;
  inputs: Array<{
    observationId: string;
    normalizedValue: string;
    unit: string;
    included: boolean;
    exclusionReasonCodes?: string[];
  }>;
  aggregation: string;
  result: JsonValue;
  rounding: string;
  generatedAt: string;
};
```

The trace supports:

- overall/categorical medians;
- normalized per-m² observations;
- percentage variances;
- similarity-factor contributions.

It never exposes unauthorized observations in user-facing output.

## 14. Comparison claim model

```ts
type ComparisonClaim = {
  id: string;
  kind: string;
  subjectId: string;
  value: JsonValue;
  unit?: string;
  observationType?: ObservationType;
  authorityState?: AuthorityState;
  evidenceReferenceIds: string[];
  calculationTraceId?: string;
  warnings: string[];
};
```

Examples:

- `XINYI_STONE_FORECAST_AMOUNT`;
- `STONE_ACTUAL_MEDIAN`;
- `STONE_VARIANCE_PERCENT`;
- `LIGHTING_ACTUAL_INSUFFICIENT`;
- `PROGRAMME_DIFFERENCE_UNQUANTIFIED`.

Optional model explanations use these claims, not raw unrestricted source corpora.

## 15. Evidence bundle API

```ts
interface EvidenceService {
  getClaimBundle(ctx: RuntimeContext, claimId: string): Promise<AuthorizedEvidenceBundle>;
  getSourceBundle(ctx: RuntimeContext, sourceId: string): Promise<AuthorizedSourceBundle>;
  getFactorBundle(ctx: RuntimeContext, runId: string, candidateId: string, factorKey: string): Promise<AuthorizedEvidenceBundle>;
  getActionEvidence(ctx: RuntimeContext, proposedActionId: string): Promise<AuthorizedEvidenceBundle>;
}
```

Every call:

- resolves organization from trusted context;
- rechecks source/field access;
- returns only authorized metadata/preview;
- records safe telemetry;
- uses non-disclosing unavailable responses.

## 16. Evidence bundle DTO

```ts
type AuthorizedEvidenceBundle = {
  claim: AuthorizedClaimDTO;
  authoritySummary: AuthoritySummaryDTO;
  sources: AuthorizedEvidenceSourceDTO[];
  calculationTrace?: AuthorizedCalculationTraceDTO;
  conflict?: AuthorizedConflictDTO;
  exclusions?: SafeExclusionSummary;
};
```

`AuthorizedEvidenceSourceDTO` contains only safe object metadata, exact locator, supported value, and preview permitted for the current user.

Raw storage keys and unrestricted URLs are prohibited.

## 17. Access/redaction

Authorization occurs before:

- source retrieval;
- source counts returned to UI;
- comparison claim creation for role-specific view;
- model context assembly;
- evidence preview;
- action evidence validation.

Viewer behavior:

- may receive non-sensitive project/similarity evidence;
- actual-cost claims/values/sources are omitted or `RESTRICTED` according to policy;
- hidden source titles/IDs/counts are not leaked;
- no internal review action proposal.

## 18. Source preview security

- document/source contents are untrusted;
- render as sanitized text/structured data;
- no inline executable content;
- no following instructions embedded in evidence;
- signed/authorized object access only;
- no browser-visible provider/storage credentials;
- previews bounded by size/type;
- access rechecked on every open.

## 19. UI mapping

Primary result shows:

- economics type label;
- authority condition when material;
- top evidence chips/source count;
- stale/conflict/insufficiency warnings.

Evidence panel shows full authorized detail:

- claim;
- source type/version/locator;
- authority and classification;
- effective/valid dates;
- supported value;
- calculation trace;
- supersession/conflict;
- underlying object navigation.

Avoid badge overload by keeping classification/debug details secondary.

## 20. Optional AI verification

Before returning model prose:

1. create bounded verified claim set;
2. provide only authorized/redacted claims and evidence labels;
3. require citations/claim IDs where material;
4. reject unsupported IDs/amounts;
5. repair once if policy allows;
6. fail optional explanation if verification remains invalid;
7. never modify structured result.

The model cannot elevate authority or access source data independently.

## 21. Audit and telemetry

Evidence reads are telemetry events, not necessarily business audit events.

AuditEvent is required when:

- authority/conflict is resolved (future);
- internal review Action is created with linked evidence;
- evidence linkage materially changes an approved business record (future).

ComparisonRun stores evidence fingerprints and bindings for reproducibility.

## 22. Required tests

- exact claim/source binding;
- quote register amount not attributed to unrelated document text;
- quote-only excluded from actual aggregate;
- forecast not presented as actual;
- stale supplier offer historical only;
- superseded record excluded but inspectable;
- open conflict excluded and visible;
- insufficient observations abstain;
- unauthorized actual evidence absent from DTO/model context/counts;
- calculation trace reconciles;
- evidence access rechecked after permission change;
- source preview sanitized/bounded;
- action creation rejects inaccessible evidence;
- bilingual labels preserve semantic distinction.

## 23. Acceptance criteria

- every material hero claim has exact evidence or explicit abstention;
- source authority cannot be inferred by model/UI alone;
- observation types remain distinct end to end;
- conflicts and supersession are explicit;
- actual-cost aggregates satisfy authority/sufficiency rules;
- Viewer cannot infer restricted economics;
- evidence panel can render claim, source, locator, authority, and calculation;
- past ComparisonRun evidence remains reproducible/auditable;
- future ingestion can create EvidenceReferences without changing comparison/UX contracts.