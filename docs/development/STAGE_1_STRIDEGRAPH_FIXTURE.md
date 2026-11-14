# Stage 1 — StrideGraph Persistence and Horizon Atelier Fixture

**Status:** Implementation candidate under PR review  
**Stage boundary:** schema, migration, exact-decimal policy, repository scoping, fixture, and validation only

## Purpose

Stage 1 establishes a production-shaped persistence foundation for Comparable Project Intelligence without implementing the comparison service or product UI.

The database is designed to keep these observations distinct:

- quoted price;
- supplier offer;
- forecast direct cost;
- reconciled actual cost.

No service may collapse them into a generic cost field.

## Included schema areas

- organizations, people, memberships, roles, and project assignments;
- clients and projects;
- project scopes, materials, and suppliers;
- documents and immutable/versioned evidence;
- quotation/version/item records;
- forecast cost versions and lines;
- reconciled project-cost versions and lines;
- supplier offers and validity dates;
- evidence references and conflicts;
- intelligence and comparison run persistence;
- comparison candidates, factors, and claims;
- proposed actions, actions, and audit events.

The comparison/action tables are persistence seams only. Their Stage 2 and Stage 4 services are not implemented here.

## Database authority invariants

The committed migrations contain explicit PostgreSQL checks in addition to the Prisma object model.

They enforce that:

- `QuoteVersion` can only represent `QUOTED_PRICE`;
- `SupplierOffer` can only represent `SUPPLIER_OFFER`;
- `ForecastCostVersion` can only represent `FORECAST_DIRECT_COST`;
- `ProjectCostVersion` can only represent `RECONCILED_ACTUAL_COST`;
- quoted, forecast, and supplier-offer records cannot claim `RECONCILED_ACTUAL` authority;
- reconciled actual versions require a reconciliation date;
- superseded versions must point to another version and cannot point to themselves;
- quote totals reconcile as before-tax amount plus tax;
- quantity × unit rate reconciles to every stored line amount;
- project area and programme values remain positive;
- comparison scores, evidence coverage, ranks, weights, and normalized factors remain within defined ranges.

The schema-level separation is therefore enforced by the database, not only by TypeScript naming or UI labels.

## Exact financial arithmetic

Authoritative application calculations use `src/modules/finance/fixed-decimal.ts`.

Rules:

- decimal values enter as strings;
- values are represented as scaled `bigint` atoms;
- money uses two decimal places;
- quantities use three decimal places;
- unit rates use six decimal places;
- percentages use four decimal places;
- rounding is explicit and defaults to half-up;
- line reconciliation has an explicit tolerance;
- JavaScript binary floating-point values are not accepted as authoritative inputs.

PostgreSQL values use matching `numeric`/`decimal` columns.

## Horizon Atelier fixture

The SQL fixture is:

```text
prisma/fixtures/horizon-atelier.sql
```

It replaces only the two known synthetic fixture organizations and then seeds the controlled dataset inside one transaction. It does not truncate unrelated organizations.

The fixture contains:

- one Horizon Atelier organization;
- four Horizon membership personas;
- 24 completed projects;
- five active projects;
- the Xinyi hero project and canonical comparable set;
- 20 suppliers;
- versioned quotations;
- forecast and reconciled actual costs;
- 300–500 combined quotation and actual-cost lines;
- 100+ evidence references;
- a superseded Xinyi quotation chain;
- a stale supplier offer;
- an open evidence conflict outside the primary hero aggregate;
- only two eligible reconciled actual lighting observations in the canonical comparable set;
- a separate organization and inaccessible project.

All values are `DEMO_SYNTHETIC` and are not market claims.

## Canonical fixture contract

The TypeScript manifest is:

```text
src/fixtures/horizon-atelier/manifest.ts
```

It records:

- expected project/count invariants;
- canonical comparable ordering;
- hero economics;
- deliberately imperfect cases.

This manifest is an evaluation contract, not a precomputed comparison result returned to the UI.

## Migration commands

The repository currently pins Prisma CLI commands explicitly to `7.10.1` through `npx` so the Stage 1 PR does not introduce a runtime database client before an adapter actually imports it.

```bash
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:verify
```

Combined local fixture reset:

```bash
npm run db:reset-fixture
```

Required environment:

```text
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

## CI database gate

The main CI job starts an isolated PostgreSQL service and runs, in order:

1. locked npm install;
2. Prisma schema validation;
3. Prisma client generation;
4. committed migration deployment;
5. Horizon fixture seed;
6. financial/authority invariant verification;
7. comprehensive organization-relationship and evidence-subject verification;
8. formatting, lint, type checks, unit tests, application build, and dependency audit.

A fixture or schema change is not accepted when migration, seed, or either verification step fails.

## SQL verification contract

`prisma/fixtures/verify-horizon.sql` rejects:

- wrong active/completed project counts;
- missing roles or suppliers;
- too few quote versions or evidence references;
- quote/cost line-count drift;
- incorrect Xinyi v3 or forecast totals;
- more or fewer than two eligible canonical lighting actual observations;
- missing stale offer, open conflict, or separate-tenant project;
- missing Stage 1 database constraints;
- an attempted financial observation-type relabel;
- an attempted unreconciled line amount;
- quotation lines that do not reconcile to their version total;
- reconciled actual lines that do not reconcile to their cost-version total;
- eligible actual-cost lines without evidence;
- quote items without quote evidence;
- missing Xinyi supersession links.

`prisma/fixtures/verify-relations.sql` checks every seeded repository relationship for organization agreement and verifies that every polymorphic evidence reference points to an existing subject in the same organization.

## Repository boundary

`PrismaProjectRepository` demonstrates the required adapter pattern:

```text
trusted RuntimeContext
  → organization-scoped database query
  → capability check
  → explicit project assignment for every non-admin role
  → neutral not-found result for denied or absent records
```

A browser, URL, model, or business key cannot choose the authoritative organization. Missing assignment context fails closed.

## Reseeding and safety

The fixture cleanup targets only:

- `org_horizon` / `HORIZON_ATELIER`;
- `org_northern` / `NORTHERN_STUDIO`.

Cascading deletion is limited to records owned by those fixture organizations. Other organizations are left untouched.

The fixture still contains destructive reset behavior for those two identities. It must never be run where either identifier belongs to real customer data.

The controlled demo will receive its own isolated database before deployment work begins.

## Known limitations

- no row-level security policy is enabled in Stage 1;
- no authenticated identity provider is connected;
- no production Prisma client is instantiated by application code yet;
- no document object storage exists;
- no comparison scoring service exists;
- no action transaction exists;
- no real customer data is allowed;
- cross-organization relationship consistency is exhaustively verified for the fixture and repository adapter, but composite database foreign keys and RLS remain L2 hardening work.

## Exit criteria

Stage 1 is complete only when:

- Prisma schema validation and client generation pass;
- all committed migrations apply to an empty PostgreSQL database;
- the Horizon fixture seeds cleanly and safely reseeds;
- both SQL verification suites pass;
- exact-decimal tests pass;
- repository-scope tests pass;
- the normal application CI remains green;
- an independent review records no critical authority, isolation, or data-integrity blocker.
