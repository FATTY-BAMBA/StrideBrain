# StrideBrain Prototype Extraction Audit

**Status:** Phase 1 research artifact  
**Canonical product repository:** `FATTY-BAMBA/StrideBrain`  
**Prototype source repository:** `FATTY-BAMBA/primestride-web`  
**Prototype baseline:** `main` at `b36c3cadb9250677e387a46a9610658546670439`  
**Audit date:** 2026-11-14

## 1. Purpose

This audit identifies what should be preserved, ported, redesigned, retained as fixture/evaluation material, or retired from the existing customer-facing StrideBrain prototype.

It does **not** treat the prototype as production architecture. It treats it as a product laboratory containing:

- validated user-outcome ideas;
- deterministic business rules;
- evidence and safety contracts;
- bilingual interaction lessons;
- synthetic datasets;
- quality tests;
- demo-only browser and access scaffolding.

The goal is to transfer the valuable behavior into the new `StrideBrain` product without copying the static browser architecture wholesale.

## 2. Source scope reviewed

The audit covers the requested source areas:

- `public/stridebrain-demo/**`
- `public/stridebrain-interiors/**` where referenced by the shared demo
- `src/lib/stridebrain-demo/**`
- `src/app/api/stridebrain-demo/**`
- `tests/stridebrain-*`
- `docs/stridebrain-industries/**`
- `docs/stridebrain-interiors/**`
- `.github/workflows/stridebrain-demo.yml`

The review concentrated on the live runtime, server tools/routes, deterministic domain rules, product workflows, fixtures, quality gates, and governing product/production-transfer documents.

## 3. Executive conclusion

The old prototype is **not one demo page**. It is a substantial experimental product system containing:

1. an industry-neutral browser workspace;
2. two synthetic industry packs;
3. project, document, quotation, work-order, supplier, approval and activity records;
4. a deterministic domain engine;
5. document extraction and human review;
6. historical-cost comparison and estimate drafting;
7. operational readiness policies;
8. evidence-linked Copilot tools;
9. OpenAI and OpenRouter model adapters;
10. conversation-context and evidence validation;
11. bounded agent-planning experiments;
12. guest/staff session, quota, budget and concurrency guards;
13. Google, email, LINE and message connector experiments;
14. an unusually useful regression-test library.

The prototype contains more reusable **behavioral contracts** than reusable production code.

The correct migration strategy is:

> Preserve the product outcomes, typed deterministic rules, evidence semantics, review gates, test cases and fictional datasets; rebuild the experience and persistence around the new StrideGraph, trusted tenant context and production services.

## 4. Classification definitions

| Classification | Meaning |
|---|---|
| **KEEP CONCEPT** | The user outcome or product principle belongs in the new product. |
| **PORT LOGIC** | Deterministic behavior should be rewritten as typed, independently tested domain/application code. |
| **REBUILD EXPERIENCE** | The current UI/state/runtime shape should not be copied; redesign around the new product architecture. |
| **DEMO FIXTURE** | Retain as synthetic data or controlled-demo material, not customer truth. |
| **HISTORICAL REFERENCE** | Preserve for design/engineering lessons but do not include in the active runtime. |
| **RETIRE AFTER PARITY** | Keep temporarily until equivalent behavior passes in the new product, then remove from `primestride-web`. |

## 5. System-level classification

