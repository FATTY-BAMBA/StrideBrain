# StrideBrain v0.1 — Implementation Sequence

**Status:** Reconciled build plan for review  
**Scope:** Issue #7 and the first Comparable Project Intelligence vertical slice

## 1. Sequencing principle

Build one complete, testable outcome through the stack.

Do not build all screens, all agents, all integrations, or all future StrideGraph objects horizontally.

Each stage has an exit gate. Later stages may begin only when their prerequisites are reviewable and stable enough to prevent rework.

## Stage 0 — Application and quality scaffold

### Build

- Next.js App Router + strict TypeScript;
- formatter/linter;
- test runner;
- environment validation;
- `zh-TW`/`en` route/catalog foundation;
- base application shell;
- modular folder boundaries;
- CI for format/lint/type/unit/build/localization;
- safe error/result primitives;
- no fixture/product screen implementation yet beyond shell.

### Exit gate

- local/CI production build passes;
- architecture boundary review passes;
- no client secrets;
- route locales work;
- critical catalog parity test exists;
- no direct Prisma/fixture imports in UI skeleton.

## Stage 1 — Persistence schema and fixture validator

### Build

- Prisma/Postgres setup;
- first bounded migration from Build Contract;
- domain/repository mapping types;
- exact-decimal calculation package;
- Horizon Atelier seed framework;
- fixture invariant validator;
- reseed/reset command for synthetic preview;
- migration/seed CI.

### Exit gate

- schema validates/generates;
- migrations apply to clean DB;
- seed is atomic/repeatable;
- every private row organization scoped;
- quote/forecast/offer/actual tables distinct;
- line totals/evidence/version/relationship validators pass;
- no named-fixture branching in services/components.

## Stage 2 — Runtime context and authorization

### Build

- L1 signed demo session adapter;
- fixture users/memberships/roles/grants;
- RuntimeContext resolver;
- capability and project-access service;
- organization-scoped repository base patterns;
- non-disclosing unavailable errors;
- Viewer/Mei/Reviewer/Admin test fixtures;
- cross-tenant test organization/data.

### Exit gate

- browser cannot choose organization/role;
- assigned/unassigned project tests pass;
- explicit deny overrides grant;
- Viewer actual read denied;
- cross-org project/evidence/run/assignee reads denied;
- capability DTO for presentation does not replace server auth.

## Stage 3 — Project workspace read model

### Build

- ProjectWorkspaceQuery;
- project header/read DTO;
- active QuoteVersion/ForecastCostVersion summaries;
- evidence health summary;
- open actions summary;
- project Overview route;
- project local navigation;
- loading/unavailable/incomplete/redacted states;
- bilingual labels and responsive shell.

### Exit gate

- Xinyi project renders entirely through repositories/use case;
- no fixture data hardcoded in components;
- quoted price and forecast direct cost separate;
- Viewer redaction works;
- project useful content target measured;
- five-second comprehension design QA passes.

## Stage 4 — Deterministic eligibility and similarity core

### Build

- ActiveProjectContextService;
- candidate repository query;
- `CPI-ELIGIBILITY-1.0`;
- `CPI-SIM-1.0` factor functions;
- evidence coverage;
- bands/ties/order;
- canonical factor/calculation tests;
- ComparisonRun/Candidate/Factor persistence;
- comparison endpoint/use case;
- loading/empty/context-incomplete/failure DTOs.

### Exit gate

- exact canonical top-six order/scores;
- factor reconciliation exact;
- unknown optional factor behavior passes;
- unauthorized candidate absent before scoring;
- performance/query-count baseline recorded;
- structured comparison result persists/reopens.

## Stage 5 — Commercial authority, economics, and evidence claims

### Build

- authority/freshness/supersession/conflict policy;
- quote/forecast/actual/supplier-offer repositories;
- normalized median/variance calculations;
- sufficiency rules;
- ComparisonClaim/Evidence bindings/calculation traces;
- hero overall/category findings;
- safe exclusion summaries;
- permission-specific result mapper;
- lighting insufficiency and conflict/stale fixture cases.

### Exit gate

- quote-only never enters actual;
- stale/superseded/conflicted behavior passes;
- lighting actual range abstains 2/3;
- hero percentages within tolerance;
- Viewer actual claims/evidence/counts absent;
- every material finding has exact evidence;
- structured synthesis generated without AI.

## Stage 6 — Structured comparison experience

### Build

- Compare route and route restoration;
- ComparisonRunSummary;
- match cards/grid;
- selection up to three candidates;
- factor detail;
- comparison table/compact/mobile modes;
- synthesis panel;
- all accepted comparison/insufficiency/conflict/stale/restricted states;
- no optional AI yet.

