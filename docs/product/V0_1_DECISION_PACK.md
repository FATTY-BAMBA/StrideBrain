# StrideBrain v0.1 — Product Decision Pack

**Status:** ACCEPTED PRODUCT DIRECTION  
**Decision date:** 2026-11-14  
**First release target:** L1 controlled demo  
**First vertical slice:** Comparable Project Intelligence  
**Primary question:** “Have we done something like this before?”  
**Policy identifiers:** `CPI-ELIGIBILITY-1.0`, `CPI-SIM-1.0`, `EVIDENCE-AUTHORITY-1.0`, `INTERNAL-REVIEW-ACTION-1.0`

## 1. Purpose

This document locks the product decisions required before UX architecture, technical architecture, or application implementation begins.

It is deliberately narrower than the full StrideBrain vision. The first release must prove one complete product loop:

```text
current project context
  → eligible historical projects
  → explainable comparison
  → inspectable evidence
  → bounded recommendation
  → governed internal action
```

The release is not a generic chatbot, document-search demo, model selector, agent marketplace, or collection of disconnected modules.

---

## Decision 1 — Demo company, user, active project, and business decision

### Fictional organization

- **English:** Horizon Atelier
- **Traditional Chinese:** 禾序空間設計
- **Market:** Taiwan interior design and renovation
- **Fixture classification:** `DEMO_SYNTHETIC`
- **Primary locale:** `zh-TW`
- **Secondary locale:** `en`

The fixture should contain approximately:

- 24 completed historical projects;
- 5 active projects;
- 12–18 people;
- 12–18 clients;
- 18–24 suppliers;
- 40+ quote versions;
- 300–500 quote/cost lines;
- 100+ evidence records;
- deliberate stale, conflicting, and insufficient-evidence cases.

These targets are large enough to create genuine relationships and small enough to validate manually.

### Hero user

- **Name:** Mei Lin / 林美玲
- **Role:** Senior Estimator and Project Manager
- **Authorized scope:** assigned commercial projects, historical comparison, quoted-price history, and approved historical actual-cost summaries
- **Business goal:** review a current quotation before internal owner/financial review

### Active project

| Field | Locked fixture value |
|---|---|
| Project ID | `PRJ-XINYI-026` |
| English name | Xinyi Flagship Renovation |
| Chinese name | 信義旗艦店裝修 |
| Fictional client | Aster Retail Taiwan / 星序零售台灣 |
| Comparison class | `COMMERCIAL_INTERIOR_FIT_OUT` |
| Project subtype | `RETAIL_FLAGSHIP` |
| Location | Taipei City, Xinyi District |
| Area | 640 m² |
| Stage | `QUOTE_REVIEW` |
| Active quote | `Q-XINYI-026` version 3 |
| Proposed price before tax | NT$16,480,000 |
| Current forecast direct cost | NT$12,650,000 |
| Target handover | 2027-02-20 |
| Current concern | imported stone, lighting/electrical package, and an accelerated 16-week programme |

All amounts are fictional fixture values. They are not market benchmarks.

### Hero business decision

Mei Lin needs to decide:

> Is the current quotation reasonably aligned with the company’s relevant completed work, which differences explain the variance, and what must be reviewed before the quote proceeds to internal approval?

### Hero sequence

1. Open `PRJ-XINYI-026`.
2. Ask: **“Have we done something like this before?”**
3. Inspect ranked historical projects and their match factors.
4. Open the strongest comparable and inspect the evidence.
5. Ask: **“Compare the current quote.”**
6. Review category differences, authority labels, evidence gaps, and conflicts.
7. Create one internal review action for the material items that require validation.

This sequence must be demonstrable in under ten minutes.

---

## Decision 2 — Historical evidence authority

Quotation values, supplier offers, forecasts, and actual costs are different observations. They must never be collapsed into one generic “cost” value.

### Observation types

| Observation type | Meaning | May support |
|---|---|---|
| `QUOTED_PRICE` | price proposed to a client in a specific quote version | quoted-price history only |
| `SUPPLIER_OFFER` | supplier/subcontractor offer with an effective date | supplier-offer history only |
| `FORECAST_DIRECT_COST` | internal expected direct cost before project completion | forecast comparison only |
| `RECONCILED_ACTUAL_COST` | approved final direct cost from a completed project | actual-cost comparison |

### Authority states

