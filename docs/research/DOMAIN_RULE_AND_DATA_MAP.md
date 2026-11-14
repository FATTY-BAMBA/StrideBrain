# StrideBrain Prototype Domain Rules & StrideGraph Data Map

## 1. Purpose

The prototype contains business rules that should survive the migration even though its browser implementation should not.

This document extracts those rules into candidate typed contracts and maps the current fictional data into StrideGraph v0.1.

---

## 2. Rule authority levels

The new product should distinguish these authority levels explicitly:

| Authority state | Meaning |
|---|---|
| `PUBLIC_REFERENCE` | External published guidance with scope/applicability metadata. |
| `DEMO_SYNTHETIC` | Fictional fixture data for demonstration/evaluation. |
| `EXTRACTED_PROPOSAL` | Machine/rule observed value awaiting human review. |
| `HUMAN_REVIEWED` | A reviewer accepted the extraction/mapping, but underlying business truth may remain unverified. |
| `COMPANY_CONFIRMED` | Authorized company user confirmed a fact or record. |
| `RECONCILED_ACTUAL` | Value reconciled against authoritative completed-work/cost evidence. |
| `DERIVED_CALCULATION` | Deterministic output calculated from identified source facts and policy version. |
| `AI_PROPOSAL` | Model-generated explanation, comparison or action proposal. |
| `APPROVED_ACTION` | Human-authorized business action. |
| `EXECUTED_ACTION` | Action completed with receipt/result. |

No model output should silently cross these boundaries.

---

## 3. Extracted domain rules

## 3.1 Dataset and relationship validation

### Current behavior

The prototype validates required arrays, unique IDs, project relationships, source references, one latest quotation per project, scenario sources and nonempty documents/suppliers.

### Candidate contract

```ts
interface DatasetValidator {
  validateOrganizationFixture(input: OrganizationFixture): ValidationResult;
}
```

### Production rule

Database constraints and service validation must enforce:

- tenant ownership;
- stable IDs;
- valid relationships;
- version uniqueness;
- one current/latest version where applicable;
- source/evidence existence;
- no orphan business records.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.2 Commercial price calculation

### Current behavior

For direct cost `C`, target gross margin `M` and tax `T`:

```text
priceBeforeTax = C / (1 - M)
tax = priceBeforeTax × T
total = priceBeforeTax + tax
grossProfit = priceBeforeTax - C
```

Inputs are bounded and invalid values are rejected.

### Candidate contract

```ts
type Money = { amountMinor: bigint; currency: CurrencyCode };

type QuoteCalculationInput = {
  directCost: Money;
  targetGrossMarginBps: number;
  taxPolicyId: string;
};

type QuoteCalculationResult = {
  directCost: Money;
  preTaxPrice: Money;
  tax: Money;
  total: Money;
  grossProfit: Money;
  calculationPolicyVersion: string;
  evidence: EvidenceReference[];
};
```

### Production rule

- calculations are deterministic;
- use minor currency units/decimal-safe math;
- tax and rounding are organization/jurisdiction policy;
- every result records policy version and inputs;
- model text never supplies authoritative totals.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.3 Approval invalidation

### Current behavior

Changing cost or margin invalidates supplier, owner and customer confirmations and draft review.

### Candidate contract

```ts
interface ApprovalInvalidationPolicy {
  invalidatedApprovals(change: CommercialChange): ApprovalKind[];
}
```

### Production rule

Any material change to approved inputs creates a new version and invalidates approvals tied to the prior fingerprint.

Approval must reference:

- exact object/version;
- exact calculation fingerprint;
- actor and role;
- decision;
- timestamp;
- evidence;
- policy version.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.4 Ordered change/work-release gates

### Current behavior

The flagship flow requires:

1. supplier evidence checked;
2. owner approval;
3. customer written acceptance;
4. current readiness assessment;
5. zero blocking readiness gaps;
6. re-evaluation confirms rules/inputs have not changed;
7. commit creates downstream work.

### Candidate contract

```ts
interface WorkReleasePolicy {
  evaluate(input: WorkReleaseContext): PolicyDecision;
}
```

### Production rule

Policy checks should be declarative/versioned and return:

- pass/hold/review;
- exact blocking conditions;
- required evidence;
- required approver role;
- next action;
- policy version.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.5 Historical record eligibility

### Current behavior

Historical comparison accepts only records that:

- are marked complete;
- have final direct costs;
- reconcile line totals to final cost;
- use known categories/cost codes;
- have positive quantity and matching unit;
- have valid completion date;
- contain structured lines;
- link to source evidence.

Quote-only/non-complete records are excluded from actual-cost estimation.

### Candidate contract

```ts
interface HistoricalEligibilityPolicy {
  evaluate(project: HistoricalProjectRecord): EligibilityDecision;
}
```

### Production rule

Historical authority must separate:

- quote value;
- supplier offer;
- purchase commitment;
- invoice;
- recorded actual cost;
- reconciled final direct cost.

Only configured authority states contribute to actual-cost comparisons.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.6 Comparable-project filtering and scoring

### Current behavior

Mandatory filters:

- category;
- finish tier;
- requested scope coverage;
- unit.

Prototype score:

- 55% size similarity;
- 30% recency;
- 15% same location.

The top six are returned.

### Candidate contract

```ts
type SimilarityFactor = {
  key: string;
  weight: number;
  score: number;
  explanation: LocalizedText;
  evidence: EvidenceReference[];
};

type ComparableProject = {
  projectId: string;
  score: number;
  factors: SimilarityFactor[];
  materialDifferences: Difference[];
};

interface ComparableProjectPolicy {
  find(context: ComparableProjectQuery): ComparableProject[];
}
```

### Production rule

- mandatory filters and weighted factors must be configuration/versioned;
- overall score must be decomposable;
- important differences appear beside similarities;
- semantic similarity may supplement, not replace, structured factors;
- permissions filter candidates before scoring.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE.

---

## 3.7 Minimum evidence threshold

### Current behavior

- at least three eligible completed comparables;
- at least three observations for every requested cost line;
- no estimate when evidence is insufficient.

### Candidate contract

```ts
interface EvidenceSufficiencyPolicy {
  assess(input: ComparisonEvidence): SufficiencyDecision;
}
```

### Production rule

Thresholds may vary by organization/category, but the system must abstain rather than fill missing history with model guesses.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.8 Historical cost aggregation

### Current behavior

For each cost code:

- normalize actual cost by project quantity;
- weight observations by similarity;
- calculate weighted median unit rate;
- multiply by requested quantity;
- add explicit escalation;
- add contingency;
- apply target margin;
- create an illustrative 20th–80th percentile sensitivity band.

### Candidate contract

```ts
interface HistoricalCostEngine {
  estimate(query: HistoricalCostQuery): HistoricalCostResult;
}
```

### Production rule

Result must expose:

- method/version;
- eligible/excluded records;
- normalized observations;
- source authority;
- assumptions;
- age/freshness;
- range semantics;
- limitations;
- no-current-supplier warning where applicable.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.9 Historical scope warnings

### Current behavior

If a cost code appears in at least 60% of at least three matching completed projects but is absent from the requested scope, the prototype presents a review prompt rather than asserting a missing charge.

### Candidate contract

```ts
interface ScopeCompletenessAdvisor {
  review(query: ScopeReviewQuery): ScopeObservation[];
}
```

### Production rule

Observations must remain suggestions with supporting source counts, not automatic quote-line insertion.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.10 Document parsing safety

### Current behavior

The browser parser enforces:

- accepted formats;
- 8 MB file limit;
- Office ZIP entry/count/decompressed-size limits;
- XML doctype/entity rejection;
- worksheet/page/row limits;
- malformed CSV warning;
- missing embedded text warning.

### Candidate contract

```ts
interface IngestionPolicy {
  validateUpload(file: UploadDescriptor): UploadDecision;
}
```

### Production rule

Production adds:

- malware scanning;
- object storage;
- immutable hash;
- MIME verification;
- ingestion jobs;
- parser sandboxing;
- time/memory budgets;
- retry/dead-letter behavior;
- retention/deletion policy.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.11 Cost-table detection and flags

### Current behavior

Bilingual aliases map source headers to canonical concepts:

- description;
- quantity;
- unit;
- unit cost;
- total;
- reference;
- notes.

Flags include:

- missing/nonpositive quantity;
- missing/invalid unit cost;
- amount mismatch;
- no source-stated total;
- repeated line;
- truncation/coverage warnings;
- draft/unapproved statements.

### Candidate contract

```ts
interface StructuredExtractionAdapter {
  extract(document: DocumentVersion): ExtractionProposal;
}
```

### Production rule

Every proposal carries:

