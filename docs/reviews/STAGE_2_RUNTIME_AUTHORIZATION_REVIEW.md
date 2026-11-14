# Stage 2 Independent Review — Runtime Context and Authorization

**Scope:** PR #18  
**Issue:** #17  
**Review stance:** adversarial identity, session, tenant-boundary, authorization, and non-disclosure review  
**Verdict:** **PASS FOR MERGE ONLY WHEN THE EXACT REVIEW-BEARING HEAD PASSES THE FULL CI GATE**

## 1. Scope reviewed

This review covers only Stage 2:

- synthetic-demo session credential design;
- session persistence and revocation;
- server-derived `RuntimeContext`;
- role bundles;
- explicit capability grants and denials;
- project assignment policy;
- project/commercial/evidence/action authorization seams;
- public non-disclosing denials;
- Prisma repository ownership checks;
- Stage 2 fixture personas and invalid-session cases;
- migrations, SQL verification, and security tests.

The following remain explicitly outside this review:

- project workspace read model and UI;
- comparable-project candidate discovery or scoring;
- historical economics aggregation;
- evidence panel UI;
- action transaction;
- production identity provider;
- PostgreSQL row-level security rollout;
- connectors and external actions;
- arbitrary document ingestion;
- optional model synthesis;
- real customer data.

## 2. Product-stage boundary

**PASS.**

The implementation follows Stage 2 of the accepted sequence. It does not implement Stage 3 read models, Stage 4 comparison behavior, Stage 5 economics, or any product UI.

The authorization service exposes bounded seams for later stages without performing a consequential write.

## 3. Browser authority review

**PASS.**

The browser supplies only an opaque cookie credential.

The authoritative organization, membership, person, role, grants, assignments, locale, and data classification are loaded from current server-side records.

Tests explicitly supply attacker-controlled headers for organization, role, and capability and verify they have no effect.

No query parameter, route parameter, local storage value, model output, or presentation DTO can select the authoritative tenant or permission set.

## 4. Session credential review

**PASS FOR L1 SYNTHETIC DEMO.**

Credential properties:

- versioned opaque token shape;
- 128-bit random session ID;
- 256-bit random nonce;
- HMAC-SHA256 signature;
- timing-safe signature comparison;
- signing secret minimum of 32 bytes;
- documented placeholder secret rejected;
- strict token pattern and size bound;
- SHA-256 token hash for lookup;
- raw token never persisted.

Cookie properties:

- `__Host-` prefix;
- `Path=/`;
- `Secure`;
- `HttpOnly`;
- `SameSite=Lax`;
- no `Domain` attribute;
- explicit expiry and max-age from the same issuance clock;
- malformed, oversized, or duplicate cookies fail closed.

Session records enforce:

- supported locale;
- expiry after issuance;
- revocation not before issuance;
- membership and organization consistency;
- unique hash.

Resolution rejects:

- missing token;
- malformed token;
- tampered nonce/signature;
- wrong secret;
- unknown token hash;
- token/session ID mismatch;
- expired session;
- revoked session;
- inactive membership;
- inactive person;
- non-synthetic organization;
- corrupted cross-organization relations.

## 5. Secret handling review

**PASS.**

`STRIDEBRAIN_DEMO_SESSION_SECRET` is server-only and required for session operations.

The parser rejects:

- missing value;
- weak value;
- the documented example placeholder;
- any configuration that exposes the secret through a `NEXT_PUBLIC_` variable.

No fallback or committed secret exists.

## 6. Capability policy review

**PASS.**

Stage 2 removes the legacy `Membership.capabilities` array. There is now one authority source:

```text
reviewed role bundle + explicit MembershipCapabilityGrant rows
```

The accepted capability vocabulary is enforced in TypeScript and PostgreSQL.

Resolution is deterministic:

1. start with role bundle;
2. collect explicit denials;
3. add explicit allows only when not denied;
4. remove every denied capability.

`DENY` wins independent of record ordering.

Persona behavior is correct:

- Organization Admin receives the reviewed organization-wide v0.1 bundle;
- Project Manager / Estimator does not receive actual costs by role alone;
- Mei receives actual-cost capability through an explicit allow;
- Financial Reviewer receives actual capability but still requires project assignment;
- Viewer receives project comparison and non-sensitive evidence only, with explicit denials for actual costs and all internal-review writes.

## 7. Project assignment review

**PASS.**

Every non-admin project read requires an explicit project assignment.

Missing `assignedProjectIds` fails closed.

Actual-cost access requires both:

- effective `commercial:actual-read` capability;
- assignment `canReadActuals=true`.

Internal-review proposal/create/assignment seams require both:

- the relevant effective capability;
- assignment `canCreateAction=true`.

Missing project-assignment detail fails closed.

Organization Admin is the only v0.1 role permitted to bypass individual assignment.

The fixture gives the Financial Reviewer explicit assignments to all 29 Horizon projects rather than implementing a hidden role bypass.

## 8. Commercial and evidence scope review

**PASS.**

Commercial access remains distinct:

- quote requires `quote:read`;
- forecast requires `commercial:forecast-read`;
- supplier offer requires forecast-level access;
- actual requires actual capability plus project-level actual flag.

Evidence presentation scope is:

