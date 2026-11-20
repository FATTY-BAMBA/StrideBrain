# Build contract

## A — Domain, ports, persistence, applications

- Grant project:create and project:update to admin and project manager/estimator bundles. Explicit denies still win.
- Validate bounded keys, names, exact positive Decimal(18,3) area, existing commercial retail subtypes, m2, TWD, city, and canonical scope categories. Derive commercial categories on the server: SELECTIVE_DEMOLITION and PARTITIONS_CEILINGS map to DEMOLITION_CEILING; the other five categories map directly. Deduplicate the derived list and ignore browser commercial-category values.
- Existing source conventions remain: retail subtypes from CPI-SIM-1.0, m2/TWD from the current slice. No unit conversion or residential expansion.
- Preserve entered job/client names in both stored locale fields; never invent a translation. Interface strings are bilingual.
- Existing clients are chosen from a localized list of active clients scoped to the trusted organization; recheck the selected business key at write time. A new client's duplicate key is rejected; no silent rename or merge.
- Store pre-quote commercial category IDs on Project. The current quote remains authoritative for category context once present; existing fixture ranking is unchanged.
- Transactionally create Client when needed, Project, ProjectScope, creator ProjectAssignment and AuditEvent. A manager can immediately read/compare their newly created job after fresh identity resolution.
- Stage updates reject COMPLETE as both destination and expected stage; completed jobs have no stage controls. Completion belongs to the close-job flow. Other stage changes affect Project.stage only. They do not issue a quote, mark status completed, reconcile financial data or create work items.
- Stage requests carry the expected stage and a UUID idempotency key; tenant-scoped audit uniqueness and serializable transactions prevent duplicate writes. Changed/stale input returns conflict.
- A matching create retry returns the original success and business key. Compare a canonical validated-input SHA-256 fingerprint stored in the audit payload before checking duplicate references; changed input or actor conflicts. Recheck current membership/capabilities/project access, and retry serialization/unique races atomically.
- Feature code checks capabilities without branching on data mode. Preserve dataClassification from the trusted context; the environment gate remains only in src/lib/env/server-env.ts.
- Forward-only additive migration; legacy audit events have null idempotency keys.

## B — Creation experience

- Server page and server action both enforce authorization from the signed runtime context.
- Generate an editable job reference. Submit job class, area unit and currency as fixed hidden values; show area units and currency as context. Use one scope checkbox list and an existing-client dropdown, with separate new-client inputs.
- Accessible labeled controls, bilingual field errors, visible failure, pending state and preserved input on validation failure.
- Framework server-action origin protection; no browser-supplied organization, actor, role or grants.

## C — Stage groups

- Extend authorized project list DTO with stage; preserve every tenant and assignment predicate.
- Display all stages, with authorized entries and empty states. Only authorized writers receive stage controls.
- Revalidate after successful writes; concurrency conflicts ask the person to refresh.

## Verification

Required: npm run check; migration/fixture checks; real PostgreSQL creation/comparison, atomic rollback, concurrency/idempotency, Viewer and cross-organization denials; action and page boundaries; bilingual field errors and grouping. Record preview acceptance separately and do not imply local checks prove hosted acceptance.
