# SB-046 verification

Date: 22 November 2026 (Asia/Taipei). Branch: `build/sb-046-home-desk`.
Baseline: merged PR #48, `adca968612ee22e5d91f9fba460912b463cf2ef2`.

## Delivery

A. Implemented `GetHomeDesk`, the Home repository port and Prisma adapter before the screens. Reused Projects' visibility boundary and the freshness-checked saved-comparison service. Added economics-domain calculation of closed-job lessons with fixed decimals, existing authority/reconciliation checks and EvidenceReference lineage. No schema or fixture changes.

B. Added bilingual Home, the complete `/[locale]/decisions` list, shared five-group display mapping and validated Projects filter. Moved account identity, language, Settings and Sign out into the shared sidebar. A bounded locale cookie remembers language on this browser for one year, including after sign-out; it carries no identity or authority. Existing chat action and intent behavior remain unchanged.

C. Removed the old current-project panel, old Home findings/memory presentation and suggestion chips. Corrected shared zh-TW recommendation punctuation to `：` and `。`. Local tests and screenshots are recorded below. Hosted acceptance remains waiting for the Product Director.

## Review additions — 22 November

- Quote-review rows now select the largest absolute out-of-range category variance with fixed-decimal helpers, before display rounding. Category id breaks ties; too-little-history is used only without a variance finding. Remaining findings are counted using the shared review policy, including programme differences; aligned/overall claims are excluded. The same claim sentence and evidence link are retained.
- Current Xinyi fixtures render **“Imported stone and hard finishes: quoted price is 43.0% above past quoted prices.”**, with **10 more findings / 另有 10 項**. The count was independently checked against the persisted review claims. Riverside leads with signage's 66.8% below quoted-price finding and four more findings.
- Static bilingual **Person / 體驗人員** sign-in defaults to owner and offers project-manager, finance and viewer. The browser sends only a role key. A single server list maps to the four exact Horizon membership/person pairs authorized in issue #46; the page does not read people from the database. Rejected codes/forms never instantiate the identity repository. Missing/repeated/unknown person values use the same neutral refusal.
- Invitation digest/format/expiry, one-hour session cap, shared attempt budget, strict keys, preview conditions and no credential/person logging remain covered. Tests resolve all four roles from actual PostgreSQL sessions in both languages, including cross-tenant denial and revocation. Invalid-person attempts consume the same budget and cannot reset it by changing person.
- Local production HTTPS Chrome: signed in through the real form as Alex, Mei, Iris and Kai; checked their stored roles and signed out. Alex sees every fixture job and three closed lessons; Mei sees two assigned jobs; Kai sees no create button or financial amounts/percentages. Real-route unknown/repeated/missing person submissions created no sessions.
- Refreshed 17 screenshots, including English/zh-TW sign-in, all four sample-person Homes, largest findings/counts, shared Home/comparison/chat wording, overflow/full list, closed lessons and 390px layout. The owner's expanded fixture has 12 decisions after six screen-created jobs; Home shows five and **View all 12 items** opens all 12. The older eight-item observation below used Mei's narrower job access.
- Browser harness assumptions were corrected for the fixture's two pre-existing session rows and the owner's wider access. The completed browser pass has no console/page errors. The local server logged `ENOTFOUND sb046.test` during Next.js internal redirect prefetch because the hostname mapping existed only in Chrome; the browser followed the fallback redirects and all action assertions passed. Server-side redirect prefetch under normal DNS remains part of the hosted pass. Temporary local database, sessions and credentials were cleaned up (`review-cleanup.json`).

## Verified locally

