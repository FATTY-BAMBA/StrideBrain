# Stage 9 known limitations and unresolved gates

Planning has established no new reproducible product defect and has run no product tests. Stage 8's passing repairs are inherited evidence, not proof that every Stage 9 requirement is complete.

| Item | Classification | Status / completion evidence |
| --- | --- | --- |
| M-01 actual screen-reader announcements | BLOCKING_BEFORE_DEMO_RELEASE | NOT_VERIFIED_MANUAL_REQUIRED; human VoiceOver+Chrome in both locales, NVDA combinations where available |
| M-02 physical mobile keyboard/touch/native picker | BLOCKING_BEFORE_DEMO_RELEASE | NOT_VERIFIED_MANUAL_REQUIRED; real iOS Safari and Android Chrome, both locales |
| M-05 leap day / Asia-Taipei midnight | STAGE_9_HARDENING | NOT_VERIFIED_MANUAL_REQUIRED; lower-layer tests exist; exact live browser/server boundary evidence remains required |
| M-06 generic form-error description association | BLOCKING_BEFORE_DEMO_RELEASE | NOT_VERIFIED_MANUAL_REQUIRED; live form DOM/AX plus actual spoken description |
| M-07 independent human Taiwan Chinese review | BLOCKING_BEFORE_DEMO_RELEASE | NOT_VERIFIED_MANUAL_REQUIRED; qualified human business-language and four-layout review |
| M-03 / M-04 / F-08 | HISTORICAL_PASS | Native zoom/motion/source-focus PASS on f67edb3; Stage 9 regression planned, no reopened defect without evidence |
| Pending disabled-controls focus | UNVERIFIED_OBSERVATION | Historical transient BODY focus; verify pending keyboard/speech during S9-09, distinguish natural pending from completed error |
| Published manual geometry qualification | HISTORICAL_SCOPE_LIMITATION | Some returned control boundaries differ by 0.07–0.11 CSSpx; no operational clipping observed; retain strict and visual observations separately |
| Global source locks | L1_KNOWN_LIMITATION | Existing conservative lock contention; measure serial/concurrent performance; no L2 scale claim |
| Origin defaults to localhost | DEPLOYMENT_PREFLIGHT_REQUIREMENT | Explicit intended HTTPS origin required in future preview; local smoke cannot prove hosted session/origin behavior |
| Reseed deletes synthetic history | OPERATOR_SAFETY_BOUNDARY | Only new disposable DBs; never cleanup retained browser QA history with seed/reset |
| Cloud preview identity and smoke | NOT_AUTHORIZED_THIS_PHASE | Contract prepared only; remains release/Stage 9 exit evidence gap, separate deployment approval required |
| Human release review | PENDING | No L1 release approval, no production/pilot readiness claim |

No limitation waives critical/high security, cross-tenant leakage, unsupported claims, false authority, unauthorized actions, critical bilingual/accessibility defects or required performance budgets. Future QA may identify defects; record severity, repro and a scope-preserving repair decision then. Neither lack of human/device access nor a tooling error is automatically a product failure, but the associated gate stays open.
