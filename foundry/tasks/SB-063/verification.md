# SB-063 verification

PR #76 stays draft. Hosted acceptance is waiting for the Product Director; no Test site workflow or hosted project/database changes were made.

## Changes

- A: `ClosedJobEconomicsService.jobDifference` computes quote-before-tax minus reconciled actual cost using fixed decimals, signed integer basis points and a directly rounded one-decimal percentage. Home shows below/above/equal wording and green/red/neutral colour, followed by the unchanged category lesson. The new field is separate from the lesson so `get_closed_job_lessons` sends exactly the same facts as before.
- B: the shared `HomeChat` component moved to `components/assistant`. Its existing stylesheet remains in place to preserve Home's appearance; new styles use the design tokens. The shared job layout holds tabs and a collapsed optional panel above the content on overview, quote, comparison and actions pages. It preserves the thread across pages of the same job and unmounts it on leaving. Each page starts collapsed, with no create-job control. The existing pages and server action remain the authority for access and actions. Missing session/capability/policy or a failed optional lookup removes only the bar, preserving tabs and the pages’ localized states. The editor’s dirty flag is shared in client context for the saved-draft notice.
- Saved answer newlines render as separate lines without changing text, order or sources. New draft cards collapse older cards to the original request; hidden forms stay mounted so edits and create submission survive reopening. No persistence or logging was added.
- C: four required job-page evaluation cases were added, two per language. The suite now contains 54 questions: 20 core per language, eight existing hosted cases, two existing count/range cases and four job-page cases. Every required case must pass every round. Existing 16/20 core, numeric/label/display, call-count, finding-stability and job-draft gates are unchanged.
- Corrected SB-067 verification to record the Product Director's 2026-11-25 confirmation of the old findings-list removal: [PR #75 comment 7157102507](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7157102507). Actual owner authorship was verified from GitHub metadata; it is no longer provisional.

## Local evidence

`npm run check` passed on 25 November 2026: **1,752 tests / 180 files, zero skipped**, plus formatting, design-token gate, lint, typecheck and production build ([log](evidence/check.log)). Only the existing `prisma.config.ts` anonymous-default-export lint warning remains. Earlier check attempts exposed two expected test-contract updates (54 evaluation cases and projection of the new Home display field from the historical SB-065 snapshot); stale generated Next route types were regenerated. No production guard or test timeout was relaxed.

Coverage added or extended:

- Exact below/above/equal amounts, a value beyond JavaScript's safe integer range, half-up rounding, avoiding a double-rounding error, and zero/negative denominator rejection.
- Both languages' exact sentences, category sentence retained underneath, and structural-only Home readers receiving neither figures nor the new difference. The original SB-065 financial snapshot still compares all its original fields; only the newly added display field is projected out of that historical snapshot.
- Real scoped Prisma access: another organization's job and an unassigned job hide the optional panel but retain the page-owned state and tabs (corrected in review round 1); a forged selected job still cannot reach the model. Readable excluded jobs keep the panel but receive the existing refusal without a model call. Viewer tool facts contain no quote amounts.
- The open job is sent only when the question names none. Named jobs win in either language and by reference. Existing Home-action regression coverage still proves no comparison writes.
- DOM tests: both panel labels, default collapse, controlled disclosure state, native focusable buttons, selected route key submission, retained answer/source DOM across overview/quote/compare/actions, empty thread after leaving or switching jobs, no job-creation button, and unchanged multiline text with one line element per sentence.
- Two draft requests: older card collapses to its exact request, reopening retains edited name, original create action receives that edited value, and disclosure controls remain focusable.
- Evaluation completeness and all-four/every-round failure gates; deterministic fake replay over authorized records (not evidence of model quality).

CI on implementation commit `32be7fe` passed: [run 45580894529](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45580894529). This includes real `prisma migrate deploy`, seed and verify twice, the complete isolated-database check, and production-dependency audit.

## Paid evaluation

Dispatches used: **2 of at most 2**. [Run 45580903665](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45580903665) targets implementation commit `32be7fe3f227c4d0856b0f4da76592f3645d9629`; checkout failed because the short SHA input was interpreted as a branch pattern. No model calls, **US$0**. [Checkout evidence](evidence/evaluation-1-checkout.log). [Run 45581228542](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45581228542) **passed** on the full implementation SHA ([checkout evidence](evidence/evaluation-2-commit.log)). The workflow is dispatched from main but checks out its explicit input commit. No further dispatch is authorized under this issue. Only the AI evaluation workflow is authorized; it uses disposable CI PostgreSQL, not the test-site database.

