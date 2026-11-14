# Stage 4 — Deterministic Comparable Project Core

**Status:** implementation candidate  
**Issue:** #21  
**Branch:** `build/stage-4-comparable-project-core`

## 1. Purpose

Stage 4 implements the first deterministic answer to:

> **Have we done something like this before?**

It consumes the trusted Stage 2/3 runtime and project context, selects only authorized historical projects, applies `CPI-ELIGIBILITY-1.0` and `CPI-SIM-1.0`, persists an immutable comparison run, and returns structured ranked project metadata.

Stage 4 deliberately does **not** calculate historical economics, produce commercial findings, invoke a model, render polished cards/tables, or create business actions.

---

## 2. Delivered architecture

```text
RuntimeContext
  → assignment-aware active Project lookup
  → canRunComparison
  → ActiveProjectContextService
  → authorized historical profile batch
  → eligibility policy
  → deterministic eight-factor scoring
  → ranking / coverage / unknowns
  → immutable structured result
  → one atomic persistence transaction
  → authorized reopen by run ID
```

### Domain contracts

`src/modules/comparisons/domain/contracts.ts`

Defines:

- versioned policy identifiers;
- active and historical project profiles;
- eligibility decisions;
- known/unknown factor states;
- exact factor contributions;
- match bands and tiers;
- structured Stage 4 result/outcome DTOs;
- atomic persistence payloads.

### Eligibility policy

`src/modules/comparisons/domain/eligibility-policy.ts`

Active context is incomplete when mandatory project fields are unavailable. Historical candidates are evaluated only after authorization filtering and require:

- same organization;
- historical status;
- compatible comparison class, currency, and area unit;
- mandatory structured context;
- accepted metadata authority;
- valid completion date;
- no duplicate/test/policy exclusion.

### Similarity policy

`src/modules/comparisons/domain/similarity-policy.ts`

Implements `CPI-SIM-1.0`:

| Factor | Weight |
|---|---:|
| subtype | 15 |
| scope overlap | 25 |
| area similarity | 20 |
| commercial-category overlap | 15 |
| material overlap | 10 |
| supplier overlap | 5 |
| completion recency | 5 |
| location proximity | 5 |

All normalized values are converted to integer micros. Contributions and totals are stored in ten-thousandths. Display scores are rounded only after exact contributions have been summed.

Optional missing material/supplier information is `UNKNOWN`, earns no points, reduces evidence coverage, and does not become a confirmed mismatch.

### Active context and fingerprints

- `ActiveProjectContextService` builds the server-snapshot context.
- `fingerprints.ts` creates stable SHA-256 source, permission, and input fingerprints.
- the public result contains business-safe project/quote keys;
- internal database IDs remain in persistence input only.

### Candidate repository

`PrismaComparableProjectRepository`:

- selects no financial amount/cost/price fields;
- applies organization scope to every nested relation;
- returns current quote category IDs, project scope IDs, material keys, supplier keys, and bounded evidence IDs;
- performs one project query and at most one evidence query for all historical candidates;
- never loops through candidates with separate database reads.

### Run persistence

`PrismaComparisonRunRepository` persists in one transaction:

- `IntelligenceRun`;
- `ComparisonRun`;
- every ranked `ComparisonCandidate`;
- all eight `ComparisonFactor` rows per candidate;
- immutable structured result snapshot;
- source, permission, and input fingerprints.

Reopen reads the stored result and reauthorizes the active project under the current `RuntimeContext`; it does not silently recompute.

---

## 3. Candidate access policy

Authorization happens before scoring.

### Organization comparison library

These classifications may be compared organization-wide under v0.1 policy:

- `DEMO_SYNTHETIC`;
- `PUBLIC_REFERENCE`;
- `TENANT_APPROVED`.

`TENANT_APPROVED` represents an organization-published comparison record, not unrestricted private data.

### Tenant-private history

- Organization Admin / Financial Reviewer: organization-wide when policy permits;
- Project Manager / Estimator: assigned private historical projects only;
- Viewer: explicitly assigned private historical projects only;
- `TENANT_RESTRICTED`: excluded from the v0.1 candidate library.