- observed value;
- canonical field candidate;
- source locator;
- confidence/reason;
- issues;
- parser/version;
- review state.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.12 Human extraction review

### Current behavior

Rows can be:

- approved;
- excluded;
- needs review.

Blocking source inconsistencies prevent approval. Cost documents require manual currency confirmation and document approval requires a reviewer note.

### Candidate contract

```ts
interface ExtractionReviewService {
  decide(input: ExtractionReviewDecision): ReviewedExtraction;
}
```

### Production rule

Reviewer corrections must preserve both original observation and reviewed value. Exclusions require reason where they affect completeness.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.13 Document-to-history promotion

### Current behavior

Promotion requires:

- reviewed document;
- confirmed currency;
- accepted/reconciled lines;
- all lines mapped to known cost codes;
- mapped total reconciliation;
- valid metadata;
- fictional/self-attested acknowledgement;
- scope-completeness acknowledgement;
- source-review acknowledgement;
- exclusion reason where needed.

### Candidate contract

```ts
interface HistoricalFactPublisher {
  publish(input: ReviewedHistoricalMapping): HistoricalFactVersion;
}
```

### Production rule

Publication target must record an authority state. Human-reviewed extraction does not automatically equal reconciled actual cost.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.14 Readiness evaluation

### Current behavior

Each check returns:

- `pass`;
- `hold`;
- `review`;
- detail;
- next action;
- source IDs.

Any hold gives `HOLD_FOR_EVIDENCE`; otherwise the output is only `READY_FOR_HUMAN_REVIEW`, never auto-approved.

### Candidate contract

```ts
interface PolicyEngine {
  evaluate<TInput>(policyVersion: string, input: TInput): PolicyRun;
}
```

### Production rule

A checklist result is not regulatory certification, file preflight or professional judgment unless the responsible integrated process explicitly proves it.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.15 Priority and coordination review

### Current behavior

Priority review:

- scans complete structured registers;
- uses dates relative to dataset snapshot;
- distinguishes blocked work, near-term dates and status reconciliation;
- IDs break display ties only;
- does not claim overall business-impact ranking;
- does not infer dependencies from shared project/title/source.

Project Coordinator review deliberately selects different signal types:

- a recorded blocker;
- a near-term handoff/deadline;
- a pending approval/status verification.

### Candidate contract

```ts
interface AttentionReviewService {
  review(context: AttentionContext): AttentionItem[];
}
```

### Production rule

Ranking basis and coverage must be visible. Unknown business impact remains unknown.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.16 Conversation context and evidence ledger

### Current behavior

Every turn receives fresh context. The system:

- resolves candidate/selected projects;
- asks clarification for ambiguous singular questions;
- reads requested sources separately;
- distinguishes register facts from document text;
- rejects unsupported citations;
- rejects unverified record IDs;
- detects project mismatches;
- verifies cited amounts exist in cited evidence;
- attempts bounded answer repair;
- fails if evidence cannot be validated.

### Candidate contract

```ts
interface ContextResolver {
  resolve(input: IntelligenceRequest): ContextEnvelope;
}

interface EvidenceLedger {
  add(result: ToolResult): void;
  verify(output: IntelligenceOutput): VerificationResult;
}
```

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 3.17 Agent proposal policy

### Current behavior

Bounded planners:

- start with a required review tool;
- use a fixed tool allowlist;
- may prepare at most three follow-up proposals;
- reject unknown projects and invalid sources;
- cannot pay, approve quotes, edit records or send messages;
- require human approval before task creation/external action.

### Candidate contract

```ts
interface PlannerCapability {
  plan(context: AuthorizedAgentContext): ProposedAction[];
}
```

### Production rule

Planner output is data, not authority. Action authorization is evaluated independently after generation.

### Classification

KEEP CONCEPT, PORT LOGIC.

---

## 4. Fixture-to-StrideGraph mapping

