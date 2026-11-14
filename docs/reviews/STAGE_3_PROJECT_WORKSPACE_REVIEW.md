# Stage 3 Review — Authorized Project Workspace Read Model

**Review stance:** independent product-data, authorization, architecture, and safety review  
**Issue:** #19  
**Status:** **PASS TO CI WITH REQUIRED MERGE GATES**

## 1. Review question

Does the Stage 3 implementation produce one coherent project workspace payload without weakening the Stage 2 tenant, assignment, financial-authority, or non-disclosure boundaries?

## 2. Verdict

The implementation is directionally correct and remains inside Stage 3 scope.

It may proceed to pull-request CI and exact-head review, but it must not merge until:

- format/lint/type/unit/build pass;
- PostgreSQL fixture/migration gates remain green;
- Viewer redaction/non-query behavior passes;
- every Prisma workspace query retains organization scope;
- any CI/type issues are repaired on the same branch;
- exact-head workflow evidence is recorded.

## 3. KEEP

### Trusted-context boundary

`GetProjectWorkspace` accepts a fully resolved `RuntimeContext`; it does not accept browser-selected organization, role, grants, assignment, or data mode.

### Assignment-aware project discovery

The use case begins with the Stage 2 assignment-aware `ProjectRepositoryPort` and returns the same public unavailable result for inaccessible and absent projects.

### Independent section authorization

Quote, forecast, actual, evidence, comparison, and internal-action capabilities are resolved independently through `AuthorizationService`.

Unauthorized commercial sections are not queried.

### Financial authority separation

The DTO keeps these concepts distinct:

- quoted price;
- supplier offer;
- forecast direct cost;
- reconciled actual cost.

The mapper does not derive a generic “project cost” from them.

### Conflicted-value suppression

A record with `authorityState: CONFLICTED` becomes a conflict state without exposing its amount as authoritative.

### Exact decimal transport

Prisma decimal-like values are converted to strings at the adapter boundary. No financial authority passes through JavaScript floating-point calculations.

### Evidence-first state

Workspace state uses only evidence/conflicts/staleness returned through authorized reads. Hidden records do not contribute to user-visible counts or state.

### Scope discipline

No candidate discovery, similarity scoring, historical aggregation, model synthesis, or write transaction has entered Stage 3.

## 4. CHANGE / VERIFY BEFORE MERGE

### 4.1 Viewer action visibility

A Viewer is denied proposal/create/assign capabilities. The Stage 3 route/mapper must also avoid returning internal action details unless a later explicit action-read policy authorizes them.

Required verification:

- Viewer test proves action-write affordances are false;
- Viewer payload contains no hidden action assignee/internal identifiers;
- preferred conservative behavior is an empty action summary for Viewer until action-read policy exists.

### 4.2 Evidence coverage seam

The Stage 3 adapter intentionally summarizes project/document evidence. Later stages must add claim-specific quote/forecast/actual evidence bindings through their own services rather than overloading this general workspace query.

This is not a Stage 3 blocker if the current fixture’s project/document evidence renders an honest summary.

### 4.3 Stable identifiers

Project, quote, supplier, material, and document DTOs use business keys.

Forecast and actual versions currently have no dedicated business-key column in the schema. Their derived workspace keys must remain scoped by the active project/version and must never expose raw internal IDs.

Action navigation should gain a dedicated business key before external-facing deep links are introduced.

### 4.4 JSON optional-field discipline

Optional fields serialize by omission. TypeScript exact-optional behavior must remain green, and `undefined` must not be treated as a business state.

Known, unknown, restricted, conflicted, and unavailable commercial states remain explicit tagged unions.

### 4.5 Integration coverage

Current unit/repository tests use mock ports/delegates. Before the stage is called release-complete, add or demonstrate seeded-PostgreSQL integration coverage for:

- Xinyi current quote v3;
- Xinyi forecast v3;
- role-specific RuntimeContext;
- evidence/stale/conflict fixture rows;
- cross-organization non-disclosure.

CI migration/seed/invariant jobs provide a baseline but do not replace read-model integration assertions.

## 5. Authorization checklist

| Boundary | Review |
|---|---|
| trusted RuntimeContext required | PASS |
| browser cannot select organization/role | PASS |
| initial project lookup assignment aware | PASS |
| organization scope in workspace adapter queries | PASS, CI/test verification required |
| quote authorization independent | PASS |
| forecast authorization independent | PASS |
| actual authorization independent | PASS |
| evidence authorization independent | PASS |
| Viewer commercial reads skipped | PASS in unit contract |
| Viewer values absent before DTO mapping | PASS in unit contract |
| unavailable/nonexistent response equivalent | PASS |
| internal denial reasons excluded from DTO | PASS |
| cross-tenant IDs/counts/titles excluded | PASS by contract; integration proof required |

## 6. Data-authority checklist

| Rule | Review |
|---|---|
| superseded quote/forecast/actual excluded | PASS in repository query contract |
| quote and forecast separate | PASS |
| actual and forecast separate | PASS |
| supplier offer separate | PASS |
| conflicted amount not authoritative | PASS |
| stale supplier offer visibly stale | PASS |
| evidence version/authority/effective date retained | PASS |
| missing optional records not invented | PASS |
| decimal strings exact | PASS |

## 7. State-policy review

Accepted precedence:

```text
CONFLICTED > STALE > PARTIAL > PERMISSION_RESTRICTED > READY
```

Rationale:

- a visible conflict must dominate a lower-severity presentation state;
- stale evidence must not appear merely “partial”;
- missing authorized data is more actionable than generic permission restriction;
- permission restriction is explicit only when no visible conflict/stale/partial condition supersedes it;
- unauthorized hidden data never changes the result.

`UNAVAILABLE` remains a separate non-disclosing outcome, not an available workspace state.

## 8. Test review

### Present

- full Mei project context;
- exact decimal strings;
- Viewer commercial repository methods not called;
- Viewer restricted DTOs and no action-write capabilities;
- unavailable short-circuit;
- conflicted actual amount suppression;
- stale supplier offer;
- partial project/evidence state;
- organization-scoped Prisma query assertions;
- non-sensitive evidence classification filter;
- conflict lookup bounded by authorized evidence IDs.

### Required before final acceptance

- exact-head CI result;
- organization-admin workspace case;
- assigned versus unassigned financial-reviewer case;
- seeded-PostgreSQL integration or equivalent exact fixture proof;
- no raw Prisma object/internal ID snapshot leakage;
- bilingual display assertion for English as well as Traditional Chinese.

These may be completed in this PR or recorded as blocking follow-up before merge; they are not optional for Stage 3 exit.

## 9. Architecture review

The implementation preserves the intended modular-monolith boundary:

```text
Next.js/experience (later)
  → GetProjectWorkspace
  → authorization + repository ports
  → Prisma adapters
  → Postgres fixture
```

No React component imports Prisma or fixture SQL.

The workspace DTO is a permission-specific application view, not a persistence model.

## 10. Final recommendation

Open the implementation PR and use GitHub Actions as the next independent verifier.

Do not merge on document review alone.

After CI fixes, re-run this review against the exact head and record:

- workflow run URL;
- commit SHA;
- tests/build outcome;
- remaining known limitations;
- confirmation that Stage 4 comparison behavior is still absent.
