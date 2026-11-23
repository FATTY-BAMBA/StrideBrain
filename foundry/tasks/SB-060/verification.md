# SB-060 verification

PR: https://github.com/FATTY-BAMBA/StrideBrain/pull/61 (draft). Hosted acceptance is waiting for the Product Director. Keep the PR draft. No migration, hosted deployment, hosted database/settings change, model change or instruction-text change.

## What changed

- The amount check assigns labels per amount. It prefers the last untaken preceding label; otherwise a following label must be at least as close to this amount as to the next number and cannot be reused. A wrong preceding label cannot be hidden by a correct following label. Amounts are never rewritten.
- An exact sent category carries across every sentence of its numbered or bullet list item. Outside lists, semicolons and sentence ends reset context. Category/kind/percentage must resolve to exactly one cited saved finding. The whole item/segment is expanded into complete saved sentences, which supply the direction and wording.
- Unaccepted quote facts are projected as Acceptance: not accepted yet / 接受狀態：尚未接受. Accepted quotes retain Accepted on and the recorded date. Canonical tool values and the oracle stay unchanged.

## Review of f86d771

The four newly reported before-amount mislabels now reject with AMOUNT_LABEL, as does the label nearer to the next number. The correct mixed-label sentence changes from rejected to accepted, as requested. All seven prior accepted fixtures, the original paid draft and the unparenthesized total/tax/before-tax sentence remain accepted. All other security cases retain their expectations.

Both two-sentence lighting list items (English and zh-TW) now expand to their exact saved quoted-price sentence; bullet variants do too. The nine existing category-scope rejection cases are unchanged. The local check and second authorized paid run below cover these corrections on c7559db. [CI passed on the revised code commit](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45167363540), including fixture invariants, repeatable reset, all checks/tests, production build and dependency audit. Only task documentation and evaluation evidence changed after that tested commit.

**Known limit, unchanged:** Chinese category recognition requires a word boundary and permits attachment before 的, 預估成本, 報價, 過往 or 因 (or punctuation/end). 「照明與電氣方面，報價高 9.4%」 and 「在照明與電氣，…」 are still discarded. This review does not broaden category recognition.

## Review local verification

npm run check passed: **1,405 tests in 127 files**, format, lint, strict typecheck and production build, on Node 24 with disposable loopback PostgreSQL and synthetic fixtures. Existing prisma.config.ts lint warning only. [Review check log](evidence/check-review.log).

All 50 deterministic evaluation cases pass in each of three rounds. [Review deterministic report](evidence/fake-evaluation-review.json). The exact previously discarded paid drafts and all prior security regressions still pass their tests. No existing test expectation changed except the one correct mixed-label sentence identified by the reviewer.

The browser was not rerun for these domain-only corrections; the earlier browser evidence below is from 0d7acc9.

## Earlier local verification (0d7acc9)

npm run check passed: **1,395 tests in 127 files**, format, lint, strict typecheck and production build, on Node 24 with disposable loopback PostgreSQL and synthetic fixtures. Existing prisma.config.ts lint warning only. [Check log](evidence/check.log).

Regression coverage includes the exact two discarded drafts from [run 45128767042](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45128767042) and all three zh-TW finding drafts from [run 45117528592](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45117528592). They pass against newly prepared authorized database records. Every expanded percentage sentence is checked verbatim against the cited saved sentences.

All security examples in issue #60 are rejected: wrong before-tax/tax/total labels in either position, lighting forecast cost 9.4%, and demolition quoted price 9.4%. Missing labels, unknown percentages, ambiguous matches and category leakage across item/segment boundaries also reject. A model's wrong direction cannot survive because only the saved sentence is displayed. Bilingual projection tests distinguish acceptance state from an accepted date. Existing tenant/role denials and other grounding regressions pass.

All 50 deterministic evaluation cases pass in each of three rounds. [Deterministic report](evidence/fake-evaluation.json). This verifies the harness and data paths, not live model quality.

