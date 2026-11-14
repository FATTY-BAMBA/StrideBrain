# StrideBrain v0.1 — Build Contract

**Status:** Reconciled UX + Technical Architecture contract for review  
**Scope:** Comparable Project Intelligence  
**Release target:** L1 controlled demo with L2-shaped seams  
**Build issue:** #7 after acceptance of this contract

## 1. Purpose

This document is the binding implementation contract for the first StrideBrain application build.

It reconciles:

- Product Decision Pack;
- Horizon Atelier hero narrative;
- Product/UX Architecture;
- Technical Architecture;
- evidence/authority/authorization ADRs;
- independent design and technical reviews.

Implementation may refine code organization and visual styling, but cannot change product behavior, authority, permissions, or accepted states without a reviewed contract/ADR update.

## 2. First release outcome

A user opens the Xinyi project and completes:

```text
project context
  → run deterministic comparison
  → understand ranked matches and differences
  → compare current quote with history
  → inspect exact evidence/authority
  → review and create one internal action
  → receive auditable action receipt
```

The application is not approved to build unrelated modules.

## 3. Application boundaries

### Repository and deployment

- canonical repository: `FATTY-BAMBA/StrideBrain`;
- isolated Vercel project;
- no code/runtime dependency on `primestride-web` or `StrideBrain-OS`;
- no `demo.primestrideai.com` cutover during scaffold/build;
- no real customer data.

### Architecture

- modular monolith;
- Next.js App Router;
- strict TypeScript;
- PostgreSQL + Prisma adapter;
- domain/application services behind repository ports;
- durable seeded Horizon Atelier tenant;
- no copied static-browser runtime.

## 4. Product surfaces

Global surfaces:

```text
Home
Projects
Knowledge
StrideBrain
Settings
```

Project-local views:

```text
Overview
Compare
Commercial
Evidence
Actions
```

Functional depth for v0.1 is concentrated in:

- project Overview;
- Compare;
- evidence panel;
- internal review action creation/receipt.

Other surfaces are honest limited shells where needed, not simulated complete products.

## 5. Routes and state restoration

Canonical routes:

```text
/[locale]
/[locale]/projects
/[locale]/projects/[projectKey]
/[locale]/projects/[projectKey]/compare
/[locale]/projects/[projectKey]/commercial
/[locale]/projects/[projectKey]/evidence
/[locale]/projects/[projectKey]/actions
/[locale]/knowledge
/[locale]/stridebrain
/[locale]/settings
```

Comparison route:

```text
/[locale]/projects/[projectKey]/compare?run=[comparisonRunId]&selected=[candidateKeys]
```

Rules:

- URL IDs are selectors, never authority;
- server validates run/project/candidate organization/access;
- selected candidates must belong to the run’s eligible result set;
- language switching preserves run and selection;
- source deep links preserve `returnTo`/run/claim context through validated state;
- stale/expired runs remain inspectable when authorized but are read-only;
- direct run link is non-disclosing when unavailable.

## 6. Server/client split

### Server components/use cases

Responsible for:

- runtime context resolution;
- project workspace read model;
- initial comparison-run retrieval;
- permission-specific DTO/redaction;
- data mutations;
- evidence/source access;
- localization catalog loading.

### Client components

Used only where interaction state requires it:

- contextual composer/submission;
- match selection;
- factor-detail disclosure;
- evidence panel open/close/navigation;
- responsive comparison controls;
- action draft editing/confirmation;
- language navigation preserving safe route state.

Client components do not import Prisma, repositories, fixtures, policies, or secrets.

## 7. API/use-case surface

Indicative endpoints/use cases:

```text
POST /api/comparisons
GET  /api/comparisons/[runId]
GET  /api/comparisons/[runId]/evidence/[claimId]
POST /api/comparisons/[runId]/explanation      (optional/later)
POST /api/actions/internal-review
GET  /api/actions/[actionId]
```

Route handlers are adapters. Domain/application use cases remain callable in tests without HTTP.

Request validation is bounded and server context supplies identity/organization/permissions.

## 8. Runtime identity and Viewer behavior

L1 uses a signed server-issued synthetic demo session mapped to a fixture Membership.

Required fixture personas:

- Mei Lin — Project Manager/Estimator + explicit actual-cost grant;
- Financial Reviewer;
- Viewer;
- Organization Admin.

Viewer contract:

- can view authorized non-sensitive project/similarity context;
- actual-cost values and inaccessible evidence are omitted before DTO/model context;
- cells use `RESTRICTED`, never blurred/masked digits;
- hidden source IDs/titles/counts are not returned;
- no ProposedAction;
- server rejects action write.

