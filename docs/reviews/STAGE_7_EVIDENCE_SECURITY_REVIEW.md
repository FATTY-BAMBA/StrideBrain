# Stage 7 — Evidence, Security, UX and Architecture Review

**Review role:** independent evidence-integrity, authorization, product/UX and architecture critic  
**Scope:** Issue #27 / Stage 7 implementation candidate  
**Verdict:** **PASS FOR EXACT-HEAD CI; RENDERED BROWSER ACCEPTANCE REMAINS REQUIRED BEFORE CONTROLLED RELEASE**

## Product coherence

Accepted:

- Evidence opens from the exact Stage 6 claim, value or factor rather than from a disconnected document browser.
- The selected claim/value appears before its sources.
- Authority, observation type, locator, freshness, supersession, conflict and insufficiency remain visible.
- Source mode stays connected to the immutable result that used the source.
- The panel preserves and restores comparison context instead of navigating users away from the decision workflow.
- No model prose is required to explain the evidence.

## Evidence integrity

Accepted:

- Stage 5 claim bundles remain the authoritative link between a claim and its source references.
- Stage 4 factor rows remain the authoritative source of factor state, weight, contribution and evidence references.
- The application does not infer a new source relationship from titles, documents or semantic similarity.
- Missing referenced evidence fails closed rather than silently reducing the source list.
- Financial traces display stored authorized inputs and result metadata; presentation code does not recalculate medians or variances.
- Factor traces display stored contributions and do not rerun similarity policy.
- Quote, supplier offer, forecast and reconciled actual remain semantically distinct.

## Authorization and non-disclosure

Accepted:

- RuntimeContext is resolved server-side for every panel request.
- Organization and project access are not accepted from the browser.
- Requested references are organization-scoped.
- Minimal subject ownership is loaded before sensitive detail.
- Actual-cost details are not queried when actual-cost permission is absent.
- Opaque run-scoped source keys prevent raw evidence IDs from appearing in route state.
- Source keys resolve only within the selected authorized claim/factor bundle.
- Conflict mode is additionally bound to a selected source in that bundle, preventing unrelated conflict enumeration.
- Access changes produce a neutral state and do not retain sensitive preview content.
- No raw storage URL or document storage key reaches the panel DTO.

## Architecture

Accepted:

- The UI receives typed permission-safe DTOs.
- Prisma is isolated in the repository adapter.
- The application service composes stored Stage 4/5 results with currently authorized source records.
- Presentation code imports no Prisma adapters, ranking calculators, economics calculators, model providers or browser persistence.
- The implementation requires no new graph database, vector index or service split.

## Routing and restoration

Accepted:

- Evidence mode, claim/factor/source/conflict context and focus-return ID are bounded.
- Comparison run, enrichment run, selected projects and locale remain intact.
- Closing the panel restores focus to the exact trigger and removes panel state from the URL.
- Invalid or cross-run selections fail closed.

## Bilingual and accessibility source review

Accepted from implementation/tests:

- English and Taiwan Traditional Chinese catalogs have structural parity.
- Critical authority, source, calculation and warning language is localized.
- Dialog semantics, heading focus, Escape, focus trap, focus return, semantic lists/definition lists/tables and reduced motion are present.
- Desktop and mobile layouts are defined.

Still required in an isolated browser preview:

- visible focus order at every breakpoint;
- screen-reader announcement quality;
- 200% zoom and mobile overflow;
- contrast measurements;
- long Traditional Chinese wrapping and naturalness;
- source-card and calculation-trace density;
- focus/scroll restoration after locale changes and server rendering.

## Performance

The implementation batches source ownership/detail reads by subject type and avoids per-source waterfalls. The exact-head PostgreSQL integration must record the claim-panel latency and pass the controlled-demo target of 500 ms after the comparison result is available.

## Required merge conditions

- exact-head CI green;
- all migrations/fixtures/Stage 1–6 SQL verification remain green;
- PostgreSQL imported-stone claim panel and factor panel pass;
- panel latency target passes;
- format, lint, strict TypeScript, all tests, production build and dependency audit pass;
- temporary source-export workflow removed;
- no Stage 8/10, ingestion, real-data or deployment scope enters the PR.

## Final conclusion

The implementation is evidence-first, deterministic, current-permission-aware and appropriately bounded. It is suitable for functional merge after exact-head CI. It must not yet be described as visually flawless or public-demo ready until isolated rendered-browser acceptance is complete.
