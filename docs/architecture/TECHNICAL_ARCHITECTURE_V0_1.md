# StrideBrain v0.1 — Technical Architecture

**Status:** Technical Architecture for review  
**Scope:** Comparable Project Intelligence  
**Release target:** L1 controlled demo with L2-shaped seams  
**Primary policies:** `CPI-ELIGIBILITY-1.0`, `CPI-SIM-1.0`, `EVIDENCE-AUTHORITY-1.0`, `INTERNAL-REVIEW-ACTION-1.0`

## 1. Architecture objective

Build the first customer-facing StrideBrain workflow as a production-shaped application, not as copied static demo code.

The architecture must support this complete loop:

```text
trusted runtime context
  → authorized project data
  → deterministic comparable-project service
  → evidence/authority evaluation
  → structured result
  → optional verified explanation
  → authorized internal review action
  → audit trace
```

The application must remain useful when the optional model is disabled or unavailable.

## 2. Architecture style

StrideBrain v0.1 uses a **modular monolith**.

Reasons:

- one product team and one bounded first slice;
- atomic action/audit transactions are simpler;
- lower deployment and observability complexity;
- clear module boundaries can later be extracted if measured needs justify it;
- avoids both a monolithic UI file and premature microservices.

### Initial platform

- Next.js App Router;
- strict TypeScript;
- PostgreSQL;
- Prisma schema/migrations and typed database client;
- server-first data access;
- Vercel preview deployment;
- repository/service ports between experience, domain, and persistence;
- `zh-TW` and `en` localization foundation;
- automated CI and eval seams.

Library/provider versions are intentionally not encoded in domain contracts.

## 3. Layer model

```text
Experience layer
  Next.js routes, server components, client interaction components

Application layer
  use cases, orchestration, transactions, DTO/redaction mapping

Domain layer
  entities, value objects, policies, calculations, invariants

Repository layer
  organization-scoped interfaces and adapters

Intelligence layer
  comparison services, evidence assembly, optional synthesis

Infrastructure layer
  Postgres/Prisma, identity adapter, telemetry, model adapter
```

Dependencies point inward. Domain code must not import Next.js, Prisma, model SDKs, or fixture JSON.

## 4. Proposed repository structure

```text
/src
  /app
    /[locale]
      /(workspace)
        /page.tsx
        /projects
        /knowledge
        /stridebrain
        /settings
    /api
      /comparisons
      /actions
      /evidence
      /explanations
  /modules
    /runtime-context
    /organizations
    /projects
    /commercial
    /evidence
    /comparisons
    /actions
    /audit
    /intelligence
    /localization
  /components
    /shell
    /projects
    /comparison
    /evidence
    /actions
    /ui
  /repositories
    /ports
    /prisma
    /fixtures
  /lib
    /errors
    /validation
    /telemetry
    /security
/prisma
  schema.prisma
  /migrations
/fixtures
  /horizon-atelier
/evals
  /comparisons
  /authority
  /bilingual
  /permissions
/tests
  /unit
  /integration
  /e2e
/docs
```

Fixtures contain data only. They do not contain UI behavior or hard-coded expected conclusions.

## 5. Trusted runtime context

Every private request resolves:

```ts
type RuntimeContext = {
  requestId: string;
  userId: string;
  membershipId: string;
  organizationId: string;
  role: Role;
  capabilities: ReadonlySet<Capability>;
  assignedProjectIds?: ReadonlySet<string>;
  locale: "zh-TW" | "en";
  dataMode: "DEMO_SYNTHETIC" | "TENANT_PRIVATE";
};
```

Resolution path:

```text
verified identity
  → active membership
  → organization
  → role/capability bundle
  → project assignment/sensitivity rules
  → locale
```

### L1 demo identity

The L1 preview may use a signed, server-issued demo session mapped to a fixed synthetic membership.

Rules:

- browser cannot choose `organizationId`, role, or capability set;
- session contains an opaque identifier, not trusted role claims;
- server resolves the fixture membership;
- no shared operator token in normal UI;
- no real customer data;
- demo session adapter implements the same `IdentityContextPort` used by future real identity.

### L2 replacement seam

A real identity provider replaces only the boundary adapter. Application and repository contracts continue to receive `RuntimeContext`.

## 6. Request architecture

### Project workspace read

```text
route/server component
  → resolveRuntimeContext()
  → ProjectWorkspaceQuery.execute(context, projectId)
  → repositories apply organization/access predicates
  → DTO mapper applies sensitive-field redaction
  → localized experience renders
```

### Comparison run

