# SB-029 release scorecard

## Current Stage 8 acceptance — 20261117T095951Z

**Final implementation verdict: PASS_WITH_NON_BLOCKING_PRE_RELEASE_VERIFICATION. Task state: READY_FOR_HUMAN.**

Canonical branch `build/sb-029-governed-internal-review`, exact product head `f67edb3188c51704acac4465c0a72fca146c6d3f`. [Exact-head CI 44059619525](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/44059619525) is completed/success; its quality job and all 21 recorded steps passed. BUILD_ID: `7AxvZ0avDfCi3vJEjHpJH`.

[Published manual acceptance run 20261117T095951Z](https://github.com/FATTY-BAMBA/StrideBrain/tree/029f70e8ddce6061bcb5691f4cdfc6bca5f146e2/foundry/tasks/SB-029/evidence/manual-acceptance/20261117T095951Z) is on `qa/sb-029-manual-20261117T095951Z`, commit `029f70e8ddce6061bcb5691f4cdfc6bca5f146e2`, direct parent `f67edb3188c51704acac4465c0a72fca146c6d3f`. The evidence contains **178 files and 64 screenshots**; all 177 artifact hashes and the exact direct parent were verified. Sanitization and cleanup/restoration pass. The recorded snapshot was published unchanged; its original local/unpublished wording describes the capture checkpoint, while publication is established by this commit.

**M-03 PASS; M-04 PASS; F-08 PASS / closed for the tested scope.** Actual Chrome menu zoom was 200%; actual macOS Reduce motion was ON and the media query reported reduce. Both locales passed source focus entry, six native forward and six reverse Tab steps per configuration, exclusion of background navigation, exact source-trigger return and hierarchical Escape. All 48 source keyboard observations were contained. Review/evidence/receipt and stale/error recovery remained operable. Chrome returned to 100%, Reduce motion to original OFF, both QA sessions were revoked, temporary mutations were restored, and fixture/history guards remain intact. No new required-path defect was observed.

The recorded HTTP 400 was a later POST to the Codex response service after QA session revocation, not a StrideBrain failure; it affected no captured test observation. The evidence report retains the transient pending-state and subpixel-geometry qualifications without inventing additional passes.

**No unresolved observed P0, P1 or required-path P2 remains. No policy/security escalation or technical acceptance blocker remains.** F-01 through F-08 have passing or remediated independent evidence. This is acceptance synthesis, not a new full QA matrix or unconditional demo-release approval.

| Item | Status | Future gate |
| --- | --- | --- |
| M-01 — Actual screen-reader announcements | NOT_VERIFIED_MANUAL_REQUIRED | BLOCKING_BEFORE_DEMO_RELEASE |
| M-02 — Physical mobile keyboard/touch/native picker | NOT_VERIFIED_MANUAL_REQUIRED | BLOCKING_BEFORE_DEMO_RELEASE |
| M-05 — Leap-day / Asia-Taipei midnight boundaries | NOT_VERIFIED_MANUAL_REQUIRED | STAGE_9_HARDENING |
| M-06 — Generic form-error description association | NOT_VERIFIED_MANUAL_REQUIRED | BLOCKING_BEFORE_DEMO_RELEASE |
| M-07 — Independent human Taiwan Traditional Chinese review | NOT_VERIFIED_MANUAL_REQUIRED | BLOCKING_BEFORE_DEMO_RELEASE |

All five future items remain unresolved human-verification requirements; none blocks merge under the accepted classification. Exact human steps remain in `state.json` and the [prior manual-verification record](https://github.com/FATTY-BAMBA/StrideBrain/blob/e043ee551169c1f8586c9d490703be3a4a1ab187/foundry/tasks/SB-029/evidence/local-qa/20261117T050611Z/manual-verification.json). No human pass is inferred from DOM or automated browser evidence.

PR #31 is **eligible to be marked Ready for Review**, but remains **OPEN, DRAFT and UNMERGED**. Human merge approval and later release approval are still required; neither is granted by this update. Only the three task records and PR description are updated; canonical product source/head and all historical QA evidence are unchanged.

## Current findings and evidence chain

| Finding | Current disposition | Evidence basis |
| --- | --- | --- |
| F-01 — Forecast/actual labels | PASSED_AND_PRESERVED | Broad run and targeted authority smoke; authority rules unchanged |
| F-02 — Draft preservation | PASSED_AND_PRESERVED | Broad navigation run and targeted smoke; F-08 regressions preserve draft selectors |
| F-03 — zh-TW terminology | REMEDIATED_BY_LATER_PASS | 20261117T050611Z bilingual locator/evidence retest |
| F-04 — Denied receipt wording | PASSED_AND_PRESERVED | Broad denial checks and targeted known/missing receipt pairs |
| F-05 — Error focus/visibility | PASSED_AND_PRESERVED | Broad error matrix, targeted smoke and latest scoped stale/error observations; M-06 remains a release gate |
| F-06 — Stale-result warning | PASSED_AND_PRESERVED | Broad/source-change checks and latest bilingual stale warnings; action blocking preserved |
| F-07 — Lighting insufficiency affordance | REMEDIATED_BY_LATER_PASS | 20261117T050611Z authoritative table/evidence-gap equivalence |
| F-08 — Source-modal focus | REMEDIATED_BY_LATER_PASS / CLOSED | Exact-head 20261117T095951Z native 200% zoom and OS reduced-motion evidence |

Historical outcomes remain unchanged:

- First local run `20261116T041837Z`: **9 PASS / 3 FAIL / 5 PARTIAL / 1 BLOCKED**.
- [Broad run `20261117T023357Z`](https://github.com/FATTY-BAMBA/StrideBrain/tree/5985b7b5ef6a87d9312c9d989e90a2d5be6ac19a/foundry/tasks/SB-029/evidence/local-qa/20261117T023357Z): **14 PASS / 2 FAIL / 2 PARTIAL / 0 BLOCKED**. QA-16/QA-18 remain historical FAIL; QA-02/QA-15 remain historical PARTIAL.
- [Targeted run `20261117T050611Z`](https://github.com/FATTY-BAMBA/StrideBrain/tree/e043ee551169c1f8586c9d490703be3a4a1ab187/foundry/tasks/SB-029/evidence/local-qa/20261117T050611Z): **F-03/F-07 PASS; five prior-repair smoke checks PASS; no new product finding**.
- Earlier manual run `20261117T070845Z`: **M-03 FAIL / M-04 FAIL**, establishing F-08 on `5c3e2763635dab46e8c91255e0394eece008dcb1`. Those failures are superseded for current acceptance by the new passing run; their historical records remain unchanged.
- Latest manual run `20261117T095951Z`: **M-03 PASS / M-04 PASS / F-08 PASS**. No synthesized new 18-scenario pass count is claimed.

QA-16/QA-18's observed failure causes are remediated through the scoped repair evidence. QA-15's required focus blocker is closed, while M-01/M-02/M-06 remain demo-release gates. QA-16 retains M-02/M-07; QA-18 retains M-07; QA-02 retains M-05. These qualifications remain explicit.

## Deterministic validation and bounded repair

The F-08 delta from `5c3e2763635dab46e8c91255e0394eece008dcb1` to `f67edb3188c51704acac4465c0a72fca146c6d3f` is four product presentation/focus files, one DOM regression file and validation artifacts. The [independent source review](https://github.com/FATTY-BAMBA/StrideBrain/blob/f67edb3188c51704acac4465c0a72fca146c6d3f/foundry/tasks/SB-029/evidence/f08-repair-20261117T085821Z/independent-review.json) passes. It confirms a persistent modal boundary, deterministic focus without timer dependencies, containment, exact-trigger restoration and hierarchical Escape. No authorization, tenant isolation, financial/evidence authority, immutable comparison/action policy, schema/migration, AI, external-communication or unrelated feature change.

[Recorded deterministic validation](https://github.com/FATTY-BAMBA/StrideBrain/blob/f67edb3188c51704acac4465c0a72fca146c6d3f/foundry/tasks/SB-029/evidence/f08-repair-20261117T085821Z/validation.json): **535 tests / 62 files, zero skipped**, including 35 new focus tests; targeted regression 77 tests/7 files, localization 12/4, PostgreSQL adversarial 93 tests. Named subsets are not added to the full total. Format, lint, strict TypeScript, Prisma validation/generation, eight clean migrations, repeated seed/SQL verification, production build and audit pass; **0 production vulnerabilities**, one pre-existing `prisma.config.ts` lint warning. Exact-head CI independently passes. No suite or browser checks were rerun during this metadata reconciliation.

## Historical checkpoints — retained verbatim

The records below describe their dated heads and runs. Their historical verdicts and blocker statements are superseded for current-head acceptance by the section above; their outcomes are not rewritten.

## Manual acceptance reassessment — 20261117T070845Z

**Final independent verdict: REVISE. Task state: NEEDS_REVISION.** Both M-03 and M-04 were actually executed and fail for one new required-path **P2 F-08 / QA-15**. This supersedes the earlier absence-of-manual-evidence blocker; it does not rewrite any historical QA outcome. Product head remains 5c3e2763635dab46e8c91255e0394eece008dcb1, BUILD_ID VSGc_BSVp5nB86Sw8Zypr, prior exact-head CI 44021235139 PASS.

Native Chrome zoom was set through its visible View menu to 200%, with exact toolbar AX confirmation and CSS640×399 / DPR 4 from a 1280×799 / DPR 2 baseline. Actual macOS Reduce Motion was enabled and both locales reported matchMedia=true; computed transitions were reduced. In both locales and both configurations, keyboard activation of a claim's Inspect source control renders a settled source dialog but leaves focus on BODY; subsequent Tab reaches background navigation behind aria-modal=true. Escape recovery is evidenced. This fails focus containment/visible focus requirements and is recoverable P2, not an established P1 or zoom-specific cause. F-01 through F-07 retain their earlier passing evidence. No other new product finding or policy/security escalation was observed.

Review, validation, stale/generic error, evidence, receipt and keyboard controls were checked in both locales; the successful subchecks do not override the focus failure. Actual200% is supported by native menu/AX and geometry; a public numeric zoom-popup image is unavailable. EN pending state was observed in immediate DOM, while screenshots settled too quickly; zh pending was not observed. Continuous animation measurements and the other human-verification items are not claimed.

Both native settings were restored (Chrome 100%, original Reduce Motion OFF; both locales matchMedia=false). The two owned tabs closed; both run-issued sessions revoked, zero active; QA issuer stopped. Both source-authority mutations restored exactly; fixed fixtures, prior history and new immutable comparisons unchanged. Four guards/eight migration checksums match. Two intended new atomic actions remain, with no duplicates. All 205 source files, 901 prior evidence files and 305 pre-existing untracked files are unchanged. No product source was modified or repaired.

The browser reviewer was separate from the product builder. The independent evaluation agent reviewed frozen observations, all 72 screenshots via contact sheets and critical full-size frames, plus restoration/integrity records. See [manual run report](evidence/manual-acceptance/20261117T070845Z/REPORT.txt), [browser results](evidence/manual-acceptance/20261117T070845Z/browser-results.json), [independent reassessment](evidence/manual-acceptance/20261117T070845Z/independent-reassessment.json), and [sanitization](evidence/manual-acceptance/20261117T070845Z/sanitization.json). Evidence and task-record changes are local, not committed/published. No full QA-01–QA-18 rerun.

| Item | Result / remaining status | Classification |
| --- | --- | --- |
| M-03 — Exact 200% browser zoom | FAIL: F-08 source-panel focus containment | BLOCKING_BEFORE_MERGE |
| M-04 — Actual OS reduced motion | FAIL: F-08 source-panel focus destination/containment | BLOCKING_BEFORE_MERGE |
| M-01 — Screen-reader announcements | NOT_VERIFIED_MANUAL_REQUIRED | BLOCKING_BEFORE_DEMO_RELEASE |
| M-02 — Physical mobile interaction | NOT_VERIFIED_MANUAL_REQUIRED | BLOCKING_BEFORE_DEMO_RELEASE |
| M-05 — Leap-day / Taipei midnight | NOT_VERIFIED_MANUAL_REQUIRED | STAGE_9_HARDENING |
| M-06 — Generic error description association | NOT_VERIFIED_MANUAL_REQUIRED | BLOCKING_BEFORE_DEMO_RELEASE |
| M-07 — Independent human zh-TW review | NOT_VERIFIED_MANUAL_REQUIRED | BLOCKING_BEFORE_DEMO_RELEASE |

The conditional READY_FOR_HUMAN gate is not met. PR #31 remains OPEN, DRAFT and UNMERGED; no human merge/release approval, Stage 8 completion or release-readiness claim. A scoped F-08 repair and independent retest are required in a separate authorized task.

Historical broad counts remain 14 PASS/2 FAIL/2 PARTIAL/0 BLOCKED. The prior targeted repair run remains PASS for F-03/F-07 plus five smoke checks. This manual run records 0 PASS/2 FAIL and one new product finding; it creates no synthesized full-scenario pass count. Prior deterministic validation remains 500 tests/61 files, production build PASS and audit 0; no deterministic gate was rerun for this evidence-only task.