| Authority state | Meaning |
|---|---|
| `OBSERVED` | value was extracted or imported but not approved as business truth |
| `HUMAN_REVIEWED` | a human reviewed the mapping/value, but it is not yet an approved commercial or accounting record |
| `APPROVED_COMMERCIAL` | approved quote, supplier offer, or commercial record for its stated purpose |
| `RECONCILED_ACTUAL` | approved final-cost version reconciled to a completed project |
| `SUPERSEDED` | replaced by an explicitly linked newer approved version |
| `CONFLICTED` | incompatible authoritative records remain unresolved |

`DEMO_SYNTHETIC`, `TENANT_PRIVATE`, and related classifications describe data ownership/provenance; they do not replace authority states.

### Actual-cost eligibility

A cost observation may enter a historical actual-cost aggregate only when all conditions pass:

1. same authorized organization;
2. project status is completed/closed;
3. final cost version is `RECONCILED_ACTUAL`;
4. version is not superseded;
5. no unresolved conflict affects the included value;
6. currency and normalization unit are known and compatible;
7. line-level cost taxonomy exists;
8. each included line has one or more accessible evidence references;
9. user permission allows sensitive historical-cost access;
10. the comparison policy version accepts the record.

### Aggregate sufficiency

For the first release:

- an overall historical actual-cost range requires at least **three eligible completed projects**;
- a category-level actual-cost range requires at least **three eligible line observations** for that category;
- otherwise the interface must show `INSUFFICIENT_ACTUAL_COST_EVIDENCE` and abstain from the range;
- quote-only history may still be shown separately as `QUOTED_PRICE`.

### Supplier-offer freshness

A supplier offer is stale when:

- its explicit `validUntil` date has passed; or
- no validity date exists and the offer is older than 90 days.

A stale offer may be shown historically but must not be presented as a current vendor price.

### Reconstructed or demo-derived costs

A manually reconstructed or browser-derived demo precedent must be classified separately and is excluded from authoritative actual-cost aggregates by default.

### Conflict rule

StrideBrain must not silently choose between incompatible authoritative records.

- An explicitly superseded record may be ignored in favor of its approved successor.
- Two unresolved approved records create a conflict.
- A conflicted value is excluded from aggregation until resolved.
- The UI must show the exact records, values, versions, and required human resolution.

### Calculation trace

Every derived financial result must preserve:

- observation type;
- authority state;
- source object/version IDs;
- evidence locators;
- normalization unit;
- currency;
- policy version;
- calculation version;
- timestamp.

See `ADR-002-historical-evidence-authority.md`.

---

## Decision 3 — Comparable-project eligibility

The comparison service applies authorization and eligibility before scoring.

### Mandatory eligibility filters

A historical project is eligible for the primary v0.1 comparison only when:

1. it belongs to the same organization;
2. the user is authorized to know that it exists;
3. it is completed/closed;
4. it belongs to the same configured `comparisonClass`;
5. project subtype, area/quantity, scope categories, comparison categories, and completion date are available;
6. units and currency are compatible with the active project;
7. project metadata is at least `HUMAN_REVIEWED`;
8. it is not deleted, an unapproved test record, or an unresolved duplicate;
9. no policy exclusion applies.

An archived display state does not disqualify a project if it remains approved historical evidence.

### Similarity versus economics

A project may qualify for project similarity even when its actual-cost evidence is incomplete.

The result must then state:

- which comparison dimensions are supported;
- which economics are quote-only, forecast, actual, stale, conflicted, or unavailable;
- whether actual-cost aggregation is permitted.

### Result count

- show up to six primary matches;
- show at most three projects in the default side-by-side comparison;
- results scoring below the primary threshold may appear only under **Broader matches**, without implying strong comparability.

---

## Decision 4 — Similarity model v0.1

### Model boundary

The first release uses a deterministic, structured, versioned scoring model.

Semantic/vector similarity is **deferred**. The architecture must allow later candidate expansion or reranking, but semantic scores cannot enter v0.1 rankings until a measured eval demonstrates improved relevance without harming explainability or permissions.

### Policy version

`CPI-SIM-1.0`

### Factor weights

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

### Factor calculations

#### Project subtype compatibility

- exact subtype: `1.0`;
- configured adjacent subtype within the same comparison class: `0.6`;
- otherwise: `0.0`.

The broad comparison class is already mandatory.

#### Scope, category, material, and supplier overlap

Use configured-set Jaccard similarity:

```text
intersection size / union size
```