## 9. Canonical run and permission views

The system stores one organization-scoped canonical ComparisonRun created by an authorized user, with sensitive claims/evidence where allowed at run time.

Every read:

1. resolves current RuntimeContext;
2. authorizes access to active project/run;
3. creates a permission-specific result DTO;
4. omits/redacts sensitive claims and evidence;
5. uses a cache key including organization + run + permission-scope hash if cached.

A Viewer cannot open sensitive evidence from a run created by Mei.

Permission changes after creation take effect immediately on subsequent reads.

## 10. First migration scope

The first Prisma migration includes only tables needed by the accepted slice:

### Tenancy/identity

- Organization;
- UserIdentity;
- Membership;
- MembershipCapabilityGrant;
- ProjectAssignment.

### Parties/context

- Client;
- Supplier;
- Material;
- TaxonomyTerm;
- Project;
- ProjectFacet;
- ProjectSupplier;
- ProjectMaterial.

### Evidence

- Document;
- DocumentVersion;
- EvidenceReference;
- EvidenceConflict;
- EvidenceConflictItem.

### Commercial

- Quote;
- QuoteVersion;
- QuoteItem;
- ForecastCostVersion;
- ForecastCostLine;
- ProjectCostVersion;
- CostLine;
- SupplierOffer;
- SupplierOfferItem.

### Intelligence/action

- IntelligenceRun;
- ComparisonRun;
- ComparisonCandidate;
- ComparisonFactor;
- ComparisonClaim;
- ComparisonClaimEvidence;
- ProposedAction;
- Action;
- ActionEvidence;
- AuditEvent.

No generic workflow, connector, message, agent, vector, OCR, or ingestion tables are included.

## 11. Fixture contract

Horizon Atelier seed uses the production schema and repository adapters.

Required:

- 1 organization;
- 4 fixture memberships/personas;
- 24 completed + 5 active projects;
- Xinyi current project/quote/forecast;
- canonical top-six ranking;
- 40+ quote versions;
- 300–500 quote/cost lines;
- 18–24 suppliers;
- 100+ evidence records;
- explicit superseded quote;
- stale supplier offer;
- open cost conflict outside primary aggregate;
- lighting with two actual observations;
- inaccessible historical project;
- broader/partial match;
- eligible assignees.

Seed validation checks IDs, cross-org relations, version/authority, line totals, evidence presence, canonical ranking inputs, and expected hero findings.

No service/component branches on named fixture IDs except eval fixtures/tests.

## 12. Decimal and calculation contract

- PostgreSQL `NUMERIC/DECIMAL` for money/quantities;
- Prisma Decimal mapped in repository adapter;
- domain calculations use `decimal.js` (or accepted exact-decimal equivalent), never binary floating point;
- public DTO amounts serialize as decimal strings;
- currency stored explicitly;
- calculation versions stored on ComparisonRun/trace;
- displayed amounts round according to currency formatter;
- percentage calculations retain at least four decimal places internally and display one decimal where required;
- canonical fixture tolerances:
  - score: exact whole expected score after defined rounding;
  - percentage hero findings: ±0.5 percentage points unless fixture eval specifies tighter;
  - cost-line reconciliation: configured TWD tolerance, default ≤ NT$1 total rounding difference;
- aggregation method for v0.1: median of eligible normalized observations;
- threshold of three is a safety sufficiency rule, not a confidence interval.

Calculation package must have unit tests before fixture assertions.

## 13. Comparison run contract

Comparison pipeline:

1. resolve current project snapshot;
2. validate mandatory context;
3. filter authorization/eligibility;
4. calculate factor states and scores;
5. rank/tie-break;
6. assemble separate quote/forecast/offer/actual economics;
7. apply sufficiency, freshness, supersession, conflict;
8. build claims/evidence/calculation traces;
9. build deterministic synthesis and ProposedAction;
10. persist immutable run/result snapshot/fingerprints.

Canonical run status:

```text
RUNNING → COMPLETE | FAILED
COMPLETE → STALE (when invalidated)
```

Past runs never recompute in place.

## 14. Run staleness/fingerprint contract

A run stores fingerprints for:

- active project `recordVersion` and comparison facets;
- active quote version;
- active forecast version;
- candidate project versions/facets;
- included commercial/cost/supplier versions;
- authority/conflict/supersession state;
- evidence bundle/checksums;
- similarity/eligibility/authority/calculation policy versions;
- permission-scope hash.

Action confirmation rechecks material fingerprints.

Any mismatch returns `ACTION_STALE`, creates no Action, preserves the draft, and requires a refreshed run.