```text
POST /api/comparisons
  → validate bounded input
  → resolveRuntimeContext()
  → authorize comparison:run on active project
  → load active project snapshot
  → apply candidate eligibility
  → score eligible candidates deterministically
  → assemble economics by authority policy
  → assemble claim-level evidence bundles
  → build structured synthesis
  → persist ComparisonRun snapshot
  → return ComparisonResult DTO
```

### Optional explanation

```text
POST /api/explanations
  → resolveRuntimeContext()
  → authorize access to ComparisonRun
  → load redacted verified ComparisonResult
  → model produces bounded explanation
  → verify claims/citations against result
  → return explanation or safe failure
```

The explanation endpoint cannot mutate the ComparisonRun or change ranking/calculations.

### Internal review action

```text
POST /api/actions/internal-review
  → resolveRuntimeContext()
  → validate proposal + idempotency key
  → load active ComparisonRun
  → recheck quote/policy/evidence freshness
  → authorize action:create + project assignment
  → validate assignee and evidence access
  → database transaction:
       create Action
       create AuditEvent
       link evidence + comparison run
  → return ActionReceipt
```

## 7. Domain modules

### Organizations/runtime context

Owns:

- organization boundary;
- membership and role/capabilities;
- project assignment;
- data classification mode;
- locale.

### Projects

Owns:

- project identity/status/class/subtype;
- scope and attributes;
- project relationships to client, materials, suppliers;
- completed/closed eligibility metadata.

### Commercial

Owns separate models for:

- Quote / QuoteVersion / QuoteItem;
- Forecast direct cost;
- ProjectCostVersion / CostLine;
- SupplierOffer / SupplierOfferItem;
- observation type, authority, currency, unit, freshness.

A generic authoritative `cost` field is prohibited.

### Evidence

Owns:

- source object/version;
- EvidenceReference;
- claim/value relationship;
- locator;
- access classification;
- conflict/supersession/freshness;
- evidence bundles.

### Comparisons

Owns:

- eligibility policy;
- factor calculations;
- scoring and tie behavior;
- economics assembly;
- structured differences;
- sufficiency;
- ComparisonRun persistence;
- deterministic structured synthesis.

### Actions

Owns:

- ProposedAction;
- internal-review Action;
- validation and expiry;
- creation transaction;
- receipts.

### Audit

Owns append-only material event records and correlation.

### Intelligence

Owns optional explanation interface and output verification. It does not own business calculations or authorization.

## 8. Repository ports

Every private repository call requires organization-scoped input or `RuntimeContext`.

Indicative ports:

```ts
interface ProjectRepository {
  getAuthorizedById(ctx: RuntimeContext, projectId: string): Promise<Project | null>;
  listEligibleHistorical(ctx: RuntimeContext, query: HistoricalCandidateQuery): Promise<Project[]>;
}

interface CommercialRepository {
  getActiveQuote(ctx: RuntimeContext, projectId: string): Promise<QuoteVersion | null>;
  getHistoricalQuotedObservations(ctx: RuntimeContext, projectIds: string[]): Promise<QuotedObservation[]>;
  getHistoricalActualObservations(ctx: RuntimeContext, projectIds: string[]): Promise<ActualObservation[]>;
  getSupplierOffers(ctx: RuntimeContext, projectIds: string[]): Promise<SupplierOfferObservation[]>;
}

interface EvidenceRepository {
  getAccessibleBundle(ctx: RuntimeContext, evidenceIds: string[]): Promise<EvidenceBundle>;
  getForClaim(ctx: RuntimeContext, claimId: string): Promise<EvidenceBundle>;
}

interface ComparisonRunRepository {
  create(ctx: RuntimeContext, run: NewComparisonRun): Promise<ComparisonRun>;
  getAuthorized(ctx: RuntimeContext, runId: string): Promise<ComparisonRun | null>;
  markStale(ctx: RuntimeContext, runId: string, reason: StaleReason): Promise<void>;
}

interface ActionRepository {
  createInternalReviewWithAudit(
    ctx: RuntimeContext,
    input: CreateInternalReviewAction,
    audit: NewAuditEvent
  ): Promise<ActionReceipt>;
}
```

The UI never imports fixture files or Prisma directly.

## 9. Persistence choice

PostgreSQL is the canonical persistence target from the first application foundation.

The L1 demo uses a seeded synthetic Horizon Atelier organization in the same schema intended for future tenants.

A lightweight in-memory fixture adapter may exist for unit tests and Storybook-like isolated rendering, but the shared preview should use durable Postgres persistence so action/audit behavior is real.