Canonical taxonomy IDs—not free-form labels—must be compared.

#### Area/quantity similarity

```text
max(0, 1 - abs(ln(candidate / current)) / ln(2))
```

Equal size scores `1.0`; a 2× or 0.5× difference scores `0.0`.

#### Completion recency

```text
max(0, 1 - monthsSinceCompletion / 60)
```

Recency contributes no points after five years, but an older project may remain eligible.

#### Location proximity

- same district: `1.0`;
- same city: `0.6`;
- configured adjacent metro/region: `0.3`;
- otherwise: `0.0`.

### Missing data

- mandatory-factor data missing → candidate is ineligible;
- optional-factor data missing → factor state is `UNKNOWN` and earns no points;
- `UNKNOWN` must not be displayed as a confirmed difference;
- every result exposes evidence coverage separately from similarity.

### Result thresholds

| Score | Display band |
|---:|---|
| 80–100 | Strong match |
| 65–79 | Relevant match |
| 50–64 | Partial match |
| below 50 | Broader match only |

Primary results require at least 75% known weighted-factor coverage.

### Tie behavior

Scores within two points are treated as the same match band.

Within a tie, display order uses:

1. higher evidence coverage;
2. more recent completion;
3. stable record ID only as a final presentation tie-breaker.

The tie-breaker must not be described as business importance.

### Explanation contract

Every result shows:

- three strongest positive factors;
- up to two material differences or unknowns;
- evidence coverage;
- economics authority state;
- stale/conflict warnings;
- exact policy version.

See `ADR-003-comparable-project-similarity-v0-1.md`.

---

## Decision 5 — Evidence visibility

### Always visible on each comparable card

- match score and band;
- evidence coverage;
- project subtype, area, location, completion date;
- three strongest similarities;
- one or two important differences/unknowns;
- explicit economics badges such as `Quoted`, `Forecast`, or `Reconciled actual`;
- top two evidence chips and total source count;
- stale/conflict/insufficient-evidence indicators;
- `Open project` and `Compare` actions.

### Visible in the comparison table

- current project and selected comparables;
- scope categories;
- area/quantity;
- materials;
- suppliers;
- quote/cost categories;
- quoted price;
- forecast direct cost;
- reconciled actual cost when authorized;
- schedule/outcome;
- evidence coverage and freshness.

Quoted price, forecast cost, supplier offer, and actual cost must use different labels and visual treatments.

### Evidence panel on demand

The panel shows:

- source object type;
- object/version ID;
- document/version/effective date;
- evidence locator;
- exact claim or value supported;
- observation type;
- authority state;
- freshness;
- conflict/supersession state;
- access restriction;
- navigation to the underlying object.

### Model explanation

A model-written explanation is optional and secondary.

The structured comparison and evidence remain useful when model synthesis is unavailable.

---

## Decision 6 — First governed action

The only business-changing action in the first slice is:

> **Create an internal review action linked to the current project, comparison run, and evidence.**

### Action flow

1. StrideBrain produces a `ProposedAction`.
2. The user reviews and may edit title, rationale, assignee, and due date.
3. The server rechecks organization, project, permissions, and evidence access.
4. The user explicitly confirms creation.
5. The application creates an `Action` and append-only audit event.
6. The project workspace shows the created action and its source comparison.

### Default hero action

```text
Validate imported-stone and lighting assumptions for Xinyi quote v3
```

The rationale should name the observed variance, authority level, evidence gaps, and records requiring review.

### Explicitly excluded

The first slice cannot:

- send email, LINE, or another external message;
- approve or issue a quotation;
- alter historical cost authority;
- commit a commercial change;
- contact a supplier automatically;
- execute a model-generated action without explicit authorization.

See `ADR-004-first-governed-action.md`.

---

## Decision 7 — Minimum roles and permissions

Roles are convenience bundles. Server-derived permissions—not role names alone—authorize each request.

| Capability | Organization Admin | Project Manager / Estimator | Financial Reviewer | Viewer |
|---|---:|---:|---:|---:|
| View authorized project metadata | Yes | Assigned projects | Yes | Authorized projects |
| View quote history | Yes | Assigned projects | Yes | Only if granted |
| View reconciled actual costs | Yes | Only with `commercial_actual_read` | Yes | No |
| Run comparable-project analysis | Yes | Assigned projects | Yes | Yes, with sensitive economics redacted |
| Inspect accessible evidence | Yes | Assigned projects | Yes | Accessible sources only |
| Propose internal review action | Yes | Yes | Yes | No |
| Create/assign internal review action | Yes | Within assigned project | Yes | No |
| Resolve financial authority/conflict | Yes | No | Yes | No |
| Manage roles/settings | Yes | No | No | No |

