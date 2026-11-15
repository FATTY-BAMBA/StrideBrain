# Stage 6 — Structured Comparable-Project Experience

**Status:** implementation candidate  
**Governing issue:** #25  
**Experience contract:** `comparison-experience.v1`  
**Structural input:** `comparable-project-stage4.v1`  
**Economics input:** `comparable-project-stage5.v1`

## Outcome

Stage 6 turns immutable, authorized Stage 4 and Stage 5 results into the first complete user-facing StrideBrain workflow:

```text
authorized Xinyi Project Workspace
  → “Have we done something like this before?”
  → deterministic comparable-project cards
  → select up to three precedents
  → structured project and commercial comparison
  → visible insufficiency / stale / conflict / restricted states
  → structured review without model prose
```

The result remains fully useful with every AI/model service disabled.

## Runtime composition

### Server-only runtime

`src/lib/server/` contains the Stage 6 composition roots:

- `prisma.ts` creates one lazy Prisma/PostgreSQL server runtime;
- `runtime-context.ts` resolves identity only from the signed HTTP-only demo-session cookie and current persisted membership, capability, and assignment state;
- `comparison-services.ts` composes the Stage 4 and Stage 5 application services behind repository adapters;
- `project-workspace-services.ts` composes the Stage 3 Project Workspace use case.

URL parameters and browser state cannot select an organization, role, membership, assignment, authority state, financial amount, score, or source.

### Project Workspace entry

The authorized project overview now renders through `GetProjectWorkspace` rather than a hard-coded demo card. It shows permission-safe project context, current commercial state, evidence health, and the contextual hero question.

The comparison journey begins from the current project:

```text
/en/projects/PRJ-XINYI-026
/zh-TW/projects/PRJ-XINYI-026
```

and links to the canonical Compare surface only when `canRunComparison` is true.

## Canonical route and restoration

The Compare route is:

```text
/{locale}/projects/{projectKey}/compare
```

Stored result state is represented only with bounded business-safe identifiers:

```text
run={comparisonRunId}
economics={economicsRunId}
selected={projectBusinessKey,projectBusinessKey,...}
```

The route parser:

- accepts only bounded safe identifiers;
- removes duplicates;
- caps selected projects at three;
- filters requested selections against the authorized immutable Stage 4 result;
- uses the stored strongest-three default when no valid selection remains.

Refresh, back/forward navigation, deep links, and English/Traditional Chinese switching preserve the run and selection rather than silently recomputing old results.

## Governed server actions

### Run comparison

The first action:

1. resolves trusted RuntimeContext;
2. runs the Stage 4 structural comparison;
3. persists the immutable Stage 4 result;
4. runs Stage 5 economics for the stored default strongest-three selection;
5. redirects to the canonical result route.

### Update selected precedents

Changing the selected set:

1. reopens the immutable Stage 4 run under current authorization;
2. validates the active project and selected business keys;
3. limits selection to three authorized candidates;
4. creates a new immutable Stage 5 enrichment;
5. redirects to the new economics-run route.

It never changes Stage 4 ranking, scores, factors, or source snapshots.

## Permission-safe presentation composition

`buildComparisonExperience` is a pure formatter over stored Stage 4 and Stage 5 DTOs.

It may:

- localize names and labels;
- format stored decimal strings;
- select stored factor summaries;
- map stored authority/sufficiency states into UI states;
- arrange the stored result into cards, tables, and synthesis sections.

It may not:

- query Prisma;
- call repository adapters;
- calculate similarity;
- recalculate authoritative economics;
- change authority or conflict state;
- add model-generated claims.

A run-ID mismatch between Stage 4 and Stage 5 fails closed.

## User experience

### Comparable-project cards

The card grid shows:

- rank and deterministic score;
- Strong / Relevant / Partial / Broader band;
- evidence coverage;
- project context;
- strongest factors;
- important differences;
- unknown factors explicitly distinguished from mismatches;
- authorized quoted/actual availability;
- stale and insufficiency warnings;
- keyboard-accessible selection.

### Structured comparison

The comparison table supports the current project plus up to three selected precedents. It keeps these concepts visually and textually separate:

- quoted price;
- supplier offer;
- forecast direct cost;
- reconciled actual cost.

Rows cover project context, programme, overall economics, imported stone, lighting/electrical, custom millwork, supplier context, and evidence/sufficiency state.

Desktop uses a semantic comparison table with a sticky row-label column. Mobile uses a stacked per-project comparison with no horizontal trap.

### Structured review

The deterministic synthesis renders:

- What history suggests;
- Important differences;
- Evidence gaps;
- Recommended next review.

It preserves the accepted Horizon behavior:

- overall quoted history above-baseline finding;
- overall forecast-versus-actual finding;
- imported stone as the strongest supported variance;
- lighting actual-cost abstention;
- accelerated programme shown as meaningful but unquantified;
- internal review recommended without claiming that the quote is wrong or a supplier is overcharging.

Stage 8 action creation remains disabled and explicitly labeled as future work.

## Bilingual and accessibility behavior

Stage 6 includes complete English and Taiwan Traditional Chinese comparison copy. Critical authority terminology remains distinct in both locales.

Implemented accessibility behavior includes:

- semantic cards, lists, tables, sections, and labels;
- keyboard-operable project selection;
- visible focus inherited from the application design system;
- skip link and focusable main content;
- screen-reader-only selection labels;
- warnings that do not depend on color alone;
- immediate route skeleton;
- route error boundary;
- reduced-motion handling;
- query-preserving language switching behind a Suspense boundary.

## Safe result states

The route can render:

- start state;
- complete structural + economics result;
- structural-only/restricted economics;
- insufficient actual-cost evidence;
- stale supplier evidence;
- conflicting evidence;
- context incomplete;
- no eligible history;
- unavailable stored run;
- safe generic comparison/economics failure;
- loading skeleton.

Restricted responses do not expose hidden financial values, counts, source IDs, or exclusion reasons.

## Validation

Stage 6 adds tests for:

- safe route parsing and canonical URLs;
- authorized selection filtering and maximum-three behavior;
- stored-result view composition;
- canonical ranking and economics display;
- lighting actual-cost abstention;
- unknown-versus-mismatch semantics;
- English/Traditional Chinese structural parity;
- authority terminology;
- presentation-layer repository/calculation boundaries;
- query-state preservation on locale switch;
- real Project Workspace entry wiring;
- seeded PostgreSQL hero pipeline using a real signed session, Stage 4 service, Stage 5 service, persistence, reopenable DTOs, and the Stage 6 composer;
- measured seeded hero-pipeline duration.

All Stage 1–5 migrations, fixtures, SQL verification, authorization tests, ranking tests, economics tests, build gates, and dependency audit remain mandatory.

## Explicit non-goals

Stage 6 does not add:

- the full Stage 7 evidence drawer/source preview;
- Stage 8 ProposedAction/Action/AuditEvent writes;
- Stage 10 model explanation;
- semantic/vector scoring;
- arbitrary document upload or OCR;
- real customer data;
- external email, LINE, supplier, or client communication;
- quote approval;
- a Vercel project, live demo-domain cutover, or marketing-site change.
