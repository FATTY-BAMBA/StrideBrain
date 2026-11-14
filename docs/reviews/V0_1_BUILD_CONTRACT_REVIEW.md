# Independent Reconciliation Review — StrideBrain v0.1 Build Contract

**Review scope:** accepted Product Decision Pack, UX Architecture, Technical Architecture, shared DTOs/states, acceptance matrix, and implementation sequence  
**Reviewer stance:** adversarial product, design, architecture, security, quality, and delivery review  
**Verdict:** **PASS FOR STAGED IMPLEMENTATION**

## 1. Executive assessment

The Build Contract successfully reconciles the two accepted architecture tracks into one implementation target.

The UX asks for a project-centered, structured, evidence-backed workflow. The technical system can now support that workflow without relying on browser-owned truth, model-generated business facts, or disposable demo architecture.

The contract is narrow enough to build and complete enough to prevent the implementation team from improvising product behavior.

Implementation may begin in the sequenced stages recorded in `IMPLEMENTATION_SEQUENCE.md`.

This is not approval to skip stage gates, expand scope, move the live demo domain, or use real customer data.

## 2. Consistency checks

## 2.1 Product outcome

**Pass.**

All artifacts describe the same dominant flow:

```text
Xinyi project context
  → deterministic historical comparison
  → explainable ranking and economics
  → exact evidence
  → structured recommendation
  → authorized internal review action
```

No document reintroduces the old feature-catalogue product model.

## 2.2 Information architecture and routes

**Pass.**

The five global surfaces and five project-local views map cleanly to the proposed Next.js routes.

The route model preserves the active project and comparison run while keeping organization and permission authority server-side.

## 2.3 UX states and service outcomes

**Pass.**

The shared DTO/state contract maps the accepted UX states to explicit service outcomes, including:

- context incomplete;
- no eligible history;
- successful comparison;
- unknown optional factors;
- insufficient actual-cost evidence;
- stale supplier offers;
- conflicts and supersession;
- Viewer redaction;
- optional explanation failure;
- stale/denied/invalid/failed/duplicate action creation.

The implementation no longer needs to invent error behavior during coding.

## 2.4 Financial authority

**Pass.**

QuoteVersion, ForecastCostVersion, SupplierOffer, and ProjectCostVersion remain distinct in schema, DTOs, evidence, UI, and evals.

The Build Contract preserves the minimum-three-observation abstention policy and prevents quote-only history from entering actual-cost aggregates.

## 2.5 Similarity model

**Pass.**

`CPI-SIM-1.0` remains deterministic and unchanged. Factor weights, functions, coverage, bands, ties, canonical ordering, and explanation reconciliation are all testable.

The implementation sequence correctly builds the structured baseline before optional AI.

## 2.6 Evidence panel

**Pass with implementation condition.**

The result payload carries claim IDs, top evidence chips, authority/warnings, and primary traces. Full evidence loads on demand from persisted claim/evidence relationships.

This supports the UX without bloating the primary comparison payload.

Condition:

- claim/evidence queries must be indexed and benchmarked against the ≤500 ms target;
- source preview content remains bounded and access checked on every open;
- the UI must not use source counts/titles that are absent under restricted permissions.

## 2.7 Canonical run and Viewer redaction

**Pass with implementation condition.**

The contract chooses a canonical organization-scoped run plus permission-specific DTOs on every read.

Condition:

- sensitive canonical snapshots must never be cached or returned without permission-scope-aware mapping;
- Viewer integration tests must inspect the full response/model-context payload, not only rendered UI;
- access revocation after run creation must be tested.

## 2.8 Action safety and idempotency

**Pass.**

The action flow is explicit, reauthorized, stale-safe, idempotent, transactional, and auditable.

The result/receipt contracts distinguish:

- created;
- already created;
- stale;
- not authorized;
- invalid assignee;
- failed.

A partial Action without AuditEvent is prohibited.

## 2.9 Persistence and fixture strategy

**Pass.**

The first migration is bounded to the objects actually needed by the slice. Horizon Atelier uses the same Postgres schema and repositories intended for future tenants.

