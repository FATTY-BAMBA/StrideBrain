# SB-029 independent review

Reviewer: independent reviewer agent, separate from Builder.

Baseline examined: `0ecd65bdb0ae752f3244960d6848a74a30d5da01` on
`build/stage-8-internal-review-action`. Initial inspection: 2026-11-15T21:19:17Z.

## Review status

- Contract review: `PASS` after the bounded technical corrections documented
  below. No product-policy escalation identified.
- Implementation review: checkpoints independently inspected on frozen application
  head `4c13f726bb75f4a31d263eb6e54622224807d019`; final verdict withheld
  because the required Computer QA gate is blocked.
- Deterministic validation evidence: REVIEWED; all 16 independent commands, 436
  tests and successful exact-head GitHub CI corroborated as documented below.
- Computer/browser QA evidence: BLOCKED_INFRASTRUCTURE; actual control attempts
  failed, zero complete browser scenarios passed, and all 18 planned cases remain
  blocked. Partial screenshots/non-UI smoke do not satisfy this gate.
- Final verdict: not issued. This file is not a merge or release approval.

## Authoritative inputs examined

- Complete Issue #29, retained in `issue-29.json`; issue has no comments.
- Stage 8 of `docs/build/IMPLEMENTATION_SEQUENCE.md`.
- `docs/decisions/ADR-004-first-governed-action.md`.
- `docs/build/V0_1_BUILD_CONTRACT.md` and `SHARED_DTO_AND_STATE_CONTRACT.md`.
- `docs/architecture/AUTHORIZATION_MODEL_V0_1.md` and
  `EVIDENCE_AND_AUTHORITY_MODEL.md`.
- Stage 3/4 development contracts and Stage 5/6/7 implementation contracts.
- ADR-005, repository boundaries, and the agent operating model.

## Baseline findings to resolve in the Stage 8 contract

1. Existing comparison and enrichment reopen repositories authorize project and
   stored access scope but do not prove current source freshness or full result
   integrity. Stage 8 must reconstruct current fingerprints, check persisted
   snapshot/result linkage, and fail closed on material change.
   Sources: `src/repositories/prisma/prisma-comparison-run-repository.ts`,
   `prisma-economics-enrichment-run-repository.ts`,
   `src/modules/comparisons/application/fingerprints.ts`, and
   `src/modules/economics/application/run-historical-economics-enrichment.ts`.
2. Current authorization requires project assignment and `canCreateAction` for
   non-admin roles, including Financial Reviewer. Stage 8 must preserve that
   implementation rather than infer an organization-wide action grant from a
   role label. Source: `src/modules/authorization/authorization-service.ts`.
3. Existing workspace action summaries are queried for every non-Viewer and map
   titles directly. New sensitive action titles/receipts must remain hidden after
   capability/evidence access is revoked; role-name filtering alone is inadequate.
   Source: `src/modules/projects/application/get-project-workspace.ts`.
4. Baseline `AuditEvent` has no append-only database protection. Existing
   cascading and SET NULL foreign keys must be considered when adding immutable
   audit enforcement and synthetic-fixture cleanup/rollback procedures.
   Sources: `prisma/schema.prisma`, foundation migration.
5. Existing economics schema permits one enrichment per comparison, while the
   Stage 6 selection handler describes creating additional immutable enrichments.
   This is a pre-existing seam, not permission to rewrite completed stages. The
   Stage 8 contract must identify any strictly necessary compatibility change.
   Sources: `EconomicsEnrichmentRun.comparisonRunId @unique`,
   `ComparisonClaim` uniqueness by comparison/claim, and Stage 6 implementation.

These are implementation risks, not a finding that authoritative product
requirements conflict. Contract and implementation review results will replace
the pending statuses only after actual review.

## Contract review 1 — REVISE

Reviewed the complete `architecture.md` and `build-contract.md` draft on
2026-11-15. The proposed immutable evidence snapshot, finite localized wording
edits, current-access receipt replay, source-table lock boundary, and additive
rollback model fit the accepted scope. Actual alternatives are visible and
editable; immutable findings are separated from editable review intent. Replay
correctly preserves committed receipts after source freshness changes while
requiring current access.

Before build acceptance, requested these concrete corrections:

1. Remove `EvidenceConflictItem` from the fixed source-lock statement; no such
   table exists in current migrations/schema. Current conflicts use primary and
   conflicting reference fields in `EvidenceConflict`.
2. Pin cross-actor fingerprint reconstruction behavior. The draft currently
   leaves recorded-actor reconstruction versus caller-specific refresh as an
   implementation choice. Builder must not choose permission semantics.
3. Make GET proposal/receipt reads entirely read-only and preparation POST-only,
   replacing the draft's weaker “prefer POST” wording.
4. Complete database protection for immutable Action evidence snapshots and the
   explicitly guarded/exclusively locked synthetic reset procedure.
5. State how current evidence classification is checked on receipt/workspace
   reads. Existing Stage 7 authorization checks subject/project classification,
   but not the reference's own `dataClassification`; skipping receipt freshness
   must not also skip access loss caused by source reclassification.

The architect received these findings directly. They are routine security and
implementation-contract clarifications, not permission to broaden scope or
weaken established policy. Final implementation review remains NOT_RUN.

## Contract review 2 — PASS

Reviewed the complete revised artifacts at 2026-11-15T21:28:54Z on worktree head
`e2b9436c8894c7a3935121a45864462700eade7a`:

- `architecture.md` SHA-256:
  `6e7737b5cf090fd09311ca899265ce96328c4f34030985c0b4b42a4dd235566a`.
- `build-contract.md` SHA-256:
  `091e6ca83ec2d644d7651f2db958086d938b792de9f40890c1010cf64b6d4845`.

All five requested corrections are present. The source lock set matches actual
baseline tables; reconstruction uses the current caller and returns a safe
fresh-comparison requirement on actor-specific fingerprint mismatch; GET paths
perform no persistence; immutable committed snapshots/consumed proposal lineage
have database protection; reset is explicitly guarded to known synthetic tenants
under exclusive transaction locks; source classification is reauthorized before
sensitive Stage 8 reads. Origin validation is anchored to configured trusted app
origin/request target, not an arbitrary forwarded host.

The contract defines actual title and rationale-purpose alternatives in both
locales, explains editing bounds, retains mandatory verified findings separately,
and audits original and final rendered text. Idempotent replay is a currently
authorized receipt read, not a new freshness-gated write. Lock, fixture-reset,
one-enrichment, cross-actor refresh and finite-wording limitations are explicit.
Schema changes are additive; ordinary rollback preserves business/audit history.

This PASS approves the contract as implementation-ready for Orchestrator
acceptance. It does **not** certify implementation, deterministic tests, browser
quality, preview readiness, merge, release or performance. Those reviews remain
NOT_RUN and require actual exact-head evidence. PostgreSQL schema/index/locking
review also used the available `supabase-postgres-best-practices` skill; no
Supabase integration or additional approval requirement was introduced.

## Final review evidence required

Independently inspect code/schema changes and exact-head test/CI evidence for
tenant authorization, no-read denials, evidence linkage/integrity, all material
staleness fingerprints, current assignee eligibility, safe replay, database
single-consumption constraints, concurrent retry, every transaction rollback
boundary, audit reconstruction/immutability, route restoration, localized
review/receipt/workspace UX, accessibility, measured performance, and migration
rollback safety. Actual independent browser evidence is required before browser
quality can pass. The final verdict must be exactly one of `PASS`,
`PASS_WITH_NON_BLOCKING_FOLLOW_UPS`, `REVISE`, or `ESCALATE`.

## BUILDING schema checkpoint — 2026-11-15T21:41:30Z

Scope: independent interim inspection and direct PostgreSQL schema probes only.
This is not the final implementation verdict or a task-state transition.

Examined the working tree at head
`e2b9436c8894c7a3935121a45864462700eade7a`, with uncommitted Stage 8 implementation
on `build/sb-029-governed-internal-review`. Reviewed migration, Prisma model
mapping, guarded reset, SQL verifier, package wiring and CI repeat-seed step.
Reviewed file hashes:

