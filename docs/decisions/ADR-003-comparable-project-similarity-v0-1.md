# ADR-003 — Comparable Project Similarity v0.1

**Status:** Accepted  
**Date:** 2026-11-14  
**Decision owners:** Product Director, Product/UX Architecture, Technical Architecture  
**Policy version:** `CPI-SIM-1.0`

## Context

The first StrideBrain vertical slice must answer:

> “Have we done something like this before?”

A similarity result affects commercial review and therefore cannot be an opaque AI judgment.

The prototype used an explainable size/recency/location formula for historical estimates. That behavior is useful as a regression reference but too narrow for the customer-facing product.

The first release also needs a strict scope. Adding vector retrieval immediately would introduce additional infrastructure, tuning, permission, and evaluation risk before a reliable structured baseline exists.

## Decision

StrideBrain v0.1 will use a deterministic, structured, versioned similarity policy.

Semantic/vector similarity is deferred from the ranking calculation. The architecture may expose a future extension seam, but the initial results and canonical ordering are produced entirely from structured factors.

## Eligibility before scoring

A candidate is scored only after it passes `CPI-ELIGIBILITY-1.0`, including:

- same organization;
- authorized record access;
- completed/closed status;
- same configured comparison class;
- compatible units and currency;
- required structured context;
- reviewed/approved project metadata;
- no disallowed duplicate, test, or deleted state.

A project may be eligible for scope similarity even when it lacks actual-cost authority. Economics are evaluated separately under ADR-002.

## Factors and weights

| Factor | Weight |
|---|---:|
| Project subtype compatibility | 15 |
| Scope-category overlap | 25 |
| Area/quantity similarity | 20 |
| Quote/cost-category overlap | 15 |
| Material-category overlap | 10 |
| Supplier overlap | 5 |
| Completion recency | 5 |
| Location proximity | 5 |
| **Total** | **100** |

## Factor functions

### Project subtype

- exact subtype: `1.0`;
- configured adjacent subtype inside the same comparison class: `0.6`;
- otherwise: `0.0`.

The broad comparison class is mandatory and not scored.

### Set overlaps

Scope, quote/cost category, material, and supplier overlap use Jaccard similarity over canonical IDs:

```text
|intersection| / |union|
```

Free-form labels are not compared directly.

### Area/quantity

```text
max(0, 1 - abs(ln(candidate / current)) / ln(2))
```

This provides a smooth scale while making a 2× or 0.5× difference contribute no area points.

### Recency

```text
max(0, 1 - monthsSinceCompletion / 60)
```

Older work may remain eligible but earns no recency points after five years.

### Location

- same district: `1.0`;
- same city: `0.6`;
- configured adjacent metro/region: `0.3`;
- otherwise: `0.0`.

## Missing data

Mandatory factor data missing makes the candidate ineligible.

Optional factor data missing:

- produces `UNKNOWN`;
- earns no points;
- reduces evidence coverage;
- must not be presented as a confirmed mismatch.

The result exposes:

```text
similarityScore
evidenceCoverage
factorStates
```

A primary match requires at least 75% known weighted-factor coverage.

## Bands

| Score | Band |
|---:|---|
| 80–100 | Strong match |
| 65–79 | Relevant match |
| 50–64 | Partial match |
| below 50 | Broader match only |

The UI may localize these labels but must preserve their meaning.

## Tie behavior

Scores within two points are treated as equivalent for match-band purposes.

Display ordering within a tie uses:

1. higher evidence coverage;
2. more recent completion;
3. stable ID only as a final deterministic display tie-breaker.

These tie-breakers are not evidence of greater business importance.

## Result explanation

Every primary result must include:

- policy version;
- score and band;
- evidence coverage;
- three strongest positive factors;
- up to two important differences or unknowns;
- factor-level values and contributions on demand;
- economics authority/sufficiency state;
- stale/conflict warnings;
- evidence references.

The score alone is insufficient UI.

## Canonical fixture behavior

For `PRJ-XINYI-026`, the initial Horizon Atelier fixture should produce the ordering recorded in `docs/demo/HORIZON_ATELIER_HERO_NARRATIVE.md`.

The expected ranking is an eval contract, not hard-coded presentation data.

Any intentional change requires:

- policy-version update or fixture-version update;
- expected-ranking review;
- updated evals;
- Product Director acceptance.

## Semantic similarity extension seam

A future semantic component may be introduced only when:

- retrieval remains tenant/permission scoped;
- approved source text is selected explicitly;
- canonical evals show measurable relevance improvement;
- explanations remain traceable;
- mandatory eligibility cannot be overridden;
- the semantic component has a versioned, bounded contribution;
- structured-only fallback remains available.

Potential future use:

- candidate expansion;
- reranking within an already eligible set;
- scope-summary similarity.

It must not become an opaque replacement for structured factors.

## AI boundary

A model may explain the structured result.

A model may not:

- select inaccessible candidates;
- alter factor values or weights;
- invent a score;
- suppress material differences;
- introduce evidence not returned by authorized services;
- convert a broader match into a strong match through prose.

## Consequences

### Positive

- deterministic and testable;
- easy to explain to users;
- safe baseline for later semantic evaluation;
- no vector database required for the first slice;
- clear separation of similarity from financial authority.

### Costs

- taxonomy and structured fixture quality matter;
- nuanced textual similarities may be missed initially;
- weights require canonical ranking review;
- missing optional data lowers score/coverage.

These costs are accepted for v0.1 because trust, scope control, and explainability are more important than maximum recall.

## Rejected alternatives

### Embedding-only similarity

Rejected because it is difficult to explain, can hide permission/evidence problems, and lacks a trusted baseline.

### Model-generated similarity scores

Rejected because scores would not be reproducible or suitable for deterministic evals.

### Copy the prototype size/recency/location formula unchanged

Rejected because it ignores scope, category, material, and supplier relationships.

### No score—model-written narrative only

Rejected because the product needs structured comparison, consistent ordering, and regression tests.

## Tests required

- unauthorized projects are excluded before scoring;
- canonical fixture ranking matches expectations;
- each factor function has boundary tests;
- missing optional data is `UNKNOWN`, not false mismatch;
- tie behavior is stable and not described as importance;
- scoring policy version appears in the result;
- score explanations reconcile exactly to the total;
- semantic/model failure cannot change structured ranking.
