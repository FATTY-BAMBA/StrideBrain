# SB-060 verification

PR: https://github.com/FATTY-BAMBA/StrideBrain/pull/61 (draft). Hosted acceptance is waiting for the Product Director. Keep the PR draft. No migration, hosted deployment, hosted database/settings change, model change or instruction-text change.

## What changed

- The amount check recognizes a clause with its first label after its first amount and reads following labels throughout that clause. Other clauses retain the existing reading. Amounts are never rewritten.
- An exact sent category carries across the clauses of its list item or semicolon/full-stop segment, including natural Chinese attachment to the label. Category/kind/percentage must resolve to exactly one cited saved finding. The whole segment is expanded into complete saved sentences, which supply the direction and wording. Context resets at item/segment boundaries.
- Unaccepted quote facts are projected as Acceptance: not accepted yet / 接受狀態：尚未接受. Accepted quotes retain Accepted on and the recorded date. Canonical tool values and the oracle stay unchanged.

## Verified locally

npm run check passed: **1,395 tests in 127 files**, format, lint, strict typecheck and production build, on Node 24 with disposable loopback PostgreSQL and synthetic fixtures. Existing prisma.config.ts lint warning only. [Check log](evidence/check.log).

Regression coverage includes the exact two discarded drafts from [run 45128767042](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45128767042) and all three zh-TW finding drafts from [run 45117528592](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45117528592). They pass against newly prepared authorized database records. Every expanded percentage sentence is checked verbatim against the cited saved sentences.

All security examples in issue #60 are rejected: wrong before-tax/tax/total labels in either position, lighting forecast cost 9.4%, and demolition quoted price 9.4%. Missing labels, unknown percentages, ambiguous matches and category leakage across item/segment boundaries also reject. A model's wrong direction cannot survive because only the saved sentence is displayed. Bilingual projection tests distinguish acceptance state from an accepted date. Existing tenant/role denials and other grounding regressions pass.

All 50 deterministic evaluation cases pass in each of three rounds. [Deterministic report](evidence/fake-evaluation.json). This verifies the harness and data paths, not live model quality.

## Local browser verification

Local production Chrome exercised the real owner sign-in, quote issue/acceptance, comparison preparation, Home form, server actions, authorized tool reads, grounding and displayed answers. A test-only Google HTTP transport supplied deterministic wording outside product routes; this is not live-model quality evidence.

Five successive English PRJ-ACTIVE-001 total questions and one zh-TW total retained their correct amount-after labels without fallback. Unaccepted quotes showed Acceptance / 接受狀態; the accepted PRJ-ACTIVE-002 quote retained its acceptance date. Merged Xinyi and Riverside findings displayed every cited percentage sentence verbatim. All nine chat turns used two model calls; comparison/economics counts stayed unchanged during chat. No browser or server errors. The disposable local server, database, sessions, invitation and TLS files were removed. [Browser report](evidence/browser.json).

Visually inspected screenshots:

| Flow | Evidence |
| --- | --- |
| English amount-after labels (fifth repeat) | [Screenshot](evidence/amount-after-en.png) |
| zh-TW amount-after labels and acceptance state | [Screenshot](evidence/amount-after-zh-TW.png) |
| Accepted quote retains date label | [Screenshot](evidence/accepted-date-en.png) |
| Xinyi merged findings expanded | [Screenshot](evidence/merged-findings-xinyi-zh-TW.png) |
| Riverside merged findings expanded | [Screenshot](evidence/merged-findings-riverside-zh-TW.png) |

## Paid evaluation

Issue #60 authorizes at most three AI evaluation workflow dispatches. **One was used and passed**; no further run was needed. [Run 45133957602](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45133957602) evaluated code commit **0d7acc95c7627025ac024b6a8c8aeaa994722e8a**, using the existing workflow on main and its full-SHA ref input. The provider/model remains Gemini 3.5 Flash-Lite. Model instruction text, questions, oracle facts and score/required-case/call gates are unchanged.

[Original paid report](evidence/provider-45133957602.json) · [Summary with exact cost total](evidence/provider-summary.json)

| Round | en core | zh-TW core | Required cases | Median / maximum calls | At most 3 calls | Named-job refusal max |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 20/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |
| 2 | 20/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |
| 3 | 20/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |

**150/150 passed. Every question passed 3/3**, including zh-TW-finding (2, 2 and 3 calls), exceeding its additional 2/3 acceptance requirement. No displayed wrong number, mislabelled amount or display-format violation. No displayed answer contains “Accepted on: Not accepted yet”. Per-question pass rates, call counts and displayed answers are retained in the original artifact. The estimate for this single dispatch, and total for issue #60, is **US$0.181250200**, summed exactly from the report's token-based estimates; billed charges are not verified.

[CI passed on the evaluated code commit](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45133951190), including migrations/fixture invariants, repeatable synthetic reset, code checks, tests, production build and dependency audit. Only task documentation and evidence changed after the evaluated code commit.

## Not verified

Hosted acceptance is waiting for the Product Director. The Product Director alone runs the Test site workflow and the hosted checks: five English PRJ-ACTIVE-001 totals without fallback, exact saved Riverside finding sentences, and acceptance wording without a state under a date label. Billed costs are not verified; reported evaluation costs are token-based estimates.
