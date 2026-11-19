# SB-032 local demo preparation

Updated 19 November 2026 (Asia/Taipei). The user deferred VoiceOver work to prioritize demo preparation. Task remains IN_QA. This is a local rehearsal plan, not Stage 9 release acceptance.

## Current foundation

- Local branch: `build/sb-032-stage9-quality-hardening`.
- Local head: `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`; BUILD_ID `jZBGrkhs4Ok9XriINHgub`.
- Recorded exact-head CI: 44278010987 PASS. S9-F01–F04 have passing published repair evidence; the bilingual core journey has scoped passing evidence.
- Read-only preflight: `http://localhost:3000/en/projects` returned HTTP 200 HTML; listener is `127.0.0.1:3000`. This confirms local service availability, not an authenticated journey or a performance budget.
- The deferred manual session has been revoked. A fresh synthetic session is needed for rehearsal. One-use login links expire after five minutes and the issued session after one hour; prepare them shortly before presenting. Never place a login token in these records, screenshots or a shared link.
- Source, schema, deployment and DNS remain unchanged. The existing synthetic browser database and immutable history are retained.

## Immediate priority: one repeatable presenter journey

Use a desktop Chrome window and the existing isolated synthetic environment. Rehearse the following sequence with a fresh session; do not repeat the full QA matrix merely to prepare the demo.

| Time target | Presenter action                                                            | Message to demonstrate                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:45   | Projects → Xinyi workspace                                                  | Start with the project decision and the current quotation context.                                                                                                                |
| 0:45–1:45   | Open comparison; inspect the selected comparable projects                   | Historical precedents are traceable. Quoted prices, forecast direct costs, reconciled actual costs and supplier offers have different meanings.                                   |
| 1:45–2:45   | Open a supported claim → evidence → supporting source; return               | A reviewer can inspect the exact supporting material. Open lighting insufficiency as a separate example: two observations out of three required; no fabricated actual-cost range. |
| 2:45–3:45   | Open internal review, choose bounded wording, assignee and a valid due date | The user reviews uncertainty and explicitly confirms an internal action. This does not approve a quotation, authorize a commercial commitment or contact anyone externally.       |
| 3:45–4:30   | Confirm once in the isolated synthetic environment; show the receipt        | The action is saved with evidence and an audit trail. Do not click again while confirmation is pending.                                                                           |
| 4:30–5:00   | Reopen through Project Actions; show a locale switch                        | The durable result can be revisited. Both language presentations preserve the same underlying evidence and action.                                                                |

Five minutes is a presentation target, not measured performance evidence. Rehearsal must record any failure honestly. Prepare both locale routes; choose the primary presentation language for the audience. Human zh-TW language approval remains outstanding.

## Pre-presentation and recovery checklist

1. Confirm the expected commit and BUILD_ID, owned local production process, isolated synthetic database and enabled immutable-history guards. Use the existing private operator configuration; do not put credentials in a shell transcript or task record.
2. Issue a fresh run-owned synthetic session just before rehearsal. Keep the one-use login local and private. Do not reuse an expired or consumed bootstrap link.
3. Rehearse the sequence above, including one explicitly authorized synthetic confirmation and receipt reopen. Verify that close/back/refresh can recover the presenter route. Record the new action and preserve its immutable history.
4. If a session expires, issue a new authorized synthetic session. Treat the expired-session screen as an operational condition until a fresh-session defect is established.
5. If comparison inputs change, show the stale warning and re-run comparison using the offered control. Do not prepare a new action from stale results or weaken freshness enforcement.
6. If the local process stops, verify its identity and restart only the owned preview against the same database and unchanged build. Do not kill unrelated processes or reseed the retained QA database.
7. Keep a clearly labeled screenshot walkthrough available if a live service is unavailable. A captured receipt is historical evidence, not a newly completed live action.
8. After rehearsal revoke its owned sessions and close its operator listener. Retain new immutable history and verify fixture/guard integrity.

## Work that remains queued

| Work                                                           | Current disposition                                                                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 VoiceOver and M-06 remaining speech association           | DEFERRED_BY_USER / NOT_VERIFIED; existing pre-demo-release requirements retained. No more listening prompts in the current preparation step. |
| M-02 physical iPhone / Android                                 | Safe private HTTPS/session access and actual device evidence still needed. Desktop rehearsal is not a device pass.                           |
| M-05 live date boundaries                                      | Existing deterministic evidence retained; isolated live-clock method still needs establishment/review.                                       |
| M-07 human Taiwan Traditional Chinese review                   | Prepared package available; human approval outstanding.                                                                                      |
| Security / tenant-isolation and performance / query-plan waves | Not started. Prior explicit execution hold retained; prepare scope without claiming a pass or silently starting these waves.                 |
| Rollback / reseed rehearsal                                    | Must use a separate disposable database; never reset retained browser QA history.                                                            |
| Hosted preview / deployment                                    | Not authorized by the current demo-preparation request. No Vercel or DNS changes.                                                            |

Deferring listening changes the work order, not the recorded acceptance results. Any new reproducible required-path defect must be recorded and classified before a scoped repair. No feature expansion, merge or publication is included in this preparation step.

## Evidence

- [Operational preflight](evidence/manual-acceptance/20261118T142929Z/demo-preflight.json)
- [Manual-wave deferral](evidence/manual-acceptance/20261118T142929Z/deferral.json)
- [Cleanup and history verification](evidence/manual-acceptance/20261118T142929Z/cleanup.json)
- [Passing scoped repair run](evidence/20261118T084208Z/REPORT.md)
- [Existing rollback/reseed contract](rollback-reseed-runbook.md)
