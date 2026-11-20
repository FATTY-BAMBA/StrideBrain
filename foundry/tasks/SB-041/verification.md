# SB-041 verification

Implementation delivered as A (`1849b46`), B (`3519e72`), then C (`cb64094`). Subsequent refinements preserve that sequence. Base: `0266174` on `main`. Runtime: Node 24.22.3, PostgreSQL 17, synthetic data only.

## Verified locally

- `npm run db:validate`: valid schema.
- `npm run db:reset-fixture`: migrations, fixture seeds, tenant/authority invariants and `verify-jobs.sql` passed on an isolated SB-041 database.
- `npm run check`: **82 files, 868 tests passed, zero skipped**, then production build passed. One pre-existing lint warning remains in `prisma.config.ts`; no lint errors.
- The populated-migration regression checks that the additive Jobs migration preserves all pre-existing Project fields and initializes the new category array to empty. All 23 Stage-9 lineage/upgrade assertions pass.
- PostgreSQL tests prove new/existing client handling, reviewed Project/ProjectScope creation, creator assignment, pre-quote comparison, same-transaction audit, creation/stage rollback on forced audit failure, duplicate/concurrent business keys, stage concurrency, idempotency, explicit capability denial, Viewer denial, and foreign/unassigned/deleted/missing job denial.
- Tests exercise the server pages and direct server actions, including forged browser organization/membership/role fields, safe failures, fixed taxonomies, bounded input, field errors and localization parity.
- Chrome against the production build: English desktop (1440×1000) and Traditional Chinese mobile (390×844) forms show field errors and preserve entered values/selections after an invalid submission. Creating through each screen persists the job and shows it under Quote review / 報價審查.
- A screen-created job produces **six ranked candidates** through the comparison screen before any quote exists. Missing quote/financial values remain unavailable; no quote or financial record is invented.
- The stage control moves the job from Quote review to Design. Viewer screens hide write controls; direct replay of the actual creation request is denied to a Viewer. Viewer and foreign-organization replay of the actual stage request is denied. Foreign lists do not expose the new job. Duplicate creation and stage retry produce no extra Project or AuditEvent rows.
- `src/lib/env/server-env.ts` is unchanged. No model call, quote issuing, status completion, financial reconciliation or residential type was added.

## Browser evidence

`evidence/browser/results.json` contains the checks and screenshots. Screenshots contain synthetic data only. Temporary signed credentials and the test signing secret were kept outside the repository. All three browser sessions were revoked, credential material removed, and the local server/container stopped after verification; the isolated synthetic database is preserved.

The browser emitted one 404 console message; the new pages and actions had no page exceptions or failed flow requests. A focused network diagnostic identified the missing resource as the existing `/favicon.ico` route. This is not claimed as a clean console run.

## Not verified

- Hosted preview acceptance on the final PR commit. A successful local build is not a hosted release pass.
- Safari/Firefox, assistive-technology testing, and a measured performance/accessibility audit.
- Real customer data or production identity/operation, which remain out of scope and gated.

## Review and rollout notes

Apply `20261121060000_project_jobs` before serving this revision; the new Prisma selections require the additive columns. Keep hosted acceptance pending until the intended preview database has this migration. Existing quotes remain the source for commercial categories once present; the new field supports jobs before their first quote.

Stages track progress only: selecting Complete does not mark a project historically completed, set a completion date, reconcile costs, issue quotes or create work items. Entered job/client names are retained as entered in both display fields, with no invented translation. Current supported intake is commercial retail, m² and TWD.

No new baseline fixture jobs were needed: the service and browser tests create jobs through the same application path. Existing synthetic clients and historical projects are reused for comparison checks.
