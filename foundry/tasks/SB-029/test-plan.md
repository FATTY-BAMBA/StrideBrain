# SB-029 independent test and evaluation plan

Status: planned; Stage 8 implementation and browser acceptance have not been evaluated.

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
| S8-03; SEC-001–005/007/012 | Cross-tenant project, comparison, enrichment, proposal, assignee, action and evidence selectors fail neutrally; malformed and nonexistent selectors have equivalent safe outcomes. Browser organization/role/capability claims cannot grant access. Explicit DENY wins; unassigned/inactive context fails. | Negative service/API/repository tests and PostgreSQL constraint tests. |
| S8-04; EVD-001–004/007; ACT-001 | Proposal comes only from immutable authorized verified Stage 5 claim/evidence bindings and matching Stage 4 run. Required stone variance, lighting quote variance and actual insufficiency, programme difference with unquantified premium, run references and warnings remain accurate. Missing, mismatched, tampered, unverifiable or unauthorized bindings fail closed. | Deterministic domain tests, saved-record tampering tests and DB evidence linkage assertions; no model call. |
| S8-05; ACT-002/003 | Bounded title/rationale edits; blank, boundary-length, overlong, unsupported/contradictory edits and malformed dates rejected per accepted contract; mandatory evidence/uncertainty survives edits; explicit confirmation required. | Validation table tests and direct API attempts omitting/altering mandatory content; bilingual UI validation. |
| S8-06; SEC-005; ACT-009 | Candidate is same-org active eligible membership with active-project and sensitive-evidence compatibility; default-without-assign policy enforced; arbitrary candidate/role/org rejected. Recheck candidate after inactivity, permission loss, assignment change or evidence loss. | Batched assignee repository tests, no-query denial tests and live DB mutation scenarios. |
| S8-07; ACT-006/007 | Active quote, forecast, project record/state, comparison policy/calculation/source/input/permission/result fingerprints, enrichment source/input/permission/structural/result fingerprints change independently. Confirm rejects with accepted stale outcome and zero writes; no automatic refresh/continue. | Parameterized service checks plus real persisted-source/snapshot mutations. |
| S8-08; EVD-012; SEC-013; ACT-007/008 | Required evidence authority, conflict, freshness, supersession, missing source and source permission changes reject; runtime membership/capability/assignment downgrade since proposal rejects. | Re-resolved signed-session DB tests; verify no unauthorized detail or partial write. |
| S8-09 | Proposal expired, consumed, cancelled/unavailable, wrong actor/scope or wrong policy cannot be used; project deleted/closed to new actions rejects. | Clock-controlled application and PostgreSQL tests according to accepted status rules. |
| S8-10; ACT-005; REL-007 | Server-validates idempotency key; missing/malformed key rejected; same org/key and identical payload returns same durable receipt; changed title/rationale/assignee/due date/proposal with same key rejects. Current authorization still required for replay. | Application/repository tests plus real PostgreSQL repeat/reopen and downgrade tests. |
| S8-11 | Concurrent identical submissions create one Action, evidence snapshot/links, AuditEvent, consumed proposal and receipt; concurrent distinct keys for one proposal still consume once; same key/different payload cannot create two actions. Critical invariants persist below application layer. | At least two independent DB connections with overlapping confirmations, repeated races, cardinality assertions, unique/composite FK SQL rejection. |
| S8-12; ACT-004/010 | Failure after every meaningful write (Action, evidence links/snapshot, AuditEvent, proposal consumption, durable receipt/idempotency) rolls everything back. No false receipt or consumed proposal. Commit-success/response-loss replay recovers same receipt. | Actual DB transaction fault injection at each seam; before/after row counts and proposal fields; error outcome. |
| S8-13; ACT-011 | Audit reconstructs actor user/membership/org/project, proposal/action keys, comparison/enrichment runs, policy/calculation versions, claim/evidence refs, original/final fields, assignee/date, request/correlation/key, timestamp and result. Audit append-only behavior enforced at accepted boundary. | Query actual audit payload and compare with persisted proposal/action; attempt prohibited update/delete where database enforcement applies. |
| S8-14; PUX-014; REL-005 | Durable receipt is permission-safe and reopenable; includes authorized title/project/assignee/date/OPEN status/actor/time/run references/evidence count and navigation. Created action appears in Project Workspace Actions; failed action does not. | DB+application read tests, route tests and browser receipt/workspace screenshots. |
| S8-15; I18N-006/007; PUX-012 | Locale, run, enrichment, selected comparables, evidence panel and return context survive prepare/edit/cancel/confirm/receipt/reopen/language switch. Refresh/back/forward/repeated submit cause no duplicate. URLs remain bounded and authorized. | Route-state tests plus browser history/reload/locale journeys with DB cardinality check. |
| S8-16; I18N-001–009 | Complete English and Taiwan Traditional Chinese parity for every proposal/validation/denied/stale/evidence/assignee/replay/failure/receipt/workspace state. Chinese normal mode has no backend/provider/policy plumbing or mixed critical controls. | Catalog parity tests, formatter/state tests and independent bilingual browser review. |
| S8-17; A11Y-001–010 | Labels/error associations; keyboard sheet and date entry; validation focus; receipt-heading focus; safe cancel focus return; warning text+icon; desktop/tablet/mobile full-height behavior; reduced motion. | Source/component checks are supplementary; real browser keyboard, responsive and focus evidence required. |
| S8-18 | Presentation cannot import Prisma/repositories or decide authorization/calculations/business writes. Browser state is not business truth. No model dependency or prohibited external write exists. | Architecture tests covering all new TSX/routes/modules; dependency/import review; full hero journey without model credentials. |
| S8-19 | Seeded proposal p95 ≤500 ms and confirmation p95 ≤800 ms (server, excluding transit); bounded query counts, no per-evidence/per-assignee waterfall. | Measured samples with count, warm-up policy, p50/p95/max, query counts/plans and exact environment/head; browser timings separately recorded. |
| S8-20 | All Stage 0–7 tests, canonical ranking/economics, fixture invariants, auth/non-disclosure and build/audit gates remain green; migration and rollback notes are verified. | Full suite/database/CI outputs and independent diff/rollback review. |

