# Stage9 current limitations and inherited gates

Run `20261118T084208Z` on local repair `4628fb759c8bac23cf92eb15992259fb366a8d65`: **PASS_SCOPED_REPAIR / IN_QA**. S9-F02/F03/F04 are closed for targeted tested scope. Prior run20261118T050551Z remains FAIL/REVISE unchanged. No observed new P0/P1/P2; full Stage9 is not accepted.

| Item | Classification | Current requirement |
| --- | --- | --- |
| M-01 actual speech | BLOCKING_BEFORE_DEMO_RELEASE | Prior VoiceOver exercise has no completed speech attestation; AX loading-name evidence does not close speech |
| M-02 physical devices | BLOCKING_BEFORE_DEMO_RELEASE | Prior paired iPhone16,1/iOS26.5; safe device access/Safari journey unresolved; Android evidence required |
| M-05 date boundaries | STAGE_9_HARDENING | Live isolated browser/server clock method and boundary evidence remain |
| M-06 spoken form/error association | BLOCKING_BEFORE_DEMO_RELEASE | Prior DOM/focus evidence retained; speech and exact unavailable path remain |
| M-07 human Taiwan Chinese review | BLOCKING_BEFORE_DEMO_RELEASE | Updated repaired labels/screenshots available; human linguistic approval not obtained |
| Current-head CI | PUBLICATION_GATE | Local repair is unpushed; parent CI is not new-head CI |
| Full persona/conditional states/recall/groundedness | STAGE9_OPEN | Targeted repair and core continuation do not replace full matrix |
| Security/performance/recovery | NOT_RUN | Targeted hold cleared; complete planned remaining work separately |
| Deployment/hosted smoke | NOT_AUTHORIZED | No public preview, Vercel/DNS change or deployment performed |

F02 browser evidence covers canonical Ready/Good across8 cells; all other enum states are deterministic rendering coverage. F03 includes genuine natural desktop transitions and genuine loading UI/AX under a disclosed45-second operator read delay; this is not a performance benchmark. Initial settled diagnostic frames are excluded from pending proof. One/two-project economics remain intentionally insufficient for action preparation under unchanged three-observation policy. No global latest-wins or economics deduplication policy added.

No limitation waives authorization, tenant isolation, authority/sufficiency or required-path product defects. Further code changes require a new reproduced defect. No release-readiness or human-language/screen-reader/device pass is claimed.

## Current unverified continuation observation

One immediate review-cancel→shell-locale click initially remained English; a settled click switched normally. Independent classification is UNVERIFIED_OBSERVATION, not a demonstrated P2 or a pass. Remaining baseline QA must capture cancel completion, enabled link activation/timing, route/locale and draft identity for immediate and settled clicks in both locales. No additional source repair is justified by this single diagnostic.

Cleanup tooling: viewport.reset returned, then automatic approval review rejected a read-only page-geometry observation after session revocation. It was not retried; the owned tab was closed and absence verified through browser tab metadata. Restored numeric geometry is UNVERIFIED. All product observations preceded revocation and are unaffected.

## Historical limitations retained unchanged

The following describes prior run20261118T050551Z; its findings were open then and are superseded only by the later scoped evidence above.

# Stage 9 known limitations and unresolved gates

Current run `20261118T050551Z` on `1bde2114d010c694d017ba2b4116ceffab3569e1`: **REVISE / NEEDS_REVISION**. S9-F01 remains closed for tested scope. Three new independently confirmed required-path P2 defects remain open; none is waived as a limitation. No observed P0/P1. [Findings and reproduction](evidence/20261118T050551Z/findings.json).

