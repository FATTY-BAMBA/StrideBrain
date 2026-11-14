# ADR-002 — Historical Evidence Authority Model

**Status:** Accepted  
**Date:** 2026-11-14  
**Decision owners:** Product Director, Technical Architecture  
**Policy version:** `EVIDENCE-AUTHORITY-1.0`

## Context

StrideBrain must compare current projects with historical quotations, supplier offers, forecasts, and completed-project costs.

These records do not have the same meaning or authority:

- a client quotation is a proposed selling price;
- a supplier offer is time-bound commercial evidence;
- a forecast is an internal expectation;
- a final reconciled cost is evidence of recorded project outcome.

The prototype correctly avoided treating quote-only records as actual cost, but the customer-facing product needs this distinction encoded in domain types, policies, repositories, UI, and evaluations—not only in warnings or prompts.

Without an authority model, StrideBrain could produce fluent but misleading historical ranges, silently use stale supplier offers, or present reviewed extraction as accounting truth.

## Decision

StrideBrain will model every financial observation using three independent dimensions:

```text
observation type
+ authority state
+ data classification/provenance
```

### Observation type

```text
QUOTED_PRICE
SUPPLIER_OFFER
FORECAST_DIRECT_COST
RECONCILED_ACTUAL_COST
```

### Authority state

```text
OBSERVED
HUMAN_REVIEWED
APPROVED_COMMERCIAL
RECONCILED_ACTUAL
SUPERSEDED
CONFLICTED
```

### Data classification/provenance

Examples:

```text
DEMO_SYNTHETIC
PUBLIC_REFERENCE
TENANT_PRIVATE
TENANT_RESTRICTED
TENANT_APPROVED
```

A high provenance classification does not automatically grant financial authority, and human review alone does not transform a value into reconciled actual cost.

## Actual-cost eligibility

A value may enter an actual-cost comparison only when:

- the user is authorized for the organization and sensitivity level;
- the project is completed/closed;
- the cost version is explicitly `RECONCILED_ACTUAL`;
- the value is not superseded;
- no unresolved conflict affects it;
- currency and normalization unit are known;
- line-level cost taxonomy exists;
- evidence references support the included lines;
- the comparison policy accepts the record.

The service must return a structured exclusion reason for every rejected record.

## Aggregate sufficiency

Initial policy:

- at least three eligible completed projects for an overall actual-cost range;
- at least three eligible line observations for a category-level range;
- otherwise return `INSUFFICIENT_ACTUAL_COST_EVIDENCE`;
- quoted-price history may still be returned separately.

The minimum-observation threshold is a product safety rule, not a claim of statistical confidence.

## Quote-only and forecast records

Quote-only and forecast records remain useful but must be labeled according to observation type.

They cannot be promoted into actual-cost aggregates through model inference, UI copy, or a generic field name such as `cost`.

## Supplier-offer freshness

A supplier offer becomes stale when:

- its explicit validity date has passed; or
- it has no validity date and is older than 90 days.

A stale offer remains historical evidence but cannot be presented as a current price.

## Reconstructed/imported values

A browser-extracted, manually mapped, or demo-reconstructed record may be stored as `OBSERVED` or `HUMAN_REVIEWED`, with its provenance retained.

It cannot become `RECONCILED_ACTUAL` without a separate authorized reconciliation workflow.

The v0.1 slice does not implement that promotion workflow.

## Conflict and supersession

### Supersession

A newer approved record may replace an older one only through an explicit supersession relationship.

The superseded record remains auditable but is excluded from current aggregates.

### Conflict

Two incompatible approved records create a `CONFLICTED` state when neither is explicitly authoritative over the other.

Conflict behavior:

- do not silently select a value;
- exclude the affected value from aggregate calculations;
- display the exact records, versions, values, and dates;
- offer a human resolution workflow where authorized.

## Derived-result trace

Every financial comparison result must preserve:

- observation type;
- authority state;
- source object and version IDs;
- evidence locators;
- currency;
- unit/normalization method;
- policy version;
- calculation version;
- conflict/staleness state;
- timestamp;
- requesting context and permissions.

## UI implications

The interface must visually distinguish at minimum:

- Quoted;
- Supplier offer;
- Forecast;
- Reconciled actual;
- Stale;
- Conflicted;
- Insufficient evidence.

A single unlabeled “historical cost” field is prohibited.

## AI implications

Models may explain verified observations and differences.

Models may not:

- change authority state;
- infer that a quote equals actual cost;
- resolve conflicts;
- refresh a stale offer;
- calculate authoritative aggregates independently of the deterministic service.

## Authorization implications

Actual costs may be commercially sensitive.

The repository/service layer must enforce permissions before retrieval. The model must not receive unauthorized actual-cost data and then be asked to ignore it.

## Consequences

### Positive

- prevents quote/actual conflation;
- supports honest insufficiency and conflict states;
- makes calculations reproducible;
- creates a safe path from demo fixtures to real tenant data;
- lets UX explain why a value is trustworthy.

### Costs

- schema and fixtures are more explicit;
- ingestion requires mapping and authority workflows;
- some comparisons will abstain rather than return a number;
- evaluation must cover authority and conflict behavior.

These costs are accepted because trust is central to the product.

## Rejected alternatives

### One generic `cost` field

Rejected because it erases commercial meaning and authority.

### Let the model decide which record is most credible

Rejected because authority is a governed business rule, not a language-model judgment.

### Use the newest timestamp automatically

Rejected because newer does not necessarily mean approved, reconciled, or authoritative.

### Treat reviewed extraction as actual cost

Rejected because review confirms interpretation/mapping, not accounting completeness.

## Tests required

- quote-only records never enter actual aggregates;
- conflicted records are excluded;
- superseded versions are auditable but inactive;
- stale supplier offers are labeled correctly;
- insufficient observations abstain;
- unauthorized users cannot infer actual-cost existence or values;
- derived values retain complete evidence/calculation trace.
