# StrideBrain v0.1 — Acceptance and Evaluation Matrix

**Status:** Reconciled release contract for review  
**Scope:** Comparable Project Intelligence L1 controlled demo

## 1. Release rule

`Build complete` does not mean `release approved`.

A release candidate must pass all blocking requirements in this matrix against the exact preview commit/deployment.

## 2. Test layers

```text
Unit/policy
Repository/integration
Fixture validation
API/contract
Browser E2E
Accessibility
Visual QA/regression
Intelligence/evidence evals
Authorization/security
Performance/reliability
Deployment/release
```

## 3. Product and UX acceptance

| ID | Requirement | Test/evidence | Blocking |
|---|---|---|---:|
| PUX-001 | User identifies active Xinyi project/stage/quote within five seconds | moderated QA + visual review | Yes |
| PUX-002 | Hero question available inside project | E2E | Yes |
| PUX-003 | Global nav contains only Home, Projects, Knowledge, StrideBrain, Settings | UI contract test/review | Yes |
| PUX-004 | Project local nav matches Overview, Compare, Commercial, Evidence, Actions | UI test | Yes |
| PUX-005 | Structured results render without optional AI | E2E with AI disabled | Yes |
| PUX-006 | Result header shows match count, actual-evidence sufficiency, policy | E2E/snapshot | Yes |
| PUX-007 | Cards show score, band, reasons, differences, authority, evidence | component/E2E | Yes |
| PUX-008 | Factor detail reconciles score | component + eval | Yes |
| PUX-009 | Comparison table distinguishes quote/forecast/actual/offer | E2E/visual review | Yes |
| PUX-010 | Structured synthesis has four required sections | E2E | Yes |
| PUX-011 | Evidence panel opens from every material hero amount/finding | E2E | Yes |
| PUX-012 | Source deep link returns to exact run/finding | E2E | Yes |
| PUX-013 | Action only appears after complete authorized result | E2E | Yes |
| PUX-014 | Action success shows durable receipt, not toast only | E2E | Yes |
| PUX-015 | Complete hero flow fits ≤10 minutes | timed acceptance | Yes |

## 4. Canonical comparison evals

| ID | Expected behavior | Blocking |
|---|---|---:|
| CPI-001 | `PRJ-XINYI-026` returns six primary matches | Yes |
| CPI-002 | Ranking order: Neihu, Zhongshan, Nanjing, Daan, Songshan, Banqiao | Yes |
| CPI-003 | Expected displayed scores: 88, 81, 79, 71, 69, 63 | Yes |
| CPI-004 | Scores reconcile to factor contributions under `CPI-SIM-1.0` | Yes |
| CPI-005 | Primary candidates have ≥75% known weighted coverage | Yes |
| CPI-006 | Unknown optional factor is `UNKNOWN`, not mismatch | Yes |
| CPI-007 | Same-org/access/completed/class filters run before scoring | Yes |
| CPI-008 | Unauthorized project is absent from candidates/counts/model context | Yes |
| CPI-009 | Below-threshold match appears only as broader/partial per policy | Yes |
| CPI-010 | Tie behavior stable and not described as importance | Yes |

Targets:

- relevant-comparable recall ≥95% on canonical set;
- top-three reviewer acceptance ≥90%;
- factor explanation correctness ≥95%;
- canonical hero ordering exact.

## 5. Economics and authority evals

| ID | Expected behavior | Blocking |
|---|---|---:|
| AUTH-001 | Quote-only records never enter actual-cost aggregate | Yes |
| AUTH-002 | Forecast remains forecast, never actual | Yes |
| AUTH-003 | Supplier offer remains separate and date-bound | Yes |
| AUTH-004 | Actual aggregate uses only completed `RECONCILED_ACTUAL` versions | Yes |
| AUTH-005 | Superseded actual/quote excluded but inspectable | Yes |
| AUTH-006 | Open conflict excludes affected value | Yes |
| AUTH-007 | Stale supplier offer labeled historical/not current | Yes |
| AUTH-008 | Overall actual range requires ≥3 eligible projects | Yes |
| AUTH-009 | Category actual range requires ≥3 eligible observations | Yes |
| AUTH-010 | Lighting with two observations abstains | Yes |
| AUTH-011 | Viewer actuals omitted/redacted before DTO/model | Yes |
| AUTH-012 | Reconstructed/browser-reviewed data cannot become actual automatically | Yes |

Hero tolerance evals:

| Finding | Expected |
|---|---|
| Xinyi quoted price vs top-three quoted median | approximately +7%, tolerance ±0.5 pp |
| Xinyi forecast vs top-three actual median | approximately +6%, tolerance ±0.5 pp |
| Imported stone vs eligible actual median | approximately +18%, tolerance ±0.5 pp |
| Lighting vs quoted median | approximately +9%, tolerance ±0.5 pp |
| Lighting actual range | unavailable; 2/3 |
| Millwork | approximately aligned, ~2% |
| Signage | ~5% below quote history with scope warning |
| Programme | difference shown; no quantified premium |

