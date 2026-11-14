# Independent Review — StrideBrain v0.1 Decision Pack

**Review date:** 2026-11-14  
**Scope:** Product Decision Pack, Horizon Atelier hero narrative, ADR-002, ADR-003, ADR-004  
**Reviewer stance:** adversarial product, UX, architecture, intelligence-quality, and safety review  
**Verdict:** **PASS FOR UX + TECHNICAL ARCHITECTURE; IMPLEMENTATION REMAINS BLOCKED**

## 1. Review question

Do the locked decisions define one coherent, trustworthy first product slice without reproducing the old prototype’s feature catalogue or creating disposable demo architecture?

## 2. Product coherence review

### PASS

The decision pack:

- centers one user outcome;
- starts inside a real project object;
- connects context, history, comparison, evidence, recommendation, and action;
- keeps the first release focused on Taiwan interior design/renovation;
- maintains a configuration/extension path without pretending to solve every industry;
- ends in one governed internal action rather than a broad agent platform.

### Strength

The hero question is concrete and economically meaningful:

> “Have we done something like this before?”

It demonstrates company-specific value that a generic chat interface cannot provide without the company’s project history.

### Scope control

The following are correctly deferred:

- arbitrary upload/OCR;
- semantic/vector similarity;
- external messaging;
- autonomous agents;
- quotation approval;
- live supplier pricing;
- production tenant onboarding.

## 3. Historical authority review

### PASS

ADR-002 prevents the most serious trust failure: treating quoted prices, supplier offers, forecasts, and actual costs as equivalent.

Required invariants are explicit:

- quote-only records cannot enter actual-cost aggregates;
- actual ranges require completed, reconciled, evidence-linked records;
- conflicts abstain;
- supersession is explicit;
- stale supplier offers remain historical;
- reconstructed/demo records cannot silently become authoritative actuals.

### Required Technical Architecture follow-through

Issue #6 must encode these distinctions as domain types and repository policies. A generic `amount` or `cost` model without observation/authority metadata would violate the decision.

## 4. Similarity-policy review

### PASS WITH EVAL REQUIREMENT

The structured policy is appropriately deterministic and explainable for v0.1.

The selected weights place most influence on:

- scope;
- area;
- project subtype;
- category composition.

This is consistent with the intended interior-renovation decision.

### Risks

1. Jaccard similarity depends on taxonomy quality.
2. Missing optional data earns no points and could favor cleaner records.
3. The location factor may add little value inside Taipei.
4. Exact canonical scores are fixture-dependent.

### Required mitigations

- publish factor-level contributions;
- expose evidence coverage;
- create canonical ranking evals;
- include incomplete fixture records;
- version all changes;
- never describe the score as business-impact certainty.

Deferring semantic scoring is approved. It should not be added informally during implementation.

## 5. UX review

### PASS FOR DESIGN ARCHITECTURE

The narrative specifies a clear result hierarchy:

1. comparison result;
2. why it matches;
3. important differences;
4. evidence;
5. current-quote implications;
6. internal review action.

This is significantly stronger than a chat-only answer.

### Required Design Architecture follow-through

Issue #5 must ensure:

- the result is an interface, not formatted prose;
- quote, forecast, supplier offer, and actual cost are visually unmistakable;
- evidence is visible without overwhelming the result;
- missing/conflict/stale states are designed;
- the five-surface IA remains intact;
- Chinese text density and terminology are tested;
- provider/model/agent plumbing stays hidden.

### Copy warning

The interface must not describe an 18% historical variance as “overpriced.” The correct framing is “requires review” unless authoritative current evidence supports a stronger conclusion.

## 6. Governed-action review

### PASS

ADR-004 correctly separates:

```text
proposal → review → authorization → explicit confirmation → action + audit
```

The internal review action is consequential enough to prove product value but bounded enough for L1.

### Required safeguards

- confirmation-time permission recheck;
- stale comparison invalidation;
- atomic Action + AuditEvent write;
- no cross-organization assignee/evidence IDs;
- success receipt rather than toast-only feedback;
- no model-direct writes.

## 7. Role and permission review

### PASS WITH IMPLEMENTATION CAUTION

The capability-based rule is stronger than rigid role-name checks.

The hero user is explicitly granted sensitive-cost access; Viewer behavior remains redacted.

Issue #6 must define:

- exact capabilities;
- project-assignment checks;
- sensitive-economics redaction;
- non-disclosure behavior for unauthorized records;
- audit of denied action attempts where appropriate.

## 8. Demo integrity review

### PASS

The narrative clearly states that all figures are synthetic and prohibits claims of:

- market pricing;
- real supplier confirmation;
- autonomous approval;
- real customer data access;
- production/pilot readiness.

The canonical comparison deliberately includes:

- three actual-cost-qualified comparables;
- one category with insufficient actual evidence;
- a meaningful but unquantified schedule difference;
- a safe review recommendation.

This is a strong trust demonstration because the system is designed to abstain where evidence is insufficient.

## 9. Performance and resilience review

### PASS AS INITIAL BUDGET

The key architectural decision is correct:

> structured results do not wait for model synthesis.

Issue #6 must define how these timings are measured and traced. Issue #7 must not call the budgets met without preview evidence.

## 10. Consistency check

The decision artifacts are internally consistent on these critical points:

| Question | Consistent decision |
|---|---|
| First market | Taiwan interior design/renovation |
| First company | Horizon Atelier / 禾序空間設計 |
| First project | Xinyi Flagship Renovation |
| First outcome | Comparable Project Intelligence |
| Similarity authority | deterministic structured service |
| Semantic scoring | deferred |
| Actual cost authority | reconciled completed-project cost only |
| First write | internal review Action only |
| External sends | excluded |
| Release level | L1 controlled demo |
| Real customer data | prohibited until L2 |

## 11. Build blockers retained

Application implementation must not begin until:

1. Issue #5 produces and passes Design Critic review;
2. Issue #6 produces and passes Technical Architecture/Security review;
3. the UX and technical contracts reconcile with the policy IDs in this pack;
4. fixture schema and canonical ranking tests are defined;
5. no unresolved disagreement remains about quote/actual authority or action permissions.

## 12. Required downstream evals

At minimum:

- canonical top-six ordering;
- factor contribution reconciliation;
- quote-only exclusion from actual ranges;
- lighting actual-cost abstention;
- conflict and stale-offer display;
- Viewer redaction and action denial;
- action creation/audit atomicity;
- model-unavailable structured-result journey;
- English/Traditional Chinese critical-flow parity;
- under-ten-minute hero journey.

## 13. Final reviewer recommendation

Accept the decision pack as the product contract for Issues #5 and #6.

Do not scaffold UI or database code from this document alone. The next approved artifacts are the complete UX/state specification and implementation-ready technical architecture.