| File | SHA-256 |
|---|---|
| `prisma/migrations/0008_stage8_internal_review/migration.sql` | `bca2e402f42aafc822c921df064d51965a8ea29da80aacabc11ef2c6d16d20d9` |
| `prisma/schema.prisma` | `6f3e634ec5c4de66626c8e0dcb196d633a371f28cfa9f0513d7760de393f846e` |
| `prisma/fixtures/horizon-atelier.sql` | `901fed590053152425a85733a97151a1d4f399d198f8f6a449bfe5c72521e1f8` |
| `prisma/fixtures/verify-stage8-internal-review.sql` | `79febe85bf1911ea452183050fdb71acc017facfe834ca4af99efd2cb09075f0` |

No blocking schema finding was established. The migration adds nullable
versioned fields without deleting data, enforces tenant/run/project/actor
lineage with composite keys, enforces one action per proposal and receipt
uniqueness, and rejects mutation/deletion of committed action/receipt/audit
records. Prepared proposal changes are restricted to one consumption transition.
The reset locks Organization before immutable tables, checks the exact synthetic
tenant identity/classification, deletes only those tenants' leaf records, and
transactionally restores named triggers. Unrelated tenant audit history survives.

The reviewer created a separate `stridebrain_stage8_review` database on the
local PostgreSQL 17 test container. No evaluation or preview database was
modified. Independently executed commands (all final executions exited 0):

```bash
export npm_config_cache=/tmp/sb029-review/npm-cache
export DATABASE_URL=postgresql://stridebrain:stridebrain@127.0.0.1:54329/stridebrain_stage8_review?schema=public
npm run db:migrate
npm run db:seed
npm run db:verify
node /tmp/sb029-review/probes.cjs
npm run db:verify
npm run db:seed
npm run db:verify
node /tmp/sb029-review/reset-probes.cjs
```

Evidence: `evidence/schema-review/` contains raw command logs, 18 direct
constraint/immutability probe results, three reset probes, and copies of the
reviewer-only probe scripts. Probes verified wrong-tenant/wrong-project/wrong-actor
FK denial; missing snapshot CHECK denial; duplicate Action/receipt denial;
proposal consumption-once; and Action/proposal/audit/receipt immutability. A
repeat seed after committed **schema-probe** Action/audit/receipt records passed
all SQL verifiers. Guard refusal for a non-synthetic classification and an
injected failure before seed commit both preserved tenant data and all four
enabled triggers. The probe records are test-only SQL fixtures, not evidence of
a successful application flow or full audit reconstruction.

The initial migration invocation failed because npm's default cache was outside
the writable sandbox; a task-local cache resolved it without code changes. The
reviewer's temporary reset probe initially escaped a PL/pgSQL dollar delimiter
incorrectly; its test harness was corrected and rerun. Neither was a product
defect or a policy exception. Final application/service correctness, realistic
concurrency/transaction rollback, exact-head CI and browser QA remain pending.


## BUILDING implementation checkpoint — 2026-11-15T21:58:37Z

Interim source review at head `819f5545f0fa05d125835ec8ef417ec2f5f495f8`
plus the shared uncommitted correction set. This is not a final verdict or
permission to advance the state machine. Independently examined the Stage 8
service, fingerprint reconstruction, policy/DTOs, Prisma adapter, current-session
reload, server composition, API parsing/origin checks, comparison/controller/
review/receipt/workspace UI, and route restoration.

Four bounded findings were returned to Builder and Orchestrator:

1. **Linked-document access and binding.** Evidence subject assignment was being
   reused for private documents attached from a different project; receipt reads
   also lacked an exact stored/current `documentVersionId` match. The corrected
   adapter carries the linked document's organization/project/classification and
   deletion metadata; policy independently authorizes that project; receipt and
   workspace reject rebinding. Reviewer source inspection and independent probes
   verify the correction. Permanent integration regressions requested from Test
   and Evaluation Agent.
2. **Stored default on repeated prepare.** Reusing an existing proposal after its
   default became ineligible silently displayed an unassigned default. Prepare
   now mirrors reopen and returns neutral `PROPOSAL_UNAVAILABLE`. Independently
   probed the existing-proposal path with no remaining eligible members.
3. **Optional workspace dependency.** Omitting the newly introduced authorized
   actions port retained the legacy raw action-title reader. The compatible
   constructor now returns no actions without that port, with no legacy action
   call. Independently verified omission cannot disclose a sensitive test title.
