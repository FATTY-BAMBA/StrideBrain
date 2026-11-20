# Issue draft — Work Items and Job Close v0.1

Stage 4 of `docs/product/V0_2_WORKFLOW_SLICE.md`. Needs Stage 2 (Quote Draft). Copy the text below into a new GitHub issue.

---

## Goal

When the client accepts a quote, the job gets a task list with owners and dates. When the job is finished, a person records what it really cost and completes it. A completed job with reconciled actual costs then becomes a comparison candidate for the next new job. This is the step that closes the KNOW, THINK, DO, LEARN loop.

## Scope

1. A `WorkItem` table: organization, project, source quote version, title, category, assignee membership, due date, status (`OPEN`, `IN_PROGRESS`, `DONE`, `CANCELLED`). Do not reuse `Action`: it requires a comparison run and carries the internal-review lineage keys.
2. Capabilities `work:read` and `work:update`.
3. A task template per job type as a pure function: the usual site order of scope categories, with due dates spread between the project's `startDate` and `targetCompletionAt`. No model call.
4. Work items are created in the same transaction as client acceptance, once.
5. A task list in the project workspace, and `PATCH /api/work-items/[id]` for status, assignee and due date, each change with an `AuditEvent`.
6. A close-job screen. It records actual cost per category in `ProjectCostVersion` and `CostLine` with the `RECONCILED_ACTUAL` state, then sets `status = COMPLETED` and `completedAt`.

## Security gates

- Actual costs are entered and confirmed by a person with the `commercial:actual-read` capability or a new write capability agreed in the build contract. A quote price is never copied in as an actual cost.
- Line amounts must reconcile to the stated total before the job can be completed.

## Acceptance

- Accepting a quote creates the task list once, even when the request is repeated.
- Changing a task writes an audit record with who and when.
- A job cannot be completed while its actual-cost lines do not reconcile.
- After completion, the job appears as a candidate when a similar new job is created, and its actual costs appear in the economics result for that comparison.
- A `VIEWER` cannot change a task or close a job. Another organization cannot see either.
- `npm run check` passes.

## Out of scope

A calendar or Gantt view, dependencies between tasks, site photos, supplier purchase orders, and time tracking.

## Delivery sequence

A. `WorkItem` schema, template policy and tests.
B. Creation on acceptance, task list and status route.
C. Close-job screen and the completion rule.