## Earlier local browser verification (0d7acc9)

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

## First paid evaluation (before review)

Issue #60 authorizes at most three AI evaluation workflow dispatches. **The first was used and passed before the f86d771 review**. The Product Director has now requested the second dispatch for the reviewed corrections. [Run 45133957602](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45133957602) evaluated code commit **0d7acc95c7627025ac024b6a8c8aeaa994722e8a**, using the existing workflow on main and its full-SHA ref input. The provider/model remains Gemini 3.5 Flash-Lite. Model instruction text, questions, oracle facts and score/required-case/call gates are unchanged.

[Original paid report](evidence/provider-45133957602.json) · [Summary with exact cost total](evidence/provider-summary.json)

| Round | en core | zh-TW core | Required cases | Median / maximum calls | At most 3 calls | Named-job refusal max |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 20/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |
| 2 | 20/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |
| 3 | 20/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |

**150/150 passed. Every question passed 3/3**, including zh-TW-finding (2, 2 and 3 calls), exceeding its additional 2/3 acceptance requirement. No displayed wrong number, mislabelled amount or display-format violation. No displayed answer contains “Accepted on: Not accepted yet”. Per-question pass rates, call counts and displayed answers are retained in the original artifact. The estimate for this first dispatch is **US$0.181250200**, summed exactly from the report's token-based estimates; billed charges are not verified.

[CI passed on the evaluated code commit](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45133951190), including migrations/fixture invariants, repeatable synthetic reset, code checks, tests, production build and dependency audit. Only task documentation and evidence changed between the evaluated code commit and f86d771; the subsequent review corrections are verified separately above.

## Second paid evaluation (review corrections)

[Run 45167383387](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45167383387) passed on **c7559dbfaf0ce8a3cde766ef157ac07bc85485ee**. This is the **second of at most three** authorized dispatches. No third dispatch was made. The existing main workflow, model, instruction text, questions and pass gates are unchanged.

[Original second paid report](evidence/provider-45167383387.json) · [Second summary with exact cost total](evidence/provider-summary-review.json)

| Round | en core | zh-TW core | Required cases | Median / maximum calls | At most 3 calls | Named-job refusal max |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 19/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |
| 2 | 20/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |
| 3 | 20/20 | 20/20 | 10/10 | 2 / 3 | 50/50 | 1 |

**149/150 passed.** Every question passed 3/3 except en-awaiting, which passed 2/3. zh-TW-finding passed **3/3** (3, 3 and 2 calls), meeting the issue's additional 2/3 acceptance line. All required cases passed every round. No answers were discarded. The checks flagged no displayed unsupported number, amount mislabel or bad display format, and no answer contains “Accepted on: Not accepted yet”. The unchanged numeric and amount-label checks do not prove every label on every identity is correct: the remaining error below is retained explicitly.

**Observed remaining error:** round 1 en-awaiting called PRJ-ACTIVE-001 a document number; that is the job reference, while its quote document number is PRJ-ACTIVE-001-Q1. It was displayed and scored wrong. Rounds 2 and 3 used the correct document number. The raw answer, unsupported tokens (empty) and follow-ups are retained in the original report. No prompt, guard or evaluation change was made for this separate error.

The second dispatch's estimated cost is **US$0.182391000**. Total estimated paid cost for issue #60 across the two runs is **US$0.363641200**, summed with exact decimal arithmetic. Actual billed charges are not verified.

## Not verified

Hosted acceptance is waiting for the Product Director. The Product Director alone runs the Test site workflow and the hosted checks: five English PRJ-ACTIVE-001 totals without fallback, exact saved Riverside finding sentences, and acceptance wording without a state under a date label. Billed costs are not verified; reported evaluation costs are token-based estimates. The local browser was not rerun after the f86d771 review; earlier screenshots are explicitly tied to 0d7acc9. The Chinese category-recognition limit and observed document-number error above remain.
