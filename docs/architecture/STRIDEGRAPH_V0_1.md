# StrideGraph v0.1 — Business Context Model

## Purpose

StrideGraph is the canonical business-context layer underneath StrideBrain.

It allows StrideBrain to reason about connected company objects rather than treating organisational knowledge as a pile of unrelated files.

This document is a product and domain specification. It is not yet the final database schema.

## Core rule

Every high-value intelligence result should be explainable through first-class objects, relationships, permissions, and evidence.

## Core objects

### Organization

Represents one customer company and tenant boundary.

Key concepts:

- identity;
- locale and timezone;
- settings;
- memberships and roles;
- data ownership;
- integrations;
- retention and access policy.

### Person

Represents employees and authorized collaborators.

Examples:

- owner;
- project manager;
- estimator;
- designer;
- procurement staff;
- finance staff;
- external collaborator.

### Client

Represents the customer commissioning a project.

### Project

The central operating object.

Candidate properties:

- name;
- client;
- project type;
- location;
- area;
- status;
- start and completion dates;
- budget and currency;
- scope summary;
- project owner;
- tags;
- outcome summary.

### Document

Represents a retained company document or source.

Examples:

- drawing;
- specification;
- contract;
- quotation;
- supplier quotation;
- change order;
- meeting note;
- completion report;
- spreadsheet;
- photo;
- email or message record where authorized.

Documents need versions, provenance, access classification, and evidence locators.

### Quote

Represents a commercial estimate or quotation attached to a project.

Quotation version history is mandatory.

### QuoteVersion

Represents one immutable or auditable version of a quotation.

### QuoteItem

Represents structured line-level quotation information.

Candidate properties:

- category;
- description;
- unit;
- quantity;
- unit price;
- amount;
- material;
- supplier;
- cost or sell classification;
- currency;
- source evidence.

### Supplier

Represents vendors, subcontractors, fabricators, and material suppliers.

### Material

Represents reusable material or product concepts across projects and suppliers.

### Decision

Represents an explicit project decision.

Examples:

- supplier selection;
- scope acceptance;
- material substitution;
- pricing approval;
- schedule trade-off.

### Risk

Represents a project risk or issue with severity, status, owner, and evidence.

### Action

Represents a bounded operational next step with owner, status, due date, and origin.

### Change

Represents a meaningful change in project scope, cost, schedule, design, or commercial terms.

### EvidenceReference

Represents a canonical pointer from a fact, result, or action back to source material.

Examples:

- document page;
- spreadsheet sheet, row, or cell range;
- quote version and item;
- structured record;
- approved human-entered fact;
- external public reference where appropriate.

### IntelligenceRun

Represents an auditable StrideBrain retrieval/reasoning event.

Minimum concepts:

- user;
- organization;
- active context;
- intent;
- tools or retrievers used;
- evidence selected;
- runtime/model metadata;
- result;
- warnings or confidence state;
- actions proposed;
- timestamp;
- evaluation/feedback state.

## Core relationships

```text
Organization
 ├─ has → People
 ├─ serves → Clients
 ├─ has → Projects
 ├─ works_with → Suppliers
 ├─ configures → Policies / Integrations
 └─ owns → Evidence

Client
 └─ has → Projects

Project
 ├─ belongs_to → Client
 ├─ owned_by → Person
 ├─ has → Documents
 ├─ has → Quotes
 ├─ uses → Suppliers
 ├─ uses → Materials
 ├─ has → Decisions
 ├─ has → Risks
 ├─ has → Changes
 ├─ has → Actions
 └─ produces → Outcomes

Quote
 ├─ belongs_to → Project
 └─ has → QuoteVersions

QuoteVersion
 ├─ contains → QuoteItems
 └─ supported_by → EvidenceReferences

QuoteItem
 ├─ references → Material
 ├─ references → Supplier
 └─ supported_by → EvidenceReference

Decision / Risk / Change / Action
 └─ supported_by → EvidenceReference

IntelligenceRun
 ├─ operates_on → active context
 ├─ retrieves → authorized objects
 ├─ cites → EvidenceReferences
 └─ may_propose → Actions / Decisions / derived outputs
```

