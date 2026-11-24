# SB-071 verification

## A — Investigation

Base: merged main `cefe160`. The original failure is recorded in SB-069's `review-check-first-suite.log`: economics returned no result. That log has no underlying exception/outcome code. The cause is **not proven**.

The issue's claim that every database test writes one shared database is not accurate on this base. [Inventory](evidence/database-inventory.json) identifies 27 database-using test files: 12 create their own databases, 13 use `assistantDatabase` private databases, and two use the supplied URL directly. The firm-list writers from #66 use the private helper. Their mutations to Organization area preferences, FirmJobType, FirmWorkCategory and pricing relations affect what comparisons read logically, but are not demonstrated to reach the hero-flow database. They cannot be named as the cause from source inspection alone.

The shared hero-flow suite persists sessions, ComparisonRun, EconomicsEnrichmentRun, decisions and claims without file cleanup. The shared preview-handoff suite creates and revokes/deletes its own session IDs. Neither directly rewrites the hero job's quotes/costs/categories. `projects/project-list-postgres.test.ts` also reads firm lists through the default Prisma singleton while its other operations use its private client. That mixed ownership is removed by using the worker database for the whole file. Other private suites manipulate quotes, costs, evidence, assignments and membership grants only inside their own databases.

A diagnostic full run passed the database suites (including hero) but 14 DOM suites could not load the temporary setup outside the repository. This is an investigation-harness error, not a baseline application failure: [log](evidence/investigation-full.log). After moving that temporary setup into the repository, hero + preview handoff + firm-list writers + mapping-lock writers ran concurrently: **24 tests passed in four files**, [log](evidence/investigation-targeted.log). Temporary wrappers recorded authorized comparison retrieval, economics batch retrieval and economics persistence as OK: [trace](evidence/investigation-trace.jsonl). The wrappers/config were removed; the hero test is unchanged.

The economics failure was not reproduced in that bounded attempt. Existing incomplete file cleanup and mixed ownership are risks, not a proven explanation. Isolation is implemented as a test-infrastructure guarantee; it is not presented as proof of the historical cause.

CI before: [run 45390018974](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45390018974), commit `09008b0`: 1,575 tests / 154 files, Vitest duration **225.23 seconds**. Maximum acceptable after-time: **337.845 seconds** (1.5×). CI after is **156.14 seconds** at `5b41c0e`: [run 45403350818](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45403350818), [extracted timing](evidence/ci-after.log). This is about 31% faster than the baseline and below the 337.845-second ceiling. The full `npm run check` and dependency audit passed.

## B — Worker lifecycle and isolation controls

`tests/database/global-setup.ts` applies committed migration SQL in order to one run-owned template, then runs the canonical `db:seed` and `db:verify` SQL lists twice. It reads those lists from package.json, so CI and local runs use the same fixture definition and retain the repeatable-seed checks. PostgreSQL connections to the template are closed before cloning.

Every file's setup drops/reclones its worker database from that template. Vitest's bounded `VITEST_POOL_ID` identifies the worker. Tests execute against only that worker's URL, and the cached Prisma client is disconnected at file end. Populated-upgrade suites may empty their own worker before applying their existing older migrations; their upgrade assertions are preserved. Existing private-database boilerplate is removed, including the project-list mixed-client path. The hero-flow file and all production files remain unchanged.

Nested fake-evaluation scenarios keep the same worker URL: a temporary, run-owned database snapshot preserves the parent state while the worker gets a fresh template; closing the inner scope restores the parent and reconnects its SQL client. Those snapshots are never exposed as test application databases. The paid evaluation config explicitly keeps its existing standalone lifecycle; no model/evaluation behavior or paid runner changes.

The setup accepts only literal localhost/loopback hosts, plus `postgres` when CI=true; routing query overrides are refused. Every created/dropped name must match this run's `sb_test_<16 hex>_` prefix and a bounded worker/template/snapshot suffix. Cleanup selects only this run's exact prefix. The test setup uses the supplied database solely as an administration connection and never seeds, truncates or drops it. Separate CI deployment-command steps intentionally migrate and seed the service's base database before the tests.

[Isolation controls](evidence/isolation-controls.log): 14 tests pass. Two files concurrently update the same seeded Project row and each reads its own committed text. Turning off worker separation makes exactly one same-row assertion fail. Two files on one worker deliberately leave their changes behind; template reset makes both pass, and turning reset off makes the second seeded-state assertion fail. The negative controls are confined to a dedicated probe config; normal tests have no isolation-off flag. A first probe attempt inherited the parent worker-count override; removing that inherited override made the one-worker reset proof exercise the intended topology.

[Integration smoke](evidence/implementation-smoke.log): 27 tests across hero flow, nested fake evaluation, draft, Home and a historical migration pass. Template setup was 500 ms locally. Assertions, typecheck and lint are intact. The full check now passes: **1,589 tests in 156 files**, format, CSS gate, lint (only the pre-existing prisma.config.ts warning), types and production build. [Full output](evidence/check.log). Local Vitest duration was 102.24 seconds. [Assertion audit](evidence/assertion-preservation.json) verifies every assertion in all 12 modified existing test files is unchanged; the hero-flow file is byte-identical to main. Shared hooks use stack ordering so each file’s cleanup finishes before the final Prisma disconnect.

