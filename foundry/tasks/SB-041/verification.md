# SB-041 verification

One draft pull request: [#43](https://github.com/FATTY-BAMBA/StrideBrain/pull/43), branch `build/sb-041-jobs`, base `0266174` on `main`. Initial delivery followed A (`1849b46`), B (`3519e72`), C (`cb64094`); this revision applies the requested corrections in the same PR. Runtime: Node 24.22.3, PostgreSQL 17, synthetic data only.

## Short-reference follow-up

The default is now generated on the server as `J-<YYMM>-<4 characters>`, using the UTC year/month and independent Node crypto `randomInt` selections from `23456789ABCDEFGHJKMNPQRSTUVWXYZ`. The suffix excludes 0, O, 1, I and L. References remain editable suggestions; existing tenant-scoped uniqueness, duplicate field errors and idempotent creation are unchanged. Existing saved references are not renamed.

Automated coverage checks the example format, all suffix characters, zero padding, month/year rollover, UTC boundaries, the server’s current date, editable server-rendered inputs in both languages, and the existing duplicate response for an edited short reference.

An additional browser assertion exposed native form reset clearing selects/checkboxes after a rejected action. The form now prevents that reset so the user can correct a duplicate reference with their selections intact. The diagnostic failure is retained under `evidence/short-reference/diagnostic/`; the final browser report records the retest.

Final follow-up verification:

- `npm run check`: **84 test files, 897 tests passed, zero skipped**, and the production build passed. Formatting, lint and typecheck passed; the existing `prisma.config.ts` lint warning remains.
- Chrome production build in English desktop (1440×1000) and Traditional Chinese mobile (390×844): default values `J-2611-SN7Q` and `J-2611-MAWW` were present in server HTML, editable, persisted unchanged and appeared in Quote review. A deliberate collision showed the existing translated field error without another project insert. Reference, subtype, all seven scope selections and existing client remained intact; correcting the reference allowed creation.
- Screenshots were visually inspected. No page exceptions; the only console error was the existing `/favicon.ico` 404. One temporary browser session was revoked and its credentials deleted; the local server and isolated database container were stopped.

Current logs, final browser results, screenshots and cleanup evidence are in `evidence/short-reference/`. The broader comparison/stage browser flows below were last exercised at `7661541`; their automated regression tests were rerun in this follow-up. Hosted preview and other unverified areas remain listed below.

## Previous revision verification (7661541)

- `npm run check`: **83 test files, 887 tests passed, zero skipped**, followed by a successful production build. Formatting, lint and TypeScript checks passed. One existing `prisma.config.ts` lint warning remains; no lint errors.
- PostgreSQL suites migrate and seed isolated databases and run fixture SQL invariants. The populated-migration regression preserves existing Project rows; all 23 Stage-9 lineage/upgrade assertions passed. No additional schema migration was needed for this revision.
- All five requested feature data-mode gates were removed. Capability checks remain; creation still writes `dataClassification: context.dataMode`. Unit/page/adapter tests use both context classifications. The TENANT_PRIVATE adapter test uses synthetic data in an isolated test database, not real tenant data. `src/lib/env/server-env.ts` is unchanged from main and its rejecting environment-gate tests pass. AGENTS.md contains the requested rule.
- Stage validation rejects COMPLETE before storage, including direct server-action and adapter calls. The dropdown excludes COMPLETE, and completed jobs have no stage controls. PostgreSQL asserts a rejected COMPLETE request changes neither project nor audit.
- Sequential and concurrent same-key/same-input create requests return the original CREATED result and business key. Exactly one project, client, scope set, assignment and audit exist. Reordered scope input normalizes to the same request. Changed input or actor conflicts; capability/membership/project access is checked again on replay. Separate-key duplicate references still fail safely.
- The form submits class, unit and currency as validated fixed hidden values, generates an editable job reference, and offers active clients from the trusted organization. New-client entry still works. Switching client mode preserves each choice separately. One scope list derives the commercial categories on the server: demolition and partitions/ceilings map to DEMOLITION_CEILING; the other five map directly, with deduplication. Forged commercial input cannot override the mapping.
- Client-list use-case/adapter tests cover localization, capability denial before storage, current-organization filtering, inactive-client omission and contained database failures. Writes recheck selected clients; foreign and missing references return the same safe error.
- Existing PostgreSQL coverage still passes for comparison before any quote, creation/stage audit rollback, concurrent business keys/stage changes, and Viewer/foreign/unassigned/deleted/missing-job denial.

## Previous revision browser verification (7661541)

Chrome against the local production build: English desktop (1440×1000) and Traditional Chinese mobile (390×844). Both forms passed required-field feedback, retained input, editable reference, hidden fixed fields, one scope list, client choices, creation and Quote review grouping. English used an existing client; Traditional Chinese created a new one. Database checks confirmed fixed values and derived commercial categories.

A screen-created job returned **six ranked candidates** through comparison before a quote existed. A stage change moved it to Design. Actual server-action requests verified matching-create retry success, changed-input conflict, COMPLETE rejection and stage retry. Viewer creation and Viewer/foreign stage requests were denied. Foreign client lists contained only their own clients, and replaying the existing-client creation request in that organization failed safely. These retries and denials added no project or audit rows.

`evidence/revision/` contains the previous revision’s full-check log, browser results, screenshots and cleanup evidence. The two `*-simplified-form.png` files show clean initial forms; other screenshots capture the exercised flow. Earlier `evidence/browser/` and other root evidence files record the initial implementation and are superseded for changed behavior.

No page exceptions or failed flow requests occurred. The browser emitted one console 404, confirmed as the existing `/favicon.ico` resource by `console-diagnostic.json`; this is not claimed as a clean console run. All three temporary browser sessions were revoked, the local credential file removed, and the local server/container stopped. The isolated synthetic database is preserved.

## Not verified

- Hosted preview acceptance for this revision. The linked `stridebrain-sb034-preview` project previously canceled SB-041 deployments because its Ignored Build Step allows only commit `50cebbf93ce56d11bb823a8d97a8a1ce91ffda39`. [Prior deployment logs](https://vercel.com/prime-stride-ai/stridebrain-sb034-preview/YESKeYrdbAsYXYa6HtsXypvbCM5M). A GitHub Vercel status indicating success for a canceled deployment does not prove preview acceptance. No hosted configuration, migration, database or session was changed. The PR remains draft pending hosted acceptance.
- Safari/Firefox, assistive-technology acceptance, or measured performance/accessibility auditing.
- Production identity/operation, real customer data, or the close-job flow (outside this issue).

The final commit's GitHub CI result is recorded in the PR description after push; the local counts above do not imply a hosted pass.

## Rollout notes

Apply `20261121060000_project_jobs` before serving this PR. Existing quotes remain authoritative for commercial categories once present; the new Project field supports jobs before a first quote. Matching create retries are identified by a canonical validated-input fingerprint stored with the transactional audit event. Stage updates never complete, reopen or reconcile jobs. Entered job/client names are retained in both display fields without invented translations. Supported intake remains commercial retail, m² and TWD.
