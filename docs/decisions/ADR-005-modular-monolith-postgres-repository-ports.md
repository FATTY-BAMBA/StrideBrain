# ADR-005 — Modular Monolith, PostgreSQL, and Repository Ports

**Status:** Proposed for Technical Architecture acceptance  
**Date:** 2026-11-14  
**Decision owners:** Technical Architecture, Product Director  
**Applies to:** StrideBrain v0.1 application foundation

## Context

StrideBrain needs a real application foundation for Comparable Project Intelligence, including:

- trusted runtime context;
- tenant-scoped objects;
- versioned quotes/costs/evidence;
- deterministic comparison;
- durable ComparisonRuns;
- internal Action and AuditEvent transaction;
- isolated Vercel deployment.

The old prototype uses static browser modules and browser-local state. Copying that architecture would preserve the exact limitation the new repository was created to remove.

At the opposite extreme, splitting the first slice into multiple services would add deployment, consistency, authentication, tracing, and transaction complexity without a measured requirement.

## Decision

StrideBrain v0.1 will use:

1. a **modular monolith** application;
2. Next.js App Router and strict TypeScript for the web/application boundary;
3. PostgreSQL as canonical persistence;
4. Prisma as the initial persistence adapter;
5. repository ports between domain/application and persistence;
6. the same schema for synthetic fixture tenants and future real tenants;
7. durable Postgres-backed preview data rather than browser-owned business truth.

## Module boundaries

```text
runtime-context
organizations
projects
commercial
evidence
comparisons
actions
audit
intelligence
localization
```

Modules communicate through typed application/domain interfaces. UI routes do not query Prisma directly.

## Repository rule

Domain/application services depend on interfaces such as:

```text
ProjectRepository
CommercialRepository
EvidenceRepository
ComparisonRunRepository
ActionRepository
AuditRepository
```

Adapters may include:

- Prisma/Postgres for preview/production;
- in-memory/fixture adapters for unit tests;
- future ingestion/source adapters behind application services.

Fixture-specific branching is prohibited in UI/domain logic.

## Persistence rule

The L1 controlled demo uses a seeded Horizon Atelier organization in PostgreSQL.

Reasons:

- action creation and audit receipt are durable and real;
- schema/invariants are exercised early;
- comparison runs can be reopened;
- migration to pilot data is adapter/tenant work rather than a rewrite;
- failure/recovery can be tested honestly.

A pure static fixture adapter is allowed for tests but is not the shared preview source of truth.

## Transaction rule

Action creation and AuditEvent insertion occur in one database transaction.

Comparison runs are persisted atomically with their result snapshot or remain failed/incomplete; no partially “complete” run is exposed.

## Tenant rule

Every private row carries `organizationId`, and repository methods require trusted runtime context.

Application-level tenant predicates are mandatory from the first scaffold. Database RLS or equivalent defense-in-depth is required before real customer data (L2).

## Deployment rule

The new `FATTY-BAMBA/StrideBrain` repository deploys to its own Vercel project.

It does not share a deployment with:

- `primestride-web`;
- `StrideBrain-OS`.

No live domain moves until release gates pass.

## Consequences

### Positive

- coherent single deployment;
- real transactions and durable state;
- clear module seams;
- production-shaped fixture tenant;
- simpler tests/tracing than microservices;
- future adapters can change without rewriting UX/domain services.

### Costs

- initial schema/migrations and database environment are required;
- module boundaries must be enforced through review;
- Postgres fixture setup is more work than static JSON;
- database/RLS hardening remains before L2.

These costs are accepted because the demo must become the first usable product foundation.

## Rejected alternatives

### Copy the browser/static demo into the new repository

Rejected because it preserves browser-owned state, monolithic orchestration, and demo-only authority.

### Static JSON only in the shared preview

Rejected because the first action/audit flow would not be durable and production seams would remain untested.

### Microservices from the first slice

Rejected because the domain/team/traffic do not justify the operational complexity.

### Direct Prisma queries from route/components

Rejected because fixture/persistence concerns would leak into experience and domain logic.

### Graph database for StrideGraph v0.1

Rejected because relational objects and explicit relationships satisfy the first workflow. “Graph” describes the domain/context model, not a required database technology.

## Required safeguards

- architecture boundary lint/review;
- strict TypeScript;
- migrations in source control;
- organization-scoped repository tests;
- cross-tenant integration tests;
- fixture validation;
- database backup/rollback before L2;
- no secret-bearing client state.

## Rollback implication

Because no live domain is moved during scaffolding, a failed preview release can be rolled back at the Vercel deployment level without affecting `primestride-web` or the current demo.

Database migrations used in preview require forward/backward compatibility or a documented restore/reseed path.

## Acceptance criteria

- modules/repository ports are explicit;
- preview uses durable Postgres fixture data;
- domain services contain no Prisma/Next.js imports;
- UI contains no fixture imports;
- action/audit are transactional;
- organization scope is enforced and tested;
- isolated deployment exists;
- future identity/persistence hardening does not require changing the product flow.