### Exit gate

- complete hero comparison usable with AI disabled;
- design critic hierarchy/badge/density requirements pass;
- mobile/keyboard flows pass;
- quote/forecast/actual visually distinct;
- language switch preserves run/selection;
- structured result performance budget passes.

## Stage 7 — Evidence panel

### Build

- claim evidence endpoint/use case;
- evidence panel modes;
- source cards and locator display;
- factor/calculation trace;
- conflict/supersession/stale/insufficiency presentation;
- safe preview metadata/content;
- source deep-link/return context;
- loading/failure/access-change states;
- focus/open/close behavior.

### Exit gate

- every hero amount/finding opens correct evidence;
- source supports exact claim;
- access rechecked per open;
- no raw storage URL;
- panel p95 ≤500 ms after result;
- focus/accessibility tests pass;
- source-return context passes.

## Stage 8 — Internal review action and audit

### Build

- ProposedAction generation/persistence;
- action review sheet;
- authorized assignee query;
- mandatory evidence/uncertainty validation;
- idempotency key/uniqueness;
- fingerprint/stale recheck;
- atomic Action + ActionEvidence + AuditEvent + proposal consume;
- receipt and project action list integration;
- stale/permission/assignee/service/duplicate states.

### Exit gate

- authorized hero action succeeds with correct receipt;
- Viewer direct API/UI action denied;
- cross-org identifiers rejected;
- stale run rejected;
- retry returns same receipt;
- simulated transaction failure creates no partial records;
- action p95 target passes;
- audit linkage reconstructs actor/run/evidence/edits.

## Stage 9 — Full quality/eval hardening

### Build/verify

- complete bilingual E2E;
- accessibility automation/manual keyboard QA;
- visual QA/regression baselines;
- canonical ranking/economics/evidence evals;
- cross-tenant/security tests;
- performance benchmark and query plans;
- build/deploy smoke tests;
- known limitations/release evidence package;
- rollback/reseed runbook.

### Exit gate

- all blocking Acceptance Matrix items pass;
- critical/high security findings 0;
- critical bilingual/accessibility regressions 0;
- evidence precision target met;
- exact preview commit/deployment identified;
- human release review recorded.

## Stage 10 — Optional verified explanation

### Prerequisite

Stages 0–9 pass without requiring AI.

### Build

- feature-flagged OptionalExplanationService;
- authorized/redacted claim input;
- provider timeout/budget/error handling;
- claim/citation verification and bounded repair;
- separate pending/available/unavailable UI;
- faithfulness/bilingual evals.

### Exit gate

- structured result unchanged with feature on/off/provider failure;
- unsupported IDs/amounts/causation rejected;
- lighting insufficiency preserved;
- no business write path;
- p95 ≤12 s or safely unavailable;
- provider/model plumbing hidden from normal UX.

## Stage 11 — Isolated preview and controlled release review

### Build/operate

- new Vercel project connected to `StrideBrain` only;
- PR previews;
- controlled demo environment variables/DB;
- stable preview alias (not live demo domain yet);
- monitoring/error telemetry;
- release/rollback verification.

### Exit gate

- exact release tree passes all gates;
- preview hero flow works in both locales;
- old/new comparison documented;
- domain cutover plan separately approved;
- no claim of L2/production readiness.

## Explicitly deferred work

Not allowed to enter stages opportunistically:

- arbitrary file upload/OCR;
- semantic/vector search;
- model marketplace;
- AI Team/agent catalogue;
- external email/LINE;
- quotation approval;
- conflict-resolution workflow;
- connectors;
- analytics dashboards;
- generalized project coordinator;
- real customer data;
- `demo.primestrideai.com` cutover.

These require separate product decisions after the first slice passes.

## Pull request discipline

Recommended implementation PR boundaries:

1. scaffold/CI;
2. schema/seed/validator;
3. runtime context/authorization;
4. project workspace;
5. comparison core/run persistence;
6. authority/economics/evidence claims;
7. structured comparison UI;
8. evidence panel;
9. action/audit;
10. quality/performance hardening;
11. optional AI;
12. preview release.

Each PR includes:

- linked stage/acceptance IDs;
- tests;
- screenshots where UI changes;
- known limitations;
- architecture/security impact;
- migration/rollback notes where relevant;
- independent reviewer result.

## Build stop conditions

Stop and return to Product/UX/Technical review when implementation would require:

- a new top-level product surface;
- changing similarity/authority policy;
- weakening permission/evidence rules;
- introducing a new business write/action type;
- adding real customer data;
- making optional AI authoritative/blocking;
- copying old prototype architecture;
- exceeding the accepted first-slice scope.