The implementation follows [Vitest per-file setup](https://vitest.dev/config/setupfiles.html) and [global setup/provide](https://vitest.dev/config/globalsetup.html), with PostgreSQL's [template cloning](https://www.postgresql.org/docs/17/sql-createdatabase.html). No serial database-file workaround or test retry is enabled.

## C — CI and repeated runs

Before `npm run check`, CI runs `npm run db:migrate`, `npm run db:seed`, `npm run db:verify`, then `npm run db:seed && npm run db:verify` again against the PostgreSQL service's base database. These restored steps exercise the real `prisma migrate deploy` and `prisma db execute` commands, including repeatable seeding. Vitest separately builds its isolated template by applying SQL files directly; that mechanism does not replace deployment-command coverage. AGENTS.md includes the database-state rule. `npm run test:stability` captures 20 independent sequential runs and halts on any failure, skipped test, count reduction or failed hero flow. Ten runs use distinct file-shuffle seeds; within-file scenarios stay ordered.

PR #72 review follow-up: restored those four deployment-command steps without changing test infrastructure, assertions, application code or migrations. Local `npm run check` passed again: **1,589 tests in 156 files**, format, design gate, lint (the same pre-existing prisma.config.ts warning), typecheck and production build. Vitest duration: **104.02 seconds**. [Review check output](evidence/review-check.log). The earlier CI runs and 20-run sequence below predate this workflow correction. The sequence was not repeated, and CI execution of the restored commands has not been observed for this revision; work stops after the requested local check and PR update.

## Final stability evidence

**20 consecutive runs passed** on implementation commit `5b41c0e904ffccf895e7783e6066274f1197ee08`: ten normal file orders, then ten distinct file-shuffle seeds `71001`–`71010`. Every run passed **1,589 tests in 156 files**, with zero failed/skipped tests and no retries. The unchanged hero-flow test passed in every run; its Git blob hash is `fe45c89d86755cac951838934e2abcce62c27c93`. The prior baseline was 1,575 tests; the 14 additional tests cover isolation and its safety boundaries.

[Machine-readable summary](evidence/stability/summary.json) records the commit, hero hash, counts and timing for every execution. The table links each full log. These were independent sequential executions, not reruns after failures. Local wall time per run was 99.377–142.890 seconds. The evidence-only follow-up commit adds these records without changing implementation, tests or configuration; a diff against the tested implementation confirmed this.

| Run | File order / seed | Wall seconds | Result |
| --- | --- | ---: | --- |
| 1 | default | 100.808 | [1,589 passed](evidence/stability/run-01-default.log) |
| 2 | default | 104.761 | [1,589 passed](evidence/stability/run-02-default.log) |
| 3 | default | 100.580 | [1,589 passed](evidence/stability/run-03-default.log) |
| 4 | default | 103.749 | [1,589 passed](evidence/stability/run-04-default.log) |
| 5 | default | 99.956 | [1,589 passed](evidence/stability/run-05-default.log) |
| 6 | default | 105.687 | [1,589 passed](evidence/stability/run-06-default.log) |
| 7 | default | 102.944 | [1,589 passed](evidence/stability/run-07-default.log) |
| 8 | default | 101.134 | [1,589 passed](evidence/stability/run-08-default.log) |
| 9 | default | 100.498 | [1,589 passed](evidence/stability/run-09-default.log) |
| 10 | default | 99.377 | [1,589 passed](evidence/stability/run-10-default.log) |
| 11 | shuffle-71001 | 118.985 | [1,589 passed](evidence/stability/run-11-shuffle-71001.log) |
| 12 | shuffle-71002 | 142.890 | [1,589 passed](evidence/stability/run-12-shuffle-71002.log) |
| 13 | shuffle-71003 | 120.629 | [1,589 passed](evidence/stability/run-13-shuffle-71003.log) |
| 14 | shuffle-71004 | 102.545 | [1,589 passed](evidence/stability/run-14-shuffle-71004.log) |
| 15 | shuffle-71005 | 124.827 | [1,589 passed](evidence/stability/run-15-shuffle-71005.log) |
| 16 | shuffle-71006 | 121.225 | [1,589 passed](evidence/stability/run-16-shuffle-71006.log) |
| 17 | shuffle-71007 | 124.569 | [1,589 passed](evidence/stability/run-17-shuffle-71007.log) |
| 18 | shuffle-71008 | 112.455 | [1,589 passed](evidence/stability/run-18-shuffle-71008.log) |
| 19 | shuffle-71009 | 105.239 | [1,589 passed](evidence/stability/run-19-shuffle-71009.log) |
| 20 | shuffle-71010 | 117.939 | [1,589 passed](evidence/stability/run-20-shuffle-71010.log) |

After the final run, a read-only local catalog check found **zero remaining `sb_test_` databases**: [cleanup record](evidence/cleanup.json). Production source, existing migrations and the hero-flow file remain byte-identical to the merged main base `cefe160`.

## Not verified / review pending

The historical economics failure's exact cause was not reproduced or proven. The investigation above records the ownership paths found and the evidence that rules out treating the existing private firm-list writers as a demonstrated cause. No browser tests, hosted actions or paid evaluation were performed; these are outside this infrastructure issue. Earlier CI and the timing comparison passed; CI for the restored deployment-command steps remains unverified as noted above. There is no test-site click-through for #71. [PR #72](https://github.com/FATTY-BAMBA/StrideBrain/pull/72) remains draft for evidence review.
