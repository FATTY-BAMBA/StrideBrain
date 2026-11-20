# AGENTS.md

Standing rules for any coding agent working in this repository. A prompt from the product owner overrides this file. Everything here comes from the repository's own documents; where they disagree, the documents win and this file should be corrected.

## What this is

StrideBrain is a Next.js App Router application in strict TypeScript on PostgreSQL through Prisma, built as one modular monolith. Read these before changing behavior:

- `docs/architecture/TECHNICAL_ARCHITECTURE_V0_1.md` for layers, ports and tenant isolation
- `docs/decisions/` for the ADRs, especially ADR-005 (repository ports) and ADR-006 (what a model may do)
- `docs/product/V0_2_WORKFLOW_SLICE.md` for the current product direction

## How work is organized

- Work on one GitHub issue at a time. Do not widen scope beyond the issue.
- Branch name: `build/sb-<issue number>-<short-slug>`.
- Keep the task folder `foundry/tasks/SB-<issue number>/` with `brief.md`, `build-contract.md` and `state.json`, as earlier tasks do.
- One pull request per issue. The description lists what was verified and what was not.
- If a decision is not in the issue or the documents, stop and ask. Do not guess a product decision.

## Commands

- Node 24 (`.nvmrc`).
- `npm run check` must pass before a pull request: format check, lint, typecheck, tests and build.
- `npm run db:reset-fixture` migrates, seeds and verifies the synthetic data set.

## Build order inside a task

1. Schema: Prisma migration, seed rows in `prisma/fixtures/`, a `verify-*.sql` check.
2. Domain: the rule as a pure function in `src/modules/<name>/domain/`, with unit tests.
3. Repository: a port in `src/repositories/ports/`, a Prisma adapter in `src/repositories/prisma/`.
4. Application: a use case in `src/modules/<name>/application/` that checks the capability, runs in one transaction and writes the audit event.
5. Experience: screen under `src/app/[locale]/`, API route if needed, strings in both `en` and `zh-TW`.
6. Tests in `tests/<name>/`: the normal path, a Viewer denied, another organization denied.

## Rules that do not bend

- Layers point inward. Domain code imports no Next.js, Prisma or model SDK.
- Every tenant-private row carries `organizationId`. Organization, membership and capabilities come only from the trusted runtime context, never from the request body or the browser.
- Check a capability before every read and write. Unknown records return a non-disclosing not-found.
- Money is fixed-point. Use the helpers in `src/modules/finance/fixed-decimal.ts` or exact integer arithmetic. Never use JavaScript floats for financial values.
- A state change made by a person writes an `AuditEvent` in the same transaction, with an idempotency key where a retry is possible.
- Every financial claim shown to a user is traceable to an `EvidenceReference`.
- A model never writes records, calculates authoritative financial values, changes ranking or authority, resolves conflicts, or issues anything. Its output is validated against a schema and stored as review-only staging or as wording. The flow must still work with the model switched off.
- Quoted price, supplier offer, forecast cost and reconciled actual cost are different things. Never relabel one as another.

## Production standard

Everything built here is meant to run in the production application. Nothing is a patch or a throwaway.

- One code path serves the demo and real tenants. The only differences are configuration and data. No demo-only branches and no code specific to Horizon Atelier or the Xinyi job.
- No hard-coded organization, project, user or record ids outside fixtures and tests.
- No mock, stub or placeholder behind a production route. If something is not built, the route does not exist or says it is unavailable.
- Schema changes are forward-only Prisma migrations that run safely on a database that already holds data. Seed files are for synthetic data only.
- Every input has a bounded schema, size limits and an error state the user can see.
- Every outside call (model, file store, email) has a timeout, a visible failure state and no partial writes.
- New configuration is an environment variable documented in `.env.example`, never a literal in code.
- Unfinished work stays behind a server-side flag that defaults to off.
- Do not weaken a test, a type or a lint rule to make a change pass.
- Logs carry request ids, not document bodies or financial values.
- Done means the acceptance list passes on the preview deployment, not only locally.

## Data and secrets

- Feature code must not branch on data mode. The gate lives only in src/lib/env/server-env.ts.
- The application runs only with `STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC`. Do not remove that gate inside a feature task. It changes only in the Production Foundation issue.
- This repository is public. Never commit real customer files, customer data, provider keys or tokens. Synthetic fixtures only.

## Say what is true

- In code comments, documents and pull requests, state plainly what is built, what is stubbed and what is planned.
- Never describe seeded sample data, keyword routing or a planned feature as a live capability.

## Code Review Rules

- Reject a change that adds a tenant-private table without `organizationId` and a compound unique key on `[id, organizationId]`.
- Reject a new route or use case without a role-denial test and a cross-organization denial test.
- Reject a financial calculation outside the domain layer or one that uses floats.
- Reject a model call that is not behind a port, lacks a schema for its output, or can write to the database.
- Reject user-facing text that exists in only one language.
