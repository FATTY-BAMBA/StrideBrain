# SB-066 verification

## Delivery and decisions

One draft PR: [#68](https://github.com/FATTY-BAMBA/StrideBrain/pull/68), branch `build/sb-066-clients-firm-lists`. Delivery A's [inventory](inventory.md) and original comparison capture were committed and posted before behavior changes, against main `6310c16`. Delivery B adds three forward-only migrations; no existing migration changed. Deliveries C and D add the domain/repository/use-case rules and bilingual screens.

Confirmed decisions: a used pricing mapping is locked, including closed/retired records; pricing-only parents stay hidden from the scope checklist; Quotes shows one current row per quote. The latest issued/accepted version supplies the number, amount and issue date. A newer draft adds “Revision in draft” / 「修訂中」 without replacing those amounts. Unissued quotes retain the selected version’s actual status (Draft, Internal review or Final) and creation date; they have no issued document number. All five current statuses are filterable. A newer version other than issued, accepted or superseded marks the issued row as a draft revision.

## PR review — statuses and per-area prices

The current-version selection rule is unchanged. Rows and the SQL filter now preserve DRAFT, INTERNAL_REVIEW, ISSUED, ACCEPTED and FINAL, with bilingual business labels. Any newer unissued/non-superseded version adds the revision marker to an issued/accepted row. Viewer amount omission remains.

All per-area display paths now share `pricePerAreaInFirmUnit`, the Quote tab’s fixed-decimal 400/121 conversion. Comparison current/history cells, evidence inputs/claim/result/source fields, and `get_past_prices` display the firm's unit. Canonical rates and saved calculations are not mutated. The assistant sends only formatted firm-unit rates to the model; no raw per-m² figures leak into ping-mode model facts. Existing m² outputs are pinned by regression tests.

`npm run check` passed: **1,557 tests in 149 files**, formatting, lint, strict typecheck and production build. The architecture boundary test remains unchanged and passes. Local browser review passed in both languages: 24 Final rows, two Internal review rows, the Draft filter excludes Final, and Viewer amounts remain absent. The same saved comparison and evidence trace were opened under m² and 坪 without rerunning the calculation. [Browser results](evidence/browser-review.json), [Final rows](evidence/zh-TW-quotes-final.png), [Internal review rows](evidence/zh-TW-quotes-internal-review.png), [comparison in 坪](evidence/en-comparison-ping.png), [evidence in 坪](evidence/zh-TW-evidence-ping.png), [comparison in m²](evidence/en-comparison-m2.png), [evidence in m²](evidence/zh-TW-evidence-m2.png). Table-only screenshots hide the sticky shell header so it does not overlap the captured table. Review CI passed; paid evaluation dispatch 2 of 2 failed with `UNAVAILABLE`, as recorded below. No prompt, model, oracle, case or pass-mark change.

## Local verification

- Required `npm run check`: **passed after review: 1,557 tests in 149 files**, formatting, lint, strict typecheck and production build. [Complete command output](evidence/check.log). Node 24, disposable loopback PostgreSQL, all migrations and synthetic fixtures. Existing `prisma.config.ts` anonymous-default-export lint warning only.
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

[Implementation CI 45293249019](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45293249019) passed on `894ecc9a8e74556e5e0a11c798901e9e8a5376a3`, including migration/schema checks, repeatable fixture reset, formatting, lint, typecheck, tests, build and production dependency audit.

[Paid run 45293305570](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45293305570) **passed**, using `gemini-3.5-flash-lite` against the same implementation commit. This was the first of two authorized dispatches, before the status/rate review fixes. The workflow ran from main and checked out that commit through its `ref` input. Model instructions, model, cases, oracle and pass marks were unchanged.

| Round | Answers en | Answers zh-TW | Drafts en | Drafts zh-TW | Estimated USD, both sets |
| ----- | ---------- | ------------- | --------- | ------------ | ------------------------ |
| 1     | 20/20      | 20/20         | 12/12     | 12/12        | 0.080158700              |
| 2     | 20/20      | 19/20         | 12/12     | 12/12        | 0.078855800              |
| 3     | 20/20      | 20/20         | 12/12     | 12/12        | 0.079850200              |

Total estimated cost: **US$0.238864700** (about US$0.24), calculated from recorded tokens at the configured US$0.30 input / US$2.50 output per million tokens; this is not a billing invoice. Answer questions cost US$0.182816200; job drafts cost US$0.056048500.

All three rounds passed the eight hosted-regression questions and two quality-regression questions. Overall: **149/150 answer cases and 72/72 draft cases**. Every round had zero displayed unsupported-number, amount-label or display-format failures and no discarded model answers. Median calls were 2 each round; maxima were 3, 3 and 4, with 50/50, 50/50 and 49/50 questions within three calls. Named-refusal maximum was 1. All 14 required draft cases passed in each round.

Per-question rate: 49 questions passed 3/3; `zh-TW-awaiting` passed 2/3. Its round-two answer called a job reference a quote document number and failed the unchanged expected-fact check. It remains a recorded model error, not a perfect-score claim. `zh-TW-finding` passed 3/3. All 24 draft cases passed 3/3. Full raw synthetic report, per-question rates, follow-ups, non-pass text and metering: [evaluation artifact](evidence/ai-evaluation-45293305570.json). Downloaded ZIP SHA-256 matched GitHub's artifact digest `ac04b823c5edab50b99628918dd4198dcac90008b085d5e036ee7cd02e31d6e9`.

### Review commit and paid dispatch 2 of 2

[Review CI 45333380906](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45333380906) **passed** on `5045aa333ef1ec42f27da3f8f3d33d476e0fad59`, including migrations, repeatable fixture reset, all quality checks, production build and dependency audit.

[Paid run 45333408428](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45333408428) **failed** on that same review commit. The workflow ran from main with the exact commit as its `ref` input. Both authorized dispatches are now used. The model remains `gemini-3.5-flash-lite`; instructions, cases, expected values, oracle and pass marks remain unchanged.

| Round | Answers en | Answers zh-TW | Drafts en | Drafts zh-TW | Estimated USD, both sets |
| ----- | ---------- | ------------- | --------- | ------------ | ------------------------ |
| 1     | 1/20       | 1/20          | 0/12      | 0/12         | 0.000000000              |
| 2     | 1/20       | 1/20          | 0/12      | 0/12         | 0.000000000              |
| 3     | 1/20       | 1/20          | 0/12      | 0/12         | 0.000000000              |

In each round, all 48 model-dependent answer cases and all 24 draft cases returned `UNAVAILABLE` before producing an answer or recording token usage. Only `en-excluded` and `zh-TW-excluded` passed, through the server's exclusion path without a model call. Overall: **6/150 answer cases and 0/72 draft cases**. Per-question rates: those two exclusion cases passed 3/3; the other 48 answer cases and all 24 draft cases passed 0/3. Required hosted regressions were 0/8, quality regressions 0/2 and required drafts 0/14 in every round.

The metered cost estimate is **US$0.000000000**, with zero recorded input/output tokens; this is not a billing invoice and does not establish that no provider charges occurred. Existing logs and the report expose only `UNAVAILABLE`, not the underlying HTTP, network or provider reason. The provider adapter intentionally collapses failures before known usage to that outcome. This run therefore does not verify model answer quality on the review commit, and the earlier passing run does not substitute for it. No extra paid request, retry, model change or hosted configuration change was made.

[Full raw synthetic report and per-question rates](evidence/ai-evaluation-45333408428.json). Downloaded ZIP SHA-256 matched GitHub's artifact digest `2e98a0f0cfd69d749e11236a37e7cff5e1c96a372818d949d946cabcdadc02de`. The report's generic next-tier recommendation is not a diagnosis of this unavailable-provider run.

## Not verified

Hosted acceptance is **waiting for the Product Director**. No hosted deployment, migration, seed or settings change was made, and the Test site workflow was not started. The PR stays draft. Browser verification is the local flow listed above, not a claim that every earlier hosted acceptance list has been clicked through. The Home AI draft card's area/client-number behavior has local form/use-case coverage; the exact acceptance utterance has not been clicked through on the hosted site.

The review commit has no successful live-provider evaluation: dispatch 2 failed as above, and its underlying cause remains unverified. Both area units and the assistant displayed-number check have deterministic coverage; paid model answers in 坪 were not verified.
