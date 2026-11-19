# SB-034 hosted-preview session handoff validation

Date: 2026-11-19. Base: `b1aae67e02e19d47c6703d45872ffb8056c16ac3`. Candidate: the commit containing this report; its exact SHA and GitHub CI run are recorded in draft PR #35's publication receipt.

## Result

**Local validation PASS; independent security/source review PASS.** The missing browser-facing synthetic session handoff is implemented. The candidate can proceed to separately authorized isolated Vercel Preview setup after exact-head CI passes. No deployment, merge, DNS change or hosted-browser certification is claimed.

The implementation adds one bilingual entry form and a Settings logout control. It reuses `DemoSessionService`, the signed cookie, `SignedDemoIdentityContext`, existing database session revocation and the current RuntimeContext resolver. No schema, migration, dependency, fixture, authorization, tenant-repository, financial, evidence, action/idempotency, or deployment configuration change was made. The existing QA/admin personas remain outside the browser entry flow.

## Validation receipts

| Check | Result |
| --- | --- |
| Initial targeted session/security/localization/architecture run with real PostgreSQL handoff | 160 tests / 20 files PASS; followed by two additional delayed-body/stream-bound regressions in final suite |
| Final handoff unit tests | 56 PASS |
| Independent security regression | 110 tests / 11 files PASS |
| Final full deterministic suite | **777 tests / 75 files PASS, no skipped tests** |
| Formatting / lint / typecheck | PASS; one pre-existing `prisma.config.ts` anonymous-default-export lint warning, zero errors |
| Production build | PASS; both handoff POST routes and localized entry are included |
| Schema validation | PASS |
| Migrations | All **9** applied to a new empty database; nine completed records verified |
| Synthetic seed / reseed | Initial seed/verify and repeated migration/seed/verify PASS |
| Production dependency audit | **0 vulnerabilities** |
| All-dependency audit | 9 moderate development-tooling findings, 0 high/critical; unchanged lockfile |
| Secret/scope scan | Private database credential absent from changed files; no historical QA paths or core auth/tenant/schema/deployment paths changed |

Evidence: `evidence/session-handoff/local-check.log`, `migrations-reseed-verify.log`, `schema-validate.log`, `dependency-audit.json`. No private credentials or raw session cookies are recorded. Next.js regenerated `next-env.d.ts` during build; that generated-only edit was restored to the base content and is not part of the candidate.

The broader audit's moderate findings concern Vitest/mocker and minimatch through TypeScript ESLint tooling. They were not introduced by this patch. Tests ran in non-watch mode; no Vitest development server was exposed. Dependency upgrades are a separate follow-up, not silently added to this minimal handoff change. The existing CI production-audit threshold is unchanged.

## Required coverage mapping

1. Valid invitation invokes the existing issuer; both locale tests resolve its cookie through the unchanged trusted resolver and real PostgreSQL repository.
2. Missing, invalid, duplicated, expired or nearly expired invitation and disabled/unsupported environment deny issuance.
3. Tampered signature, wrong signing key, missing, expired and revoked sessions remain denied through the existing resolver and regressions.
4. Browser role, organization, membership, session ID and arbitrary return fields are rejected; untrusted role/org headers cannot select identity.
5. Cookie tests verify Secure, HttpOnly, SameSite=Lax, `__Host-`, Path=/, explicit expiry/Max-Age and no Domain. HTTP and localhost configuration cannot enable entry.
6. en and zh-TW entry, Home redirects, failure text, logout and budget exhaustion preserve the supported locale.
7. Redirect destinations are fixed locale paths; query secrets and external return destinations are rejected.
8. Logout revokes the current database session and clears the cookie. Reuse then fails. Repository errors do not falsely report revocation success.
9. Missing-session protected requests still resolve to no context; existing authorization/regression tests remain green.
10. Real PostgreSQL tests open Xinyi and deny the other fictional tenant despite manipulated identity headers; existing repository tenant-consistency tests remain green.
11. Body/response/log tests verify no reflected invitation, signing value, token or database error. Only the native HttpOnly Set-Cookie response carries the session credential. No browser identity selectors or server values are rendered.
12. Existing Stage 9 security, navigation, evidence, date, lineage, localization, transaction/idempotency and authorization suites pass unchanged in the full run.

Additional cases cover strict Origin/request-origin/Fetch Metadata checks for both mutations, unexpected method/content type, actual streamed-byte limits despite a false Content-Length, and invitation freshness after delayed request bytes. Rate limiting uses a constant-space per-process budget; platform limiting remains a hosting prerequisite.

## Isolation and cleanup

Environment: **SB034-HANDOFF-20261119**. New local PostgreSQL 17 container `stridebrain-sb034-handoff-20261119`, database `stridebrain_sb034_handoff_20261119`, loopback `127.0.0.1:54355`, fresh private owner credentials. Only this environment and its disposable test-created databases were used. No Stage 9, SB-032, SB-029, customer or remote database was connected to or changed.

The dedicated integration tests revoke and delete their own sessions. After all checks, remaining test sessions in the disposable database were revoked; active session count was **0**. The temporary container and its anonymous volume were stopped and removed. Private database credential files were deleted. No temporary application server was started, and no handoff signing credential was retained. Sanitized evidence and deterministic tests are retained for reproduction.

## Remaining hosting gates

Follow `session-handoff-preview-operations.md`: dedicate the project/repo/database/env; use fresh invitation/signing material and the exact HTTPS origin; configure edge rate limiting; protect credential logging; apply/verify all nine migrations and synthetic seed; record exact deployment SHA; rehearse normal Chrome and real iPhone Safari in both locales, including login, protected project access, evidence/action behavior, expiry and logout. Then run the existing first-user pilot script without teaching the product. These are hosted setup/rehearsal gates, not additional product redesign.
