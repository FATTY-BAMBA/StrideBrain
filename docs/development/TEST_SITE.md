# Test site

One fixed address that shows one open pull request at a time, on synthetic data. The product owner uses it to click through a pull request before merging.

It is separate from the pilot preview (`stridebrain-sb034-preview`). That preview stays frozen on its approved commit and is not touched by anything here.

## Put a pull request on the test site

1. GitHub, **Actions**, **Test site**, **Run workflow**.
2. Enter the pull request number, or leave it empty to take the open pull request with the newest commit.
3. Choose the data option:
   - `keep` leaves the test data as it is.
   - `reload-seed` deletes the test data and loads the synthetic seed again. Do not sign in while this workflow is running: its final check counts sign-in sessions, so a sign-in during the run makes that check fail. Wait until the workflow finishes.
4. When the run is green, Vercel builds by itself. Wait about three minutes, then open the test-site address and enter the invitation code. The run's summary names the pull request it used.

The workflow is `.github/workflows/test-site.yml`. It does three things, in order:

1. Applies the pull request's migrations to the test database (`npm run db:migrate`).
2. Loads the seed (`npm run db:seed` and `npm run db:verify`) when the database is empty or `reload-seed` was chosen.
3. Moves the `test-site` branch to the pull request's commit. The Vercel project builds only that branch.

Only a person with write access to the repository can start it. Pull requests from forks are refused.

## Choose a sample person

Enter the invitation code and choose **Person / 體驗人員** before signing in:

| Choice | English label | 繁體中文 | Use it to check |
| --- | --- | --- | --- |
| `owner` (default) | Alex Chen — Owner | 陳柏宇 — 組織管理員 | Every job and the three closed-job lessons |
| `project-manager` | Mei Lin — Project manager | 林美玲 — 專案經理 | Assigned project work |
| `finance` | Iris Huang — Finance | 黃怡君 — 財務 | The finance person's authorized view |
| `viewer` | Kai Wu — Viewer | 吳凱 — 檢視者 | Assigned lists without New job or financial figures |

Sign out in the sidebar to choose another person. The invitation is still required for every sign-in. Sessions last at most one hour and never beyond invitation expiry; attempts share the existing limit across all four choices. The options are static copy; the server accepts only the four sample identities after validating the code.

Saved comparisons belong to the member who ran them. After changing person, open the comparison and run it again before checking that person's saved findings on Home.

