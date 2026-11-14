# Independent Technical Architecture Review — StrideBrain v0.1

**Review scope:** technical architecture, schema, comparison service, evidence/authority, authorization, persistence, and AI boundary  
**Reviewer stance:** adversarial architecture, security, reliability, and migration review  
**Verdict:** **PASS FOR UX RECONCILIATION; IMPLEMENTATION REQUIRES THE CONDITIONS BELOW**

## 1. Executive assessment

The architecture is coherent with the Product Decision Pack and avoids both major failure modes:

- copying the static/browser demo architecture;
- overengineering the first slice into an agent/microservice/graph platform.

The modular monolith, relational StrideGraph schema, deterministic comparison service, claim-level evidence model, and separate action authorization create a credible production-shaped foundation.

The architecture is ready to reconcile with Product/UX Architecture before scaffolding.

## 2. KEEP

### Modular monolith

Appropriate for the first product/team/slice. Clear modules and repository ports provide extensibility without premature distributed systems.

### Durable Postgres fixture tenant

Using the actual schema for Horizon Atelier is stronger than JSON/browser state and proves action/audit persistence early.

### Explicit runtime context

Server-derived identity → membership → organization → capability → assignment is the correct foundation.

### Separate commercial models

QuoteVersion, ForecastCostVersion, ProjectCostVersion, and SupplierOffer remain distinct. This is a blocking trust requirement.

### Deterministic comparison

Eligibility, factors, ranking, tie behavior, evidence coverage, economics, and synthesis are typed/versioned/testable.

### Claim-level evidence

The architecture avoids the common mistake of treating any linked document as proof of any project field.

### Durable ComparisonRun

Persisting snapshots/fingerprints supports evidence inspection, action linkage, staleness, and reproducibility.

### ProposedAction separation

The model/system proposal remains separate from authorized Action creation and atomic AuditEvent.

### Optional AI

AI is secondary, verified, and feature-flag removable.

## 3. REQUIRED CHANGES / CONDITIONS BEFORE BUILD

### 3.1 Avoid an oversized first Prisma migration

The logical schema is comprehensive. The first implementation migration should include only objects necessary to support the accepted slice and fixture.

Required minimum:

- organization/identity/membership/capability/assignment;
- client/project/facets/supplier/material;
- document/version/evidence/conflict;
- quote/forecast/cost/supplier offer;
- intelligence/comparison run/candidate/factor/claim;
- proposed action/action/audit.

Fields/workflows not exercised should remain documented seams rather than speculative tables.

### 3.2 Define exact decimal/rounding policy in code before fixture assertions

Hero percentages and scores need a shared calculation package with:

- decimal library/DB conversion rules;
- rounding precision;
- median behavior;
- percentage display tolerance;
- reconciliation tolerance.

Do not rely on JavaScript binary floating point for money or expected-score assertions.

### 3.3 Keep JSON snapshots bounded and versioned

`resultSnapshot`, `activeContextSnapshot`, `locator`, and calculation JSON are useful, but can become untyped dumping grounds.

Required controls:

- schema validators;
- version field;
- size limits;
- no source bodies/secrets;
- normalized relational fields for query-critical data;
- migration/compatibility strategy.

### 3.4 Establish permission-specific result views

A canonical ComparisonRun may contain sensitive economics. Architecture must choose and test one of:

- canonical sensitive run + authorization/redaction on every read; or
- permission-scoped run/result snapshots.

Recommended v0.1:

- canonical org-scoped run created by authorized user;
- every read reauthorized;
- role-specific DTO generated server-side;
- Viewer cannot load a run created with actuals unless redaction is provably complete.

Cache keys must include permission scope.

### 3.5 Treat fixture IDs as data, not code constants

Canonical business keys are useful for evals, but services/components must not branch on `PRJ-XINYI-026` or named projects.

### 3.6 Define run invalidation triggers precisely

Before action implementation, specify which database changes mark or make a run stale:

- active quote/forecast version;
- project profile/facets;
- candidate project metadata;
- relevant cost/quote authority;
- conflict/supersession;
- policy/calculation version;
- access scope.

A fingerprint recheck at write time is mandatory even if proactive stale marking exists.

### 3.7 Add request/idempotency design before action code

Define:

- required idempotency header/token;
- uniqueness scope;
- retry response;
- transaction isolation;
- duplicate proposal handling;
- receipt recovery after network interruption.

### 3.8 Prepare row-level security without pretending L1 is L2

Application scoping and cross-tenant tests are required immediately.

Database RLS may be staged before real customer data, but documentation/UI must continue to label the first release L1 until identity, RLS, backup, retention, incident, and security gates pass.