The fixture remains synthetic but exercises real domain relationships, permissions, authority, conflicts, staleness, runs, actions, and audits.

## 2.10 Optional AI boundary

**Pass.**

The deterministic result completes the full workflow. Optional explanation is sequenced after the structured UI, action flow, evals, and performance gates.

The provider can be disabled without breaking the release.

## 2.11 Bilingual and accessibility

**Pass at contract level.**

Critical copy/state coverage, semantic term distinctions, route preservation, keyboard behavior, evidence/action focus management, and mobile comparison alternatives are explicitly testable.

Implementation still requires human Traditional Chinese copy review and browser accessibility evidence.

## 2.12 Performance and observability

**Pass with measurement condition.**

Targets are defined for project load, comparison, evidence, action, and optional explanation.

Condition:

- benchmark fixture scale must be seeded before claiming targets;
- query count and plans must be recorded, not latency alone;
- optional explanation must remain outside deterministic comparison latency.

## 3. KEEP

- project-first hierarchy;
- structured results before prose;
- calm five-surface IA;
- deterministic scoring and economics;
- claim-level evidence;
- authority distinctions;
- durable ComparisonRun;
- permission-specific DTOs;
- explicit uncertainty/abstention;
- one governed internal action;
- atomic action/audit transaction;
- exact-decimal contract;
- bilingual/accessibility release gates;
- isolated deployment and controlled cutover.

## 4. CHANGE DURING IMPLEMENTATION ONLY THROUGH REVIEW

The following may be refined, but require Product/UX/Technical review when behavior changes:

- route-state encoding;
- component composition;
- exact visual styling;
- evidence preview format;
- database index choices;
- JSON versus normalized storage details;
- internal repository implementation;
- optional model/provider selection;
- performance optimizations.

These refinements cannot weaken permissions, authority, evidence, accepted states, or product hierarchy.

## 5. REMOVE / DO NOT INTRODUCE

- old static demo runtime files;
- HTML-string rendering;
- browser localStorage as business truth;
- model/provider selector in normal UX;
- top-level agents/AI Team;
- separate historical-estimator module;
- generic `cost` field/table;
- direct Prisma queries in components;
- fixture ID branches in product code;
- vector/semantic ranking;
- arbitrary uploads/OCR;
- external message sending;
- quote approval;
- autonomous or recurring writes;
- real customer data;
- live-domain cutover during the foundation build.

## 6. Required implementation conditions

The following conditions remain blocking during staged implementation:

1. Exact-decimal package and rounding policy land before canonical financial evals.
2. Snapshot/locator/calculation JSON is versioned, validated, and size bounded.
3. Organization scope is present in every private repository query and relation.
4. Cross-tenant tests cover project, quote, cost, evidence, run, assignee, action, and audit IDs.
5. Canonical run reads always reauthorize and generate role-specific DTOs.
6. Evidence panel access rechecks current permission.
7. Action confirmation recomputes material fingerprints.
8. Idempotency and transaction failure tests exist before action acceptance.
9. Structured result is complete before optional AI integration.
10. Critical `zh-TW` copy receives human review before L1 release.
11. Performance is measured against the full target fixture.
12. Every implementation PR identifies applicable acceptance IDs and rollback/migration impact.

## 7. Build authorization scope

Authorized implementation scope:

- Stages 0–9 of `IMPLEMENTATION_SEQUENCE.md`;
- optional Stage 10 only after Stages 0–9 pass;
- isolated preview deployment in Stage 11;
- no live alias/domain movement.

Issue #7 may now be activated and decomposed into stage-specific implementation PRs.

## 8. Final verdict

**PASS FOR STAGED IMPLEMENTATION.**

The accepted artifacts now form one coherent contract across product, UX, data, authorization, evidence, intelligence, action safety, localization, quality, and deployment.

The build team should begin with the application/quality scaffold, not with high-fidelity screens or AI integration.

The first successful implementation milestone is not “the dashboard renders.” It is:

> The project workspace reads production-shaped fixture data through trusted repositories and authorization, with CI proving the architecture boundaries.