Proactive stale marking is optional optimization; write-time recheck is mandatory.

## 15. Evidence loading strategy

Comparison result embeds:

- evidence chips;
- source counts;
- authority/freshness/warning summaries;
- claim IDs;
- enough factor/economics trace for primary display.

Full evidence panel loads on demand from persisted/indexed ComparisonClaim/EvidenceReference data:

```text
GET /api/comparisons/[runId]/evidence/[claimId]
```

This avoids returning all document/source previews in the primary comparison payload.

Performance target ≤500 ms after result load through:

- indexed claim/evidence joins;
- bounded source previews;
- batched evidence rows;
- no model call;
- optional private permission-scoped cache.

Evidence reads reauthorize current access.

## 16. Action/idempotency contract

Action request includes:

- proposedActionId;
- editable fields;
- explicit confirmation;
- idempotency key generated per user confirmation attempt.

Uniqueness scope:

```text
organizationId + idempotencyKey
```

Transaction:

1. reauthorize;
2. lock/load ProposedAction + ComparisonRun material state;
3. verify proposal unused/unexpired;
4. verify fingerprints/evidence/assignee/project;
5. create Action;
6. create ActionEvidence links;
7. write append-only AuditEvent;
8. mark ProposedAction consumed;
9. commit;
10. return ActionReceipt.

A retry returns the existing receipt. Partial Action without AuditEvent is prohibited.

## 17. Shared visual/data behavior

- score card shows business-readable reasons; formulas are progressive disclosure;
- badge restraint: one observation-type label and material condition only;
- coverage appears as label + percent + explanation, not percent alone;
- comparison table supports sticky labels, selected columns, compact mode, mobile row cards;
- evidence panel begins with claim and source authority;
- optional explanation never changes structured layout/data;
- action appears only after synthesis/evidence is sufficient and user authorized;
- success uses a receipt, not toast alone.

## 18. Localization contract

Critical catalogs must cover:

- global/local navigation;
- project stages;
- match bands;
- factor names;
- observation/authority/freshness/conflict labels;
- loading/empty/failure/stale/permission states;
- synthesis headings;
- evidence source/locator types;
- action review/validation/receipt;
- accessibility labels.

CI validates `zh-TW`/`en` key parity.

Domain IDs/enums remain language-neutral. Switching language preserves run/selection/panel/action-draft state.

## 19. Component boundaries

Indicative components:

```text
WorkspaceShell
ProjectHeader
ProjectLocalNav
ContextualStrideBrainComposer
ComparisonRunSummary
ComparableProjectGrid
ComparableProjectCard
FactorDetail
ComparisonTable
StructuredSynthesisPanel
EvidencePanel
EvidenceSourceCard
InternalReviewActionSheet
ActionReceipt
StateNotice
```

Business rules/calculations do not live in components.

## 20. Optional AI sequencing

The initial build is complete without AI synthesis.

Optional explanation is implemented only after:

- deterministic result/UI/evidence/action complete;
- canonical evals pass;
- permission/redaction tests pass;
- primary performance budgets pass.

Feature flag can disable explanation with no impact on the flow.

## 21. CI and release minimum

Before preview release:

- format/lint;
- strict TypeScript;
- Prisma validate/generate/migration checks;
- unit/policy/calculation tests;
- fixture validation;
- localization parity;
- production build;
- repository/tenant integration tests;
- canonical ranking/authority evals;
- Playwright hero flow in both languages;
- accessibility checks;
- Viewer redaction/action-denial journey;
- stale/idempotency/action receipt tests;
- preview smoke/performance results;
- exact commit/deployment and rollback note.

## 22. Explicit deferrals

- arbitrary uploads/OCR/PDF/Excel ingestion;
- semantic/vector ranking;
- provider/model menu;
- external email/LINE;
- quote approval/issue;
- financial conflict resolution UI;
- autonomous/recurring agents;
- workflow builder;
- live domain cutover;
- real customer data.

## 23. Change-control rule

Implementation may not silently:

- add top-level modules;
- blend observation types;
- weaken tenant filtering;
- make AI blocking/authoritative;
- create actions automatically;
- substitute JSON/browser state for durable preview truth;
- remove required empty/conflict/stale/permission states;
- change similarity weights/policy;
- change hero expected findings.

Any such change requires Product/UX/Technical review and updated ADR/evals.

## 24. Build authorization condition

Issue #7 may begin only after:

- shared DTO/state contract accepted;
- acceptance/eval matrix accepted;
- implementation sequence accepted;
- reconciliation review passes;
- explicit build authorization is merged.