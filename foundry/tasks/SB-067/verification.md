# SB-067 verification

Draft PR: [#75](https://github.com/FATTY-BAMBA/StrideBrain/pull/75). Implementation and local full check: `1a4771c`. Post-push CI is recorded in [the PR checks](https://github.com/FATTY-BAMBA/StrideBrain/pull/75/checks); this file records local evidence.

Implementation is locally verified in delivery order A → B → C. Hosted acceptance is waiting for the Product Director. The pull request stays draft. No hosted project or database was deployed, migrated, seeded or reconfigured. No model calls or paid evaluations were made.

## Behavior delivered

- The price list is a derived view over the latest issued/accepted version of each quote. No maintained price table. Draft, superseded, FINAL, note and percentage lines are excluded. The source query is scoped to the organization, active member and currently assigned readable jobs before grouping or counting; Viewer gets no prices.
- Description and unit use NFKC, trimming and pinned Unicode 15.1 full default case folding. Matching uses literal normalized substring search for typing/search, and exact normalized description/unit for history; no fuzzy matching. PostgreSQL 17 does not supply full `casefold`, so the new migration's pure identity function and the domain map are generated from the same pinned Unicode data and license. `node scripts/generate-price-identity.mjs --check` passes; tests compare every pinned mapping plus compatibility/whitespace examples.
- Eight suggestions after typing two characters or explicitly pressing Arrow Down (focus alone makes no read), five history rows, 50 price-list rows per page. Every displayed price links to its authorized source quote PDF; history additionally links to the job's Quote tab in the page language. History's Use this price changes only the price. Suggestion selection fills description/unit/price while retaining quantity and remarks. These remain ordinary editable inputs checked by existing server totals, save, audit and idempotency rules.
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
4. Open a new no-comparison job from Home's Draft quote action. Edit/save without Run; run the panel without navigating away; verify stale state after save and continue save/issue.
5. Check English/zh-TW, source links, two sections sharing a pricing category, 390px, keyboard and full comparison tab. Confirm seeded findings/Home figures remain unchanged.

## Working-rule update — 25 November 2026

AGENTS.md now records the Product Director's GitHub comment workflow, owner-author check, early draft rule, provisional-answer handling, and 30-minute chat automation with a three-fix-round nightly limit. Its earlier check-before-opening wording is reconciled with opening a draft early. This is a documentation-only update; `git diff --check` passes. The application suite was not rerun for these documentation changes; its last full local result and CI evidence remain above/on the PR.

The active automation `stridebrain-review-follow-up` is attached to this chat and checks every 30 minutes. Its initial backlog is the review below. It uses at most three round starts in any rolling 24 hours to enforce the nightly cap across midnight; it stops when PR #75 is merged or closed.

The owner-authored [review round 1](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7146871710) was the initial automation backlog. The working-rule-only update was not a fix round. Its implementation is recorded below.

Provisional decision awaiting the Product Director: remove Home's COMPARE decision entirely, including jobs with quotes and readers who cannot draft. The reviewer permits building on this answer; it remains pending confirmation before merge. Review round 1 applies it provisionally; confirmation remains required before merge.

The [issue answer](https://github.com/FATTY-BAMBA/StrideBrain/issues/67#issuecomment-7146079572) labels quote counting provisional, but the Product Director explicitly confirmed quote-based counting, history deduplication and last-document-line selection in this chat. That decision is implemented and tested; it is not awaiting another approval.

## Review round 1 — 25 November 2026

Started at 08:35 Asia/Taipei in [Builder comment 7148673394](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7148673394), after verifying the review author's GitHub account is the repository owner (`FATTY-BAMBA`, account 101108617). This is one fix round, addressing review items 1–7.

- Added `20261125083000_stored_price_identity`, without editing the earlier migration. PostgreSQL generates description/unit keys on insert and update, backfills existing lines, and refuses supplied key values. Modern view reads use the stored values; format-1 legacy descriptions retain the allowed dynamic path. Prisma ignores these SQL-owned columns on reads/writes. A runtime test temporarily replaces the normalizer with a throwing function: reading a modern issued line still succeeds. Another test migrates an existing issued line and verifies its snapshot stays identical.
- The view uses `security_invoker=true`, with a migration comment explaining future #42 policies. A local restricted-role test grants SELECT, applies a deny policy to QuoteItem, and proves the view returns zero rows to that role. No production grants or RLS policies are introduced by this PR.
- Suggestions/history now use a private, bounded, same-origin GET endpoint with the existing capability, membership and job/source checks. Requests have a 10-second timeout and AbortSignal; changed inputs, closure and unmount abort the previous request. They no longer enter the Server Action queue. Tests cover private caching, input keys, origins, denial/error outcomes, cancellation and stale responses.
- Focus on a filled description makes no read. Typing or Arrow Down opens suggestions; Escape closes them. Suggestions sort by client, prefix, issue date, then exact keys. The list keeps its alphabetical order. Normalized keys use bytewise collation throughout grouping/sorting, consistent with exact identity and the existing final tie-break.
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
