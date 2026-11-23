# SB-066 verification

## Delivery A — before behavior changes

Inventory completed against main `6310c16`. No production behavior changes yet. [Inventory](inventory.md).

`npm run check` passed on Node 24 and disposable loopback PostgreSQL: **1,470 tests in 135 files**, formatting, lint, strict typecheck and production build. Existing prisma.config.ts lint warning only. [Log](evidence/check.log).

The new parity test captures and pins Xinyi at snapshot date 2026-11-23: Neihu 87.7157 (88), Zhongshan 81.3110 (81), Nanjing 79.4138 (79), Daan 70.6066 (71), Songshan 68.8748 (69), Banqiao 62.7501 (63), plus broader matches, default selection and 16 claims with both-language finding sentences. [Original baseline](evidence/seeded-comparison-before.json). This file was captured before migration or behavior changes and must not be updated to hide a regression.

## Not verified yet

Implementation, migration/upgrade behavior, Clients/Quotes/Settings screens, PDF/browser acceptance, post-change comparison parity and paid evaluation. No paid dispatch used. No hosted changes; hosted acceptance waits for the Product Director and the PR stays draft.
