# StrideBrain v0.1 — Authorization Model

**Status:** Technical Architecture for review  
**Scope:** Comparable Project Intelligence and internal review action  
**Release:** L1 controlled demo with L2-shaped authorization seams

## 1. Security objective

Authorization must be enforced below the UI and below optional AI.

The server derives:

```text
verified identity
  → active membership
  → organization
  → role and capability grants/denials
  → project assignment
  → object sensitivity/access
```

A browser, URL, request body, model output, or tool argument cannot choose the authoritative organization, role, or permission scope.

## 2. Authorization principles

1. Deny by default.
2. Organization scope is mandatory for every private read/write.
3. Capabilities authorize actions; role names are convenience bundles.
4. Project assignment and data sensitivity refine capability decisions.
5. Retrieval is filtered before data enters UI or model context.
6. Inaccessible records do not leak through counts, titles, scores, citations, errors, or timing where practical.
7. Writes reauthorize at confirmation time.
8. Model/planner output never grants authority.
9. Audit records capture consequential authorized writes.
10. Demo identity uses the same application contract as future real identity.

## 3. Runtime context

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

RuntimeContext is created only by trusted server code after session verification.

It is not serialized wholesale to the browser. The browser receives a bounded capability view sufficient for presentation; the server remains authoritative.

## 4. L1 demo identity adapter

The controlled demo may use a signed, server-issued session that maps to a fixture membership.

Required properties:

- opaque session identifier;
- secure, HTTP-only, same-site cookie;
- server-side membership lookup;
- expiry/revocation;
- no role/organization supplied only by client;
- no shared access code reused as an authorization header in normal app flows;
- no real customer records;
- fixture users for Mei, Financial Reviewer, Viewer, and Organization Admin scenarios.

The adapter implements:

```ts
interface IdentityContextPort {
  resolve(request: Request): Promise<RuntimeContext | null>;
}
```

A future identity provider replaces this adapter without changing use cases/repositories.

## 5. Capabilities

```text
project:read
project:compare
quote:read
commercial:forecast-read
commercial:actual-read
evidence:read
action:internal-review:propose
action:internal-review:create
action:assign
authority:financial-conflict:resolve
settings:manage
```

Capabilities may be expanded only through reviewed product/security decisions.

## 6. Initial role bundles

## Organization Admin

Default capabilities:

- all v0.1 read/compare capabilities;
- actual-cost read;
- propose/create/assign internal review actions;
- financial-conflict resolution capability reserved for future workflow;
- settings management.

Still subject to organization scope and object classification.

## Project Manager / Estimator

Default capabilities:

- read assigned projects;
- compare assigned projects;
- read quote/forecast history for assigned projects;
- inspect accessible evidence;
- propose/create/assign internal review actions within assigned projects.

`commercial:actual-read` is not automatic. Mei receives an explicit grant for the hero workflow.

## Financial Reviewer

Default capabilities:

- read authorized organization projects/commercial records;
- read reconciled actual costs;
- run comparisons;
- inspect evidence;
- propose/create/assign internal review actions;
- future authority-conflict resolution when that workflow exists.

## Viewer

Default capabilities:

- read authorized project metadata;
- run comparison where allowed;
- inspect non-sensitive evidence.

Denied:

- reconciled actual-cost read;
- propose/create/assign actions;
- conflict resolution;
- settings.

The Viewer result uses explicit redacted cell states without hidden-value hints.

## 7. Capability resolution

Effective capabilities are computed:

```text
role bundle
+ explicit ALLOW grants
- explicit DENY grants
+ organization policy
+ project assignment/sensitivity constraints
```

Explicit DENY wins.

The computed capability set is cached only within the verified request/session policy and invalidated when membership/grants change.

## 8. Project access predicate

