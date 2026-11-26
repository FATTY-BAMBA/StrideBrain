> Current status: fix round 2 is committed and locally/CI verified, but final paid run 6 fails acceptance. All six authorized dispatches are used. PR #80 stays draft; see the final section for scores, cost and remaining failures. The Product Director confirmed record cards in comment 7181003350; layout items 3, 5 and 6 are settled.

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


## Hosted review 7180179624 — items 1–7

Read [the specified review](https://github.com/FATTY-BAMBA/StrideBrain/pull/80#issuecomment-7180179624) and verified its actual author is repository owner FATTY-BAMBA (101108617). The review reports an owner hosted pass for the earlier build's values, migration, refusals, lists and narrow layout. The revised build still needs hosted retesting, including project manager and Viewer. No hosted action was taken by this fix round.

1. Missing/stale comparisons now return to the bounded tool loop. Item prices and closed-job reads can answer afterward, including when both calls arrive in one model reply. The comparison link appears only at the end of an unanswered comparison question for that subject. An incorrect comparison request for the page default is refused without executing it; the bounded loop can then read the named closed job. Existing answer-subject/exclusion checks, tool deduplication, caps and no comparison writes remain. Tool descriptions distinguish the three reads.
2. Single-job sources use the authorized current job name followed by its reference, including the sources list. Item headings include unit. Identity fields that repeat the heading are omitted below it.
3. Both chat surfaces share AnswerText: a section per server-owned record, a bold ink heading, and token-based 16px record gaps / 4px fact gaps. Stored StructuredAnswer is unchanged.
4. Total and tax labels come from quoteDocumentCopy (including tax / 5%); both Chinese quote identifiers use 單號.
5. A shown list covers its first ten rows' facts, regardless of selection order. Those repeated facts and the repeated list count are omitted. Rows outside the cap remain independently selectable.
6. A selected latest item price includes last-quoted date, times quoted and document number. A selected client-specific price includes its own date and document number. Explicit selection of those companions does not print them twice. This is one price-list reading and leaves the model's selection caps intact.
7. The closed-job source exposes Home's exact closedDifferenceText as overallDifference. Parity tests now check that sentence reaches the model and renders, not merely that the raw DTO contains figures.

**Provisional copy/layout decisions awaiting Product Director before merge:** the review marks items 3, 5 and 6 provisional. The user's instruction authorizes building them; this record retains their pre-merge confirmation status.

Free replay: all 558 raw question rows from paid runs 1–3 replayed against their recorded ledgers. Headings are enriched only from names already present in that same synthetic report. Every run-3 question still passes (186/186), with no wrong recorded value; earlier invalid selections retain their rejection reasons. The replay scores the new displayed layout against the unchanged question expectations and recorded facts; it does not simulate new tool routing. See review-layout-replay-run-1/2/3.json.

Added evaluation cases: item-price questions from a no-comparison job bar and a named closed job's cost question from another job bar, required in both languages; overall closed-job difference, reported in both languages. The original 40 core and 22 required cases remain. The suite now has 68 questions per round: 40 core, 26 required, two reported. All 204 pass through the fake in three rounds. Existing per-language, security, performance, cost and job-draft gates are unchanged.

Local browser component previews use the actual AnswerText renderer, production chat CSS, design tokens, recorded synthetic answers and an explicit two-record layout fixture. English/zh-TW at 1120px/390px pass record-gap, bold heading, horizontal-overflow and job-thread keyboard-focus checks; screenshots are in evidence. They are isolated layout previews, not a live-provider or hosted browser test.

Items 1–7 full check passed: 1,893 tests in 194 files and the production build. CI and paid run 4 are pending the additional owner-authored review items 8–10 (comments 7180301103 and 7180437328, discovered before dispatch). One paid dispatch remains; none beyond four is authorized.

## Additional hosted review — items 8–10, same fix round

Verified both follow-on comments [7180301103](https://github.com/FATTY-BAMBA/StrideBrain/pull/80#issuecomment-7180301103) and [7180437328](https://github.com/FATTY-BAMBA/StrideBrain/pull/80#issuecomment-7180437328) are owner-authored and explicitly join this round. They were read before the last paid dispatch.

8. An explicit unresolved name/reference is refused before supplying the page default or executing its tools. The lookup uses only authorized identities; nonexistent and inaccessible jobs have identical refusal text and no sources. The hosted Chinese and English examples, reference selectors, readable names in either language, deictic page questions and item/list questions have regression coverage. Four required evaluation cases add inaccessible names as project manager and nonexistent names as owner, both languages, in Xinyi's bar. A fact about a substituted page job is now a wrong recorded value in that evaluation gate. List headings name awaiting quotes, projects or closed jobs.
9. Server capability filtering removes quote/amount/price/status follow-ups without quote:read; actual-cost follow-ups also require actual-read. Viewer answer and permitted stage question stay intact. Tests cover both languages. No model retry is added.
10. No evidence establishes a hosting/region/pool cause for the earlier slow turns. Added AssistantTurnTiming metadata (tenant, membership, request id, start/end and duration) via a new migration. The clock starts at askHomeAction entry, before runtime resolution; Next's after callback samples completion after the response and persists asynchronously. This includes record reads, answer rendering and early no-model refusals; its write cannot delay that response. It excludes pre-action browser/network time and is not a browser stopwatch. Settings shows seven-day count/latest/maximum and the latest twenty turn timestamps/durations; only settings:manage can read it. Owner/Viewer recording, foreign membership rejection, capability denial, retry idempotency, invalid durations, seven-day filtering, zero-model call-meter isolation, post-response execution and failure containment are tested. Logs contain only the request id and failure code, never question/answer content. All prior migration files are unchanged.

Next's documented callback boundary: [after](https://nextjs.org/docs/app/api-reference/functions/after). The existing evaluation latency in tests/assistant/run-evaluation.ts already wraps AskAssistant.execute, including its tool/database reads; it is not model time alone. It does not include action/runtime-context resolution or response completion. The new action-level measurement closes that gap; its hosted behavior still needs the Product Director's retest.

The expanded free fake evaluation passes all 72 cases in each of three rounds (216/216), without changing existing questions, expected values or oracle. The four new unresolved-name cases require no model calls. The raw-answer replay was refreshed for list names as well as record names; run 3 remains 186/186 with zero wrong values. Local desktop/narrow screenshots were refreshed. The assistant suite passes 517 tests. Full check/CI and the final paid result are recorded below when complete.

Final local check for items 1–10: **npm run check passed, 1,919 tests in 196 files, plus production build**. The first full attempt exposed two UI tests importing the new server-only helper instead of mocking the Server Action boundary; those mocks are corrected and the complete check passed on rerun. Lint has the existing prisma.config.ts default-export warning, with no errors. The timing migration was applied by the isolated-database test setup; real prisma migrate deploy and repeated seed/verify remain CI's responsibility. Latest focused replay and evaluation-summary tests pass after the final evidence-label/count updates.

## Paid run 4 — failed, allowance exhausted

[Run 45743760089](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45743760089), implementation commit `1fdd4d7a03f12d93244e2855df430f39044ffac6`, model gemini-3.5-flash-lite. [CI 45742997197](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45742997197) passed on that exact commit before dispatch: 1,919 tests / 196 files, build, real migration deployment, seed/verify twice, dependency audit (zero vulnerabilities). [Full synthetic raw report](evidence/paid-run-4.json) and [summary including per-question rates](evidence/paid-run-4-summary.json) are retained. The workflow runs from main and checks out this explicit input commit.

| Round | en core /20 | zh-TW core /20 | Required /30 | Reported /2 | Wrong displayed values | Discards | Median / max calls | p90 ms | Question cost USD | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- |
| 1 | 19 | 20 | 29 | 2 | 0 | 0 | 2 / 3 | 1,525 | 0.092792100 | FAIL |
| 2 | 19 | 20 | 30 | 2 | 0 | 0 | 2 / 4 | 1,657 | 0.094817300 | PASS |
| 3 | 19 | 20 | 30 | 2 | 0 | 0 | 2 / 3 | 1,481 | 0.093143700 | PASS |

The full run fails because every round must pass. All performance/cost-per-question gates pass; no wrong recorded value or discarded answer appears. Per-question results: 70 cases pass 3/3, en-item-no-comparison passes 2/3, and en-closed passes 0/3 (212/216 total outcomes pass). These are unchanged expectations; no case, oracle or pass mark was relaxed after the result.

- **Still failing required acceptance:** en-item-no-comparison round 1 asked “What do we usually quote per ping for Ceiling on this job?” from PRJ-ACTIVE-001. The model called get_past_prices with DEMOLITION_CEILING, then get_past_prices without a category, then submitted empty parts. The loop correctly continued, but the model never selected get_item_prices, so the displayed answer was the generic refusal. This also trips the existing named-refusal maximum (3 calls versus 2). It is a routing/selection failure, not a rejected correct answer, wrong amount or premature comparison notice. Rounds 2 and 3 answer the required price with its date/count/document number. The Chinese equivalent passes 3/3.
- **Core expectation miss:** en-closed selects the new exact overallDifference sentences for the three closed jobs in every round. The displayed differences are correct Home facts, but the unchanged case expects quotedPrice and reconciledActualCost figures; neither was selected. It remains a recorded 0/3, not relabelled as a pass.
- Both named closed-job cost cases from another job bar pass 3/3. Both reported overall-difference cases pass 3/3. All four new unresolved-name cases (project manager/owner, both languages, another job's bar) pass 3/3. Existing no-comparison/out-of-date cases and zh-TW-finding pass 3/3.
- The unchanged gated job-draft set passes 16/16 per language in all three rounds, with 22/22 required cases each round. The separate residential-placeholder report now passes 3/3. No job-draft code, instruction, cases, expected values or oracle changed.

Estimated cost: **US$0.382622100** (questions US$0.280753100; drafts including the separate reported cases US$0.101869000). Cumulative cost for all four runs: **US$1.431424000**. All four authorized dispatches are used; no fifth dispatch was made. No implementation or instruction was changed after this paid result.

## Final handoff / not verified

The reviewed implementation and layout replay are committed, but paid acceptance is **not complete** because the required English item-price case is not stable. The recorded closed-job expectation miss also remains. No instruction tuning, model change, oracle change or further paid run was used to hide these results.

Hosted acceptance of the revised commit, browser/provider integration on the test site, the real hosted after-response timing callback, and the cause of the earlier 10–12 second delays are not verified. Local isolated component screenshots cover English/zh-TW and 1120px/390px; they do not constitute a hosted role retest. Provisional layout rules in items 3, 5 and 6 still await the Product Director before merge. No hosted project/database mutation or Test site workflow was performed. PR #80 remains draft. This final commit changes evidence/task documentation only; implementation CI and paid evaluation both refer to `1fdd4d7`.

## Fix round 2 — record cards and structural subject checks

Read and verified owner authorship for [decision 7181003350](https://github.com/FATTY-BAMBA/StrideBrain/pull/80#issuecomment-7181003350), [early review 7181049379](https://github.com/FATTY-BAMBA/StrideBrain/pull/80#issuecomment-7181049379) and [round 2 response 7181219556](https://github.com/FATTY-BAMBA/StrideBrain/pull/80#issuecomment-7181219556). The Product Director's record-card decision settles round-1 layout items 3, 5 and 6. Only the example empty-list copy remains explicitly provisional. The current user instruction authorizes up to two further paid dispatches (six total).

Run 4 remains failed evidence. It supports item 1 (the unavailable-comparison loop continues) and item 7 (the exact overall difference reaches the answer). **It proves nothing about item 8:** the four unresolved-name cases took the old pre-model word-check refusal with zero model calls. The original report above is historical, not the current acceptance claim.

Changes:

- Removed hasUnresolvedJobSelector. The model supplies bounded namedJobs metadata copied from the current question; the server validates verbatim occurrence, unique exact authorized identity, and that every declared subject's facts are shown. No server word list interprets a question. All 16 ordinary review wordings reach the scripted model and can render an authorized selection; all seven missed wordings plus the prior four examples refuse substituted page-job facts. This proves routing/identity protection, not new historical-version or annual-report features absent from the tools.
- Comparison notices now follow the turn's read structure: no selected facts, only comparison reads, for the actual subject job. Added the two Chinese wordings omitted by the former keyword list. Mixed item/comparison reads do not get an unrelated comparison notice.
- The server builds a versioned AnswerPresentation alongside plain text. Both chat surfaces render named, accessible card groups and description lists; values are emphasized, references and price provenance quieter. A list uses the mirrored page's fields and suppresses a separate card for any included record, even across tools. Empty lists are plain notices; source links keep the page language. Stored text retains its lead-in; the new view hides it. Old answers and refusals retain their existing rendering.
- Each selected closed-job quote, actual cost or overall difference brings all three into the same reading. No en-closed instruction or expected value was changed. Prices keep their dates/count/document numbers as one reading, including client-specific price. Quote labels come from the page, including 報價單號 in both identifier positions.
- Renamed the reads to get_comparison_category_price_ranges and get_price_list_item_last_prices. Descriptions and unavailable-comparison results explain their distinct sources. A duplicate unavailable read uses its cached result and leaves other tools available within the existing caps. It never executes twice. No question word pattern was added.
- Recorded the Product Director's small-firm/easy/friendly/plain-words/names-first principle in DESIGN_SYSTEM.md. React component review found no new effect, client fetch or mutable cross-request state; layout uses existing tokens and the token check adds no legacy values.

Free verification:

- Replayed unchanged raw answers from all four paid runs against their recorded authorized source ledgers (774 question outcomes). No provider call. Source presentation metadata is reconstructed from recorded DTOs, not from answer prose. Run 3 remains **186/186**, zero wrong recorded values. Run 4 **en-closed 3/3 and zh-TW-closed 3/3**, original expectations unchanged. Earlier invalid selections keep their rejection reasons. Files: evidence/round2-card-replay-run-1.json through -4.json. Replays do not claim to verify new model routing or the previously short-circuited subject cases.
- Added card tests for two records, cross-tool list/record deduplication, price/client-price provenance, empty list (list or count selection), refusal with no card, old stored text and each trigger of the closed-job bundle. Added exact identity and repeated unavailable-read regression tests.
- Evaluation now contains **84 questions per round**: unchanged 40 core, 42 required and two reported. Eight additional unresolved-job wordings and four additional item-price wordings join the existing cases. Every unresolved-subject case must reach the model to pass. Model, 16/20 threshold, zero-wrong-value gate, call/latency/cost limits and job-draft logic/instruction/cases/oracle stay unchanged. Only renamed tool identifiers changed in the existing oracle calls.
- Local previews render the actual shared AnswerText/AnswerCards components and production chat/card CSS using replayed synthetic answers. Both Home and the job panel, English/zh-TW, at **1440 and 390px**: no horizontal overflow, long unbroken value wraps, labeled groups/description lists, one source link per card, keyboard thread focus and link traversal pass. Screenshots: evidence/{en,zh-TW}-record-cards-{1440,390}.png; measured checks: evidence/round2-card-browser.json. These are isolated component previews, not hosted or live-provider browser acceptance. Visual polish remains #77.

Full check, CI and additional paid-run results follow below when complete. No migration was added or edited in round 2. No hosted deployment, database change, seed, setting change or Test site workflow was performed. Hosted retest, live-provider browser integration and hosted timing callback still await the Product Director; the earlier 10–12 second delay's cause remains unverified. PR #80 stays draft.

Round-2 final local `npm run check` passes: **1,971 tests / 197 files**, format, design tokens (no new legacy values), lint (only existing prisma.config.ts warning), typecheck and production build. The expanded free fake evaluation passes **252/252**, all 42 required cases and all 12 model-reaching unresolved-subject cases per round. A concurrent in-progress first check saw the newly added assertion before its source module was reloaded; the finalized complete rerun passes. Implementation CI and paid run 5 are pending this commit.

[Round-2 CI 45748758007](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45748758007) passed on `863f4da44877128dc6cac1c73afa571fa182134e`: 1,971 tests / 197 files, production build, real migration deployment, seed/verify twice and zero production dependency vulnerabilities. [Paid run 5, 45749557326](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45749557326), was dispatched only after CI passed, from the workflow on main with that exact input commit. It is the first of the two additionally authorized dispatches.

## Paid run 5 — failed; corrections before the final authorized run

[Run 45749557326](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45749557326), `863f4da44877128dc6cac1c73afa571fa182134e`. The unchanged full report is evidence/paid-run-5.json; per-question rates and totals are in paid-run-5-summary.json.

| Round | en /20 | zh-TW /20 | Required /42 | Wrong displayed values | Discards | Median / max calls | Named-refusal max | p90 ms | Cost/question USD |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 1 | 20 | 20 | 30 | 0 | 0 | 2 / 5 | 5 | 1719 | 0.001560509524 |
| 2 | 19 | 20 | 34 | 0 | 1 | 2 / 5 | 5 | 1756 | 0.001582901190 |
| 3 | 20 | 20 | 31 | 0 | 0 | 2 / 5 | 5 | 1681 | 0.001544630952 |

All rounds fail the required-case, named-refusal-call and cost-per-question gates. The cost limit remains US$0.001527777778; it was not raised. The 12 unresolved-subject cases reach the model and refuse in every round, but one wording takes five calls after searching the fragment “02” and trying the page job; its wrongly copied metadata is refused. No substituted page-job facts are shown. The original closed-job en/zh cases pass 3/3 with the full bundled figures. Drafts remain 16/16 per language per round; the separate residential case is 3/3.

Most failed required answers contain the right selected facts but invalid subject metadata: the model copies the page reference or both language aliases although only one name, or no name, occurs in the current question. The exact-occurrence check correctly refuses these. One malformed answer repeats the say part and is discarded. Item cases also expose an invented translated unit filter (“ping” rather than the stored “坪”), and an evaluator asymmetry for the same global price with versus without optional job context.

Run cost **US$0.495662000** (questions US$0.393795500; drafts US$0.101866500); cumulative five-run cost **US$1.927086000**. This failed report is preserved as run, not rescored into a pass.

Corrections within round 2 before dispatch 6:

- The copied-text field is now named jobMentions; its schema and general instruction distinguish quotations from currentQuestion from page context and tool data. Initial authorized subject metadata includes only exact literal mentions in the question, preserving their letter case, rather than every translated alias. Page context has the explicit transport name pageContextReference and is already resolved. Exact occurrence/authorized identity checks remain strict; regression tests still refuse the run-5 page-reference and translated-alias forms. No closed-job instruction was changed.
- The item tool's optional unit description requires a stored unit copied from a result, omitting it until known; no guessed translation, unit alias merge or stored-price change was added.
- Evaluation matching now treats the same description/unit/document and exact global value equally with or without optional job context, in both directions. Previously only the direction adding context passed. Client-price facts still require their subject provenance; changed description, unit, document number or amount still fails. The question, expected values, oracle calls and pass marks are untouched. This fixes an evaluator comparison, not the server's access or value checks.

One paid dispatch remains, pending the corrected implementation's full check and CI. No further allowance is assumed.

Post-run-5 `npm run check` passes: **1,973 tests / 197 files and build**. The additional client-provenance assertion also passes in the focused evaluator test. Free raw-selection replay of runs 1–4 remains green; no card layout or stored price changed after the screenshots. CI and the final authorized paid dispatch will use the corrected protocol commit.

[CI 45792089777](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45792089777) passed the protocol correction `01df0f8`. The final tool-description addition tells named-job resolution to copy the complete name/reference from currentQuestion rather than a fragment (run 5 searched “02” then tried the page job). This is general tool-parameter guidance; query semantics and exact server checks are unchanged. Its final `npm run check` passes **1,974 tests / 197 files and build**. No sixth paid dispatch has occurred yet.

Final implementation [CI 45793615143](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45793615143) passes on `c3323c5d33b33ea647fc7074db59d483a8abdfdc`: 1,974 tests / 197 files, build, migrations, repeated seed/verify and zero production dependency vulnerabilities. [Paid run 6, 45794522013](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45794522013), uses that exact commit and was dispatched after CI passed. All six authorized dispatches are now used.

The final local screenshots also load the actual versioned Inter and Noto Sans TC font files. At 1440 and 390px in both languages, the font-load, overflow, long-value wrapping and keyboard checks pass; evidence/round2-card-browser.json records these checks. This refresh changes evidence only.

## Paid run 6 — failed; allowance exhausted, stop after report

[Run 45794522013](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45794522013), exact implementation `c3323c5d33b33ea647fc7074db59d483a8abdfdc`, model gemini-3.5-flash-lite. [Full unchanged raw report](evidence/paid-run-6.json), [summary and per-question rates](evidence/paid-run-6-summary.json). This is the second additional run authorized by the Product Director and the sixth total. No further paid dispatch was made or is assumed authorized.

| Round | en core /20 | zh-TW core /20 | Required /42 | Wrong displayed values | Discards | Median / max calls | Named-refusal max | p90 ms | Cost/question USD |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 1 | 20 | 20 | 34 | 0 | 0 | 2 / 5 | 5 | 1987 | 0.001548750000 |
| 2 | 20 | 20 | 35 | 0 | 1 | 2 / 4 | 4 | 2062 | 0.001577332143 |
| 3 | 20 | 20 | 34 | 0 | 0 | 2 / 5 | 5 | 2043 | 0.001561298810 |

Per-question rates: 73 cases pass 3/3, four pass 2/3, one passes 1/3 and six pass 0/3 (228/252 outcomes pass).

**Acceptance is not met.** Every round fails required-case completeness, the named-refusal maximum of two calls, and the cost-per-question limit of US$0.001527777778. Median calls, the 90%-within-three-calls target and p90 latency pass. No wrong financial/record value was displayed. The English and Chinese original closed-job cases pass 3/3, with quote/actual/difference grouped. All 12 unresolved-subject cases reach the model and refuse safely in each round, but some take four or five calls. The model still cannot reliably supply the copied-mention protocol, so the ordinary-question requirement is **not demonstrated by paid acceptance**, despite its scripted routing tests passing.

Remaining failures, with raw evidence retained:

- en/zh job-page-selected and Viewer stage are 0/3: the model inserts the page reference into jobMentions even though the current question names no job. The exact-occurrence check returns a refusal. zh-TW-millwork-range is also 0/3: the answer contains a resolved reference absent from the question, sometimes alongside the literal name. The correct selected facts do not override invalid subject metadata.
- en-item-no-comparison is 0/3 and zh-TW is 1/3. The loop now reaches the item-price tool, but an invented page-reference mention causes refusal. The additional English wording-1 case is 2/3: round 3 repeatedly requests the nonexistent exact unit “ping” rather than inspecting the stored “坪” result and ends without facts. Repeated calls use cached results and do not execute twice.
- zh-TW-closed-other-bar and the separately reported overall-difference case each have one refusal caused by substituting a reference for the name in the question. The en/zh core closed-job bundle remains 3/3.
- en-home-reference-total round 2 is discarded as UNKNOWN_REFERENCE because the raw selection contains `s1. issued.acceptedOn` with a space. It was not silently repaired.

Job drafts pass 16/16 per language and 22/22 required cases in every round. The separate residential-placeholder report passes 3/3. No job-draft implementation, instruction, case, expected value or oracle changed.

Run 6 cost: **US$0.495614000** (questions US$0.393740000; drafts US$0.101874000). The two additionally authorized runs cost **US$0.991276000** together. Cumulative cost of all six runs: **US$2.422700000**.

### Final verified / not verified

Verified: final implementation CI and npm run check (1,974 tests / 197 files and build), real migration and repeatable seed/verify commands in CI, free fake evaluation (252 outcomes), raw layout replay of runs 1–4, required closed-job replay, card rendering/accessibility assertions, and bilingual 1440/390px component previews with production fonts. The failed paid reports remain failed, with no question, expectation, oracle-value, model or pass-mark changes to relabel them. No existing migration was edited. The final evidence commit changes reports/screenshots/task status only; implementation remains the CI- and paid-tested c3323c5.

Not verified / not achieved: the three-round paid acceptance gate and reliable ordinary-question behavior; hosted retest, live-provider browser integration, hosted timing callback and the cause of earlier slow turns. Empty-list copy remains provisional. The other layout decisions are confirmed. No hosted deployment, migration, seed, setting change or Test site workflow was performed. PR #80 remains draft. Report this result on the PR and stop, as requested; the paid allowance is exhausted.
