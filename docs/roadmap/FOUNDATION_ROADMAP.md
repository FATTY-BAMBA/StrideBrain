# StrideBrain v0.1 — Foundation Roadmap

## Objective

Create a coherent, production-shaped foundation before adding more customer-facing features.

The first milestone is not a broad dashboard. It is one complete, evidence-backed vertical slice:

> **Comparable Project Intelligence — “Have we done something like this before?”**

## Phase 0 — Product foundation

### Deliverables

- Product Constitution;
- repository/deployment boundaries;
- StrideGraph v0.1;
- quality constitution;
- StrideFoundry operating model;
- prototype extraction plan;
- approved first ICP and non-goals.

### Exit criteria

- customer product is clearly separated from marketing and internal PrimeStride OS;
- product scope and quality rules are reviewable in the repository;
- no implementation work depends only on conversation history.

## Phase 1 — Research and extraction audit

### Market/User research

Validate the first Taiwan interior design/renovation ICP through interviews and workflow research.

Questions:

- Where do historical projects and quotations live?
- What information is hardest to recover?
- How are quote revisions handled?
- Which roles need historical knowledge?
- What creates trust or blocks adoption?
- Which demo moment produces real urgency?

### Prototype extraction audit

Inventory the old demo's:

- visible workflows;
- domain rules;
- fixtures;
- source/evidence behavior;
- bilingual behavior;
- tests and QA pages;
- server routes and external integrations;
- demo-only shortcuts;
- transferable implementation seams.

### Product-reference research

Create a pattern library covering relevant systems such as enterprise search/context, operational graphs, object-centered workflows, and high-quality AI interaction design.

Each pattern must document:

- user problem;
- why it works;
- transferability;
- risk of copying;
- StrideBrain decision.

### Exit criteria

- prototype assets classified;
- first ICP evidence summarized;
- reference patterns accepted or rejected explicitly;
- no critical unknown blocks vertical-slice specification.

## Phase 2 — Product and UX architecture

### Deliverables

- information architecture for Home, Projects, Knowledge, StrideBrain, and Settings;
- project workspace structure;
- active-context model;
- evidence/context panel behavior;
- comparable-project result experience;
- all critical states: loading, empty, insufficient evidence, conflict, stale, error, unauthorized;
- English and Traditional Chinese terminology contract;
- interaction/component principles.

### Exit criteria

- a new user can understand the intended product journey without an architecture explanation;
- the first vertical slice is specified from entry to action;
- Design Critic approves the workflow after revisions.

## Phase 3 — Technical architecture

### Deliverables

- application framework decision;
- organization, membership, and role model;
- initial Prisma/Postgres schema proposal;
- document/evidence model;
- demo fixture repository contract;
- intelligence runtime contract;
- retrieval and similarity architecture;
- audit-event contract;
- API and service boundaries;
- observability and evaluation traces;
- migration and rollback strategy;
- CI and preview deployment design.

### Exit criteria

- Technical Architect approves Build Contract;
- tenant boundary is explicit below the AI layer;
- demo fixtures can be replaced by tenant repositories without rewriting product layers;
- no unresolved decision makes implementation disposable.

## Phase 4 — Product skeleton

### Deliverables

- production-grade Next.js/TypeScript foundation;
- design tokens and shared primitives;
- authentication seam;
- organization context seam;
- database/migration foundation;
- domain packages/modules;
- demo-data loader;
- CI: lint, type check, tests, build, dependency review;
- preview deployment;
- structured logging/error handling.

### Exit criteria

- empty product shell deploys cleanly;
- organization context and demo tenant load safely;
- CI and preview release flow are repeatable;
- no customer capability is falsely claimed yet.

## Phase 5 — Comparable Project Intelligence

### User journey

1. User opens an active project or opportunity.
2. StrideBrain already knows the project context.
3. User asks: “Have we done something like this before?”
4. System retrieves and ranks historical projects.
5. Results explain similarity and important differences.
6. User inspects supporting projects, quotations, quote items, documents, suppliers, and lessons.
7. System compares current quote/project against history.
8. System recommends bounded next actions.
9. User creates or approves an action.
10. The run and action are auditable.

### Deliverables

- realistic fictional interior-design organisation;
- historical and active projects;
- quotations and items;
- suppliers/materials;
- documents and evidence references;
- explainable hybrid comparison;
- result cards/table;
- evidence panel;
- current-quote comparison;
- action creation;
- bilingual flow;
- evaluation suite.

### Exit criteria

- applicable L1 quality gates pass;
- canonical questions are grounded and cite correct evidence;
- unsupported questions abstain honestly;
- critical bilingual journey passes;
- browser journey passes;
- Product Director and human owner approve controlled-demo release.

## Phase 6 — Controlled demo cutover

### Deliverables

- dedicated Vercel project linked to `StrideBrain`;
- protected demo environment;
- exact tested deployment;
- domain cutover plan for `demo.primestrideai.com`;
- rollback to old embedded demo;
- marketing-site CTA update;
- post-cutover monitoring.

### Exit criteria

- demo alias serves the tested StrideBrain deployment;
- old demo remains recoverable during stabilization;
- website and product deployments are independent;
- no product runtime or secrets depend on `primestride-web`.

## Later vertical slices

Only after Slice 1 passes:

1. Historical pricing intelligence;
2. Supplier intelligence;
3. Project risk intelligence;
4. Project decision/action coordination;
5. Document ingestion and human-assisted mapping;
6. Controlled communication integrations;
7. repeatable tenant onboarding.

## Anti-roadmap

Do not prioritize these before the first vertical slice is strong:

- many top-level modules;
- multiple exposed agents;
- broad model picker;
- public workflow builder;
- generic prompt catalogue;
- autonomous external actions;
- unrelated industry packs;
- dashboard polish disconnected from real intelligence.

## Immediate next work contracts

1. **Prototype Extraction Audit**
2. **Product Reference Pattern Library**
3. **Comparable Project Intelligence Product/UX Contract**
4. **Comparable Project Intelligence Technical Architecture**
5. **Initial Evaluation Dataset**

These should be independently reviewed before application scaffolding begins.