The active project has already passed assignment-aware `canRunComparison`, so its authorized private metadata can be loaded separately.

Unauthorized records are absent before eligibility/scoring and therefore cannot affect counts, rankings, exclusions, persistence, or future model context.

---

## 4. Result behavior

### `COMPLETE`

Returns:

- versioned run metadata;
- active structural context;
- safe eligibility summary;
- up to six primary matches;
- bounded broader matches;
- exact factor summaries, differences, unknowns, and equivalence metadata;
- default top-three selection.

### `CONTEXT_INCOMPLETE`

Returns exact missing mandatory field codes. No candidate query, scoring, or persistence occurs.

### `NO_ELIGIBLE_HISTORY`

Returns a safe aggregate over already-authorized records only. Hidden records never influence the response.

### `UNAVAILABLE`

Nonexistent, unassigned, inaccessible, and cross-organization active project keys share the same public outcome.

### `FAILED`

Repository boundary violations, persistence failure, or unexpected exceptions fail closed with a request ID and no partial success claim.

---

## 5. Canonical Horizon fixture

The Stage 4 fixture adds only explainable structural facts needed by the accepted policy:

- Daan is classified as a flagship showroom for v0.1 subtype comparison;
- Zhongshan and Nanjing record signage material;
- Songshan and Banqiao record custom millwork material.

No rank or score is stored.

`verify-stage4-comparison.sql` derives all eight factors from database records and independently verifies:

1. Neihu — 88
2. Zhongshan — 81
3. Nanjing — 79
4. Daan — 71
5. Songshan — 69
6. Banqiao — 63

The SQL also verifies that canonical profiles have known scope/material/supplier factors.

---

## 6. Query/performance contract

Historical candidate snapshot:

- maximum rows: 100;
- project queries: 1;
- evidence queries: 0 or 1;
- total comparison-profile queries after active-context resolution: ≤2;
- no per-candidate query loop;
- no document bodies, embeddings, or financial amount columns loaded.

The query count is returned as repository diagnostics for tests/observability. Latency measurement against the preview database remains a release-evidence task.

---

## 7. Tests

### Pure policy tests

- all factor boundaries/functions;
- canonical top-six order and display scores;
- exact factor-to-total reconciliation;
- unknown optional factors and coverage;
- band/tier behavior;
- equivalent-within-two-point metadata;
- eligibility exclusions;
- eight factor rows per eligible candidate.

### Application tests

- complete deterministic run;
- atomic persistence input;
- unavailable active project;
- incomplete context short circuit;
- safe no-history aggregate;
- cross-organization fail closed;
- persistence failure;
- Viewer structural-only result;
- deterministic identical input/snapshot.

### Repository tests

- organization scope on top-level and nested queries;
- no financial fields in candidate selection;
- fixed two-query batch;
- organization-approved versus assignment-bound private history;
- no-query behavior without `project:compare`;
- one atomic persistence transaction;
- immutable reopen with current authorization;
- unassigned reviewer denial.

### Database verification

- all prior migration/fixture/authorization/Stage 3 gates;
- Stage 4 structural facet seed;
- SQL-derived canonical ranking and coverage.

---

## 8. Deliberate exclusions

Not implemented in Stage 4:

- quote/forecast/actual amount retrieval;
- historical medians or cost ranges;
- commercial variances or anomaly findings;
- claim/evidence bundles for result statements;
- polished project cards/comparison table;
- internal review action transaction;
- optional model explanation;
- semantic/vector scoring;
- arbitrary file ingestion;
- real customer data;
- deployment or DNS changes.

---

## 9. Required merge evidence

- exact-head CI green;
- schema/client generation and all migrations green;
- complete seed and all DB verification green;
- formatting/lint/typecheck/tests/build/audit green;
- canonical ranking verified in TypeScript and PostgreSQL;
- authorization review confirms candidate filtering before scoring;
- persistence review confirms atomicity and immutable authorized reopen;
- no Stage 5+ behavior introduced.