Model: unchanged `gemini-3.5-flash-lite`. [Full report with per-question pass rates](evidence/provider-evaluation.json).

| Round | English questions | zh-TW questions | New job-page cases | English drafts | zh-TW drafts |
| --- | --- | --- | --- | --- | --- |
| 1 | 27/27 (core 20/20) | 27/27 (core 20/20) | 4/4 | 12/12 | 12/12 |
| 2 | 27/27 (core 20/20) | 27/27 (core 20/20) | 4/4 | 12/12 | 12/12 |
| 3 | 27/27 (core 20/20) | 25/27 (core 18/20) | 4/4 | 12/12 | 12/12 |

Every required case passed in every round. There were zero displayed unsupported numbers, amount-label failures or display-format failures. Median model calls: 2 each round; maxima: 4, 3, 3; calls within three: 53/54, 54/54, 54/54. Named-job refusal maximum: 1 each round. Existing pass marks and the zh-TW finding stability gate passed.

Estimated cost: questions **US$0.1980373**, job drafts **US$0.0560510**, total **US$0.2540883**. First dispatch cost US$0. Both allowed dispatches are used.

Known model/check limits observed in round 3 (existing core cases, retained in the artifact): `zh-TW-awaiting` gave the job reference as the quote document number and missed the expected document number; `zh-TW-other-org` was discarded with `UNSUPPORTED_NUMBER` for `-026` in the inaccessible job reference. The latter is a raw-draft problem, not a displayed financial number. No prompts, grounding rules or pass marks were changed to accommodate either miss.

## Not verified

- Hosted acceptance, screenshots, real browser navigation/back behavior, visual layout at narrow widths, physical keyboard activation and screen-reader announcements await the Product Director. DOM tests establish state and native control semantics but are not a browser click-through. This session exposes no browser/computer execution tool.
- No model prompt, tool, grounding/check, model configuration, workflow or migration was changed.

Base: fetched main `a45e84083b28a41e28b9e674a64232d505b95ac4` (merged #75). The repository's `origin/main` tracking ref was stale because its fetch refspec tracks an old task branch; the clean new branch was fast-forwarded to the actual fetched main before editing. The old #75 review automation was stopped after merge.


## Review round 1 — comment 7158266741

[Reviewer comment](https://github.com/FATTY-BAMBA/StrideBrain/pull/76#issuecomment-7158266741), actual author verified as repository owner FATTY-BAMBA (101108617). Re-read #63 including its 25 November 08:36Z update. The brief and contract now include the requirements missed in the initial delivery.

Changes:

- The shared layout renders ProjectLocalNav then the bar in one `--page-width` wrapper before children. The five page-owned nav call sites are removed. Panel paths come from `projectNavigation`, including actions. Older page-body widths are unchanged.
- The layout only determines optional bar visibility. No session/capability/policy, or a failed session/policy lookup, renders tabs and children without the bar. It does not throw a 404 or replace page outcomes. Existing pages and server action remain authoritative; excluded readable jobs still receive the existing no-model refusal.
- A client context holds only the editor’s existing dirty boolean. The panel shows “Answers use the last saved draft.” / 「回答依據最後儲存的草稿。」 above the question field for unsaved edits, retains it after a failed save, and clears it after successful save or editor unmount. No new network call, storage, log field or submitted form field.
- Difference sentence replacements use callback functions, preserving dollar-sign text literally.
- **Provisional, awaiting Product Director confirmation before merge:** selected-job placeholder becomes “What is this job's quote status?” / 「這個專案的報價狀態如何？」. Home’s existing placeholder is unchanged. This is UI copy only; it is not sent to the model.

Verification: focused regressions **45 tests / 5 files passed** ([log](evidence/review-1-focused.log)). The tests compose the actual job layout and page unavailable states inside the app frame, check all four tabs and native disclosure semantics, retain forged-key denials, exercise the real editor through dirty/failed-save/successful-save/unmount, and preserve literal replacement characters. Full `npm run check` passed: **1,764 tests / 182 files, zero skipped**, plus format/design/lint/typecheck/production build ([log](evidence/review-1-check.log)). Only the existing prisma.config.ts lint warning remains. CI evidence is recorded in the PR checks and the Builder round-1 report.

Not verified: hosted acceptance and real-browser visual, keyboard, screen-reader, back/forward and device behavior; screenshots were not captured. Waiting for the Product Director; PR stays draft. No hosted changes, Test site workflow or paid evaluation in this round. Both existing paid dispatches remain exhausted; model-facing behavior is unchanged and the reviewer explicitly requested no further run.