| Prototype subsystem | Classification | Decision |
|---|---|---|
| Shared multi-industry workspace | KEEP CONCEPT, REBUILD EXPERIENCE | Preserve the same-product/different-pack idea; rebuild as authenticated object-centric application. |
| Projects, documents, quotes, work orders, approvals, suppliers | KEEP CONCEPT, PORT LOGIC | Map into StrideGraph and durable repositories. |
| `WorkspaceModel` browser domain engine | PORT LOGIC, RETIRE AFTER PARITY | Split into typed domain services and repositories; do not preserve the monolithic browser class. |
| `localStorage` / `sessionStorage` product state | HISTORICAL REFERENCE, RETIRE AFTER PARITY | Replace with durable tenant-scoped state, while preserving only safe local UI preferences. |
| Industry packs | KEEP CONCEPT, PORT LOGIC, DEMO FIXTURE | Preserve configuration-driven terminology/rules; separate tenant identity from industry templates. |
| Synthetic interior/printing datasets | DEMO FIXTURE | Convert into versioned seed fixtures mapped to StrideGraph. |
| Source/evidence registry | KEEP CONCEPT, PORT LOGIC | Become first-class `EvidenceReference`, `DocumentVersion` and register-record provenance. |
| Deterministic quotation calculations | KEEP CONCEPT, PORT LOGIC | Move into typed commercial domain services with currency/tax/company policy. |
| Historical estimator | KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE | Forms the basis of Comparable Project Intelligence, but needs a new ranking/evidence/UI contract. |
| Document intelligence | KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE | Preserve source-first extraction and human review; replace browser-only parser with ingestion services. |
| Document-to-history bridge | KEEP CONCEPT, PORT LOGIC | Replace session precedent with reviewed, authority-classified historical facts. |
| Readiness workbench | KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE | Convert hard-coded checks into configurable policy/rule sets with evidence and approvals. |
| Evidence-linked Copilot | KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE | Preserve tool-grounded answers and evidence verification; rebuild around tenant-scoped tools and structured result UI. |
| Model selector | HISTORICAL REFERENCE, REBUILD EXPERIENCE | Keep provider routing internally; default user-facing identity should be StrideBrain. |
| AI Team / agent planner | KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE | Preserve bounded plan/propose/review pattern; do not expose unrestricted autonomous agents. |
| Guest invitation/session layer | HISTORICAL REFERENCE, RETIRE AFTER PARITY | Useful L1 demo pattern; replace with trusted users, organizations and memberships for pilot. |
| Quota/budget/concurrency guards | KEEP CONCEPT, PORT LOGIC | Generalize into product-level usage policy and observability. |
| Email/Google/LINE connector experiments | KEEP CONCEPT, HISTORICAL REFERENCE | Preserve adapter and explicit-approval lessons; rebuild as organization-owned connectors. |
| Static QA HTML pages | HISTORICAL REFERENCE | Convert useful scenarios into automated tests/evals; do not ship as product pages. |
| Regression tests | KEEP CONCEPT, PORT LOGIC | Re-express as unit, integration, E2E, bilingual, grounding, permission and release suites. |
| Demo release workflow | KEEP CONCEPT, PORT LOGIC | Rebuild CI in the new repo with stronger gates and exact preview/release separation. |

## 6. Strongest reusable product contracts

### 6.1 Evidence is first-class

The prototype consistently distinguishes:

- structured register records;
- source documents;
- public references;
- synthetic history;
- browser-local reviewed extraction;
- model output;
- human approval.

This distinction should become a core production contract rather than presentation copy.

### 6.2 Observed does not mean verified

Document Intelligence observes cells, rows, page text and document metadata. It does not silently convert them into authoritative commercial facts. Human review, currency confirmation and blocker resolution are required before approval.

This is a strong production principle and should be retained.

### 6.3 Quotations and financial values use deterministic rules

The prototype calculates margin, price before tax, tax and gross profit deterministically. Model text may explain the result but should not become the calculation engine.

This should remain non-negotiable.

### 6.4 Historical evidence has eligibility rules

The historical estimator does not treat every old quote as actual cost evidence. It requires completed records, reconciled direct-cost lines, matching category/tier/scope/unit, and enough comparable observations.

This is central to the first vertical slice.

### 6.5 Actions require explicit progression

The strongest prototype workflows follow:

`observe → propose → review → approve → execute → audit`

Examples include quotation changes, customer drafts, AI-team follow-ups and external messages.

### 6.6 Conflicts must remain visible

The Copilot evidence layer detects project mismatches, unread citations, unsupported IDs and conflicting records. The intended behavior is to surface an evidence discrepancy and request human resolution rather than silently choose.

### 6.7 Agents are bounded planners, not authorities

The agent planner can inspect approved read-only tools and prepare up to a small number of proposals. It cannot approve a quotation, change a business record, pay, or autonomously contact a customer.

This is the right starting posture for production.

## 7. Main architecture weaknesses to avoid copying

### 7.1 The browser application is too monolithic

`app.js` coordinates navigation, language, session state, model state, chat state, connectors, document sessions, imported history and nearly every action.

The new product needs bounded modules and server-owned business state.

### 7.2 Product objects are represented as fixture arrays

