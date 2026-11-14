# ADR-004 — First Governed Action

**Status:** Accepted  
**Date:** 2026-11-14  
**Decision owners:** Product Director, Product/UX Architecture, Technical Architecture, Security Review  
**Policy version:** `INTERNAL-REVIEW-ACTION-1.0`

## Context

Comparable Project Intelligence must lead to useful work rather than ending in a search result or chat answer.

At the same time, the first release is an L1 controlled demo. It must not introduce external communication, quotation approval, financial commitment, or uncontrolled agent execution.

The prototype demonstrated an important safety pattern:

- AI may prepare a bounded proposal;
- the user reviews it;
- a separate authorized operation creates or executes business state;
- consequential actions remain explicit and auditable.

The first customer-facing slice needs one action that proves `Think → Do` without expanding scope into a full workflow platform.

## Decision

The only business-changing action in StrideBrain v0.1 Comparable Project Intelligence is:

> **Create an internal review action linked to the active project, comparison result, and supporting evidence.**

The system may suggest or prepare the action, but it cannot create the action until an authorized user explicitly confirms it.

## State model

```text
Structured comparison
  → ProposedAction
  → user review/edit
  → authorization recheck
  → explicit confirmation
  → Action created
  → AuditEvent written
```

### ProposedAction

A proposal is not business state.

Minimum fields:

```ts
type ProposedAction = {
  id: string;
  organizationId: string;
  projectId: string;
  comparisonRunId: string;
  type: "INTERNAL_REVIEW";
  title: string;
  rationale: string;
  suggestedAssigneeId?: string;
  suggestedDueDate?: string;
  evidenceReferenceIds: string[];
  policyVersion: "INTERNAL-REVIEW-ACTION-1.0";
  createdBy: "SYSTEM" | "USER" | "MODEL_ASSISTED";
  expiresAt?: string;
};
```

### Action

Minimum fields:

```ts
type Action = {
  id: string;
  organizationId: string;
  projectId: string;
  type: "INTERNAL_REVIEW";
  title: string;
  rationale: string;
  assigneeId?: string;
  dueDate?: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  originComparisonRunId: string;
  evidenceReferenceIds: string[];
  createdByUserId: string;
  createdAt: string;
};
```

## Hero action

Default prepared action:

```text
Validate imported-stone and lighting assumptions for Xinyi quote v3
```

The rationale should include only verified structured findings:

- imported-stone forecast variance versus eligible reconciled actual history;
- lighting quoted-price variance and insufficient actual-cost evidence;
- accelerated programme difference with no quantified premium evidence;
- exact source/comparison references.

## User interaction

Before confirmation, the user can:

- edit the title;
- edit the rationale without removing mandatory evidence warnings;
- select an authorized assignee;
- set or change a due date;
- inspect all linked evidence;
- cancel.

The confirmation control must say what will happen, for example:

> Create internal review action

It must not use vague language such as “Approve AI” or “Run agent”.

## Authorization

The server derives:

```text
user → membership → organization → role/capabilities → project assignment
```

Required capability:

```text
action:internal-review:create
```

Additional checks:

- user can access the active project;
- user can access the comparison run;
- user can access all evidence linked to the action;
- selected assignee belongs to the organization and is eligible for assignment;
- comparison result has not expired or been invalidated;
- project is not deleted/closed to new actions by policy.

A Viewer cannot create the action.

## Validation and stale-state behavior

At confirmation time, the service must recheck:

- active quote version;
- comparison policy version;
- relevant authority/conflict states;
- permissions;
- assignee validity.

If material inputs changed, action creation fails safely with a message requiring a refreshed comparison.

The system must not create a task from stale comparison output.

## Audit event

Successful creation writes an append-only event containing:

- actor user/membership;
- organization and project;
- proposed-action ID;
- created action ID;
- comparison run and policy version;
- evidence references;
- before/after proposal fields where edited;
- timestamp;
- request/correlation ID;
- result.

A failed attempt should create an operator-visible security/application trace without exposing sensitive data to the user.

## AI boundary

A model may:

- summarize the structured reason for review;
- propose a concise title/rationale;
- suggest an assignee from an authorized candidate list.

A model may not:

- create the Action directly;
- choose an unauthorized assignee;
- remove required evidence/uncertainty disclosures;
- approve a quote;
- alter historical authority;
- contact a supplier/customer;
- claim the action was created before the service returns success.

## Explicitly excluded actions

The first slice does not support:

- email or LINE sending;
- supplier outreach;
- customer response sending;
- quote issue/approval;
- contract or change-order approval;
- project-cost mutation;
- payment or accounting action;
- autonomous recurring monitoring;
- arbitrary agent writes.

These require separate ADRs, authorization, audit, and readiness review.

## UX result

After successful creation:

- show a real action receipt, not only a toast;
- display action ID, title, assignee, due date, status, and project;
- link back to the source comparison/evidence;
- show the action in the project workspace;
- preserve the user’s current comparison context.

On failure:

- no action is created;
- no fake success is shown;
- the user receives a safe, specific next step;
- deterministic comparison remains available.

## Consequences

### Positive

- proves actionability without external risk;
- creates an auditable `Think → Do` transition;
- keeps model/planner output separate from execution;
- gives the project workspace a real operational outcome;
- establishes reusable authorization/audit seams.

### Costs

- requires action repository and audit contracts in the first foundation;
- requires explicit permissions and assignee validation;
- adds stale-comparison handling;
- limits the apparent demo breadth.

These costs are accepted because one trustworthy action is more valuable than many simulated actions.

## Rejected alternatives

### Draft-only result with no persisted action

Rejected because it does not prove operational follow-through.

### Automatic task creation by the model

Rejected because it collapses analysis and execution and obscures accountability.

### External supplier message as the first action

Rejected because identity, consent, recipient policy, connector lifecycle, delivery receipts, and L2 readiness are not in scope.

### Quote approval as the first action

Rejected because it is financially consequential and requires a broader authorization/approval model.

### Multiple action types in v0.1

Rejected to preserve product focus and make the first governed flow testable.

## Tests required

- Viewer cannot create an action;
- authorized Project Manager/Estimator can create within assigned project;
- cross-organization project/assignee/evidence IDs are rejected;
- stale comparison is rejected;
- missing/inaccessible evidence is rejected;
- model text alone cannot create state;
- success writes Action and AuditEvent atomically;
- failure never displays success;
- English and Traditional Chinese confirmation/receipt states have parity;
- created action links to the correct comparison run and evidence.
