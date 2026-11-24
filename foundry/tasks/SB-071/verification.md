# SB-071 verification

## A — Investigation

Base: merged main `cefe160`. The original failure is recorded in SB-069's `review-check-first-suite.log`: economics returned no result. That log has no underlying exception/outcome code. The cause is **not proven**.

The issue's claim that every database test writes one shared database is not accurate on this base. [Inventory](evidence/database-inventory.json) identifies 27 database-using test files: 12 create their own databases, 13 use `assistantDatabase` private databases, and two use the supplied URL directly. The firm-list writers from #66 use the private helper. Their mutations to Organization area preferences, FirmJobType, FirmWorkCategory and pricing relations affect what comparisons read logically, but are not demonstrated to reach the hero-flow database. They cannot be named as the cause from source inspection alone.

The shared hero-flow suite persists sessions, ComparisonRun, EconomicsEnrichmentRun, decisions and claims without file cleanup. The shared preview-handoff suite creates and revokes/deletes its own session IDs. Neither directly rewrites the hero job's quotes/costs/categories. `projects/project-list-postgres.test.ts` also reads firm lists through the default Prisma singleton while its other operations use its private client. That mixed ownership will disappear when the whole file uses its worker database. Other private suites manipulate quotes, costs, evidence, assignments and membership grants only inside their own databases.

A diagnostic full run passed the database suites (including hero) but 14 DOM suites could not load the temporary setup outside the repository. This is an investigation-harness error, not a baseline application failure: [log](evidence/investigation-full.log). After moving that temporary setup into the repository, hero + preview handoff + firm-list writers + mapping-lock writers ran concurrently: **24 tests passed in four files**, [log](evidence/investigation-targeted.log). Temporary wrappers recorded authorized comparison retrieval, economics batch retrieval and economics persistence as OK: [trace](evidence/investigation-trace.jsonl). The wrappers/config were removed; the hero test is unchanged.

The economics failure was not reproduced in that bounded attempt. Existing incomplete file cleanup and mixed ownership are risks, not a proven explanation. Isolation is implemented as a test-infrastructure guarantee; it is not presented as proof of the historical cause.

CI before: [run 45390018974](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45390018974), commit `09008b0`: 1,575 tests / 154 files, Vitest duration **225.23 seconds**. Maximum acceptable after-time: **337.845 seconds** (1.5×). CI after and the 20-run evidence are pending.

## B — Worker lifecycle and isolation controls

`tests/database/global-setup.ts` applies committed migration SQL in order to one run-owned template, then runs the canonical `db:seed` and `db:verify` SQL lists twice. It reads those lists from package.json, so CI and local runs use the same fixture definition and retain the repeatable-seed checks. PostgreSQL connections to the template are closed before cloning.

Every file's setup drops/reclones its worker database from that template. Vitest's bounded `VITEST_POOL_ID` identifies the worker. Tests execute against only that worker's URL, and the cached Prisma client is disconnected at file end. Populated-upgrade suites may empty their own worker before applying their existing older migrations; their upgrade assertions are preserved. Existing private-database boilerplate is removed, including the project-list mixed-client path. The hero-flow file and all production files remain unchanged.

Nested fake-evaluation scenarios keep the same worker URL: a temporary, run-owned database snapshot preserves the parent state while the worker gets a fresh template; closing the inner scope restores the parent and reconnects its SQL client. Those snapshots are never exposed as test application databases. The paid evaluation config explicitly keeps its existing standalone lifecycle; no model/evaluation behavior or paid runner changes.

The setup accepts only literal localhost/loopback hosts, plus `postgres` when CI=true; routing query overrides are refused. Every created/dropped name must match this run's `sb_test_<16 hex>_` prefix and a bounded worker/template/snapshot suffix. Cleanup selects only this run's exact prefix. The supplied database is an administration connection, never seeded, truncated or dropped.

[Isolation controls](evidence/isolation-controls.log): 14 tests pass. Two files concurrently update the same seeded Project row and each reads its own committed text. Turning off worker separation makes exactly one same-row assertion fail. Two files on one worker deliberately leave their changes behind; template reset makes both pass, and turning reset off makes the second seeded-state assertion fail. The negative controls are confined to a dedicated probe config; normal tests have no isolation-off flag. A first probe attempt inherited the parent worker-count override; removing that inherited override made the one-worker reset proof exercise the intended topology.

[Integration smoke](evidence/implementation-smoke.log): 27 tests across hero flow, nested fake evaluation, draft, Home and a historical migration pass. Template setup was 500 ms locally. Assertions, typecheck and lint are intact. The full suite, repeated runs and CI are next.

The implementation follows [Vitest per-file setup](https://vitest.dev/config/setupfiles.html) and [global setup/provide](https://vitest.dev/config/globalsetup.html), with PostgreSQL's [template cloning](https://www.postgresql.org/docs/17/sql-createdatabase.html). No serial database-file workaround or test retry is enabled.

## Verification still pending

Full check, 20 consecutive runs and CI duration comparison. No hosted or paid actions. This issue has no test-site click-through; the PR will remain draft for evidence review.
