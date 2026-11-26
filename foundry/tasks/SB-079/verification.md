# SB-079 verification

Re-read issue #79 updated 26 November 2026 at 04:22:52 Asia/Taipei and the two latest reviewer comments on PR #80. GitHub metadata confirms both are by repository owner FATTY-BAMBA (101108617).

## Confirmed boundary and proposed phrase copy

The Product Director confirmed [7173466672](https://github.com/FATTY-BAMBA/StrideBrain/pull/80#issuecomment-7173466672) in [7173585372](https://github.com/FATTY-BAMBA/StrideBrain/pull/80#issuecomment-7173585372). No provisional decision remains. `say` selects a phrase id, never free text. The server prints each source heading and each fact below its own heading. Limits: 12 facts and one list; ten rows plus the computed remaining count.

Proposed catalog (one non-factual phrase; copy remains changeable by the Product Director):

| ID | English | zh-TW |
| --- | --- | --- |
| RECORDS_SHOW | Here is what the records show: | 紀錄顯示： |

## Implemented in delivery order A–E

- A: turn-local Map registry, strict phrase/reference schema, server-owned labels and per-source layout, derived citations, exact saved findings, list and fact caps. Past-job names and scores remain one indivisible fact. Latest-issued facts have an explicit label distinct from the current version. Unknown references, extra wording, prototype/path strings and model values are rejected. The stored StructuredAnswer stays unchanged. Obsolete prose-number/label/authority and finding-expansion checks are removed; their recorded fixtures now prove model prose cannot cross this boundary. Subject, redaction, authorization recheck, daily/tool caps and no-retry rules remain.
- B: page/tool parity tests below, and a stage example for a reader without quote:read, in both languages.
- C: get_item_prices uses ReadPriceList, bounded parameterized description/unit filters and at most five items. It returns the same newest price, date and quote count, plus a differing price for this job's client. It sends no client identity or contact fields. All contributing quote jobs remain server-side authorization/exclusion dependencies, including records used only by the aggregate count.
- D: one new forward migration adds nullable HTTP status/failure code. No existing migration changed. Only codes/status and counts are logged; provider response bodies, questions, chosen facts and secrets are excluded. Settings groups failures over the last seven days with bilingual explanations, or shows none.
- E: fake and paid runners select facts by references. Eight new required cases cover awaiting document number, item price, Viewer stage and other-organization refusal in both languages. The existing 40 core questions, earlier required gates, job-draft cases and pass marks remain. Every question in every round retains its raw answer, selection and source ledger in the synthetic artifact, never the usage/workflow log. A null raw answer means the server ended the turn before a model answer (for example the empty-list fast path).

## Page/tool parity

Each row has tests for owner, assigned project manager, unassigned project manager, finance and Viewer (40 tool/role cases). Access checks are those of the named page use cases. AI exclusion is deliberately stricter than page visibility. Viewer has no quote amounts or item prices.

| Tool | Page | Page read exercised |
| --- | --- | --- |
| list_jobs | Projects | ListAuthorizedProjects |
| get_job | Job overview | GetProjectWorkspace |
| get_quote_status | Quote | GetQuoteIssue |
| list_awaiting_client | Home | GetHomeDesk |
| get_saved_comparison | Home / Comparison | GetHomeComparison |
| get_past_prices | Quote | GetQuotedHistory |
| get_closed_job_lessons | Home | GetHomeDesk |
| get_item_prices | Price list | ReadPriceList |

Tests: page-parity-postgres.test.ts (35 cases), item-prices-postgres.test.ts (five role cases plus unit/search, foreign-organization and contributing-source exclusion tests). Existing unit-conversion, role-denial, cross-organization, access-changed, excluded-job and redaction tests remain.

## Evaluation interpretation

The new wrong-record-value gate replays the selected references against the server ledger and compares the complete displayed text and citations. It catches post-render mutation of labels, names, amounts, dates and references; semantic correctness is separately scored by selected field, value and record identity. A correct recorded fact chosen for the wrong question is still a wrong answer.

The injection fixture's authorized job name itself contains hostile wording. The required source heading prints that name as record data. Evaluation checks forbidden *record identities* in cited sources rather than treating a literal echoed record name as obedience to its instructions. The model cannot write new assertion text. The access and injection boundary tests remain.

The paid report retains the old call/quality gates and adds median calls ≤ 2, p90 latency ≤ 2,500 ms (baseline 2,000 ms) and cost/question ≤ 1.25 × US$0.198/162 = US$0.001527777778. The job-draft instruction, cases, support checks and oracle are unchanged.

## Verification status

`npm run check` passed on Node 24: formatting, design tokens, lint, TypeScript, all **1,878 tests in 193 files**, and the production build. The existing prisma.config.ts anonymous-default-export lint warning remains; there are no lint errors. The fake evaluation passes all 62 questions in all three rounds (186/186); this proves the integration contract, not model quality.

Local production-build Chrome checks passed for owner Settings and Viewer job chat in English and zh-TW: grouped failure reasons, visible keyboard focus, stage example, 390px page fit and table scrolling. The discovered mobile min-content overflow was fixed by allowing the Settings section to shrink. Screenshots and the browser report are in [evidence](evidence/). This uses a disposable local synthetic database, local HTTPS and AI disabled. Provider answer rendering is tested in application/unit tests and the paid runner; it was not exercised through a live-provider browser session.

Implementation [CI 45701497283](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45701497283) passed on `e52205f`, including real Prisma migrate/seed/verify commands, repeated seed/verify, the full check and the dependency audit. Paid [run 1 — 45702234409](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45702234409) completed on that exact commit; results below. No hosted operations were performed. Hosted acceptance is waiting for the Product Director; PR #80 stays draft. Paid runs used: 3 of 4. Run 3 passes; no fourth dispatch is needed.

## Paid run 1 — failed, preserved in full

[Full synthetic report](evidence/paid-run-1.json), commit `e52205f`, model gemini-3.5-flash-lite. All 186 question rows include rawAnswer (or null when the server supplied an early answer), selection and source ledger. No raw answer is in the usage log.

| Round | en core /20 | zh-TW core /20 | New required /8 | Earlier required /14 | Wrong recorded values | Median calls | p90 ms | Question cost USD | Cost/question USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 18 | 18 | 6 | 14 | 0 | 2 | 2,156 | 0.086368600 | 0.001393041935 |
| 2 | 18 | 17 | 8 | 14 | 0 | 2 | 2,048 | 0.084557200 | 0.001363825806 |
| 3 | 17 | 17 | 7 | 14 | 0 | 2 | 2,001 | 0.084571400 | 0.001364054839 |

All performance/cost gates passed. Job drafts passed 16/16 per language in all three rounds, all 22 required draft cases each round; the separately reported residential-placeholder case also passed each round. Total estimated cost, including drafts and reported cases: **US$0.357366200** (questions US$0.255497200; drafts US$0.101869000).

The run failed the new required item-price cases and the existing zh-TW-finding two-of-three gate. Raw failures distinguish real selection failures (bare record alias instead of a ref, 13 individual findings beyond the 12-fact limit, and a lead-in without facts on an empty identity search) from an evaluator error: two correct global item prices were marked wrong because an optional job context changed their subject metadata. Some core quote-status answers also omitted the expected document number; those remain scored wrong.

Follow-up changes preserve all pass marks, question text and expected values: remove non-selectable bare record aliases from model data; clarify complete-ref selection, the requested finding count, the existing 12-fact cap, and quote identity in the general instruction; use the same non-disclosing server refusal immediately for a completed empty named-job search; score global item identity using its description, unit, source quote and contributing jobs even when optional client context is present. Tests still reject another item/unit/value, unknown refs, lone lead-ins and excess facts. No job-draft instruction or oracle changed. The [free replay](evidence/free-replay-run-1.json) passes all 186 recorded rows: 141 accepted answers render unchanged, 13 invalid answers retain their exact rejection reasons, eight model refusals remain refusals, and 24 server early answers have no model answer to replay. This checks rendering/rejection; it does not claim to simulate the new instruction or earlier tool fast path. The full local check passed again: 1,873 tests in 193 files and the production build.

## Paid run 2 — failed only the cross-round finding gate

[Run 45728856574](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45728856574), commit `308342a`; [full synthetic report](evidence/paid-run-2.json).

| Round | en core /20 | zh-TW core /20 | New required /8 | Earlier required /14 | Wrong recorded values | Median calls | p90 ms | Question cost USD | Cost/question USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 20 | 19 | 8 | 14 | 0 | 2 | 1,987 | 0.082674300 | 0.001333456452 |
| 2 | 19 | 19 | 8 | 14 | 0 | 2 | 1,939 | 0.083129400 | 0.001340796774 |
| 3 | 20 | 19 | 8 | 14 | 0 | 2 | 1,917 | 0.082254900 | 0.001326691935 |

Every per-round gate passed, but zh-TW-finding was discarded in all three rounds for 13 individual facts, failing its unchanged two-of-three gate. en-closed also selected 13 facts once. There were no unknown-reference, empty-search, item-price or wrong-record-value failures. Drafts passed 16/16 per language and all 22 required cases in every round; the separate residential-placeholder report also passed. Total estimated cost including drafts: **US$0.349932600** (questions US$0.248058600; drafts US$0.101874000). Cumulative two-run cost: **US$0.707298800**.

The provider schema previously always offered 14 array slots: one phrase, 12 facts and one list. A turn containing no list can legally use only 13. The next change sets the provider maxItems to 13 for those turns and retains 14 when a list is available. The server still rejects more than 12 facts, and tests still accept the full 12-facts-plus-list answer. This change does not alter instruction text, cases, expected values, pass marks, model or job drafts.

CI [45728840373](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45728840373) attempt 1 passed 1,872 tests and failed the existing 20,000-item price benchmark with an unavailable read. The same price query passed the earlier CI run and all local full checks; a focused local rerun passed in 8.85 seconds. The log does not establish the underlying error. The failed CI job was retried once without changing assertions or timeouts; attempt 2 failed at the same read. This is recorded as a reproducible CI failure, not a passing retry.

Local EXPLAIN ANALYZE then showed a cardinality underestimate causing a nested loop to execute the grouped quote/source aggregate 200 times and the client-price relation 200 times. Materializing the per-item relations computes them once, without changing any predicate, price selection, count or source dependency. Local PostgreSQL 17.12/en_US.utf8 measurements on the same 20,000-line fixture were:

| Query | Before | After computing per-item relations once |
| --- | ---: | ---: |
| Suggestion | 1,040.18 ms | 281.52 ms |
| History | 17.22 ms | 22.59 ms |
| List | 184.51 ms | 156.48 ms |

The full 100-quotes-per-item counts still pass. These are single warm local measurements, not hosted load results; the suggestion remains above SB-067's informal <200 ms local target. The old CI log did not capture the exception code, so a timeout is not asserted as proven. The benchmark now adds bounded error name/code, mode and duration to its unchanged failure assertion, without response bodies, amounts, relaxed limits or retries. New CI is required after the query change.

Schema-limit verification: `npm run check` passed with 1,877 tests in 193 files and the production build. [Run-2 free replay](evidence/free-replay-run-2.json) plus run 1 cover all 372 saved raw answers; accepted output remains identical and excess facts still reject. No instruction text changed after paid run 2.

Final pre-run-3 check: `npm run check` passed, 1,878 tests in 193 files plus production build. Item-price results now also expose a whole-list ref for their at-most-five authorized rows; the regression verifies each price/unit stays on its own item row. No individual-fact or list cap was increased. The latest query measurement and all page/access parity tests pass. [CI 45732096515](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45732096515) passed on `20955bc`, including migrations, seed/verify twice, the full isolated-database check and dependency audit. The previously failing 20,000-item benchmark passes. Paid run 3 passed on that exact commit; details below.


## Paid run 3 — passed

[Run 45732833274](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45732833274), exact code commit `20955bc9443ecef9baac24831cb1bc240975045f`; [full synthetic report](evidence/paid-run-3.json). The workflow runs from main and checks out this input commit. Model remains gemini-3.5-flash-lite.

| Round | en core /20 | zh-TW core /20 | New required /8 | Earlier required /14 | Wrong recorded values | Median calls | p90 ms | Question cost USD | Cost/question USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 20 | 20 | 8 | 14 | 0 | 2 | 2,026 | 0.079726700 | 0.001285914516 |
| 2 | 20 | 20 | 8 | 14 | 0 | 2 | 1,796 | 0.079371100 | 0.001280179032 |
| 3 | 20 | 20 | 8 | 14 | 0 | 2 | 2,175 | 0.080541300 | 0.001299053226 |

All 62 question cases passed in all three rounds (186/186): every per-question pass rate is 3/3, including zh-TW-finding. There were no discarded answers, unknown references or wrong recorded values. All questions used at most three calls; the named-refusal maximum was one. Median latency was 1,558 / 1,593 / 1,577 ms. Calls, p90 latency and cost per question pass the unchanged baseline gates.

The gated job-draft set passes 16/16 per language in all three rounds, including all 22 required cases each round. The separate, non-gating `zh-TW-residential-placeholder` report passes 2/3: round 1 kept `客戶甲` instead of expected `測試客戶甲`. Its raw draft is preserved. This is a known job-draft limitation, outside #79; the job-draft instruction, support check, expected values and gate were not changed.

Estimated run cost is **US$0.341503100**: questions US$0.239639100 plus drafts and separately reported cases US$0.101864000. Cumulative cost for all three dispatches is **US$1.048801900**. Three of the four allowed dispatches were used. No further paid run is needed.

The final evidence-only commit adds this report and updates task status; the implementation remains the CI- and paid-tested `20955bc`. All 186 raw answer fields and source ledgers are retained in this artifact (null raw answers identify server early replies), along with per-question pass rates and follow-ups.

## Not verified / remaining acceptance

- Hosted acceptance and prior acceptance click-throughs wait for the Product Director. No hosted deployment, migration, seed, setting change or Test site workflow was performed. PR #80 remains draft.
- A live-provider answer was not exercised through a browser; paid application evaluation and local UI checks were separate.
- Hosted/concurrent database load was not measured. The local suggestion benchmark remains 281.52 ms versus the earlier informal 200 ms target.
- The non-gating residential job-draft placeholder result above remains a recorded limitation; no job-draft scope was added.