## Performance protocol

Use the canonical seeded controlled demo and immutable top-three comparison/enrichment already available. Record database/Node versions, commit, sample count, connection/pool setup and whether instrumentation is enabled. Warm the server/DB before the warm series and report cold sample separately. Measure at least 30 successful proposal opens and 30 successful confirmations of separate valid proposals, with fixture resets outside measured intervals. If proposal uniqueness requires distinct run pairs, create them before measuring. Report nearest-rank p95, median and maximum, not a single duration labeled p95.

Record query count for proposal prepare/reopen, eligible-assignee loading, fingerprint/evidence validation, confirmation, receipt reopen and workspace list. Instrument SQL at adapter/database boundary. Increase evidence and eligible-assignee cardinality using synthetic records to detect per-row query growth. Capture `EXPLAIN (ANALYZE, BUFFERS)` for the slowest relevant bounded read without logging sensitive payloads. Browser user-perceived timings must come from an actual browser run; PostgreSQL measurements cannot substitute for them.

## Browser handoff and independence

Computer QA Coordinator owns `computer-qa-plan.yaml` and `computer-qa-report.json`. This evaluator provides deterministic evidence and test data setup, but does not claim browser PASS from source inspection. Browser QA uses an isolated preview with exact head, four synthetic personas, both locales and desktop/tablet/mobile viewports. It must capture actual screenshots/focus/URL outcomes and identify severe issues before any readiness claim.

Final Independent Reviewer is separate from Builder and evaluates raw test/CI/browser evidence. A pending or failed browser journey remains pending/failed in reports. The Orchestrator controls task state; this test plan does not advance state or authorize merge/release.

## Failure and repair records

For each failing gate record the exact command, failing test/assertion, observed/expected result and affected contract. Builder owns a minimal fix after root-cause analysis. At most three automatic repair cycles are authorized; each cycle requires targeted validation, full regression, updated evidence and affected QA rerun. Policy conflicts, weakened evidence/auth, destructive migration, external integrations or repair-limit exhaustion escalate to the Orchestrator without changing acceptance criteria.

## Execution results

No Stage 8 execution result is recorded yet. Baseline checks and subsequent exact-candidate results will be appended with command outputs/evidence references once independently executed.
