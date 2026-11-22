# SB-054 verification

Hosted acceptance: **WAITING FOR THE PRODUCT DIRECTOR**. One pull request, kept in draft. The Product Director puts it on the test site with [TEST_SITE.md](../../../docs/development/TEST_SITE.md) and clicks through it. No hosted deployment, migration, seed or settings changes were performed by the agent.

## Changes

- A shared domain ordering function follows COMMERCIAL_CATEGORIES across draft suggestions, opened drafts, refreshed editor rows, validation, saved line numbers, copied revision lines/locators and newly prepared document snapshots. A pre-change draft reorders on read and persists the new order on its next save. Revision without another save also uses the new order.
- The PDF renderer remains unchanged and renders snapshot order verbatim. Existing issued snapshots, items and audit records are not rewritten. Save fingerprints retain the prior canonical category ordering so existing idempotency receipts continue to match.
- Home's Compare suggestion is limited to never-compared active jobs at DISCOVERY, DESIGN or QUOTE_REVIEW. The [documented Home rule](../SB-046/build-contract.md) is updated; other priorities and permission checks stay intact.
- Accepted quotes show the accepted date and fixed-document sentence. Revise guidance appears only with the Revise button; readers without it see only the fixed-document sentence. Both locales are covered.
- Settings puts the four zh-TW requirements first in the requested field order and aligns fields to the start of each grid row, keeping single-line inputs at their normal height.
- No schema, migration, fixture, dependency, capability, authorization or financial-calculation changes.

## Automated verification

- **`npm run check`: PASS — 1,116 tests across 110 files, none skipped; formatting, lint, type checking and production build pass.** Node 24.22.3, two workers, disposable localhost PostgreSQL. [Final log](evidence/check.log). The pre-existing Prisma config anonymous-default-export warning remains.
- Domain and interactive component tests cover work order for prepared/saved/refreshed lines, retained amounts, and unchanged inputs. Save validation and PostgreSQL tests prove stored line numbers, matching prior canonical receipt fingerprints, replay, legacy draft reading/saving, and issue-review/preview/issued snapshot order.
- Real PostgreSQL tests prove a legacy issued quote revises and issues without a save, its new persisted/read-only rows are in work order, and its original snapshot and PDF bytes remain unchanged. Existing role/tenant denials, immutability, audit and totals tests pass in the full suite.
- A frozen synthetic PDF was generated from unmodified main at `d79e80c` before the repairs. The regression compares the **complete PDF bytes**, including the original alphabetical order, against that [baseline](../../../tests/quote-issue/fixtures/README.md).
- Home tests cover all eight stages and acceptance of a never-compared job. Bilingual rendered-component tests cover accepted date, Revise visibility, fixed-only copy and Settings field order.

## Local browser and PDF evidence

[Browser report](evidence/browser-verification.json): **5 passed flow checks, 13 screenshots**, local production build with Chrome, loopback HTTPS and disposable synthetic PostgreSQL. No page or console errors in the final pass.

- Settings was opened and saved in English and zh-TW; all six single-line inputs measured **46.703125 px** in both locales. Field order was checked, with a 390px mobile viewport captured. [English](evidence/en-settings.png), [zh-TW](evidence/zh-TW-settings.png), [mobile](evidence/zh-TW-settings-mobile.png).
- A pre-change saved draft was opened in both locales, saved, prepared and issued. The stored numbers, review and PDF line order match; demolition/ceilings first, coordination last. [Draft](evidence/zh-TW-legacy-draft.png), [review](evidence/en-issue-review.png), [issued](evidence/en-issued.png).
- The never-compared inquiry appeared in the Home decisions read model before issuance. After acceptance it had no decision row. The accepted sentence includes its date and has no Revise guidance in both locales. [Accepted](evidence/zh-TW-accepted.png), [Home](evidence/en-home-after-acceptance.png).
- A legacy issued quote was revised and issued as Q2 without saving the draft. Its new read-only rows follow work order, while the original downloaded PDF is byte-identical before/after. The assigned Finance reader sees the fixed-only note with no Revise button. [Revision](evidence/en-revision-issued.png), [Finance](evidence/en-finance-issued.png).
- Browser review found that copying old revision line numbers could leave new read-only rows in the former order; revision copying and its regression were corrected, then the full check and walkthrough were repeated successfully.

[PDF checks](evidence/pdf-verification.json) confirm the six-category order, exact NT$6,300 total, one A4 page, draft watermark and original-document byte equality. Draft and issued PDFs were rendered and visually inspected for readable Chinese glyphs, line order, totals, signatures and footer. [Draft PDF](evidence/work-order-draft.pdf), [issued PDF](evidence/work-order-issued.pdf), [issued page](evidence/work-order-issued.png). PDF.js was used for text checks because plain layout extraction splits the rotated watermark into fragments.

The disposable local database, sessions, server, invitation and TLS files were [removed after verification](evidence/local-cleanup.log).

## Not verified

- Hosted test-site acceptance: waiting for the Product Director. The pull request remains draft.
- Physical printing, a physical phone and browsers other than local Chrome. Mobile evidence is a 390px viewport.
- Real tenant data; manually reordered/custom lines and revisions after client acceptance are outside #54.
