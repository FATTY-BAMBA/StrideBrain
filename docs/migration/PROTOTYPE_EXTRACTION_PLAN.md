# Prototype Extraction Plan

## Objective

Systematically extract the strongest product behavior, domain logic, evidence patterns, bilingual UX work, demo data, and quality lessons from:

- `primestride-web/public/stridebrain-demo/**`
- `primestride-web/docs/stridebrain-industries/**`
- `primestride-web/docs/stridebrain-interiors/**`

into the canonical `StrideBrain` repository without copying the prototype architecture blindly.

## Governing rule

Do not choose between:

- keeping the product permanently inside the marketing repository; or
- discarding the prototype and starting from memory.

Instead:

> **Preserve behavior and evidence; redesign implementation boundaries.**

## Classification model

Every prototype asset receives one or more classifications.

### KEEP CONCEPT

The product idea belongs in StrideBrain.

### PORT LOGIC

The underlying behavior or deterministic rule is reusable after typing, testing, and adapting it to server/domain boundaries.

### REBUILD EXPERIENCE

The interaction is valuable, but the UI should be redesigned in the canonical product system.

### DEMO FIXTURE

The asset remains useful as fictional data, evaluation input, or demo content.

### HISTORICAL REFERENCE

The asset documents an important decision or lesson but is not runtime code.

### RETIRE AFTER PARITY

The asset should remain in the old deployment until the new implementation passes agreed parity and release gates, then be removed from the marketing repository.

## Initial extraction map

| Prototype area | Keep concept | Port logic | Rebuild experience | Fixture/reference | Initial decision |
|---|:---:|:---:|:---:|:---:|---|
| Copilot conversational layer | ✓ | evaluate | ✓ | QA prompts | Core product capability; must become context-aware and permission-aware |
| Copilot suggestions | ✓ | evaluate | ✓ | prompt/eval set | Suggestions should depend on surface, role, project state, and evidence |
| Copilot formatting and errors | ✓ | evaluate | ✓ | error cases | Convert responses into structured result components and explicit failure states |
| Conversation state | ✓ | evaluate | ✓ | scenario history | Move to defined persistence/retention and active-context model |
| Historical estimator | ✓ | ✓ | ✓ | fictional cost records | Rebuild around typed quote/project objects and traceable calculations |
| Document intelligence | ✓ | evaluate | ✓ | sample files | Replace browser-only parsing assumptions with ingestion and review contracts |
| Document-to-history bridge | ✓ | ✓ | ✓ | bridge QA | Important precursor to Comparable Project Intelligence |
| Evidence presentation | ✓ | ✓ | ✓ | source registry | Establish canonical EvidenceReference and evidence panel |
| Industry packs | ✓ | ✓ | simplify | interior/printing fixtures | Preserve configuration-first industry language; do not fork product implementations |
| Interior historical library | ✓ | transform | — | ✓ | Convert into realistic seeded projects, quotes, suppliers, and evidence |
| Printing historical library | later | transform | — | ✓ | Retain as second-sector regression pack, not v0.1 product focus |
| Agent runtime/planners | evaluate | evaluate | hide internals | scenarios | Recast as internal tools under one StrideBrain experience |
| AI team UI | limited | limited | likely replace | strategy reference | Avoid exposing many agents as the product IA |
| Guest invitation flow | ✓ | no direct port | ✓ | acceptance cases | Replace with real identity/membership architecture; retain controlled-demo journey |
| OpenRouter/model picker | evaluate | evaluate | simplify | QA cases | Default experience should be StrideBrain; provider selection advanced/internal |
| Contact/channel adapters | later | evaluate | later | QA/reference | External actions require authenticated approval and audit |
| Readiness workbench | ✓ | ✓ | redesign | rules/QA | Potential future workflow after project intelligence foundation |
| Quote approval gates | ✓ | ✓ | redesign | acceptance tests | Strong transferable pattern for consequential actions |
| Browser QA pages | no | no | no | ✓ | Convert into automated unit, integration, E2E, and eval suites |
| Static HTML shell | no | no | no | historical | Replace with canonical application framework |
| Large browser `app.js` coordinator | behavior only | selective | ✓ | historical | Decompose into domain services, server APIs, state, and typed components |
| Synthetic company data | ✓ | transform | — | ✓ | Treat as tenant fixtures through repository interfaces |

