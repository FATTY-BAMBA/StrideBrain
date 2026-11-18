# Stage 9 gap analysis

This is a source/evidence review, not newly executed product QA. `HISTORICAL_PASS` never means an unrun Stage 9 check passed. Facts below were checked against the planning baseline and immutable evidence.

## Source ledger

| Source | Finding / use |
| --- | --- |
| [Issue #32](https://github.com/FATTY-BAMBA/StrideBrain/issues/32) | Nine hardening workstreams; five inherited gates; L1 controlled demo; no features or domain cutover. |
| `docs/build/IMPLEMENTATION_SEQUENCE.md`, Stage 9 | Complete quality/eval evidence and human release review; Stage 10 AI is later, Stage 11 deployment/cutover separately controlled. |
| `docs/build/ACCEPTANCE_AND_EVAL_MATRIX.md` | Blocking requirements, exact scores, economic tolerances, precision targets, state coverage and latency budgets. |
| `docs/quality/QUALITY_CONSTITUTION.md` | L1 only; critical/high security zero; citation correctness ≥98%; bilingual parity 100%; no unsupported readiness claims. |
| `docs/foundry/AGENT_OPERATING_MODEL.md` | Bounded contract, independent review, human release authority. |
| [SB-029 state](../SB-029/state.json), [review](../SB-029/independent-review.md), [scorecard](../SB-029/release-scorecard.md) | Accepted implementation; five explicit future gates; historical QA remains unchanged. |
| [Published final manual run](https://github.com/FATTY-BAMBA/StrideBrain/tree/029f70e8ddce6061bcb5691f4cdfc6bca5f146e2/foundry/tasks/SB-029/evidence/manual-acceptance/20261117T095951Z) | M-03/M-04/F-08 PASS within scope, restoration/sanitization PASS; no speech/phone/date/human-language pass. |
| `package.json`, `.github/workflows/ci.yml`, existing `tests/` | Reusable deterministic gate, PostgreSQL suites and performance instrumentation; no standalone Stage 9 browser/eval package yet. |

The published manual commit is `029f70e8ddce6061bcb5691f4cdfc6bca5f146e2`, branch `qa/sb-029-manual-20261117T095951Z`, direct parent `f67edb3188c51704acac4465c0a72fca146c6d3f`. Git object inventory confirms **178 files / 64 PNG screenshots / 177 SHA256 entries, all matching**. Read `REPORT.txt`, `RESULTS.json`, `cleanup-summary.json`, `settings-restoration.json`, `sanitization.json`. This planning check verifies publication identity/integrity and reads the recorded sanitization result; it is not a fresh OCR or browser run. Capture-time `published:false` describes the earlier local checkpoint and is not rewritten.

The report records actual Chrome 200% and macOS Reduce motion, both locales, 48 contained source-modal keyboard steps, exact trigger return and hierarchical Escape. BUILD_ID `7AxvZ0avDfCi3vJEjHpJH` and CI `44059619525` belong to the Stage 8 product head. Two sessions were revoked, temporary mutations restored, four history guards and eight migration checksums preserved. The later POST to the Codex response service returned 400 after session revocation; it did not affect product observations. No causal claim that expiry caused that external error is made.

## Full gap register

| Gap | Existing evidence / implementation | Missing Stage 9 evidence | Next verification; gate |
| --- | --- | --- | --- |
| G-01 Integrated bilingual flow | Broad Stage 8 matrix plus scoped repair passes | Single current-candidate Home→receipt→Actions journey, all recovery/navigation states | S9-02–06, 09, 12; locally executable after setup; blocking |
| G-02 Accessibility | Focus DOM tests; native zoom/motion scoped PASS | Full keyboard/semantics/contrast/target checks; actual speech; pending-state behavior | S9-07–09, 11; local checks + human M-01; blocking |
| G-03 Real mobile | Responsive browser screenshots | Soft keyboard, touch and native picker on real iOS/Android | S9-10 / M-02; physical devices/operator required; blocking before demo |
| G-04 Visual baselines | Historical screenshots, not a complete reviewed baseline set | 2 locales × 4 viewports × required states, independent comparison/sign-off | S9-12; browser capture now, human Chinese judgement M-07; blocking |
| G-05 Ranking/economics/evidence | Deterministic policy/economics/source tests | Exact-candidate eval denominators, per-claim evidence audit, independent top-three judgement | S9-03–04, 13; automated and reviewer work; blocking |
| G-06 Security | PostgreSQL adversarial tests, server-scoped reads/writes | Fresh exact-candidate tenant/persona matrix and response/DOM non-disclosure evidence | S9-14–15; locally executable isolated DB; blocking |
| G-07 Performance | Stage 8 server proposal/confirmation sampling and bounded-query tests | Whole-system browser p50/p95, cold/warm comparison, query plans across read paths and target fixture volume | S9-16; locally executable; accepted budgets unchanged; blocking |
| G-08 Date boundaries | Injected service clock; leap-date policy tests; midnight service/PostgreSQL tests | Live UI E2E with trustworthy server/browser clock alignment and no-write proofs | S9-17 / M-05; lower layers executable now, browser clock approach must be demonstrated; unresolved Stage 9 requirement |
| G-09 Generic error association | Actual form has `aria-describedby=review-error-summary` when failed; summary is alert/focus target | Correct live form/AX association and spoken description across generic failures | S9-11 / M-06; live DOM executable, speech human; remains demo gate |
| G-10 Human Taiwan Chinese | Catalog parity and targeted localization repair passes | Independent human business-language/authority/layout sign-off | S9-18 / M-07; human reviewer required; blocking before demo |
| G-11 Build/config/deployment | Existing CI/production builds on Stage 8; explicit origin supported | Fresh clean baseline build/start, non-localhost configuration review, exact preview deployment and smoke | S9-01, 19–20; local now; cloud work NOT_AUTHORIZED, release gate remains open |
| G-12 Recovery/reseed | Existing guarded transactional fixture reset; immutable history; Stage 8 rollback notes | Disposable reset failure/recovery and retained-history write-disable/read verification | S9-21; local isolated rehearsal; blocking |
| G-13 Release package | Stage 8 evidence published | Stage 9 reports, manifests, independent reviews, exact candidate/preview, human approval | S9-22; incremental assembly; not complete at planning |

## Inherited manual gates

| Item | Status now | Can start locally | Required external/human evidence |
| --- | --- | --- | --- |
| M-01 | NOT_VERIFIED_MANUAL_REQUIRED — BLOCKING_BEFORE_DEMO_RELEASE | Keyboard, names, live-region/AX inspection | Actual VoiceOver+Chrome speech in EN/zh-TW; NVDA+Chrome/Firefox where available, unsupported combinations explicit |
| M-02 | NOT_VERIFIED_MANUAL_REQUIRED — BLOCKING_BEFORE_DEMO_RELEASE | Responsive browser and DOM checks only | Physical iOS Safari and Android Chrome keyboard/touch/native datepicker, both locales |
| M-03 | HISTORICAL_PASS | Actual Chrome-menu 200% regression in both locales | Native browser zoom evidence; CSS viewport emulation cannot replace it |
| M-04 | HISTORICAL_PASS | Actual OS preference regression in both locales | Native preference plus media-query proof; emulation cannot replace it |
| M-05 | NOT_VERIFIED_MANUAL_REQUIRED — STAGE_9_HARDENING | Policy/service/PostgreSQL clock tests | Exact UI/server date-boundary E2E; test-clock feasibility unresolved, no host-clock or production backdoor change |
| M-06 | NOT_VERIFIED_MANUAL_REQUIRED — BLOCKING_BEFORE_DEMO_RELEASE | Inspect actual dialog form, summary ID, focus and AX | Human spoken-description verification with M-01; DOM alone closes only subcheck |
| M-07 | NOT_VERIFIED_MANUAL_REQUIRED — BLOCKING_BEFORE_DEMO_RELEASE | Automated leakage/parity and screenshot preparation | Independent human Taiwan Traditional Chinese reviewer; agent translation is not sign-off |

## Source observations, not new defects

- `src/lib/server/internal-review-services.ts` accepts a server-side injected clock. Policy tests cover 2028-02-29, invalid 2027-02-29, Taipei midnight and inclusive +365. Service/PostgreSQL tests cover confirmation-time revalidation. Normal HTTP composition uses the real clock; there is no established browser-controlled clock route. Do not claim M-05 E2E from unit tests.
- `src/components/internal-review/internal-review-sheet.tsx` associates its real form with `review-error-summary`. The historical null result used an unverified selector. The live association remains to be checked; no reproduced source defect is established.
- The prior manual report captured transient pending `BODY` focus while confirmation controls were disabled. Completed validation focus passed and pending containment was explicitly unasserted. Investigate S9-09 without inventing a defect or a pass.
- `src/lib/env/server-env.ts` supports explicit HTTP(S) app origin but defaults to localhost. Deployment preflight must require an explicit intended HTTPS origin; do not infer production portability from a localhost build, or change policy on this observation alone.
- `prisma/fixtures/horizon-atelier.sql` is a destructive operator-only synthetic reset: it disables four immutable triggers inside its transaction, deletes the two fixture tenants' history, then re-enables guards. Repeated seed is safe only on the explicitly disposable rehearsal DB. Never use it for browser cleanup or against retained QA history.
- `tests/internal-review/postgres-invariants.test.ts` already measures ≥30 server samples, concurrency and evidence/assignee query growth and writes optional `STAGE8_PERFORMANCE_OUTPUT`. Reuse its output; it is not whole-system browser performance.
- Global source locks are a documented L1 concurrency limitation. Measure before proposing optimization; no permission, authority or lock-policy relaxation to meet a budget.

**Product changes currently required: none established.** Remaining items are evidence gaps or hypotheses awaiting reproduction. A failed required-path check may later justify the smallest repair under the contract; missing infrastructure alone does not authorize a feature.

## Historical outcomes retained

First run `20261116T041837Z`: 9 PASS / 3 FAIL / 5 PARTIAL / 1 BLOCKED. Broad run `20261117T023357Z`: 14 PASS / 2 FAIL / 2 PARTIAL / 0 BLOCKED, QA-16/18 historically FAIL. Targeted `20261117T050611Z` closed F-03/F-07 with prior-fix smoke. Manual `20261117T070845Z` failed M-03/M-04 and exposed F-08; `20261117T095951Z` passed those scoped checks after repair. None becomes a newly claimed all-18 PASS matrix.
