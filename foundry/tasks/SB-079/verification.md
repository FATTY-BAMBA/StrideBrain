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

`npm run check` passed on Node 24: formatting, design tokens, lint, TypeScript, all **1,868 tests in 192 files**, and the production build. The existing prisma.config.ts anonymous-default-export lint warning remains; there are no lint errors. The fake evaluation passes all 62 questions in all three rounds (186/186); this proves the integration contract, not model quality.

Local production-build Chrome checks passed for owner Settings and Viewer job chat in English and zh-TW: grouped failure reasons, visible keyboard focus, stage example, 390px page fit and table scrolling. The discovered mobile min-content overflow was fixed by allowing the Settings section to shrink. Screenshots and the browser report are in [evidence](evidence/). This uses a disposable local synthetic database, local HTTPS and AI disabled. Provider answer rendering is tested in application/unit tests and the paid runner; it was not exercised through a live-provider browser session.

Implementation CI and paid evaluation are pending. No hosted operations were performed. Hosted acceptance is waiting for the Product Director; PR #80 stays draft. Paid runs used: 0 of 4.
