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
- First full check exposed only three historical migration setups: two needed today's independent client-type/city migrations for today's adapters, and one needed to exclude later fixture files from its historical schema. Their assertions were retained. The two application-backed migration suites then passed all 24 tests. Final `npm run check` passes: 186 files, 1,782 tests, format/design gates, lint (one pre-existing anonymous-default-export warning), typecheck and production build. [Complete log](evidence/check.log). [CI 45640729994](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45640729994) passed on `32af769`, including real Prisma migration deployment, two seed/verify passes, the complete check and production dependency audit.

## Paid evaluation

[Run 45641187002](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45641187002), dispatch 1 of 2, tested `32af769eaed80cbff6f5e557b0bd917b6ad7d24f` with gemini-3.5-flash-lite. Estimated cost: US$0.293444000. [Full synthetic report](evidence/evaluation-1.json).

| Round | Questions en | Questions zh-TW | Drafts en | Drafts zh-TW |
| --- | --- | --- | --- | --- |
| 1 | 27/27 | 27/27 | 13/15 | 13/15 |
| 2 | 27/27 | 27/27 | 13/15 | 13/15 |
| 3 | 27/27 | 26/27 | 13/15 | 13/15 |

The question gate passed every round (core scores 20/20, 20/20; 20/20, 20/20; 20/20, 19/20; all required cases passed; no displayed wrong number/amount label/format). Round 3 zh-TW-finding was discarded with FINDING_SENTENCE, so the existing required two-of-three finding pass gate still passed. No question instruction, check, case or pass mark was changed.

The draft gate failed. Each round's full-width cases supplied a city key instead of verbatim city text and were correctly dropped. The English residential case kept a leading article in its fallback job name. The Chinese hosted sentence shortened the client name; one round also removed the space in the area quote (correctly dropped), and another invented a client type (correctly dropped). The oracle and all cases remain unchanged.

Correction before run 2: send city spellings separately with no city keys, so they cannot look like ID choices. Clarify the draft instruction's verbatim fields, complete client noun phrase, short fallback job noun phrase, and preservation of area-quote spacing. The server continues rejecting mismatched city value/quote, invented type support and altered quoted spacing. Provider payload tests prove city names/aliases are sent without keys. No server support rule is relaxed. `npm run check` after correction passed again: 186 files, 1,782 tests and production build. [Second check log](evidence/check-2.log). [CI 45643402318](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45643402318) also passed on the corrected `370d27a`, including deployment commands, repeat seed/verify and full check.

[Run 45643690884](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45643690884), dispatch 2 of 2, tested `370d27adc65ae51148861b9c64d60340c77b5ad5`. Estimated cost: US$0.290675100. [Full synthetic report](evidence/evaluation-2.json).

| Round | Questions en | Questions zh-TW | Drafts en | Drafts zh-TW |
| --- | --- | --- | --- | --- |
| 1 | 26/27 | 27/27 | 15/15 | 14/15 |
| 2 | 27/27 | 27/27 | 15/15 | 15/15 |
| 3 | 27/27 | 27/27 | 15/15 | 14/15 |

The question gate passed all three rounds: core scores 19/20, 20/20; 20/20, 20/20; 20/20, 20/20. All 14 required question cases passed each round; no displayed wrong numbers, amount labels or formats. Calls: median 2, maximum 3, all 54 questions within 3 calls each round. The one English manager-scope answer was discarded for an unsupported scope-count number; the existing question gate still passed. All new Individual/Chinese-city cases and every original draft case passed in every round.

The overall evaluation **failed** because the required `zh-TW-residential-unlisted` case shortened 測試客戶甲 to 客戶甲 in rounds 1 and 3. City, district, area and the unlisted-type behavior were correct in those rounds. Client-type inference from 客戶 was dropped by the existing support check. Round 2 preserved the full client name and passed. The English fallback job name, both full-width city cases and the area quote were corrected in all rounds.

