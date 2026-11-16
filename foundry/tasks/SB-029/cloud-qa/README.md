# Fresh Cloud QA runtime

This is an operator-only launch package for a **new, dedicated Cloud task**. It
does not create a task or claim a preview/browser pass. It copies no state or
credentials from the previous environment. Product source and the historical
`computer-qa-report.json` remain unchanged.

Prerequisites: the requested repository/branch, Node.js 24, npm, Python 3, Docker
with PostgreSQL 17 available, and working actual Cloud browser tools. Read the
Cloud runtime/desktop skills and browser authentication instructions exposed in
that new task. Use its managed workspace and shared browser. Supported browser
API locators inside the documented tool are allowed. Do not install a second
browser, run standalone CDP/Playwright outside that tool, or inject cookie/browser
state to bypass an unavailable documented browser-control path.

## Verify and initialize

Fetch `build/sb-029-governed-internal-review`, select the exact portability commit
provided by the Product Director, and record the full HEAD. If that commit is not
provided, resolve and record the fetched branch HEAD before proceeding. Do not
work on `main`. Run from the repository root:

```sh
python3 foundry/tasks/SB-029/cloud-qa/prepare-runtime.py --check
python3 foundry/tasks/SB-029/cloud-qa/prepare-runtime.py --initialize
```

The verifier requires checkpoint `2a23d31f46e0b6c7b465b3774ad765c81a3417eb`
to be an ancestor, permits only task-artifact changes since that checkpoint, and
compares the source-tree manifest to application commit
`4c13f726bb75f4a31d263eb6e54622224807d019` and SHA-256
`7fe5157f84f9c88023462ec1e958b62a53bcdb5aef30eb0dc4ac95dfdac85920`.
Stop on an unexpected product change; do not amend the guard to accept it.

Initialization refuses an existing runtime directory or occupied ports. It
creates `/tmp/sb029-cloud-qa` mode 0700, generates fresh random database/session
secrets in mode-0600 files, and copies the reviewed operator source there. It
also refuses executable helpers that differ from the recorded committed HEAD.
It does not start a database or app. No old `.env`, cookie, bootstrap URL, session
ledger, volume, database, or build output is needed. Do not print the private env
files or enable shell tracing. If a step fails, preserve private diagnostics and
report the failure; do not remove an unrelated container or directory to retry.

## Create the fresh synthetic database and production build

Before starting, `docker container inspect stridebrain-sb029-cloud-qa` must report
that this container does not exist. If it exists, stop and inspect ownership
without deleting/reusing it. Start a **new** PostgreSQL 17 container with no host
data mount and only a loopback port:

```sh
docker run --detach --name stridebrain-sb029-cloud-qa --label stridebrain.task=SB-029 --env-file /tmp/sb029-cloud-qa/postgres.env --publish 127.0.0.1:54329:5432 postgres:17
docker exec stridebrain-sb029-cloud-qa pg_isready -U stridebrain -d stridebrain_stage8_preview
```

Poll the readiness command as needed without a long blocking sleep. Record the
actual image digest, PostgreSQL/Node/npm versions and startup timestamp. Run each
command sequentially; record exact command, exit status and sanitized output.
The wrapper supplies private environment values without printing them.
It clears inherited values for its managed environment keys before loading the
private file, so an existing host `DATABASE_URL` cannot override this preview.

```sh
/tmp/sb029-cloud-qa/run.sh npm ci --no-audit --no-fund
/tmp/sb029-cloud-qa/run.sh npm run db:validate
/tmp/sb029-cloud-qa/run.sh npm run db:generate
/tmp/sb029-cloud-qa/run.sh npm run db:migrate
/tmp/sb029-cloud-qa/run.sh npm run db:seed
/tmp/sb029-cloud-qa/run.sh npm run db:verify
/tmp/sb029-cloud-qa/run.sh npm run db:migrate
/tmp/sb029-cloud-qa/run.sh npm run db:seed
/tmp/sb029-cloud-qa/run.sh npm run db:verify
/tmp/sb029-cloud-qa/run.sh npm run format:check
/tmp/sb029-cloud-qa/run.sh npm run lint
/tmp/sb029-cloud-qa/run.sh npm run typecheck
/tmp/sb029-cloud-qa/run.sh npm run test
/tmp/sb029-cloud-qa/run.sh npm run test:localization
/tmp/sb029-cloud-qa/run.sh npm run build
/tmp/sb029-cloud-qa/run.sh npm audit --omit=dev --audit-level=high
```

All eight committed migrations must apply on the initially empty database;
repeat migration/seed/verification proves fixture repeatability. Confirm only
the two fixture organizations `HORIZON_ATELIER` and `NORTHERN_STUDIO` exist, both
`DEMO_SYNTHETIC`, before issuing sessions. Record initial Action, ProposedAction,
InternalReviewReceipt and AuditEvent counts (expected zero) and migration count
using read-only SQL. `tests/internal-review/postgres-invariants.test.ts` manages
its own disposable test database; do not aim mutation tests at the preview.

