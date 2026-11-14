# Stage 1 Independent Review — StrideGraph Schema and Horizon Atelier Fixture

**Scope:** PR #16  
**Issue:** #15  
**Review stance:** adversarial product-data, authority, tenant-boundary, and release review  
**Verdict:** **PASS FOR MERGE ONLY WHEN THE EXACT PR HEAD PASSES THE FULL CI GATE**

## 1. Scope reviewed

The review covers only Stage 1:

- PostgreSQL/Prisma persistence schema;
- committed migrations;
- financial authority constraints;
- exact fixed-decimal arithmetic;
- organization-scoped project repository adapter;
- Horizon Atelier synthetic fixture;
- SQL invariant and relationship verification;
- database-enabled CI;
- fixture and repository regression tests.

The following are explicitly outside this review:

- comparable-project ranking implementation;
- product UI;
- evidence panel UI;
- governed-action transaction;
- live authentication;
- row-level security;
- arbitrary document ingestion;
- real customer data;
- semantic/vector search.

## 2. Product-boundary verdict

**PASS.**

The implementation remains within the reconciled build contract. It does not add Stage 2 comparison behavior, Stage 3 UI, Stage 4 action execution, or deployment/domain changes.

The fixture records expected evaluation outcomes but does not expose a precomputed result object to a UI. This preserves the requirement that future comparison results must be calculated from stored structured data.

## 3. Financial authority review

**PASS.**

The design keeps four observation types separate:

- `QUOTED_PRICE` in `QuoteVersion` / `QuoteItem`;
- `SUPPLIER_OFFER` in `SupplierOffer` / `SupplierOfferItem`;
- `FORECAST_DIRECT_COST` in `ForecastCostVersion` / `ForecastCostLine`;
- `RECONCILED_ACTUAL_COST` in `ProjectCostVersion` / `CostLine`.

The second migration adds PostgreSQL checks that prevent relabeling one model as another and prevents quoted, forecast, or supplier-offer records from claiming reconciled-actual authority.

Additional checks enforce:

- reconciled actual versions require `reconciledAt`;
- superseded versions require a successor and cannot point to themselves;
- quote totals reconcile before tax plus tax;
- line quantity multiplied by rate reconciles to stored amount;
- financial values are nonnegative;
- supplier-offer validity cannot end before its offer date.

This materially reduces the risk that later services accidentally mix proposed price with historical actual cost.

## 4. Financial arithmetic review

**PASS.**

The fixed-decimal module:

- accepts authoritative values as strings;
- stores scaled values as `bigint` atoms;
- uses explicit scales for money, quantity, rate, and percent;
- uses explicit half-up rounding by default;
- implements deterministic median and percentage variance;
- exposes reconciliation with an explicit tolerance;
- does not depend on JavaScript binary floating point for authoritative arithmetic.

Tests cover parsing, precision rejection, rounding, addition, multiplication, division, rescaling, median, variance, and line reconciliation.

## 5. Tenant and authorization review

**PASS FOR L1 / L2-SHAPED SEAM; NOT L2 COMPLETE.**

The repository adapter:

- receives a trusted `RuntimeContext`;
- places `organizationId` in the database query;
- checks `project:read` before querying;
- requires explicit project assignment for every non-admin role;
- fails closed when assignment context is missing;
- returns the same neutral `null` outcome for absent and denied records;
- allows organization-wide project read only for `ORGANIZATION_ADMIN`.

The fixture includes a separate organization and inaccessible project so future retrieval tests have an explicit negative tenant case.

The relationship verifier checks organization agreement across every seeded repository relationship, including:

- memberships and people;
- projects and clients;
- assignments;
- scopes, materials, and suppliers;
- documents and versions;
- evidence and conflicts;
- quotes, forecasts, actual costs, and supplier offers;
- intelligence/comparison records;
- proposed actions, actions, and audit events.

It also validates polymorphic evidence subjects against the target table and organization.

### Residual limitation

PostgreSQL row-level security and composite organization foreign keys are not enabled in Stage 1. Organization consistency is currently enforced through repository scoping, database verification, and future service contracts. This is acceptable for the fictional L1 fixture but remains a blocking requirement before L2 real-data use.

