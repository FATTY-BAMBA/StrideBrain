# Stage 9 deterministic, eval and browser validation plan

Execution status: NOT_RUN. Historical Stage 8 totals (535 tests/62 files, PostgreSQL subset 93, localization subset 12/4, production audit zero) are provenance only. Do not add subset counts to the full total or substitute them for current-candidate results.

## Preflight and deterministic gate

Freeze exact candidate SHA and record worktree/index changes, source hashes, runtime/Node/PostgreSQL/browser versions, lockfile and all eight migration checksums. Planning baseline is `fec8830398f213e19879eae23e9720ad8563d7b4`; capture a new BUILD_ID after the actual production build. Never reuse Stage 8's BUILD_ID as a new build claim.

Provision a new explicitly disposable PostgreSQL 17 database. Read [rollback-reseed-runbook.md](rollback-reseed-runbook.md) before any seed. Require Node 24, locked dependencies and private operator-supplied environment. Do not print credentials or use any existing QA database. Run and retain command/UTC/exit code/log and passed/failed/skipped counts for:

1. `npm ci --no-audit --no-fund`.
2. `npm run db:validate`, `npm run db:generate`.
3. `npm run db:migrate` on empty DB; verify eight successful migrations and exact checksums.
4. `npm run db:seed`, `npm run db:verify`, repeat seed/verify on that disposable DB only.
5. `npm run format:check`, `npm run lint`, `npm run typecheck`.
6. `npm run test` with the isolated database available. Inspect skips; a no-DB pass is not PostgreSQL acceptance.
7. `npm run test:localization`; explicitly account for the PostgreSQL hero, localization and internal-review invariant suites. Named subsets may already run in full suite; only rerun for a specific evidence need.
8. `npm run build`; `npm audit --omit=dev --audit-level=high`, retain vulnerability counts and inherited lint warning separately.
9. `npm run start` for the new production build with explicit isolated origin; fresh signed synthetic sessions and local browser smoke. Record owned process/port and avoid displacing another user's preview.

The existing `check` shortcut omits several required DB/audit gates. The CI workflow triggers on main push / PR-to-main, not an arbitrary Stage 9 branch push. Do not claim CI started or passed without a run tied to the candidate. No PR/push is part of this planning request.

## Eval assertions

Reuse the current `tests/comparisons/`, `tests/economics/`, `tests/evidence-panel/`, `tests/internal-review/`, route/presentation, localization and authorization suites. No new `evals/` implementation is assumed. Record a release eval report with matrix IDs, exact inputs, expected/observed output, numerator/denominator, exclusions and reviewer.

- CPI-001–010: six primary matches in order Neihu/Zhongshan/Nanjing/Daan/Songshan/Banqiao with **88/81/79/71/69/63**; factor totals, ≥75% known coverage, unknown-versus-mismatch, tenant/class/completed filters, broader/partial and stable ties.
- AUTH-001–012: quote/forecast/offer/reconciled actual separation, active/superseded/conflict states, date-bound offer, Viewer redaction. Overall/category actual require ≥3 eligible observations. Lighting actual remains unavailable at 2/3; table evidence and Evidence gaps reach the same authoritative insufficiency claim.
- Hero economics: quote +7% ±0.5pp, forecast versus actual +6% ±0.5pp, stone +18% ±0.5pp, lighting quote +9% ±0.5pp; millwork approximately +2%, signage approximately −5% with scope warning; programme difference with no quantified premium. Use exact accepted fixture calculations for approximate checks, not newly invented tolerances.
- EVD-001–012: enumerate every material claim and factor locator, exact record/version/row/cell/field, authorized observations, exclusions, conflicts and successor. Audit full canonical critical claim set; precision ≥98%, unsupported material claim zero, leakage zero. Visible zh-TW must not expose `programmeWeeks`, `cost-line`, `forecast-cost-line`, raw policy IDs/enums or English-only district/unit labels in normal UI; internal provenance identifiers remain unchanged.
- ACT-001–012 and SEC-001–016: independently verify explicit consent, transaction atomicity/rollback, retries/concurrency, fresh permissions/assignments/evidence, neutral missing/denied receipts, stale blocking and prompt-injection text inertness. No AI or external tool is enabled to test inert source text.

## Browser, visual and accessibility

Use [computer-qa-plan.yaml](computer-qa-plan.yaml). Complete EN and zh-TW hero journeys at 1440×900, 768×1024, 390×844, 320×740. Capture comparison/review/evidence/source/stale/error/pending/receipt/restricted states; each required state × locale × viewport must have reviewed evidence, not just a screenshot file. Record route, persona, CSS viewport, window/zoom, focus and content reachability; do not capture session URLs or raw cookies.

