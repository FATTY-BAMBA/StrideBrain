# SB-034 controlled preview session operations

Status: implementation reviewed; deployment is **not authorized** by this document. This supplements the SB-034 isolated preview plan and replaces its missing browser-handoff prerequisite. Use the exact accepted candidate SHA from PR #35, not the prior `b1aae67` UX-only candidate.

## Participant flow

Open the dedicated preview's `/en` or `/zh-TW` Home. An absent or invalid trusted session redirects to that locale's `/preview` screen. The participant enters the privately supplied invitation code and selects **Enter StrideBrain / 進入 StrideBrain**. A same-origin form POST to `/api/preview-session` issues the existing signed synthetic session and returns to the localized Home. There is no developer-tool, manual-cookie, localhost, account creation, email/password, role, or organization step.

The only pilot persona is the existing synthetic Horizon Atelier Mei Lin membership. Its current role, capabilities and project assignments remain server-resolved. The invitation does not grant arbitrary authority. Other QA personas are not exposed by this screen. The pilot shares a fictional persona and does not provide individual identity attribution or customer authentication.

Settings provides **Leave demo / 離開體驗**. Its same-origin POST to `/api/preview-session/logout` resolves the current signed session, revokes it in the existing session repository, and clears the browser cookie. Expired/disabled invitations and exhausted entry budgets do not prevent logout. A database revocation failure produces the neutral failure state, not a success receipt.

## Dedicated hosting boundary

Only create a new dedicated Vercel project connected to `FATTY-BAMBA/StrideBrain`, repository ID `1457854027`. Do not reuse another project/repository's `.vercel`, environment, integrations, domains, or deployment settings. Use Preview scope only, Node 24, the exact reviewed branch/SHA, and a new synthetic PostgreSQL 17 database with private credentials and verified TLS. Keep migration ownership separate from the least-privilege runtime role. No Stage 9/SB-029 data or customer data, no production promotion, no merge, and no `demo.primestrideai.com` or DNS cutover.

Before participant access, pin and record the dedicated HTTPS host, project/deployment IDs, repository, exact Git SHA and synthetic database identifier. No actual preview URL exists at publication. Share only a verified URL of the form `https://<dedicated-preview-host>/en` or `/zh-TW`; the placeholder is not a live address. All browser, application and database traffic must use hosted endpoints without an operator laptop or tunnel dependency.

## Preview-only server configuration

| Variable | Required value |
| --- | --- |
| `VERCEL_ENV` | Platform-provided `preview`; never spoof to enable production |
| `NEXT_PUBLIC_STRIDEBRAIN_ENV` | `preview` |
| `STRIDEBRAIN_DATA_MODE` | Explicit `DEMO_SYNTHETIC` |
| `STRIDEBRAIN_APP_ORIGIN` | Exact canonical HTTPS origin, no path/query/credentials; used consistently by participants and mutation checks |
| `DATABASE_URL` | Dedicated synthetic runtime database connection, secret, TLS, no localhost fallback |
| `STRIDEBRAIN_DEMO_SESSION_SECRET` | Fresh random signing secret, at least 32 random bytes, server only |
| `STRIDEBRAIN_PREVIEW_HANDOFF_ENABLED` | `true` only for the invited study window; default is false |
| `STRIDEBRAIN_PREVIEW_INVITE_SHA256` | Lowercase SHA-256 digest of a fresh 32-byte random base64url invitation (43 characters), server only |
| `STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT` | Explicit ISO timestamp with timezone; use a short study window, normally at most 24 hours |
| `NEXT_TELEMETRY_DISABLED` | `1` |

Generate invitation/signing material in a private operator process. Store only the invitation digest in Vercel. Deliver the raw invitation privately outside URLs, issue/PR bodies, recordings and logs. Never reuse test constants. Do not place invite material or signing values in `NEXT_PUBLIC_*`. Environment changes require a new verified deployment; do not assume they alter a running deployment immediately.

The application cannot verify the entropy of a configured digest. Operators must generate random invitations; human passwords are outside this contract. One code is reusable only within its controlled window. It is not a one-time token or an account password. Revoking one session does not invalidate the shared invitation.

## Session and request properties

