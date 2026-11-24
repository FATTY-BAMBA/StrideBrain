# SB-065 verification

## Result and scope

Implemented A–E from issue #65 on `build/sb-065-quote-document`, based on main `a7ee58c` after #72. One draft pull request: [#74](https://github.com/FATTY-BAMBA/StrideBrain/pull/74). Hosted acceptance is **waiting for the Product Director** using the Test site workflow. No hosted deployment, migration, seed or settings change was performed.

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

Final [`npm run check`](evidence/npm-run-check.log) passed: formatting, design tokens, lint, TypeScript, **1,620 tests in 163 files with zero skips**, and the production build. [CI run 45428410932](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45428410932) passed on `a0619c5`, including the real deployment commands, seed/verify twice, 1,620 tests and production dependency audit (zero vulnerabilities). The required three-round paid evaluation passed on the unchanged repeat; both reports, scores and costs are recorded below. The only lint warning is the pre-existing anonymous default export in `prisma.config.ts`. The design gate has no new baseline entries or increased allowances.

### Paid evaluation, first run

[Run 45428451693](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45428451693), `gemini-3.5-flash-lite`, checked out `a0619c571a36d38d4f4037cc6041ffafac41c219` through the workflow's `ref` input. The workflow metadata's main SHA is the workflow definition, not the evaluated checkout. **Failed**: one required question was discarded as `UNKNOWN_SOURCE` in round 1; the same question passed in rounds 2 and 3. No displayed wrong number, wrong amount label or bad display format. No prompts, checks, model or cases were changed.

| Round | Questions en | Questions zh-TW | Drafts en | Drafts zh-TW | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | 25/25 | 24/25 | 12/12 | 12/12 | Failed required question |
| 2 | 25/25 | 25/25 | 12/12 | 12/12 | Passed |
| 3 | 25/25 | 25/25 | 12/12 | 12/12 | Passed |

The original 20 questions per language scored 20/20 in every round. The failed required case is `zh-TW-home-reference-total`: its text matched the quote figures, but the server rejected its citation as `UNKNOWN_SOURCE`. The report's draft-number flag follows the lack of a valid cited source; no such draft was displayed. Per-question rates: that case 2/3; every other question 3/3. All 24 draft cases passed 3/3. Every round met the call targets (median 2, maximum 3, all 50 within 3, named refusals 1). Estimated token cost **US$0.238752000**.

[Full synthetic report](evidence/ai-evaluation-45428451693.json). ZIP SHA-256 matched GitHub's artifact digest `08436797005359680f79c71a7d9dafc2a3b78303816502c0f1c4374c5254be12`. One unchanged repeat was dispatched to check recurrence; it does not erase this observed failure.

### Unchanged paid repeat

[Run 45430327216](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45430327216) **passed** on the same implementation commit `a0619c571a36d38d4f4037cc6041ffafac41c219`, model, instructions, cases, checks and pass marks.

| Round | Questions en | Questions zh-TW | Drafts en | Drafts zh-TW | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | 25/25 | 25/25 | 12/12 | 12/12 | Passed |
| 2 | 25/25 | 24/25 | 12/12 | 12/12 | Passed |
| 3 | 25/25 | 25/25 | 12/12 | 12/12 | Passed |

[Full synthetic report and per-question rates](evidence/ai-evaluation-45430327216.json). Estimated token cost **US$0.240293800** (questions US$0.184242800; drafts US$0.056051000). Two dispatches, combined estimated cost **US$0.479045800**. These estimates are not a provider invoice. The first run's isolated citation rejection remains a known observed instability; passing this repeat does not remove it.

Per-question rates: `zh-TW-other-org` passed 2/3; the other 49 questions and all 24 draft cases passed 3/3. In round 2, the model's non-disclosing “no record” sentence repeated the reference from the question; the server discarded `-026` as `UNSUPPORTED_NUMBER` because that reference was not readable by this actor. No private record or wrong number was displayed. This is a known strict-check rejection, not a new quote-document regression; the model and grounding policy were unchanged. All required regressions passed (8/8 hosted and 2/2 quality every round), as did the displayed-number/amount-label/display-format gates. Calls: median 2 every round, maxima 4/3/3, within-three counts 49/50, 50/50, 50/50; named refusals at 1.

The downloaded repeat ZIP matched GitHub's SHA-256 `a8da22b39c2e3ee8a7ee2cd440f02001af46db6f809607c0cbbea2f7f537574f`. The original 20-question sets scored en 20/20 each round, zh-TW 20/20, 19/20, 20/20. No additional paid run was dispatched.

## Not verified

Hosted acceptance awaits the Product Director; the PR remains draft. No real customer quotation was available, so this implements the defaults settled in #65; comparison with the first pilot firm's own document belongs to #42. Local Chromium checks do not constitute a full Safari/Firefox, screen-reader, print-printer or exhaustive replay of every prior hosted acceptance list. Paid model evaluation is recorded separately and does not test PDF printing or hosted flows.
