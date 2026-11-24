# SB-071 verification

## A — Investigation

Base: merged main `cefe160`. The original failure is recorded in SB-069's `review-check-first-suite.log`: economics returned no result. That log has no underlying exception/outcome code. The cause is **not proven**.

The issue's claim that every database test writes one shared database is not accurate on this base. [Inventory](evidence/database-inventory.json) identifies 27 database-using test files: 12 create their own databases, 13 use `assistantDatabase` private databases, and two use the supplied URL directly. The firm-list writers from #66 use the private helper. Their mutations to Organization area preferences, FirmJobType, FirmWorkCategory and pricing relations affect what comparisons read logically, but are not demonstrated to reach the hero-flow database. They cannot be named as the cause from source inspection alone.

The shared hero-flow suite persists sessions, ComparisonRun, EconomicsEnrichmentRun, decisions and claims without file cleanup. The shared preview-handoff suite creates and revokes/deletes its own session IDs. Neither directly rewrites the hero job's quotes/costs/categories. `projects/project-list-postgres.test.ts` also reads firm lists through the default Prisma singleton while its other operations use its private client. That mixed ownership will disappear when the whole file uses its worker database. Other private suites manipulate quotes, costs, evidence, assignments and membership grants only inside their own databases.

A diagnostic full run passed the database suites (including hero) but 14 DOM suites could not load the temporary setup outside the repository. This is an investigation-harness error, not a baseline application failure: [log](evidence/investigation-full.log). After moving that temporary setup into the repository, hero + preview handoff + firm-list writers + mapping-lock writers ran concurrently: **24 tests passed in four files**, [log](evidence/investigation-targeted.log). Temporary wrappers recorded authorized comparison retrieval, economics batch retrieval and economics persistence as OK: [trace](evidence/investigation-trace.jsonl). The wrappers/config were removed; the hero test is unchanged.

The economics failure was not reproduced in that bounded attempt. Existing incomplete file cleanup and mixed ownership are risks, not a proven explanation. Isolation is implemented as a test-infrastructure guarantee; it is not presented as proof of the historical cause.

CI before: [run 45390018974](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45390018974), commit `09008b0`: 1,575 tests / 154 files, Vitest duration **225.23 seconds**. Maximum acceptable after-time: **337.845 seconds** (1.5×). CI after and the 20-run evidence are pending.

## Verification still pending

Per-worker reset/negative controls, full check, 20 consecutive runs and CI duration comparison. No hosted or paid actions. This issue has no test-site click-through; the PR will remain draft for evidence review.