- Existing opaque `sb1` HMAC token and hash-only database persistence. Organization, role and grants are absent from the browser token and loaded through existing RuntimeContext.
- Existing `__Host-stridebrain_demo_session`: Secure, HttpOnly, SameSite=Lax, Path=/, no Domain, explicit Expires and Max-Age. Session TTL is at most one hour and never later than invitation expiry; fewer than 60 remaining seconds denies entry.
- POST only; exact request-origin and Origin-header agreement with configured HTTPS origin. Fetch Metadata, if supplied, must be same-origin. SameSite supports ordinary top-level navigation and is not the sole CSRF defense.
- URL-encoded body capped at 1 KB of actual streamed bytes, strict supported locale and field allowlist, no duplicate fields or arbitrary return destination. Only `/en` or `/zh-TW` Home can follow successful entry.
- Neutral failures, empty POST response bodies, fixed localized redirects, no-store session responses. Raw requests, credentials, identity details and database errors are not logged by the handler.
- Constant-space **20 attempts/minute per function process** is a local backstop. Cold starts/instances do not share it; it is not a distributed limit. **Configure and verify edge/platform limiting on POST `/api/preview-session` before inviting participants.** A shared budget can temporarily deny a valid user. Keep logout outside the login rate-limit rule.

Cookie and origin review references: [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). The independent source review is in `session-handoff-security-review.md`.

## Migrations, seed and reseed

Use the accepted checkout and verify the connection host/database against the new preview allowlist before every operator command. With the separate owner connection, run `npm run db:migrate`, applying all nine unchanged migrations:

1. `0001_stridegraph_foundation`
2. `0002_financial_authority_invariants`
3. `0003_runtime_authorization`
4. `0004_authorization_tenant_links`
5. `0005_remove_legacy_membership_capabilities`
6. `0006_stage5_economics_enrichment`
7. `0007_stage6_comparison_persistence_scales`
8. `0008_stage8_internal_review`
9. `0009_stage9_economics_selection_lineage`

Then run `npm run db:seed` and `npm run db:verify`, repeat seed/verify once before admission, and record synthetic row counts and classifications. Retain the second fictional tenant for isolation checks. Generate the Prisma client before the production build. Do not run migrations or seeds on application startup or normal builds.

Reseeding removes synthetic pilot history. Stop traffic, revoke sessions, preserve sanitized study evidence and a private synthetic snapshot, then reseed only the dedicated preview database and reverify all invariants before reopening. Never point these commands at historical QA or remote customer databases.

## Hosted rehearsal and observation

Before the pilot, rehearse ordinary Chrome and real iPhone Safari over the exact HTTPS host, in both en and zh-TW. Confirm blank entry, invalid code, successful entry, secure cookie persistence, Xinyi, comparison, exact evidence, one explicitly confirmed internal review and idempotent retry, logout, revoked-cookie denial and expiry. Confirm direct protected routes without a valid session remain denied, foreign tenant selectors remain ineffective, and no credentials appear in URLs, rendered pages, analytics, logs or sanitized captures. Check mobile keyboard/viewport, native date/select and modal return behavior. Local source/database tests do not certify actual hosted browser behavior.

Start the 60-second comprehension timer at usable Home after entry. Give only the existing pilot plan's minimal context; do not teach the interface. Observe whether users can identify useful tasks, open Xinyi, discover comparison, explain the finding, inspect evidence, understand internal review and distinguish Knowledge from StrideBrain. Record friction and spontaneous time-saving comments using the existing observer sheet. Authentication setup friction is separately recorded; do not count moderator assistance as product comprehension.

Use platform status/latency and aggregate endpoint success/failure/rate-limit counts, database health, and existing internal-review outcome logs. Do not add body/cookie capture, raw invite telemetry, session tokens, signing values or participant personal information. Sanitize screenshots and log exports before publication. Check the deployed SHA and canonical URL before each study.

## Revocation, stop and rollback

On participant completion use Settings logout. Operators can revoke any remaining sessions with the existing server-side `DemoSessionService.revoke` under trusted private tooling. At study close, stop access, revoke all sessions issued to the shared pilot membership, disable issuance, and remove/rotate invitation material. Disabling admission or changing the invitation alone does not revoke existing sessions. A signing-secret rotation invalidates existing cookies but is an operator decision, not a browser control.

On a blocker, stop participant access and preserve sanitized evidence. Restore the dedicated preview alias to the previous accepted compatible deployment or take it offline; the first deployment has no accepted predecessor, so its rollback is offline. Record deployment IDs and a private synthetic database snapshot in advance. Code rollback does not undo database actions: restore/reseed only the isolated preview with traffic stopped. Do not undo migrations, touch Stage 9 data, or promote an untested build.