## 6. Evidence and conflict review

**PASS.**

The fixture includes:

- versioned documents;
- source locators;
- authority state;
- effective/stale dates;
- quote-item and actual-cost-line evidence;
- an open evidence conflict;
- stale supplier evidence;
- superseded quote history;
- an intentionally insufficient actual-cost case for lighting.

SQL verification rejects:

- eligible reconciled actual lines without evidence;
- quote items without quoted-price evidence;
- evidence references whose target is missing or belongs to another organization;
- missing conflict/staleness/supersession fixture cases.

The open conflict is deliberately outside the hero aggregate so the default successful flow can coexist with a tested conflict state.

## 7. Fixture-depth review

**PASS.**

The Horizon Atelier fixture contains the accepted production-shaped scale:

- four Horizon membership personas;
- 24 completed and five active Horizon projects;
- 20 suppliers;
- 40+ quote versions;
- 300–500 combined quotation and actual-cost lines;
- 100+ evidence references;
- the Xinyi hero project;
- the canonical top-six comparison set;
- imperfect data cases;
- a separate inaccessible organization/project.

The fixture reproduces the accepted per-area hero findings through stored values and exact arithmetic rather than hard-coded result copy:

- current quoted price approximately 7% above the top-comparable quoted median;
- forecast direct cost approximately 6% above the eligible actual median;
- imported stone approximately 18% above eligible historical actuals;
- lighting approximately 9% above quoted history while actual-cost evidence remains insufficient;
- custom millwork approximately aligned;
- signage approximately 5% below quoted history.

All records remain `DEMO_SYNTHETIC` and are not market claims.

## 8. Reseed and migration safety review

**PASS FOR A DEDICATED DEMO/CI DATABASE.**

The fixture no longer truncates the organization root globally. It deletes only the two reserved fixture organizations:

- `HORIZON_ATELIER` / `org_horizon`;
- `NORTHERN_STUDIO` / `org_northern`.

Unrelated organizations are left untouched.

The two fixture identifiers must never be reused for real customer tenants. The fixture remains destructive for those two identities and must only run in a dedicated local, CI, or controlled-demo database.

The baseline migration is generated from the schema and committed. The authority-hardening migration is explicit and independently verified.

## 9. CI and quality-gate review

The PR is merge-eligible only when its exact head passes all of the following in one clean run:

1. locked dependency installation;
2. Prisma schema validation;
3. Prisma client generation;
4. deployment of both committed migrations to empty PostgreSQL;
5. Horizon fixture seed;
6. financial/authority invariant verification;
7. comprehensive relationship/evidence verification;
8. formatting;
9. lint;
10. TypeScript checking;
11. unit and architecture tests;
12. Next.js production build;
13. production dependency audit at high severity.

Earlier intermediate runs confirmed database migration, seed, and verification success but found formatting-only issues. Those issues were corrected mechanically. A final approval review must cite the successful exact-head CI run.

## 10. Security review findings resolved during review

The review identified and required fixes for three issues before approval:

### 10.1 Authority was separated by table but not database constraint

**Resolved:** PostgreSQL checks now prohibit observation-type relabeling and invalid reconciled authority.

### 10.2 Missing assignment context could fail open

**Resolved:** every non-admin role requires an explicit project assignment; absent assignment state returns neutral denial.

### 10.3 Fixture reset could delete unrelated tenants

**Resolved:** fixture cleanup now targets only reserved synthetic fixture organizations.

## 11. Remaining limitations and future requirements

These do not block Stage 1 merge but must remain visible:

- no real identity provider;
- no row-level security;
- no production database client instantiated by application routes;
- no L2 tenant onboarding or lifecycle;
- no document object storage;
- no ingestion/version publication workflow;
- no comparison service;
- no action transaction;
- no browser E2E against the future data-backed product flow;
- no real customer data permitted;
- no semantic/vector ranking;
- no production backup/recovery or retention policy.

## 12. Final recommendation

**Approve and merge only after the exact current head passes the complete CI gate.**

After merge, proceed to Stage 2 as a separate PR implementing the deterministic Comparable Project service and persisted comparison runs. Do not begin project-workspace UI until the Stage 2 structured result contract and canonical ranking/economics tests pass.
