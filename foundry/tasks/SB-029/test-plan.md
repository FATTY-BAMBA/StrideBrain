# SB-029 independent test and evaluation plan

Status: complete independent deterministic Stage 0–8 gate passed at `4c13f726bb75f4a31d263eb6e54622224807d019`; browser acceptance remains separately pending.

Owner: Test and Evaluation Agent, independent of the Builder. Baseline inspected: `0ecd65bdb0ae752f3244960d6848a74a30d5da01` on `main`. All final results must identify the exact tested commit and any working-tree changes; a baseline pass is not Stage 8 evidence.

## Binding inputs

- [Issue #29](https://github.com/FATTY-BAMBA/StrideBrain/issues/29), including its complete required outcomes, tests and exit gates, captured in `issue-29.json`.
- `docs/build/IMPLEMENTATION_SEQUENCE.md`, Stage 8.
- `docs/decisions/ADR-004-first-governed-action.md`.
- `docs/build/V0_1_BUILD_CONTRACT.md`, especially §§8–16, 18–21.
- `docs/build/SHARED_DTO_AND_STATE_CONTRACT.md`, especially §§17–23.
- `docs/architecture/AUTHORIZATION_MODEL_V0_1.md` and `EVIDENCE_AND_AUTHORITY_MODEL.md`.
- `docs/build/ACCEPTANCE_AND_EVAL_MATRIX.md`: ACT-001–012; SEC-001–016; EVD-001–012; I18N-001–009; A11Y-001–010; applicable PUX, CPI, AUTH and REL requirements.
- Accepted Stage 3–7 implementation/review documents, current tests, Prisma migrations and fixture verification.
- SB-029 architecture/build contract after independent review and Orchestrator acceptance.

Issue #29's Stage 8 latency targets (proposal p95 ≤500 ms, confirmation p95 ≤800 ms excluding network transit) are stricter than the general v0.1 action-creation target and both must be reported accurately. No policy change may be made to obtain a test pass.

## Isolation and evidence discipline

Use an isolated PostgreSQL 17 instance/database containing synthetic data only. The evaluation database is separate from the browser preview; no preview database reseed or source mutation occurs during QA. Baseline local tooling: Node `v24.22.1`, npm `11.9.0`, Docker server `29.9.2`; installed dependencies are present. Evaluator instance name: `stridebrain-sb029-test-eval`, loopback port `54329`, database `stridebrain_stage8_eval` (availability recorded in execution results).

Each execution record includes command, UTC timestamp, commit, dirty-tree status, exit code, test counts and relevant log path. Record skipped tests explicitly. In particular, `tests/comparison-experience/postgres-hero-flow.test.ts` skips when `DATABASE_URL` is absent; a suite pass without the database is not PostgreSQL or end-to-end evidence. Independent results are measured by this role, not copied from Builder statements.

For mutation tests, start from a newly seeded disposable database or restore changed synthetic rows in `finally`/transaction cleanup. Concurrency tests use independent database connections. Fault injection must abort real transactions; mocked call order alone is insufficient rollback proof.

## Deterministic command gate

Run from the repository root with `DATABASE_URL` pointing explicitly to the isolated evaluation database, `NEXT_TELEMETRY_DISABLED=1`, `NEXT_PUBLIC_STRIDEBRAIN_ENV=preview`, `STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC`, and an isolated `STRIDEBRAIN_APP_ORIGIN`.

```bash
git rev-parse HEAD
git status --short
npm ci --no-audit --no-fund
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:verify
npm run db:seed
npm run db:verify
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:localization
npm run build
npm audit --omit=dev --audit-level=high
```

The first migration run targets an empty database. Re-run `db:migrate` after application as an idempotent deployment check. Verify all committed migrations were applied once and no failed migration remains. Repeat full fixture seeding and all SQL checks; compare canonical fixture invariants, not generated timestamps. Preserve unrelated synthetic organization data when evaluating the fixture reset boundary. Any new Stage 8 SQL checks must be wired into the standard `db:verify` and CI command paths.

Do not run dependency installation, Prisma generation, full build or fixture resets concurrently with Builder modifications to those shared outputs. Agree a stable candidate checkpoint first. Final checks repeat against the committed draft-PR head and its GitHub Actions run; a subsequent source commit invalidates prior exact-head evidence.

## Stage 8 acceptance traceability

| IDs | Required behavior and adversarial variants | Necessary evidence |
|---|---|---|
| S8-01; ACT-001; SEC-006/008 | Mei (Project Manager/Estimator with explicit actual-read grant) prepares and creates canonical action; Financial Reviewer and Admin follow accepted assignment policy; PM without required actual evidence is denied safely. | Domain/application tests plus real signed-session PostgreSQL flow for each persona. |
| S8-02; SEC-010/011 | Viewer proposal, proposal reopen, direct create, direct receipt and action-list paths deny before sensitive proposal/evidence/assignee/action reads. No hidden IDs, titles, source names or counts enter the public outcome. | Repository call spies proving absence of forbidden queries; application/API tests; actual Viewer browser journey. |
| S8-03; SEC-001–005/007/012/016 | Cross-tenant project, comparison, enrichment, proposal, assignee, action and evidence selectors fail neutrally; malformed and nonexistent selectors have equivalent safe outcomes. Browser organization/role/capability claims cannot grant access. Explicit DENY wins; unassigned/inactive context fails. Cross-origin/CSRF, invalid/expired/revoked session and duplicate-cookie mutation requests fail. | Negative service/API/repository tests and PostgreSQL constraint tests. |
| S8-04; EVD-001–004/007; ACT-001 | Proposal comes only from immutable authorized verified Stage 5 claim/evidence bindings and matching Stage 4 run. Required stone variance, lighting quote variance and actual insufficiency, programme difference with unquantified premium, run references and warnings remain accurate. Missing, mismatched, tampered, unverifiable or unauthorized bindings fail closed. | Deterministic domain tests, saved-record tampering tests and DB evidence linkage assertions; no model call. |
| S8-05; ACT-002/003 | Bounded title/rationale edits; blank, boundary-length, overlong, unsupported/contradictory edits and malformed dates rejected per accepted contract; mandatory evidence/uncertainty survives edits; explicit confirmation required. | Validation table tests and direct API attempts omitting/altering mandatory content; bilingual UI validation. |
| S8-06; SEC-005; ACT-009 | Candidate is same-org active eligible membership with active-project and sensitive-evidence compatibility; default-without-assign policy enforced; arbitrary candidate/role/org rejected. Recheck candidate after inactivity, permission loss, assignment change or evidence loss. | Batched assignee repository tests, no-query denial tests and live DB mutation scenarios. |
| S8-07; ACT-006/007 | Active quote, forecast, project record/state, comparison policy/calculation/source/input/permission/result fingerprints, enrichment source/input/permission/structural/result fingerprints change independently. Confirm rejects with accepted stale outcome and zero writes; no automatic refresh/continue. | Parameterized service checks plus real persisted-source/snapshot mutations. |
| S8-08; EVD-012; SEC-013; ACT-007/008 | Required evidence authority, conflict, freshness, supersession, missing source and source permission changes reject; locator, supported-value and classification mutations invalidate exact binding integrity even if old Stage 5 hashing omitted them. Runtime membership/capability/assignment downgrade since proposal rejects. | Re-resolved signed-session DB tests; verify no unauthorized detail or partial write. |
| S8-09 | Proposal expired, consumed, cancelled/unavailable, wrong actor/scope or wrong policy cannot be used; project deleted/closed to new actions rejects. | Clock-controlled application and PostgreSQL tests according to accepted status rules. |
| S8-10; ACT-005; REL-007 | Server-validates idempotency key; missing/malformed key rejected; same org/key and identical payload returns same durable receipt; changed title/rationale/assignee/due date/proposal with same key rejects. Current authorization still required for replay. | Application/repository tests plus real PostgreSQL repeat/reopen and downgrade tests. |
| S8-11 | Concurrent identical submissions create one Action, evidence snapshot/links, AuditEvent, consumed proposal and receipt; concurrent distinct keys for one proposal still consume once; same key/different payload cannot create two actions. Critical invariants persist below application layer. Source/permission mutation queued before the authoritative lock/read is observed and rejected; a mutation after the accepted lock boundary cannot commit ahead of the action using old state. | At least two independent DB connections with overlapping confirmations and source/permission mutations, repeated races, cardinality assertions, unique/composite FK SQL rejection. |
| S8-12; ACT-004/010 | Failure after every meaningful write (Action, evidence links/snapshot, AuditEvent, proposal consumption, durable receipt/idempotency) rolls everything back. No false receipt or consumed proposal. Commit-success/response-loss replay recovers same receipt. | Actual DB transaction fault injection at each seam; before/after row counts and proposal fields; error outcome. |
| S8-13; ACT-011 | Audit reconstructs actor user/membership/org/project, proposal/action keys, comparison/enrichment runs, policy/calculation versions, claim/evidence refs, original/final fields, assignee/date, request/correlation/key, timestamp and result. Audit append-only behavior enforced at accepted boundary. | Query actual audit payload and compare with persisted proposal/action; attempt prohibited update/delete where database enforcement applies. |
| S8-14; PUX-014; REL-005 | Durable receipt is permission-safe and reopenable; includes authorized title/project/assignee/date/OPEN status/actor/time/run references/evidence count and navigation. Created action appears in Project Workspace Actions; failed action does not. A non-Viewer losing actual/evidence/create capability cannot read sensitive action titles through the overview or Actions summary after direct receipt access is denied. | DB+application read tests, route tests and browser receipt/workspace screenshots. |
| S8-15; I18N-006/007; PUX-012 | Locale, run, enrichment, selected comparables, evidence panel and return context survive prepare/edit/cancel/confirm/receipt/reopen/language switch. Refresh/back/forward/repeated submit cause no duplicate. URLs remain bounded and authorized. | Route-state tests plus browser history/reload/locale journeys with DB cardinality check. |
| S8-16; I18N-001–009 | Complete English and Taiwan Traditional Chinese parity for every proposal/validation/denied/stale/evidence/assignee/replay/failure/receipt/workspace state. Chinese normal mode has no backend/provider/policy plumbing or mixed critical controls. | Catalog parity tests, formatter/state tests and independent bilingual browser review. |
| S8-17; A11Y-001–010 | Labels/error associations; keyboard sheet and date entry; validation focus; receipt-heading focus; safe cancel focus return; warning text+icon; desktop/tablet/mobile full-height behavior; reduced motion. | Source/component checks are supplementary; real browser keyboard, responsive and focus evidence required. |
| S8-18 | Presentation cannot import Prisma/repositories or decide authorization/calculations/business writes. Browser state is not business truth. No model dependency or prohibited external write exists. | Architecture tests covering all new TSX/routes/modules; dependency/import review; full hero journey without model credentials. |
| S8-19 | Seeded proposal p95 ≤500 ms and confirmation p95 ≤800 ms (server, excluding transit); bounded query counts, no per-evidence/per-assignee waterfall. | Measured samples with count, warm-up policy, p50/p95/max, query counts/plans and exact environment/head; browser timings separately recorded. |
| S8-20 | All Stage 0–7 tests, canonical ranking/economics, fixture invariants, auth/non-disclosure and build/audit gates remain green; migration and rollback notes are verified. Record the pre-existing one-enrichment-per-comparison limitation and verify any accepted bounded disposition; default-only hero tests cannot stand in for the changed-selection route. | Full suite/database/CI outputs and independent diff/rollback review. |

## Performance protocol

Use the canonical seeded controlled demo and immutable top-three comparison/enrichment already available. Record database/Node versions, commit, sample count, connection/pool setup and whether instrumentation is enabled. Warm the server/DB before the warm series and report cold sample separately. Measure at least 30 successful proposal opens and 30 successful confirmations of separate valid proposals, with fixture resets outside measured intervals. If proposal uniqueness requires distinct run pairs, create them before measuring. Report nearest-rank p95, median and maximum, not a single duration labeled p95.

Record query count for proposal prepare/reopen, eligible-assignee loading, fingerprint/evidence validation, confirmation, receipt reopen and workspace list. Instrument SQL at adapter/database boundary. Increase evidence and eligible-assignee cardinality using synthetic records to detect per-row query growth. Capture `EXPLAIN (ANALYZE, BUFFERS)` for the slowest relevant bounded read without logging sensitive payloads. Browser user-perceived timings must come from an actual browser run; PostgreSQL measurements cannot substitute for them.

## Browser handoff and independence

Computer QA Coordinator owns `computer-qa-plan.yaml` and `computer-qa-report.json`. This evaluator provides deterministic evidence and test data setup, but does not claim browser PASS from source inspection. Browser QA uses an isolated preview with exact head, four synthetic personas, both locales and desktop/tablet/mobile viewports. It must capture actual screenshots/focus/URL outcomes and identify severe issues before any readiness claim.

Final Independent Reviewer is separate from Builder and evaluates raw test/CI/browser evidence. A pending or failed browser journey remains pending/failed in reports. The Orchestrator controls task state; this test plan does not advance state or authorize merge/release.

## Failure and repair records

For each failing gate record the exact command, failing test/assertion, observed/expected result and affected contract. Builder owns a minimal fix after root-cause analysis. At most three automatic repair cycles are authorized; each cycle requires targeted validation, full regression, updated evidence and affected QA rerun. Policy conflicts, weakened evidence/auth, destructive migration, external integrations or repair-limit exhaustion escalate to the Orchestrator without changing acceptance criteria.

## Execution results

### Stage 0–7 baseline, independently executed

Executed `2026-11-15T21:21:37Z`–`2026-11-15T21:23:05Z` against baseline product source `0ecd65bdb0ae752f3244960d6848a74a30d5da01`. The Orchestrator committed task documentation during execution (`e2b9436c8894c7a3935121a45864462700eade7a`); no Stage 8 product implementation was present. This is baseline evidence only, not exact Stage 8 PR-head evidence.

An initial `npm ci --no-audit --no-fund` exited 254 because the default `/home/agent/.npm/_cacache` was unavailable in the sandbox. The tooling-only correction set `npm_config_cache=/tmp/sb029-npm-cache` and `XDG_CACHE_HOME=/tmp/sb029-tool-cache`; lockfile, registry, TLS and source were unchanged. Original failure: `/tmp/sb029-stage0-7-baseline/01.log`. Successful rerun report and individual command logs: `/tmp/sb029-stage0-7-baseline-attempt2/report.json`, `01.log`–`16.log`.

| Commands | Result |
|---|---|
| `npm ci --no-audit --no-fund` | Exit 0, locked dependencies installed. |
| `npm run db:validate`; `npm run db:generate` | Both exit 0. |
| `npm run db:migrate` on empty PostgreSQL 17, then repeated | Both exit 0; independent query confirmed 7 completed migrations. |
| `npm run db:seed`; `npm run db:verify`, performed twice | All four commands exit 0. |
| `npm run format:check`; `npm run lint`; `npm run typecheck` | All exit 0. |
| `npm run test` with explicit database URL | Exit 0; 43 files, 200 tests passed. PostgreSQL hero flow ran; an actual persisted ComparisonRun exists in the isolated DB. |
| `npm run test:localization` | Exit 0; 3 files, 8 tests passed. |
| `npm run build` | Exit 0; production Next.js build completed. Build regenerated `next-env.d.ts`; Builder/Orchestrator notified to handle this generated-only diff. |
| `npm audit --omit=dev --audit-level=high` | Exit 0; 0 vulnerabilities. |

No Stage 8 test, Stage 8 p95, browser QA, preview readiness, final CI or release result is claimed by this baseline. Detailed exact-candidate results remain pending implementation.


### Stage 8 bounded BUILDING evaluation

The independent real PostgreSQL suite is `tests/internal-review/postgres-invariants.test.ts`. It creates its own empty synthetic database, applies all eight migrations and seed/SQL invariants, and drops only the generated prefixed database. Its actual SQL instrumentation proves Viewer/current-capability denials before sensitive reads, document ownership and immutable binding checks, bounded assignee/evidence queries, concurrency, lock ordering, atomic rollback at all six checkpoints, audit reconstruction and protected fixture resets. The complete stable-candidate gate remains pending.

`validation-building.json` and `evidence/build-evaluation/` retain preliminary commands, results, test-harness corrections and measured PostgreSQL performance. A source change or an individual targeted pass is not represented as a complete exact-head pass. Browser QA remains outside these results.


### Complete exact-head deterministic validation

All 16 independent commands passed on `4c13f726bb75f4a31d263eb6e54622224807d019` from `2026-11-15T22:09:18Z` through `2026-11-15T22:12:25Z`. The only pre-existing dirty files were the Orchestrator's task-state documents. Full suite: **57 files / 436 tests passed, zero skipped**, including **88 real PostgreSQL adversarial cases** and all **200 Stage 0–7 regression cases**. Localization: **4 files / 11 tests passed**. All eight migrations applied to a new empty PostgreSQL 17.12 database, repeat migration and both seed/invariant cycles passed, production Next.js build passed, and production dependency audit reported zero vulnerabilities.

The production build ID is `3arTh5JwUyUt0e73FJY-z`. Its sole generated tracked-file change was the known `next-env.d.ts` Next type-reference/comment regeneration; the evaluator inspected and restored candidate bytes as authorized. Source/tests/schema/configuration match the candidate. `validation-final.json` contains exact commands, timings, source fingerprint, counts and contract proof, with raw local command logs copied under `evidence/exact-head-4c13f726/`.

Measured PostgreSQL proposal preparation: 30 samples, p50 **74.69 ms**, p95 **92.32 ms**, 110 SQL events. Confirmation: 30 samples, p50 **87.91 ms**, p95 **97.85 ms**, 131 SQL events. Thirty confirmations in ten concurrent batches of three had p95 **254.60 ms**. Evidence references increasing 15→35 kept 21 scope-read SQL events; adding 20 eligible assignees kept proposal preparation at 110 events. Actual `EXPLAIN (ANALYZE, BUFFERS)` evidence is retained. These are controlled local server timings, excluding HTTP transit. Browser QA is not claimed by this gate.
