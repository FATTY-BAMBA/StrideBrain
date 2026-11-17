# SB-029 independent review

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

## Historical evidence synthesis before manual acceptance — 2026-11-17

**Final implementation verdict: REVISE — required manual acceptance evidence is missing.**
Current task state: `NEEDS_REVISION`; blocker: `MANUAL_ACCEPTANCE_EVIDENCE_REQUIRED`.
This requests no product repair. The known product defects are remediated, but
M-03 and M-04 prevent `READY_FOR_HUMAN` under the requested conditional gate.
PR #31 must remain OPEN, DRAFT and UNMERGED. Human merge/release approval is absent.

Reviewer: existing `independent_evaluation` agent, separate from the product builder;
read-only final review, no product/file/browser/database/Git changes by that reviewer.
The orchestrator transcribed its final verdict and checked the referenced evidence.
Review recorded: 2026-11-17T06:43:42.524086+00:00. This synthesis performs no new browser run or test execution.

### Frozen inputs and integrity

- Canonical branch: `build/sb-029-governed-internal-review`, exact product head `5c3e2763635dab46e8c91255e0394eece008dcb1`.
- [Broad independent browser run 20261117T023357Z](https://github.com/FATTY-BAMBA/StrideBrain/tree/5985b7b5ef6a87d9312c9d989e90a2d5be6ac19a/foundry/tasks/SB-029/evidence/local-qa/20261117T023357Z): evidence commit `5985b7b5ef6a87d9312c9d989e90a2d5be6ac19a`, direct parent/tested product `211578dd4b4e12169a182c498254bb571cadad70`; historical **14 PASS / 2 FAIL / 2 PARTIAL / 0 BLOCKED**.
- [Targeted independent repair retest 20261117T050611Z](https://github.com/FATTY-BAMBA/StrideBrain/tree/e043ee551169c1f8586c9d490703be3a4a1ab187/foundry/tasks/SB-029/evidence/local-qa/20261117T050611Z): evidence commit `e043ee551169c1f8586c9d490703be3a4a1ab187`, direct parent/tested product `5c3e2763635dab46e8c91255e0394eece008dcb1`; **2 targeted repair checks PASS, 5 scoped smoke checks PASS, 0 failures/new findings**.
- Targeted BUILD_ID: `VSGc_BSVp5nB86Sw8Zypr`; source manifest SHA-256 `fce51bf5de6d1751e54d8941f7c9f31104b3e3efffd12e030301cbdbfd462663`.
- Exact-head [GitHub CI 44021235139](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/44021235139): completed/success, head equals `5c3e2763635dab46e8c91255e0394eece008dcb1`; its `quality` job and all 21 recorded steps succeed.
- Rechecked both evidence commits directly from Git objects: broad 1,275 scoped files/1,274 artifact hashes; targeted 467 scoped files/466 hashes, all matching. All 205 current source-manifest hashes and 305 pre-existing untracked evidence files match. Historical evidence is unchanged.

### Exact source-delta review

Compared `211578dd4b4e12169a182c498254bb571cadad70` to `5c3e2763635dab46e8c91255e0394eece008dcb1`. The complete delta is
28 files, 907 additions and 2 deletions: two product presentation files, three
regression-test files and 23 validation-evidence files.

| Changed code file                                                  | Bounded purpose                                                                                                                                                            |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/evidence-panel/application/get-evidence-panel.ts`     | Map locator field values through existing bilingual copy, including Programme in weeks / 工期（週）; retain raw domain/provenance data.                                    |
| `src/modules/comparison-experience/build-comparison-experience.ts` | Select existing ACTUAL_INSUFFICIENT when both history and variance are insufficient, matching the domain claim producer; preserve quote, supported and unavailable states. |
| `tests/evidence-panel/get-evidence-panel.test.ts`                  | Bilingual claim/source/factor rendering rejects visible programmeWeeks and retains provenance.                                                                             |
| `tests/comparison-experience/build-comparison-experience.test.ts`  | Canonical and noncanonical insufficiency mapping, supported evidence and unavailable-data controls.                                                                        |
| `tests/evidence-panel/postgres-localization-review.test.ts`        | Real stored-data table/gap panel equality, 2/3/no fabricated range, supported trace, missing-selector control and localization.                                            |

Product-diff SHA-256: `a03223953f8a0668f3412871f4f24b1c64ce47ac732250629607259205784685`.
Five-code-file diff SHA-256: `74aab7eb8c10f17adf0178a3017336adfec17a2ebda960c3b2d38bb454c16fcd`.
Both match the separate repair review. There is no policy, authorization,
tenant-isolation, financial-authority, evidence-authority, schema/migration,
new-action-type, AI integration, external-communication or unrelated feature change.
Similarity/sufficiency rules, immutable history, repositories and deployment remain unchanged.

### Current-head acceptance synthesis

**QA-16 and QA-18's known product failure causes are remediated.** F-03 and F-07
were the only open product findings in the broad run. Their exact affected paths
pass the independently observed targeted run at the repaired head; the tightly
bounded delta, regression tests and exact-head CI support carrying forward the
unaffected broad evidence. This is an evidence synthesis, not a fabricated full
18-scenario rerun. QA-16 retains its M-03 pre-merge qualification and M-02/M-07
human checks; QA-18 retains M-07. Neither historical FAIL is rewritten.

| Finding | Scenarios    | Current disposition      | Evidence synthesis                                                                                                                                                           |
| ------- | ------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01    | QA-18        | PASSED_AND_PRESERVED     | Broad authority journey passes; current-head smoke preserves forecast/actual/quoted-price/supplier-offer distinctions.                                                       |
| F-02    | QA-05        | PASSED_AND_PRESERVED     | Broad rapid-edit/history cases pass; current-head nondefault four-field draft survives navigation and persists exactly in one confirmed action.                              |
| F-03    | QA-16, QA-18 | REMEDIATED_BY_LATER_PASS | Final programme locator residual passes in both locales at four widths, with four source identities and internal provenance preserved.                                       |
| F-04    | QA-07, QA-08 | PASSED_AND_PRESERVED     | Authorized receipt retains creation wording; four current-head same-Viewer known/missing pairs show identical neutral denial and no action payload.                          |
| F-05    | QA-11, QA-15 | PASSED_AND_PRESERVED     | Broad generic-error matrix preserves draft and visible focus; current-head stale smoke focuses the visible alert inside the dialog. M-06 remains a manual association check. |
| F-06    | QA-11, QA-18 | PASSED_AND_PRESERVED     | Broad changed-source variants and current-head authority smoke show stale warnings, retain inspectable immutable history, and reject confirmation.                           |
| F-07    | QA-16, QA-18 | REMEDIATED_BY_LATER_PASS | All 40 entry combinations select the same authoritative insufficiency claim and ordered sources, preserve 2/3 and invent no actual range or variance.                        |

No unresolved observed P0, P1 or required-path P2 remains in the reviewed scope;
no new product finding or policy/security escalation emerged. Evidence gaps are
tracked separately from reproducible product defects. Targeted coverage includes
8 programme claim variants/32 source drilldowns and 40 lighting entry checks,
with 24 retained matrix source captures plus 3 exploratory captures, not 120
independently recorded source drilldowns. All 203 targeted screenshots were
reviewed by the independent evidence reviewer; diagnostic/summary frames retain
their explicit limitations and supplements.

| Scenario                                             | Historical result | Current-head synthesis                                                                                                                                          |
| ---------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-01 — Authorized preparation is preparatory only   | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-02 — Bounded edits and mandatory content          | PARTIAL           | PARTIAL_MANUAL_REQUIRED: Observed behavior retained; M-05 remains Stage 9 hardening.                                                                            |
| QA-03 — Explicit confirmation and durable receipt    | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-04 — Cancel, Escape and evidence round trip       | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-05 — Locale and route restoration                 | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-06 — Retry, concurrent submit and replay          | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-07 — Viewer and session denial                    | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-08 — Cross-tenant selectors                       | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-09 — Assignee authorization                       | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-10 — Quote, project and run staleness             | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-11 — Evidence authority, access and availability  | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-12 — Permission downgrade                         | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-13 — Expiry and consumed proposal                 | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-14 — Safe failure and rollback                    | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-15 — Keyboard, focus, semantics and zoom          | PARTIAL           | PARTIAL_MANUAL_REQUIRED: Keyboard/focus evidence retained; M-03/M-04 block merge; M-01/M-02/M-06 block demo release.                                            |
| QA-16 — Responsive Taiwan Traditional Chinese layout | FAIL              | KNOWN_PRODUCT_FAILURES_REMEDIATED: F-03/F-07 closed by current-head retest; M-02/M-03/M-07 remain. No unconditional whole-scenario PASS.                        |
| QA-17 — Browser and PostgreSQL performance           | PASS              | PASS_CARRIED_FORWARD_BY_DELTA_REVIEW: Broad-run PASS remains applicable to unchanged behavior; affected presentation paths have targeted current-head evidence. |
| QA-18 — Prior-stage regression and excluded behavior | FAIL              | KNOWN_PRODUCT_FAILURES_REMEDIATED: F-03/F-07 closed by current-head retest and bounded delta; M-07 remains. No new full regression run claimed.                 |

The historical broad result stays 14/2/2/0; QA-02 and QA-15 remain PARTIAL in that
run. No synthesized 16-PASS run count is asserted. Earlier 20261116 evidence and
its counts also remain historical and untouched.

### Deterministic, integrity and cleanup evidence

[Complete deterministic validation](https://github.com/FATTY-BAMBA/StrideBrain/blob/5c3e2763635dab46e8c91255e0394eece008dcb1/foundry/tasks/SB-029/evidence/p2-repair-20261117T045349Z/validation.json) passes: format, lint (one
pre-existing default-export warning), strict TypeScript, Prisma validation and
generation, all eight migrations on clean PostgreSQL, repeated seed and SQL
verification, **500 tests across 61 files with zero skips**, localization
12 tests/4 files, PostgreSQL adversarial 93 tests, production build and production
dependency audit (**0 vulnerabilities**). The named subsets are not additional
tests to add to the full-suite count. Local validation was performed on the
frozen code tree; exact-head CI separately verifies the committed head.

Broad run: 45 temporary mutation/fault cases restored, fixture/immutable guards
verified, all 42 nonfixture sessions revoked. Targeted run: one source-authority
mutation restored exactly, eight fixed-fixture table hashes and immutable history
unchanged, four guards/eight migrations verified, all four QA sessions revoked
and zero active. The intentional single atomic action/receipt/audit/consumption
with 15 evidence references remains audit history; no duplicate. Both evidence
subtrees have retained PASS sanitization records including OCR/metadata checks.
This synthesis does not assert a fresh browser run, packet capture or screenshot
rescan; it verifies the committed artifacts and their recorded scope.

### Unresolved human-verification requirements

All seven remain `NOT_VERIFIED_MANUAL_REQUIRED`. Classification describes the
next mandatory gate, never a pass. [Exact manual steps](https://github.com/FATTY-BAMBA/StrideBrain/blob/e043ee551169c1f8586c9d490703be3a4a1ab187/foundry/tasks/SB-029/evidence/local-qa/20261117T050611Z/manual-verification.json) remain in
immutable evidence and are also carried into `state.json`.

| Item                                                | Classification                 | Rationale                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 — Actual screen-reader announcements           | `BLOCKING_BEFORE_DEMO_RELEASE` | Semantic roles, focus and keyboard operation are evidenced, but DOM/AX observations do not establish spoken announcements. Verify VoiceOver/NVDA before invited demo use; no observed critical keyboard blocker is being deferred.                                                                      |
| M-02 — Physical mobile keyboard/touch/native picker | `BLOCKING_BEFORE_DEMO_RELEASE` | Four desktop-emulated viewport sizes and native desktop keyboard date entry pass. Physical iOS/Android occlusion, touch and picker behavior remain separate device evidence required before demo release.                                                                                               |
| M-03 — Exact 200% browser zoom                      | `BLOCKING_BEFORE_MERGE`        | The accepted QA-15 steps explicitly require 200% browser zoom, with reachable controls and perceivable focus. Narrow viewport emulation is not that observation; the missing required task evidence prevents completion.                                                                                |
| M-04 — Reduced-motion behavior                      | `BLOCKING_BEFORE_MERGE`        | The accepted bilingual/accessibility contract and QA-15 explicitly require reduced-motion behavior and actual browser evidence. CSS support alone does not verify the preference or motion/focus behavior.                                                                                              |
| M-05 — Leap-day / Asia-Taipei midnight boundaries   | `STAGE_9_HARDENING`            | Passing policy tests cover leap-day validity and today..today+365; service tests revalidate the date across Taipei midnight with no write. Existing browser date validation remains valid. End-to-end native-picker/test-clock boundary evidence is still required in Stage 9, before its release gate. |
| M-06 — Generic form-error description association   | `BLOCKING_BEFORE_DEMO_RELEASE` | The actual form source sets aria-describedby to review-error-summary and deterministic DOM tests assert it; browser generic errors focus a visible alert. The broad browser probe returned null, so live form association and speech remain unverified rather than a proven absent association.         |
| M-07 — Independent human Traditional Chinese review | `BLOCKING_BEFORE_DEMO_RELEASE` | Independent automated bilingual evidence remediates the observed terminology/navigation defects. Natural Taiwan Chinese and complete language acceptance still require an independent human before demo release.                                                                                        |

M-03 is explicitly required by `computer-qa-plan.yaml` QA-15 (line 723) and the
viewport matrix. M-04 is explicitly required by that scenario and
`build-contract.md`'s bilingual/a11y acceptance row (line 92), including actual
browser evidence. `docs/build/V0_1_BUILD_AUTHORIZATION.md` line 94 requires the
stage exit gate and applicable acceptance IDs to pass. General Stage 9 hardening
does not waive these task-specific requirements. Source CSS and emulated widths
are useful corroboration, not the missing observations. M-06's null browser probe
is not treated as proof of a missing association: the actual form and DOM tests
establish the implementation, while live-form/speech verification remains open.

### Decision and next gate

Keep `NEEDS_REVISION`, with M-03/M-04 as pre-merge evidence blockers. Complete the
documented bilingual 200% zoom and OS reduced-motion checks on the pinned build,
record actual results and restoration of settings, then obtain independent
reassessment. Do not modify product source unless a new defect is actually found.
If both pass and no new blocker appears, reassess `READY_FOR_HUMAN`; the other
five manual requirements remain at their classified gates, and ordinary human
merge approval remains mandatory. Do not silently waive, mark ready, merge,
deploy or claim Stage 8 completion/release approval.

## Historical review checkpoints — retained unchanged

The following records describe their dated heads and are superseded only for current status by the synthesis above.

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

| File                                                          | SHA-256                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `prisma/migrations/0008_stage8_internal_review/migration.sql` | `bca2e402f42aafc822c921df064d51965a8ea29da80aacabc11ef2c6d16d20d9` |
| `prisma/schema.prisma`                                        | `6f3e634ec5c4de66626c8e0dcb196d633a371f28cfa9f0513d7760de393f846e` |
| `prisma/fixtures/horizon-atelier.sql`                         | `901fed590053152425a85733a97151a1d4f399d198f8f6a449bfe5c72521e1f8` |
| `prisma/fixtures/verify-stage8-internal-review.sql`           | `79febe85bf1911ea452183050fdb71acc017facfe834ca4af99efd2cb09075f0` |

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
export DATABASE_URL=<REDACTED_HISTORICAL_LOCAL_DATABASE_URL>
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

| File                                                                 | SHA-256                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/modules/internal-review/application/freshness.ts`               | `2bd73eb6625df72d4155389a3a57821a20e2d5de93a367c7e23357bc384c8c7d` |
| `src/modules/internal-review/application/internal-review-service.ts` | `31fe3bd4071f4fb07a99f7db0319d11150a8e46248ea02bde1bf9fb45fdf4809` |
| `src/repositories/prisma/prisma-internal-review-repository.ts`       | `b9b949850085cdfdf81e5488df6ca5f0a2327c3e5e1de33c05b63405bc204180` |
| `src/modules/projects/application/get-project-workspace.ts`          | `baccaf20240746b76c718349bc4d92e606461f24f7a0a6200ba4f729df6377ad` |

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

| File                                                                 | SHA-256                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/modules/internal-review/application/internal-review-service.ts` | `ba3f8a815dae3c0a3757e9d8c059befee41cf411c089c1429b081d38c7d46cf6` |
| `src/app/api/actions/internal-review/route.ts`                       | `04f7df6ee55a1961eb6328a6a146f93134985bb9cebbd01190388f4a1bc8649c` |
| `src/lib/server/internal-review-trace.ts`                            | `170ef38524fb43c13cf0f5b38f057c7cf3cc53890f8a2d1928861c9afa909297` |
| `src/components/internal-review/internal-review-sheet.tsx`           | `b4d153e86794adef10a0a4a859f700cc88205db93dd7442f09d982d006d45665` |
| `src/app/[locale]/projects/[projectKey]/compare/page.tsx`            | `ca980885562356d58f6e67f40fd7965b8f996a62725d889f47a1f4904e2bc42e` |

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

## Dedicated Cloud QA portability package review — PASS (package only)

Reviewed on 2026-11-16T00:17:04Z against checked-out evidence checkpoint
`2a23d31f46e0b6c7b465b3774ad765c81a3417eb`, before the portability-artifact
commit. This verdict covers only the manual launch prompt, operator setup
instructions, sanitized helper templates and corresponding handoff/plan changes.
It is **not** the final Stage 8 implementation verdict or a browser-QA pass.

The package contains no copied environment, session ledger, cookie, bootstrap
URL, private signing secret or database password. The reviewer inspected only
repository package files; no private files from `/tmp/sb029-preview` were read.
Initialization generates fresh random database/session credentials, writes
private files with mode 0600 in a mode-0700 directory, refuses existing runtime
state and occupied ports, and requires executable helpers to match committed
HEAD. Generated wrappers clear inherited managed environment values before
loading the private file, preventing an existing host `DATABASE_URL` from
redirecting migrations or business writes.

The documented database is a newly created PostgreSQL 17 container with a
loopback-only port and no reused data mount. An existing named container is a
stop condition; the instructions contain no deletion or reuse of existing
containers/databases. All eight migrations, repeated synthetic fixture/SQL
checks, full deterministic commands and production build are required anew.
The source verifier pins the tested application manifest and requires the prior
evidence checkpoint as an ancestor, allowing only task-artifact changes after
it. Actual portability HEAD and the **new** BUILD_ID must be recorded; historical
source equivalence does not impersonate a new build or browser run.

The operator calls the existing `DemoSessionService` for fixed synthetic
memberships and sends its unchanged secure cookie through a short-lived,
single-use loopback HTTP bootstrap. No browser-selected identity, new product
login surface, cookie injection or weakened permission/origin rule is introduced.
The prompt permits locators exposed by the documented Cloud browser tool while
prohibiting standalone CDP/Playwright or browser-state injection as a bypass.
Unsupported authentication/control returns BLOCKED.

The revised handoff correctly distinguishes the historical environment from the
newly authorized fresh Cloud task. It states that this package has created no
task and executed no new browser QA. The historical `computer-qa-report.json`
is unchanged and remains BLOCKED with zero complete scenario passes. New QA
results must preserve it and live in a new evidence subtree. A separate
`qa/sb-029-cloud-<UTC-run-id>` branch may contain only that subtree after path and
credential review; the exact evidence commit must be returned. A sanitized,
accessible artifact archive is the fallback. Local paths alone are explicitly
insufficient across Cloud-task filesystems. No merge or self-approval is allowed.

Independent checks executed successfully: read-only `prepare-runtime.py --check`,
Python AST parse, `node --check` for all three JavaScript helpers, ESLint for
those helpers, `git diff --check`, unchanged historical-report diff, and unchanged
application source/schema/test/config diff against `4c13f726`. The verifier
returned eight migrations and source manifest
`7fe5157f84f9c88023462ec1e958b62a53bcdb5aef30eb0dc4ac95dfdac85920`.
No initializer, container, build, issuer/session operation, browser or new task
was started as part of this review. The launch instructions still require actual
new-environment validation; static package review cannot establish runtime success.

Reviewed package SHA-256 values:

| File                            | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `cloud-qa-task.md`              | `4bc11d036c1cda9d74adbd8cc85e3f82d3c40e7cdec2ae3f140501c0695718a5` |
| `cloud-qa/README.md`            | `2e6f1387bf6a5fcc65c4190314918ef4dc7f2b5ea72624b74e0c91a2461d0ad1` |
| `cloud-qa/prepare-runtime.py`   | `d1b186fbd3a036e798eda4ae374e9bb1fc87cc6f4ccea87720558d23bf40d321` |
| `cloud-qa/operator.mjs`         | `af1e9835920d4238518f67ee4a5bd5f143ed19d8f5e677810d5541be470b70ae` |
| `cloud-qa/source-loader.mjs`    | `2df76c32cf628cc487c54f498e3c3e240ad5415a3b700727a6b878bd30141d35` |
| `cloud-qa/with-preview-env.mjs` | `f1c075da603842880f2d3bffc423b99fd3beea351319789be4a0d953086a7217` |

No blocking package finding remains. Final Stage 8 verdict, complete Computer QA
and human merge/release approval remain pending.

Post-push documentation correction: container existence inspection now prints
only `.Id`; any ownership inspection is restricted to name/task-label fields,
never full `Env`, avoiding accidental credential disclosure if a container exists.
The README hash above reflects this reviewed correction; no runtime command was executed.

## Local-QA repair review — 2026-11-16

The completed independent local run `20261116T041837Z` established F-01 / QA-18,
F-02 / QA-05 and F-03 / QA-16 + QA-18. Its sanitized evidence-only commit
`0c9b4293a9e91aa6121b8571e7f22537b131760d` directly follows tested portability
head `13e7191f340e998c93b644949602f1c0774fe9ff`. Import review verified all 176
changed paths are within the approved run subtree and all 175 manifest hashes
match. The original branch, files and scoped counts (9 PASS, 3 FAIL, 5 PARTIAL,
1 BLOCKED) remain immutable. Historical infrastructure-only conclusions above
are superseded for the current task.

Two Builder agents implemented the bounded presentation/navigation fixes. A
separate Test/Evaluation Agent reviewed their frozen diff and independently
executed **69 tests in 15 files**, all passing. It also ran strict TypeScript,
scoped lint and formatting. Sanitized execution log:
`evidence/revision-20261116/independent-targeted.log`.

- F-01: table cells carry explicit observation types and localized basis labels,
  including accessible names. Real stored forecast and actual observations map
  correctly through comparison, evidence, proposal, receipt and workspace. The
  four accepted financial bases retain their original policy definitions.
- F-02: verified proposal navigation precedes editable controls. Draft changes
  and confirmation read the latest canonical route; synchronous guards prevent
  duplicate requests. Six React DOM regressions exercise delayed navigation,
  immediate consecutive edits/submission, dialog and shell locale controls,
  evidence return, refresh and history. Route state remains a bounded request
  selector; server authorization and validation remain authoritative.
- F-03: explicit bilingual presentation maps cover source fields, financial
  authority, operations, units, rounding and factor explanations. The independent
  PostgreSQL test creates/drops its own database and checks over 100 rendered
  claim/factor/source panels in both locales. Independent static review identified an overbroad uppercase
  title replacement; Builder corrected it and added exact business-identifier,
  LED and HVAC preservation tests. Unknown plumbing is not displayed as ordinary
  product copy; source titles, version/locator and opaque source links remain.

Independent code-review verdict: **PASS; no unresolved blocking code finding**.
Financial domain policy, authorization, repositories, schema and migrations are
unchanged. The final gate subsequently found one formatting-only issue in a new
mock declaration; it was corrected before the final application candidate
`df63c90ca994653299082fc5078ad0b5ef595292` was frozen. No behavioral edit followed
the independent review. The failed formatting log is retained separately.

This is repair-code verification, not final Stage 8 acceptance. Real Next.js
navigation timing, narrow-screen close-control reachability, keyboard/native date
interaction, screen-reader announcements, 200% zoom and reduced motion still
require a new independent local browser run. Unsupported capabilities must stay
explicitly manual/blocked. The five PARTIAL cases also require completion.
See `local-qa-retest-handoff.md`; keep PR #31 draft and do not merge.

The final local deterministic gate passed **455 tests / 59 files, zero skips**,
including 88 PostgreSQL adversarial cases and the independent stored-data suite;
localization passed 12 tests / 4 files. Clean eight-migration setup and repeated
seed/SQL checks, formatting, lint, strict types, production build and production
audit also passed (zero vulnerabilities; one existing Prisma-config lint warning).
See `validation-revision.json`. The new preview is HTTP-ready with zero proposals, actions, receipts and audits,
and no active sessions after test-session revocation. Original database counts remain unchanged. Exact
publication-head CI is verified separately in the final PR description.
