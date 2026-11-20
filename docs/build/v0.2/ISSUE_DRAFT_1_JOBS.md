# Issue draft — Jobs v0.1: create a job and track it by stage

Stage 1 of `docs/product/V0_2_WORKFLOW_SLICE.md`. Copy the text below into a new GitHub issue.

---

## Goal

A person with the right role can create a job from the screen and see every job grouped by stage. Today a project exists only if it is in `prisma/fixtures/*.sql`. No AI is involved in this issue.

## Scope

1. Capabilities `project:create` and `project:update` in `src/modules/runtime-context/capabilities.ts`, granted to `ORGANIZATION_ADMIN` and `PROJECT_MANAGER_ESTIMATOR`.
2. Create and stage-update methods on the project repository port, with the Prisma adapter.
3. A `CreateProject` use case. It validates every field `validateActiveComparisonContext` requires (job class, subtype, area and unit, currency, scope categories, commercial categories, city), then writes `Project`, `ProjectScope`, a `Client` if new, and an `AuditEvent` in one transaction. It sets `metadataAuthority = HUMAN_REVIEWED` and `stage = QUOTE_REVIEW`.
4. A form at `src/app/[locale]/projects/new/` with a server action. Scope and commercial categories come from the fixed category list, never free text.
5. The Projects page grouped by `ProjectStage`. `list-authorized-projects.ts` currently returns only a name and an active flag.
6. Strings in `en` and `zh-TW`.

## Security gates

- Organization and membership come from the trusted runtime context only.
- Synthetic demo mode only. No change to `src/lib/env/server-env.ts`.

## Acceptance

- A new job created from the screen appears under 報價審查 without any SQL.
- The comparable-project analysis runs on the new job and returns ranked candidates.
- A missing required field is rejected with a field-level message in both languages.
- A `VIEWER` cannot create or update a job, by screen or by direct request.
- A member of another organization cannot see or update the job.
- Creating the same job twice with the same business key is rejected cleanly.
- `npm run check` passes.

## Out of scope

Prefilling the form from a pasted client message (that needs the model port from Stage 3), editing job fields after creation beyond stage, deleting jobs, and residential job types unless the Stage 0 decision adds them.

## Delivery sequence

A. Capabilities, port methods and the `CreateProject` use case with tests.
B. The form and server action.
C. Projects page grouped by stage.