| Item                                    | Classification                   | Current status                                                                                                                                                                          |
| --------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S9-F02 workspace READY/GOOD             | REQUIRED_PATH_P2                 | OPEN; localized presentation mapping needed                                                                                                                                             |
| S9-F03 zh-TW loading English name       | REQUIRED_PATH_P2                 | OPEN; actual active loading boundary confirmed; no speech failure inferred                                                                                                              |
| S9-F04 selection update persistence     | REQUIRED_PATH_P2                 | OPEN; changed and restored sets FAILED before revocation and after fault removal. Unique enrichment/cardinality plus claim-lineage constraints require reviewed explicit scope decision |
| M-01 speech                             | BLOCKING_BEFORE_DEMO_RELEASE     | PARTIAL; VoiceOver/Chrome both locales exercised, user listening attestation pending; NVDA/Windows NOT_AVAILABLE_ON_CURRENT_HOST                                                        |
| M-02 physical device                    | BLOCKING_BEFORE_DEMO_RELEASE     | BLOCKED_DEVICE_ACCESS; paired wired iPhone16,1 / iOS 26.5, Safari not separately recorded. Android UNKNOWN / DEVICE_EVIDENCE_REQUIRED_ANDROID. No physical browser acceptance           |
| M-05 dates                              | STAGE_9_HARDENING                | PARTIAL; 15 existing clock tests PASS. Live browser/server method not established; no host clock/source change                                                                          |
| M-06 generic error association          | BLOCKING_BEFORE_DEMO_RELEASE     | PARTIAL; form summary/alert/focus/draft verified on stale/access/server. Literal EVIDENCE_UNAVAILABLE not reached; speech pending                                                       |
| M-07 Taiwan Chinese                     | BLOCKING_BEFORE_DEMO_RELEASE     | PACKAGE_PREPARED_HUMAN_REVIEW_REQUIRED; source/rendered inventory and current screenshots supplied; full conditional-state grid incomplete                                              |
| M-03 / M-04 / F-08                      | HISTORICAL_PASS                  | Prior Stage 8 passes preserved; zoom/motion unchanged this wave; source focus checked in ordinary Stage 9 baseline                                                                      |
| Pending disabled-controls focus         | UNVERIFIED_OBSERVATION           | Historical transient BODY focus; verify pending keyboard/speech during S9-09, distinguish natural pending from completed error                                                          |
| Published manual geometry qualification | HISTORICAL_SCOPE_LIMITATION      | Some returned control boundaries differ by 0.07–0.11 CSSpx; no operational clipping observed; retain strict and visual observations separately                                          |
| Global source locks                     | L1_KNOWN_LIMITATION              | Existing conservative lock contention; measure serial/concurrent performance; no L2 scale claim                                                                                         |
| Origin defaults to localhost            | DEPLOYMENT_PREFLIGHT_REQUIREMENT | Explicit intended HTTPS origin required in future preview; local smoke cannot prove hosted session/origin behavior                                                                      |
| Reseed deletes synthetic history        | OPERATOR_SAFETY_BOUNDARY         | Only new disposable DBs; never cleanup retained browser QA history with seed/reset                                                                                                      |
| Cloud preview identity and smoke        | NOT_AUTHORIZED_THIS_PHASE        | Contract prepared only; remains release/Stage 9 exit evidence gap, separate deployment approval required                                                                                |
| Human release review                    | PENDING                          | No L1 release approval, no production/pilot readiness claim                                                                                                                             |

No limitation waives critical/high security, cross-tenant leakage, unsupported claims, false authority, unauthorized actions, critical bilingual/accessibility defects or required performance budgets. Future QA may identify defects; record severity, repro and a scope-preserving repair decision then. Neither lack of human/device access nor a tooling error is automatically a product failure, but the associated gate stays open.

## Current execution qualifications

- 174 screenshots reviewed. Requested EN review 390/768 recaptures match measured dimensions. 14 other mismatches do not prove exact viewport geometry; retained with explicit artifact qualifications.
- Preliminary error captures used an old tab binding; corrected explicit-tab eight-case server-error grid supersedes those labels.
- Authority mutation yielded STALE_COMPARISON, not EVIDENCE_UNAVAILABLE. Temporary capability denial yielded ACTION_NOT_AUTHORIZED, the generic access-change UI, not literal ACCESS_CHANGED.
- Changed-selection and restoration controls updated the route but neither saved economics. Both requests preceded session revocation; no expired-session explanation applies. Exact correlated DB exception was not captured; source/catalog support the cardinality/claim-lineage diagnosis.
- VoiceOver ON plus DOM is not a speech PASS. Native setting restored OFF. Device pairing is not Safari/LAN access. Plain HTTP cannot replace the current Secure host-only cookie/exact-origin flow.
- Script durations are not human comprehension/performance measurements. Conflict/restricted/pending/full-persona/retry/quantitative/performance/recovery matrices remain incomplete.
- Historical run 20261118T031855Z and repair run 20261118T040117Z outcomes/evidence remain unchanged. No policy, authorization, tenant, financial/evidence authority, schema, product-source or deployment change was made.
