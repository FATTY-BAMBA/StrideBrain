# Current S9-F05 repair checkpoint — 20261119T040319Z

Stage 9 is **IN_QA**. Verdict: **PASS_SCOPED_REPAIR; manual gates pending**. S9-F05 is **closed for tested scope** and M-05 is **PASS**. No unresolved observed P0/P1/required-path P2 remains. This is not pilot/release acceptance.

Local repair `0b442bf23433fb7c288c66cb3b36329e1cb8df3d`, direct parent `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`. Six product files and six regression-test files changed; no schema/migration, dependency, authorization, tenant-isolation, evidence-authority, deployment or unrelated feature change. BUILD_ID `tJ3t0INa7eLqU4wZug1oZ`. The commit is local only; exact-head GitHub CI has not run. Historical published CI 44278010987 PASS applies only to `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`.

Independent repair/source reviews PASS. Full deterministic suite **686 tests / 71 files PASS**; localization **37 / 5 PASS**; independent review tests **185 / 5 PASS** in America/Los_Angeles. Format, lint, strict TypeScript, Prisma validate/generate, nine clean migrations, two seed/SQL rounds, PostgreSQL adversarial tests and production build PASS. Production audit: **0 vulnerabilities**. One pre-existing lint warning retained. Counts overlap and must not be added.

Live production Chrome verified automatic bounds refresh in both locales across Taipei midnight, with route, proposal, draft and focus preserved. English: `2028-02-28..2029-02-27` → `2028-02-29..2029-02-28`; zh-TW: `2028-02-29..2029-02-28` → `2028-03-01..2029-03-01`. Four client-invalid and six actual HTTP-invalid attempts made zero business writes. Four valid new-today/+365 actions, audits and receipts were persisted and retained.

| Gate                        | Current disposition                                                                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-05 / S9-F05               | PASS / closed for tested scope                                                                                                                                             |
| M-02                        | iPhone16,1, iOS 26.5 detected and available over USB; Safari NOT_RUN; phone-trusted private HTTPS and same-origin session access unvalidated                               |
| M-07                        | Human review pending by user instruction; 89 historical + 9 new Chinese screenshots, three new date-policy strings; incomplete conditional-state coverage remains explicit |
| M-01                        | DEFERRED_BEFORE_BROADER_RELEASE; no speech PASS                                                                                                                            |
| M-06                        | Prior DOM/focus evidence retained; speech DEFERRED_BEFORE_BROADER_RELEASE                                                                                                  |
| Security / tenant isolation | NOT_RUN; resume after M-02/M-07 prerequisites                                                                                                                              |
| Performance / query plans   | NOT_RUN; follows security                                                                                                                                                  |
| Deployment-smoke readiness  | NOT_READY; no deployment authorized or performed                                                                                                                           |

Cleanup PASS: four run-owned sessions revoked, pending bootstrap files absent, owned app/operator stopped, fixture rows and four immutable-history guards unchanged. Supplemental post-QA pristine-fixture SQL invocation failed its exact-two-session assertion because six rows were retained; the failure is preserved and qualified by exact row/guard/session evidence, not relabeled PASS. All clean pre-QA SQL rounds passed.

[Repair report](evidence/s9-f05-repair/20261119T040319Z/REPORT.md), [date evidence](evidence/s9-f05-repair/20261119T040319Z/M-05-results.json), [SQL qualification](evidence/s9-f05-repair/20261119T040319Z/operator/closure-sql-qualification.md), [human review package](evidence/s9-f05-repair/20261119T040319Z/human-review/M-07-review-sheet.md). Historical failed run `20261119T032345Z` remains FAIL/REVISE. Task records and new evidence are local and uncommitted. No push, merge, deployment, DNS or Vercel change.

---

# Historical checkpoints below

The following text is retained as previously recorded. Its then-current heads, statuses and gates are historical, superseded only where explicitly stated above.

# Current pilot readiness — 20261119T032345Z

Task **NEEDS_REVISION**; verdict **REVISE**. Candidate `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4` remains unchanged. M-05 reproduced **S9-F05 / required-path P2** in English and zh-TW: after Taipei midnight, the server rejects yesterday but the open form still advertises the old range. Eight invalid-date before/after comparisons show zero business writes; no observed P0/P1. See [finding](evidence/pilot-readiness/20261119T032345Z/S9-F05-review.md) and [run report](evidence/pilot-readiness/20261119T032345Z/REPORT.md). No product repair has been applied.

M-01 remains **DEFERRED_BEFORE_BROADER_RELEASE**, explicitly not PASS; M-06 completed DOM/focus/error-association evidence is retained and only speech-dependent verification is deferred. This reflects the user-approved controlled 3–5-person synthetic pilot scope.

M-02 physical iPhone: no current device detected; safe private HTTPS/session access not validated. Android status: **DEVICE_EVIDENCE_REQUIRED_ANDROID**, availability unknown, absence alone non-blocking for this controlled pilot. M-07: review sheet and 89 current-source Chinese screenshot references prepared; incomplete conditional-state coverage and no human approval. Security/tenant and performance/query-plan waves **NOT_RUN** because required-path P2 remains. No security audit pass, latency percentile or query-plan conclusion is claimed.