## 6. Evidence evals

| ID | Requirement | Blocking |
|---|---|---:|
| EVD-001 | Every material hero claim has exact EvidenceReference(s) | Yes |
| EVD-002 | Citation/source supports exact field/value, not generic linked document | Yes |
| EVD-003 | Quote register amount cites QuoteVersion/line evidence | Yes |
| EVD-004 | Actual cost cites ProjectCostVersion/CostLine evidence | Yes |
| EVD-005 | Factor evidence opens exact project facets/records | Yes |
| EVD-006 | Evidence locator displays version/page/row/cell/field as applicable | Yes |
| EVD-007 | Calculation trace lists included authorized observations | Yes |
| EVD-008 | Exclusions show safe reasons without hidden records | Yes |
| EVD-009 | Conflict panel lists exact accessible records/values/impact | Yes |
| EVD-010 | Superseded source links to active successor | Yes |
| EVD-011 | Storage keys/raw unrestricted URLs never appear | Yes |
| EVD-012 | Permission change blocks subsequent source open | Yes |

Targets:

- critical citation/evidence precision ≥98%;
- material unsupported claims: 0;
- unauthorized evidence leakage: 0.

## 7. Authorization/security matrix

| ID | Scenario | Expected | Blocking |
|---|---|---|---:|
| SEC-001 | Browser supplies another organization ID | ignored/rejected; trusted context used | Yes |
| SEC-002 | Cross-org project ID | non-disclosing unavailable | Yes |
| SEC-003 | Cross-org comparison run | unavailable | Yes |
| SEC-004 | Cross-org evidence ID | unavailable | Yes |
| SEC-005 | Cross-org assignee | rejected | Yes |
| SEC-006 | Project Manager assigned to Xinyi | can compare/create action if capability present | Yes |
| SEC-007 | Project Manager unassigned | project unavailable | Yes |
| SEC-008 | Mei explicit actual-read grant | actuals visible | Yes |
| SEC-009 | Project Manager without actual-read | actuals redacted | Yes |
| SEC-010 | Viewer | can run redacted comparison; no ProposedAction | Yes |
| SEC-011 | Viewer calls action endpoint directly | server rejects | Yes |
| SEC-012 | Explicit DENY overrides role/grant | denied | Yes |
| SEC-013 | Permission revoked after run | sensitive run/evidence re-redacted/denied | Yes |
| SEC-014 | Source text contains prompt injection | ignored; no policy/tool change | Yes |
| SEC-015 | Secrets/storage URLs in client bundle/response | none | Yes |
| SEC-016 | CSRF/origin/session attack on action write | rejected | Yes |

Critical/high findings: 0. Verified cross-tenant leakage: 0.

## 8. Action/audit evals

| ID | Scenario | Expected | Blocking |
|---|---|---|---:|
| ACT-001 | Authorized user opens proposal | correct title/rationale/evidence/assignees | Yes |
| ACT-002 | User edits allowed fields | preserved; mandatory statements retained | Yes |
| ACT-003 | Explicit confirmation absent | no write | Yes |
| ACT-004 | Valid confirmation | Action + ActionEvidence + AuditEvent atomic | Yes |
| ACT-005 | Network retry same idempotency key | existing receipt; no duplicate | Yes |
| ACT-006 | Active quote changed | stale rejection, no write | Yes |
| ACT-007 | Evidence authority/conflict changed | stale rejection | Yes |
| ACT-008 | Permission revoked at confirmation | denied | Yes |
| ACT-009 | Assignee inactive/unauthorized | invalid assignee response | Yes |
| ACT-010 | Database failure mid-transaction | no partial Action/AuditEvent | Yes |
| ACT-011 | Success receipt | correct project/run/evidence/audit link | Yes |
| ACT-012 | Failure UI | no fake success; draft preserved when safe | Yes |

Unapproved consequential actions: 0.

## 9. UX state matrix tests

Each accepted state requires component/story or E2E coverage:

```text
PROJECT_LOADING
PROJECT_READY
PROJECT_UNAVAILABLE
PROJECT_CONTEXT_INCOMPLETE
PROJECT_PERMISSION_REDACTED
COMPARISON_IDLE
COMPARISON_RUNNING
COMPARISON_SUCCESS
COMPARISON_NO_ELIGIBLE_HISTORY
COMPARISON_PARTIAL_CONTEXT
COMPARISON_FAILED
COMPARISON_STALE
OPTIONAL_EXPLANATION_PENDING
OPTIONAL_EXPLANATION_UNAVAILABLE
INSUFFICIENT_ACTUAL_COST_EVIDENCE
SUPPLIER_OFFER_STALE
AUTHORITY_CONFLICTED
SOURCE_SUPERSEDED
EVIDENCE_RESTRICTED
EVIDENCE_PANEL_LOADING
EVIDENCE_PANEL_READY
EVIDENCE_PANEL_FAILED
ACTION_NOT_ALLOWED
PROPOSED_ACTION_READY
ACTION_CONFIRMING
ACTION_CREATED
ACTION_STALE_REJECTED
ACTION_PERMISSION_REJECTED
ACTION_ASSIGNEE_REJECTED
ACTION_SERVICE_FAILED
ACTION_DUPLICATE
```