4. **Denied/failed attempt traces.** Issue #29 explicitly requires safe operator
   traces. HTTP early origin/session/input denials and adapter catches bypassed
   the service trace, and service validation failures returned directly. Builder
   added the service validation trace; shared adapter trace completion and tests
   are still pending at this checkpoint. Only request ID and safe outcome belong
   in these traces, with no payload, selectors, cookie, or raw exception.

No issue was found with the inspected source-lock order, scoped proposal lock,
server-issued confirmation key, current-context re-resolution, capture-only
Stage 4/5 replay, atomic commit callback, or current-authorized historical receipt
replay. These are source-review observations; real PostgreSQL races/rollback and
exact-head CI must still substantiate them. The modal/controller keys remount
on locale/proposal/receipt changes; browser interaction and accessibility are
not certified by source inspection. The Orchestrator has separately authorized
a no-write run-pair sufficiency check before displaying the entry point; its
implementation and cost remain pending reviewer verification.

Independent focused command (exit 0):

```bash
node node_modules/vitest/vitest.mjs run --config /tmp/sb029-review/vitest.config.mts --reporter=verbose
```

Results: 54 tests passed in two temporary reviewer-only suites, comprising the
49 existing service/workspace cases copied unchanged plus five new independent
reviewer cases. The new cases cover separate private document access, readable
document rebinding on receipt/list, deleted/unknown/restricted document projects,
stored-default eligibility on repeated preparation, and omitted-port workspace
non-disclosure. These use explicit mocked source/transaction ports to isolate
policy behavior; they do not claim database integration or browser coverage.
The log and exact temporary harness copies are retained in
`evidence/code-review/` as review evidence, not production test code.

Reviewed correction hashes at this checkpoint:

| File | SHA-256 |
|---|---|
| `src/modules/internal-review/application/freshness.ts` | `2bd73eb6625df72d4155389a3a57821a20e2d5de93a367c7e23357bc384c8c7d` |
| `src/modules/internal-review/application/internal-review-service.ts` | `31fe3bd4071f4fb07a99f7db0319d11150a8e46248ea02bde1bf9fb45fdf4809` |
| `src/repositories/prisma/prisma-internal-review-repository.ts` | `b9b949850085cdfdf81e5488df6ca5f0a2327c3e5e1de33c05b63405bc204180` |
| `src/modules/projects/application/get-project-workspace.ts` | `baccaf20240746b76c718349bc4d92e606461f24f7a0a6200ba4f729df6377ad` |

Final implementation verdict remains withheld until all completed evidence is
independently reviewed. No browser QA, preview, merge, or release pass is asserted.


## Contract rollback clarification — PASS

On 2026-11-15, the Orchestrator identified a concrete rollback hazard. Independent
`git show` inspection of verified Stage 7 baseline confirmed
`GetProjectWorkspace` lines 330–332 called `listOpenActions` for every non-Viewer;
the old Prisma adapter lines 615–622 selected all open project Action titles
without current source/capability authorization. A plain prior-version rollback
with retained Stage 8 rows could therefore disclose sensitive action titles.

The architect corrected architecture §11 and build-contract rollback/acceptance
text. Reviewed hashes:

- architecture: `896ad07a4903d9a347bcc685bfc2688ca85c4effe906df68492079ceadd96976`
- build-contract: `168be4622d7550d30f2a5562da1cc470d1a9d8a3721f6107c30494b2ea26e9d8`

This clarification passes: disable/revert creation entry points and mutation
paths while retaining the current authorized/fail-closed read boundary or a
verified security backport; never restore unmodified Stage 7 with Stage 8 rows.
Preserve schema/history/constraints/immutability guards and verify current-access
non-disclosure plus disabled writes before using any rollback revision. This is
an operational security requirement under existing policy, not a new product
feature or a claim that a rollback deployment has been performed.

Two further bounded source-review corrections are pending in the current build:
API safe-failure handling must include runtime-context lookup (which can throw
before the original handler catch), and a locked/no-assign assignee error needs
a visible associated error/focus fallback because it has no editable named input.
Builder and Computer QA Coordinator have received both findings.


## BUILDING correction verification — 2026-11-15T22:07:15Z