- `AUTHORIZED` only when actual access is permitted;
- `NON_SENSITIVE` when evidence is allowed but actual evidence is not;
- `NONE` otherwise.

The presentation capability DTO is documented and tested as an interface hint only. Repositories and use cases must authorize again.

Stage 2 does not yet retrieve evidence, so Stage 5 remains responsible for filtering complete evidence bundles before DTO/model construction.

## 9. Tenant-consistency review

**PASS FOR STAGE 2.**

PostgreSQL composite foreign keys enforce that authorization rows cannot bind a membership to a different organization:

- `MembershipCapabilityGrant(membershipId, organizationId)`;
- `DemoSession(membershipId, organizationId)`.

The Prisma adapter additionally rejects:

- session membership ID disagreement;
- membership organization disagreement;
- person organization disagreement;
- grant organization disagreement;
- assignment organization disagreement;
- unknown capability/effect values.

Fixture verification attempts invalid cross-organization session and grant inserts and requires database rejection.

### Residual limitation

Project assignments still rely on the Stage 1 organization-consistency verifier plus application contracts rather than composite project/membership tenant foreign keys across every table. PostgreSQL RLS and broader composite-tenant enforcement remain mandatory before L2 real-data use.

## 10. Non-disclosure review

**PASS.**

Public authorization results expose only:

- `PROJECT_UNAVAILABLE`;
- `EVIDENCE_UNAVAILABLE`;
- `ACTION_NOT_AUTHORIZED`.

They do not expose:

- hidden organization/project IDs;
- record names;
- whether a record exists;
- denied capability;
- internal reason;
- candidate/evidence counts.

Unauthorized and nonexistent project IDs map to equivalent public results.

The organization-scoped repository returns the same neutral absence for inaccessible and absent records.

## 11. Persistence and fixture review

**PASS.**

Stage 2 migrations add only:

- explicit capability grants/denials;
- hash-only demo sessions;
- constraints and composite tenant links;
- removal of the legacy capability array.

The Stage 2 fixture adds:

- Mei actual-cost allow;
- Viewer actual/action denies;
- Financial Reviewer assignments;
- one expired session record;
- one revoked session record.

It does not seed a valid raw credential.

The fixture remains synthetic and isolated from real-customer use.

## 12. Security findings resolved during review

### 12.1 Legacy duplicate capability authority

**Finding:** Stage 1 retained a `Membership.capabilities` array that could compete with the new grant policy.

**Resolution:** the column, schema field, and fixture values were removed. Role bundle plus explicit grants is the only authority source.

### 12.2 Actual/action access could rely only on membership in the assigned-project set

**Finding:** project assignment existed, but project-level actual/action flags also need to be enforced.

**Resolution:** actual reads require `canReadActuals=true`; action seams require `canCreateAction=true`; missing detail fails closed.

### 12.3 Supplier offer scope was initially equivalent to quote scope

**Finding:** supplier offers can contain cost-sensitive commercial information.

**Resolution:** supplier offers now require forecast-level access.

### 12.4 Duplicate cookies could be resolved ambiguously

**Finding:** a request containing the session cookie twice could select the first value.

**Resolution:** duplicate named cookies now fail closed.

### 12.5 Documented placeholder secret passed length validation

**Finding:** the example secret was long enough to meet the byte check.

**Resolution:** the exact documented placeholder is rejected.

### 12.6 Adapter trusted relation ownership solely to database joins

**Finding:** composite constraints protect new writes, but corrupted/manual data should still fail closed at the adapter boundary.

**Resolution:** membership/person/grant/assignment organization consistency is checked in the Prisma adapter and covered by tests.

## 13. Required exact-head gate

The PR is merge-eligible only when the exact review-bearing head passes one complete run containing:

1. locked dependency installation;
2. Prisma schema validation;
3. Prisma client generation;
4. all committed Stage 1 and Stage 2 migrations;
5. Horizon Atelier and Stage 2 fixture seed;
6. Stage 1 authority/financial verification;
7. Stage 1 relationship/evidence verification;
8. Stage 2 session/grant/tenant verification;
9. formatting;
10. lint;
11. TypeScript checking;
12. all unit, repository, authorization, and security tests;
13. Next.js production build;
14. high-severity production dependency audit.

No cancelled, superseded, or earlier commit run is sufficient.

## 14. Remaining limitations and L2 blockers

These do not block Stage 2 merge but remain explicit:

- synthetic demo identity only;
- no production identity provider;
- no PostgreSQL row-level security;
- no organization onboarding/offboarding;
- no idle timeout or token rotation policy;
- no operator session console;
- no session issuance/revocation audit events yet;
- no CSRF implementation because no state-changing browser route exists yet;
- no production session monitoring or incident runbook;
- no real-customer data;
- no penetration test;
- no Stage 3+ repository/use-case integration.

Before any state-changing route ships, CSRF protections and authenticated audit events must be added to that stage's contract.

## 15. Final recommendation

**Approve and merge only after the exact current head passes the full Stage 2 CI gate.**

After merge, proceed to Stage 3 as a separate bounded PR implementing the authorized Project Workspace read model. Do not begin comparable-project scoring or comparison UI until the trusted context and workspace read contracts are merged and verified.
