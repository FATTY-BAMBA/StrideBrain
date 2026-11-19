# Current S9-F05 repair checkpoint — 20261119T040319Z

Stage 9 is **IN_QA**. Verdict: **PASS_SCOPED_REPAIR; manual gates pending**. S9-F05 is **closed for tested scope** and M-05 is **PASS**. No unresolved observed P0/P1/required-path P2 remains. This is not pilot/release acceptance.

Local repair `0b442bf23433fb7c288c66cb3b36329e1cb8df3d`, direct parent `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`. Six product files and six regression-test files changed; no schema/migration, dependency, authorization, tenant-isolation, evidence-authority, deployment or unrelated feature change. BUILD_ID `tJ3t0INa7eLqU4wZug1oZ`. The commit is local only; exact-head GitHub CI has not run. Historical published CI 44278010987 PASS applies only to `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`.

Independent repair/source reviews PASS. Full deterministic suite **686 tests / 71 files PASS**; localization **37 / 5 PASS**; independent review tests **185 / 5 PASS** in America/Los_Angeles. Format, lint, strict TypeScript, Prisma validate/generate, nine clean migrations, two seed/SQL rounds, PostgreSQL adversarial tests and production build PASS. Production audit: **0 vulnerabilities**. One pre-existing lint warning retained. Counts overlap and must not be added.

Live production Chrome verified automatic bounds refresh in both locales across Taipei midnight, with route, proposal, draft and focus preserved. English: `2028-02-28..2029-02-27` → `2028-02-29..2029-02-28`; zh-TW: `2028-02-29..2029-02-28` → `2028-03-01..2029-03-01`. Four client-invalid and six actual HTTP-invalid attempts made zero business writes. Four valid new-today/+365 actions, audits and receipts were persisted and retained.

| Gate                        | Current disposition                                                                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-05 / S9-F05               | PASS / closed for tested scope                                                                                                                                             |
| M-02                        | iPhone16,1, iOS 26.5 detected and available over USB; Safari NOT_RUN; phone-trusted private HTTPS and same-origin session access unvalidated                               |
| M-07                        | Human review pending by user instruction; 89 historical + 9 new Chinese screenshots, three new date-policy strings; incomplete conditional-state coverage remains explicit |
| M-01                        | DEFERRED_BEFORE_BROADER_RELEASE; no speech PASS                                                                                                                            |
| M-06                        | Prior DOM/focus evidence retained; speech DEFERRED_BEFORE_BROADER_RELEASE                                                                                                  |
| Security / tenant isolation | NOT_RUN; resume after M-02/M-07 prerequisites                                                                                                                              |
| Performance / query plans   | NOT_RUN; follows security                                                                                                                                                  |
| Deployment-smoke readiness  | NOT_READY; no deployment authorized or performed                                                                                                                           |

Cleanup PASS: four run-owned sessions revoked, pending bootstrap files absent, owned app/operator stopped, fixture rows and four immutable-history guards unchanged. Supplemental post-QA pristine-fixture SQL invocation failed its exact-two-session assertion because six rows were retained; the failure is preserved and qualified by exact row/guard/session evidence, not relabeled PASS. All clean pre-QA SQL rounds passed.

[Repair report](evidence/s9-f05-repair/20261119T040319Z/REPORT.md), [date evidence](evidence/s9-f05-repair/20261119T040319Z/M-05-results.json), [SQL qualification](evidence/s9-f05-repair/20261119T040319Z/operator/closure-sql-qualification.md), [human review package](evidence/s9-f05-repair/20261119T040319Z/human-review/M-07-review-sheet.md). Historical failed run `20261119T032345Z` remains FAIL/REVISE. Task records and new evidence are local and uncommitted. No push, merge, deployment, DNS or Vercel change.

---

# Historical checkpoints below

The following text is retained as previously recorded. Its then-current heads, statuses and gates are historical, superseded only where explicitly stated above.

# Stage 9 deployment-smoke readiness

Current result: **BLOCKED / NOT_DEPLOYED / NOT_AUTHORIZED_TO_DEPLOY**. A successful local build does not close the observed date defect or the remaining pilot gates. User target is a controlled 3–5-person synthetic-data pilot; VoiceOver and M-06 speech are DEFERRED_BEFORE_BROADER_RELEASE, not passed.

## Exact candidate and artifacts