The fixtures model useful entities, but relationships and authority are validated only in memory. Production needs durable objects, versions, events and tenant boundaries.

### 7.3 Browser persistence is not an operational system

`localStorage` and `sessionStorage` are appropriate for a controlled synthetic demo, not for multi-user projects, approvals, history, audit or recovery.

### 7.4 Static navigation exposes too many modules at once

The prototype has many top-level destinations. This demonstrates breadth but contributes to the “feature collection” feeling.

The new product should center on:

- Home;
- Projects;
- Knowledge;
- StrideBrain;
- Settings.

Quotations, documents, suppliers, risks, decisions, changes and actions should normally appear in context.

### 7.5 Model choice is too prominent

The prototype exposes a detailed model menu. This was useful for experimentation, but the production product should primarily present one StrideBrain intelligence layer and keep model routing advanced or internal.

### 7.6 Demo identity is not tenancy

Guest cookies, staff tokens and demo-workspace identifiers are controlled-demo mechanisms only. They must not be adapted into production authorization.

## 8. Target product layers

The extracted behavior should land in the following layers:

```text
Experience
  Home / Projects / Knowledge / StrideBrain / Settings

Application services
  Comparable project intelligence
  Document intake and review
  Quotation analysis
  Readiness and approval
  Action proposal and execution

Domain
  Projects / Documents / Quotes / Suppliers / Decisions / Risks / Changes / Actions
  Evidence and authority
  Commercial calculations
  Policy and approval rules

Intelligence runtime
  Intent resolution
  Context envelope
  Structured retrieval
  Document retrieval
  Evidence ledger
  Model/tool orchestration
  Result verification

Platform
  Identity / Organizations / Memberships / RBAC
  Postgres / object storage / search
  Connectors / secrets
  Audit / observability / quotas
```

## 9. First vertical slice decision

The audit reinforces the first vertical slice:

# Comparable Project Intelligence

> Have we done something like this before?

It reuses the strongest prototype assets:

- project and quote records;
- completed historical cost eligibility;
- similarity scoring ideas;
- source-linked evidence;
- document and register distinction;
- bilingual Copilot language;
- structured comparison tables;
- action proposals;
- human review and explicit limitations.

It should **not** reuse:

- static browser arrays as repositories;
- the current monolithic UI shell;
- client-only imported precedent state;
- hard-coded snapshot dates;
- prominent provider/model plumbing;
- synthetic-only authority assumptions.

## 10. Required production seams before implementation

Before the first product code is considered production-shaped, define:

1. trusted `RuntimeContext` derived from user membership;
2. repository interfaces for projects, quotes, documents, suppliers and evidence;
3. `EvidenceReference` authority/classification model;
4. versioned quotations and documents;
5. a configurable comparable-project scoring contract;
6. an auditable `IntelligenceRun` contract;
7. typed action proposal and approval contracts;
8. organization-scoped retrieval and tool authorization;
9. bilingual terminology and display contracts;
10. evaluation fixtures derived from the current regression suite.

## 11. Product researcher conclusion

The prototype proves that the most compelling StrideBrain story is not “many AI modules.”

It is:

> StrideBrain understands the connected records behind a company’s projects, shows the evidence, and helps people move from a question to a safe next action.

## 12. Technical researcher conclusion

The best reusable code is deterministic, bounded and evidence-aware. The least reusable code is browser-global orchestration, temporary identity, static persistence and tightly coupled rendering.

## 13. Product/UX architect conclusion

The new application should preserve:

- contextual Copilot;
- structured answers;
- evidence inspector;
- human approval;
- bilingual parity;
- outcome-oriented suggestions.

It should remove the feeling of navigating a catalogue of features.

## 14. Independent reviewer conclusion

The greatest migration risk is overvaluing code reuse and undervaluing behavioral reuse.

Copying the current runtime would preserve its coupling. Rewriting everything without extracting the rules would discard months of learning.

The approved middle path is:

> Extract contracts, fixtures and evaluations first; rebuild implementation around the new product model.

## 15. Phase result

This first-pass audit supports proceeding to:

1. the full runtime inventory;
2. domain-rule and fixture mapping;
3. quality/eval migration;
4. the Comparable Project Intelligence extraction brief;
5. product and technical architecture review before application scaffolding.
