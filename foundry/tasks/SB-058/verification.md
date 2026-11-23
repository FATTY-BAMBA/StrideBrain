# SB-058 verification

PR: https://github.com/FATTY-BAMBA/StrideBrain/pull/59 (draft). Hosted acceptance is waiting for the Product Director. No hosted deployment, migration, seed or settings changes; no migration files changed.

## What changed

- Authorized facts cross the model boundary under localized screen labels. Quote, past-price and closed-job raw duplicates and machine markers stay server-side. Rates use the Quote tab's whole-dollar formatting and recorded area unit.
- AMOUNT_LABEL rejects a supported quote amount under the wrong same-clause label. The bilingual label lists include the screen labels and explicit equivalents. DISPLAY_FORMAT rejects invented internal field names or extra decimal places. Both checks apply to displayed evaluation output and follow-ups; neither rewrites money.
- One authorized project list read returns both names for subject resolution. List filters use Home's five stage groups and retain complete/truncated coverage. Named-job denials end immediately. A repeated call is not executed again and the next model request only offers submit_answer; the fifth model request also only offers submit_answer, retaining the six-tool safety cap.
- An empty awaiting-client list returns the server's count-zero sentence and citation immediately, with a final access recheck. It cannot acquire an unrelated page-project qualification from the model.
- The past-price tool describes count, median, low and high for one job, with a canonical category enum and bilingual labels. No evaluation question wording was added to the model instruction; its only change describes labelled display facts. Gemini 3.5 Flash-Lite is unchanged.
- All 48 existing evaluation cases remain, with two new millwork count/range cases. Reports retain non-pass tool names/arguments, per-question call counts and pass rates. Global gates include no displayed wrong number, mislabel or display clutter. The workflow default ref is main.

## Paid evaluation dispatches

At most three workflow dispatches are authorized for this issue. Estimates below use the configured token rates, not a billing invoice.

| Run | Evaluated commit | Result | Estimated USD |
| --- | --- | --- | --- |
| [45113615576](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45113615576) | Short ref 2d0ba6c | Checkout failed: actions/checkout treated the short SHA as a ref. Evaluation step skipped; no model calls. | 0 |
| [45113826197](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45113826197) | 2d0ba6ca5297241cbef46c2d1b5df9979d9462ea | Failed required regressions/call target; core scores en 20/18/19, zh-TW 20/19/20. Zero displayed wrong numbers/mislabels. | 0.185596900 |

The second dispatch's original report is [provider-45113826197.json](evidence/provider-45113826197.json). Median calls 2 each round; maximum 4; 48/50, 49/50 and 48/50 at three or fewer. A named-job refusal took 3, so the run failed its call gate. Required empty-awaiting answers incorrectly qualified the firm-wide result with the page default; English millwork repeated list_jobs and refused. The final dispatch is pending.

### Count/range diagnosis

The earlier Chinese stone refusal did not reproduce after the labelled display-facts change: it passed all three diagnostic rounds. The prior #39 artifact did not record tool arguments, so its exact invalid argument cannot be established retrospectively. The new report captured the same class of tool-contract defect in English stone-range, round 2: get_past_prices received categoryId="Imported stone and hard finishes", a display label, and returned unavailable. The old schema described an arbitrary string while the server required a canonical key. The tool now advertises the permitted keys with both language labels; unknown keys still fail closed. Regression tests preserve the recorded invalid argument and the actual quoted-history rates.

## Local verification

Final npm run check passed: 1,342 tests in 126 files plus format, lint, typecheck and production build. Existing prisma.config.ts anonymous-default-export warning only. Checks use Node 24 and disposable loopback PostgreSQL with synthetic fixtures; no live model key is passed to CI/local tests.

The deterministic evaluation runs all 50 cases over fresh authorized database fixtures in three rounds. This verifies the harness and data paths, not model quality. See [fake-evaluation.json](evidence/fake-evaluation.json) and [check.log](evidence/check.log).

Local production Chrome exercised real session handoff, server actions, authorized repositories, fact projection, response validation, links and usage writes. A test-only Google HTTP transport supplied deterministic wording outside product routes. [browser.json](evidence/browser.json) records both-language quote labels, millwork count 3 / median NT$5,833/m² / range NT$5,424/m²–NT$5,902/m², shared work-stage filters, Viewer denial, and unchanged ComparisonRun/EconomicsEnrichmentRun counts. Screenshots were visually inspected:

| Flow | English | zh-TW |
| --- | --- | --- |
| Quote labels | [Screenshot](evidence/quote-en.png) | [Screenshot](evidence/quote-zh-TW.png) |
| Past-price count, median and range | [Screenshot](evidence/past-prices-en.png) | [Screenshot](evidence/past-prices-zh-TW.png) |
| Work-stage list | [Screenshot](evidence/work-list-en.png) | [Screenshot](evidence/work-list-zh-TW.png) |
| Viewer refusal | Unit/DB denial coverage | [Screenshot](evidence/viewer-refusal-zh-TW.png) |

## Not verified

Hosted acceptance, including the Product Director's five repeated quote-total questions and the #39 hosted checklist, is waiting for the Product Director. The local browser transport is not evidence of live Gemini quality. Billing charges are not verified; report costs are token-based estimates. No claim of production readiness or hosted acceptance is made by this draft PR.
