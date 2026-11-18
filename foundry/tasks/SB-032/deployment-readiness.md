# Stage 9 deployment-readiness contract

Status: NOT_DEPLOYED / NOT_AUTHORIZED_THIS_PHASE. No Vercel project, environment, DNS, alias or deployment is changed. This contract prepares later work; it is not deployed smoke evidence or release approval.

## Candidate identity

- Planning source: `fec8830398f213e19879eae23e9720ad8563d7b4` on `build/sb-032-stage9-quality-hardening`.
- Current Stage 9 BUILD_ID / exact-head validation / deployment ID / URL: not yet produced or verified.
- Historical Stage 8 product CI `44059619525` PASS applies to `f67edb3188c51704acac4465c0a72fca146c6d3f`; it is not relabeled as CI for the merge baseline.
- Before release freeze exact candidate SHA/tree, lockfile, migrations, CI run and production BUILD_ID. Any later product delta needs scoped independent review and appropriate revalidation; no stale exact-head claims.

## Locally executable preflight

Clean locked install, Prisma validate/generate, eight clean migrations, repeated disposable seed/SQL invariants, format/lint/types/full tests/localization/PostgreSQL, production build and audit, then owned local production-start smoke. Check browser→API→DB read/write/receipt and unauthorized response behavior, restart/refresh/deep links, AI/provider disabled, static assets and trace/error visibility without secret payloads.

Required runtime configuration inventory: server-only database connection, server-only demo-session signing secret, `STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC`, explicit public environment and explicit `STRIDEBRAIN_APP_ORIGIN`; telemetry preference as appropriate. Record names/presence only. Use `src/lib/env/server-env.ts`, `demo-session-secret.ts` and environment tests to verify accepted/rejected inputs. Reject release configuration with omitted/localhost origin even though development defaults allow it. Validate intended HTTPS origin and session cookie/CSRF behavior in actual hosted smoke later; a config parse or local build alone cannot establish it.

Audit client bundles, responses, logs and evidence for secrets, tokens, cookies, raw storage URLs, DB URLs and private/personal paths. Runtime and bootstrap artifacts never enter a commit. Distinguish synthetic fixture constants from live secrets and retain reasoned scan results.

## Prepared isolated-preview contract — execution deferred

When explicitly authorized later, choose a dedicated StrideBrain preview project/environment, isolated synthetic database, separate session signing secret, exact candidate commit, intended HTTPS origin and bounded operator access. Confirm repository/build/runtime settings, environment scope, migration/seed order, least-privilege runtime and monitoring against the then-current platform configuration before any operation. No existing deployment/project settings are assumed correct.

The later operator must record project/environment identity, immutable deployment ID/URL, SHA/BUILD_ID, exact-head CI, database migration/fixture attestation, bilingual hero/security/accessibility smoke, timing/error logs, write containment, tested compatible rollback and human release approval. No automatic promotion, demo-domain alias, live DNS, real tenant data, external communications or AI is included. `demo.primestrideai.com` cutover requires its own approval.

## Release gate table

| Gate | Planning status |
| --- | --- |
| Accepted Stage 9 contract | Independent contract review PASS; readiness for QA execution only |
| Exact-candidate deterministic + local production checks | NOT_RUN |
| Bilingual/browser/visual/eval/security/performance | NOT_RUN |
| M-01/M-02/M-06/M-07 human/device pre-demo gates | NOT_VERIFIED_MANUAL_REQUIRED |
| M-05 date-boundary Stage 9 evidence | NOT_VERIFIED_MANUAL_REQUIRED |
| Rollback/reseed rehearsal | NOT_RUN |
| Actual preview identity and deployed smoke | NOT_AUTHORIZED_THIS_PHASE; remains an exit gap |
| Independent release synthesis and human release review | PENDING |

The no-deploy instruction is respected without weakening Stage 9's exact-preview exit criterion. Planning/local readiness may progress; Stage 9 final acceptance and controlled-demo release stay pending until the authorized preview and human gates are evidenced. Do not mark a PR ready, merge, claim L2/pilot readiness or treat this document as permission to deploy.
