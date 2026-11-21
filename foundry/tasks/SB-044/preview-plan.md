# Hosted acceptance plan for PR #48

The PR is locally verified. Hosted acceptance has not run. Read-only inspection found two explicit deployment restrictions:

- `stridebrain-sb034-preview` only builds preview commit `50cebbf93ce56d11bb823a8d97a8a1ce91ffda39`.
- `stridebrain-test` only builds the `test-site` branch. Its Supabase database already has migrations through `20261121060000_project_jobs`.

Both automatic deployments of PR commit `8edbbf5` were canceled by these existing Ignored Build Step commands. GitHub's green Vercel status for an ignored build is not hosted acceptance.

Proposed target: a one-off **preview** of PR #48 in Vercel project `stridebrain-test` (`prj_5yKYWZ6Sy66L0jQinkd2p2bphJVh`), using its synthetic Supabase project `qghfyansqlylgoxmlgry`. This requires approval because its database also serves the separately pinned `test-site` deployment.

1. Recheck the PR head, CI, database schema and synthetic-only classification. Record existing immutable receipt/audit/snapshot fingerprints.
2. Apply only the two committed SB-044 forward migrations: `20261121160000_job_neutral_claims` and `20261121170000_internal_review_policy_2`. Preserve correct Prisma migration tracking. Seed only `job-neutral-findings.sql`; do not reset or reseed the existing database.
3. Create a preview with a per-deployment ignored-build override. Keep both project-wide restrictions and existing aliases unchanged. Use branch-specific origin and temporary synthetic sign-in configuration if required; never print or commit credentials.
4. Repeat the bilingual browser acceptance against that exact commit, including Home/comparison agreement, a screen-created unquoted job, review confirmation, Viewer restrictions and existing receipt evidence. Confirm immutable historical data remains unchanged.
5. Revoke temporary sessions/invites and remove temporary authentication overrides; record the deployment URL, commit, results and cleanup. Keep forward migrations and synthetic test records as documented evidence.

No production promotion, force-push, change to `test-site`, or work on issue #46 is part of this plan. #46 remains gated on PR #48 being merged.