No critical state may be deferred as “edge-case polish.”

## 10. Bilingual matrix

| ID | Requirement | Blocking |
|---|---|---:|
| I18N-001 | `zh-TW` and `en` catalog key parity | Yes |
| I18N-002 | Critical hero flow passes in both locales | Yes |
| I18N-003 | Authority terms remain semantically distinct | Yes |
| I18N-004 | Match bands and factor names natural in Taiwan Chinese | Yes |
| I18N-005 | State/error/action receipt parity | Yes |
| I18N-006 | IDs/values/source relationships stable across switch | Yes |
| I18N-007 | Language switch preserves run/selection/panel/draft | Yes |
| I18N-008 | Chinese density/layout review at realistic lengths | Yes |
| I18N-009 | No mixed-language critical controls | Yes |

Critical parity target: 100%.

## 11. Accessibility matrix

| ID | Requirement | Blocking |
|---|---|---:|
| A11Y-001 | Keyboard complete hero journey | Yes |
| A11Y-002 | Visible focus | Yes |
| A11Y-003 | Semantic landmarks/headings | Yes |
| A11Y-004 | Cards/selectors have accessible names/states | Yes |
| A11Y-005 | Table headers/cell associations or mobile equivalent | Yes |
| A11Y-006 | Evidence panel focus open/return | Yes |
| A11Y-007 | Action sheet error summary/field links | Yes |
| A11Y-008 | Status not color-only | Yes |
| A11Y-009 | Live-region announcements restrained/correct | Yes |
| A11Y-010 | Contrast/target size at critical controls | Yes |

Critical accessibility blockers: 0.

## 12. Performance matrix

Fixture benchmark:

- 24 completed + 5 active projects;
- 300–500 commercial/cost lines;
- 100+ evidence references;
- canonical six matches;
- top-three evidence/economics.

| Interaction | Target | Blocking for L1 |
|---|---:|---:|
| Project useful content | p95 ≤2.5 s | Yes |
| Warm deterministic comparison | p95 ≤2.0 s | Yes |
| Cold deterministic comparison | p95 ≤3.0 s | Yes |
| Evidence panel after result | p95 ≤500 ms | Yes |
| Action creation | p95 ≤1.5 s | Yes |
| Optional explanation | p95 ≤12 s; non-blocking | No if disabled/unavailable state passes |

Also record:

- database query count;
- slowest query plan;
- payload sizes;
- comparison/evidence/action trace spans.

## 13. Reliability/resilience matrix

| ID | Scenario | Expected | Blocking |
|---|---|---|---:|
| REL-001 | Database unavailable on project load | safe project/application error; no fake data | Yes |
| REL-002 | Comparison fails | context retained; retry; no partial success | Yes |
| REL-003 | Optional AI times out | structured result remains | Yes |
| REL-004 | Evidence preview unavailable | metadata/claim remain where valid; retry | Yes |
| REL-005 | Browser refresh with run link | authorized state restores | Yes |
| REL-006 | Stale run direct link | read-only stale state | Yes |
| REL-007 | Action request interrupted after commit | idempotent receipt recovery | Yes |
| REL-008 | Migration/seed failure | build/deploy fails; no partial fixture | Yes |
| REL-009 | Invalid fixture relation | validation fails | Yes |
| REL-010 | Provider disabled | hero flow complete | Yes |

## 14. CI matrix

Required PR checks:

- format;
- lint;
- TypeScript;
- unit/policy/calculation tests;
- Prisma validate/generate;
- migration/schema check;
- fixture validation;
- localization parity;
- production build;
- dependency audit;
- repository/tenant integration tests as soon as DB harness exists.

Required release-candidate checks:

- browser hero journeys both locales;
- accessibility;
- canonical comparison/evidence/authority evals;
- Viewer/cross-tenant tests;
- action/idempotency/stale tests;
- visual QA/regression;
- performance benchmark;
- deployment smoke;
- exact commit/alias/rollback record.

## 15. Release evidence package

- accepted Product Decision Pack;
- accepted UX Architecture;
- accepted Technical Architecture;
- accepted Build Contract;
- CI run links;
- eval report;
- E2E report/screenshots;
- accessibility report;
- bilingual report;
- security/tenant report;
- performance report;
- known limitations;
- exact commit and preview deployment;
- rollback/reseed steps;
- human release approval.

## 16. Blocking policy

Any of the following blocks release:

- unsupported material business claim;
- quote/actual conflation;
- canonical ranking regression without accepted policy/fixture change;
- citation/evidence misrepresentation;
- actual-range output after insufficiency;
- hidden-record leakage;
- unauthorized action;
- partial action/audit write;
- fake success state;
- critical bilingual/accessibility failure;
- critical/high security finding;
- required performance gate missed without accepted mitigation;
- release commit/deployment not identifiable/rollbackable.