Prisma is the initial data-access adapter because it provides explicit schema/migrations and typed queries. Domain policies remain independent of Prisma.

See ADR-005.

## 10. Tenant isolation

### Required from first scaffold

- `organizationId` on every tenant-private row;
- repository methods receive trusted context;
- compound indexes/unique constraints include organization where applicable;
- no browser-supplied organization scope;
- authorization filters applied before data mapping/model context;
- action/evidence/project IDs are rechecked against organization;
- non-disclosing not-found behavior;
- cross-tenant automated tests.

### Before real customer data (L2)

- database row-level security or equivalent defense-in-depth;
- real identity provider and membership lifecycle;
- backup/recovery and retention;
- tenant admin/onboarding/offboarding;
- security review of all read/write/retrieval paths.

## 11. Comparison service architecture

The comparison service is pure/deterministic for fixed inputs and policy version.

```text
ActiveProjectSnapshot
+ EligibleCandidateSnapshots
+ CommercialObservations
+ EvidenceAuthorityDecisions
+ CPI-SIM-1.0
= ComparisonResult
```

### Processing stages

1. Validate active context.
2. Apply authorization.
3. Apply mandatory eligibility filters.
4. Calculate factor states/contributions.
5. Sort/tie-break deterministically.
6. Select up to six primary results.
7. Assemble quote/forecast/actual/offer observations separately.
8. Apply staleness/conflict/sufficiency rules.
9. Create claim-level evidence bundles.
10. Produce structured synthesis and proposed internal-review action.
11. Persist immutable run snapshot and fingerprints.

The service contract is defined separately.

## 12. Versioning and fingerprints

Every ComparisonRun stores:

- comparison policy version;
- evidence authority policy version;
- calculation version;
- active-project snapshot version;
- active quote version;
- candidate project/version fingerprints;
- evidence bundle fingerprint;
- runtime permission scope hash;
- generated timestamp.

Action creation recomputes/rechecks material fingerprints. Mismatch produces `COMPARISON_STALE`.

Policy changes do not silently mutate past runs. A new run is required.

## 13. Evidence architecture

Every displayed material claim has a stable claim ID and evidence bundle.

```ts
type StructuredClaim = {
  id: string;
  kind: ClaimKind;
  subjectId: string;
  value: JsonValue;
  unit?: string;
  observationType?: ObservationType;
  authorityState?: AuthorityState;
  evidenceReferenceIds: string[];
  calculationTraceId?: string;
  warnings: WarningCode[];
};
```

Evidence access is checked before the claim DTO is returned.

A linked document does not automatically support a structured register value. The EvidenceReference explicitly names the supported claim/field/value.

Conflict and authority details are defined separately.

## 14. Optional AI boundary

A model may:

- summarize verified structured findings;
- explain important differences;
- draft a concise internal-action rationale;
- use only already authorized/redacted result data.

A model may not:

- choose candidates;
- alter eligibility, scores, factors, values, authority, or evidence;
- access repositories directly in v0.1;
- create actions;
- infer hidden records;
- resolve conflict/staleness;
- turn insufficient evidence into a range.

Initial implementation may ship with AI explanation disabled. The product remains complete at the structured-result level.

See ADR-006.

## 15. Localization architecture

- route locale: `zh-TW` or `en`;
- canonical domain enums/IDs remain language-neutral;
- UI messages use catalog keys;
- taxonomy display names are localized data;
- business-object translated names are stored as localized fields or translations;
- model explanation receives explicit locale after redaction;
- language switch preserves IDs/run/selection/draft state;
- localization-key parity is validated in CI.

Domain services never branch on translated labels.

## 16. Error model

Safe public/application errors use bounded codes:

```text
PROJECT_UNAVAILABLE
PROJECT_CONTEXT_INCOMPLETE
COMPARISON_NO_ELIGIBLE_HISTORY
COMPARISON_FAILED
COMPARISON_STALE
INSUFFICIENT_ACTUAL_COST_EVIDENCE
EVIDENCE_CONFLICTED
EVIDENCE_RESTRICTED
ACTION_NOT_AUTHORIZED
ACTION_ASSIGNEE_INVALID
ACTION_STALE
ACTION_CREATE_FAILED
OPTIONAL_EXPLANATION_UNAVAILABLE
```

Internal traces include request/correlation IDs and sanitized diagnostics. Raw SQL/provider errors and hidden object details never reach the user.

## 17. Observability

### Traces

Capture spans for:

- runtime-context resolution;
- project query;
- candidate eligibility;
- factor scoring;
- economics authority evaluation;
- evidence assembly;
- comparison persistence;
- optional explanation;
- action authorization/transaction.

