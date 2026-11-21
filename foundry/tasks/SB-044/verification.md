# SB-044 verification

Local review-revision verification completed on 2026-11-22 against Node 24.22.3, PostgreSQL 17 and the production Next.js build. Only synthetic data was used. Delivery A, then B, then C was implemented on `build/sb-044-job-neutral-findings`, based on merged PR #43 (`3a67f2c`). Issue #46 has not been read or started; its gate is this issue's PR being merged.

## Verified

- `npm run check`: formatting, lint, TypeScript, **92 test files / 959 tests / zero skipped**, and production build pass. The existing `prisma.config.ts:5` anonymous-default-export lint warning remains; there are no lint errors. Full output: [check.log](evidence/check.log).
- Previously verified before this review revision (the migrations and fixtures remain unchanged): fresh-database `db:reset-fixture`, followed by another `db:seed` and `db:verify`, pass. The disposable database was removed. [Fixture log](evidence/fixture-check.log).
- The populated migration test upgrades old prefixed claim rows, preserves IDs and immutable economics snapshots, and opens historical claim evidence through migrated category metadata. New claims use semantic `kind` and `categoryId`; runtime consumers do not decode claim keys. The source guard passes.
- `20261121170000_internal_review_policy_2` admits both existing policy 1.0 rows and new policy 2.0 proposals without changing existing receipts or weakening the rest of the completeness constraint. New preparation uses `INTERNAL-REVIEW-ACTION-2.0`; stale old prepared proposals still require current-policy validation.
- Generic review selection covers category variances outside alignment, insufficient actual history and programme findings when present. Tests cover opaque keys, aligned/no-findings results, typed `NO_QUOTE_VERSION` / `NOTHING_TO_REVIEW`, bounded bilingual wording, exact evidence IDs, conflicts, supersession, authorization, retries and atomic audit behavior.
- The second fixture, Riverside Display Studio / 河岸展示工作室 (`J-2611-R7K3`), has only custom millwork and signage. Its SQL verification checks its category set, quoted/forecast totals and evidence coverage. Existing financial fixture values were not adjusted.
- Home resolves a public job reference through the authorized project repository before looking up stored comparison IDs. Tests cover that boundary, capability checks before reads, foreign organizations and stored result ownership.

## Browser acceptance

Chrome against the local production build at `http://localhost:3041`; English desktop (1440×1000) and Traditional Chinese mobile (390×844). [Browser results](evidence/browser-results.json) record the exact runs, receipts and 20 refreshed screenshots.

- Riverside: own-category above/below findings and recommendation; prepare and confirm an internal review in both languages; Home titles exactly equal comparison findings and link to the same stored economics run; quote-chat sentences equal those findings after removing citation markers; Home scores display as `/100`; asking about absent imported stone returns a plain no-record answer.
- A job was created through the form with only custom millwork and signage, with no quote. Both languages show actual ranked past jobs and the needs-quote/review-unavailable message. Home, comparison findings and chat contain no unrelated stone/lighting findings or financial percentages. Existing structural evidence-coverage percentages remain structural metadata.
- Viewer cannot see the saved financial findings or prepare a review, including when supplied another member's comparison/economics URL. Nonfinancial `STRUCTURAL_ONLY` and other-organization denial cases also pass automated tests.
- There were no page errors. The only allowed browser console error is the existing missing favicon. [Cleanup](evidence/cleanup.json) confirms all three temporary sessions were revoked and zero active temporary sessions remain; temporary credentials were deleted.

The review revision also verifies in Chrome that another member cannot reuse the saved run, and that a newly inserted active quote version causes both Home and chat to show the exact bilingual out-of-date line. Removing that temporary local quote version restores the same member’s current findings. The temporary quote version and copied quote items were deleted.

Historical whole-job source lists may name stone or lighting records because they support the historical whole-job total. They do not produce category findings for categories absent from the active job. The chat check distinguishes finding text from these legitimate source titles.

## Original job figures

The original synthetic job's inputs are unchanged. Home now uses the same stored economics result as comparison:

| Finding | Old fixed Home text | Stored variance | Current displayed value |
| --- | --- | --- | --- |
| Imported-stone forecast versus reconciled actual history | 18% | 18.3882% | 18.4% above |
| Lighting quoted price versus quoted history | 9% | 9.4329% | 9.4% above |
| Overall quoted price versus quoted history | 7% | 7.1676% | 7.2% above |