### 3.9 Build optional AI only after deterministic UI works

Do not allow provider integration to delay or distort the first structured comparison implementation.

Recommended sequence:

1. domain policies;
2. fixture/repositories;
3. structured UI/evidence;
4. action flow;
5. evals/performance;
6. optional explanation.

### 3.10 Limit polymorphic evidence risk

`EvidenceReference.subjectType/subjectId` is pragmatic but weakens database FK integrity.

Required mitigation:

- allowlisted subject/source types;
- domain factories, not arbitrary inserts;
- fixture/integration validators;
- database check constraints where feasible;
- no generic public “create evidence” endpoint.

If integrity becomes problematic, introduce typed join tables for high-value subjects.

## 4. SECURITY REVIEW

### Positive

- tenant filtering before scoring/model context;
- server-derived context;
- no client organization authority;
- sensitive actuals omitted rather than blurred;
- action reauthorization;
- model has no write authority;
- external communication absent;
- evidence preview treated as untrusted.

### Required implementation tests

- cross-org IDs across every repository/action parameter;
- role grant/deny combinations;
- Viewer result/model context inspection;
- stored ComparisonRun access after permission revocation;
- evidence preview URL/storage-key leakage;
- CSRF/origin/session behavior;
- idempotency/race tests;
- SQL/query scoping review;
- source text injection into optional model.

## 5. PERFORMANCE REVIEW

The targets are plausible at fixture scale if reads are batched.

Risks:

- N+1 evidence/line loading;
- loading all 24 projects with every document;
- serial authority checks;
- excessive JSON snapshot size;
- optional explanation accidentally included in primary request;
- unindexed taxonomy joins.

Required benchmark scenario:

- 24 completed + 5 active projects;
- 500 commercial/cost lines;
- 100+ evidence references;
- canonical six matches;
- full top-three economics/evidence assembly.

Capture query count and plan, not latency only.

## 6. RELIABILITY REVIEW

Required:

- comparison run statuses and failed-run cleanup;
- action/audit transaction;
- idempotent retries;
- safe stale-run behavior;
- database outage states;
- optional AI isolation;
- migration rollback/reseed plan;
- exact release/deployment metadata.

No user-visible success occurs before committed transaction result.

## 7. MIGRATION AND ROLLBACK

### Application

New repository/deployment is isolated, so preview rollback is straightforward.

### Database

During L1 synthetic preview:

- seed can be recreated;
- migrations must still be reviewed/reversible or forward-fixable;
- action/audit test records should have fixture reset tooling;
- no real customer data simplifies rollback but does not justify careless migrations.

### Domain cutover

Keep the old embedded demo until:

- new hero flow passes;
- bilingual/accessibility/release gates pass;
- stable preview is approved;
- alias rollback is documented.

## 8. UX RECONCILIATION QUESTIONS

Technical implementation must reconcile these with design:

1. exact route/query persistence for run and selected candidates;
2. whether evidence panel uses stored bundle DTO or on-demand query;
3. Viewer access to canonical runs containing sensitive claims;
4. how factor/evidence details load under 500 ms;
5. mobile comparison DTO/layout needs;
6. action draft persistence and expiry;
7. language switch preservation;
8. source deep-link return context;
9. evidence coverage label calculation/explanation;
10. which statuses are always visible versus panel-only.

## 9. DO NOT INTRODUCE

- direct Prisma in React components;
- fixture imports in UI/domain;
- general-purpose agent tool execution;
- vector database in v0.1;
- client-side tenant selection as authority;
- browser localStorage as business source of truth;
- model-generated ranking/calculations;
- shared operator tokens;
- external message connectors;
- a giant generic `Record`/`cost` table;
- microservices or queues without measured need.

## 10. Build-order recommendation

```text
1. repository/app scaffold + CI
2. schema and Horizon fixture validator
3. runtime context + authorization
4. project workspace read model
5. deterministic eligibility/scoring
6. economics/authority/evidence
7. ComparisonRun persistence
8. structured UI and evidence panel
9. ProposedAction → Action + AuditEvent
10. canonical/bilingual/permission/E2E evals
11. performance tuning
12. optional verified explanation
13. isolated preview release review
```

## 11. Final verdict

**PASS FOR UX RECONCILIATION.**

The architecture is strong enough to become the implementation contract after the UX and technical documents are reconciled into one build contract.

Application scaffolding should remain blocked until that reconciliation confirms:

- shared result/state DTOs;
- evidence-panel loading/access strategy;
- action draft/receipt behavior;
- routes and state restoration;
- exact first migration/fixture scope;
- acceptance/eval matrix.

Once reconciled, the product can proceed to Issue #7 without returning to feature-by-feature improvisation.