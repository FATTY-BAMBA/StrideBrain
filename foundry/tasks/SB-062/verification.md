# SB-062 verification

Hosted acceptance is waiting for the Product Director. Keep the pull request in draft. No hosted deployment, migration, seed, settings change or Test site workflow dispatch.

## Implemented

A separate DraftJob use case offers only one forced submit_job_draft function call. The question use case, tools, instructions, provider and model are unchanged. Drafting checks project:create and project:read, paid configuration, the firm's switch, shared daily cap and timeout, with no automatic retry.

The model sees only redacted typed text, fixed instructions and existing static choices. The server drops independently unsupported fields after NFKC/whitespace normalization; plain text values equal their supporting quote. Digits-only 坪 conversion uses 400/121, rounded half up to three decimal places. Existing clients are matched locally on either language name only when exactly one active firm client matches.

The new-job page and Home both render NewJobForm and submit createProjectAction. Drafts stay in page state, separate from question history. Fields are marked until edited; required missing fields remain required; failure retains editable form values. References/idempotency remain server-generated. No job, client or audit is written until human confirmation. Successful draft responses use the existing ANSWERED usage outcome, including an empty extraction; failures use the existing typed fallback outcomes. No migration is needed.

The Product Director clarified that creation stays in QUOTE_REVIEW and the resulting job appears under 報價 (Quote), correcting the issue's 詢問 acceptance line.

## Local verification

`npm run check` passed: **1,469 tests in 134 files**, formatting, lint, strict typecheck and production build on Node 24 with disposable loopback PostgreSQL. Existing prisma.config.ts lint warning only. Two earlier existing integration timeouts cleared on an unchanged rerun with idle sleep prevented; no thresholds were relaxed. [Check log](evidence/check.log). Unit, adapter and disposable-PostgreSQL coverage includes verbatim support, independent field drops, full-width digits, area conversion and numeric boundaries, bilingual/ambiguous/foreign/inactive client matching, owner/manager availability, Viewer/finance/cross-organization denial, direct action size limits, privacy redaction, no retries, usage-only persistence, UI field markers and unique field IDs.

The deterministic draft harness passes all 24 cases in three rounds through the real use case, support checks, conversion, client repository and usage repository. This proves the harness and paths, not live model quality. Required scenarios: 坪, existing client, no area, district without city, long pasted private tokens, non-job text and record-extraction instructions. The live pass gate is unchanged question acceptance plus all required draft cases, zero unsupported kept values and at least 10/12 exact cases in each language in every round.

[CI run 45265559866](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45265559866) passed on code commit `6e083b447c585a82f40cf239044dfa0aefdb460d`, including migrations and repeated fixture reset on disposable CI PostgreSQL, all quality checks, production build and dependency audit.

## Local browser verification

The browser checks and screenshots were captured on `c0484f8`; the later overlap/area validation fixes did not change the UI, and browser flows were not rerun for those fixes. Local production Chrome exercised real sign-in, server actions and database writes with a test-only external Gemini HTTP transport. Eight drafting calls produced eight metadata-only usage rows. No job/client/audit was written by drafting. Missing city blocked confirmation; two quick confirmation clicks created one job and one audit in QUOTE_REVIEW. With AI off, an ordinary manual form created another job with no additional model call.

Verified English and zh-TW Home cards, exact 120 坪 = 396.694 m², existing/new client modes, editing removes AI markers, 600+ character pasted text with phone/ID removed before sending, missing/written-out area stays empty, empty/non-job/injection responses, invalid-output failure retaining typed values, and hidden controls for Viewer/finance/AI-off. No browser or server errors in the completed run. The local server, database, sessions, invitation and TLS files were removed. [Browser report](evidence/browser.json).

Visually inspected: [Home zh-TW](evidence/home-draft-zh-TW.png), [Home English](evidence/home-draft-en.png), [pasted-message form](evidence/new-page-private-message-zh-TW.png), [AI-off ordinary form](evidence/ai-off-new-job-en.png). Browser transport evidence does not establish live model quality.

[Deterministic question report](evidence/fake-question-evaluation.json) · [Deterministic draft report](evidence/fake-draft-evaluation.json).

## Paid evaluation

Issue #62 authorizes at most three dispatches. The unchanged main workflow checks out the full branch commit and runs only the evaluation runner against disposable synthetic PostgreSQL. No hosted product/database changes.

Run 1: [45190065586](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45190065586), code `c0484f8b632b56ffbfc1760cd576c7bfdd23a60d`, **failed the draft gate**. Question rounds scored 20/20 en and 20/20 zh-TW in every round; all required regressions passed, zh-TW-finding passed 3/3, median 2 and maximum 3 calls. Draft scores (en/zh-TW) were 8/10, 8/9 and 9/9 out of 12; required cases passed 12/14, 11/14 and 11/14. Every draft used one call. The model sometimes supplied client type from the job type or used a job name/type as the client name. Quoted words were present but their meaning did not support the client field, so the independent evaluator correctly failed those cases. [Original report](evidence/provider-45190065586.json). Estimated token cost: **US$0.235728200** (questions $0.180445600; drafts $0.055282600).

The server now applies the Product Director's occurrence-overlap rule after per-field support validation: up to 20 occurrences per quote, case-insensitive location only, any valid arrangement, with name/subtype allowed to share words. Client name must have support separate from name/subtype; client type must also be separate from client name. On conflict it tries dropping client type, then client name instead, then both. Text-value equality stays exact after normalization. The draft instruction uses the requested replacement. Unit fixtures cover every specified failure and positive example, dropping only client name, exact text equality and the occurrence cap. No schema, question instruction, paid case, expected value, oracle, model or pass-mark change. The deterministic fake provider now supplies separate job/client support rather than quoting the entire input for both; this is test setup only. All 19 failed draft outputs from run 1 replay successfully through the new rule, with expected values/scopes preserved: [replay report](evidence/replay-45190065586.json). Full `npm run check` passed after this fix and after preserving the branch's newer comma-grouped-area fix (`c37f573`). Run 2: [45265585222](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45265585222), code `6e083b447c585a82f40cf239044dfa0aefdb460d`, **passed both sets**. [Original report](evidence/provider-45265585222.json).

| Round | Questions en | Questions zh-TW | Drafts en | Drafts zh-TW | Required draft cases |
| ----- | ------------ | --------------- | --------- | ------------ | -------------------- |
| 1     | 20/20        | 20/20           | 12/12     | 12/12        | 14/14                |
| 2     | 20/20        | 20/20           | 12/12     | 12/12        | 14/14                |
| 3     | 20/20        | 20/20           | 12/12     | 12/12        | 14/14                |

Questions: all 150/150 including the additional required regression cases passed; zh-TW-finding passed 3/3; median 2 and maximum 3 model calls, all questions within 3 calls and named-job refusals at 1. No displayed wrong number, wrong amount label or bad display format. Drafts: all 72/72 passed; every required case passed; zero unsupported kept values; exactly one model call per case. The report includes each case's kept/dropped fields and three-round pass count.

Run 2 estimated token cost: **US$0.236823500** (questions $0.180780000; drafts $0.056043500). **Two of three authorized dispatches used; total estimated cost US$0.472551700.** These are token estimates at the configured rates, not a provider invoice. No third run was dispatched.

## Not verified

Hosted acceptance and billed provider charges. The prior local browser transport checks are separate from the paid provider evaluation; browser flows were not repeated after the domain-only review fixes. The Product Director must run the Test site workflow and click through issue #62, plus the regression acceptance lists for #39, #58 and #60.
