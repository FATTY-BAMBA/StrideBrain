# SB-029 research findings

Research role: independent repository inspection; no product-code changes or policy approval.

Inspected baseline: `0ecd65bdb0ae752f3244960d6848a74a30d5da01` (`main`, verified by orchestrator against fetched `origin/main`). Issue #29 was open with no comments. The complete fetched issue is retained in `issue-29.json`.

## Sources and method

Read the complete issue and its governing contracts:

- `docs/build/IMPLEMENTATION_SEQUENCE.md`, especially Stage 8;
- `docs/decisions/ADR-004-first-governed-action.md`;
- `docs/build/V0_1_BUILD_CONTRACT.md`;
- `docs/build/SHARED_DTO_AND_STATE_CONTRACT.md`;
- `docs/architecture/AUTHORIZATION_MODEL_V0_1.md`;
- `docs/architecture/EVIDENCE_AND_AUTHORITY_MODEL.md`.

Also inspected the merged Stage 3/4 development records, Stage 5/6/7 implementation records, `docs/build/V0_1_BUILD_AUTHORIZATION.md`, `docs/foundry/AGENT_OPERATING_MODEL.md`, the action schema section of `STRIDEGRAPH_IMPLEMENTATION_SCHEMA.md`, action/security entries of the acceptance matrix, current Prisma schema and migrations, repository ports/adapters, services, route parsers, localization, presentation components and relevant tests. Repository evidence was sufficient; no external product research was necessary.

This document reports static findings. It does not claim test, PostgreSQL, browser, performance, preview or release gates passed.

## Established product contract

The only business write is explicitly confirmed `INTERNAL_REVIEW` creation under `INTERNAL-REVIEW-ACTION-1.0`. Preparation is deterministic and reviewable, with immutable structured claims and exact evidence as its only factual source. The existing comparison/economics calculations and financial-authority rules remain authoritative. The canonical rationale must distinguish imported-stone forecast versus reconciled actual history, lighting quoted history, insufficient lighting actual evidence, and unquantified programme differences.

Issue #29 supplies the detailed Stage 8 outcome vocabulary and tighter proposal/confirmation timing targets. The older shared DTO document uses illustrative `DRAFT`, `ALREADY_CREATED` and `ACTION_STALE` labels; the architecture must record the explicit mapping to the issue's `PREPARED`, `IDEMPOTENT_REPLAY` and safe stale outcomes rather than retain two competing public contracts. The shared contract explicitly permits mandatory statements as immutable evidence-gap fields, rather than requiring the browser's editable text to be the authoritative copy (shared DTO §17).

## Existing seams

| Concern | Repository evidence | Consequence for Stage 8 |
| --- | --- | --- |
| Proposal/action/audit storage | `prisma/schema.prisma:912`, `:940`, `:967` | Minimal foundation tables exist; extend them rather than invent a parallel action concept. |
| Tenant schema | Foundation records have `organizationId` and many `(id, organizationId)` unique keys; migration `0004_authorization_tenant_links` adds composite tenant FKs only for authorization records | Action/run/proposal/evidence linkage needs its own database-enforced tenant and single-consumption invariants. SQL verification alone is not concurrency enforcement. |
| Trusted identity | `src/modules/runtime-context/signed-demo-identity-context.ts`; `src/lib/server/runtime-context.ts` | The browser supplies only an opaque signed cookie. Membership/person activity, current capabilities and assignments are reread on resolution. Reuse this at every operation. |
| Action authorization | `src/modules/authorization/authorization-service.ts:173` onward | Propose requires project access plus assignment `canCreateAction`; create additionally requires create capability; assign additionally requires assign capability. |
| Financial Reviewer | Same authorization service; `prisma/fixtures/stage2-authorization.sql` | Reviewer is not implicitly organization-wide in the implementation: all non-admin active-project access requires assignment. The fixture explicitly assigns Reviewer to every Horizon project. Preserve this. |
| Stage 4 reopen | `src/repositories/prisma/prisma-comparison-run-repository.ts:174` | Rechecks organization, completed status and current active-project compare authorization; returns stored snapshot. It does not validate current source fingerprints. |
| Stage 5 reopen | `src/repositories/prisma/prisma-economics-enrichment-run-repository.ts:196` | Rechecks project and scope strength, plus evidence capability; returns immutable result. It does not prove current claim/evidence integrity or freshness. |
| Evidence access | `src/repositories/prisma/prisma-evidence-panel-repository.ts:599`; Stage 7 implementation | Batched evidence lookup resolves ownership and checks source/commercial access before detailed source reads. Historical comparison-library access is explicitly supported; do not require direct assignments for approved historical candidates. |
| Evidence UI | `src/modules/evidence-panel/application/get-evidence-panel.ts`; `route-state.ts` | Exact claim bundles and opaque run-scoped source selectors already exist. Stage 8 should link through this boundary, not expose internal evidence IDs. |
| Workspace action summary | `src/modules/projects/application/get-project-workspace.ts:310` and `:489`; Prisma workspace adapter `:610` | Existing summary returns action ID/title/status/due date and caps at 25. Actions currently have no separate business key or receipt link. |
| Workspace Actions surface | `src/app/[locale]/projects/[projectKey]/[[...surface]]/page.tsx` | Actions is an accepted local navigation surface but currently an honest unavailable shell. It can host receipt/list behavior without adding a top-level surface. |
| Comparison route state | `src/modules/comparison-experience/route-state.ts`; evidence route parser; language switcher | Existing safe selectors preserve `run`, `economics`, up to three selected projects and evidence context. Language switching preserves all query parameters. |
| Existing UI boundary | `tests/architecture/boundaries.test.ts`; Stage 6/7 architecture tests | Presentation may not import Prisma, fixtures, providers, business calculators or browser-storage business truth. Maintain service composition in `src/lib/server`. |

