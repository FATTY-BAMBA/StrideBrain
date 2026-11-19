# Stage 9 verification architecture

No product architecture change is proposed. Preserve UI → application → domain/repository boundaries, server-derived identity/tenant/capabilities, immutable comparisons and economics, current-source freshness checks, bounded explicit confirmation, atomic action/audit/receipt writes and fail-closed readers.

## Evidence layers

1. Source/CI identity: exact commit, tree cleanliness, lockfile, eight migration checksums, runtime versions and BUILD_ID.
2. Deterministic gate: policy/calculation, localization, component/DOM, repository/PostgreSQL, API/authorization and transaction invariants.
3. Production local browser: real rendered hero journey, visible UI, keyboard/focus, timings and locale/navigation stability.
4. Native/human: actual zoom/OS motion, screen-reader speech, real phone input and Taiwan Chinese review.
5. Operational rehearsal: new disposable database for reset/failure testing, separate retained-history browser database, migration/rollback/credential cleanup proofs.
6. Release review: independently reconciled results tied to exact candidate and, only when authorized, actual preview deployment.

Each layer has its own result and limitations. No DOM result substitutes for speech, no emulated viewport for a physical phone or browser zoom, no mocked-clock service test for UI E2E, no server timing for user-perceived latency, and no plan for deployed smoke.

## Isolation and ownership

Keep the Stage 9 worktree separate from historical QA worktrees. Use new UTC evidence runs under `foundry/tasks/SB-032/evidence/<UTC-RUN-ID>/` only during execution. Keep private session/bootstrap files, environment values and raw diagnostic captures outside published evidence. Use operator-led one-use synthetic sessions and server-side tenant membership; the browser never selects identity by URL parameter. Existing SB-029 helpers may be read/reused after inspection; do not alter historical scripts or reports.

Use separate disposable DBs for deterministic/adversarial/reseed testing and a run-owned synthetic browser DB. Record database identity in a private operator ledger and publish only safe hashes/aliases. Stop the owned preview before reset. Never point test suites that create/drop/reset schemas at a retained or customer database. Use privileged owner credentials only for migrations/seeding, separate from application use; exact effective privileges and guard behavior must be verified rather than assumed from the CI service.

## Clock and failure seams

Reuse the existing injected service clock for deterministic date checks. For live M-05, first prove an isolated test process can align all relevant server and browser clocks without modifying production source, system time, signed-session semantics or immutable stored dates. A mocked response rendering test is partial evidence only. If no such method is available, record the browser boundary check BLOCKED and request a bounded test-harness decision; do not add a public clock endpoint or silently waive M-05.

Trigger stale/access/evidence failures with reversible, ledger-recorded synthetic changes in the owned DB, restoring the exact prior row. Induce safe storage failures only in disposable infrastructure. Never disable authorization/immutability to create a screenshot. Preserve created comparison/proposal/action/audit/receipt history; cleanup revokes sessions and restores mutable fixtures, not history.

## No architecture expansion

No new model, AI integration, external communications, action type, policy, permission model, evidence authority, schema or migration is planned. Potential defects must be reproduced first. Performance instrumentation belongs in existing test/operator seams, not a user-visible feature or a production bypass. Cloud preview provisioning and domain changes remain unexecuted pending separate authorization.
