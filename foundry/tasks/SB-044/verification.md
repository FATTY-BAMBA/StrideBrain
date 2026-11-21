# SB-044 verification

Local verification completed on 2026-11-21 against Node 24.22.3, PostgreSQL 17 and the production Next.js build. Only synthetic data was used. Delivery A, then B, then C was implemented on `build/sb-044-job-neutral-findings`, based on merged PR #43 (`3a67f2c`). Issue #46 has not been read or started; its gate is this issue's PR being merged.

## Verified

- `npm run check`: formatting, lint, TypeScript, **89 test files / 921 tests / zero skipped**, and production build pass. The existing `prisma.config.ts:5` anonymous-default-export lint warning remains; there are no lint errors. Full output: [check.log](evidence/check.log).
- Fresh-database `db:reset-fixture`, followed by another `db:seed` and `db:verify`, pass. The disposable database was removed. [Fixture log](evidence/fixture-check.log).
- The populated migration test upgrades old prefixed claim rows, preserves IDs and immutable economics snapshots, and opens historical claim evidence through migrated category metadata. New claims use semantic `kind` and `categoryId`; runtime consumers do not decode claim keys. The source guard passes.
- `20261121170000_internal_review_policy_2` admits both existing policy 1.0 rows and new policy 2.0 proposals without changing existing receipts or weakening the rest of the completeness constraint. New preparation uses `INTERNAL-REVIEW-ACTION-2.0`; stale old prepared proposals still require current-policy validation.
- Generic review selection covers category variances outside alignment, insufficient actual history and programme findings when present. Tests cover opaque keys, aligned/no-findings results, typed `NO_QUOTE_VERSION` / `NOTHING_TO_REVIEW`, bounded bilingual wording, exact evidence IDs, conflicts, supersession, authorization, retries and atomic audit behavior.
- The second fixture, Riverside Display Studio / 河岸展示工作室 (`J-2611-R7K3`), has only custom millwork and signage. Its SQL verification checks its category set, quoted/forecast totals and evidence coverage. Existing financial fixture values were not adjusted.
- Home resolves a public job reference through the authorized project repository before looking up stored comparison IDs. Tests cover that boundary, capability checks before reads, foreign organizations and stored result ownership.

## Browser acceptance

Chrome against the local production build at `http://localhost:3041`; English desktop (1440×1000) and Traditional Chinese mobile (390×844). [Browser results](evidence/browser-results.json) record the exact runs, receipts and 17 screenshots.

- Riverside: own-category above/below findings and recommendation; prepare and confirm an internal review in both languages; Home titles exactly equal comparison findings and link to the same stored economics run; quote chat uses those claims; asking about absent imported stone returns a plain no-record answer.
- A job was created through the form with only custom millwork and signage, with no quote. Both languages show actual ranked past jobs and the needs-quote/review-unavailable message. Home, comparison findings and chat contain no unrelated stone/lighting findings or financial percentages. Existing structural evidence-coverage percentages remain structural metadata.
- Viewer cannot see the saved financial findings or prepare a review, including when supplied another member's comparison/economics URL. Nonfinancial `STRUCTURAL_ONLY` and other-organization denial cases also pass automated tests.
- There were no page errors. The only allowed browser console error is the existing missing favicon. [Cleanup](evidence/cleanup.json) confirms both temporary sessions were revoked and zero active temporary sessions remain; temporary credentials were deleted.

The final follow-up formats chat similarity as a score out of 100, with bilingual unquoted-job tests, and tests that an absent-category answer clears the prior finding. The full 921-test check includes these changes; the preceding browser run did not separately exercise that similarity reply.

Historical whole-job source lists may name stone or lighting records because they support the historical whole-job total. They do not produce category findings for categories absent from the active job. The chat check distinguishes finding text from these legitimate source titles.

## Original job figures

The original synthetic job's inputs are unchanged. Home now uses the same stored economics result as comparison:

| Finding | Old fixed Home text | Stored variance | Current displayed value |
| --- | --- | --- | --- |
| Imported-stone forecast versus reconciled actual history | 18% | 18.3882% | +18.4% |
| Lighting quoted price versus quoted history | 9% | 9.4329% | +9.4% |
| Overall quoted price versus quoted history | 7% | 7.1676% | +7.2% |

Formatting rounds the stored values to one decimal place; it does not recalculate financial variance. The browser record includes the economics run ID and displayed findings. Other eligible findings are now shown instead of restricting Home to three fixed cards.

## Pre-change receipt compatibility

A real receipt was prepared and confirmed with the merged PR #43 source before applying these migrations. After the upgrade, current services reopen it in both languages and open 30 historical claim panels (15 prefixed claims × two languages). The 9 pre-existing economics runs, 1 proposal, 1 action, 14 audit events and 1 receipt remain byte-equivalent as serialized JSON. No immutability trigger was disabled. [Compatibility evidence](legacy-receipt-evidence.json) records the receipt and checks.

## Not verified

- Hosted preview acceptance. Both automatic deployments of `8edbbf5` were canceled: [SB-034 preview](https://vercel.com/prime-stride-ai/stridebrain-sb034-preview/6R8n62Rwt9fpMKuJgggyZRn9hHFF) permits only its older pinned commit, and [stridebrain-test](https://vercel.com/prime-stride-ai/stridebrain-test/5HDDFEwzqkUnDUMQw23UhhMFgiKM) permits only `test-site`. Green Vercel GitHub statuses reflect canceled builds, not acceptance. No hosted configuration or database was changed. The concrete [one-off preview plan](preview-plan.md) needs approval because it updates the database shared with the separately pinned test deployment.
- The final GitHub CI result is tracked in [PR #48](https://github.com/FATTY-BAMBA/StrideBrain/pull/48); it was running when this evidence commit was written.
- Safari/Firefox, assistive technology, performance/load testing, production identity and real customer data.

Under AGENTS.md, local acceptance alone is not sufficient to call the issue done. Keep the PR draft until hosted acceptance is resolved. Do not begin #46 before this PR is merged.
