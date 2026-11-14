# Stage 2 — Trusted Runtime Context and Authorization

**Status:** Implementation candidate under PR review  
**Issue:** #17  
**Pull request:** #18  
**Stage boundary:** synthetic-demo sessions, trusted runtime context, capability policy, project assignment, and authorization only

## 1. Purpose

Stage 2 establishes the server-side identity and authorization boundary required before any project workspace or Comparable Project Intelligence service can read private organization data.

The central contract is:

```text
opaque signed session credential
  → server-side session record
  → active membership
  → organization
  → reviewed role bundle
  → explicit ALLOW / DENY grants
  → project assignments
  → trusted RuntimeContext
  → repository and use-case authorization
```

The browser supplies only an opaque credential. It cannot select the authoritative organization, membership, role, capabilities, or project assignments.

## 2. L1 demo identity boundary

The first release remains an L1 controlled synthetic demo. Stage 2 does **not** introduce a production identity provider or real customer accounts.

The demo session system is intentionally narrow:

- sessions may be issued only by trusted server code;
- the target membership must be active;
- the person must be active;
- the organization must be classified `DEMO_SYNTHETIC`;
- the raw credential is returned only through a secure response cookie;
- only a SHA-256 token hash is stored;
- sessions have bounded expiry;
- sessions can be revoked;
- membership, grant, and assignment changes take effect on the next request because context is resolved fresh every time.

Real customer identity is an L2 requirement and must replace the fixture issuer before real private data is used.

## 3. Session credential design

Credential shape:

```text
sb1.<random-session-id>.<random-nonce>.<HMAC-SHA256-signature>
```

Properties:

- session ID: 128 bits of random data;
- nonce: 256 bits of random data;
- HMAC-SHA256 signing;
- timing-safe signature comparison;
- server signing secret of at least 32 bytes;
- deterministic SHA-256 hash for database lookup;
- bounded token length and strict format validation.

The database never stores the raw token, HMAC secret, or browser cookie value.

## 4. Cookie contract

Cookie name:

```text
__Host-stridebrain_demo_session
```

Required attributes:

- `Path=/`;
- `HttpOnly`;
- `Secure`;
- `SameSite=Lax`;
- no `Domain` attribute;
- explicit expiry and max-age.

Cookie lifetime is calculated from the same server clock used to create the session record.

A malformed, undecodable, missing, or oversized cookie resolves to no authenticated context.

## 5. Server secret contract

Environment variable:

```text
STRIDEBRAIN_DEMO_SESSION_SECRET
```

Rules:

- server-only;
- at least 32 bytes;
- unique per environment;
- never committed;
- never supplied through a `NEXT_PUBLIC_` variable;
- configuration failure blocks session issuance/resolution rather than falling back to an insecure default.

## 6. Persistence model

### `DemoSession`

Stores:

- opaque session ID;
- organization ID;
- membership ID;
- SHA-256 token hash;
- preferred locale;
- issued/expires/revoked/last-seen timestamps.

Database checks enforce:

- 64-character lowercase hexadecimal hash;
- supported locale;
- expiry after issuance;
- revocation not before issuance.

A composite foreign key enforces that `(membershipId, organizationId)` belongs to the same membership record.

### `MembershipCapabilityGrant`

Stores:

- organization ID;
- membership ID;
- capability;
- `ALLOW` or `DENY`.

Database checks allow only the accepted v0.1 capability vocabulary. A composite foreign key prevents a grant from attaching a membership to a different organization.

### Removed legacy authority source

The Stage 1 placeholder `Membership.capabilities` array is removed in Stage 2.

Capabilities now have one authoritative source:

```text
reviewed role bundle + explicit grant/deny rows
```

This prevents future code from trusting two competing capability systems.

## 7. Capability vocabulary

Stage 2 supports only:

- `project:read`
- `project:compare`
- `quote:read`
- `commercial:forecast-read`
- `commercial:actual-read`
- `evidence:read`
- `action:internal-review:propose`
- `action:internal-review:create`
- `action:assign`
- `authority:financial-conflict:resolve`
- `settings:manage`

Unknown capabilities fail closed in the repository and are rejected by the database.

## 8. Role bundles

### Organization Admin

Receives the full reviewed v0.1 capability bundle and may read authorized organization projects without individual project assignments.

### Project Manager / Estimator

Default capabilities:

- project read and comparison;
- quote and forecast read;
- evidence read;
- internal-review proposal/create/assignment.

Actual-cost access is **not** included by default. Mei receives `commercial:actual-read` through an explicit `ALLOW` grant and must also have a project assignment whose `canReadActuals` flag is true.

### Financial Reviewer

Receives commercial/actual/evidence and internal-review capabilities, but still requires explicit project assignments. The fixture assigns the reviewed Financial Reviewer persona to all Horizon projects rather than adding an implicit organization-wide bypass.

### Viewer

Receives:

- project read;
- project compare;
- non-sensitive evidence access.

Viewer receives explicit `DENY` rows for:

- actual costs;
- internal-review proposal;
- internal-review creation;
- action assignment.

## 9. Grant resolution

Resolution order:

1. start with the reviewed role bundle;
2. collect all explicit `DENY` grants;
3. add explicit `ALLOW` grants only when the capability is not denied;
4. remove every denied capability.

`DENY` always wins independent of database ordering.

The old Membership array is not read.

## 10. Trusted `RuntimeContext`

`SignedDemoIdentityContext` resolves:

- request ID;
- person/user ID;
- membership ID;
- organization ID;
- role;
- effective capabilities;
- assigned project IDs;
- project-level actual/action flags;
- locale;
- synthetic/private data mode.

Resolution rejects:

- missing credentials;
- malformed credentials;
- invalid signatures;
- unknown hashes;
- session ID/hash disagreement;
- expired sessions;
- revoked sessions;
- inactive membership;
- inactive person;
- non-synthetic organization;
- membership/session/person organization disagreement;
- grant organization disagreement;
- assignment organization disagreement;
- unknown capability/effect records.

Headers, query parameters, route parameters, model output, and browser storage cannot override organization, membership, role, or capability state.

## 11. Repository defense in depth

The database composite foreign keys prevent cross-organization session/grant membership links.

The Prisma adapter additionally verifies:

- session membership ID matches the joined membership;
- session organization matches membership organization;
- membership organization matches person organization;
- each explicit grant belongs to the same organization;
- each assignment belongs to the same organization;
- every capability and effect is recognized.

Any disagreement returns no session context.

## 12. Authorization service

Authorization is evaluated server-side against a fresh `RuntimeContext`.

### Project read

Requires:

- `project:read`;
- explicit project assignment for every non-admin role.

Organization Admin is the only role that may bypass individual assignment in v0.1.

### Comparison

Requires authorized project read plus `project:compare`.

### Commercial reads

- quote: `quote:read`;
- forecast: `commercial:forecast-read`;
- supplier offer: `commercial:forecast-read`;
- actual: `commercial:actual-read` **and** assignment `canReadActuals=true`.

### Evidence

Requires authorized project read plus `evidence:read`.

Presentation scope:

- `AUTHORIZED` when actual-cost capability and assignment allow it;
- `NON_SENSITIVE` when evidence is allowed but actual-cost evidence is not;
- `NONE` otherwise.

The DTO is only a presentation hint. Evidence repositories and use cases must authorize again before returning records.

### Internal review action seams

Proposal requires:

- authorized project read;
- assignment `canCreateAction=true` for non-admin roles;
- `action:internal-review:propose`.

Creation additionally requires `action:internal-review:create`.

Assignment additionally requires `action:assign`.

Stage 2 does not write actions. These are authorization seams for Stage 9.

## 13. Non-disclosing denial behavior

Public errors are intentionally small:

- `PROJECT_UNAVAILABLE`
- `EVIDENCE_UNAVAILABLE`
- `ACTION_NOT_AUTHORIZED`

They never include:

- organization IDs;
- project IDs;
- hidden record names;
- internal authorization reasons;
- whether a record exists;
- candidate counts;
- restricted evidence metadata.

Internal reasons remain server-side for tests/audit:

- missing capability;
- missing assignment;
- actual-read denied;
- action assignment denied.

Unauthorized and nonexistent project flows must map to the same public result.

## 14. Synthetic fixture policy

The Stage 2 fixture adds:

- explicit Mei actual-cost allow;
- explicit Viewer actual/action denies;
- explicit Financial Reviewer project assignments;
- one expired hash-only session;
- one revoked hash-only session.

It deliberately does not seed a usable raw credential. Valid sessions are issued at runtime by the server-only service.

The fixture verifier rejects:

- missing persona grants;
- incomplete Financial Reviewer assignments;
- raw-token-like database columns;
- non-hash credentials;
- invalid capabilities;
- cross-organization session/grant links;
- missing database constraints.

## 15. Presentation capability DTO

`toPresentationCapabilityView` exposes bounded booleans for interface affordances, such as whether the user can see an internal-review button.

It is never accepted as server authority.

Every repository/use-case read or write re-evaluates a fresh server-side context.

## 16. Tests

Stage 2 tests cover:

- role bundles;
- explicit allow;
- explicit deny precedence independent of order;
- Viewer restrictions;
- token signing, hashing, tamper rejection, wrong secret, and weak secret;
- secure cookie serialization and parsing;
- hash-only issuance;
- TTL cap and revocation;
- active synthetic membership requirement;
- browser-controlled organization/role/capability headers ignored;
- missing, unknown, expired, revoked, inactive, and non-synthetic sessions;
- grant changes reflected on the next request;
- project assignment requirements;
- actual-cost assignment flag;
- supplier-offer scope;
- action assignment flag;
- Admin-only assignment bypass;
- equivalent public results for unavailable projects;
- Prisma query shape, hash-only writes, and relation-ownership corruption rejection.

## 17. Explicit non-goals

Stage 2 does not implement:

- project workspace read models or UI;
- comparable-project candidate discovery or scoring;
- financial aggregation or evidence claims;
- action transaction;
- production identity provider;
- organization onboarding;
- PostgreSQL RLS;
- arbitrary file ingestion;
- external integrations;
- AI/model routing;
- Vercel or domain changes;
- real customer data.

## 18. Known limitations and L2 requirements

Before real customer data:

- replace the synthetic issuer with a trusted production identity provider;
- enable PostgreSQL row-level security and tested policies;
- implement tenant onboarding/offboarding and session lifecycle controls;
- add session/audit monitoring and operator runbooks;
- implement CSRF policy for future state-changing browser routes;
- define idle/session rotation policy;
- implement data retention and account offboarding;
- add multi-tenant integration tests against the production adapter;
- perform security review and penetration testing for critical paths.

## 19. Exit criteria

Stage 2 is complete only when:

- all migrations apply to a clean PostgreSQL database;
- Prisma schema/client generation succeeds;
- Stage 1 and Stage 2 fixtures seed together;
- Stage 1 and Stage 2 SQL verification passes;
- server-only secret validation passes;
- signed session tests pass;
- capability/grant tests pass;
- authorization and non-disclosure tests pass;
- repository corruption/tenant-consistency tests pass;
- formatting, lint, TypeScript, unit tests, production build, and dependency audit pass on the exact reviewed commit;
- an independent security/architecture review records no critical blocker.
