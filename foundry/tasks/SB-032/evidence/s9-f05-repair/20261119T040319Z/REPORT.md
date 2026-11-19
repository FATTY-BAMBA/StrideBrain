# Current S9-F05 repair checkpoint — 20261119T040319Z

Stage 9 is **IN_QA**. Verdict: **PASS_SCOPED_REPAIR; manual gates pending**. S9-F05 is **closed for tested scope** and M-05 is **PASS**. No unresolved observed P0/P1/required-path P2 remains. This is not pilot/release acceptance.

Local repair `0b442bf23433fb7c288c66cb3b36329e1cb8df3d`, direct parent `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`. Six product files and six regression-test files changed; no schema/migration, dependency, authorization, tenant-isolation, evidence-authority, deployment or unrelated feature change. BUILD_ID `tJ3t0INa7eLqU4wZug1oZ`. The commit is local only; exact-head GitHub CI has not run. Historical published CI 44278010987 PASS applies only to `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`.

Independent repair, source and evidence reviews PASS. All 19 screenshots visually inspected; complete text and known-secret sanitization PASS. Full deterministic suite **686 tests / 71 files PASS**; localization **37 / 5 PASS**; independent review tests **185 / 5 PASS** in America/Los_Angeles. Format, lint, strict TypeScript, Prisma validate/generate, nine clean migrations, two seed/SQL rounds, PostgreSQL adversarial tests and production build PASS. Production audit: **0 vulnerabilities**. One pre-existing lint warning retained. Counts overlap and must not be added.

Live production Chrome verified automatic bounds refresh in both locales across Taipei midnight, with route, proposal, draft and focus preserved. English: `2028-02-28..2029-02-27` → `2028-02-29..2029-02-28`; zh-TW: `2028-02-29..2029-02-28` → `2028-03-01..2029-03-01`. Four client-invalid and six actual HTTP-invalid attempts made zero business writes. Four valid new-today/+365 actions, audits and receipts were persisted and retained.

| Gate | Current disposition |
| --- | --- |
| M-05 / S9-F05 | PASS / closed for tested scope |
| M-02 | iPhone16,1, iOS 26.5 detected and available over USB; Safari NOT_RUN; phone-trusted private HTTPS and same-origin session access unvalidated |
| M-07 | Human review pending by user instruction; 89 historical + 9 new Chinese screenshots, three new date-policy strings; incomplete conditional-state coverage remains explicit |
| M-01 | DEFERRED_BEFORE_BROADER_RELEASE; no speech PASS |
| M-06 | Prior DOM/focus evidence retained; speech DEFERRED_BEFORE_BROADER_RELEASE |
| Security / tenant isolation | NOT_RUN; resume after M-02/M-07 prerequisites |
| Performance / query plans | NOT_RUN; follows security |
| Deployment-smoke readiness | NOT_READY; no deployment authorized or performed |

Cleanup PASS: four run-owned sessions revoked, pending bootstrap files absent, owned app/operator stopped, fixture rows and four immutable-history guards unchanged. Supplemental post-QA pristine-fixture SQL invocation failed its exact-two-session assertion because six rows were retained; the failure is preserved and qualified by exact row/guard/session evidence, not relabeled PASS. All clean pre-QA SQL rounds passed.

[Repair report](REPORT.md), [date evidence](M-05-results.json), [SQL qualification](operator/closure-sql-qualification.md), [human review package](human-review/M-07-review-sheet.md). Historical failed run `20261119T032345Z` remains FAIL/REVISE. Task records and new evidence are local and uncommitted. No push, merge, deployment, DNS or Vercel change.