- Branch `build/sb-032-stage9-quality-hardening`; candidate `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`. No new commit/source modification.
- Recorded exact-head CI 44278010987 PASS remains the published CI record; no fresh CI was requested or relabeled.
- M-05 tested production BUILD_ID `jZBGrkhs4Ok9XriINHgub`.
- Separate clean-install production build `VWVPZBkA5qyo-jz64t2C1`: build and unauthenticated bilingual local startup smoke PASS. It has not received the complete browser acceptance matrix.
- Actual preview project/environment, deployment ID, URL, alias and deployment SHA: **NOT_CREATED / NOT_VERIFIED**.

## Local technical preflight

| Requirement                                | Current evidence                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean locked dependency install            | PASS in isolated temporary copy; product worktree untouched. Optional fsevents install-script warning retained in log; production build/start succeeded.                               |
| Prisma generation                          | PASS.                                                                                                                                                                                  |
| Nine clean migrations                      | PASS, 0001–0009; all database checksums match candidate SQL.                                                                                                                           |
| Repeated synthetic seed and SQL invariants | PASS twice before browser testing on a new isolated database. Retained history was never reseeded.                                                                                     |
| Migration0009 forward behavior             | Clean application PASS; prior approved upgrade/adversarial lineage proof from run20261118T084208Z retained, not represented as a new upgrade rehearsal.                                |
| Production build/start                     | PASS; temporary ports bound to loopback and stopped after testing.                                                                                                                     |
| Production dependency audit                | Zero vulnerabilities. This is not the unrun tenant-isolation security wave.                                                                                                            |
| Application filesystem portability         | Source inspection found no node:fs/readFile/local private-path dependency in product src. Private QA helpers are not deployment artifacts. Actual hosted smoke remains necessary.      |
| Localhost assumptions                      | Only server-env.ts fallback origin found in product src. Hosted configuration must supply an explicit HTTPS origin; default parse behavior alone is not production-readiness evidence. |
| Functional/date acceptance                 | BLOCKED: S9-F05 requires repair and retest.                                                                                                                                            |
| Security/performance/recovery              | NOT_RUN or incomplete; conditional waves remain blocked.                                                                                                                               |

Evidence: [preflight](evidence/pilot-readiness/20261119T032345Z/deployment-preflight.json), [command log](evidence/pilot-readiness/20261119T032345Z/commands.jsonl), [migration checksums](evidence/pilot-readiness/20261119T032345Z/operator/migration-source-verification.json), [audit](evidence/pilot-readiness/20261119T032345Z/production-audit-summary.json).

## Runtime environment contract

Required server-only values: `DATABASE_URL`, `STRIDEBRAIN_DEMO_SESSION_SECRET`, `STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC`, explicit `STRIDEBRAIN_APP_ORIGIN=https://<exact-preview-host>`. Set `NEXT_PUBLIC_STRIDEBRAIN_ENV=preview`; Node24 production runtime; telemetry preference optional. Document names/presence only, never values of credentials. Reject omitted/localhost origin in the later release preflight even though the generic environment parser allows a development default. No live tenant data, external communication or AI/provider capability is enabled.

The session cookie remains `__Host-`, HttpOnly, Secure, Path=/, SameSite=Lax, with no Domain attribute. The production confirmation guard requires configured Origin, actual Request URL origin and non-cross-site request context to agree. Test the actual hosted reverse-proxy/HTTPS behavior; forwarding a Host header or enabling CORS is not a substitute.

The existing local QA bootstrap helper is deliberately restricted to localhost. A separately reviewed, least-privilege, one-use session delivery method for the exact preview origin is still required; do not expose the local operator or remove its guard merely to make hosted login work. No hosted session issuer has been installed/validated.

## Remaining prerequisites for isolated preview

1. Review and repair S9-F05; deterministic regressions and independent scoped M-05 retest.
2. Safe physical iPhone access and testing; complete human Taiwan zh-TW review. Android absence alone is not a controlled-pilot blocker under the user decision.
3. Conditional security/tenant isolation PASS; performance/query-plan evidence; retained-history containment and disposable rollback/reseed rehearsal.
4. Review preview project isolation, synthetic DB, runtime role, secrets, exact HTTPS origin and one-use session delivery. Obtain separate deployment authorization.
5. Deploy only the then-approved exact candidate; record immutable deployment ID/URL, SHA/BUILD_ID, migrations and fixture attestation; execute actual hosted bilingual/auth/action/receipt smoke and human pilot approval.

No Vercel project, DNS, `demo.primestrideai.com`, alias or deployment was changed. PR #33 was not marked ready or merged. No hosted-readiness PASS is claimed.
