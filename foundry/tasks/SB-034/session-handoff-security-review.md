# SB-034 controlled preview handoff — independent security/source review

Date: 2026-11-19
Reviewer: independent `sb034_handoff_security_review` agent
Base candidate: `b1aae67e02e19d47c6703d45872ffb8056c16ac3`
Verdict: **PASS for the scoped source change, subject to the hosted prerequisites below.**

This review covers the new controlled synthetic preview handoff, its integration with Home and Settings, the bilingual entry components, and related tests. It does not certify a deployed environment or general customer authentication. No deployment, DNS change, merge, database operation, or service startup was performed by this reviewer.

## Scope inspected

- `src/modules/preview-session/{config,handoff,copy}.ts`
- `src/lib/server/preview-session.ts`
- `src/app/api/preview-session/route.ts` and its `logout/route.ts`
- `src/app/[locale]/preview/page.tsx`, Home, and Settings integration
- `src/components/demo-value/preview-entry.tsx` and its styles
- `.env.example`
- `tests/preview-session/` and `tests/localization/preview-session.test.ts`
- Existing session issuer, token signing and verification, cookie serialization, RuntimeContext resolution, Prisma session repository, authorization, and their regression tests

The existing issuer, signing format, cookie serializer, RuntimeContext, authorization service, Prisma tenant consistency checks, schema, migrations, fixtures, dependencies, deployment configuration, and historical evidence are unchanged by the reviewed source change.

## Security assessment

1. **Explicit environment boundary.** The handoff requires Vercel Preview, the explicit preview public environment, explicit synthetic data mode, and a pinned HTTPS origin. Issuance additionally requires the enabled flag, a valid server-side invitation digest, and sufficient remaining invitation validity. No localhost fallback enables issuance.
2. **One server-controlled persona.** Browser input contains only the invitation and a supported locale. Extra or duplicate body keys, role/organization/membership selectors, return destinations, and query parameters are rejected. The existing issuer's membership lookup is wrapped with exact checks for the approved synthetic membership, organization, and person. Current role, grants, and assignments remain database-derived through the existing resolver.
3. **Existing trusted session reused.** The implementation invokes `DemoSessionService`; it does not introduce another credential or authorization system. The opaque token retains its existing HMAC signature, random session identifier and nonce, hashed database persistence, expiry, and revocation behavior.
4. **Cookie properties preserved.** The existing `__Host-` cookie is Secure, HttpOnly, SameSite=Lax, Path=/, with explicit expiry and Max-Age and no Domain attribute. Lax supports ordinary top-level hosted navigation; exact Origin checks, rather than SameSite alone, protect mutations.
5. **Bounded lifetime.** Sessions last no more than one hour and do not extend beyond invitation expiry. Invitations with under 60 seconds remaining are refused, respecting the existing issuer's minimum TTL. A single clock captured after bounded form reading is reused for the expiry check and issuance.
6. **CSRF and transport.** Only POST handlers are exposed. Both entry and logout require the configured HTTPS request origin and an exact Origin header. Supplied Fetch Metadata must indicate same-origin; older clients without that header still require the exact Origin. URL queries and fragments are rejected. Redirects are fixed localized application paths.
7. **Bounded request processing.** Only URL-encoded forms are accepted. Actual streamed bodies are capped at 1 KB before parsing. No invitation is read from query parameters, persisted in URLs, reflected in response content, or logged by the handoff. The secret comparison uses SHA-256 and a constant-time digest comparison; operator-generated invitations must be random, not human passwords.
8. **Logout and revocation.** Logout resolves the signed current session and revokes that session only; browser-selected session IDs are rejected. Valid logout remains available after invitation expiry, disabled issuance, or exhausted entry budget. A failed revocation does not falsely clear the cookie or return a success destination. Already invalid sessions receive cookie clearing without gaining authority.
9. **Neutral failures.** Failures produce a fixed empty response and a generic localized entry state, with no identity or database error disclosure. Session responses are no-store. Valid zh-TW submissions preserve locale, including exhausted-budget failures.
10. **Authorization remains authoritative.** Issuing a session does not bypass protected-route resolution. Existing checks still reject absent, invalidly signed, expired, revoked, inactive, and non-synthetic sessions. Existing Prisma checks reject inconsistent organization relationships, grants, and assignments.

