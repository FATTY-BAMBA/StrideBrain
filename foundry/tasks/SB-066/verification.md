# SB-066 verification

## Delivery and decisions

One draft PR: [#68](https://github.com/FATTY-BAMBA/StrideBrain/pull/68), branch `build/sb-066-clients-firm-lists`. Delivery A's [inventory](inventory.md) and original comparison capture were committed and posted before behavior changes, against main `6310c16`. Delivery B adds three forward-only migrations; no existing migration changed. Deliveries C and D add the domain/repository/use-case rules and bilingual screens.

Confirmed decisions: a used pricing mapping is locked, including closed/retired records; pricing-only parents stay hidden from the scope checklist; Quotes shows one current row per quote. The latest issued/accepted version supplies the number, amount and issue date. A newer draft adds “Revision in draft” / 「修訂中」 without replacing those amounts. Never-issued quotes show the current draft without a document number. The status filter uses that displayed row.

## Local verification

- Required `npm run check`: **passed: 1,541 tests in 149 files**, formatting, lint, strict typecheck and production build. [Complete command output](evidence/check.log). Node 24, disposable loopback PostgreSQL, all migrations and synthetic fixtures. Existing `prisma.config.ts` anonymous-default-export lint warning only.
- Populated-database upgrades preserve existing clients, project categories, subtype keys and quote units. New list tables and relationships enforce tenant keys. Old migrations and issued snapshot fixtures are unchanged.
- Client validation, eight-digit optional tax ID, role/tenant denial, audited edits, idempotent retry, rollback and search/pagination bounds. Generated editable `C-YYMM-XXXX` references share the job-reference alphabet and UTC month; normal duplicate handling remains.
- Owner-only firm-list writes, audit/retry, related types, cycle/foreign-parent rejection, rename/retirement and pricing-mapping lock. Mapping-use tests include jobs, scope rows, quote lines, costs, offers, suppliers/materials, and closed/deleted/retired records.
- Current-quote selection, issued amount preservation with a newer draft, superseded exclusion, effective-status filter, assignment scoping, cross-tenant denial and Viewer amount omission.
- Exact 400/121 area conversion: 640 m² displays 193.6 坪 and a saved 100 坪 entry displays 100 坪. Job-draft form cases cover 120 坪 without conversion, 85 m² to 25.71 坪 with conversion, and 85 m² without conversion when the preference is m². Stored money/rates stay exact; displayed rate units are converted explicitly.
- Dynamic category/type labels, pricing coverage, quote order and unit validation. Retired entries remain readable on old records and unavailable for new selection. Architecture tests prohibit seeded type/category keys and fixture imports in production source.
- All seven assistant read tools, in both languages, are checked with synthetic client contact secrets; contact, phone, email, address, tax ID and note are absent from tool/model data. Existing grounding, permission, draft-support, evaluation and metering gates remain in the suite. Evaluation cases, expected values, oracle and pass marks are unchanged.

## Seeded comparison proof

The post-change parity test passes against the immutable [pre-change baseline](evidence/seeded-comparison-before.json), captured at snapshot date 2026-11-23. Neihu 87.7157 (88), Zhongshan 81.3110 (81), Nanjing 79.4138 (79), Daan 70.6066 (71), Songshan 68.8748 (69), Banqiao 62.7501 (63), broader matches, default selection and all 16 claims with English/Traditional Chinese sentences are identical. The baseline file was not regenerated.

## Browser and document evidence

Local production build over loopback HTTPS, disposable synthetic database, Chrome at 1440×1100 and 390×844. [Browser result](evidence/browser-verification.json).

- Owner: Clients in both languages, contact edit and audit, visible seven-digit tax rejection, generated client reference, new type/category, 100 坪 job creation, client job history, rename/retire and locked mapping explanation.
- Finance: client details readable, editing disabled. Viewer: visible quote rows without amounts, no Clients navigation, direct Clients route returns 404.
- Both languages: one issued quote row with a newer draft, issued total retained, draft-revision marker, status filter and job Quote link target.
- Mobile client details and a horizontally scrollable quote table. A browser-discovered page overflow was corrected before final capture.
- Quote-issue integration snapshots optional client contact/address/tax fields, denies unauthorized access, and leaves old snapshots unchanged. PDF tests assert the optional block and byte-for-byte preservation of the earlier PDF. Both generated one-page samples were rendered and visually reviewed: [English PDF](evidence/client-quote-en.pdf), [Traditional Chinese PDF](evidence/client-quote-zh-TW.pdf).

Screenshots: [Clients](evidence/zh-TW-clients.png), [client details](evidence/zh-TW-client-details.png), [new client number](evidence/en-new-job-client-reference.png), [issued quote with revision](evidence/zh-TW-quotes-issued-revision.png), [Viewer Quotes](evidence/en-viewer-quotes.png), [Settings](evidence/zh-TW-firm-lists.png), [renamed retired category on a job](evidence/zh-TW-renamed-retired-job.png), [existing job in 坪](evidence/en-existing-job-ping.png), [mobile client](evidence/zh-TW-client-mobile.png).

## Paid evaluation and CI

Pending on the implementation commit. Issue #66 authorizes at most two AI evaluation workflow dispatches; none used yet. The model instructions, model and pass marks are unchanged. Record all three rounds, job-draft results and estimated cost here after the workflow finishes.

## Not verified

Hosted acceptance is **waiting for the Product Director**. No hosted deployment, migration, seed or settings change was made, and the Test site workflow was not started. The PR stays draft. Browser verification is the local flow listed above, not a claim that every earlier hosted acceptance list has been clicked through. The Home AI draft card's area/client-number behavior has local form/use-case coverage; the exact acceptance utterance has not been clicked through on the hosted site. Provider evaluation and implementation CI are still pending at this checkpoint.
