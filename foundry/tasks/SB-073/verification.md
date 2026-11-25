# SB-073 verification

Issue #73 was re-read from GitHub before starting, including its 25 November update (`updated_at: 2026-11-25T14:35:29Z`). Started from merged main `9851ca6e000dacea19b9263188a83848dc623fd8`. One draft PR: [#78](https://github.com/FATTY-BAMBA/StrideBrain/pull/78).

## Built, in delivery order

- A: tenant-owned `FirmClientType`, additive migration and repeatable seed/verification. Every organization gets the four initial types; every other stored client value is preserved as an immutable key. Existing clients/jobs/quote versions are not rewritten. Legacy custom labels are bounded to 40 characters; all legacy entries survive even when already over the new-add limit of 30. Settings, client form, new-job form, validation/repositories and model draft choices read the firm's list. Retirement blocks new assignment, while an existing client may retain its retired type. No client-type names remain in `src` outside fixtures. Settings keep the existing capability/membership checks, serializable idempotency and atomic audit; audit payloads contain field names, identities and hashes, never label/contact values.
- B: 22 Taiwan city/county identities and Other, bilingual labels and common aliases. New jobs submit keys; known old city text is mapped by SQL, unknown text remains verbatim. Display resolves labels, including the existing Taipei/New Taipei district translations. The draft quotes the user's city words exactly, then the server resolves the key. The draft instruction handles fields independently when a job type is unlisted; exact-quote, scope, privacy and client-support checks are retained.
- C: complete symmetric shared-land-border reference: 33 unordered pairs from NLSC `COUNTY_MOI_1090820`, [official download page](https://maps.nlsc.gov.tw/pro/download.jsp). The downloaded ZIP's SHA-256 and polygon-boundary derivation are in [county-borders.json](evidence/county-borders.json). Positive-length borders count; point-only contacts and islands without borders do not. The similarity scale remains 1 / 0.6 / 0.3 / 0; unknown text and Other never match.
- D: added three required draft cases per language: Individual client, Chinese city and unsupported residential type (including the exact hosted failure sentence). The original 12 draft cases retain their original 10/12 gate and all required/security/call gates; the six added cases must pass. Reports now show 15 drafts per language per round. Existing question cases and pass marks are unchanged.

## Saved-comparison carry-over

The city migration retains the exact previous text in nullable `Project.locationCityBeforeCanonicalization`, without touching `updatedAt`. The comparison repository projects that old text only while it resolves to the current stored key. This preserves both source fingerprints and the full saved comparison's location/factor values, which the Quote panel also checks. Other readers use the canonical key and localized label. No saved context, result JSON, economics run, issued snapshot or financial value is rewritten; no comparison is run during migration. A later city change uses the new value and fails the ordinary freshness checks.

## Verified locally

- Client types: role/tenant denials, immutable keys, add/rename/retire, atomic idempotent audit, 40-character labels and 30-entry limit including retired entries. An Individual client and keyed Taichung job are created through the real service and displayed in both languages. A populated migration preserves all prior clients, jobs and quote versions, including custom client types.
- Cities/neighbours: all reference spellings resolve without ambiguity; bilingual labels; alias-aware scoring; all 33 official pairs symmetric; islands/unknown places do not match; Taipei–New Taipei and Taichung–Changhua match, Taipei–Kaohsiung does not.
- A kept-data migration test saves real comparison/economics records before applying the city migration, then verifies saved findings AVAILABLE, full freshness CURRENT, Quote panel CURRENT and no Home comparison hint. Existing row counts, project timestamps and saved result JSON stay unchanged. A subsequent city change returns OUT_OF_DATE on Home and Quote.
- Seeded comparison parity uses the unchanged SB-066 baseline; the wider SB-065 baseline includes rankings, exact claims, bilingual sentences, quote suggestions and Home figures.
- DOM tests cover the fixed city select, submitted city key, both languages, dynamic client-type labels and exclusion of retired choices. Deterministic three-round draft replay passes all 15/15 per language.
- First full check exposed only three historical migration setups: two needed today's independent client-type/city migrations for today's adapters, and one needed to exclude later fixture files from its historical schema. Their assertions were retained. The two application-backed migration suites then passed all 24 tests. Final full check and CI: pending.

## Paid evaluation

Allowance: 0 of 2 dispatches used. Three-round paid evaluation pending.

## Not verified / acceptance waiting

Hosted acceptance is waiting for the Product Director, including the kept-data deploy, Settings clicks, keyboard/mobile visual inspection, and the two Home draft examples. No hosted deploy, migration, seed, setting change or Test site workflow has been run. No browser screenshots were produced for this task; the form checks above are DOM tests. PR remains draft.