Formatting rounds the stored values to one decimal place; it does not recalculate financial variance. The browser record includes the economics run ID and displayed findings. Other eligible findings are now shown instead of restricting Home to three fixed cards.

## Pre-change receipt compatibility

Before this review revision, a real receipt was prepared and confirmed with the merged PR #43 source before applying these migrations. After the original SB-044 upgrade, the services reopened it in both languages and opened 30 historical claim panels (15 prefixed claims × two languages). The 9 pre-existing economics runs, 1 proposal, 1 action, 14 audit events and 1 receipt remain byte-equivalent as serialized JSON. No immutability trigger was disabled. [Compatibility evidence](legacy-receipt-evidence.json) records the receipt and checks.

## Review revisions

- Home returns a saved comparison only when its active-context permission fingerprint matches `permissionFingerprint(context, project.id)` and its active-context source fingerprint matches `ActiveProjectContextService.resolve`. The current-profile lookup reads the active job only; it does not load historical candidates, rerank or recalculate economics. Tests cover the same member with unchanged records, another member, an actual newer quote version, capability denial, and legacy snapshots without this metadata.
- New comparison snapshots preserve the active-context fingerprints and record classification. Existing immutable snapshots are not rewritten. A legacy snapshot without fingerprints shows the typed out-of-date state until the person runs the comparison again. Chat no longer reopens browser-supplied remembered run IDs; all findings and evidence follow-ups use the currently validated result.
- The source fingerprint is **not date-dependent**: `profileFingerprint` hashes the job’s comparison fields and `recordVersion`, whose Prisma adapter includes the job update timestamp, active quote version ID and its creation timestamp. `snapshotDate` is outside that hash. The overall comparison input fingerprint separately includes the date and historical candidates; it is not substituted for the requested active-job check. A clock-crossing unit test verifies unchanged records remain current. No check was weakened.
- A failed saved-findings read returns `UNAVAILABLE` while retaining the authorized job list and workspace. Bilingual rendering tests verify the job remains visible with a linked unavailable message. This injected-failure path was unit/component tested, not fault-injected in Chrome.
- Finding sentences use the requested English and Traditional Chinese templates, unsigned absolute percentages with one decimal, full-width Chinese punctuation, and the exact programme/insufficiency wording. Home, comparison and chat share `claimFindingText`. Updated no-quote/no-comparison Chinese copy and Home `/100` scores are covered.
- Every category has aliases beside its labels. Latin aliases match word boundaries; `milestone` does not match stone. Tests cover all eight category entries, both languages, punctuation, overlapping full labels, and category narrowing within existing quote/evidence intents. `STONE` is renamed to `CATEGORY`; standalone new category intents remain unsupported.
- Comparison notices and the summary synthetic label are present only for `DEMO_SYNTHETIC` active records. Both-language tests verify absence for `TENANT_PRIVATE`; no hosted non-synthetic tenant was used.
- The accepted claim identity migration, policy migration, review policy, authority/denial rules and central environment gate are unchanged. Their regression tests pass in the full check.
- `AGENTS.md` now contains the Product Director’s exact hosted-testing rule. The one-off preview plan was deleted.

## Not verified

- **Hosted acceptance is waiting for the Product Director.** The Product Director uses the Test site workflow described in [TEST_SITE.md](../../../docs/development/TEST_SITE.md), then clicks through the PR. Agents do not deploy, migrate, seed or change hosted project/database settings. No hosted action or database change was performed during this revision. PR #48 remains draft.
- The final GitHub CI result is recorded in [PR #48](https://github.com/FATTY-BAMBA/StrideBrain/pull/48) after publication. The prior revision’s green run is not evidence for this new head.
- Safari/Firefox, assistive-technology testing, performance/load testing, production identity and real customer data.
- The manual pre-change receipt proof above and separate fresh/repeated-fixture command log were retained from the previous revision; they were not repeated separately. The automated migration, legacy evidence and denial regressions did run in the full check.

Issue #46 remains unstarted. No hosted work is delegated to an agent, and this PR stays draft for the Product Director’s test-site acceptance.
