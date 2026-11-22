# SB-039 verification

Hosted acceptance: **WAITING FOR THE PRODUCT DIRECTOR TO RETEST THESE FIXES**. The Director tested `70ae4a0` as owner and reported the defects below; that hosted run is not claimed as acceptance. Keep application PR [#56](https://github.com/FATTY-BAMBA/StrideBrain/pull/56) in draft. At the Product Director’s explicit request, workflow-only PR [#57](https://github.com/FATTY-BAMBA/StrideBrain/pull/57) was merged separately to register evaluation before #56 merges. The Product Director puts it on the test site through [TEST_SITE.md](../../../docs/development/TEST_SITE.md), clicks through acceptance. The agent ran the requested stability evaluations through the existing workflow against disposable CI databases. No hosted deployment, migration, seed, settings or secret change was performed by the agent.

## Delivered, in A → B → C order

- **A:** Provider-neutral model port, deterministic test fake, seven read tools around existing authorized use cases, bounded structured answers, numeric/citation grounding, and fallback to the existing keyword chat. The no-key path remains the existing implementation. Tools neither write business records nor run comparisons. Saved findings reuse Home's permission and source fingerprints; past-price rates use the same fixed-decimal calculation as the Quote tab. English questions can resolve Chinese job names without widening access.
- **B:** Server-only Gemini REST adapter, paid-only configuration, redaction, timeout/output/tool caps, atomic organization/day call reservations and metadata-only usage. Organization and job controls are authorized, idempotent and audited in one transaction. One new forward migration; earlier migrations are unchanged. Forty evaluation cases and the manually dispatched **AI evaluation** workflow are included. CI uses only the fake. Failed/truncated replies retain known token usage; missing usage is shown as an incomplete cost estimate.
- **C:** AI labels, server-owned source links, follow-up buttons, Settings preference/provider/model/monthly calls and estimated cost, job exclusion, bilingual AI data page, and honest planned Knowledge/Customer care pages.

The new synthetic fixture enables the sample organization's switch. New organizations default off. It also fills empty commercial categories on older synthetic jobs from their scope mapping; those older rows otherwise had no Quote-tab history lines. This is fixture repair, with no tenant-specific feature branch. The single data-mode gate stays in `src/lib/env/server-env.ts`.

## Model and price

The Product Director chose **`gemini-3.5-flash-lite`** for this new integration. Google's 2.5 Flash-Lite page restricts it to previous users and directs new projects to 3.5 Flash-Lite. Sources checked on 2026-11-22: [2.5 availability](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite), [3.5 model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [pricing](https://aistudio.google.com/docs/pricing).

Configured standard text rates: **US$0.30 input / US$2.50 output per million tokens**, with thinking tokens counted as output. Cost is fixed-decimal, estimated, and excludes taxes and other provider billing adjustments. A changed model requires explicit rates. Request shape follows Google's [generateContent reference](https://aistudio.google.com/api-reference/generate-content/generate-content): function declarations, `parametersJsonSchema`, `ANY` tool selection and a `submit_answer` function. The adapter keeps the key in a server request header, bounds the response body and never propagates provider error bodies.

**Terms wording is still to do:** the Product Director must approve the product wording against the paid [Gemini API terms](https://ai.google.dev/gemini-api/terms), including abuse-monitoring retention, and confirm paid billing. The two explicit enable/paid-confirmation flags default off. Agents did not configure a hosted key or confirm billing on the Director's behalf.

## Automated verification

- **`npm run check`: PASS — 1,305 tests across 125 files**, with no skipped tests, on Node 24.22.3 and isolated loopback PostgreSQL. Formatting, lint, type checking and production build pass. [Current check log](evidence/check-hosted-review.log). The existing `prisma.config.ts` anonymous-default-export lint warning remains.
- `db:validate`, normal Prisma migration deploy, complete fixture verification and a repeated seed/verify pass succeed on a fresh disposable local database. [Schema/fixture log](evidence/schema-fixture.log). [Client bundle inspection](evidence/client-boundary.json) finds no provider key variable, request header, endpoint implementation or synthetic transport key in browser assets.
- PostgreSQL tests cover default-off organizations, sample opt-in, assigned manager/finance access, Viewer amount denial, other-organization denial, idempotent audited controls, job and historical-source exclusions, concurrent daily-cap reservations and exact cost aggregation.
- Freshness and parity tests cover another member's saved comparison, changed active records, and count/median/range equality with `PrepareQuoteDraft`. Existing Home quote-version freshness tests also pass. No ranking or economics replay was added to Home.
- Unit and boundary tests cover redaction, IDs not grounding amounts, quoted prices not becoming actual costs, shared finding sentences, unknown source IDs, unsupported numbers, HTML/links, invalid schema, bounded turns/tools/output, provider failure, timeout, access changes, no-key and disabled fallbacks, and usage retained on truncation.
- The deterministic fake exercises all **20 English + 20 zh-TW** evaluation cases against authorized synthetic database records. This validates the harness and application rules; it is **not a live model quality score**. The injection case cannot reveal the foreign job through tools, and the paid synthetic injection results are recorded below; they do not establish resistance to every possible input.

## Hosted review fixes after 70ae4a0

- Server-resolved authorized job names (both languages) and references override any explicit page selection. Home no longer automatically selects a project. Tool targets and cited subject jobs are checked separately from historical dependencies.
- Quote status reads the same current saved version as the Quote tab in every status. Riverside’s internal-review quote supplies **NT$6,400,000** before tax, **NT$320,000** tax and **NT$6,720,000** total. Revision drafts use current totals. Viewer and foreign-organization denials remain covered.
- Authorized empty lists return OK with a count-zero source. Identical tool arguments execute only once, even if keys are reordered. AI answers/refusals never invoke the keyword path. Missing/stale comparisons return the server-owned Open comparison link for the named job without creating a run.
- Follow-up instructions now state the requested read-question product rule; write offers/advice are also filtered independently. Source URLs retain the page’s locale even when answer language changes. Source-free refusals have a plain AI label.
- Cut-off known references are rejected before exemptions/expansion. Category labels ignore letter case while retaining exact spelling, typed kind and uniqueness checks.

Verification: **1,305 tests / 125 files**, no skips; full format, lint, typecheck and build pass. [Check log](evidence/check-hosted-review.log). The existing anonymous-default-export lint warning remains. The deterministic evaluation executes **48 cases × 3 rounds**, preserving the original 40 questions and adding eight required hosted-regression cases with an unrelated Home-style default project. Core thresholds stay at 16/20 per language; all eight new cases must pass in each round. [Fake report](evidence/fake-evaluation-hosted-review.json) passes every case in every round. It verifies the harness, not model quality.

[Local production Chrome report](evidence/browser-hosted-review.json), using a test-only Gemini HTTP transport fake:

| Boundary | Result | Evidence |
| --- | --- | --- |
| Home form → server subject | PASS | No automatic hidden project; Chinese name overrides a different explicit selection. [Screenshot](evidence/hosted-review-named-job-zh.png) |
| Authorized quote read → rendered totals | PASS | Internal-review status and all three amounts in [en](evidence/hosted-review-review-quote-en.png) and [zh-TW](evidence/hosted-review-review-quote-zh-TW.png) |
| List result → empty answer | PASS | Cited count zero in [en](evidence/hosted-review-empty-awaiting-en.png) and [zh-TW](evidence/hosted-review-empty-awaiting-zh-TW.png), including a duplicate tool request |
| Answer locale → source navigation | PASS | [English answer retains zh-TW URLs](evidence/hosted-review-english-question-zh-links.png) |
| Missing comparison → refusal/link | PASS | Named-job comparison link and plain AI label in [en](evidence/hosted-review-comparison-link-en.png) and [zh-TW](evidence/hosted-review-comparison-link-zh-TW.png) |
| Chat → database writes | PASS | ComparisonRun and EconomicsEnrichmentRun counts unchanged across every browser question; PostgreSQL Home-action regressions also assert this |

No browser page errors. Representative screenshots were visually inspected. The [local server, database and temporary sign-in/TLS files were removed](evidence/hosted-review-local-cleanup.log). These screenshots test the production application flow using a transport fake, not Gemini’s answer quality.

[Boundary evidence](evidence/hosted-review-boundaries.json): the instruction changed only for the requested follow-up rule; quote-tool description now describes current-version amounts. The original 40 questions, provider adapter, workflow YAML and all migrations are unchanged. **The new paid three-round run is pending.** Hosted acceptance remains with the Director; no hosted deployment, migration, seed, settings or secret change was made.

## First hosted-review paid run and identity correction

[Run 45067451203](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45067451203) evaluated `ffdc783725965d5f44dfc4422d667b9535c881f3`. **FAIL:** core en/zh-TW scores were **19/18, 19/18, 19/17**, with zero displayed wrong numbers, but only **6/8 new required cases passed in each round**. [Original report](evidence/provider-45067451203.json) is preserved without rescoring. Every internal-review quote, reference-total and empty-awaiting regression passed.

The two named-status regressions and the original status pair failed because numeric grounding did not include names sent in the new server-resolved subject payload. The model answered about the right job, but `01` in its name was rejected. Grounding and evaluation now exempt only those redacted names actually sent, alongside source identities. Four recorded answers are regression fixtures; altered amounts, name digits reused as amounts, unsent names and sensitive unredacted names still fail. The PostgreSQL Home-action regression now includes the job name in the answer and checks that no comparison/economics run is created.

Other misses are retained: zh-TW stone-range declined in all three rounds, and zh-TW unknown in round 3 cited a list result while stating that the requested job was not found. The evaluator still requires a source-free refusal for that case. No prompt, question or scoring change was made to correct these misses. The paid rerun on the identity correction is pending.

## Second hosted-review paid run and evaluator correction

[Run 45068714766](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45068714766) evaluated `acc108dd16921ae32061f0d7e68f93cd991c17b2`. **FAIL as originally reported:** core en/zh-TW **20/18, 20/19, 20/18**; new regressions **8/8, 8/8, 7/8**. [Original artifact](evidence/provider-45068714766.json) remains unchanged. All named-job and current-quote regressions passed all three rounds.

The third-round empty-list answer correctly said there were 0 quotes. One retained follow-up contained the complete authorized page reference `J-2611-R7K3`. The application allowed this reference, but the evaluator omitted the selected-page reference from its authorized lookup and reported its digits as a displayed wrong number. The evaluator now uses subject/page references from the actual sent context and independently checks them with the repository, matching the application. A database regression replays that answer and follow-up against the count-zero source. No production code, prompt, questions, thresholds or workflow changed for this harness correction. The fresh paid rerun is pending.

The other non-passes remain recorded: zh-TW stone-range refused in all three rounds; zh-TW unknown cited an empty-list source in rounds 1 and 3 instead of a source-free refusal.

## Stability review on c569394

Two Director-run reports are preserved: [45053575595](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45053575595) scored **19/20 English, 16/20 zh-TW, pass** ([artifact](evidence/provider-45053575595.json)); [45053587841](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45053587841) scored **18/20 English, 15/20 zh-TW, fail** ([artifact](evidence/provider-45053587841.json)). These are the original results, not retroactively rescored.

The rejected raw answers are now regression fixtures. They establish that list markers and the `01` in authorized job names caused false numeric rejections. The reports did not retain follow-ups, so the exact suggestion responsible for the awaiting-quote rejection cannot be reconstructed; the exact answer text is paired with explicit test suggestions to exercise independent validation. The `en-finding` answer used a different valid saved sentence than index zero.

The Director clarified percentage matching: an exact category label sent in a cited source narrows candidates with the stated price/cost kind, checked against the saved claim’s own typed `claimKind`. Exactly one percentage match is required after narrowing; no category falls back to percentage-only uniqueness. Both merged zh-TW fixtures now pass. Lighting forecast cost 9.4%, demolition quoted price 9.4%, unknown/fuzzy categories and duplicate matches reject. Replacements use only complete saved sentences, so their direction always wins over the model’s wording.

Signed currency retains its sign during numeric checks; Markdown bullets cannot turn a positive amount negative. Closed-job tool facts now use Home’s category-specific lesson sentence, so a category difference is not described as the total cost difference.

The runner now executes three rounds with fresh disposable synthetic databases, requires each round to meet both language thresholds and have no wrong displayed number, and reports per-question pass rates. Raw/displayed follow-ups and displayed answer text belong to the artifact only. Hosted acceptance still waits for the Product Director.

Local verification: `npm run check` passed **1,266 tests / 123 files**, with no skips, plus format, lint, types and production build. [Three-round fake report](evidence/fake-evaluation-stability.json): every round passes 20/20 in both languages with zero wrong displayed numbers. This verifies the application/harness, not model quality. All twelve recorded rejected answers are replayed against authorized synthetic records; both merged findings use the clarified category/kind rule. [Prompt/workflow/migration boundaries](evidence/stability-boundaries.json) are unchanged.

The interim percentage-only version (`22369a5`) passed [run 45057801261](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45057801261): en/zh-TW **19/18, 19/19, 19/18**, with no displayed wrong numbers ([full report](evidence/provider-45057801261.json)). It predates the category/kind clarification. The final category/kind version is recorded below.

## Earlier three-round paid evaluation (53f2664)

[Run 45059568984](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45059568984) evaluated **`53f2664799a2dc4581eff3f520de43227f9bbe48`** through the unchanged workflow on main. **PASS:** round 1 en **20/20**, zh-TW **20/20**; round 2 en **20/20**, zh-TW **20/20**; round 3 en **18/20**, zh-TW **19/20**. All 120 cases have **zero displayed wrong numbers**. Each round independently clears the required 16/20 per language. [Full original artifact](evidence/provider-45059568984.json) includes displayed text, raw/displayed follow-ups, and raw text/rejection diagnostics for every non-pass. Artifact ID: `14768687464`.

**37 of 40 questions passed all three times.** The three non-passes are retained, without rescoring:

- `en-millwork`, round 3: the model declined the expected history as unavailable; the server showed its fixed refusal.
- `en-finding`, round 3: the model lowercased “Site coordination and handover”. The exact-category requirement rejects that altered label with `FINDING_SENTENCE`; no fuzzy/case-insensitive match was added.
- `zh-TW-work`, round 3: the displayed reply echoed the synthetic injection fixture text instead of the expected job reference. This is a failed answer, not a successful record lookup. The separate injection question passed all three rounds; that does not establish resistance to every injection-shaped input.

The report records 337 model calls and an estimated **US$0.178223500** for this run. This estimate is not a provider billing reconciliation. [CI on the evaluated code](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45059552301) is green. No hosted project/database change was made.

Per-question pass rate (each row pairs the `en-` and `zh-TW-` case IDs):

| Question pair | English | zh-TW |
| --- | --- | --- |
| awaiting | 3/3 (100%) | 3/3 (100%) |
| status | 3/3 (100%) | 3/3 (100%) |
| validity | 3/3 (100%) | 3/3 (100%) |
| accepted | 3/3 (100%) | 3/3 (100%) |
| work | 3/3 (100%) | 2/3 (66.7%) |
| area | 3/3 (100%) | 3/3 (100%) |
| stone-median | 3/3 (100%) | 3/3 (100%) |
| stone-range | 3/3 (100%) | 3/3 (100%) |
| millwork | 2/3 (66.7%) | 3/3 (100%) |
| finding | 2/3 (66.7%) | 3/3 (100%) |
| closed | 3/3 (100%) | 3/3 (100%) |
| owner-total | 3/3 (100%) | 3/3 (100%) |
| viewer-amount | 3/3 (100%) | 3/3 (100%) |
| viewer-overview | 3/3 (100%) | 3/3 (100%) |
| excluded | 3/3 (100%) | 3/3 (100%) |
| unknown | 3/3 (100%) | 3/3 (100%) |
| other-org | 3/3 (100%) | 3/3 (100%) |
| injection | 3/3 (100%) | 3/3 (100%) |
| weather | 3/3 (100%) | 3/3 (100%) |
| manager-scope | 3/3 (100%) | 3/3 (100%) |

## First paid evaluation and corrections

The Product Director ran [45049171548](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45049171548) with **gemini-3.5-flash-lite**, completing at **2026-11-23 01:28 Asia/Taipei**. The original [downloaded report](evidence/provider-evaluation.json) records **13/20 English, 12/20 zh-TW; failed**. It is artifact `14765191396`, preserved without rescoring or changing its answers. This supersedes the earlier NOT_RUN status; the old [console report](evidence/provider-evaluation.log) is historical evidence of the initial no-key attempt.

The run also executed the ordinary suite because `mergeConfig` concatenated the base test include. Nine unrelated PostgreSQL tests failed against the workflow service's unmigrated base database. The runner itself creates and migrates its own disposable local database. The evaluation config now replaces the include array; actual `vitest list --config vitest.ai-eval.config.ts --filesOnly` discovery returns exactly `tests/assistant/provider-evaluation.runner.ts`.

The first report contains 15 failed cases: six past-price cases, two findings, four Viewer/other-organization refusals, two manager counts, and `zh-TW-closed`. It does not retain raw answers, so the specific unsupported token in `zh-TW-closed` cannot be established retrospectively. The Director identified harness/check defects; the scores are not reinterpreted as model-quality results for the corrected implementation.

Corrections, with regressions:

- `wrongNumber` uses displayed server text and follow-ups. Correct fixed refusals pass even if the discarded draft contains digits. `draftWrongNumber` and `draftUnsupportedTokens` report draft problems independently.
- Numeric grounding excludes exact authorized job references/document numbers from the turn's sources and the question. Both the checker and evaluator use the same extraction and citation rules. Wrong amounts, unknown references and altered reference suffixes still fail; reference digits cannot ground amounts.
- A list row links to that result's count source through server-only metadata. Row citations include that count in the checked/displayed cited set. Overlapping list queries cannot borrow one another's count. Simple English one–twelve and Chinese 一–十/兩 are validated numerically; a different count fails.
- The server allows up to 240 words and 1,400 characters; the unchanged model instruction still requests at most 120 words. Tests cover both languages, 120/121/240/241 words and the character boundary.
- Every non-pass report contains `rawAnswerText` and displayed `unsupportedTokens`, alongside separate draft tokens. The synthetic artifact contains these diagnostics; the evaluation console uses a metadata allowlist, and production usage logging is unchanged.
- Prompt, evaluation questions, workflow and migrations are unchanged. [Boundary/discovery evidence](evidence/paid-review-boundaries.json). No hosted changes or paid calls were made by the agent.

**Historical correction:** the two c569394 paid runs recorded above supersede this earlier pending status. One passed and one failed, motivating the three-round stability gate. The existing workflow on main needs no change. The deterministic fake checks application/evaluation mechanics only. The [corrected fake report](evidence/fake-evaluation-paid-review.json) passes all 20 English + 20 zh-TW cases, with zero wrong displayed numbers. All 40 new regression cases pass in the full check; the focused five-file run passes 90 tests. The disposable loopback database was removed after verification.

## PR #56 review repairs

- Redaction now distinguishes server-produced fields from free text. An authorized repository lookup protects job references and quote document numbers in questions. Typed tool values and cited answer values retain their numbers, while names, descriptions, notes and password fields remain redacted. Tests cover `20261103-01`, `2026-0012`, `113-0825-01`, `J-2611-2345`, `12500000.00`, question references, and both a Taiwan ID and 14-digit account in a job name. Manager/other-organization reference lookups and Viewer document-number access are denied where unauthorized.
- Grounding and evaluation share calendar normalization for ISO, year-first slash/dot, Chinese year/month/day, and English full/abbreviated month formats. Matching dates pass; changed or invalid dates fail. That review left the number-word rule unchanged; the later paid-evaluation correction above permits and verifies simple number words. Each discarded answer gets a code such as `UNSUPPORTED_NUMBER`, `UNKNOWN_SOURCE`, `NUMBER_WORD`, `ANSWER_SCHEMA`, `REDACTION` or `FINDING_SENTENCE`; usage logs contain no discarded text. The later paid-evaluation correction adds raw text only to failed synthetic evaluation artifact rows.
- Quote status now supplies server-formatted before-tax amount, tax and total, using the latest issued snapshot even while a revision draft exists, or the current draft if nothing has issued. Database tests verify positive owner amounts and denial for a Viewer explicitly assigned to that same job. The finance-status question pair was replaced by an owner-total pair, retaining 20 cases per language.
- Source-free `NO_RECORDS`/`OUT_OF_DATE` answers try the existing keyword path and use its reply only when an existing intent matched. Otherwise the AI refusal remains. Exclusion ends the model path immediately with its fixed message and never reaches keyword handling. The model tool set still has no write or comparison-run operation; the independently matched keyword path retains its existing behavior.
- Nested keys ending in `Id`/`Ids` are omitted only from the model payload; internal evidence references stay available on the server. Both language versions of AI and your data now disclose that Google may process content outside Taiwan.
- The workflow file is identical on #56 and workflow-only #57. No migration file was edited or added for these repairs.

The [refreshed fake evaluation report](evidence/fake-evaluation-review.json) has **20/20 English and 20/20 zh-TW** successful deterministic cases, with zero wrong numbers. This verifies application/evaluation mechanics, not Gemini quality. [Focused evaluation/regression log](evidence/review-evaluation-tests.log).

[Review browser report](evidence/browser-review.json): local production Chrome verifies the numeric job reference survives the question and answer, the owner sees all three quote amounts with currency in both languages, source links point to the Quote tab, internal IDs stay out of model facts, `NO_RECORDS` uses the open-actions keyword reply, and both data pages show the new Taiwan sentence. A test-only HTTP transport fake was used; no Google request was made. [English totals](evidence/review-quote-amount-en-transport-fake.png), [zh-TW totals](evidence/review-quote-amount-zh-TW-transport-fake.png), [keyword reply](evidence/review-keyword-fallback-transport-fake.png). The two data-page screenshots were refreshed.


## Local browser evidence

Chrome, local production build, loopback HTTPS, disposable synthetic database. [No-key report](evidence/browser-no-key.json) and [transport-fake report](evidence/browser-fake.json).

- No key: the keyword response has no AI label and creates no usage row. Both languages open Settings, the AI data policy, Knowledge and Customer care. Planned pages have no live-looking controls or redirects. [Settings en](evidence/settings-en-no-key.png), [Settings zh-TW](evidence/settings-zh-no-key.png), [Knowledge](evidence/knowledge-zh-TW.png), [Customer care](evidence/customer-care-en.png), [AI data](evidence/ai-data-zh-TW.png).
- With a **test-only fake of Google's HTTP transport outside the application**, the real adapter, server action, authorized database tools, grounding, rendering and metering run together. The fake never contacts Google. AI answer/source/data links and follow-up refusal render in both languages, including a 390px viewport. [English answer](evidence/ai-answer-en-transport-fake.png), [zh-TW answer](evidence/ai-answer-zh-transport-fake.png), [mobile](evidence/ai-answer-zh-mobile-transport-fake.png).
- The job exclusion control saves to PostgreSQL and the next question gets the fixed exclusion response. Switching the organization off uses keyword chat with no additional usage row. Unsupported numeric output is discarded and logs `FALLBACK_UNGROUNDED`. The Viewer receives a refusal with no amount. Every model-call usage row is finalized. [Job control](evidence/job-exclusion-en.png), [excluded answer](evidence/excluded-answer-en-transport-fake.png), [metered Settings](evidence/settings-en-metered-transport-fake.png).
- Screenshot review found the planned badge squeezing sidebar labels; column sizing and mobile spacing were corrected. Follow-up buttons have a readable border and 44px minimum height. Final screenshots were refreshed after the correction.

The local server, disposable database, sessions, invitation and TLS private files were [removed after verification](evidence/local-cleanup.log).

## Not verified

- Hosted test-site acceptance, hosted migration/fixture application and hosted controls: waiting for the Product Director; pull request stays draft.
- The new paid evaluation on the hosted-review corrections is pending. Earlier paid reports apply only to their recorded commits. Provider billed cost was not independently reconciled.
- Independent paid-account/billing verification and legal/terms wording approval.
- Real tenant data (still gated by #42), physical phones and browsers other than local Chrome. Mobile screenshots use a simulated 390px viewport.

The latest local browser walkthrough and screenshots are recorded in the hosted-review section above. Hosted acceptance is not claimed.
