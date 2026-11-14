# Stage 3 — Authorized Project Workspace Read Model

**Status:** implementation candidate  
**Issue:** #19  
**Branch:** `build/stage-3-project-workspace-read-model`

## Purpose

Stage 3 turns the trusted Stage 2 `RuntimeContext` into one bounded, authorization-aware project workspace payload.

It does **not** discover or rank comparable projects. It establishes the coherent, secure project context that Stage 4 will consume.

## Delivered components

### Domain/read DTO

`src/modules/projects/domain/project-workspace.ts`

Defines:

- project identity and localized display values;
- current quotation, forecast, actual-cost, and supplier-offer observation states;
- evidence health and evidence summaries;
- suppliers, materials, open actions, suggested questions, and capabilities;
- non-disclosing unavailable outcome;
- deterministic project workspace state policy.

### Application use case

`src/modules/projects/application/get-project-workspace.ts`

`GetProjectWorkspace` requires:

- trusted `RuntimeContext`;
- a project business key;
- assignment-aware project lookup;
- independent quote, forecast, actual, evidence, and action authorization;
- organization-scoped repository ports.

The use case never accepts organization, role, capabilities, or assignment flags from browser request fields.

### Repository port

`src/repositories/ports/project-workspace-repository.ts`

The bounded port exposes only Stage 3 reads:

- project/client/manager/scope context;
- current quote;
- current forecast;
- current reconciled actual-cost status;
- authorized evidence summaries;
- open evidence conflicts;
- supplier offers;
- open internal actions.

It does not expose raw Prisma models.

### Prisma adapter

`src/repositories/prisma/prisma-project-workspace-repository.ts`

Every read includes the trusted `organizationId` and project/evidence boundary where applicable.

Current commercial summaries exclude superseded versions at query time.

## Authorization flow

```text
RuntimeContext
  → assignment-aware ProjectRepository lookup
  → AuthorizationService project decision
  → organization-scoped project context
  → independent section decisions
       ├─ QUOTE
       ├─ FORECAST
       ├─ ACTUAL
       ├─ EVIDENCE
       └─ INTERNAL REVIEW CAPABILITIES
  → authorized reads only
  → DTO mapping/redaction
```

A denied section is not queried and does not enter the DTO mapper.

### Viewer behavior

A Viewer with project assignment may receive:

- project metadata;
- localized client/manager/scope context;
- non-sensitive authorized evidence summary;
- read-only comparison capability if granted.

The Viewer does not receive:

- quotation amount;
- forecast amount;
- reconciled actual amount;
- supplier-offer amount;
- action-write affordance;
- inaccessible identifiers or hidden counts.

## Financial authority separation

The read model preserves four distinct observation types:

1. `QUOTED_PRICE`
2. `SUPPLIER_OFFER`
3. `FORECAST_DIRECT_COST`
4. `RECONCILED_ACTUAL_COST`

They are never collapsed into one generic financial amount.

A conflicted actual-cost version returns a `CONFLICTED` observation without an authoritative amount.

Financial amounts remain exact decimal strings.

## State policy

State precedence is deterministic and based only on information the user may access:

```text
CONFLICTED
  > STALE
  > PARTIAL
  > PERMISSION_RESTRICTED
  > READY
```

### `CONFLICTED`

At least one authorized open evidence conflict or conflicted commercial observation affects the workspace.

### `STALE`

No higher-priority conflict exists, but authorized evidence, active quotation validity, or a supplier offer is stale.

### `PARTIAL`

No conflict/stale condition exists, but required authorized project context is missing—for example manager, scope, quote-review commercial context, or evidence.

### `PERMISSION_RESTRICTED`

The project is available, but one or more workspace sections/actions are intentionally restricted by the trusted role/capability/assignment context.

### `READY`

The authorized Stage 3 context is complete enough and has no visible conflict/stale/restriction state.

### `UNAVAILABLE`

The project is nonexistent, cross-organization, unassigned, or otherwise inaccessible. These cases return the same public outcome shape:

```json
{
  "kind": "UNAVAILABLE",
  "errorCode": "PROJECT_UNAVAILABLE",
  "requestId": "..."
}
```

## Evidence behavior

Evidence DTOs preserve:

- source type;
- source business key and version when authorized;
- claim key;
- observation type;
- authority state;
- effective/stale dates;
- current/stale/conflicted condition.

Non-sensitive evidence queries allow only:

- `DEMO_SYNTHETIC`;
- `PUBLIC_REFERENCE`;
- `TENANT_APPROVED`.

Authorized evidence may additionally include tenant-private/restricted records where the server capability decision permits it.

Conflict lookup occurs only after authorized evidence IDs have been selected.

## Bounded-array behavior

Repository adapters cap:

- evidence references at 100;
- conflicts at 50;
- supplier offers at 25;
- open actions at 25.

These are workspace-display bounds, not claims of total organization counts.

## Tests

### Application tests

`tests/projects/get-project-workspace.test.ts`

Covers:

- Mei’s full authorized Xinyi context;
- exact decimal-string preservation;
- Viewer economics redaction before query/DTO construction;
- equivalent unavailable outcome;
- conflicted actual-cost suppression;
- stale supplier-offer state;
- deterministic partial state.

### Repository tests

`tests/repositories/prisma-project-workspace-repository.test.ts`

Covers:

- organization/project scope in project reads;
- current non-superseded quotation selection;
- evidence-classification filtering;
- conflict reads bounded by authorized evidence IDs;
- organization/project scope for supplier offers;
- decimal string mapping.

## Deliberate Stage 3 limits

Not implemented here:

- candidate discovery;
- similarity scoring;
- historical aggregation/medians;
- comparison runs or claims;
- optional model explanation;
- action creation transaction;
- arbitrary document ingestion;
- polished project UI;
- real customer data or production identity.

## Known follow-up items

1. Stage 4 should consume this workspace context without importing Prisma or fixture details.
2. Evidence bindings for comparison claims will expand beyond project/document summaries in later stages.
3. `Action.id` is currently the only stable action selector in the schema; a dedicated action business key should be considered before external-facing action navigation.
4. Route/UI integration should preserve this use case boundary rather than query Prisma from React components.
5. Integration tests against the seeded PostgreSQL fixture should be added before Stage 3 is called release-complete.

## Exit-gate evidence required before merge

- format/lint/type/unit/build green on the exact PR head;
- existing migration/fixture verification remains green;
- no cross-organization or Viewer economics leakage;
- independent authorization/data review accepted;
- no Stage 4+ logic introduced.