No reproducible P0, P1, or P2 security defect remains in the reviewed source.

## Findings resolved during review

- The initial exhausted-attempt response defaulted a valid zh-TW submission to English. The final handler reads the bounded form and validates locale before returning the neutral budget failure; the targeted test includes zh-TW exhaustion.
- The initial handler captured time before awaiting form bytes. Delayed requests completing out of order could feed old timestamps into the process-local attempt budget. The final handler captures time after bounded form reading, and uses that same clock for invitation expiry and issuance.
- The design-stage invitation-expiry concern was addressed without changing the existing issuer: reject validity below its 60-second minimum and cap the issued TTL using the shared clock.

## Independent verification

Executed independently against the corrected source with `DATABASE_URL` removed from the test process:

```text
vitest run tests/preview-session/handoff.test.ts
  tests/localization/preview-session.test.ts tests/runtime-context
  tests/repositories/prisma-demo-session-repository.test.ts
  tests/authorization tests/env

11 test files passed; 110 tests passed.
```

This final rerun includes delayed-stream invitation-expiry coverage, actual-byte limits despite a misleading Content-Length, and zh-TW budget exhaustion. The final Home integration treats resolver failures as denied entry and redirects to the neutral preview screen; it does not grant a fallback identity.

The reviewer also inspected the real-PostgreSQL handoff tests: they create an opaque session, resolve Xinyi using the existing workspace service, reject access to another tenant, verify revocation, and delete their temporary sessions. Database execution, all nine migrations, seed/reseed verification, the full deterministic suite, production build, dependency audit, and exact-head CI are separate validation receipts owned by the implementing agent; this review does not substitute for their completion.

## Required hosted prerequisites and remaining limits

- Use a dedicated preview project and isolated synthetic database, credentials, signing secret, and environment variables. Apply and verify all nine existing migrations and the synthetic seed before inviting users. Do not reuse Stage 9 QA or customer environments.
- Pin `STRIDEBRAIN_APP_ORIGIN` to the actual HTTPS preview host used by pilot users. Confirm the hosted request URL and browser Origin match it. Keep issuance disabled outside Vercel Preview.
- Generate a fresh random 32-byte base64url invitation, keep only its SHA-256 digest in server configuration, and set an explicit expiry. Deliver the invitation outside URLs and logs. Use a separate random session signing secret. Do not use the deliberately public test values.
- Configure and verify an edge/platform rate limit on the handoff POST route before exposing the pilot. The source's constant-space **20 attempts per minute per process** is a backstop, not a distributed rate limiter: instances and cold starts have independent budgets, and the shared budget can temporarily deny valid participants. Do not describe it as deployment-wide protection.
- Keep request bodies, invitation values, cookies, and signing credentials out of application, proxy, analytics, and support logs. Monitoring may record aggregate success/failure/rate-limit counts without credential material.
- Rehearse the actual hosted HTTPS path in ordinary Chrome and iPhone Safari: en and zh-TW entry, cookie persistence, protected project access, evidence/action authorization, logout, revoked-cookie denial, expiry, and neutral failure. Source tests and a local synthetic database do not certify browser or platform behavior.
- The pilot intentionally shares one synthetic persona. It does not provide individual identity attribution, customer account lifecycle, MFA, or production authentication. At pilot close revoke its sessions, disable issuance, and rotate or remove the invitation material. Merely disabling entry does not revoke already-issued sessions; their existing expiry/revocation controls remain authoritative.
- Publish only the independently reviewed candidate after required full validation and exact-head CI. No deployment, merge, DNS cutover, or cross-project configuration reuse is authorized by this report.

The candidate is suitable to continue toward an isolated preview once those validation and hosting gates are satisfied. This is source approval, not confirmation that a hosted preview already exists or is operational.