```ts
type ProjectAccessDecision = {
  allowed: boolean;
  reasonCode?: string; // internal only
  commercialScope: "NONE" | "QUOTE_ONLY" | "QUOTE_AND_FORECAST" | "FULL_ACTUAL";
  evidenceScope: EvidenceAccessScope;
};
```

Rules:

- Admin/Financial Reviewer may have organization-wide access by policy;
- Project Manager/Estimator normally requires active ProjectAssignment;
- Viewer requires explicit project access/assignment;
- project status does not remove historical access when policy permits;
- deleted/restricted projects remain unavailable;
- inaccessible and nonexistent IDs share a non-disclosing public result.

## 9. Comparison authorization

To run Comparable Project Intelligence:

1. `project:compare` capability;
2. authorized access to active project;
3. authorized access to active quote/forecast dimensions used;
4. candidate repository filters records by organization and record access;
5. actual-cost repository returns values only with `commercial:actual-read` and applicable project sensitivity;
6. evidence repository returns only accessible sources;
7. result DTO is role-specific/redacted before optional model use.

The comparison service never scores unauthorized candidates and then hides them.

## 10. Candidate non-disclosure

Inaccessible historical projects:

- are excluded before scoring;
- do not affect result count;
- do not appear in exclusion summaries;
- do not contribute evidence/economics;
- do not enter model context;
- do not appear in logs returned to the user.

Safe “no eligible history” messaging refers only to available records and required context, not hidden data.

## 11. Commercial sensitivity

### Quote history

Requires `quote:read` and project access.

### Forecast direct cost

Requires `commercial:forecast-read` and project/commercial scope.

### Reconciled actual cost

Requires `commercial:actual-read` plus authorized project/historical sensitivity scope.

### Supplier offers

Require quote/commercial permission plus evidence/source access according to organization policy.

Restricted financial data is omitted before DTO/model creation. Do not send values to the browser and blur them.

## 12. Evidence authorization

To open evidence:

1. verify current RuntimeContext;
2. verify ComparisonRun access;
3. verify claim/evidence organization matches;
4. verify subject project/commercial access;
5. verify document/source classification permission;
6. return bounded authorized preview.

A user who loses access after run creation cannot continue opening cached sensitive evidence.

Stored run snapshots containing sensitive data require access checks on every read and role-specific DTO mapping.

## 13. Action proposal authorization

A ProposedAction may be returned only when the user has:

```text
action:internal-review:propose
```

and:

- active project access;
- access to comparison run;
- access to required evidence;
- non-stale run;
- policy allows action.

Viewer receives no ProposedAction DTO.

## 14. Action creation authorization

Required capability:

```text
action:internal-review:create
```

At confirmation, recheck:

- session/membership active;
- organization matches project/run/proposal/evidence/assignee;
- active project access and assignment;
- comparison run complete/current;
- quote/policy/evidence fingerprints current;
- all required evidence accessible;
- assignee membership active and assignable;
- project accepts new actions;
- idempotency key.

The client’s earlier capability display is not authority.

## 15. Assignee authorization

Candidate assignees are loaded from an authorized server query.

Rules:

- same organization;
- active membership;
- assignment policy allows internal-review assignment;
- sensitive rationale/evidence access compatible with the action;
- selected ID revalidated at write time.

The model may suggest only from the authorized candidate list. It cannot provide arbitrary assignee IDs.

## 16. Financial conflict resolution

The v0.1 comparison can display conflicts but does not implement resolution.

Future resolution requires:

```text
authority:financial-conflict:resolve
```

and a separate ADR/workflow/audit contract.

Mei may inspect accessible conflicts but cannot resolve them.

## 17. Settings authorization

`settings:manage` is Admin only in v0.1.

The L1 demo may show limited read-only organization settings. It must not simulate working role management if the backend workflow is not implemented.

## 18. Policy decision interface