For each accepted UI state in the matrix, record native, deterministic component, or controlled failure coverage. Optional explanation states are disabled/unavailable behavior only; no model integration. A state that cannot be reached must be marked unsupported/blocked with a reason, not omitted. Actual zoom/motion regression is separate from responsive viewport testing.

Expand grouped acceptance IDs into individual results at execution. For provider-dependent optional explanation pending behavior that is not implemented in this stage, record Stage 10 applicability and absence of a Stage 9 pass; do not enable AI to manufacture coverage. The existing disabled/unavailable behavior and provider-independent hero remain required Stage 9 checks.

M-01 speech, M-02 real phone, M-06 speech association and M-07 human language sign-off need named human reviewers/device details at execution. Record reviewer role/attestation without unnecessary private identifiers. Automated accessibility results support, but never replace, speech or physical input evidence.

M-05 test valid 2028-02-29 in a window that includes it, invalid 2027-02-29, inclusive local today and today+365, yesterday/+366 rejection, default preparation +7, and prepare at Taipei 23:59:59 / confirm after 00:00:00 while proposal/session remain valid. Capture server local dates and no Action/Audit/Receipt writes on rejection. Existing injected clock covers lower layers; browser E2E remains pending test-process feasibility. Do not change host clock or persisted immutable history, and do not fabricate a browser pass from route mocks.

M-06 select the actual form inside the active review dialog (not a guessed ID); after STALE_COMPARISON, ACCESS_CHANGED, EVIDENCE_UNAVAILABLE and safe server failure inspect `aria-describedby`, existing summary ID/text/alert, focus/scroll visibility, complete draft, keyboard recovery and Escape return. Obtain actual speech/AX observations; any unobserved component keeps the inherited gate open.

## Performance protocol

Verify fixture volume before measuring: 24 completed + 5 active projects, 300–500 commercial/cost lines, 100+ references, six canonical matches and top-three economics. If current seeds differ, report the discrepancy and prepare reviewed synthetic benchmark-only expansion; never alter canonical expected business values to fit a test.

| Measurement | Required p95 |
| --- | ---: |
| Browser project useful content | ≤2500ms |
| Warm deterministic comparison | ≤2000ms |
| Cold deterministic comparison | ≤3000ms |
| Evidence panel after result | ≤500ms |
| Browser action creation to durable receipt | ≤1500ms |
| Server proposal prepare/reopen | ≤500ms |
| Server confirmation, including concurrent batches | ≤800ms |

For browser interactions record click/navigation start → usable state; separate HTTP/service/DB spans and network transit. For each series collect ≥30 valid samples, raw samples, median, nearest-rank p95, max, failures, payload size, query counts and environment. Warm series excludes one documented warmup. Cold comparison series uses documented server/process/cache resets outside measurement; a single cold sample is not p95. No reset/fixture creation in measured intervals. For confirmation use distinct valid immutable pairs/proposals to avoid replay timing; preserve generated history. Run ≥30 confirmations in ten batches of three for concurrency. No failed or slow sample may be silently discarded.

Reuse existing `STAGE8_PERFORMANCE_OUTPUT` instrumentation for server proposal/confirmation and query growth. Capture sanitized `EXPLAIN (ANALYZE, BUFFERS)` for representative read queries on project/comparison/evidence/proposal/receipt/Actions, plus slowest relevant read; do not execute write statements for EXPLAIN. Compare baseline and increased evidence/eligible-assignee cardinality to detect N+1. Record query text with safe synthetic parameters only. No numeric query-count cap is invented; batching must remain bounded per accepted contract. Optional explanation p95≤12s is non-blocking only when disabled/unavailable behavior passes; AI remains off.

## Results and closure

Every scenario records PASS/FAIL/PARTIAL/BLOCKED/NOT_VERIFIED_MANUAL_REQUIRED, exact acceptance IDs, locale/persona/device, preconditions, reproduction, artifacts and defect severity. Unrun cases start NOT_RUN. Preserve historical outcomes. On closure restore mutable fixtures and settings, revoke all ledger-owned sessions, retain new immutable history, verify guards/migration checksums, sanitize text/images/metadata, inventory and hash new evidence. Independent review must reconcile evidence, not merely repeat builder claims. Deployment smoke remains NOT_EXECUTED until separately authorized.
