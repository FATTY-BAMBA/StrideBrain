# Independent repair-plan review

Verdict: PASS before product implementation. Reviewer: sb032_entry_classification, read-only review of exact head 1bde2114d010c694d017ba2b4116ceffab3569e1 and repair-contract.md.

F02 raw workspace/evidence-health enums need exhaustive presentation labels only. F03 hard-coded loading name needs locale-aware status/busy naming with unchanged skeleton/motion CSS.

F04 forward schema change independently proved necessary: current comparisonRunId uniqueness prevents multiple enrichments; comparison-scoped claim keys cannot represent recurring economic claims. Approve one new migration, one-to-many relation, nullable enrichment owner, matching tenant/comparison FK, enrichment claim uniqueness plus legacy null partial uniqueness. Backfill uniquely attributable snapshot claims only; abort on inconsistency. Preserve all old snapshots/IDs/history and eight historical migrations. New clean migration count is nine.

Strict submission cardinality precedes truncation/fallback, selection order follows immutable ranking. Dirty expression is not the DB root cause. Reset only persisted result identity; same-result locale/evidence/draft navigation retains state. Failures must not masquerade as saved results or role restrictions.

A1→B→A2 yields three distinct immutable enrichments under the same structural run. No economics idempotency policy exists; explicit identical/concurrent calls may create distinct complete runs, each isolated. Do not reuse globally by fingerprint or change action receipt idempotency. Pending UI blocks accidental double submission. Current means the active route's persisted economics ID, not a new global latest-wins rule.

Required proof: real PostgreSQL transitions/cardinalities/unauthorized and concurrent cases; route/evidence/proposal exact ownership; old/new reopen; populated upgrade and clean migration/seed; full deterministic gate, independent source review and bilingual four-viewport real Chrome retest. This is plan approval, not code/source/QA/release acceptance. No deployment or merge.

## Source review corrections

The independent reviewer required two bounded corrections: bidirectional historical claim completeness and snapshot identity checks before migration ownership backfill; factor navigation deriving economics from the current persisted view when the factor selection has no enrichment ID. Both are implemented. Seven negative populated-migration cases prove fail-closed rollback without payload changes. Targeted regressions: 67 PASS across four files.

The reviewer confirmed one/two-project selection remains valid economics, while existing mandatoryClaims policy refuses preparation without three eligible imported-stone observations. Tests preserve this policy and verify zero proposal/action/receipt writes; eligible three-project runs prove current proposal lineage.
