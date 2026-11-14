# Stage 4 Review — Deterministic Comparable Project Core

**Review stance:** independent product-data, authorization, calculation, persistence, and scope review  
**Issue:** #21  
**Status:** **PASS TO CI; MERGE REMAINS BLOCKED**

## 1. Review question

Does Stage 4 produce a deterministic, authorization-safe, reopenable comparable-project result without mixing financial authority, leaking hidden history, hard-coding fixture scores, or pulling Stage 5+ behavior into the first comparison core?

## 2. Verdict

The implementation is structurally aligned with the accepted v0.1 contracts and may proceed to exact-head CI.

It must not merge until:

- TypeScript and PostgreSQL independently reproduce the canonical ranking;
- all factor contributions reconcile exactly to stored totals;
- candidate authorization is proven before scoring;
- run persistence is atomic;
- reopen uses the stored immutable result and current authorization;
- no financial values, model synthesis, action write, or semantic score enters Stage 4;
- every prior Stage 2/3 gate remains green.

## 3. KEEP

### Pure deterministic policy

The scorer is isolated from persistence, UI, and AI. The accepted eight factors and weights are versioned and testable.

### Integer reconciliation

Normalized values use integer micros and contributions use ten-thousandths. The stored total is the sum of stored factor contributions; display rounding happens afterward.

### Explicit unknown state

Empty optional material or supplier sets are `UNKNOWN`, not perfect overlap and not confirmed mismatch. Unknown factors reduce coverage.

### Authorization before scoring

Candidate queries receive trusted `RuntimeContext` and organization scope. Records outside the authorized comparison library are absent before eligibility or scoring.

### Assignment-aware private history

- Admin and Financial Reviewer may receive organization-private history under policy;
- Project Manager/Estimator and Viewer receive only assigned private history;
- organization-published/demo/public comparison records may be used across the organization;
- restricted records remain excluded.

### Structural-only candidate data

The candidate adapter selects category/relationship IDs and evidence references. It does not select quotation amounts, unit prices, forecast totals, actual costs, margins, or supplier-offer amounts.

### Fixed query budget

Historical profiles are loaded in one bounded project query plus at most one evidence query. There is no per-candidate data loop.

### Atomic immutable run

One transaction writes `IntelligenceRun`, `ComparisonRun`, candidates, and factors. Reopen reads the stored result and reauthorizes the active project; it does not recompute silently.

### Non-disclosing outcomes

Inaccessible active project and inaccessible run both return the same public unavailable shape. Cross-organization rows fail closed.

## 4. CHANGE / VERIFY BEFORE MERGE

### 4.1 Canonical fixture corrections must remain transparent

The Stage 4 fixture adjusts only explicit synthetic facets:

- Daan subtype;
- signage material for Zhongshan/Nanjing;
- custom-millwork material for Songshan/Banqiao.

No score or rank may be stored. CI must derive the accepted scores from records through both TypeScript and SQL.

### 4.2 Ranking tie semantics

Within-two-point candidates are marked equivalent for interpretation, but display remains score descending. Evidence coverage, completion date, and business key are deterministic tie-breakers only; they must not be described as extra similarity points.

### 4.3 Active and historical access are different decisions

The active project has already passed assignment-aware comparison authorization. Historical private data follows the separate comparison-library/assignment policy. Implementations must not reuse the active-project permission as organization-wide historical permission.

### 4.4 Evidence coverage is factor availability, not evidence quality

Stage 4 coverage answers whether configured factors are known. It does not yet prove historical cost authority, source freshness, or commercial sufficiency. Stage 5/7 must add those semantics without redefining the score.

### 4.5 No economic language in Stage 4 result

The result may say projects are structurally comparable. It must not yet state historical price ranges, current-quote variance, actual-cost medians, overpricing, or supplier conclusions.

### 4.6 Persistence snapshot validation

Reopen accepts only the versioned stored public result shape. Current access is rechecked. Future schema migration must version/transform snapshots explicitly rather than mutate prior results.

## 5. Authorization checklist

| Boundary | Review |
|---|---|
| trusted RuntimeContext required | PASS |
| active project assignment/capability checked | PASS |
| organization scope on project and nested reads | PASS by contract; CI/tests required |
| approved comparison library explicit | PASS |
| private history assignment-bound for PM/Viewer | PASS |
| Admin/Financial org-wide private policy explicit | PASS |
| restricted history excluded | PASS |
| hidden candidates absent before scoring | PASS by query contract |
| cross-org row fails closed | PASS in application test |
| Viewer result excludes financial values | PASS in DTO/test contract |
| current access rechecked on reopen | PASS |
| unavailable cases non-disclosing | PASS |

## 6. Calculation checklist

| Rule | Review |
|---|---|
| policy version fixed | PASS |
| eight weights total 100 | PASS |
| Jaccard canonical IDs | PASS |
| logarithmic area function | PASS |
| 60-month recency decay | PASS |
| configured location/subtype adjacency | PASS |
| unknown optional factors | PASS |
| exact contribution reconciliation | PASS in unit contract |
| bands and primary thresholds | PASS |
| canonical top-six expected | PASS in unit/SQL contract |
| no semantic/vector score | PASS |

## 7. Persistence checklist

| Rule | Review |
|---|---|
| one transaction | PASS by adapter/test contract |
| one IntelligenceRun | PASS |
| one ComparisonRun | PASS |
| all candidate/factor rows written | PASS |
| source/permission/input fingerprints stored | PASS |
| stored public snapshot versioned | PASS |
| reopen does not recompute | PASS |
| current authorization reapplied | PASS |
| partial write cannot be returned as success | PASS by failure contract |

## 8. Test review

Present coverage includes:

- factor boundaries;
- canonical ranking;
- contribution reconciliation;
- unknown optional data;
- eligibility exclusions;
- complete/incomplete/no-history/unavailable/failed outcomes;
- cross-organization fail closed;
- Viewer structural-only result;
- deterministic repeated result;
- nested tenant scope and no-financial-field selection;
- fixed candidate query count;
- assignment-aware private-history query policy;
- atomic persistence and immutable reopen;
- SQL-derived canonical score/order verification.

Before final acceptance, exact-head CI must additionally prove:

- repository formatting/lint/typecheck;
- all unit and architecture tests;
- Prisma schema/client generation;
- all migrations and fixture seed;
- Stage 2, Stage 3, and Stage 4 SQL invariants;
- production Next.js build;
- dependency audit.

## 9. Scope audit

Confirmed absent:

- historical quote/actual aggregation;
- financial medians/ranges;
- variance findings;
- polished comparison UI;
- internal action creation;
- AI/model calls;
- semantic/vector ranking;
- arbitrary ingestion;
- production customer data;
- deployment/domain changes.

## 10. Final recommendation

Open a draft implementation PR and let GitHub Actions independently evaluate code, tests, migrations, fixtures, and SQL ranking verification.

Repair only demonstrated failures on the same branch. Record the final exact-head SHA and workflow run before merge.