The hero user has `commercial_actual_read` for the active and eligible historical projects.

Unauthorized records must not leak through counts, titles, scores, citations, or error messages.

---

## Decision 8 — Document-ingestion scope

The first build uses:

- typed fixture records;
- versioned synthetic evidence documents;
- structured quote and cost lines;
- source locators prepared as fixture data.

The first build does **not** include:

- arbitrary customer upload;
- OCR;
- general PDF/Excel parsing;
- connector-based ingestion;
- automatic evidence-authority promotion.

Repository and evidence interfaces must allow later ingestion without changing the experience or domain service contracts.

The old prototype’s document-intelligence rules remain a future ingestion reference, not first-slice runtime code.

---

## Decision 9 — Performance and resilience budgets

These are initial preview targets and must be measured against the exact release commit.

| Interaction | Initial target |
|---|---:|
| Project workspace useful content | p95 ≤ 2.5 s |
| Deterministic comparable-project result | p95 ≤ 2.0 s after context is loaded |
| Cold deterministic comparison | p95 ≤ 3.0 s |
| Evidence panel open after result load | p95 ≤ 500 ms |
| Internal review action creation | p95 ≤ 1.0 s |
| Optional model explanation | p95 ≤ 12 s |

Additional rules:

- structured results must not wait for model synthesis;
- model failure leaves deterministic results usable;
- partial retrieval must be labeled, not presented as complete;
- timeouts must fail honestly;
- every comparison emits a trace with policy version, candidate counts, exclusions, duration, evidence coverage, and result state.

---

## Decision 10 — Release readiness target

The first release is **L1 controlled demo**.

### L1 claims allowed

- invited users can explore a realistic fictional organization;
- comparable projects are retrieved and ranked deterministically;
- evidence and authority states are inspectable;
- the current quote can be compared against fictional historical records;
- an authorized user can create a fictional internal review action;
- critical flows work in Traditional Chinese and English.

### Claims not allowed

- production-ready;
- pilot-ready with real customer data;
- current market pricing;
- autonomous project management;
- real accounting reconciliation;
- broad document ingestion;
- legal/compliance certification;
- live supplier confirmation.

### L2-shaped seams required

Even at L1, the architecture must include:

- trusted runtime context abstraction;
- organization-scoped repositories;
- explicit permissions;
- versioned evidence;
- separate quote and actual-cost objects;
- proposed-action versus execution separation;
- audit/intelligence-run contracts;
- data-classification fields;
- isolated deployment and server-side secrets.

No real customer data may be loaded until L2 gates are satisfied.

---

## Locked demo implications

The hero comparison should be designed to reveal all of the following without pretending certainty:

- the current quote is above the selected historical quoted-price median;
- the current imported-stone forecast is materially above the reconciled historical actual-cost median;
- lighting has quoted-price history but insufficient reconciled actual-cost observations;
- the accelerated schedule is a material difference but lacks enough evidence to quantify its premium;
- StrideBrain can therefore recommend review, but cannot conclude that the quote is wrong or overpriced.

Exact fixture numbers and expected ordering are defined in `docs/demo/HORIZON_ATELIER_HERO_NARRATIVE.md`.

---

## Build gates created by this decision pack

### Product/UX Architecture must now define

- project workspace hierarchy;
- comparable-card and table behavior;
- evidence panel;
- conversational control surface;
- complete states;
- bilingual terminology;
- responsive/accessibility contract.

### Technical Architecture must now define

- persistence/schema;
- repository contracts;
- runtime context;
- comparison service types;
- authority/evidence enforcement;
- action/audit flow;
- fixture seeding;
- tests, evals, observability, and rollback.

### Application implementation remains blocked until

- Issue #5 design architecture is accepted;
- Issue #6 technical architecture is accepted;
- their contracts are reconciled against this decision pack.

---

## Change control

Any change to these locked decisions requires:

1. a new or amended ADR;
2. updated canonical fixtures/evals where applicable;
3. Product Director approval;
4. UX and Technical Architecture impact review;
5. explicit policy-version change when ranking or authority behavior changes.

Silent changes to weights, authority rules, permissions, or fixture conclusions are prohibited.
