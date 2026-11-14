# Independent Review — Prototype Extraction Audit

**Reviewer stance:** adversarial product, UX, architecture and safety review  
**Question:** Does the extraction plan preserve the right learning without reproducing the prototype’s fragmentation?

## 1. Overall verdict

**PASS WITH REQUIRED CHANGES BEFORE BUILD.**

The audit correctly rejects both extreme options:

- copying the old static demo into the new repository;
- discarding the prototype and rebuilding from memory.

The valuable assets are predominantly contracts, rules, fixtures and tests. The new product should not begin implementation until the decisions listed in Section 7 are resolved.

## 2. KEEP

### Product principles

- every completed project should help the next project;
- company-specific intelligence must be evidence-backed;
- important answers should lead to safe actions;
- conversation is one control surface, not the whole application;
- business calculations remain deterministic;
- unknown/conflicting evidence remains visible;
- human approval remains the boundary for material actions.

### Product behaviors

- context-aware project questions;
- evidence inspector beside intelligence;
- comparable historical project retrieval;
- quote versus actual-cost distinction;
- source-first document intake;
- extraction proposal plus human review;
- approval invalidation on material input change;
- readiness hold before work release;
- bounded agent proposals;
- feedback creates review, not silent knowledge mutation;
- full Traditional Chinese/English parity.

### Engineering behaviors

- typed schemas and allowlisted tools;
- server-executed retrieval;
- bounded provider/tool calls;
- citation/source validation;
- safe provider errors;
- usage/budget/concurrency guards;
- explicit action receipts;
- independent release gates.

## 3. CHANGE

### 3.1 Replace module-first navigation with object/context-first IA

The prototype proves many capabilities but puts too many of them in the sidebar. The new product should not ship with the same module catalogue.

Required change:

```text
Home
Projects
Knowledge
StrideBrain
Settings
```

Contextual object views should absorb quotes, suppliers, approvals, risks, changes, decisions and actions.

### 3.2 Make the result an interface, not a formatted answer

The first vertical slice cannot end in a long Copilot message.

Required structured outputs:

- comparable cards;
- factor explanations;
- material differences;
- comparison table;
- evidence panel;
- sufficiency/conflict state;
- proposed next action.

### 3.3 Replace demo authority with explicit evidence authority

The prototype carefully labels synthetic/self-attested data, but the new schema needs formal authority states from the beginning.

Without this, historical comparisons will become misleading as soon as real files are added.

### 3.4 Hide provider and agent plumbing

The model selector and AI Team are useful experiments, not the primary product identity.

Default experience:

> StrideBrain

Provider selection may exist in advanced/admin settings only where it provides actual value.

### 3.5 Separate analysis from execution

Planner/model output must create a `ProposedAction` only. Authorization, approval and execution must be separate services with independent checks.

### 3.6 Make demo data a real tenant fixture

The fictional company should use the same repositories, APIs, permissions and UI as a future customer. Reset means reseeding a fixture tenant, not clearing browser truth.

### 3.7 Treat bilingual behavior as system architecture

Do not reproduce inline translation maps throughout rendering modules. Canonical domain values, localized display terms, generated-answer language and UX copy need explicit contracts.

## 4. REMOVE / DO NOT CARRY FORWARD

- monolithic `app.js` orchestration;
- HTML-string view architecture;
- browser-local business truth;
- staff token/guest cookie as product identity;
- demo-wide organization ID;
- hard-coded snapshot date in domain logic;
- static scripted answers presented near live intelligence;
- hard-coded flagship change behavior;
- model/provider copy in normal user-facing errors;
- separate top-level screens for every capability;
- self-attested browser precedent as verified historical actual cost;
- implicit authority inferred from project manager/task owner;
- special-case code for a single company or vertical.

## 5. Major risks still unresolved

## 5.1 Scope explosion

The prototype contains enough features to tempt an immediate rebuild of everything.

Mitigation:

- build only the Comparable Project Intelligence vertical slice first;
- include only required objects, ingestion seams and actions;
- postpone connectors and broader agent execution unless required by that slice.

## 5.2 False confidence from rich fixtures

Synthetic data is unusually clean and interconnected. Real customer records will have missing fields, duplicates, conflicting versions and weak authority.

Mitigation:

- deliberately create imperfect fixture cases;
- evaluate missing/conflict/stale states;
- pilot ingestion before claiming broad intelligence.

## 5.3 Overengineering StrideGraph

A graph-style product model does not require a graph database in v0.1.

Mitigation:

- begin with relational objects and explicit relationships in Postgres;
- add vector/graph infrastructure only where measured retrieval needs justify it.

## 5.4 Unclear comparable-project policy

The prototype’s size/recency/location formula is explainable but too narrow for the final product.

Mitigation:

- version the policy;
- build canonical expected rankings;
- let structured factors dominate initial production behavior;
- add semantic scoring only with eval evidence.

## 5.5 Mixing quotation and actual cost

This is a critical trust risk.

Mitigation:

- model them as distinct observations/authority states;
- label every amount;
- prevent quote-only records from entering actual-cost calculations;
- test this as a blocking invariant.

## 5.6 AI synthesis obscuring deterministic result

A fluent model answer can hide retrieval/calculation problems.

Mitigation:

- store and render the structured result independently of model prose;
- verify model output against the structured result/evidence ledger;
- allow deterministic result view when model generation fails.

## 5.7 Repository separation drifting again

Marketing, internal revenue OS and customer product could slowly recouple.

Mitigation:

- keep repository/deployment ADR active;
- expose only links and documented integration contracts across products;
- prohibit customer product runtime code in `primestride-web` after cutover.

## 6. Architecture constraints for approval

Before application scaffolding, the Technical Architect must define:

- tenant and authorization context;
- core object/version schema;
- evidence authority model;
- repository boundaries;
- document storage and ingestion seam;
- comparable-project service contract;
- intelligence orchestrator and evidence verification;
- proposed action/approval/audit model;
- fixture seeding strategy;
- observability and evaluation hooks.

Before UI scaffolding, the Product/UX Architect must define:

- five-surface information architecture;
- project workspace;
- comparable result/card/table states;
- evidence panel;
- context-aware StrideBrain placement;
- empty/loading/error/conflict/permission states;
- bilingual terminology and layout behavior;
- responsive/accessibility contract.

## 7. Required decisions before build

The audit is accepted only after these are recorded:

1. **First fixture company and active project** — exact demo narrative.
2. **Historical authority policy** — what qualifies as actual cost.
3. **Comparable scoring v0.1** — mandatory filters and weights.
4. **Evidence UI** — what is always visible versus on demand.
5. **First action** — likely an internal review action, not external send.
6. **Tenant roles** — minimum owner/admin, project manager and estimator permissions.
7. **Semantic retrieval scope** — first release or later.
8. **Document ingestion scope** — seeded records first, upload seam now, full parser later.
9. **Performance budget** — deterministic result and optional synthesis latency targets.
10. **Pilot readiness target** — L1 demo or L2 controlled real-business pilot for the first release.

## 8. Final keep/change/remove summary

### Keep

Evidence, deterministic rules, comparable history, contextual intelligence, approval boundaries, bilingual behavior, fixtures and regression scenarios.

### Change

Architecture, information hierarchy, persistence, identity, authority model, structured result UX and agent exposure.

### Remove

Static-demo coupling, browser-owned business truth, feature-catalogue navigation and internal/provider plumbing from the normal experience.

## 9. Reviewer recommendation

Proceed to Product/UX Architecture and Technical Architecture in parallel.

Do **not** begin by copying files or drawing a generic dashboard.

The next approved build artifact should be a reviewed end-to-end contract for Comparable Project Intelligence, followed by the minimum production-shaped foundation required to run it.
