# SB-058 verification

Local verification: `npm run check` passes (1,335 tests across 126 files, typecheck, format, lint and production build). The existing prisma.config.ts anonymous-default-export lint warning remains. Checks used Node 24 and a disposable loopback PostgreSQL database with synthetic fixtures.

The deterministic evaluation passes all 50 questions in each of three rounds: 20/20 core per language, all eight retained hosted regressions and both new count/range cases. Calls: median 2, maximum 2; all 50 at three or fewer. Named-job refusal maximum 1. See evidence/fake-evaluation.json and evidence/check.log.

Paid evaluation: pending; zero of three authorized workflow runs used. The first run will retain actual tool names and arguments to diagnose the Chinese count/range failure. Provider/model unchanged.

Local browser evidence: pending. Hosted acceptance: waiting for the Product Director. This pull request stays draft. No hosted deployment, migration, seed or settings changes; no migration files changed.
