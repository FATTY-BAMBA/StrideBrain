# SB-063 verification

PR #76 stays draft. Hosted acceptance is waiting for the Product Director; no Test site workflow or hosted project/database changes were made.

## Changes

- A: `ClosedJobEconomicsService.jobDifference` computes quote-before-tax minus reconciled actual cost using fixed decimals, signed integer basis points and a directly rounded one-decimal percentage. Home shows below/above/equal wording and green/red/neutral colour, followed by the unchanged category lesson. The new field is separate from the lesson so `get_closed_job_lessons` sends exactly the same facts as before.
- B: the shared `HomeChat` component moved to `components/assistant`. Its existing stylesheet remains in place to preserve Home's appearance; new styles use the design tokens. A server-authorized job layout holds a collapsed panel on overview, comparison and quote pages. It preserves the thread across pages of the same job and unmounts it on leaving. Each page starts collapsed, with no create-job control. The existing server action remains the authority for selected/named jobs, access, exclusion and financial visibility.
- Saved answer newlines render as separate lines without changing text, order or sources. New draft cards collapse older cards to the original request; hidden forms stay mounted so edits and create submission survive reopening. No persistence or logging was added.
- C: four required job-page evaluation cases were added, two per language. The suite now contains 54 questions: 20 core per language, eight existing hosted cases, two existing count/range cases and four job-page cases. Every required case must pass every round. Existing 16/20 core, numeric/label/display, call-count, finding-stability and job-draft gates are unchanged.
- Corrected SB-067 verification to record the Product Director's 2026-11-25 confirmation of the old findings-list removal: [PR #75 comment 7157102507](https://github.com/FATTY-BAMBA/StrideBrain/pull/75#issuecomment-7157102507). Actual owner authorship was verified from GitHub metadata; it is no longer provisional.

## Local evidence

`npm run check` passed on 25 November 2026: **1,752 tests / 180 files, zero skipped**, plus formatting, design-token gate, lint, typecheck and production build ([log](evidence/check.log)). Only the existing `prisma.config.ts` anonymous-default-export lint warning remains. Earlier check attempts exposed two expected test-contract updates (54 evaluation cases and projection of the new Home display field from the historical SB-065 snapshot); stale generated Next route types were regenerated. No production guard or test timeout was relaxed.

Coverage added or extended:

- Exact below/above/equal amounts, a value beyond JavaScript's safe integer range, half-up rounding, avoiding a double-rounding error, and zero/negative denominator rejection.
- Both languages' exact sentences, category sentence retained underneath, and structural-only Home readers receiving neither figures nor the new difference. The original SB-065 financial snapshot still compares all its original fields; only the newly added display field is projected out of that historical snapshot.
- Real scoped Prisma access: another organization's job and an unassigned job are not found by the layout, and a forged selected job cannot reach the model. Readable excluded jobs keep the panel but receive the existing refusal without a model call. Viewer tool facts contain no quote amounts.
- The open job is sent only when the question names none. Named jobs win in either language and by reference. Existing Home-action regression coverage still proves no comparison writes.
- DOM tests: both panel labels, default collapse, controlled disclosure state, native focusable buttons, selected route key submission, retained answer/source DOM across overview/compare/quote, empty thread after leaving or switching jobs, no job-creation button, and unchanged multiline text with one line element per sentence.
- Two draft requests: older card collapses to its exact request, reopening retains edited name, original create action receives that edited value, and disclosure controls remain focusable.
- Evaluation completeness and all-four/every-round failure gates; deterministic fake replay over authorized records (not evidence of model quality).

## Paid evaluation

Dispatches used: 0 of at most 2. Local check passed; paid dispatch follows this implementation commit. Only the AI evaluation workflow is authorized; it uses disposable CI PostgreSQL, not the test-site database.

## Not verified

- Hosted acceptance, screenshots, real browser navigation/back behavior, visual layout at narrow widths, physical keyboard activation and screen-reader announcements await the Product Director. DOM tests establish state and native control semantics but are not a browser click-through. This session exposes no browser/computer execution tool.
- No model prompt, tool, grounding/check, model configuration, workflow or migration was changed.

Base: fetched main `a45e84083b28a41e28b9e674a64232d505b95ac4` (merged #75). The repository's `origin/main` tracking ref was stale because its fetch refspec tracks an old task branch; the clean new branch was fast-forwarded to the actual fetched main before editing. The old #75 review automation was stopped after merge.
