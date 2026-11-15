# Stage 5 Integration Review

**Review status:** PASS LOCALLY — EXACT-HEAD CI TRIGGERED
**Scope:** repository reads, orchestration, persistence, schema, fixtures, and regression tests

## Findings resolved before review

1. Temporary recovery archive/export files were removed from PR #24.
2. An unrelated session-token hardening line was reverted so the economics PR remains scoped.
3. Structural-only users originally caused a project-evidence query; this was corrected so Viewer Stage 5 reads execute no financial or Stage 5 evidence query.
4. Selected project keys originally passed through a sorting helper; this was corrected to preserve Stage 4 rank/selection order.
5. Supplier-offer item authority is inherited explicitly from the governed offer record because the item schema does not contain a separate authority field.

## Authorization review

- Organization is applied to every run, financial, evidence, conflict, and persistence query.
- The active project is reauthorized before any financial read.
- Requested selected keys must already exist in the immutable Stage 4 result.
- Current comparison-library classification rules are applied again to historical candidates.
- Actual-cost project IDs are filtered before the actual-cost query.
- Viewer/structural-only requests do not query financial values, evidence rows, hidden counts, or conflict details.
- Cross-organization and inaccessible private candidates return the same unavailable/null behavior.

## Calculation and evidence review

- Domain calculations remain fixed-decimal and deterministic.
- Quote, forecast, offer, and actual semantics remain distinct.
- Evidence is loaded only for authorized source subjects.
- Open conflicts are attached through exact evidence-reference IDs.
- The evidence-bundle service still fails closed if a claim references an unavailable source.
- The independent SQL verification does not reuse the TypeScript implementation.

## Persistence review

- Stage 4 snapshots are not updated.
- One Stage 5 enrichment is immutable and uniquely linked to one Stage 4 comparison run.
- Observation decisions and claims share the same database transaction as the enrichment snapshot.
- Reopen checks current authorization and refuses a result whose stored scope is stronger than the caller's current scope.

## Local verification

- Prisma schema validation: pass.
- Strict TypeScript: pass.
- Unit/application/repository tests: `147/147` pass.
- Formatting: pass.
- Lint: pass with the repository's existing non-blocking `prisma.config.ts` warning only.
- Production Next.js build: pass.
- Final changed-file review: pass; only the 22 intended Stage 5 product, migration, fixture, documentation, and test files remain.

## Remaining merge gates

- committed migration applies on a clean PostgreSQL database;
- all fixture and SQL verification scripts pass in GitHub Actions;
- generated Prisma client matches the new schema;
- exact PR head passes the complete CI workflow;
- independent acceptance review records the exact validated head.
