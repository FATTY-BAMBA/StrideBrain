# SB-065 verification

## Result and scope

Implemented A–E from issue #65 on `build/sb-065-quote-document`, based on main `a7ee58c` after #72. One draft pull request. Hosted acceptance is **waiting for the Product Director** using the Test site workflow. No hosted deployment, migration, seed or settings change was performed.

The Product Director clarified that sections use the job's pricing categories and the firm's labels. Several sections may share a category; references compare against their combined amount and appear once. Use suggestion is available only when all mapped sections have no lines, including notes. Work scopes remain a job attribute.

## Delivered and verified locally

- **A — Schema and domain.** Two new, forward-only migrations add tenant/version-bound sections, typed lines, discount and site address, and extend the line invariant without rewriting legacy values or issued snapshots. Unit seed additions preserve existing keys and labels and are repeatable. Fixed-point calculations round each item, independent percentage fee and tax half up to whole dollars. Inputs enforce 30 sections, 300 lines and all text/decimal bounds; submitted amounts are ignored.
- **B — Repository and application.** A manual document saves and saves again without a comparison. Server totals, concurrent idempotency, audit, Viewer and cross-tenant denial tests pass. A maximum-size 30-section/300-line document saves, signs, issues and revises. Version 2 freezes site/client/header details; subsequent job changes and revisions leave the issued snapshot unchanged. Site-address audit data carries a fingerprint, never the address.
- **C — Editor.** Shared Paper and navigation Tabs; one seven-column table with section subtotals in the Amount column, explicit save/unsaved state, line and section ordering, notes and fees, server previews, contained scrolling, visible totals and settings below the document on a phone. Opening a document without a recorded basis reads current comparison references without filling lines. Editing a recorded basis preserves it; explicit refresh remains available. The four issue-review, unavailable-card, number-column and acceptance-confirmation fixes are included.
- **D — PDF.** English and Traditional Chinese version 2 PDFs show the seven columns, remarks, notes, fees, discount, tax, site/client details and section subtotals. Rendered pages were visually inspected, including a continued page from a 40-line document. Empty terms/email are omitted. The existing version 1 byte-parity test still passes; old snapshots are not rewritten.
- **E — Category and overall figures.** Multiple lines/sections roll up to one quoted amount per pricing category and one historical sample per job. Uncategorized lines affect only overall figures; the discount does not reduce category totals or the fee base. Independent observation reconciliation checks whole-dollar items, fees and discount. New line details and the site address are absent from assistant facts.

The exact financial example passes: wood NT$285,000, electrical NT$15,000, 8% fee NT$24,000, before tax NT$324,000, tax NT$16,200, total NT$340,200. A NT$4,000 discount yields NT$320,000 / NT$16,000 / NT$336,000. The 6.23 × NT$3,200 line yields NT$19,936. Excessive discounts, compounded fees and tampered stored/browser amounts are refused.

## Migration and seeded parity

[Baseline capture](evidence/baseline-capture.log) used an isolated local database containing every migration before SB-065 and asserted QuoteSection did not exist. [seeded-before.json](evidence/seeded-before.json) records rankings, exact finding sentences in both languages, suggestions and Home figures. The post-migration parity test compares against that committed baseline. [Delivery A](evidence/delivery-a.log) also checks preservation of existing populated rows/snapshots and compound tenant/version foreign keys. All earlier migration files remain unchanged.

CI retains the real `prisma migrate deploy` and `prisma db execute` steps on its service database, including seed/verify twice; the isolated test template additionally applies SQL and tests its own tenant data.

## Browser and PDF evidence

[Browser report](evidence/browser-verification.json): local production Next build, Chromium, isolated synthetic PostgreSQL database, owner and assigned Viewer. No browser console errors or uncaught page errors in the completed flow.

- [English document](evidence/en-quote-editor.png), [Traditional Chinese document](evidence/zh-TW-quote-editor.png), [390px Traditional Chinese](evidence/zh-TW-quote-mobile.png), [390px English](evidence/en-quote-mobile.png): create job/site address, type items/fee/note/discount, save twice without a comparison, leave/reopen and switch language with typed descriptions retained. Tab order crosses description, unit, quantity, unit price and remarks.
- [40 lines](evidence/en-40-line-editor.png), [table scrolled to bottom](evidence/en-40-line-scrolled.png): the totals remain visible at 1440×900 with the window at scroll zero; their bottom is 883px at both table scroll positions.
- [Issue review](evidence/en-issue-review.png), [acceptance confirmation](evidence/en-acceptance-confirmation.png): no-comparison warning permits issue; review includes the exact site/client details; cancellation changes no audit row; confirmation records acceptance. A revision is editable and the old PDF bytes remain identical.
- [Viewer](evidence/en-viewer-quote.png): assigned job structure/site address are readable; amounts, save controls and PDF access are denied. [Legacy Xinyi](evidence/en-legacy-xinyi.png), [internal review explanation](evidence/zh-TW-internal-review.png), [quote list](evidence/zh-TW-quote-list.png) cover legacy adaptation and FINAL's number fallback.
- Actual browser-issued PDFs: [English](evidence/browser-issued-en.pdf), [Traditional Chinese](evidence/browser-issued-zh-TW.pdf). Rendered richer fixtures: [English](evidence/quote-document-en.png), [Traditional Chinese](evidence/quote-document-zh-TW.png), [totals](evidence/quote-document-totals-zh-TW.png), [continued page](evidence/quote-document-long.png).

## Final checks and paid evaluation

Final [`npm run check`](evidence/npm-run-check.log) passed: formatting, design tokens, lint, TypeScript, **1,620 tests in 163 files with zero skips**, and the production build. CI and the required three-round paid evaluation are pending; their results and run links will be recorded before handoff. The only lint warning is the pre-existing anonymous default export in `prisma.config.ts`. The design gate has no new baseline entries or increased allowances.

## Not verified

Hosted acceptance awaits the Product Director; the PR remains draft. No real customer quotation was available, so this implements the defaults settled in #65; comparison with the first pilot firm's own document belongs to #42. Local Chromium checks do not constitute a full Safari/Firefox, screen-reader, print-printer or exhaustive replay of every prior hosted acceptance list. Paid model evaluation is recorded separately and does not test PDF printing or hosted flows.
