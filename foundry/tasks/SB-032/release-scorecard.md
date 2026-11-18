# SB-032 Stage9 release scorecard

Current scoped verdict: **PASS_SCOPED_REPAIR**. Task state: **IN_QA**. Stage9 and demo release remain incomplete.

Run `20261118T084208Z`. Local repair `4628fb759c8bac23cf92eb15992259fb366a8d65`, direct parent `1bde2114d010c694d017ba2b4116ceffab3569e1`. BUILD_ID `jZBGrkhs4Ok9XriINHgub`. Not pushed; no current-head GitHub CI yet. Historical CI44240367670 PASS applies only to the parent.

| Area | Current outcome |
| --- | --- |
| S9-F02 | PASS: exhaustive bilingual labels; canonical workspace browser grid8/8 |
| S9-F03 | PASS: actual named busy loading status both locales/four sizes; natural desktop plus disclosed bounded read-delay captures |
| S9-F04 | PASS: ABC→AB→ABC8/8, extra1/2/3/AC/DEF transitions, exact economics/evidence/proposal lineage and historical reopen |
| Independent reviews | Plan PASS before implementation; final source PASS |
| Deterministic | 643 tests/70 files PASS;67 targeted,37 localization,93 PostgreSQL adversarial (subsets, not additive);format/lint/types/Prisma PASS |
| Database | Nine clean migrations; two seeds/SQL rounds; populated upgrade plus seven negative rollback cases PASS |
| Production | Build PASS; audit0 vulnerabilities |
| Remaining observed defects | No observed P0/P1 or open required-path P2 in tested scope; untested requirements are not passes |
| Browser baseline | Scoped bilingual core continuation resumed; not full Stage9 matrix acceptance |
| Cleanup | PASS; retained history, revoked issued sessions, fixtures/guards/migration hashes intact |
| Sanitization | PASS: evidence, four task records, screenshot OCR/metadata and known-secret public assets scan |
| Publication | Local repair commit only; four records/new evidence uncommitted; no push, merge, deployment, Vercel or DNS changes |

[Current report](evidence/20261118T084208Z/REPORT.md). [Targeted browser result](evidence/20261118T084208Z/browser/targeted-browser-results.json). [Exact lineage proof](evidence/20261118T084208Z/lineage-verification-targeted.json).

M-01/M-02/M-06/M-07 remain **BLOCKING_BEFORE_DEMO_RELEASE**; M-05 remains **STAGE_9_HARDENING**. No new speech/device/human-language/date-boundary pass is inferred. Security/performance/recovery waves remain unexecuted; targeted repair hold is cleared.

The necessary schema change is limited to economics cardinality and claim ownership. Migrations0001–0008, authority, sufficiency, authorization and action policy are unchanged. See migration-safety.md in the current run.

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