- Node 24 `npm run check`: **98 files, 1,024 tests, zero skipped**; final result recorded in `evidence/check-summary.txt`; formatting, lint, TypeScript, tests with local PostgreSQL integration, and production build. The pre-existing `prisma.config.ts` anonymous-default-export lint warning remains; there are no lint errors.
- Normal path, Viewer/no-create, structural-only/no-figures, cross-organization, unassigned jobs, empty firm, overflow, expired/other-member proposals, unavailable reads, and invalid/repeated group filters.
- Same member/current source findings only. Another member, changed active quote and legacy missing fingerprints remain out of date. Home never reruns ranking or historical economics. Missing economics is explicitly unavailable and never presented as all clear.
- Quote-review items use category claims and the shared sentence renderer. Fixed ordering is documented in `build-contract.md`; future shipped sources extend the same repository port. Review confirmation still performs its existing fresh authority, source and evidence checks.
- Closed lessons use approved, non-superseded quotes and reconciled actuals. Domain tests cover largest monetary difference, no overrun/closest category, tie order, missing evidence, invalid totals, wrong authority, conflicts and mismatched job lineage. Structural readers do not load monetary records. Integration checks resolve the returned source references in the same organization.
- Shared account reads check membership/person/organization identity and handle failed reads without exposing another account. Locale preference is validated; switching language preserves route state.
- Local production build in Chrome over a direct HTTPS loopback server: review proposal → Home Confirm review → same proposal → confirmed receipt → item removed; Home/comparison/chat sentence parity in both languages; exact zh-TW recommendation punctuation.
- Six synthetic jobs created through the screen. Home shows five and **View all 8 items** opens the complete eight-item decision list. A seventh, comparison-ready job temporarily raises the count to nine; a successful comparison removes its Compare item. An attempted comparison with no eligible history retains Compare because no completed comparison exists.
- Every stage tile opens the correct filtered list; the five counts sum to unfiltered Projects for the same person. Home has no highlighted stage tile. At five or fewer decisions there is no View all link (unit/component coverage plus the initial three-item browser state).
- Viewer browser session has no New job button or financial amounts/percentages; a temporary local assignment demonstrates that a permitted closed-job name remains visible. Other-organization and empty-firm browser sessions pass.
- Account controls checked on Home, Projects, New job, comparison, decision list and Settings through their shared layout. Actual sign-out clears the secure session and returns to sign-in; language remains visible and the saved choice survives root entry/sign-out.
- Desktop English/Traditional Chinese and 390px Traditional Chinese screenshots inspected. No horizontal overflow at 390px. Successful browser flow reports no application console or page errors.

## Closed-job acceptance figures

The first completed job for an organization administrator is **Nanjing Brand Experience Center**. These are calculated/read from the synthetic records, not typed into UI copy:

| Figure | Issue expected | Computed | Result |
| --- | ---: | ---: | --- |
| Quoted price before tax | NT$17,300,000 | NT$17,300,000 | Match |
| Reconciled actual cost | NT$13,420,000 | NT$13,420,000 | Match |
| Site coordination and handover actual minus quoted | NT$1,720,000 | NT$1,720,000 | Match |

The next lessons are Neihu Tech Flagship (no category exceeds its quote; imported stone is closest) and Songshan Retail Renewal. No margin percentages are shown. A member only sees closed jobs also visible to that member on Projects; the default Mei fixture has only the two active job assignments, so choose owner / Alex Chen on the sign-in form for the three-job acceptance check.

## Test-site acceptance waiting for the Product Director

Keep the PR **draft**. Follow `docs/development/TEST_SITE.md` to put this PR on the test site and click through the acceptance list. Agents did not deploy, migrate, seed or change settings/data on any hosted project or database.

On freshly loaded synthetic data, run each job's comparison once as the member who will inspect Home. Xinyi/Riverside then show that member's current saved findings. Home deliberately does not invent a seed finding, replay ranking/economics or reuse a different member's saved result. Re-run after switching member or changing the job/quote. This preserves the accepted #44 freshness rule.

For the hosted pass, verify the two findings/link destinations, prepared confirmation, a screen-created job before/after comparison, five stage filters, overflow/full list, Nanjing's amounts, Viewer/structural/other-org/empty behavior, both languages and sidebar controls including sign-out.

## Not verified

- Hosted acceptance: **waiting for the Product Director**; no Test site workflow was triggered by an agent.
- Safari/Firefox, screen-reader testing, cross-device language preference, or performance/load testing across large job portfolios. Language persistence is on the current browser, not a new cross-device profile preference.
- Production sign-in, real customer data, quote drafting, work items, close-job flow, model/chat-intent changes and other deferred workflows are outside this issue.
- No new migration was required; existing migrations are exercised by the isolated local integration suites, not applied to hosted data.

## Evidence

- `evidence/review-browser-verification.json`: current review-addition browser assertions and refreshed screenshot index. `evidence/browser-verification.json` records the earlier accepted implementation pass; unchanged scenarios were not manually repeated in this revision.
- `evidence/en-sample-*-home.png`, `zh-TW-sign-in-language.png`: real form sign-in evidence for the four sample people and bilingual entry.
- `evidence/en-home-decisions.png`, `en-home-overflow.png`, `en-all-decisions.png`: decision sources, five-item limit and complete list.
- `evidence/en-projects-quote-filter.png`: selected stage filter.
- `evidence/en-home-closed-lessons.png`, `zh-TW-home-closed-lessons.png`, `zh-TW-home-mobile.png`: amounts, lessons, languages and mobile layout.
- `evidence/zh-TW-recommendation.png`, `en-home-chat.png`, `zh-TW-home-chat.png`: shared finding sentences and punctuation.
- `evidence/en-settings-account.png`, `en-sign-in-language.png`, `en-viewer-structural.png`, `en-other-organization.png`, `en-empty-firm.png`: account and restricted states.
- `evidence/en-missing-economics.png`: final-build linked unavailable state.
- `evidence/cleanup.json` and `evidence/review-cleanup.json`: original and review-pass disposable local database/session cleanup.
