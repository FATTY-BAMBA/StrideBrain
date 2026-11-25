# SB-067 verification

Draft PR: [#75](https://github.com/FATTY-BAMBA/StrideBrain/pull/75). Initial delivery and local full check: `1a4771c`; later review results are recorded below. Post-push CI is recorded in [the PR checks](https://github.com/FATTY-BAMBA/StrideBrain/pull/75/checks); this file records local evidence.

Implementation is locally verified in delivery order A → B → C. Hosted acceptance is waiting for the Product Director. The pull request stays draft. No hosted project or database was deployed, migrated, seeded or reconfigured. No model calls or paid evaluations were made.

## Behavior delivered

- The price list is a derived view over the latest issued/accepted version of each quote. No maintained price table. Draft, superseded, FINAL, note and percentage lines are excluded. The source query is scoped to the organization, active member and currently assigned readable jobs before grouping or counting; Viewer gets no prices.
- Description and unit use NFKC, trimming and pinned Unicode 15.1 full default case folding. Matching uses literal normalized substring search for typing/search, and exact normalized description/unit for history; no fuzzy matching. PostgreSQL 17 does not supply full `casefold`, so the new migration's pure identity function and the domain map are generated from the same pinned Unicode data and license. `node scripts/generate-price-identity.mjs --check` passes; tests compare every pinned mapping plus compatibility/whitespace examples.
- Eight suggestions after typing two characters or explicitly pressing Arrow Down at the end of the description (focus alone makes no read), five history rows, 50 price-list rows per page. Every displayed price links to its authorized source quote PDF; history additionally links to the job's Quote tab in the page language. History's Use this price changes only the price. Suggestion selection fills description/unit/price while retaining quantity and remarks. These remain ordinary editable inputs checked by existing server totals, save, audit and idempotency rules.
- Product Director's client decision: same-client items sort first, then prefix matches, most recent issue, and normalized keys as tie-breaks; but the selected/displayed main price is the newest readable price, identical to the list. A differing most recent price for this client also shows its date and source. The NT$3,500/NT$3,800 case is covered in database and component tests.
- Product Director's counting decision: times quoted counts distinct quotes. Identical prices within one quote collapse to one history row; different prices retain separate linked rows. The last item in document order supplies that quote's last price, including across sections.
- Comparison is beside the editor and loads independently over private HTTP, outside the editor's Server Action queue. GET never runs it; POST requires the configured same origin. Only explicit Run/Refresh creates the existing comparison/economics runs. States include not run/current/out of date/failure. Similar jobs show scores out of 100, and saved finding sentences use the shared renderer and linked source view. Current references can load asynchronously; saved recorded bases are carried unchanged. Refresh suggestions remains explicit and does not replace entered lines.
- Category reference amounts still combine ordinary items across all mapped sections, shown once per category. Use suggestion remains limited to categories whose mapped sections are all empty. Percentage fees remain outside section/category subtotals. The full comparison tab remains available.
- Home offers Draft quote for a new job without a comparison. It no longer falsely says a comparison was saved. Under the provisional review answer, Home no longer emits a COMPARE decision for any job or role. Comparison stays available in the Quote side panel and full comparison tab.
- The older run repositories stored results without an AuditEvent. Both completion transactions now write that event with actor, request and run identity. Tests require those events; denied review attempts still leave all state unchanged.

## Verified locally

- Delivery A: 19 tests / 3 files ([log](evidence/delivery-a.log)). Delivery B: 21 focused tests / 3 files ([log](evidence/delivery-b.log)). Final focused price/editor/panel verification: 52 tests / 9 files ([log](evidence/delivery-c.log)).
- Owner, assigned project manager, finance, Viewer, another organization, forged context, and revoked source assignment. No counts or same-client hints survive removal of source access.
- Issued/accepted revision choice, history deduplication, quote counts, cross-section ordering, search/paging bounds, literal wildcard characters, and Unicode normalization parity.
- English and Traditional Chinese component rendering; Arrow Down into suggestions, Escape back to the textarea, native button/link controls; retained quantity/remarks; stale async responses ignored; loading/empty/error states; read-only price-list table and Viewer page denial.
- No-comparison Home action, read without writes, explicit audited Run, exact bilingual saved sentences, viewer/source fingerprint staleness, source links, saving twice after comparison becomes stale, and save/input controls remaining usable while the panel loads, runs or fails.
- Real Prisma commands against a newly created disposable localhost database: `db:migrate`, `db:seed`, `db:verify`, then `db:seed` and `db:verify` again. All passed; database removed ([log](evidence/prisma-cli.log)). Earlier migrations were not edited.
- Full `npm run check` passed on 25 November 2026 (local Asia/Taipei), with 1,670 tests in 172 files and no skipped tests ([log](evidence/check.log)). Includes format, design tokens, lint, typecheck, the complete isolated-database suite and production build. The existing anonymous-default-export warning in prisma.config.ts is unchanged.

## Not verified

- Hosted acceptance and actual source-link/PDF clicks on the test site. Waiting for the Product Director to use the Test site workflow.
- Real-browser layout at 390px/desktop, visual appearance, zoom, screen-reader behavior and font/network rendering. This session exposes no supported local Computer Use/node_repl tool; no screenshots are claimed or fabricated. Component tests are not a browser visual check.
- Hosted latency, concurrent large-tenant load and production migration lock duration. The local 20,000-readable-line benchmark below covers one request of each kind, not hosted load.
- Paid AI evaluation: deliberately not run; #67 introduces no model call or assistant price-suggestion path.

## Product Director test-site checklist

1. Issue 天花板 / 坪 / NT$3,500; on another job type 天花 and select it. Confirm description, unit and price fill while quantity stays unchanged.
2. Issue NT$3,800 for another client; confirm newest price, separate first-client NT$3,500/date/source, both history entries, and quoted twice on the price list. Repeated equal-price lines in one quote count once; different-price lines preserve both history rows.
3. Repeat as 林美玲 with only assigned sources; as 吳凱 confirm no suggestions and price-list URL unavailable.
4. Open a new no-comparison job from Home's Draft quote action. Edit/save without Run; select a pricing category for a quote section and save before running the panel without navigating away; verify stale state after save and continue save/issue.
5. Check English/zh-TW, source links, two sections sharing a pricing category, 390px, keyboard and full comparison tab. Type 「天花」 using a Chinese input method: candidate Arrow Down/Escape must stay with the input method; no price read should start before composition ends. Confirm seeded findings/Home figures remain unchanged.

## Working-rule update — 25 November 2026

AGENTS.md now records the Product Director's GitHub comment workflow, owner-author check, early draft rule, provisional-answer handling, and chat automation with a three-fix-round nightly limit (initially 30 minutes, changed by the Product Director to 20 minutes during round 3). Its earlier check-before-opening wording is reconciled with opening a draft early. This is a documentation-only update; `git diff --check` passes. The application suite was not rerun for these documentation changes; its last full local result and CI evidence remain above/on the PR.

The active automation `stridebrain-review-follow-up` is attached to this chat and now checks every 20 minutes. Its initial backlog is the review below. It uses at most three round starts in any rolling 24 hours to enforce the nightly cap across midnight; it stops when PR #75 is merged or closed.

The owner-authored [review round 1](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7146871710) was the initial automation backlog. The working-rule-only update was not a fix round. Its implementation is recorded below.

Provisional decision awaiting the Product Director: remove Home's COMPARE decision entirely, including jobs with quotes and readers who cannot draft. The reviewer permits building on this answer; it remains pending confirmation before merge. Review round 1 applies it provisionally; confirmation remains required before merge.

The [issue answer](https://github.com/FATTY-BAMBA/StrideBrain/issues/67#issuecomment-7146079572) labels quote counting provisional, but the Product Director explicitly confirmed quote-based counting, history deduplication and last-document-line selection in this chat. That decision is implemented and tested; it is not awaiting another approval.

## Review round 1 — 25 November 2026

Started at 08:35 Asia/Taipei in [Builder comment 7148673394](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7148673394), after verifying the review author's GitHub account is the repository owner (`FATTY-BAMBA`, account 101108617). This is one fix round, addressing review items 1–7.

- Added `20261125083000_stored_price_identity`, without editing the earlier migration. PostgreSQL generates description/unit keys on insert and update, backfills existing lines, and refuses supplied key values. Modern view reads use the stored values; format-1 legacy descriptions retain the allowed dynamic path. Prisma ignores these SQL-owned columns on reads/writes. A runtime test temporarily replaces the normalizer with a throwing function: reading a modern issued line still succeeds. Another test migrates an existing issued line and verifies its snapshot stays identical.
- The view uses `security_invoker=true`, with a migration comment explaining future #42 policies. A local restricted-role test grants SELECT, applies a deny policy to QuoteItem, and proves the view returns zero rows to that role. No production grants or RLS policies are introduced by this PR.
- At round 1, suggestions/history used a private, bounded, same-origin GET endpoint (superseded by POST in round 2 below) with the existing capability, membership and job/source checks. Requests have a 10-second timeout and AbortSignal; changed inputs, closure and unmount abort the previous request. They no longer enter the Server Action queue. Tests cover private caching, input keys, origins, denial/error outcomes, cancellation and stale responses.
- Focus on a filled description makes no read. Typing or Arrow Down opens suggestions; Escape closes them. Round 2 limits Arrow Down to a collapsed caret at the end of the text. Suggestions sort by client, prefix, issue date, then exact keys. The list keeps its alphabetical order. Normalized keys use bytewise collation throughout grouping/sorting, consistent with exact identity and the existing final tie-break.
- The four new zh-TW strings now use 核發.
- Removed Home COMPARE decisions, including existing quotes and people without draft permission. Four-role and every-stage tests cover the removal; existing figures and saved findings stay covered by the complete suite. **This Home decision is provisional and awaits the Product Director's confirmation before merge.**

### Local price-read benchmark

[Reproducible test](../../../tests/price-list/performance-postgres.test.ts) / [recorded output](evidence/review-1-benchmark.log). PostgreSQL 17.12 in the localhost container, Node 24.22.3 on this Mac. Synthetic fixture: 100 readable quotes, one issued version and 200 ordinary items each, 20,000 readable lines total, 200 distinct item identities. One fixture is issued through the application; 99 copies are inserted as drafts and then issued in SQL in a disposable worker database. Generated keys are calculated by PostgreSQL. This measures application reads with transaction and membership/project authorization, after fixture insertion and ANALYZE; it is a warm local measurement, not a cold/hosted/concurrent load test.

| Read | Returned rows | Elapsed | Local target |
|---|---:|---:|---:|
| Suggestion (`Benchmark ceiling`, current job) | 8 | 192.04 ms | <200 ms |
| History (`Benchmark ceiling 000`, 坪) | 5 | 16.72 ms | <200 ms |
| First list page (`Benchmark ceiling`) | 50 | 116.77 ms | <200 ms |

The initial stored-key benchmark still took 329.26 ms / 17.68 ms / 201.70 ms. EXPLAIN showed repeated locale sorts and wide intermediate rows; using exact-key C collation and projecting needed columns produced the recorded results above. Counts remain 100 quotes per item. Timing is recorded as evidence rather than a machine-dependent CI assertion.

Validation after review changes:

- `npm run check` passes: **1,688 tests / 176 files, zero skipped**, plus formatting, design tokens, lint, typecheck and production build ([log](evidence/review-1-check.log)). The existing prisma.config.ts warning is unchanged. The first full run identified one older SQL-copy fixture trying to supply generated columns; it now copies only writable columns, preserving all of its freshness assertions. The final full run passes.
- `db:validate`, real `prisma migrate deploy`, `db:seed`, `db:verify`, then seed/verify again pass on a new disposable localhost database; it was removed ([log](evidence/review-1-prisma-cli.log)).
- Unicode generator parity check and `git diff --check` pass. Earlier migration files are unchanged. React review confirms effect cleanup aborts requests, stale responses are ignored, input/save state is independent, and the private response is not cached.
- CI for the pushed review commit is reported on the PR checks and in the Builder end-of-work comment.

 Hosted acceptance, real-browser appearance/390px/zoom/screen reader and actual PDF-link clicks remain waiting for the Product Director. No screenshots are claimed; no hosted operations, Test site workflow, model calls or paid evaluations were performed.

## Review round 2 — 25 November 2026

The owner-authored [review of 15bbe17](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7149190959) accepted all seven earlier fixes and requested three follow-ups. This round started at 09:09 Asia/Taipei in [Builder comment 7149262264](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7149262264), after verifying the author against repository-owner metadata. The checkout was clean and matched the PR head before editing.

- Private suggestion/history reads now POST JSON to the fixed `/api/quotes/prices` path, so typed descriptions and the job reference are in the request body rather than request URLs. The custom header, private no-store response, authorization before body parsing, current service/repository checks and cancellation stay. A same-origin Origin is required. The route rejects query content and reads at most 8,192 body bytes even when Content-Length is missing or false. It rejects malformed JSON, missing/repeated/unknown fields and invalid locale, and the existing domain validator still enforces each value. Tests ensure quotes resembling JSON keys inside a description are ordinary content. The price list's intentionally submitted GET search form is unchanged.
- Arrow Down opens/focuses suggestions only when both selection endpoints are at the text's end. A two-line description with the caret in its first line leaves the key unprevented and makes no request; a selected range also keeps native caret behavior. Focus alone still never reads, and end-of-text Arrow Down still opens suggestions.
- The request combines caller cancellation and its ten-second timeout using one AbortController, a listener and a timer. Cleanup releases the listener and timer after success, failure, cancellation or timeout; already-cancelled reads send nothing. A regression removes AbortSignal.any and verifies that a pending read still starts and can be cancelled. No AbortSignal.any or AbortSignal.timeout is needed by this request.

Focused tests: **20 tests / 3 files** passed ([log](evidence/review-2-focused.log)); typecheck passed. Full `npm run check` passes: **1,695 tests / 176 files, zero skipped**, plus formatting, design tokens, lint, typecheck and production build ([log](evidence/review-2-check.log)). Only the existing prisma.config.ts lint warning remains. The first full attempt crossed a confirmed local hibernation and had four time-dependent failures; a fresh complete run with idle sleep prevented passed. No test timeouts or assertions were relaxed. CI for this review commit is recorded on the PR checks and in the Builder report. No SQL, repository sorting or financial behavior changed, so the round-1 benchmark remains the relevant measured database result. No migrations were edited or added in this round.

Not verified in a browser: older Safari/iPhone behavior, actual multiline caret movement, layout/390px/zoom/screen reader, source/PDF clicks, hosted timings and the comparison Run time limit. These await the Product Director's test-site pass. The unit tests simulate missing AbortSignal.any; they are not a Safari device test. No hosted changes, Test site workflow, model calls or paid evaluation. The provisional removal of Home COMPARE decisions still awaits Product Director confirmation before merge.

## Review round 3 — 25 November 2026

The owner-authored [review of 90ce59c](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7150651144) accepted the round-2 fixes and requested IME composition support. This third round started at 10:37 Asia/Taipei in [Builder comment 7150970261](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7150970261), after verifying the owner account and a clean checkout matching the PR head. All three round starts are now used within the current rolling 24-hour window.

- The description handler leaves keydown untouched when the native event is composing, keyCode is 229, or a composition is tracked. Arrow Down and Escape neither prevent the input method's default handling, move focus, nor close existing suggestions.
- Composition start suspends suggestion reads and any already-open price history. The effect cleanups cancel an earlier debounce or in-flight read. Interim text such as 「ㄊㄧㄢ」 is not queried. Composition end commits the textarea value; 「天花」 starts one debounced suggestion read, including when a browser sends a final input event after compositionend. A one-character committed value does not query suggestions. An open history resumes for the committed value separately.
- Per the Product Director's direct instruction in this chat, the active automation now checks every **20 minutes** rather than 30. AGENTS.md and the saved automation agree; the owner check, three-round cap and hosted restrictions are unchanged.

Focused regressions: **45 tests / 4 files** passed ([log](evidence/review-3-focused.log)); typecheck passed. They cover both IME key signals plus tracked composition, focus/list preservation, multiple paused interim-text changes, a single committed suggestion request, the two-character minimum, cancellation of existing debounce/requests, and an open history. Full `npm run check` passes: **1,706 tests / 176 files, zero skipped**, plus formatting, design tokens, lint, typecheck and production build ([log](evidence/review-3-check.log)). Only the existing prisma.config.ts lint warning remains. CI for the pushed commit is recorded on the PR checks and in the Builder report. No migration, request transport, repository or financial calculation changed.

Not verified: a real 注音/倉頡/拼音 candidate window, browser/device-specific composition ordering, older Safari/iPhone, or hosted acceptance. The Product Director checklist above now includes typing 「天花」 with a Chinese input method. No hosted changes, Test site workflow, model calls or paid evaluation. Test-site acceptance and confirmation of the provisional Home decision still await the Product Director.

## Review round 4 — 25 November 2026

The owner-authored [hosted review of 39980d3](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7151932492) reported a blocking panel POST failure and five follow-ups. The Product Director then directly asked in this chat to read and fix the latest review, authorizing work now despite the scheduled-round cap. [Start comment 7153320347](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7153320347) records round 4 at 12:57 Asia/Taipei. The checkout was clean and matched the draft head before editing.

- Empty POST bodies: the route now reads the body stream and rejects the first actual byte, without buffering the rest. A real Next HTTP POST has a stream even when empty. Same-origin, signed identity, capabilities and source authorization are retained. Tests cover absent/empty stream/empty chunk and non-empty whitespace, JSON and larger input.
- Real HTTP regression: a local Next server uses the managed disposable worker database and synthetic signed sessions. Run and Refresh accept zero-byte POSTs and persist audited runs; GET returns the result without writing. Price suggestions pass through the real private route and repository. Viewer and anonymous requests are denied. Against the original route, the Run regression fails with the reported 404 while the other two HTTP tests pass ([negative control](evidence/review-4-http-negative-control.log)); against the fix it passes. This is transport/application/database evidence, not a browser test. The test's initial loopback origin mismatch and price-string expectation were corrected to match Next's localhost normalization and the existing trimmed-price contract; no security check or amount assertion was relaxed.
- Incomplete context now carries its typed missing fields. Missing COMMERCIAL_CATEGORIES tells the person in both languages to choose a pricing category for the quote sections and save before Run. The acceptance checklist above now includes that prerequisite. A saved uncategorized section still returns CONTEXT_INCOMPLETE; the gate is unchanged.
- The comparison panel is the sole findings list. **Removing the older list under quote issue is provisional and awaits Product Director confirmation**, like the earlier Home decision. The issue review's comparison reminder and Confirm and issue action remain. Bilingual component tests check the sentence occurs once and the old list is absent.
- Suggestions are positioned below the item row and span its full width within the existing table scroll region. Description/unit, linked price and date/client flow horizontally; a different client price uses a following line. Keyboard, focus, caret and IME regressions still pass. The table header stays above the popup while scrolling. DESIGN_SYSTEM.md records this behavior.
- Save success keeps its confirmation and drops the comparison link in both languages. The panel returns only the selected jobs used by the saved economics (or the structural default selection when economics is absent), with original scores/links and unchanged finding sentences. The database test checks the selected set against the stored enrichment instead of displaying all six matches, including a selected job in the broader-match tier.

### Local panel-read investigation

[Timing test output](evidence/review-4-read-timing.log). Warm PostgreSQL on localhost, Node 24, synthetic fixture; includes the application calls below, not hosted network/runtime latency. SQL counts include transaction and authorization queries. No ranking/economics run is triggered by READ; tests verify the run count is unchanged.

| Read path | Quote view | Saved findings/freshness | Optional preparation | Total |
|---|---:|---:|---:|---:|
| Read-only Xinyi quote | 14.40 ms / 21 queries | 16.20 ms / 20 queries | Not needed | 31.09 ms / 41 queries |
| Editable manual draft | 17.31 ms / 21 queries | 14.48 ms / 20 queries | 71.43 ms / 75 queries | 103.45 ms / 116 queries |

The real Next warm HTTP GET took 169.52 ms in the focused run ([log](evidence/review-4-focused.log)), including signed-session/catalog resolution and HTTP overhead. The editable path spends most local application time preparing references, which reads job/comparison/source data again. The serial read stages and SQL count make database round-trip latency a plausible contributor to the reviewer's 2.2–2.6 seconds, but no hosted profiling was performed and this does not establish the hosted cause. A future performance change should batch repeated authorization/catalog/source reads within a request while preserving every freshness/source-access check. No cross-request caching or gate weakening was introduced.

### Verification and remaining acceptance

Focused checks: 56 tests / 6 files passed before adding the timing test; the timing suite separately passed 5 tests. After adding the selected broader-match regression, the service suite passed 6 tests ([log](evidence/review-4-final-service.log)). Final `npm run check` passes: **1,720 tests / 177 files, zero skipped**, plus formatting, design tokens, lint, typecheck and production build ([log](evidence/review-4-check.log)). Only the existing prisma.config.ts lint warning remains. Post-push CI is recorded on the PR checks and in the Builder report. The timing fixture initially reused one request id for two separate Run commands, correctly hitting the existing unique-request constraint; it now supplies a fresh request id per command. No assertion or production uniqueness rule was weakened.

The reviewer reported successful owner tests on 39980d3 for newest/client price selection, history, quote counts/search, keyboard selection, Home figures, current/stale states, saving while stale, English and 390px without page overflow, generated keys/invoker security and audit writes. Those are reviewer-reported results on the earlier commit; they do not verify this revision. The blocking Run/Refresh acceptance must be repeated after the Product Director puts this revision on the test site.

Not verified: hosted retest; actual suggestion popup dimensions/appearance on desktop and 390px, zoom or screen reader; real Chinese IME; older Safari/iPhone; assigned manager/Viewer on the test site; hosted timings. No supported local Computer Use/node_repl tool is exposed, so no browser screenshots are claimed. No hosted deployment/migration/seed/settings, Test site workflow, model call or paid evaluation. The negative-zero discount and settings-column placement were expressly noted outside this PR and were not changed. PR stays draft pending Product Director acceptance and the two provisional decisions.