This is **test-site sign-in only**, not production identity or a role-switching feature. Production Foundation [#42](https://github.com/FATTY-BAMBA/StrideBrain/issues/42) replaces it. The frozen pilot deployment is unchanged.

## Rules

- Synthetic data only. No customer files and no customer data, ever.
- One pull request at a time. The database is shared by whatever is on the test site.
- Never point `TEST_SITE_DATABASE_URL` at another database. The seed deletes organization data. The workflow refuses to run unless the connection string belongs to the project named in `TEST_SITE_SUPABASE_REF`.
- If the `test-site` branch is ever deleted, the first run recreates it and Vercel does not build. Run the workflow a second time.
- Migrations are not undone. If a pull request with a migration is abandoned after it was put on the test site, reset the `public` schema of the test database by hand before testing the next one.

## One-time setup

### Database

Supabase project `stridebrain-test`, region `ap-northeast-1`, PostgreSQL 17. It holds synthetic data only.

### GitHub (Settings, Secrets and variables, Actions)

| Kind     | Name                     | Value                                                                                                   |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Secret   | `TEST_SITE_DATABASE_URL` | The Supabase **Session pooler** connection string (port 5432) with the password filled in. No `?` part. |
| Variable | `TEST_SITE_SUPABASE_REF` | The 20-character project ref of `stridebrain-test`.                                                     |
| Variable | `TEST_SITE_URL`          | The test-site address. Optional; it is printed in the run summary.                                      |

### Vercel project `stridebrain-test`

Connected to this repository. Settings:

- **Build Command:** `npm run db:generate && npm run build`
- **Ignored Build Step**, custom command, so that only the `test-site` branch builds:
  `if [ "$VERCEL_GIT_COMMIT_REF" = "test-site" ]; then exit 1; else exit 0; fi`
- **Function Region:** Tokyo, next to the database.
- **Deployment Protection:** keep Vercel Authentication on, so only team members signed in to Vercel can open the site.

Environment variables, **Preview** environment only:

| Variable                                | Value                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_STRIDEBRAIN_ENV`           | `preview`                                                                                                |
| `STRIDEBRAIN_DATA_MODE`                 | `DEMO_SYNTHETIC`                                                                                         |
| `STRIDEBRAIN_APP_ORIGIN`                | The `test-site` branch address, for example `https://stridebrain-test-git-test-site-<team>.vercel.app`   |
| `DATABASE_URL`                          | The Supabase **Transaction pooler** string (port 6543) followed by `?sslmode=require&uselibpqcompat=true` |
| `STRIDEBRAIN_DEMO_SESSION_SECRET`       | Output of `openssl rand -base64 48`                                                                      |
| `STRIDEBRAIN_PREVIEW_HANDOFF_ENABLED`   | `true`                                                                                                   |
| `STRIDEBRAIN_PREVIEW_INVITE_SHA256`     | SHA-256 of the invitation code, 64 lowercase hex characters                                              |
| `STRIDEBRAIN_PREVIEW_INVITE_EXPIRES_AT` | A future time with a timezone, for example `2027-02-28T23:59:59+08:00`                                   |
| `NEXT_TELEMETRY_DISABLED`               | `1`                                                                                                      |

The invitation code has the form `STRIDEBRAIN2026-NN-XXXX`: two digits, then four capital letters or digits. Get its digest with:

```sh
printf '%s' 'STRIDEBRAIN2026-NN-XXXX' | shasum -a 256
```

Store the digest in Vercel. Keep the code itself out of the repository, issues, pull requests and chat tools.

The application accepts sign-in only at the exact address in `STRIDEBRAIN_APP_ORIGIN`. Always open the `test-site` branch address, not the per-deployment address Vercel also creates.

## What is not production-grade here

These are accepted for a synthetic test site and must not carry over to a real tenant. They belong to the Production Foundation issue (#42).

- The application connects as the database owner. The pilot uses a restricted login, and production must too.
- Database connections are encrypted, but the server certificate is not verified against the Supabase certificate authority.
- Sign-in uses a shared invitation and four allowlisted synthetic sample people. It is test-site sign-in only and is replaced by #42. Other-organization and empty-firm behavior remain covered by automated tests and local browser evidence.
- The invitation window is longer than the pilot's because the site sits behind Vercel sign-in.

## Real sign-in and people (#84)

The Product Director follows [SIGN_IN.md](../operations/SIGN_IN.md) to configure Google
and Resend personally. Agents never sign in to or change a hosted provider. On
`stridebrain-test`, add server-only `STRIDEBRAIN_SIGN_IN_MODE=both`, an independent
`STRIDEBRAIN_AUTH_SECRET`, `STRIDEBRAIN_GOOGLE_CLIENT_ID`,
`STRIDEBRAIN_GOOGLE_CLIENT_SECRET`, `STRIDEBRAIN_RESEND_API_KEY`, `STRIDEBRAIN_MAIL_FROM`
and `STRIDEBRAIN_MAIL_REPLY_TO`. `STRIDEBRAIN_APP_ORIGIN` must be the exact test-site
HTTPS origin; register that origin plus `/api/auth/callback/google` with Google. Keep
`STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC` and the preview public environment. Leave the
frozen pilot's settings untouched (absent sign-in mode means demo).

Run the Test site workflow only after local verification and review. Install scripts
must remain enabled: npm postinstall applies the versioned Better Auth timeout patch
and fails if it cannot apply. No separate manual patching is needed on Vercel.

Open `/zh-TW/sign-in` (or `/en/sign-in`). The sample-person link still leads to `/preview`.
As the sample owner, open Settings → People and invite testers with their intended role
and jobs. Real testers then use Google or emailed codes. Real sessions last thirty days
without activity extension; demo sessions keep their one-hour limit. Signing in as one
kind clears the other. Real test addresses belong only in the private test database,
never screenshots, reports or repository fixtures. The existing `reload-seed` operation
erases tenant links/invitations; real testers must be invited again after a reset.

Click through the issue #84 acceptance list, including Gmail/Yahoo奇摩/HiNet or Outlook
delivery, both languages at 390px, next-click deactivation and job removal, and signed-out
return to a job. Hosted acceptance remains waiting for the Product Director.
