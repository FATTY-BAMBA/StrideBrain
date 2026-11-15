# Stage 6 — Structured Comparison Experience Review

**Review role:** independent Product/UX, Architecture, Authorization, and Quality critic  
**Scope:** PR #26 / Issue #25  
**Verdict:** **PASS FOR EXACT-HEAD FUNCTIONAL CI; VISUAL BROWSER ACCEPTANCE REMAINS REQUIRED BEFORE CONTROLLED RELEASE**

## Reviewed outcome

Stage 6 converts the accepted Stage 3–5 contracts into one coherent user flow:

```text
Project Workspace
  → contextual hero question
  → immutable comparable-project result
  → selected historical precedents
  → structured project and commercial comparison
  → honest uncertainty / authority states
  → recommended internal review
```

The implementation does not require a model and does not expose model/provider plumbing in normal product copy.

## Product coherence review

### Accepted

- The journey begins inside the Xinyi project rather than on a feature dashboard or generic chat page.
- The Project Workspace provides current project, commercial, evidence, and knowledge context before asking the hero question.
- Comparable projects are product objects, not prose-only answers.
- Ranking, economics, warnings, and synthesis form one continuous workflow.
- The disabled Stage 8 action affordance communicates the next product step without simulating a write.
- Global copy no longer describes the current product as Stage 0 or claims that project data is disconnected.

### Scope discipline

No evidence drawer, action transaction, AI explanation, semantic ranking, arbitrary ingestion, real customer data, deployment, DNS, or marketing-site work entered this stage.

## Information hierarchy review

### Accepted

The primary order is:

1. active project and result summary;
2. comparable-project cards;
3. selection of up to three precedents;
4. structured comparison;
5. structured review and evidence-state notices;
6. future governed-action boundary.

Cards expose score, evidence coverage, strongest factors, differences, unknowns, authority availability, and warnings without forcing all detail into the default view.

Desktop uses a semantic comparison table. Mobile uses separate stacked project sections rather than an unusable horizontally trapped table.

### Retained visual-review questions

The following require the actual preview rather than source inspection:

- whether six cards feel too dense at common laptop widths;
- whether score and evidence coverage compete visually;
- whether long Traditional Chinese labels wrap cleanly;
- whether the comparison table remains scannable with four columns;
- whether the synthesis section feels sufficiently distinct from warnings;
- whether the dark sidebar and light comparison workspace feel like one product;
- whether the disabled Stage 8 action is useful context or premature visual noise.

These are release-review questions, not reasons to replace the current architecture.

## Deterministic intelligence review

### Accepted

- Stage 6 consumes stored `Stage4ComparisonResult` and `Stage5EconomicsResult` DTOs.
- The presentation composer does not import Prisma, ranking calculators, fixed-decimal calculators, or economics services.
- Stage 4/Stage 5 run mismatch fails closed.
- Selection changes create a new Stage 5 enrichment and do not alter Stage 4 scores/ranks/factors.
- Unknown factors remain distinct from mismatches.
- Quote, supplier offer, forecast, and reconciled actual remain semantically distinct.
- Lighting actual-cost insufficiency remains visible and does not become a numeric conclusion.
- The programme difference remains unquantified.
- Structured synthesis is derived from verified result states, not model prose.

## Authorization and privacy review

### Accepted

- RuntimeContext is resolved server-side from the signed HTTP-only session and persisted authorization state.
- URL parameters cannot select organization, role, capability, assignment, score, financial authority, or source.
- Stored run reopen reuses Stage 4/Stage 5 authorization checks.
- Requested selected projects are filtered against the currently authorized immutable Stage 4 result.
- Invalid, cross-run, unavailable, or inaccessible state fails closed.
- Restricted economics render a structural-only state without hidden values, counts, source IDs, or exclusion reasons.
- Presentation code receives only permission-safe DTOs.

## Route and restoration review

### Accepted

The canonical route preserves:

- locale;
- active project business key;
- comparison-run ID;
- economics-run ID;
- selected comparable project business keys.

Refresh, back/forward navigation, and deep links therefore reopen stored immutable results. The global language switcher now preserves the complete query string, and is isolated behind a Suspense boundary so static shell rendering does not force a client-rendering bailout.

## Bilingual review

### Accepted from source/catalog tests

- English and Taiwan Traditional Chinese Stage 6 catalogs have structural parity.
- Critical authority terms remain distinct.
- Chinese product copy does not expose Prisma, model providers, tokens, or developer plumbing.
- Global Stage 0 language was replaced by accurate controlled-demo boundaries.

### Still required in preview

- visual wrapping at desktop, tablet, and mobile widths;
- naturalness review by a Taiwan Traditional Chinese reader;
- focus/scroll continuity after switching locale on a long comparison result.

## Accessibility review

### Accepted from markup/source

- semantic headings, cards, lists, table, row/column headers, forms, field labels, and status text;
- checkbox controls with screen-reader-only project labels;
- warnings include text and are not color-only;
- skip link and focusable main content;
- loading and error boundaries;
- reduced-motion handling;
- desktop scroll region and mobile non-table alternative;
- disabled action is explicitly disabled rather than pretending success.

### Still required in browser QA

- actual keyboard order and visible focus at all breakpoints;
- screen-reader announcement quality;
- contrast measurement;
- zoom at 200%;
- no mobile horizontal overflow;
- focus behavior after server-action redirects.

## Test and architecture review

Stage 6 adds coverage for:

- route identifier and selection bounds;
- canonical URL restoration;
- immutable strongest-three behavior;
- ranking/economics display;
- insufficiency, stale, unknown, and restricted semantics;
- localization parity and terminology;
- presentation-layer repository/calculation boundaries;
- locale query-state preservation;
- Project Workspace hero entry;
- real signed-session PostgreSQL hero flow;
- measured seeded hero pipeline.

All prior migration, fixture, SQL, authorization, ranking, economics, persistence, build, and dependency gates remain blocking.

## Required merge conditions

PR #26 may merge only when its exact reviewed head passes:

- formatting;
- lint;
- strict TypeScript;
- all migrations and fixture seeds;
- Stage 1–5 SQL verification;
- all unit/application/repository/architecture/integration tests;
- production Next.js build;
- production dependency audit.

## Required release conditions after merge

Merging Stage 6 does **not** by itself authorize a public demo-domain cutover.

Before controlled release, the isolated preview must complete:

- desktop/tablet/mobile visual review;
- English and Traditional Chinese walkthrough;
- keyboard and screen-reader smoke test;
- real browser route restoration and locale switching;
- observed performance baseline;
- screenshots and Design Critic sign-off;
- no critical/high UX, accessibility, security, or evidence defects.

## Final review conclusion

The implementation is coherent, deterministic-first, authorization-safe, and appropriately bounded. It is suitable for exact-head functional acceptance and merge once CI passes.

The interface should not yet be described as visually flawless or release-ready until the isolated preview makes the rendered experience observable and the remaining browser checks pass.