## Implementation risks and questions for the architect

### 1. Storage is not yet an execution contract

`ProposedAction` lacks a business key, enrichment linkage, original-versus-mandatory fields, claim keys, fingerprints and creator membership. `Action` has a nullable proposal link, a free-standing `assigneePersonId`, and no business key/idempotency/receipt fields. `AuditEvent` has a generic payload and actor membership but no automatic completeness guarantee. There is no `ActionEvidence` Prisma model at baseline.

The issue permits either normalized action-evidence rows or an approved immutable authorized snapshot. The architect must record which representation is authoritative and how its exact references and claim bindings are validated. Existing arrays alone provide neither same-tenant foreign keys nor immutable audit reconstruction.

### 2. Reopen authorization is insufficient for confirmation

Neither existing run reopener proves that its stored result is still current. Stage 8 must compare current authoritative state with the stored run and proposal, not merely hash the same stored JSON twice. At minimum, changes in quote/forecast selection, project state/version, policy/calculation version, permission and assignment, comparison source inputs, economics inputs, evidence authority/conflict/supersession/freshness, and result snapshots must fail closed.

Source/input/permission helpers exist in `src/modules/comparisons/application/fingerprints.ts` and `src/modules/economics/application/run-historical-economics-enrichment.ts`. The economics source/permission helpers are currently private. Its evidence hash includes ID, subject, authority, observation, dates and conflicts, but not every exact binding field (for example locator, supported value and classification). Stage 8 cannot assume that hash alone proves exact evidence integrity; an explicit complete evidence fingerprint or equivalent invariant is required.

The application should reject a missing/inaccessible required source before returning sensitive rationale or candidates. Stage 7's source adapter can provide a batched authorization seam, but the new use case must additionally verify claim-to-reference equality and current material state.

### 3. Confirmation must close the validation/write race

An authorization check before opening a transaction is not sufficient proof for concurrent permission, source or proposal change. The build contract must describe transaction boundaries, isolation/locking, retry handling, and uniqueness so an identical retry returns one durable receipt and a different payload never silently replays. Fault injection should exercise each write step and the last step before commit on actual PostgreSQL.

Replay and receipt reopen remain permission-checked reads: they must not return a previously safe title, evidence count or assignee after current access is lost. Receipt recovery after a committed response is interrupted is explicitly required by Acceptance Matrix `REL-007`.

### 4. Assignee semantics require one recorded choice

The existing persistence field refers to a Person; accepted schema and request contracts use Membership. A selected candidate must be validated against current same-organization active membership/person, project assignment, eligibility and compatibility with the sensitive rationale/evidence (`AUTHORIZATION_MODEL_V0_1.md` §15). Do not trust an ID produced by the browser or infer eligibility from active status alone.

The issue leaves the default-without-`action:assign` rule conditional on explicit service policy. The architect must define that default or deny changes; the browser must not receive a broad people list for such a user. No additional capability or role policy is needed to implement the existing authorized roles.

### 5. Existing workspace action reads need a sensitive-data check

The Stage 3 use case currently skips action reads only for `context.role === "VIEWER"` and otherwise calls `listOpenActions`. It does not separately check action capability, current commercial/evidence visibility, or each action's source scope. Once Stage 8 persists editable/evidence-derived titles, this path needs deliberate authorization-safe integration. A downgraded Project Manager must not obtain sensitive action data through the overview while direct receipt reads are denied.

### 6. Editing and localization must preserve semantic guarantees

Immutable mandatory fields are supported by the shared contract, but editable title/rationale still need explicit bounded content validation and a policy for contradictions. A character-count limit alone does not prevent “the quote is wrong” or unsupported causation. The architect must define the deterministic permitted editing behavior, error association and original/final audit representation without involving a model.

Exact title construction must use authorized project/quote metadata and bounded templates; new domain logic should not branch on the named synthetic fixture. Existing Stage 5 claim keys contain `XINYI_` as a legacy convention; consume accepted typed claims/bindings without inventing new unverified facts.