## Context envelope

Every StrideBrain request should resolve an explicit context envelope before retrieval.

Example:

```text
Organization: Horizon Atelier
User: Estimator A
Role: Estimator
Surface: Project workspace
Active project: Xinyi Flagship Renovation
Active quote: Q-2026-041 v3
Language: zh-Hant
Permissions: project-assigned commercial read; quote draft write
```

The user should not need to restate this context in the prompt.

## Comparable Project Intelligence

The first vertical slice depends on project similarity.

Similarity should not be one opaque vector score. It should use a hybrid, explainable model.

Candidate factors:

- project type;
- client type;
- floor area;
- location;
- scope categories;
- materials;
- quote composition;
- supplier overlap;
- budget range;
- duration;
- project outcome;
- semantic similarity across approved project sources.

Every result should expose:

- match score or match band;
- strongest similarity factors;
- meaningful differences;
- evidence used;
- exclusions and uncertainty.

Example:

```text
Neihu Office Renovation — 87% match

Why similar:
- office fit-out
- 610 m² vs current 640 m²
- same ceiling system
- same imported stone category
- 72% overlap in quote categories

Important difference:
- historical project used a domestic lighting package
```

## Evidence model

Evidence is first-class, not decorative citation text.

A useful result should be able to point to:

- project record;
- quote and version;
- quote item;
- document and version;
- page, row, cell range, or source locator where available;
- approved human-entered fact;
- public reference where the response concerns general industry guidance.

Derived statements must preserve which evidence produced them.

Example:

```text
Historical stone cost range:
NT$6,800–9,200 / m²

Based on:
- Project P012 / Quote v4 / Items 42–48
- Project P017 / Supplier quotation S33
- Project P021 / Final cost sheet / Rows 118–124
```

## Conflict model

StrideBrain must not silently choose between conflicting evidence.

Representable conflict examples:

- quotation versions contain different values;
- supplier quotation conflicts with final cost sheet;
- completion date differs across systems;
- approved drawing differs from site instruction.

Expected response pattern:

```text
I found conflicting values for the final stone cost.

Quote v3: NT$7,500/m²
Final cost sheet: NT$8,020/m²

The final cost sheet is newer, but I have not assumed it is authoritative.
```

The interface should offer source inspection and a resolution action.

## Learning model

Completed work should improve future retrieval through evidence-backed, reviewable artifacts.

Examples:

- project outcome summaries;
- approved lessons learned;
- supplier performance;
- quote-to-final-cost variance;
- recurring risks;
- approved decision rationales;
- corrections and superseded facts.

Negative feedback must create a review case. It must not silently rewrite approved knowledge.

## Tenant boundary

Every private object must belong directly or transitively to an Organization.

Tenant filtering and authorization must occur at the repository/tool layer—not only in prompts or the UI.

Cross-tenant retrieval is forbidden unless a future governed product feature explicitly defines shared knowledge.

## Demo dataset target

The initial fictional organisation should eventually contain approximately:

- 1 organization;
- 8–15 people;
- 10–15 clients;
- 20–30 historical projects;
- 4–6 active projects;
- 15–25 suppliers;
- 30–60 materials;
- 40+ quote versions;
- 300–600 quote items;
- 100+ documents and evidence records;
- decisions, risks, changes, and actions across multiple projects.

The data should intentionally overlap so StrideBrain can discover relationships instead of replaying scripted answers.

## Open architecture decisions

The following require Product and Technical Architecture approval before implementation:

1. whether Client is a dedicated object or an organization relationship;
2. document storage provider and version model;
3. material taxonomy depth for v0.1;
4. quotation-category normalization;
5. hybrid similarity-scoring design;
6. Postgres/pgvector versus a separate retrieval service;
7. event/history model for project state;
8. spreadsheet and PDF evidence granularity;
9. IntelligenceRun storage, retention, and redaction;
10. which derived facts require human confirmation;
11. authorization model for financial sensitivity and project assignment;
12. how public industry references coexist with private company evidence.