```sh
docker exec -i stridebrain-sb029-cloud-qa psql -X -v ON_ERROR_STOP=1 -U stridebrain -d stridebrain_stage8_preview <<'SQL'
BEGIN READ ONLY;
SELECT "businessKey", "dataClassification" FROM "Organization" ORDER BY "businessKey";
SELECT count(*) AS applied_migrations FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;
SELECT 'Action' AS entity, count(*) FROM "Action"
UNION ALL SELECT 'ProposedAction', count(*) FROM "ProposedAction"
UNION ALL SELECT 'InternalReviewReceipt', count(*) FROM "InternalReviewReceipt"
UNION ALL SELECT 'AuditEvent', count(*) FROM "AuditEvent";
COMMIT;
SQL
```

Record `.next/BUILD_ID` from **this build**, full HEAD and source fingerprint in
the new run's readiness evidence. The old build ID is historical, not reusable.
If Next regenerates `next-env.d.ts`, inspect the generated-only difference and
restore that file's exact checked-out bytes after the successful build; do not
restore unrelated modifications. Re-run `prepare-runtime.py --check`. All other
unexpected product-file changes are a stop condition.

Start the production server in a managed long-running command session:

```sh
/tmp/sb029-cloud-qa/run.sh node node_modules/next/dist/bin/next start --hostname localhost --port 3000
```

The bind hostname **must be `localhost`**, matching
`STRIDEBRAIN_APP_ORIGIN=http://localhost:3000`. `0.0.0.0` changes Next's reconstructed
request origin and correctly triggers the strict POST guard. Never weaken the
guard. Verify HTTP readiness for `/en/projects/PRJ-XINYI-026` and
`/zh-TW/projects/PRJ-XINYI-026`; unauthenticated requests may show safe denial.
HTTP readiness alone gives no browser-QA credit. Record the new environment ID,
local URL and server command/session; no public deployment or domain is needed.

## Trusted fixed-persona login

```sh
/tmp/sb029-cloud-qa/run-operator.sh preflight
/tmp/sb029-cloud-qa/run-operator.sh check-imports
/tmp/sb029-cloud-qa/run-operator.sh serve
```

Keep `serve` in a separate long-running session. In another operator command:

```sh
/tmp/sb029-cloud-qa/run-operator.sh issue mei en
```

Allowed fixed personas: `mei` (assigned Project Manager/Estimator), `finance`
(Iris Huang, assigned Financial Reviewer), `admin` (Alex Chen), `viewer` (Kai Wu),
`northern` (other synthetic organization). Allowed locales: `en`, `zh-TW`.
The script uses the existing `DemoSessionService` and repository, not a fabricated
browser identity. It writes a private single-use bootstrap URL file, valid for
five minutes; the issued session lasts one hour. No role/capability/organization
is accepted from a browser. The local server sends the service's unchanged
Secure, HttpOnly, SameSite=Lax, `__Host-` cookie and redirects to the app.

Use the actual browser tool's documented authentication/credential-entry flow
to open the private bootstrap URL. Keep that credential out of committed files,
screenshots and summaries; capture the page only after the redirect to the normal
app route. Do not log it or copy it between environments. Verify cookie handling
through the visible authenticated result. If documented browser authentication
cannot complete, report BLOCKED; do not inject browser state, drop `Secure`, add a
product login/role picker, or alter origin/authentication policy.

Revoke the current persona before switching, then issue the next persona and
create a fresh comparison/economics run for it:

```sh
/tmp/sb029-cloud-qa/run-operator.sh revoke mei
/tmp/sb029-cloud-qa/run-operator.sh issue finance zh-TW
```

The `northern` persona redirects to the Horizon project to verify neutral denial;
it must not receive Horizon details. No-assign/changed-access cases require a
scoped synthetic operator mutation with recorded before/after restoration on
this preview only; follow the accepted QA plan and existing tests, never change
product policy or source. Do not mutate fixtures during another active scenario.
Revoke all sessions at the end with `run-operator.sh revoke all`. Do not destroy
the preview until the Product Director has had the opportunity to review it.

## Actual QA and evidence

After recording this new preview's readiness, use the actual Cloud browser and
complete QA-01 through QA-18 in `../computer-qa-plan.yaml`. Read browser-tool
documentation before interaction and complete its observed-outcome summary when
finished. All 18 scenarios start NOT_RUN in this new run. Keep the old blocked
report/evidence immutable. Write fresh evidence under
`foundry/tasks/SB-029/evidence/cloud-qa/<UTC-run-id>/`, including a new
`computer-qa-report.json`, readiness.json, sanitized command results, screenshots,
actual timings, defects and restoration evidence.

The new Cloud task has a separate filesystem. Hand back reviewable evidence:
create `qa/sb-029-cloud-<UTC-run-id>` from the recorded portability HEAD; commit and
push **only** the new run's `foundry/tasks/SB-029/evidence/cloud-qa/<UTC-run-id>/`
subtree. Inspect staged paths and scan/redact secrets, bootstrap URLs, cookies and
live confirmation keys before committing. Do not overwrite old reports or stage
product/generated/runtime files. Return the exact evidence branch and full
commit, preview application HEAD and BUILD_ID, and repository-relative artifact
paths so the Orchestrator can fetch and independently review them. No merge or
self-approval is authorized. If push is unavailable, use an available artifact
delivery tool to return a sanitized report/screenshots archive and its accessible
artifact reference; local paths alone are not a handback. Report a delivery
blocker if neither route is available. No source fixes or release.