All current interim findings above have source-level corrections. Independently
re-read the shared trace helper and all four API handlers: origin/session/input
and handler failures now emit only the existing event/request ID/safe outcome;
context resolution is inside the guarded path; forwarded service failures are
not logged twice. Authorized field validation emits the same safe trace. No
request payload, secret, selector, raw exception or extra object property is
copied into the trace.

The read-only entry check now requires a bounded immutable comparison/enrichment
pair, re-resolves current actor/project access and invokes full current material
verification, returning true only for READY. Missing, stale or inaccessible pairs
hide the creation entry. The page passes its reopened pair; no proposal or run is
persisted by this preflight. Real PostgreSQL entry-preflight test source and the
Test/Evaluation Agent's focused execution log were also inspected; they compare
all proposal/run/business row counts before and after authorized, missing,
permission-denied and source-mutated checks.

The locked assignee branch now presents the localized associated error with
`tabIndex=-1`; the first-error helper falls back to that error when no named
input exists. This closes the static-control focus omission in source and unit
coverage. Actual browser focus behavior still requires Computer QA evidence.

The reviewer independently executed the current permanent focused suite:

```bash
node node_modules/vitest/vitest.mjs run tests/internal-review-experience tests/internal-review/service-unit.test.ts tests/internal-review/policy-unit.test.ts tests/internal-review/workspace-unit.test.ts tests/repositories/prisma-internal-review-repository.test.ts tests/localization/internal-review-parity.test.ts tests/architecture/stage8-internal-review-boundaries.test.ts tests/architecture/stage8-presentation-boundaries.test.ts --reporter=verbose
```

Exit 0: **148 tests in 13 files passed**. Coverage includes current access and
preflight, safe adapter traces and identity-resolution failures, no-write GET,
origin/body guards, immutable claim wording/date validation, receipt replay,
workspace omission fail-closed, Prisma selector/batch boundaries, route/locale
restoration, localization parity, error-focus helper and architecture boundaries.
Exact log: `evidence/code-review/stage8-targeted.log`. This is an independent
execution of targeted deterministic tests on the shared worktree, not full CI or
browser evidence.

Worktree parent head remains `819f5545f0fa05d125835ec8ef417ec2f5f495f8`;
corrections are not represented by that commit alone. Reviewed current hashes:

| File | SHA-256 |
|---|---|
| `src/modules/internal-review/application/internal-review-service.ts` | `ba3f8a815dae3c0a3757e9d8c059befee41cf411c089c1429b081d38c7d46cf6` |
| `src/app/api/actions/internal-review/route.ts` | `04f7df6ee55a1961eb6328a6a146f93134985bb9cebbd01190388f4a1bc8649c` |
| `src/lib/server/internal-review-trace.ts` | `170ef38524fb43c13cf0f5b38f057c7cf3cc53890f8a2d1928861c9afa909297` |
| `src/components/internal-review/internal-review-sheet.tsx` | `b4d153e86794adef10a0a4a859f700cc88205db93dd7442f09d982d006d45665` |
| `src/app/[locale]/projects/[projectKey]/compare/page.tsx` | `ca980885562356d58f6e67f40fd7965b8f996a62725d889f47a1f4904e2bc42e` |

No unresolved blocking source finding remains from this checkpoint. Complete
PostgreSQL regression/performance results, exact-head CI and actual independent
browser QA still gate the final implementation verdict.


## Frozen-head deterministic evidence checkpoint — 2026-11-15T22:29:17Z

Scope: independent evidence verification only. Application commit:
`4c13f726bb75f4a31d263eb6e54622224807d019` on
`build/sb-029-governed-internal-review`, draft PR
<https://github.com/FATTY-BAMBA/StrideBrain/pull/31>. This checkpoint does not issue
a final implementation verdict, approve merge, or advance the task into
INDEPENDENT_REVIEW. Current task state is **BLOCKED**, with resume state
COMPUTER_QA after the recorded PREVIEW_READY transition.

The reviewer read `validation-final.json` and all 16 exact-head command logs in
`evidence/exact-head-4c13f726/`. Every command exited 0: locked dependency install,
Prisma validation/generation, clean migration/seed/SQL checks, repeat migration/
seed/SQL checks, formatting, lint, strict TypeScript, full tests, localization,
production build and production dependency audit. The logs report **436 passing
tests in 57 files, zero skips**, including 88 PostgreSQL adversarial cases and
all 200 Stage 0–7 regression cases. Localization reports 11 tests in four files;
PostgreSQL 17.12 reports all eight migrations applied; Next.js 16.4.6 built
successfully; audit found zero vulnerabilities. Lint has zero errors and the
existing `prisma.config.ts` default-export warning.

