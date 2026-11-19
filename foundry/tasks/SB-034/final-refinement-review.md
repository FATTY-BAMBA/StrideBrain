# Final bounded SB-034 refinement

Date: 19 November 2026 (Asia/Taipei). Branch: `build/sb-034-demo-value-ux`. Baseline: `19c98f799de43876e6eea83fd9d336518476fe0a`. Candidate identity is the commit containing this report; obtain the exact SHA with `git rev-parse HEAD`. No deployment, remote publication or merge was performed.

**Outcome: scoped local UX/value PASS. Ready to proceed to an isolated hosted preview and rehearsal as a separate step. Human first-time comprehension and felt usefulness remain unmeasured.**

## Final changes

1. Mobile Projects no longer stretches its navigation row to fill a short page. The mobile shell now explicitly sizes its first row to content. At 390×844 the Projects sidebar measures 164.71 px in English and 118.71 px in zh-TW, matching the other entry screens instead of the previous approximately 290/280 px. No horizontal document overflow was observed in either Projects view.
2. Knowledge now frames existing company records and past experience; StrideBrain frames understanding and getting project work done. Knowledge uses record-oriented questions; StrideBrain uses comparison, quotation review, next-review and open-action wording. Existing authorized routes and comparison prerequisites remain unchanged. Compact mobile project context and removal of a repeated eyebrow bring the first task/action fully into view. No chat, search, automation or other new capability was created.
3. Normal internal-review presentation keeps the four substantive findings, uncertainty, evidence links, expiry, assignee, due date and explicit confirmation visible. Technical run IDs and the original REFERENCES statement remain available in a closed, keyboard-operable Audit details disclosure. The proposal and persisted rationale are not mutated; domain/service policy, authorization, financial calculations and receipt/audit views are unchanged.

These finish the three requested refinements. The candidate also contains the previously approved SB-034 Home/workspace/comparison/evidence/launchpad implementation and its historical evidence. Those prior documents describe their respective checkpoints; this report, final evidence and final independent review are the current handoff.

## Verification

| Check                                                                                           | Result                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Targeted launchpad, navigation, comparison/evidence, review/date/race and bilingual regressions | 211 passed, 15 files                                                                                          |
| Full `npm run check`                                                                            | PASS: formatting, lint, typecheck, deterministic tests, production build                                      |
| Full test result                                                                                | 584 passed; 130 skipped; 67 files passed, 5 skipped                                                           |
| Lint                                                                                            | 0 errors; 1 existing anonymous-default-export warning in prisma.config.ts                                     |
| Production build ID                                                                             | `t2Tn5VtBS42DDhymHqhH8`                                                                                       |
| Final authenticated screenshots                                                                 | 46: English + zh-TW, 1440×900 + 390×844                                                                       |
| Session-revocation screenshot                                                                   | 1; revoked session cannot list projects                                                                       |
| Evidence sanitization                                                                           | PASS47/47; exact credential/session checks, OCR, binary/metadata checks and visual inspection; 0 EXIF entries |
| Protected historical evidence/fixtures/migrations                                               | 2138 files checked against prior hashes; 0 changes                                                            |
| Independent review                                                                              | `PASS_SCOPED_FINAL_UX_VALUE_REVIEW`                                                                           |

The 130 skipped cases depend on database integration configuration and were not run against Stage9 or another database. This is the requested full deterministic suite/build, not a new exhaustive Stage9 certification. The four new assertions cover both locales' distinct task framing and audit disclosure preserving the immutable proposal and substantive review information. Existing date, confirmation, evidence, navigation and localization tests were retained. The generated Next declaration was restored to the checked-in baseline after build; it is not a product change.

The final visual pass inspected Home, Projects, Knowledge, StrideBrain, Xinyi workspace, comparison, findings, stone evidence, review and closed/open audit details in all four locale/viewport combinations. Two additional mobile views show the stone/programme/lighting findings. The zh-TW desktop workspace is captured at its initial fold, closing the earlier evidence gap. View the [complete screenshot matrix and logs](evidence/final/README.md) and [independent review](final-independent-review.md).

## First-minute value assessment

This is an expert assessment of visible affordances, not a participant result. Home shows the current project, a clear Open project action and concrete task entries. Workspace presents the current quotation and forecast with a prominent comparison route. Comparison names past projects, surfaces review findings before detailed matrices, and connects findings to evidence and an internal follow-up. Knowledge and StrideBrain now explain different starting intentions while sharing existing workflows honestly.

The clearest candidate time-saving moments are discovering comparable past projects without digging through records, seeing the stone variance and lighting evidence limit together, and opening the source behind a finding. None is yet an observed user wow moment. The [pilot usability plan](pilot-usability-plan.md) and [observer sheet](pilot-observer-sheet.md) measure spontaneous understanding, independent task discovery, natural evidence inspection and specific usefulness quotes without teaching the product first.

## Remaining weak spots and limits

- Knowledge and StrideBrain still share destinations because the underlying capabilities are deliberately bounded. Whether their distinction is useful must be observed with first-time participants.
- English mobile navigation puts secondary Settings on a second row. It is usable in the inspected viewport; no further shell redesign is justified by this pass.
- Comparison and evidence contain specialist financial terms and substantial content; mobile users scroll to the priority finding and internal-review controls. The pilot must test whether they interpret the financial basis and limits correctly.
- A retained proposal from the earlier review had expired. The existing expiry guard correctly refused it. The operator used the normal UI to create one fresh comparison/enrichment/proposal; the old records were preserved. Hosted rehearsal should start with a fresh supported comparison and include expiry recovery rather than hand out stale review links.
- New first-time-user 60-second results, qualified human zh-TW wording acceptance, fresh physical-device behavior, full VoiceOver and hosted-environment operation are not established by screenshots or deterministic tests. Final browser capture did not submit an action or re-certify action creation/idempotency against a hosted database.

No further SB-034 product-source change is required by the scoped review. A later change should be driven by a reproducible blocker or observed pilot friction, not by expanding the redesign.

## Isolation and cleanup

Final environment: `SB034-FINAL-20261119`, using the retained separate synthetic database `stridebrain_sb034_ux_20261119` from `SB034-AUTH-20261119`, loopback 127.0.0.1:54354. New temporary synthetic session, unchanged authorization service, private isolated credentials. No Stage9 database connection, customer data, remote database, Vercel/DNS or deployment configuration change.

Only one new session, one comparison, one economics enrichment and one unconsumed proposal were created during this final capture. Combined isolated database totals are 30 projects, 4 sessions (including fixture/revoked sessions), 2 comparisons, 2 enrichments, 2 prepared unconsumed proposals, 0 actions and 0 receipts. No seed/reset or mutation of historical QA state occurred.

The temporary session was revoked; valid active sessions = 0. Browser access after revocation was denied, cookie cleared, tab closed and viewport reset. App process stopped; container exited; ports 3004 and 54354 closed; temporary signing secret and bootstrap handoff removed. The isolated database remains stopped for reproducibility until final review acceptance. See [record counts](evidence/final/final-records.json), [cleanup](evidence/final/cleanup-report.json), [environment](evidence/final/environment.json) and [protected-file hashes result](evidence/final/protected-files-verification.json).

## Next decision

Proceed to prepare an isolated hosted preview from the candidate, then rehearse it with rollback available. This task does not deploy or merge. Before participant access, confirm the essential safe-pilot conditions documented in the pilot plan. Run the 3–5 person study without a feature tour; use the results to choose the next product work.
