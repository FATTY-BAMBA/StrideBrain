# Stage 5 — Historical Economics Integration

**Status:** implementation candidate
**Governing issue:** #23
**Policy versions:** `EVIDENCE-AUTHORITY-1.0`, `CPI-ECON-1.0`
**Result contract:** `comparable-project-stage5.v1`

## Outcome

Stage 5 enriches one immutable Stage 4 comparison run with deterministic commercial history and evidence-backed findings. It does not modify Stage 4 ranks, scores, factors, or snapshots.

The application flow is:

```text
trusted RuntimeContext
  → authorized immutable Stage 4 result
  → bounded authorized observation batch
  → authority/freshness/conflict evaluation
  → fixed-decimal aggregates and variances
  → claim/evidence verification
  → atomic immutable Stage 5 persistence
  → current-context authorized reopen
```

## Implemented boundaries

### Observation read boundary

`PrismaEconomicsObservationRepository`:

- rechecks the active comparison run under the current organization and assignment context;
- accepts at most three selected Stage 4 candidates;
- preserves Stage 4 selection/rank order;
- rejects requested keys that are not in the stored Stage 4 result;
- applies current comparison-library classification policy before financial reads;
- derives one of four explicit scopes: `STRUCTURAL_ONLY`, `QUOTE_ONLY`, `QUOTE_AND_FORECAST`, `FULL_ACTUAL`;
- performs no financial or Stage 5 evidence query for `STRUCTURAL_ONLY`;
- excludes unauthorized actual-cost projects before the aggregate service sees them;
- loads quotes, active forecast, historical actuals, offers, evidence, and open conflicts in bounded batches rather than per candidate;
- returns query diagnostics without exposing rejected cross-tenant records.

The full Stage 5 batch has a fixed maximum of seven repository calls:

1. comparison run and selected project metadata;
2. quote versions and lines;
3. active forecast and lines;
4. authorized actual-cost versions and lines;
5. supplier offers and items;
6. evidence references;
7. open evidence conflicts.

Lower access scopes execute fewer calls.

### Deterministic authority and calculation boundary

The existing Stage 5 domain services keep these meanings separate:

- `QUOTED_PRICE`;
- `SUPPLIER_OFFER`;
- `FORECAST_DIRECT_COST`;
- `RECONCILED_ACTUAL_COST`.

They enforce authority, project completion, supersession, conflict, freshness, currency/unit compatibility, taxonomy, evidence, line reconciliation, and total reconciliation before aggregation.

All authoritative calculations use the fixed-decimal engine. A model is not involved.

### Persistence boundary

`EconomicsEnrichmentRun` stores one immutable enrichment snapshot for one comparison run. `EconomicsObservationDecision` stores the included/excluded observation decisions and normalized values. Structured claims continue to use `ComparisonClaim` and remain linked to the underlying immutable Stage 4 run.

Persistence is atomic:

```text
EconomicsEnrichmentRun
+ EconomicsObservationDecision[]
+ ComparisonClaim[]
```

A failed claim or decision write fails the transaction; no success result is returned.

Reopen requires current project/commercial/evidence authorization at least as strong as the stored result scope. A Viewer cannot reopen a stored `FULL_ACTUAL` result.

## Fixture and independent verification

`stage5-economics.sql` adds source evidence for current forecast lines/version and structured programme facts. It does not store conclusions or percentages.

`verify-stage5-economics.sql` independently derives and checks:

- current quote versus selected quoted history: approximately `+7.17%`;
- current forecast versus selected reconciled actual history: approximately `+6.05%`;
- imported stone forecast versus actual history: approximately `+18.39%`;
- lighting quote versus quoted history: approximately `+9.43%`;
- lighting actual evidence: exactly two eligible observations, below the required three;
- stale supplier history exists;
- every current forecast line has evidence;
- active/top-three programme evidence exists;
- Stage 5 persistence tables exist.

## Safe outcomes

The orchestrator returns only:

- `COMPLETE`;
- `PARTIAL_ECONOMICS`;
- `INSUFFICIENT_ACTUAL_EVIDENCE`;
- `CONFLICTED_EVIDENCE`;
- `STALE_SUPPLIER_EVIDENCE`;
- non-disclosing `UNAVAILABLE`;
- safe `ECONOMICS_FAILED`.

## Explicit non-goals

This stage does not add:

- polished comparison UI;
- action creation;
- AI-written synthesis;
- semantic/vector scoring;
- arbitrary document ingestion;
- real customer data;
- Vercel, domain, or marketing-site changes.
