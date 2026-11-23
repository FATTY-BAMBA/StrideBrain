# SB-058 verification

PR: https://github.com/FATTY-BAMBA/StrideBrain/pull/59 (draft). Hosted acceptance is waiting for the Product Director. No hosted deployment, migration, seed or settings changes; no migration files changed.

The separately approved fourth evaluation **passed its acceptance gates** on 36a186b. It was not a perfect 150/150 result: the remaining core-case misses are recorded below.

## What changed

- Authorized facts cross the model boundary under localized screen labels. Quote, past-price and closed-job raw duplicates and machine markers stay server-side. Rates use the Quote tab's whole-dollar formatting and recorded area unit.
- AMOUNT_LABEL rejects a supported quote amount under the wrong same-clause label. The bilingual label lists include the screen labels and explicit equivalents. DISPLAY_FORMAT rejects invented internal field names or extra decimal places. Both checks apply to displayed evaluation output and follow-ups; neither rewrites money.
- One authorized project list read returns both names for subject resolution. List filters use Home's five stage groups and retain complete/truncated coverage. Named-job denials end immediately. A repeated call is not executed again and the next model request only offers submit_answer; the fifth model request also only offers submit_answer, retaining the six-tool safety cap.
- An empty awaiting-client list returns the server's count-zero sentence and citation immediately, with a final access recheck. It cannot acquire an unrelated page-project qualification from the model.
- The past-price tool describes count, median, low and high for one job, with a canonical category enum and bilingual labels. No evaluation question wording was added to the model instruction; its only change describes labelled display facts. Gemini 3.5 Flash-Lite is unchanged.
- All 48 existing evaluation cases remain, with two new millwork count/range cases. Reports retain non-pass tool names/arguments, per-question call counts and pass rates. Global gates include no displayed wrong number, mislabel or display clutter. The workflow default ref is main.

## Paid evaluation dispatches

The issue authorized three workflow dispatches. After those were used, the Product Director explicitly approved one additional three-round evaluation of 36a186b in chat: “Run one additional evaluation.” The total authorized allowance is four dispatches. Estimates below use the configured token rates, not a billing invoice.

| Run | Evaluated commit | Result | Estimated USD |
| --- | --- | --- | --- |
| [45113615576](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45113615576) | Short ref 2d0ba6c | Checkout failed: actions/checkout treated the short SHA as a ref. Evaluation step skipped; no model calls. | 0 |
| [45113826197](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45113826197) | 2d0ba6ca5297241cbef46c2d1b5df9979d9462ea | Failed required regressions/call target; core scores en 20/18/19, zh-TW 20/19/20. Zero displayed wrong numbers/mislabels. | 0.185596900 |
| [45115077636](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45115077636) | b7dab600e2fe56b21a9558fcd3a7b5ace33ee23d | Failed: two AMOUNT_LABEL false-positive discards in round 2; both fixed after the run. | 0.180945900 |
| [45117528592](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45117528592) | 36a186b3b4504a50abe90404c231ef9e0e61c2b1 | Passed all three rounds and all required regressions; see remaining core-case misses below. | 0.181592000 |

The second dispatch's original report is [provider-45113826197.json](evidence/provider-45113826197.json). Median calls 2 each round; maximum 4; 48/50, 49/50 and 48/50 at three or fewer. A named-job refusal took 3, so the run failed its call gate. Required empty-awaiting answers incorrectly qualified the firm-wide result with the page default; English millwork repeated list_jobs and refused. The third dispatch remains failed as originally reported. It met every score and call target but rejected two correct required answers in round 2. Those exact drafts are now preserved in tests/assistant/quality-rejected-answer-fixtures.json; the label dictionary distinguishes “including tax of” (the tax component) from “including tax” (the total), and accepts “totals” as a total label. Negative tests still reject each phrase with the wrong quote amount. The exact paid drafts now pass unchanged against freshly prepared authorized database sources and the evaluator in the replay test. The separately approved fourth dispatch evaluated those final corrections on 36a186b3b4504a50abe90404c231ef9e0e61c2b1 and passed.

### Approved fourth dispatch — passed

[Original report](evidence/provider-45117528592.json), [workflow run](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45117528592). Same Gemini 3.5 Flash-Lite provider/model and unchanged evaluation cases/gates. No implementation, prompt or test changes were made for this additional run.

| Round | en core | zh-TW core | Required cases | Median / max calls | At most 3 calls | Named-job refusal max |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 20/20 | 19/20 | 10/10 | 2 / 3 | 50/50 | 1 |
| 2 | 19/20 | 19/20 | 10/10 | 2 / 3 | 50/50 | 1 |
| 3 | 20/20 | 19/20 | 10/10 | 2 / 4 | 49/50 | 1 |

