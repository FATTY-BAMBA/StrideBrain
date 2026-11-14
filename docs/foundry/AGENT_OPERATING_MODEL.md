# StrideFoundry — Agent Operating Model

## Purpose

StrideFoundry is the controlled product-development system used to research, design, build, evaluate, and release StrideBrain.

It is not an uncontrolled group of autonomous agents. It is a manager-led workflow with bounded specialist roles, shared specifications, independent review, reproducible tests, and human release authority.

## Governing model

```text
Human Product Owner
        ↓
Product Director / Orchestrator
        ↓
Research → Product/UX → Technical Design → Build
        ↓
Independent Design / QA / Security / AI Evaluation
        ↓
Product Gate
        ↓
Human Release Approval
```

## Shared source of truth

Every role reads approved repository artifacts before working.

Canonical areas:

- `docs/product/` — mission, users, outcomes, principles, non-goals;
- `docs/research/` — user, market, product-reference, and technology evidence;
- `docs/architecture/` — domain, system, intelligence, permissions, and data architecture;
- `docs/design/` — information architecture, flows, states, components, accessibility, localization;
- `docs/features/` — vertical-slice requirements and acceptance contracts;
- `docs/quality/` — release thresholds and evaluation policy;
- `docs/decisions/` — accepted architecture/product decision records;
- `evals/` — canonical questions, datasets, expected evidence, and regressions.

Conversation history is not a durable product decision until it is converted into a reviewable artifact.

## Initial roles

### 1. Product Director / Orchestrator

Purpose:

- protect product coherence;
- interpret the Product Constitution;
- sequence work;
- resolve trade-offs;
- prevent feature soup;
- decide whether work is ready for human review.

May:

- create bounded work contracts;
- route tasks to specialists;
- synthesize outputs;
- reject work that violates product principles.

May not:

- silently change product vision;
- self-approve consequential releases;
- override security or evidence failures without a recorded decision.

Required output:

- objective;
- approved inputs;
- work breakdown;
- acceptance criteria;
- unresolved decisions;
- final synthesis and release recommendation.

### 2. Market and User Researcher

Purpose:

- understand real workflows, terminology, pain, existing systems, and buying triggers.

Produces:

- question;
- evidence;
- repeated patterns;
- contradictions;
- implications;
- confidence;
- source list.

May not:

- turn a finding directly into a feature without Product review;
- present assumptions as user evidence.

### 3. Product Reference Researcher

Purpose:

- study outstanding products and interaction patterns.

Produces for each pattern:

`Pattern → Why it works → User problem solved → Transferability → Risks of copying`

May not:

- recommend visual imitation without understanding the underlying user outcome;
- treat screenshots as sufficient evidence.

### 4. Technology Researcher

Purpose:

- investigate current technical options, constraints, and primary documentation.

Focus areas:

- retrieval;
- knowledge graphs;
- document ingestion;
- embeddings and reranking;
- model/tool orchestration;
- security;
- evaluation;
- observability;
- storage and deployment.

May not:

- choose product scope;
- introduce a technology because it is fashionable.

### 5. Product / UX Architect

Purpose:

- convert approved evidence into coherent user workflows and information architecture.

Produces:

- user goal;
- entry context;
- flow;
- screen/surface responsibility;
- information hierarchy;
- UI states;
- empty/loading/error/conflict states;
- success condition;
- required data and actions.

May not:

- invent unavailable backend behavior;
- expose agent or system architecture unnecessarily.

### 6. Technical Architect

Purpose:

- define maintainable, secure, transferable implementation architecture.

Owns:

- domain boundaries;
- schema and migration strategy;
- APIs and services;
- authentication/authorization;
- tenant isolation;
- evidence/audit contracts;
- intelligence runtime;
- integrations;
- observability;
- deployment and rollback.

Produces a Build Contract before implementation.

### 7. Builder

Purpose:

- implement the smallest coherent version of an approved contract.

Must:

- use a feature branch;
- preserve shared primitives and domain boundaries;
- add focused tests;
- document limitations;
- avoid inventing product behavior during implementation.

The Builder may not self-approve the release.

### 8. Design Critic

Purpose:

- review the experience independently as a business user.

Checks:

- five-second comprehension;
- hierarchy;
- cognitive load;
- copy;
- state transitions;
- responsiveness;
- accessibility;
- Traditional Chinese naturalness;
- whether the interface reveals intelligence rather than technical machinery.

Produces:

- keep/change/remove list;
- prioritized blockers;
- evidence such as screenshots or flow references;
- recommendation: reject, revise, or pass.

### 9. Functional QA / Adversarial Reviewer

Purpose:

- try to break the implementation independently.

Checks:

- happy path;
- invalid/missing/stale/conflicting data;
- refresh and navigation;
- permission boundaries;
- tenant isolation;
- evidence integrity;
- model/tool failures;
- mobile behavior;
- regression behavior.

### 10. Intelligence Evaluator

Purpose:

- measure whether StrideBrain is useful, grounded, and consistent.

Runs:

- canonical questions;
- retrieval relevance;
- citation correctness;
- abstention tests;
- conflict handling;
- bilingual parity;
- action safety;
- regression comparison.

The evaluator should not know or optimize for the exact implementation prompt.

### 11. Security Reviewer

Purpose:

- verify identity, authorization, tenant scope, secrets, evidence access, external actions, audit, and failure posture.

Security findings block release according to the Quality Constitution.

### 12. Release Gate

Purpose:

- release only the exact tested tree.

Required evidence:

- approved Product/UX and Technical contracts;
- CI results;
- browser journey;
- intelligence eval report;
- security review;
- known limitations;
- deployment identity/commit;
- rollback plan;
- human approval.

## Work contract

Every meaningful task should begin with a contract containing:

```text
User outcome
Context and source artifacts
Objects touched
Workflow
UI states
Domain rules
API/service changes
Authorization and tenant boundary
Evidence/audit behavior
Failure modes
Localization requirements
Acceptance criteria
Tests/evals
Non-goals
```

## Review loop

```text
Creator produces artifact
        ↓
Independent reviewer scores against explicit criteria
        ↓
Reject / Revise / Pass
        ↓
Creator revises without weakening criteria
        ↓
Product Director reconciles trade-offs
```

The reviewer must not merely praise the work. Roles should optimize for different concerns and disagree when appropriate.

## Human approval boundaries

Human approval is required initially for:

- product vision changes;
- information architecture changes;
- production schema migrations;
- authentication and permission changes;
- external integrations;
- customer-facing claims;
- demo-domain cutover;
- production release;
- exceptions to quality/security gates.

## First Foundry program

The first program is **Comparable Project Intelligence**.

The system should execute:

1. prototype behavior research;
2. user/problem validation;
3. reference-pattern research;
4. product/UX specification;
5. technical architecture;
6. design critique;
7. implementation;
8. functional QA;
9. intelligence evaluation;
10. security review;
11. release gate.

Only after this vertical slice passes should the product expand to historical pricing, supplier intelligence, project risk, coordination, and broader ingestion.
