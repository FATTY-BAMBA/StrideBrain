# SB-032 — Stage 9 quality hardening

Status: `READY_FOR_QA` after independent contract review PASS; no Stage 9 execution or release pass is claimed.

## Outcome and authority

Make the merged KNOW → THINK → VERIFY → DO vertical slice reviewable for an L1 controlled synthetic demo. Close the remaining pre-demo verification gates, measure the complete accepted system, and assemble exact-candidate release evidence. This task adds no feature.

- Issue: [#32](https://github.com/FATTY-BAMBA/StrideBrain/issues/32).
- Branch: `build/sb-032-stage9-quality-hardening`.
- Exact planning baseline/head: `fec8830398f213e19879eae23e9720ad8563d7b4`.
- Baseline parents: `0ecd65bdb0ae752f3244960d6848a74a30d5da01` and `b2cd9056b9fe41c1d3d99e091d50a3a69fe3738d`.
- PR #31 merged at `2026-11-17T18:57:44Z`. The baseline tree equals the final Stage 8 documentation head `b2cd9056b9fe41c1d3d99e091d50a3a69fe3738d`.
- A separate Stage 9 worktree preserves the existing QA checkout, its modified task reports, and its untracked evidence. Tracked worktree and index were clean before planning; remote Stage 9 and local HEAD both equaled the supplied baseline.

The user authorizes orchestration and independent contract review now. Product changes require a reproducible gap-analysis/QA defect and the bounded repair process in [build-contract.md](build-contract.md). No deployment, Vercel/DNS operation, new integration, merge, publication, or release is authorized by these plans.

## Required inputs

Read Issue #32; Stage 9 and adjacent stage boundaries in `docs/build/IMPLEMENTATION_SEQUENCE.md`; `docs/build/ACCEPTANCE_AND_EVAL_MATRIX.md`; `docs/quality/QUALITY_CONSTITUTION.md`; `docs/foundry/AGENT_OPERATING_MODEL.md`; final SB-029 `state.json`, `independent-review.md`, `release-scorecard.md`; and the immutable published manual evidence described in [research.md](research.md). Current source and regression tests establish available seams, not new execution passes.

## Scope

1. Complete bilingual end-to-end hero journey and recovery/navigation states.
2. Accessibility automation, keyboard, actual zoom/motion regression, speech and physical-device checks.
3. Reviewed visual baselines at four viewports in both locales.
4. Canonical ranking, authority, economics, abstention and exact-evidence evals.
5. Authorization, tenant isolation, concurrency, transactional failure and non-disclosure checks.
6. Representative performance distributions, query counts, plans and batching checks.
7. Clean build, migration/seed verification and local production-start smoke; prepare deployment contract only.
8. Verify rollback, write containment and reseed procedures on disposable synthetic infrastructure.
9. Assemble limitations, reviews, evidence and exact release-candidate identity.

## Inherited state

Stage 8 verdict remains `PASS_WITH_NON_BLOCKING_PRE_RELEASE_VERIFICATION`. No unresolved observed P0/P1 or required-path P2 was carried forward; F-01 through F-08 have passing or remediated independent evidence. M-03/M-04/F-08 passed on product `f67edb3188c51704acac4465c0a72fca146c6d3f`, not a new Stage 9 test run.

M-01/M-02/M-06/M-07 remain `BLOCKING_BEFORE_DEMO_RELEASE`. M-05 remains `STAGE_9_HARDENING`, unresolved and required for Stage 9 completion. They are not resurrected Stage 8 merge blockers. Historic reports remain dated snapshots, including the then-open/draft PR status; current merge metadata is recorded here without rewriting them.

## Completion rule

Contract review PASS permits the next scoped QA execution phase, not product editing or release. Stage 9 acceptance separately requires all blocking matrix items, measured budgets, zero critical/high security or critical bilingual/accessibility failures, evidence precision ≥98% with zero unsupported material claims, rollback verification, exact preview identity and human release review. Actual preview smoke and deployment identity remain pending separate deployment authorization. Stage 10 AI and Stage 11 domain cutover are outside this execution.