No displayed unsupported number, mislabelled quote amount or display-format violation occurred. All eight retained hosted-regression cases and both new count/range cases passed each round. Both prior AMOUNT_LABEL rejections passed all three rounds. All call targets were met: 149/150 answers at three calls or fewer, no answer above four, and every named-job refusal at one call. The one four-call answer was en-manager-scope in round 3.

Per-question rates are retained in the report: 48 questions passed 3/3, en-status passed 2/3, and zh-TW-finding passed 0/3 (146/150 overall). In en-status round 2 the answer gave the correct issued/unaccepted status but omitted the document number required by that case's existing oracle. All three zh-TW finding drafts were discarded by FINDING_SENTENCE because their combined prose did not satisfy the exact saved-sentence check. The failed-case tool arguments, raw drafts and reason codes remain in the artifact. These misses were not hidden by changing the cases or thresholds.

Estimated cost of this additional run: **US$0.181592000**. Total estimated cost across all four dispatches: **US$0.548134800**. Actual billed charges are not verified.

### Third dispatch detail (before the final label corrections)

Original report: [provider-45115077636.json](evidence/provider-45115077636.json). All three rounds scored en 20/20 and zh-TW 20/20. Median calls 2, maximum 3; all 50 questions in every round used three or fewer. Named-job refusal maxima were 1, 2 and 1. The two count/range cases passed every round. No displayed wrong number, mislabelled amount or display-format violation was recorded. Required hosted regressions passed 8/8, 6/8 and 8/8: en-home-named-status and en-home-reference-total each passed 2/3; the other 48 questions passed 3/3. Per-question pass rates and call counts are in the artifact. Total estimated spend across all three dispatches: **US$0.366542800**.

### Count/range diagnosis

The earlier Chinese stone refusal did not reproduce after the labelled display-facts change: it passed all three diagnostic rounds. The prior #39 artifact did not record tool arguments, so its exact invalid argument cannot be established retrospectively. The new report captured the same class of tool-contract defect in English stone-range, round 2: get_past_prices received categoryId="Imported stone and hard finishes", a display label, and returned unavailable. The old schema described an arbitrary string while the server required a canonical key. The tool now advertises the permitted keys with both language labels; unknown keys still fail closed. Regression tests preserve the recorded invalid argument and the actual quoted-history rates.

## Local verification

[CI passed on tested code commit 36a186b](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45116190825). Only task documentation and the downloaded evaluation artifact changed after that code commit. Final npm run check passed: 1,348 tests in 126 files plus format, lint, typecheck and production build. Existing prisma.config.ts anonymous-default-export warning only. Checks use Node 24 and disposable loopback PostgreSQL with synthetic fixtures; no live model key is passed to CI/local tests.

The deterministic evaluation runs all 50 cases over fresh authorized database fixtures in three rounds. This verifies the harness and data paths, not model quality. See [fake-evaluation.json](evidence/fake-evaluation.json) and [check.log](evidence/check.log).

Local production Chrome exercised real session handoff, server actions, authorized repositories, fact projection, response validation, links and usage writes. A test-only Google HTTP transport supplied deterministic wording outside product routes. [browser.json](evidence/browser.json) records both-language quote labels, millwork count 3 / median NT$5,833/m² / range NT$5,424/m²–NT$5,902/m², shared work-stage filters, Viewer denial, and unchanged ComparisonRun/EconomicsEnrichmentRun counts. The final browser run used the b7dab60 production build; the subsequent label-only correction does not change these displayed sentences. The local server, database, invitation and TLS private files were removed after verification. Screenshots were visually inspected:

| Flow | English | zh-TW |
| --- | --- | --- |
| Quote labels | [Screenshot](evidence/quote-en.png) | [Screenshot](evidence/quote-zh-TW.png) |
| Past-price count, median and range | [Screenshot](evidence/past-prices-en.png) | [Screenshot](evidence/past-prices-zh-TW.png) |
| Work-stage list | [Screenshot](evidence/work-list-en.png) | [Screenshot](evidence/work-list-zh-TW.png) |
| Empty waiting list (one model call) | [Screenshot](evidence/empty-awaiting-en.png) | [Screenshot](evidence/empty-awaiting-zh-TW.png) |
| Viewer refusal | Unit/DB denial coverage | [Screenshot](evidence/viewer-refusal-zh-TW.png) |

## Not verified

Hosted acceptance, including the Product Director's five repeated quote-total questions and the #39 hosted checklist, is waiting for the Product Director. The local browser transport is not evidence of live Gemini quality. Billing charges are not verified; report costs are token-based estimates. No claim of production readiness or hosted acceptance is made by this draft PR.