This review corroborates the independent Test/Evaluation Agent's full execution;
it does not falsely claim the reviewer personally reran those 16 commands. The
reviewer's separate schema/reset and targeted-test executions remain documented
above. The reviewer independently reconstructed `git ls-tree` for the recorded
source/test/schema/config paths and matched the retained manifest SHA-256
`7fe5157f84f9c88023462ec1e958b62a53bcdb5aef30eb0dc4ac95dfdac85920`.
`git diff --exit-code 4c13f726 --` over those paths returned no changes. Only task
evidence/documents were changing; the inspected generated `next-env.d.ts`
restoration leaves application source identical to the validated commit.

The reviewer also independently called GitHub's commit-workflow and workflow-job
connectors for this exact commit/run. Run
<https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/43767600389>
returned completed/success, and every reported quality-job step succeeded,
including migration, repeat fixture verification, tests, build and audit. This
corroborates `evidence/ci-4c13f726.json`; it is not evidence about a later head.

The PostgreSQL test source and retained results support the tested authorization,
neutral cross-tenant denial, Viewer no-read paths, fingerprint/source mutation
rejection, current assignee checks, immutable evidence binding, one-consumption
concurrency, six transaction-failure rollback boundaries, audit reconstruction,
current-authorized replay and workspace non-disclosure contracts. Measured local
server p95 is 92.32 ms for proposal preparation and 97.85 ms for confirmation;
30 concurrent samples have p95 254.60 ms. The 30 serial samples used 110 proposal
and 131 confirmation SQL queries. Adding 20 eligible assignees left preparation
at 110 queries; expanding required evidence from 15 to 35 left its scoped batch
at 21 queries. These are bounded controlled-fixture measurements, with an actual
EXPLAIN plan retained; they are neither browser timing nor a production-scale
benchmark. Conservative source-table locking remains a documented scaling limit.

### Browser gate and handoff evidence

The actual control record `evidence/computer-qa/cua-infrastructure-blocker.json`
reports two failed preview navigations (`Browser Use could not read requirements`)
with the tab remaining `about:blank`; the documented Sky fallback had no available
AT-SPI input provider. This is a browser-control blocker, not an established
product defect. The updated QA report is BLOCKED, all 18 full scenarios are
blocked, and none passed. Three Finance/English headless screenshots are clearly
labeled partial supplemental exploration only. They do not establish review,
receipt, mobile, bilingual navigation, keyboard/focus or complete-flow acceptance.

A separate preview-only origin mismatch was corrected by restarting the same
production build with `--hostname localhost`; no origin guard or product source
was changed. The retained Finance HTTP diagnostics show PREPARED after that
alignment. Subsequent `finance-http-action-smoke.json` shows CREATED, same-key
IDEMPOTENT_REPLAY, changed-payload IDEMPOTENCY_CONFLICT and Chinese receipt AVAILABLE,
with one Action, one consumed proposal, one receipt and one audit, and linked
claims/evidence. This supports live server wiring only and earns no browser-pass
credit. The single HTTP durations are not browser or server p95 samples.

The state transitions preserve the required order through RESEARCHING,
SPECIFYING, READY_FOR_BUILD, BUILDING, CI_VALIDATION, PREVIEW_READY and COMPUTER_QA,
then BLOCKED. No completed COMPUTER_QA, INDEPENDENT_REVIEW, READY_FOR_HUMAN, MERGED
or DONE state is asserted. The handoff correctly requires a separate independent
@Computer Work session attached to the **same existing cloud environment** for
`http://localhost:3000`, build `3arTh5JwUyUt0e73FJY-z`; this is not a public
preview URL. Complete the planned browser scenarios and real browser baselines,
resolve/retest any findings, then request the final independent implementation
review. Human merge/release approval remains absent and mandatory.

**Final independent verdict: not issued.** No merge or release readiness is
claimed by this checkpoint.