### Metrics

- project workspace latency;
- comparison p50/p95;
- candidate counts before/after eligibility;
- evidence-assembly latency;
- insufficiency/conflict/stale counts;
- optional explanation success/latency;
- action success/failure/rejection;
- permission denials;
- fixture/eval drift.

Do not log document bodies or sensitive financial values by default.

### Audit versus telemetry

AuditEvent records business-relevant state changes. Telemetry records system behavior. They are separate.

## 18. Performance budgets

| Interaction | Target |
|---|---:|
| Project useful content | p95 ≤ 2.5 s |
| Warm deterministic comparison | p95 ≤ 2.0 s |
| Cold deterministic comparison | p95 ≤ 3.0 s |
| Evidence panel after result | p95 ≤ 500 ms |
| Internal action creation | p95 ≤ 1.5 s |
| Optional explanation | p95 ≤ 12 s; never blocks result |

Implementation guidance:

- load project header/summary with focused queries;
- batch candidate/economics/evidence reads;
- avoid N+1 source queries;
- persist comparison evidence bundles for panel access;
- stream only optional explanation/status, not authoritative values;
- measure against the exact preview commit.

## 19. Security controls

- server-only database and model credentials;
- request validation with bounded schemas;
- CSRF/origin protections for writes;
- secure, same-site session cookies;
- idempotency for action creation;
- no arbitrary tool/function execution;
- no raw HTML from sources/model;
- evidence content treated as untrusted;
- least-privilege data selection before model use;
- no external communication/action connectors in v0.1;
- dependency and secret scanning in CI;
- cross-tenant and role-boundary tests.

## 20. Testing architecture

### Unit

- factor functions and boundaries;
- eligibility reasons;
- authority/freshness/conflict rules;
- sufficiency thresholds;
- synthesis rules;
- action validation;
- localization formatters.

### Integration

- organization-scoped repositories;
- schema constraints;
- canonical fixture seeding;
- comparison run persistence/fingerprints;
- action/audit transaction;
- non-disclosing access behavior.

### E2E

- hero flow in `zh-TW` and `en`;
- evidence panel;
- AI-unavailable fallback;
- Viewer redaction and action denial;
- stale run rejection;
- action receipt.

### Evals

- canonical ranking;
- factor explanation reconciliation;
- economics authority correctness;
- citation/evidence precision;
- insufficiency abstention;
- optional explanation faithfulness.

## 21. CI/release gates

Initial CI:

- format/lint;
- strict TypeScript;
- unit tests;
- schema validation/generation;
- fixture validation;
- localization parity;
- production build;
- dependency audit.

Before L1 release:

- integration tests;
- browser hero journey;
- accessibility checks;
- canonical comparison evals;
- authority/permission evals;
- preview smoke test;
- exact commit/deployment record;
- human release approval.

## 22. Deployment topology

```text
FATTY-BAMBA/StrideBrain
  → isolated Vercel project
  → preview deployments per PR
  → controlled demo deployment after gates
```

No domain cutover occurs during scaffolding.

`demo.primestrideai.com` moves only after the new vertical slice passes parity/release gates and rollback is prepared.

Marketing and internal OS remain separate repositories/deployments.

## 23. Migration/cutover strategy

1. Build new app in isolated preview.
2. Seed Horizon Atelier in new persistence.
3. Pass design/architecture/eval/security gates.
4. Run old and new demos in parallel.
5. Validate hero journey and bilingual behavior.
6. Point a temporary preview alias to new app.
7. Prepare DNS/Vercel alias rollback.
8. Move `demo.primestrideai.com` only after approval.
9. Keep old embedded demo for a defined rollback window.
10. Remove old runtime from `primestride-web` only after sustained parity.

## 24. Explicit non-goals

- arbitrary document upload/OCR;
- vector database;
- semantic ranking;
- external messages;
- quote approval/issue;
- autonomous agents;
- recurring monitoring;
- general workflow builder;
- complete ERP/project management;
- multiple independently deployed services.

## 25. Technical acceptance criteria

- fixture data never appears directly in UI components;
- every private repository query is organization scoped;
- quote and actual-cost persistence/types remain separate;
- comparison ranking is deterministic/versioned/explainable;
- evidence supports exact claims/values;
- optional AI failure leaves structured result intact;
- Viewer cannot receive sensitive economics or create action;
- action and audit are atomic/idempotent;
- stale run cannot create state;
- critical flow meets bilingual and performance budgets;
- architecture can replace synthetic identity/data with L2 adapters without rewriting domain/experience layers.