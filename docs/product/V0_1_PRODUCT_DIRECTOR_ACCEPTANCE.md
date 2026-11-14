# StrideBrain v0.1 — Product Director Acceptance

**Status:** ACCEPTED  
**Date:** 2026-11-14  
**Accepted scope:** Comparable Project Intelligence decision pack  
**Authorized next phases:** Product/UX Architecture (Issue #5) and Technical Architecture (Issue #6)  
**Application implementation:** BLOCKED pending Issues #5 and #6

## Accepted artifacts

The Product Director accepts the following artifacts as the governing product contract for the first StrideBrain vertical slice:

1. `docs/product/V0_1_DECISION_PACK.md`
2. `docs/demo/HORIZON_ATELIER_HERO_NARRATIVE.md`
3. `docs/decisions/ADR-002-historical-evidence-authority.md`
4. `docs/decisions/ADR-003-comparable-project-similarity-v0-1.md`
5. `docs/decisions/ADR-004-first-governed-action.md`
6. `docs/reviews/V0_1_DECISION_PACK_REVIEW.md`

These decisions are consistent with:

- the Product Constitution;
- StrideGraph v0.1;
- the prototype extraction audit;
- the Comparable Project Intelligence extraction brief;
- the Quality Constitution.

## Decisions accepted

### Product and narrative

- Horizon Atelier / 禾序空間設計 is the first fixture organization.
- Xinyi Flagship Renovation / 信義旗艦店裝修 is the hero active project.
- Mei Lin / 林美玲 is the hero user.
- The first outcome is Comparable Project Intelligence.
- The complete hero flow must fit inside ten minutes.

### Historical authority

- quoted price, supplier offer, forecast direct cost, and reconciled actual cost remain distinct;
- only eligible reconciled completed-project costs enter actual-cost aggregates;
- insufficient/conflicted evidence abstains;
- reconstructed demo costs cannot silently become authoritative actuals.

### Similarity

- `CPI-SIM-1.0` is deterministic and structured;
- weights and formulas are locked;
- semantic/vector scoring is deferred;
- result explanations and evidence coverage are mandatory;
- the canonical fixture ordering becomes an eval contract.

### Evidence experience

- match reasons, important differences, economics labels, source chips, and warnings are visible in the primary result;
- exact evidence and authority are available in the evidence panel;
- optional model prose cannot replace the structured result.

### First governed action

- the only first-slice write is an internal review Action;
- a ProposedAction does not change business state;
- explicit user confirmation, server authorization, and audit are required;
- external send and financial approval are excluded.

### Roles and release level

- permissions are server-derived capabilities, not UI role labels;
- the hero user is authorized to see sensitive historical cost evidence;
- Viewer economics are redacted and Viewer action creation is denied;
- the first release is L1 controlled demo with L2-shaped seams;
- no real customer data is allowed before L2 gates pass.

## Conditions attached to acceptance

### Issue #5 — Product/UX Architecture

Must define and independently review:

- five-surface information architecture;
- project workspace hierarchy;
- comparable cards/table;
- evidence panel;
- conversational control surface;
- complete loading/empty/error/conflict/stale/permission/action states;
- English/Traditional Chinese terminology and density;
- responsive/accessibility behavior.

### Issue #6 — Technical Architecture

Must define and independently review:

- implementation schema;
- runtime context and authorization;
- repository contracts;
- authority/evidence enforcement;
- deterministic comparison service;
- action/audit transaction;
- fixture seeding and canonical evals;
- observability, performance measurement, safe errors, and rollback.

### Issue #7 — Application Foundation

Remains blocked until Issues #5 and #6 are accepted and reconciled.

No generic dashboard, copied browser runtime, provisional schema, or domain cutover is authorized by this acceptance.

## Product Director rejection conditions

Downstream work must return for product review if it:

- merges quote and actual-cost meaning;
- changes similarity weights or thresholds without a new policy version;
- introduces semantic scoring into v0.1;
- hides material uncertainty/conflict;
- makes provider/model selection a primary user experience;
- adds external sending or financial approval;
- introduces another top-level product module without clear product justification;
- hard-codes Horizon Atelier behavior into reusable domain/UI services;
- claims L2 or production readiness without the required evidence.

## Acceptance statement

The decision pack is sufficiently specific, coherent, safe, and testable to proceed to Product/UX Architecture and Technical Architecture in parallel.

It is not sufficient on its own to begin application implementation.

The next valid product artifacts are the Issue #5 design/state contracts and Issue #6 implementation architecture—not additional prototype features.