Local deployment preflight PASS: clean locked install, Prisma generation, nine clean migrations, repeated seed/SQL, clean production build/start and zero production dependency vulnerabilities. Browser-tested BUILD_ID `jZBGrkhs4Ok9XriINHgub`; separate clean build `VWVPZBkA5qyo-jz64t2C1` received startup-only smoke. Hosted preview readiness **BLOCKED** by S9-F05, device/language and downstream gates, reviewed hosted session delivery and actual hosted smoke. No deployment, DNS/Vercel change, merge or publication.

Cleanup PASS: three owned sessions revoked, test processes stopped, original fixture/history rows and nine migration/four guard checks preserved. All 1,686 prior evidence files remain unchanged. New immutable records retained, including one setup action excluded from boundary pass evidence. Historical checkpoints below keep their original outcomes.

---

# Controlled pilot critical path — 20261119T032345Z

User decision: immediate target is a **3–5 person synthetic-data pilot**. M-01 is **DEFERRED_BEFORE_BROADER_RELEASE**, not PASS and not on this pilot's current critical path. Completed M-06 DOM/focus/error-association evidence remains valid; only speech-dependent verification is deferred with M-01. Android physical evidence is still outstanding, but lack of Android hardware alone does not block this controlled pilot unless supported-release policy requires it.

Task remains **IN_QA**, exact candidate `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`, BUILD_ID `jZBGrkhs4Ok9XriINHgub`. New run `20261119T032345Z` preserves all previous evidence, including 094310 and 142929. Current gate: M-05 isolated live date validation. Next: M-02 physical iPhone, M-07 human zh-TW, conditional security, then performance, then deployment-smoke readiness. No product change, deployment or merge authorized by deferral. Historical checkpoints below retain their then-current classifications and do not override this product decision.

---

# Current priority — local demo preparation

Task state **IN_QA**. The user deferred M-01 VoiceOver and the remaining M-06 speech observations on 19 November 2026 (Asia/Taipei) to focus on demo preparation. These checks are **DEFERRED_BY_USER / NOT_VERIFIED**, with existing pre-demo-release classifications retained. No speech pass or release waiver is claimed.

Run `20261118T142929Z` closed incomplete: VoiceOver observed OFF, the one run-owned session revoked, bootstrap listener stopped, prior database rows and all four history guards preserved, nine migrations unchanged, and no action/receipt/audit added. All 1,662 prior evidence files remain unchanged. The ambiguous page-title response is recorded without interpreting it as a spoken announcement.

Current local product head `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4` and BUILD_ID `jZBGrkhs4Ok9XriINHgub` are unchanged. The existing local server responds on loopback port 3000; this is an unauthenticated operational check, not a fresh hero-journey pass. Published repair and earlier CI evidence remain as recorded.

Next focus: [repeatable local demo, walkthrough and recovery](demo-readiness-priorities.md). M-02 device, M-05 live-date and M-07 human-language gaps remain explicit. Security/performance have not started and their earlier explicit execution hold is retained. No product edit, publication, merge or deployment.

The records below retain earlier checkpoints; their then-current statuses are historical.

---

# SB-032 Stage 9 release scorecard

Task state: **IN_QA**. Scoped F02/F03/F04 repair verdict remains **PASS_SCOPED_REPAIR**. Current follow-up `20261118T094310Z` is **PARTIAL_MANUAL_VERIFICATION_PENDING**; no Stage 9, demo or release acceptance.

Published head `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`, parent `4628fb759c8bac23cf92eb15992259fb366a8d65`. [Exact-head CI 44278010987](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/44278010987) **PASS**. Repair and both failed/passing runs published normally; PR #33 remains OPEN/DRAFT/UNMERGED. This follow-up and current task updates are local, not yet published.

The product source is unchanged from the validated repair; BUILD_ID `jZBGrkhs4Ok9XriINHgub` is reused with source-equivalence proof. The 643-test/70-file deterministic gate, approved migration 0009, nine clean migrations and SQL/seed/upgrade checks remain passing. Historical migrations 0001–0008 and SB-029 evidence are unchanged.

| Item                          | Current result                                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S9-F01–F04                    | Passing independent repairs retained; no new confirmed P0/P1/P2                                                                                                                         |
| Rapid cancel→locale           | One focused bilingual attempt: shell click occurred while modal still busy/covering it; settled controls worked. Navigation race remains UNCONFIRMED, no repair justified               |
| Geometry                      | Prior completed baseline preserved. New viewport reset measured before session revocation. Native speech captures have explicit scaling/margin limitations; no exact-grid pass inferred |
| M-01                          | BLOCKING_BEFORE_DEMO_RELEASE; actual VoiceOver setting ON and bilingual cues recorded, listener attestation still pending; NVDA/Windows unavailable                                     |
| M-06                          | BLOCKING_BEFORE_DEMO_RELEASE; current generic-error association/focus/draft PASS both locales; actual speech and exact unavailable path remain unresolved                               |
| M-05                          | STAGE_9_HARDENING; existing injected-clock evidence retained, reviewed live browser clock method still needed                                                                           |
| M-02                          | BLOCKING_BEFORE_DEMO_RELEASE; historical iPhone16,1/iOS26.5 retained, current availability not reconfirmed, safe local HTTPS/session path not validated; Android evidence required      |
| M-07                          | BLOCKING_BEFORE_DEMO_RELEASE; current source/screenshot review package prepared; no human zh-TW approval                                                                                |
| Security/performance/recovery | NOT_RUN; do not unlock security/performance until the ordered manual gates are resolved                                                                                                 |
| Cleanup                       | PASS: owned session revoked, temporary assignment restored exactly, history/guards intact, VoiceOver OFF and viewport override reset                                                    |
| Sanitization                  | PASS; see current run sanitization.json                                                                                                                                                 |