English and Taiwan Traditional Chinese presentation must cover defaults, immutable statements, validation and all failure/replay states. The current request runtime locale comes from the session, whereas the route locale comes from URL state; explicitly passing the validated route locale for presentation avoids English/Chinese disagreement without treating locale as authorization.

### 7. Date, expiry and project policy bounds are underspecified details

Issue #29 requires bounded due dates and proposal expiry but does not choose a duration/range. It prohibits deleted or closed-to-action projects. Current `ProjectStatus` includes ACTIVE, COMPLETED, CLOSED, ARCHIVED and CANCELLED; `deletedAt` is separate. The architect should record exact permitted states, date interpretation, default/clear behavior and expiry horizon as reviewable implementation details. Tests should use an injected clock rather than changing policy to match an old fixture date.

### 8. Preserve route context without turning GET into a write

Creation must occur only through explicit confirmation. Refresh/back/forward/locale navigation should reopen a proposal or receipt using safe selectors, never repeat the business mutation. Existing `comparisonHref` intentionally handles only comparison state and does not automatically preserve evidence parameters, while the evidence client uses query-param composition. A reviewed reusable route-state extension is needed for proposal/receipt and return context.

The evidence panel and review/receipt sheets must not leave two simultaneous focus traps or lose the original trigger. Existing Stage 7 focus/scroll behavior is a useful reference, but actual keyboard/mobile behavior still requires browser evidence.

### 9. Append-only audit and repeatable seed are compatible but need separation

The accepted implementation schema says application code cannot update/delete `AuditEvent`; retention/export controls are deferred before L2. The baseline seed starts by deleting both synthetic organizations (`prisma/fixtures/horizon-atelier.sql:3`). A blanket database deletion trigger with no considered reset procedure would prevent repeatable reseeding after action creation. The architect must separate ordinary application immutability from controlled synthetic database reset, without introducing a browser-accessible bypass or silently disabling audit rules.

### 10. Pre-existing one-enrichment-per-comparison limitation

`EconomicsEnrichmentRun.comparisonRunId` is `@unique` (`prisma/schema.prisma:860`) and `ComparisonClaim` is unique on organization/comparison/claim key. The Stage 6 selection action attempts to persist another enrichment against the same structural run. Migration `0007_stage6_comparison_persistence_scales` only changes factor/coverage numeric checks and does not remove these constraints.

This is a concrete pre-existing implementation/documentation mismatch: Stage 6 documentation describes selection changes creating new immutable enrichments. It does not require Stage 8 to silently rewrite completed stages. The Stage 8 contract must state how the existing immutable pair/selection is consumed and which regression is measured. If fixing this seam becomes necessary for Stage 8's accepted route-restoration contract, obtain a bounded orchestrator/architect decision rather than mutate old results or disguise the failure.

## Validation evidence required from independent roles

The existing CI provisions PostgreSQL 17, installs locked dependencies, validates/generates Prisma, migrates, seeds, verifies SQL invariants, checks format/lint/types, runs Vitest, builds Next.js and audits production dependencies. The existing PostgreSQL hero-flow test is skipped when `DATABASE_URL` is absent and exercises a single default enrichment. A green unit-only run therefore does not prove persistence, selection changes, concurrency or rollback.

Required new validation should cover:

- each authorized role and an explicit capability downgrade; Viewer denial before sensitive proposal/evidence/action/assignee reads;
- cross-tenant and nonexistent selectors producing equivalent safe responses;
- mandatory typed claims and exact evidence bindings, including mutation of locator/value/classification and source authority/conflict;
- stale quote, project, policy, input/source/permission/structural/economics-result snapshots;
- membership/person/assignment and assignee changes between preparation and confirmation;
- expiry, consumed proposals, duplicate payload equality and same-key/different-payload conflicts;
- concurrent identical submissions and competing different keys for one proposal;
- real-PostgreSQL faults at Action, evidence, audit, proposal-consumption and receipt/idempotency writes;
- audit reconstruction of original/final fields and all actor/source/policy/request references;
- workspace visibility, current-authorized receipt reopening and interrupted-response recovery;
- bilingual semantic parity, all safe states, route restoration, CSRF/origin/session rejection (`SEC-016`), and architecture boundaries;
- measured repeated PostgreSQL samples for p95 and query counts, plus separate real browser timing evidence.

## Research disposition

No product-policy conflict requiring immediate human escalation was established by this static inspection. The role/assignment behavior is already resolved by merged code/tests, the issue expressly allows the evidence representation choice, and vocabulary/timing refinements can be documented in the Stage 8 contract. The one-enrichment limitation is a verified pre-existing seam requiring explicit handling if touched. Final product/technical decisions belong to the architect and orchestrator; correctness and release readiness belong to independent validation and review.