## Extraction workstreams

### 1. Product behavior inventory

For every visible demo workflow, record:

- user goal;
- entry point;
- inputs;
- outputs;
- evidence shown;
- actions offered;
- failure and empty states;
- what is truly implemented;
- what is simulated;
- production conversion requirement.

### 2. Domain logic inventory

Identify deterministic logic worth preserving, including:

- quotation and margin calculations;
- historical-cost eligibility;
- approval sequencing;
- readiness gates;
- source validation;
- action blocking;
- feedback/review behavior;
- industry-pack validation.

Every ported rule must receive:

- a typed contract;
- unit tests;
- explicit ownership in the domain/application layer;
- source/evidence behavior;
- tenant and authorization rules.

### 3. Data inventory

Transform static browser fixtures into a canonical demo dataset.

Required mapping:

- companies → Organization fixtures;
- historical jobs/projects → Projects;
- quotes and versions → Quote / QuoteVersion / QuoteItem;
- supplier records → Suppliers;
- documents → Document / DocumentVersion / EvidenceReference;
- approvals → Decisions / Actions / audit events;
- activity → project/event history.

The new demo loader must use the same repository/service contracts intended for real tenants.

### 4. UX inventory

Capture:

- strong layouts and interaction moments;
- confusing or fragmented navigation;
- technical explanations exposed to users;
- bilingual inconsistencies;
- useful cards, tables, source views, and action patterns;
- mobile/responsive behavior;
- first-session comprehension problems.

Do not migrate screens merely because they exist.

### 5. QA and evaluation inventory

Convert existing QA assets into:

- unit tests;
- domain regression tests;
- browser journeys;
- bilingual parity tests;
- grounding/citation evals;
- canonical Copilot questions;
- adversarial permission tests;
- release smoke tests.

## First extraction priority

The first priority is the full behavior behind:

> **Have we done something like this before?**

Likely prototype sources include:

- historical estimator;
- document-history bridge;
- industry evidence;
- project and quotation fixtures;
- evidence presentation;
- Copilot retrieval and formatting;
- source validation;
- relevant QA documents and tests.

The output is not a file copy. It is a complete feature contract for the new architecture.

## Migration phases

### Phase A — Inventory and freeze

- preserve the current live demo;
- identify its exact release commit;
- inventory runtime, docs, tests, fixtures, and server routes;
- block new architecture growth inside `primestride-web` except safety fixes.

### Phase B — Specify

- finalize Product Constitution;
- finalize StrideGraph v0.1;
- define information architecture;
- define intelligence runtime;
- specify Comparable Project Intelligence;
- establish evaluation datasets.

### Phase C — Foundation implementation

- initialize application framework;
- establish authentication/organization seams;
- establish database and migrations;
- establish evidence and audit contracts;
- establish demo fixture repository;
- establish CI and preview deployment.

### Phase D — Vertical slice

- port/replace historical comparison logic;
- build project-context retrieval;
- build result and evidence UI;
- build compare-current-quote action;
- run functional, UX, bilingual, grounding, and adversarial evals.

### Phase E — Demo cutover

- deploy `StrideBrain` to a new preview/demo Vercel project;
- verify feature and quality parity for the agreed journey;
- move `demo.primestrideai.com` only after exact tested deployment approval;
- retain rollback to the old demo;
- remove embedded product runtime from `primestride-web` in a separate cleanup PR.

## Exit criteria for the old embedded demo

The old runtime may be retired only when:

1. the canonical Comparable Project Intelligence journey passes acceptance;
2. evidence/source behavior is preserved or improved;
3. Traditional Chinese and English critical paths pass;
4. controlled-demo authentication works;
5. failure states fail honestly;
6. browser and intelligence evals pass;
7. the tested Vercel deployment is promoted to the demo alias;
8. rollback is documented and verified;
9. marketing-site links are updated;
10. no product secrets or operational dependencies remain in `primestride-web`.