[Follow-up report](evidence/20261118T094310Z/REPORT.md). [Published passing repair report](evidence/20261118T084208Z/REPORT.md). Failed run `20261118T050551Z` remains FAIL/REVISE and passing run `20261118T084208Z` remains scoped PASS; neither is rewritten.

No product change, deployment, DNS/Vercel change or merge occurred in this follow-up. No human-language, speech or device pass is inferred from source/DOM evidence. Full persona/conditional-state/quantitative/recovery coverage remains open. Prior one/two-project insufficiency policy, loading-delay qualifications and historical geometry limitations remain as recorded in their original evidence.

## Historical scorecard retained unchanged

The following describes run20261118T050551Z at its tested head; it is not the current verdict.

# SB-032 Stage 9 release scorecard

Current verdict: **REVISE**. Task state: **NEEDS_REVISION**. Stage 9 and demo release are not accepted.

Run `20261118T050551Z`, head `1bde2114d010c694d017ba2b4116ceffab3569e1`, branch `build/sb-032-stage9-quality-hardening`, BUILD_ID `D-m5LLqTQcus07rZUtxWj`. [Exact-head CI 44240367670](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/44240367670) PASS. [Current report](evidence/20261118T050551Z/REPORT.md).

| Area                       | Current outcome                                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S9-F01                     | Published repair remains closed for tested scope; Projects entry exercised both locales/four widths                                                               |
| Browser baseline           | FAIL: core eight journeys completed, but changed-selection economics persistence and zh-TW labels fail                                                            |
| S9-F02                     | Required-path P2 OPEN: READY/GOOD workspace enums                                                                                                                 |
| S9-F03                     | Required-path P2 OPEN: English comparison-loading accessible label on zh-TW route                                                                                 |
| S9-F04                     | Required-path P2 OPEN: changed selection and restoration both FAILED; no new economics saved                                                                      |
| Independent classification | Three P2 confirmed; no observed P0/P1. F04 needs explicit cardinality/claim-lineage scope decision                                                                |
| Deterministic              | Exact-head CI PASS; fresh Prisma, eight migrations, repeated seed/SQL and build PASS; 15 selected clock tests PASS. Full suite not rerun this wave                |
| M-01                       | PARTIAL: actual VoiceOver+Chrome exercised; actual speech attestation pending. NVDA/Windows unavailable on current host                                           |
| M-02                       | BLOCKED_DEVICE_ACCESS: paired wired iPhone16,1 / iOS 26.5; no Safari journey; Android availability unknown                                                        |
| M-05                       | PARTIAL: leap/bounds/midnight lower-layer tests PASS; live UI/server clock method not established                                                                 |
| M-06                       | PARTIAL: live stale/access/server DOM association, focus and draft preservation observed; exact EVIDENCE_UNAVAILABLE and actual speech remain                     |
| M-07                       | Package prepared: 36 core zh-TW grid captures, 594 source-copy entries, rendered copy/checklist; human approval pending, conditional states incomplete            |
| Visual artifacts           | 174 reviewed; EN review 390/768 recaptures match. 14 other pixel/CSS mismatches/preliminary tab-binding captures qualified                                        |
| Cleanup                    | PASS: 1 owned session revoked, issuer stopped, five mutations and one fault restored, 10 actions/receipts/audits retained, four guards/eight migrations unchanged |
| Sanitization               | PASS (new evidence, four task records, screenshot OCR/metadata and known-private-value public bundle scan)                                                        |
| Next waves                 | Security and baseline-dependent mutating performance HOLD until required-path defects resolved                                                                    |
| Changes                    | Four task records and new evidence only; no product/schema changes, push, merge, deployment or Vercel/DNS operation                                               |

Full-plan coverage: `{'PASS': 1, 'FAIL': 5, 'PARTIAL': 12, 'NOT_RUN': 3, 'BLOCKED': 1}`. Scenario status reflects aggregate coverage, not 22 complete executions. Historical run 20261118T031855Z remains REVISE; run 20261118T040117Z remains PASS_SCOPED_REPAIR with incomplete baseline. Stage 8 history is unchanged. M-01/M-02/M-06/M-07 remain BLOCKING_BEFORE_DEMO_RELEASE; M-05 remains STAGE_9_HARDENING.
