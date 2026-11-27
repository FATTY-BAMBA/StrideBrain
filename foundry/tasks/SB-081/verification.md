# Verification — fix round 2 completed

Owner-authored decision [7214653618](https://github.com/FATTY-BAMBA/StrideBrain/pull/83#issuecomment-7214653618), continuing fix round 2. Code `930c9ef`. **Item 2 is complete locally; the previous cutoff conflict is resolved by the explicit decision.** Items 1 and 3 were accepted on `373cb5c`. No paid evaluation.

## Implementation

The scoring formula and coverage test are unchanged. Order: rank → narrow by a matching standalone number, if any → drop scores below 75% of the surviving best score → limit. Leading zeros and full-width digits normalize; digits embedded in Latin alphanumeric words such as `R7K3` are not standalone. Numbers only narrow already-ranked candidates, never create candidates or change scores. If no ranked candidate matches a typed number, no number filtering occurs. Equal scores remain. The policy-read loop, reader scope and limits remain unchanged.

The decision is provisional, awaiting Product Director confirmation before merge.

## Verified

- Unit fixture contains 32 bilingual job identities and covers every row in the decision table: Xinyi/Neihu store, English/Chinese flagship ties, concept-store ties and narrowing, Xinyi/Riverside loose names, zero-padded workplace numbers, design project 03, generic project 3, unmatched 9, and “3樓的工作室”. The two-job reader still gets no candidate for “設計專案01” or “Banqiao store”. Additional tests cover full-width digits, numbers that cannot create candidates, embedded digits, and number narrowing before cutoff/limit while retaining original scores.
- `npm run check` passed with four workers: **2,054 tests / 211 files**, formatting, design-token checks, lint, types and production build. Existing Prisma anonymous-default-export warning only.
- [CI 45974452003 passed](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45974452003) on final code `930c9ef`.
- Free evaluation **354/354** (118/118 each round). **No expected-case or pass-rule changes.** Actual chips changed only for `en-misses-near-0`, in all three rounds: `[PRJ-XINYI-026, PRJ-BANQIAO-015, PRJ-ZHONGSHAN-018]` → `[PRJ-XINYI-026]`. All other chip lists, including Chinese cases, are unchanged. [Free comparison evidence](evidence/fix2-final-free-verification.json).
- Local production browser, synthetic model transport: the exact owner question “What is the quote total for the Xinyi store?” offers only Xinyi Flagship Renovation. Confirmed follow-up still answers **NT$16,480,000 before tax after one tap**, without another job choice, on Home and the job bar. No page errors or horizontal overflow. Server stopped after capture.

[Owner candidate screenshot](evidence/fix2-final-owner-candidate-390.png) · [Home one-tap follow-up](evidence/fix2-final-home-confirmed-follow-up-390.png) · [job-bar one-tap follow-up](evidence/fix2-final-job-confirmed-follow-up-390.png) · [browser checks](evidence/fix2-final-browser-checks.json).

## Not verified / handoff

No new live-model run or hosted test was performed. Model instructions, tool definitions/results, model selection, pass marks and migrations are unchanged. Paid spend this continuation: **US$0**. Previous paid evidence remains attached to its original commit. The Reviewer reported hosted acceptance at `5ebfbb6` passed in all three roles; these final fixes await the Product Director's redeployment/recheck. No hosted deployment/database/settings change or Test site workflow. PR remains draft. Stop after the Builder report.

---

# Previous fix round 2 report (historical evidence)

Owner-authored review [7212254113](https://github.com/FATTY-BAMBA/StrideBrain/pull/83#issuecomment-7212254113). Code `373cb5c`. **Items 1 and 3 pass locally. Item 2's specified half-best rule is implemented, but its owner acceptance example still fails. Clarification is required before changing the scoring rule.** No paid evaluation or model-facing change.

## Changes and verified behavior

- Confirmed-turn follow-ups carry the same confirmed key, unless existing identity matching finds another readable job in the text. Unconfirmed turns remain unchanged. Both Home and the job bar use the existing typed-chip validation/access/exclusion path. The action avoids duplicate plain follow-ups, and React chip keys distinguish several questions about the same job.
- `nearestJobs` now drops scores strictly below half the best score; equal scores remain. The ten-read / three-chip bounds remain. Unit tests cover the numerical floor and ties; Chinese free evaluation cases remain unchanged and pass.
- Follow-ups asking for a job's name/reference are dropped; quote document-number questions remain. Items 2 and 3 are provisional pending Product Director confirmation.
- Tests cover confirmed context inheritance, another readable job clearing context, forged key refusal, unconfirmed behavior, both UI surfaces and duplicate-key avoidance.

`npm run check` passed with four workers: **2,035 tests / 210 files**, formatting, design tokens, lint, types and production build. Existing Prisma anonymous-default-export warning only. [CI 45957907699 passed](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45957907699). Free evaluation: **354/354**, including the unchanged Chinese cases; [summary](evidence/fix2-free-verification.json).

Local production build with synthetic model transport: one follow-up tap after confirming Xinyi answers **NT$16,480,000 before tax**, without another job confirmation, on Home and the job bar. No page errors or horizontal overflow. [Home screenshot](evidence/fix2-home-confirmed-follow-up-390.png), [job-bar screenshot](evidence/fix2-job-confirmed-follow-up-390.png), [browser checks](evidence/fix2-browser-checks.json).

## Item 2: specification conflict, not passed

The actual synthetic owner's readable job list produces these scores for searched text `Xinyi store`:

| Candidate | Existing score | Requested floor |
| --- | --- | --- |
| Xinyi Flagship Renovation | 1.5 | 0.75 |
| Banqiao Concept Store | 1.0 | 0.75 |
| Zhongshan Lifestyle Store | 1.0 | 0.75 |

The requested half-best filter retains all three, so the English question “What is the quote total for the Xinyi store?” still offers all three locally. This was confirmed both in the browser and against the seeded owner read model, not inferred from a test fixture. [Measured scores](evidence/fix2-candidate-scores.json).

Changing to a 75% floor would drop the two 1.0 candidates in this example, but would change the explicitly requested half-best rule. Alternatively the existing scoring formula would need to change. Neither decision is specified; AGENTS.md requires clarification rather than guessing. The unit floor fixture includes additional common-word candidates and is not claimed as the owner acceptance example. The failed acceptance is recorded in browser-checks.json.

## Not verified / handoff

Reviewer reports hosted acceptance at `5ebfbb6` passed in owner, PM and Viewer. These new fixes have not been tested on the test site; the Product Director redeploys and the Reviewer rechecks after the scoring decision. No instructions, tools, tool results, model, schema, migrations or pass marks changed. No paid calls, hosted deployment/database/settings changes or Test site workflow. PR remains draft. Stop after the Builder report and clarification request.

---

# Previous fix round 1 (historical evidence)

Review [7211242362](https://github.com/FATTY-BAMBA/StrideBrain/pull/83#issuecomment-7211242362), verified as authored by FATTY-BAMBA. The Product Director authorized an additional US$1.00, focused first and one full run only after focused success. PR stays draft; no hosted changes.

## Changes

1. Removed `PARTIAL_RECORDS`, its notice and `noticePhraseId`. A job's fact registry now supplies Client / Contact details / Site address, each with the constant “Not shared with the AI.” / 「不提供給 AI。」. These are ordinary selectable rows on the job card, with its job link, no private value and no extra record lookup. Complete answers and list selection do not acquire unsolicited availability rows. The single instruction sentence was sufficient; no retry wording change was made. This design is provisional, awaiting the Product Director before merge.
2. Missing-job chips rank first, inspect at most ten candidates in rank order, and stop after three pass access/exclusion. A 300-job regression counts reads for zero, five and ten denied candidates. The original paired present/absent PostgreSQL test and identity-guard timing assertions are unchanged.
3. `NO_KEY` and `DISABLED` use record search. Failed AI answers still show the fixed failure sentence and same-question retry. Removed the action's direct AI-enabled environment read; English/zh-TW configuration/privacy copy now describes both paths.

## Local verification

- `npm run check` passed on `b918108`: **2,028 tests / 210 files**, formatting, design-token checks, lint, types and production build. [CI 45951254706](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45951254706) passed, including real deployment-command checks against its disposable database.
- Initial full check caught obsolete 112-case stability-test fixtures; updated them for 118 without changing thresholds. The next check hit the unchanged quote-issue Home-flow test's five-second timeout under default concurrency. A complete rerun with `VITEST_MAX_WORKERS=4` passed; no test timeout, assertion or production code was changed to accommodate it. Existing Prisma anonymous-default-export warning only.
- Free evaluation: **354/354**, 118/118 in each round. Accepted #79 replay: **252/252**, zero discards/wrong values/access violations, zero provider calls. [Free evidence](evidence/fix1-free-verification.json).
- Local production-browser checks passed with synthetic model transport: owner, English/zh-TW, 1440px/390px, fixed Client row with stage and job link; keyboard-confirmed job chip; original-question retry; no page errors or horizontal overflow. Server stopped after capture. [Browser checks](evidence/fix1-browser-checks.json).
- Screenshots: [English desktop](evidence/fix1-en-availability-1440.png), [English 390px](evidence/fix1-en-availability-390.png), [zh-TW desktop](evidence/fix1-zh-TW-availability-1440.png), [zh-TW 390px](evidence/fix1-zh-TW-availability-390.png). Earlier screenshots remain unchanged as historical evidence.
- Unit and local PostgreSQL tests verify fixed entries byte-for-byte across different clients and missing site address, for owner and Viewer. Stored private values do not appear in model requests, logs or follow-ups.
- Free evaluation expands to 118 questions × three rounds (six new client-only/contact-only/address-only cases); the four mixed cases require stage and client rows. All pass rules retain their existing thresholds. Fixture completeness counts and report denominators reflect the added cases.
- Focused paid [45950848346](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45950848346), commit `7d48368`: **41/42**, all gates passed. Every mixed stage/client case passed 3/3; zh-TW contact-only passed 2/3, all others 3/3. Cost **US$0.071234100**. [Raw artifact](evidence/fix1-focused-paid.json).

## Paid acceptance — passed

[Full run 45951296390](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45951296390) evaluated final code `b918108`, only after focused success. **352/354 overall; 227/228 required (99.56%)**, every required case at least 2/3. Zero wrong values, disclosures, unreadable-job answers or discards. All mixed stage/client cases passed 3/3. All existing #79 required cases passed. Gating drafts passed 16/16 per language in every round; the existing reported residential-placeholder case passed 3/3.

| Round | All English | All zh-TW | Core English | Core zh-TW | p90 ms | USD/question |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 59/59 | 59/59 | 20/20 | 20/20 | 1,695 | 0.001458540678 |
| 2 | 59/59 | 59/59 | 20/20 | 20/20 | 1,665 | 0.001454405932 |
| 3 | 58/59 | 58/59 | 19/20 | 20/20 | 1,834 | 0.001441596610 |

Every round had median two calls, maximum three, 118/118 within three calls. All performance ceilings and unchanged acceptance thresholds passed. The two misses were `en-viewer-overview` (not-found reply) and `zh-TW-misses-contact-only` (general refusal), each in round 3 only; both passed 2/3. These are answer-completeness misses, not disclosures or wrong values, and remain visible in the raw report.

Cost: focused **US$0.071234100**, full **US$0.615710100**, additional total **US$0.686944200 of US$1.00**. Previous spend US$0.859081800; issue cumulative US$1.546026000. One full run used for this authorization; no second focused run or instruction revision was needed.

[Full raw report](evidence/fix1-full-paid.json), [per-question pass rates](evidence/fix1-paid-question-pass-rates.csv), [budget ledger](evidence/fix1-paid-summary.json).

## Not verified / remaining confirmation

Hosted acceptance has not been run. Browser evidence uses a synthetic local model transport, not a live provider. The live provider was checked separately through the paid workflow on disposable synthetic data. Reviewer 7211242362's fixed-fact design and the earlier privacy-boundary/copy decisions remain provisional until the Product Director confirms them. There is no remaining failed paid acceptance gate in this round.

Hosted acceptance awaits the Product Director. No Test site workflow, hosted deployment, database or settings change. PR #83 remains draft. Stop after the Builder report.

---

# Previous delivery A–F (historical evidence)

27 November 2026. Draft PR #83; base main `2443d9d`. Final code `5b8ea86`; paid full run evaluated `332e00a`. **Paid acceptance has not passed. Do not put this PR on the test site as an accepted build.**

## Reviewer decision

[7210266238](https://github.com/FATTY-BAMBA/StrideBrain/pull/83#issuecomment-7210266238) was verified as authored by repository owner FATTY-BAMBA. Option 2 is built on provisionally: the person's question reaches the model after the existing PII redaction; private record identities do not. The guard still runs at the existing final-answer boundary. `identity-guard-postgres.test.ts` is unchanged, and the timing assertions in `ask-assistant.test.ts` are unchanged. The guard supplies only the exact matched slice of the typed question for chip ranking, never another canonical field of the private record.

Awaiting the Product Director before merge: this privacy-boundary decision and the not-found, partial-answer and failed-answer copy.

## Built

- A: dedicated missing-job sentence in both languages, including a denied direct job lookup. A denied quote capability on a readable job remains the existing non-disclosing refusal.
- B: deterministic nearest readable/non-excluded job chips, maximum three, similarity floor, stable ordering. Confirmed context resends the original bounded question, overrides the page context and rechecks access/exclusion. No automatic candidate choice. The paired PostgreSQL test asks the same question with the unreadable job present and absent and asserts identical response, model calls and log metadata. A failed candidate read never logs a premature successful answer.
- C: up to 40 selected parts, still 12 printed individual rows, the existing list limit and server-computed remaining counts. A typed partial phrase prints under cards. Both known phrase IDs may arrive in either order, or the partial ID alone with valid fact refs: the server fixes the layout, never the facts. Unknown IDs/refs, duplicates, model prose and empty lone phrases still fail.
- D: complete readable references become localized names in follow-ups; contact/client-identity/site-address suggestions are filtered for every role. Rewritten suggestions remain bounded.
- E: AI failure shows only the fixed sentence and same-question retry. No keyword read or comparison write follows a failed AI turn. AI off in Settings retains record search.
- F: 84 existing evaluation cases retained, 28 required bilingual cases added (112 questions × three rounds), free replays, three focused paid samples and one full run. No pass mark was lowered. The evaluator also rejects a partial notice on an otherwise complete long findings answer.

## Local verification

`npm run check` passed at `5b8ea86`: **2,025 tests / 209 files**, formatting, design-token gate, lint, TypeScript and production build. The existing Prisma configuration lint warning remains; no new lint warning.

CI passed on final code `5b8ea86`: [StrideBrain CI 45947920383](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45947920383).

- Free evaluation: 112/112 in every round, 336/336 total.
- Accepted #79 raw-answer replay: 252/252; zero new provider calls, discards, wrong values or access violations.
- A replay: 33 recorded zero-match ledgers.
- Focused raw selections: three reordered partial-phrase answers and five partial-only selections now render without changing their selected facts. Whether a partial notice is appropriate remains a model-selection question and is scored separately.
- Full-run direct unreadable-job calls: three recorded calls now return the dedicated not-found sentence in free replay, keeping the recorded one-call count and different page context.
- Access/role/tenant/exclusion/redaction tests passed. Confirmed fields are bounded, reject repeated values, and recheck stale/forged/excluded context. AI-off behavior, failed-turn no-write behavior and keyboard chip resubmission are covered.

[Free evidence](evidence/free-verification.json).

## Browser evidence

Local production build at `5b8ea86`, real local PostgreSQL and server actions, **synthetic model transport only** (no provider call): English and zh-TW at 1440px and 390px; owner and Viewer. Confirmed Xinyi total NT$17,304,000; keyboard Enter selects its chip; partial notice sits below the card; retry sends the original question even after the composer was edited; Viewer receives no quote amount. Long findings render twelve rows and one remaining item. No page errors or horizontal overflow. Local server stopped after capture.

The first long-answer capture attempt used a synthetic transport that matched “findings” but not “finding”; it therefore supplied a stage selection and timed out waiting for the remaining count. The local transport was corrected and all four long-answer captures passed. No application change was needed for that test-fixture error.

[Browser checks](evidence/browser-checks.json), [Viewer checks](evidence/viewer-checks.json), [long-answer checks](evidence/long-checks.json).

| View | English | zh-TW |
| --- | --- | --- |
| Job chips, 390px | [image](evidence/en-job-chips-390.png) | [image](evidence/zh-TW-job-chips-390.png) |
| Confirmed answer, 390px | [image](evidence/en-confirmed-390.png) | [image](evidence/zh-TW-confirmed-390.png) |
| Partial notice, desktop | [image](evidence/en-partial-1440.png) | [image](evidence/zh-TW-partial-1440.png) |
| Retry, 390px | [image](evidence/en-retry-390.png) | [image](evidence/zh-TW-retry-390.png) |
| Twelve rows / remainder | [image](evidence/en-long-390.png) | [image](evidence/zh-TW-long-390.png) |
| Viewer, 390px | [image](evidence/en-viewer-390.png) | [image](evidence/zh-TW-viewer-390.png) |

## Paid evaluation

Model: `gemini-3.5-flash-lite`. Synthetic disposable GitHub Actions databases only. [Metered ledger](evidence/paid-summary.json).

| Run | Scope | English per round | zh-TW per round | Estimated USD |
| --- | --- | --- | --- | --- |
| [45945113457](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45945113457) | Checkout failed: short SHA treated as branch, evaluation skipped | — | — | 0 |
| [45945316940](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45945316940) | Focused 1, `40458b2` | 6/8, 6/8, 6/8 | 7/8, 7/8, 7/8 | 0.067421900 |
| [45945887094](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45945887094) | Focused 2, `6ff787d` | 7/8, 7/8, 7/8 | 6/8, 7/8, 6/8 | 0.068147100 |
| [45946406591](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45946406591) | Focused 3, `25fd0ac` | 7/8, 7/8, 7/8 | 7/8, 7/8, 7/8 | 0.073404700 |
| [45946752882](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45946752882) | Full, `332e00a` | 52/56, 53/56, 54/56 | 54/56, 55/56, 54/56 | 0.650108100 |

**Total US$0.859081800 of US$1.00.** One full run used; no further paid run. [Full report](evidence/full-paid.json), [per-question pass rates](evidence/paid-question-pass-rates.csv).

The full run returned 322/336 correct answers. All absolute question gates passed: zero wrong values, disclosures, unreadable-job answers or discards. Required cases were **197/210 (93.81%)**, below 97%, with four partial-answer cases below the two-of-three per-case minimum. The three wrong direct-job refusal copies were subsequently corrected and replayed for free; the original paid report remains unchanged. There is still no passing paid acceptance result.

Core scores were en 19/20, 20/20, 20/20 and zh-TW 20/20 in each round. All existing #79 required cases passed (126/126). New cases passed 23/28, 24/28, 24/28. Gating job drafts passed 16/16 per language in each round; the existing non-gating residential-placeholder report case passed 2/3.

| Round | Median calls | Within 3 calls | p90 ms | USD/question |
| --- | --- | --- | --- | --- |
| 1 | 2 | 111/112 | 2,037 | 0.001625791964 |
| 2 | 2 | 111/112 | 1,711 | 0.001636485714 |
| 3 | 2 | 112/112 | 1,688 | 0.001632758929 |

#79 baseline (accepted run 45804259788): median two calls; worst-round p90 2,428 ms; aggregate question cost US$0.3526312 / 252. Issue #81's 25% ceilings are 3,035 ms and US$0.001749162698 per question. Every full-run performance round passed. These are paid measurements at `332e00a`; the subsequent two server-only fixes were verified locally/free, not measured with another paid run.

## Remaining blocker / not verified

The model often selects the stage but omits the required partial notice when the same question also asks for client identity. It sometimes emits the notice without the requested stage. Four required cases score 0/3, 1/3, 0/3 and 1/3. The server deliberately does not infer question meaning from a word list to hide this failure. The full report also records one core quote-status answer missing its document-number selection; the core score still meets its threshold.

Hosted acceptance has not been run and waits for the Product Director, after the paid-selection blocker is resolved. No Test site workflow, hosted deployment, migration, seed or settings change was performed. PR #83 stays draft. Stop after the Builder report.
