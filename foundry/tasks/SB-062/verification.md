# SB-062 verification

Hosted acceptance is waiting for the Product Director. Keep the pull request in draft. No hosted deployment, migration, seed, settings change or Test site workflow dispatch.

## Implemented

A separate DraftJob use case offers only one forced submit_job_draft function call. The question use case, tools, instructions, provider and model are unchanged. Drafting checks project:create and project:read, paid configuration, the firm's switch, shared daily cap and timeout, with no automatic retry.

The model sees only redacted typed text, fixed instructions and existing static choices. The server drops independently unsupported fields after NFKC/whitespace normalization; plain text values equal their supporting quote. Digits-only 坪 conversion uses 400/121, rounded half up to three decimal places. Existing clients are matched locally on either language name only when exactly one active firm client matches.

The new-job page and Home both render NewJobForm and submit createProjectAction. Drafts stay in page state, separate from question history. Fields are marked until edited; required missing fields remain required; failure retains editable form values. References/idempotency remain server-generated. No job, client or audit is written until human confirmation. Successful draft responses use the existing ANSWERED usage outcome, including an empty extraction; failures use the existing typed fallback outcomes. No migration is needed.

The Product Director clarified that creation stays in QUOTE_REVIEW and the resulting job appears under 報價 (Quote), correcting the issue's 詢問 acceptance line.

## Local verification

`npm run check` passed: **1,444 tests in 134 files**, formatting, lint, strict typecheck and production build on Node 24 with disposable loopback PostgreSQL. Existing prisma.config.ts lint warning only. Two earlier existing integration timeouts cleared on an unchanged rerun with idle sleep prevented; no thresholds were relaxed. [Check log](evidence/check.log). Unit, adapter and disposable-PostgreSQL coverage includes verbatim support, independent field drops, full-width digits, area conversion and numeric boundaries, bilingual/ambiguous/foreign/inactive client matching, owner/manager availability, Viewer/finance/cross-organization denial, direct action size limits, privacy redaction, no retries, usage-only persistence, UI field markers and unique field IDs.

The deterministic draft harness passes all 24 cases in three rounds through the real use case, support checks, conversion, client repository and usage repository. This proves the harness and paths, not live model quality. Required scenarios: 坪, existing client, no area, district without city, long pasted private tokens, non-job text and record-extraction instructions. The live pass gate is unchanged question acceptance plus all required draft cases, zero unsupported kept values and at least 10/12 exact cases in each language in every round.

## Local browser verification

Local production Chrome exercised real sign-in, server actions and database writes with a test-only external Gemini HTTP transport. Eight drafting calls produced eight metadata-only usage rows. No job/client/audit was written by drafting. Missing city blocked confirmation; two quick confirmation clicks created one job and one audit in QUOTE_REVIEW. With AI off, an ordinary manual form created another job with no additional model call.

Verified English and zh-TW Home cards, exact 120 坪 = 396.694 m², existing/new client modes, editing removes AI markers, 600+ character pasted text with phone/ID removed before sending, missing/written-out area stays empty, empty/non-job/injection responses, invalid-output failure retaining typed values, and hidden controls for Viewer/finance/AI-off. No browser or server errors in the completed run. The local server, database, sessions, invitation and TLS files were removed. [Browser report](evidence/browser.json).

Visually inspected: [Home zh-TW](evidence/home-draft-zh-TW.png), [Home English](evidence/home-draft-en.png), [pasted-message form](evidence/new-page-private-message-zh-TW.png), [AI-off ordinary form](evidence/ai-off-new-job-en.png). Browser transport evidence does not establish live model quality.

[Deterministic question report](evidence/fake-question-evaluation.json) · [Deterministic draft report](evidence/fake-draft-evaluation.json).

## Paid evaluation

No dispatch yet. Issue #62 authorizes at most three; each report and its token-based cost will be retained. The existing main workflow checks out the full branch commit and runs only the evaluation runner against disposable synthetic PostgreSQL. No hosted product/database changes.

## Not verified

Hosted acceptance and billed provider charges. Local browser transport evidence, when recorded, is separate from the paid provider evaluation. The Product Director must run the Test site workflow and click through issue #62, plus the regression acceptance lists for #39, #58 and #60.