```ts
interface AuthorizationService {
  canReadProject(ctx: RuntimeContext, projectId: string): Promise<ProjectAccessDecision>;
  canRunComparison(ctx: RuntimeContext, projectId: string): Promise<AuthorizationDecision>;
  canReadCommercial(
    ctx: RuntimeContext,
    projectId: string,
    kind: "QUOTE" | "FORECAST" | "ACTUAL" | "SUPPLIER_OFFER"
  ): Promise<AuthorizationDecision>;
  canReadEvidence(ctx: RuntimeContext, evidenceId: string): Promise<AuthorizationDecision>;
  canProposeInternalReview(ctx: RuntimeContext, projectId: string): Promise<AuthorizationDecision>;
  canCreateInternalReview(ctx: RuntimeContext, input: ActionAuthorizationInput): Promise<AuthorizationDecision>;
}
```

Decisions include internal reason codes and safe user-facing category only where disclosure is allowed.

## 19. Repository enforcement

Repository ports accept RuntimeContext or explicit trusted organization scope.

Prohibited pattern:

```ts
repo.findProject({ organizationId: request.body.organizationId, projectId })
```

Required pattern:

```ts
repo.getAuthorizedById(ctx, projectId)
```

Prisma queries include `organizationId: ctx.organizationId` and object-specific access predicates.

Before L2, add database RLS or equivalent defense-in-depth and verify application behavior under it.

## 20. Optional AI authorization

The optional explanation receives only the already authorized, role-specific ComparisonResult view.

It cannot:

- call unrestricted repositories;
- request hidden source IDs;
- infer redacted economics;
- broaden organization/project scope;
- propose an action for a Viewer;
- create state.

Model output is verified against the supplied claim set before display.

## 21. Public error behavior

Use non-disclosing errors:

```text
PROJECT_UNAVAILABLE
EVIDENCE_UNAVAILABLE
ACTION_NOT_AUTHORIZED
```

Do not distinguish “exists but unauthorized” from “does not exist” unless the user is already authorized to know the object exists.

Provider/database/permission internals are logged with request ID, not shown.

## 22. Audit behavior

Successful action creation records:

- actor user/membership;
- organization/project;
- proposal/run/action IDs;
- evidence IDs;
- policy versions;
- edited before/after fields;
- request ID;
- timestamp/result.

Authorization denials and suspicious cross-org attempts create security telemetry. They do not necessarily create business AuditEvents.

## 23. Caching and revocation

- private responses are not publicly cacheable;
- cache keys include organization and permission scope where caching is used;
- source previews are short-lived and access checked;
- membership/grant changes invalidate session/capability caches;
- stored ComparisonRuns are reauthorized on read;
- client state is cleared/redacted after access revocation.

## 24. Required tests

### Role/capability

- Admin expected capabilities;
- Mei role plus explicit actual-read grant;
- Project Manager without actual-read receives redaction;
- Viewer action denied;
- explicit DENY overrides role/grant.

### Assignment

- assigned Project Manager can compare/create within project;
- unassigned project unavailable;
- cross-org project ID unavailable.

### Data

- unauthorized candidate excluded before scoring;
- actual observations absent from Viewer DTO/model context;
- hidden source title/ID/count absent;
- evidence access rechecked after revocation.

### Action

- cross-org project/run/evidence/assignee rejected;
- stale run rejected;
- revoked capability rejected at confirmation;
- action/audit created only for authorized user;
- idempotent retry returns existing receipt.

### Non-disclosure

- inaccessible and nonexistent object public responses match;
- no timing/assertion in tests depends on hidden counts;
- logs returned to user contain no hidden IDs.

## 25. Acceptance criteria

- organization/role/capabilities are server derived;
- every private read/write is tenant scoped;
- candidates are filtered before scoring/model use;
- sensitive economics are omitted, not cosmetically hidden;
- evidence access is checked per source/read;
- Viewer cannot propose/create action;
- authorized action creation rechecks current state;
- cross-tenant identifiers fail safely;
- future real identity/RLS can replace/strengthen boundaries without changing product/domain contracts.