Before review, the proposed instruction clarification explicitly preserves the entire named-client phrase between Chinese benefactive and location markers (幫/替/為 … 在), including initial descriptors, while excluding pronouns and unnamed generic clients. This is general extraction guidance; there are no example client names, fixture references, model changes, oracle edits or relaxed checks. **That superseded clarification did not have a paid evaluation.** Its full local `npm run check` passed: 186 files, 1,782 tests and production build; [final local log](evidence/check-3.log). Final-head CI will be reported in the PR comment. At that point paid acceptance remained unmet and Product Director approval was required before any additional evaluation; the later authorization is recorded below.

Total estimated paid cost across both authorized runs: **US$0.584119100**.

Original allowance: 2 of 2 dispatches used. The Product Director has since authorized one additional three-round evaluation, only after this review fix passes CI.

## Not verified / acceptance waiting

Hosted acceptance is waiting for the Product Director, including the kept-data deploy, Settings clicks, keyboard/mobile visual inspection, and the two Home draft examples. No hosted deploy, migration, seed, setting change or Test site workflow has been run. No browser screenshots were produced for this task; the form checks above are DOM tests. PR remains draft.

## Fix round 1 — confirmed naming rule

Source: [Reviewer (Claude), comment 7167255389](https://github.com/FATTY-BAMBA/StrideBrain/pull/78#issuecomment-7167255389), actually authored by repository owner FATTY-BAMBA (account 101108617). The Product Director confirmed the naming rule and official 臺 city labels in the working chat on 25 November, and authorized one additional three-round paid evaluation **after the fix passes CI**. These decisions are confirmed, not provisional.

- Replaced the descriptive-prefix and 幫/替/為…在 instructions with the confirmed relationship-word rule. 新客戶, 既有客戶, 老客戶, 客戶, new client, existing client and our client are excluded when they only describe the relationship; every other word in the name phrase is kept. No server support check or model changed.
- **Changed two required cases added by this PR**, as the review explicitly requests: the residential client is now Ms. Wang / 王小姐. This corrects the use of the reviewer's placeholder as a naming target; it is not a change to any original evaluation case or pass mark.
- Added required English/Chinese acceptance cases, including exactly 「台中市的住宅裝修，新客戶王先生」. They expect 王先生 / Mr. Wang, city TAICHUNG_CITY, a verbatim residential job name, no inferred area and no job type.
- Retained 「幫測試客戶甲在台北市大安區做一間 30 坪的住宅裝修」 in `reportedCases` in each round, with its values, dropped fields, verdict and cost. It is reported separately and cannot change the gate or compensate for another case. The scored set is now 16 per language: the original 12 still need 10/12, all original required cases still pass, and all four new cases per language are required. Unsupported-kept and one-call checks on the scored set are unchanged. Tests cover a failing reported placeholder alongside a passing scored set and still reject a required or core failure.
- Keep the official 臺北市, 臺中市, 臺南市 and 臺東縣 display names. Both 台 and 臺 input spellings remain accepted.
- Known scope boundary from the review: default client types for a newly created organization currently come from migration/seed only. Production firm creation must initialize them in #42, as with job types; no onboarding code is added here.

Focused regression suite passed: 4 files / 60 tests; [log](evidence/review-1-focused.log). [Fix CI 45650218324](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45650218324) passed on `a167ed82c6c275339c34993edd28d50ffdeeb976`, including migrations, two seed/verify cycles, the complete check and dependency audit. Only after that success, authorized [evaluation 3 / 45651010861](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45651010861) was dispatched on the same full commit SHA. The result failed the draft gate, as detailed below. No hosted operations; PR stays draft for Product Director hosted acceptance.

Local verification recovery: the first full run lost tracked files and Chai/Vitest modules from the old temporary checkout while tests were running. That interrupted check is not counted as a pass. The pushed fix was recovered into a fresh clone at the same commit and the locked dependencies were reinstalled; no source or test assertion was changed for the recovery. Clean `npm run check` passed: 186 files, 1,783 tests, format/design checks, lint (the existing Prisma-config export warning), typecheck and production build. [Full log](evidence/review-1-check.log).


## Authorized third paid evaluation — review fix 1

[Run 45651010861](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45651010861) tested `a167ed82c6c275339c34993edd28d50ffdeeb976` with unchanged gemini-3.5-flash-lite. It was dispatched only after [CI 45650218324](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45650218324) passed on that commit. This used the Product Director's **one additional three-round run**; no further evaluation was dispatched. [Full synthetic report, including per-question/case rates and failed draft payloads](evidence/evaluation-3.json).

| Round | Questions en | Questions zh-TW | Drafts en | Drafts zh-TW |
| --- | --- | --- | --- | --- |
| 1 | 27/27 | 27/27 | 15/16 | 16/16 |
| 2 | 27/27 | 27/27 | 15/16 | 16/16 |
| 3 | 27/27 | 26/27 | 15/16 | 16/16 |

**Overall: failed.** The question gate passed all rounds, including all required hosted/quality cases. Core scores were 20/20 and 20/20, 20/20 and 20/20, then 20/20 and 19/20. No displayed wrong number, amount label or format was reported. Round 3 `zh-TW-finding` was discarded with `FINDING_SENTENCE`; it passed in the other two rounds and the existing two-of-three gate passed. Calls: median 2 each round; maximum 3, 3, 4; 54/54, 54/54, 53/54 questions stayed within three calls. These satisfy the unchanged call gates.

The draft gate failed on **`en-new-client-acceptance` in all three rounds**. The client name `Mr. Wang`, job name `Residential renovation` and city `TAICHUNG_CITY` were correct. But the model also supplied `clientType: { value: "INDIVIDUAL", quote: "new client" }`, and the unchanged server support checks kept it. The evaluator correctly marked `clientType` as unsupported: relationship words do not establish the client's type. This remains a defect; no expected value, oracle, support check, instruction or pass mark was changed after this result. Each round therefore passed 21/22 required draft cases.

Every other scored draft case passed all rounds, including 王先生, 王小姐 and Ms. Wang and all original cases. The separately reported 測試客戶甲 placeholder also passed all three rounds; its outcome does not affect the gate. All 99 draft calls (32 scored plus one reported per round) used one model call each.

Estimated run cost, summed with decimal arithmetic across questions, scored drafts **and reported placeholder calls**: **US$0.302131500**. Total for all three authorized runs: **US$0.886250600**. The additional allowance is exhausted. Paid acceptance remains unmet; the correct names alone do not make this run pass.

Verified for this review: 60 focused tests, full local `npm run check` (186 files / 1,783 tests and production build), CI on the paid-evaluated code commit, and the completed three-round paid report. Subsequent commits contain evidence/documentation only. Not verified: successful paid acceptance, hosted acceptance, screenshots or manual keyboard/mobile use. The Product Director's test-site acceptance is still pending; no hosted operation or Test site workflow was run. PR #78 stays draft.


## Fix round 2 — server support and free recorded-output replay

Source: [owner-authored Reviewer (Claude) comment 7167950702](https://github.com/FATTY-BAMBA/StrideBrain/pull/78#issuecomment-7167950702), account FATTY-BAMBA / 101108617. Requested by the Product Director in the working chat on 26 November 2026 (Asia/Taipei). No paid run is authorized or started in this round.

- One shared constant supplies the seven relationship phrases to both the naming instruction and the server check. After the existing exact-quote/list checks, `supportJobDraft` drops `clientType` when removing those phrases, spaces and punctuation leaves no content. Other fields keep their existing independent validation.
- English and Chinese tests cover every relationship phrase, capitalization, punctuation, repeated/mixed phrases, and preservation of the other fields. Explicit `client type: individual`, 「客戶類型：個人」, bare types and relationship-plus-explicit-type quotes remain supported.
- **The rendered instruction is unchanged byte for byte from `a167ed8`.** A regression pins its SHA-256 to `c3bf0c8b9752f93fe72a76bc88afe1e5f4547a153ecdfd439a9c7d61de2894a2`. Only the shared-constant interpolation changes in the application file. Model, choices, cases, oracle and pass marks are unchanged. No migration or UI changes.

### Replay coverage limitation

The review says the artifact contains every raw draft. Inspection of the original ZIP and `runJobDraftCase` shows that **only failed cases have `rawDraft`**. The archive has one `ai-evaluation.json`; successful cases retain supported values and dropped-field names, but not the original quotes. The workflow logs deliberately contain only metering/verdict metadata. There are exactly three replayable outputs: `en-new-client-acceptance` in rounds 1, 2 and 3. The other 93 scored outputs and three reported placeholder outputs cannot be exactly replayed from this evidence. No raw drafts were reconstructed from expected or kept values, and the original report is unchanged.

The new replay regression sends all three available raw drafts through the real `DraftJob` path, the fixed server support check, and the **unchanged** `runJobDraftCase` evaluator, with a recording-backed model port and disposable local fixture database. All three pass: the unsupported type is dropped and the name/city/job name remain correct. No external model is instantiated; an assertion proves `fetch` is never called. Provider calls: **0**; additional cost: **US$0**. [Replay report](evidence/review-2-replay.json).

| Round | Exact raw outputs replayed | Prior scored passes carried forward (not replayed) | Combined recorded score en | Combined recorded score zh-TW |
| --- | --- | --- | --- | --- |
| 1 | 1/1 en; no zh-TW raw output available | 15 en + 16 zh-TW | 16/16 | 16/16 |
| 2 | 1/1 en; no zh-TW raw output available | 15 en + 16 zh-TW | 16/16 | 16/16 |
| 3 | 1/1 en; no zh-TW raw output available | 15 en + 16 zh-TW | 16/16 | 16/16 |

These combined scores use the original passing verdicts alongside the three newly replayed verdicts; **they are not a full 96-output replay or a new paid pass**. The three original reported placeholder passes are also carried forward, not replayed. The ordinary deterministic fixture replay still covers all cases through the current check, but is not recorded paid output. The Product Director must decide whether the available replay evidence satisfies paid acceptance; it remains pending.

Focused verification passed: 3 files / 67 tests, including the available-output replay and the unchanged-instruction hash; [log](evidence/review-2-focused.log). Full `npm run check` also passed: 187 files / 1,802 tests, format/design checks, lint (only the existing Prisma-config export warning), typecheck and production build. [Full check log](evidence/review-2-check.log). Final-commit CI is reported in the PR checks and the Builder comment. Paid dispatches remain 3 total; cumulative estimated paid cost remains US$0.886250600.

Not verified: exact replay of missing successful raw drafts, paid acceptance of this fix, hosted acceptance, screenshots or manual keyboard/mobile use. Hosted acceptance waits for the Product Director; no hosted operation or Test site workflow. PR stays draft.


## Fix round 3 — complete synthetic raw-draft capture

Source: [owner-authored Reviewer (Claude) comment 7168905315](https://github.com/FATTY-BAMBA/StrideBrain/pull/78#issuecomment-7168905315), actual author FATTY-BAMBA / 101108617. The reviewer confirms the server check and unchanged instruction, and confirms no other raw capture exists for run 45651010861. The Product Director directly authorized **one additional three-round paid evaluation, the fourth and last, only after fix-round-3 CI passes**, in the working chat on 26 November 2026 (Asia/Taipei).

`runJobDraftCase` now includes `rawDraft` for every scored and reported case, whether it passes or fails. If the provider returned no draft, the artifact contains explicit `null`. The complete raw synthetic output remains in the report only; the workflow's metadata-only logging and production usage logs are unchanged. The rest of the harness, cases, expected values, oracle, pass marks, model, instructions and server checks are unchanged. Existing reports are not rewritten.

Regressions verify that all 99 passing deterministic outputs (96 scored plus three reported) survive JSON serialization intact, failed scored/reported outputs are retained, and provider failure records `rawDraft: null`. Existing server-check, instruction-hash and partial replay tests also pass. Focused suite: 3 files / 68 tests; [log](evidence/review-3-focused.log). Full local `npm run check` also passed: 187 files / 1,803 tests, format/design checks, lint (existing Prisma-config export warning only), typecheck and production build. [Full log](evidence/review-3-check.log). Final-code CI is pending before any paid dispatch.

The fourth run has not yet been dispatched. It will use the exact commit that passes CI. No fifth run is authorized. Hosted acceptance remains waiting for the Product Director; PR stays draft, with no hosted operations or Test site workflow.
