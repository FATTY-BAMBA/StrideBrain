# SB-071 build contract

A. Audit actual database ownership and comparison inputs; attempt reproduction, record unknowns and the prior CI duration.

B. One template per run, cloned into a fixed-prefix database per worker; reset before every file. Localhost/CI-service-only guard, scoped cleanup, no production changes. Historical migration tests can reset their own worker to an empty schema. Nested fixture scenarios preserve/restore the same worker through private template snapshots. Prove concurrent same-row writes and same-worker file reset, including negative controls.

C. Same global setup locally and in CI, AGENTS.md rule, npm run check and 20 consecutive final-code runs, including 10 different shuffled file-order seeds. Retry remains zero. Report CI timing and stop if it exceeds the old timing by more than 50%. One draft PR; evidence review replaces hosted click-through for this issue.
