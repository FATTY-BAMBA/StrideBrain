# StrideBrain v0.1 — Build Authorization

**Status:** APPROVED FOR STAGED IMPLEMENTATION  
**Authorization date:** 2026-11-14  
**Authorized issue:** #7  
**Authorized vertical slice:** Comparable Project Intelligence

## 1. Decision

The Product Director, Product/UX Architecture, Technical Architecture, Security/Quality review, and reconciliation review authorize staged implementation of StrideBrain v0.1 under the merged product and build contracts.

The approved product outcome is:

```text
Xinyi project context
  → deterministic comparable-project analysis
  → explainable factors and historical economics
  → inspectable claim-level evidence
  → structured recommendation
  → explicitly confirmed internal review action
  → auditable receipt
```

## 2. Authorized stages

Implementation may proceed through Stages 0–9 of `IMPLEMENTATION_SEQUENCE.md`:

0. application and quality scaffold;
1. persistence schema and fixture validator;
2. runtime context and authorization;
3. project workspace read model;
4. deterministic eligibility and similarity core;
5. commercial authority, economics, and evidence claims;
6. structured comparison experience;
7. evidence panel;
8. internal review action and audit;
9. full quality/eval hardening.

Stage 10 optional AI synthesis is authorized only after Stages 0–9 pass their exit gates.

Stage 11 permits an isolated preview deployment but not live-domain cutover.

## 3. Binding source of truth

Implementation must follow:

- `docs/product/V0_1_DECISION_PACK.md`;
- `docs/demo/HORIZON_ATELIER_HERO_NARRATIVE.md`;
- ADR-002 through ADR-006;
- accepted design documents under `docs/design/`;
- accepted technical documents under `docs/architecture/`;
- `docs/build/V0_1_BUILD_CONTRACT.md`;
- `docs/build/SHARED_DTO_AND_STATE_CONTRACT.md`;
- `docs/build/ACCEPTANCE_AND_EVAL_MATRIX.md`;
- `docs/build/IMPLEMENTATION_SEQUENCE.md`;
- `docs/reviews/V0_1_BUILD_CONTRACT_REVIEW.md`.

When documents conflict, implementation stops and the Product Director records a resolving decision. Code must not silently choose.

## 4. Authorized implementation boundaries

The build may include:

- Next.js App Router and strict TypeScript;
- PostgreSQL and Prisma adapter;
- repository/domain/application module boundaries;
- synthetic Horizon Atelier seed;
- L1 signed demo identity adapter;
- English/Traditional Chinese localization;
- deterministic comparison/evidence/action services;
- CI, tests, evals, observability;
- isolated Vercel previews.

## 5. Not authorized

The following remain outside this authorization:

- importing/copying the old static demo runtime wholesale;
- arbitrary customer document upload, OCR, or connector ingestion;
- semantic/vector ranking;
- model marketplace or visible provider selector;
- AI Team/agent catalogue;
- external email, LINE, or supplier/customer communication;
- quotation issue/approval;
- financial-authority conflict resolution workflow;
- autonomous or recurring actions;
- generalized project-management/ERP features;
- real customer data;
- `demo.primestrideai.com` cutover;
- claims of L2 pilot or production/client readiness.

## 6. Quality authority

A stage is complete only when its exit gate and applicable acceptance IDs pass.

A pull request may not self-certify visual, UX, intelligence, security, or release quality. Independent review artifacts and reproducible evidence are required.

Blocking invariants include:

- no quote/actual-cost conflation;
- canonical ranking/evidence behavior;
- no cross-tenant leakage;
- no unauthorized action;
- no fake success state;
- optional AI never blocks or changes authoritative results;
- critical bilingual/accessibility parity;
- action/audit atomicity and idempotency.

## 7. Change control

The implementation team must stop and request a reviewed decision before:

- adding a top-level surface;
- changing similarity weights/thresholds;
- changing authority/sufficiency rules;
- introducing a new write/action type;
- weakening authorization or evidence checks;
- making AI authoritative/blocking;
- using a new data source/classification;
- introducing real customer data;
- changing deployment/domain boundaries;
- exceeding the accepted vertical-slice scope.

## 8. Release boundary

This authorization permits implementation and isolated preview validation only.

A separate release approval is required after:

- exact preview commit identified;
- all applicable Acceptance Matrix gates pass;
- design QA, E2E, accessibility, bilingual, security, performance, and eval reports exist;
- rollback/reseed procedure is tested;
- known limitations are recorded;
- human release owner approves.

## 9. Immediate next action

Activate Issue #7 and begin Stage 0:

> Scaffold the application and quality foundation without implementing a generic dashboard or optional AI.

The first implementation PR must establish architecture boundaries, localization, CI, environment validation, and a minimal honest shell.