| Prototype record | Current meaning | StrideGraph target | Migration notes |
|---|---|---|---|
| `seed.meta` | Demo company/date/mode | Organization + FixtureVersion | Separate organization identity from fixture/template metadata. |
| `projects[]` | Project/job summary | Project | Add Client relation, stable type taxonomy, status history and outcome. |
| project `client` string | Customer name | Client | Normalize into first-class object. |
| project `manager` string | Recorded manager | Person + ProjectMembership/Assignment | Do not infer approval authority. |
| `documents[]` | Markdown/source record | Document + DocumentVersion + EvidenceReference | Preserve type, status, version, date, owner, basis and source URL. |
| `suppliers[]` | Supplier demo record | Supplier | Add organization relation, contacts, performance evidence and validity dates. |
| supplier category/price/lead time | Example commercial attributes | SupplierOffer / MaterialSupplier / Evidence-backed metrics | Do not store current price as timeless Supplier field. |
| `quotes[]` | Project quote versions/amounts | Quote + QuoteVersion | Add currency, state history, calculation policy and line items. |
| quote `directCost` | Whole-project demo cost | Derived/recorded QuoteCostSummary | Preserve authority/source; not equivalent to actual final project cost. |
| `workOrders[]` | Task/work record | Action / WorkOrder | Add assignment, dependencies, state events and evidence. |
| `approvals[]` | Pending/approved review item | ApprovalRequest + ApprovalDecision | Add object/version, approver role and decision audit. |
| `activity[]` | Demo timeline | ProjectEvent / AuditEvent | Separate business event from security/system audit. |
| scenario change object | Hard-coded flagship variation | Change + QuoteVersion + Decision | Convert scenario into fixture records, not special UI logic. |
| history `records[]` | Fictional completed cost precedents | Project + ProjectCostVersion + CostLine | Preserve authority/provenance and reconciliation status. |
| history `documents[]` | Cost source notes | DocumentVersion + EvidenceReference | Link to cost lines and historical project. |
| history categories | Project class | ProjectType/ComparisonTaxonomy | Tenant/industry configurable. |
| cost codes | Canonical cost categories | CostCode / CostTaxonomyVersion | Versioned organization template. |
| curated evidence documents | Taiwan public guidance | PublicReference + Applicability | Track publisher, URL, date, jurisdiction and limitations. |
| feedback records | Helpful/review flags | FeedbackCase | Link to IntelligenceRun, output and evidence. |
| `state.audit[]` | Browser action notes | AuditEvent | Server-generated append-only events in production. |
| AI run/proposals | Demo planner output | IntelligenceRun + ProposedAction | Add authorization context, tool trace, approval and execution receipt. |
| connector receipts | Simulated/controlled send result | ExternalAction + ActionReceipt | Organization connector and actor required. |

---

## 5. Missing first-class objects in the prototype

The prototype implies but does not fully model:

- Organization membership and roles;
- Client as first-class object;
- Person/contact identity;
- DocumentVersion and immutable source lineage;
- QuoteItem;
- Material taxonomy;
- SupplierOffer and validity period;
- ProjectCostVersion / actual-cost authority;
- Decision;
- Change/version relationship;
- Risk/Issue;
- Action dependency graph;
- ApprovalDecision separate from ApprovalRequest;
- AuditEvent separate from business activity;
- IntelligenceRun;
- ToolCall / EvidenceSelection;
- PolicyPack / PolicyRun;
- Connector credential lifecycle.

These gaps should be resolved in the technical architecture before schema implementation.

---

## 6. Demo fixture conversion rules

1. Fictional companies become normal organizations marked `DEMO_SYNTHETIC`.
2. Industry pack configuration becomes template/configuration, not tenant identity.
3. Every fixture record gets stable IDs and explicit organization ownership.
4. Source documents become versioned fixture files/records.
5. Historical records keep their fictional provenance.
6. Register sources and document sources remain different evidence types.
7. Hard-coded scenario behavior becomes ordinary Change/Approval/Action records.
8. Dates remain fixture snapshot dates and never appear as live activity.
9. The same repositories and services must serve fixtures and real tenants.
10. Demo reset should rebuild a tenant fixture, not clear browser-global product truth.

---

## 7. Recommended package boundaries

```text
packages/domain
  projects
  documents
  quotations
  suppliers
  approvals
  actions
  evidence
  policy

packages/intelligence
  context-resolver
  tool-registry
  comparable-projects
  evidence-ledger
  orchestrator
  output-verifier

packages/ingestion
  uploads
  parsers
  extraction-proposals
  review
  publication

packages/evals
  fixtures
  canonical-questions
  grounding
  permissions
  bilingual
```

## 8. Migration acceptance condition

A rule is considered successfully extracted only when:

- it has a typed contract;
- its inputs/outputs and authority are explicit;
- prototype regression examples are represented as tests;
- it operates against repository interfaces, not fixture globals;
- it is tenant-scoped;
- the user-visible result can show evidence and limitations;
- a model cannot bypass the rule through prose or tool arguments.
