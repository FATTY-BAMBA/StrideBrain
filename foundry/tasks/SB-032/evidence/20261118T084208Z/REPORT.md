# SB-032 scoped repair and independent retest

Run: `20261118T084208Z`. Verdict: **PASS_SCOPED_REPAIR**. Task state: **IN_QA**. Full Stage9 and release acceptance remain incomplete.

Local branch: `build/sb-032-stage9-quality-hardening`.
Repair commit: `4628fb759c8bac23cf92eb15992259fb366a8d65`.
Direct parent: `1bde2114d010c694d017ba2b4116ceffab3569e1`.
BUILD_ID: `jZBGrkhs4Ok9XriINHgub`.
Browser: Google Chrome 157.0.8103.79 on macOS 26.2.
No push, merge, deployment, Vercel or DNS change. Current-head GitHub CI has not run; CI44240367670 PASS applies to the published parent only.

## Confirmed causes and bounded repairs

- S9-F02: workspace/evidence-health badges interpolated internal enum values. Exhaustive presentation maps now cover six workspace and five evidence-health states in en/zh-TW, without changing domain values or state/authorization semantics.
- S9-F03: loading accessible name was hard-coded English. The loading boundary now reads the route locale and exposes a named busy status; skeleton and motion CSS are unchanged.
- S9-F04: one-to-one comparison/enrichment uniqueness prevented another immutable economics result; comparison-scoped claim uniqueness also collided across enrichments. The client editor additionally lacked reset on persisted result identity, and evidence navigation could retain older economics URL selectors. Strict submitted cardinality/authorization, deterministic selection order, enrichment-owned claims and route/editor identity now agree.

Independent plan review approved the necessary schema correction **before implementation**. Migration0009 makes comparison→enrichment one-to-many, adds nullable claim enrichment ownership with tenant/comparison FK and per-enrichment uniqueness, and preserves null structural-claim uniqueness. Backfill validates snapshot identity/shape, both ownership directions, ambiguity and content before assigning ownership. Eight historical migrations are unchanged. No sufficiency, financial/evidence authority, authorization, tenant, action or similarity policy changed. No global latest-wins or economics deduplication rule was added.

## Validation

Complete deterministic gate PASS:643 tests across70 files;67 targeted,37 localization and93 PostgreSQL adversarial tests are included subsets, not additive counts. Format, lint, strict TypeScript and Prisma validation/generation PASS. One pre-existing prisma.config.ts lint warning remains. Nine clean migrations, two repeated seed/8-SQL-verification rounds, populated history upgrade and seven fail-closed migration rollback cases PASS. Production build PASS. Production dependency audit:0 vulnerabilities. Independent final source review PASS.

[Gate summary](gate-summary.json), [source review](independent-source-review.md), [migration safety](migration-safety.md), [exact changed files](repair-commit.json).

## Targeted actual-browser acceptance

| Finding | en1440 | en768 | en390 | en320 | zh1440 | zh768 | zh390 | zh320 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S9-F02 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| S9-F03 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| S9-F04 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Exact viewports:1440×900,768×1024,390×844,320×740. Canonical workspace Ready/Good is real browser coverage; all other finite states are deterministic rendering coverage. English and zh-TW natural desktop loading were observed. Full loading grid uses genuine UI/AX during a disclosed45-second read lock on the fresh ComparisonRun table, automatically rolled back with zero row writes; not a performance measurement. Initial settled diagnostic zh frames are excluded from pending proof.

Every grid cell executed ABC→AB→ABC. Both locales also exercised A→AB→AC→ABC→DEF→ABC, empty chooser blocking, maximum-three controls and old-result/evidence reopen. AB/one-project economics are valid insufficient results; unchanged action policy correctly forbids preparing unsupported review actions. Three-project eligible review preparation uses the exact current enrichment. First EN1440 AB evidence was reopened later as an explicit historical AB route, not falsely described as an immediate-transition screenshot.

Representative first-cell lineage:

| Transition | Economics run | Selected keys |
| --- | --- | --- |
| A1 | `econrun_e3eeffb8-e226-490e-b20b-bd98808d5ee4` | Neihu,Zhongshan,Nanjing |
| B | `econrun_1a348786-053e-49e4-bef4-1d4bad2e0e89` | Neihu,Zhongshan |
| A2 | `econrun_2586d94a-2e96-43f5-899c-b74c1da8e43d` | Neihu,Zhongshan,Nanjing |

All share immutable `cmprun_758f9cdf-a26f-4c19-a95f-44cca63632e4`. A1/B/A2 snapshots remain unchanged. Canonical ranks remain88/81/79/71/69/63. Targeted phase produced29 immutable enrichments,350 owned claims and8 preparations with no confirmed action. Final DB corroboration checked105 browser route observations against result/selection/claim/source/proposal lineage, with zero mismatches.

[Independent browser verdict](browser/targeted-browser-results.json), [eight-cell observations](browser/f04-grid.json), [frozen targeted database proof](operator-lineage-targeted.json), [final lineage verification](lineage-verification.json).

## Broader baseline resumed within scope

After targeted PASS, EN desktop and zh-TW mobile core journeys exercised factor/source/Escape, current claim/insufficiency, bounded edited drafts, locale/refresh/back-forward/evidence navigation, explicit confirmations, receipts, Project Actions reopen and copied receipt routes. Both passed for this scope. Two intentional synthetic actions each have exactly one matching receipt/audit and15 evidence references, correct current economics and consumed proposal. This continuation is not a full22-scenario Stage9 rerun.

[Continuation result](browser/baseline-continuation-results.json), [atomic action proof](action-integrity.json).

One immediate cancel→locale attempt is **UNVERIFIED_OBSERVATION**: it initially remained EN, then switched after cancellation settled. Independent review found insufficient evidence to establish a new required-path defect. Focused immediate/settled activation/timing/route/draft follow-up remains; no pass or additional repair is invented.

## Cleanup, preservation and limits

One browser QA session revoked; issuer stopped; owned tab closed. All original fixture/history rows unchanged; new history retained. Four immutable guards and nine migration hashes match before/after. The read lock rolled back; no fixture mutation or retained-history reseed occurred.129 screenshots have exact recorded CSS/pixel dimensions and ordinary JFIF metadata with no EXIF. Prior1150 Stage9 evidence files and1577 original Stage8 workspace files/678 untracked file names remain unchanged.

Viewport.reset returned, but automatic approval review rejected the subsequent read-only page-geometry check after revocation. It was not retried; tab closure was verified through browser metadata. Numeric restored viewport is unverified. This cleanup/tooling observation affected no completed product test and is not classified as a product defect.

Sanitization: PASS. No credential, cookie, bootstrap URL, database credential, private/personal path or known-runtime-secret leak found in the scoped artifacts/public assets. [Cleanup proof](cleanup.json), [historical preservation](historical-preservation.json), [Stage8 workspace preservation](stage8-workspace-preservation.json).

M-01/M-02/M-06/M-07 remain BLOCKING_BEFORE_DEMO_RELEASE. M-05 remains STAGE_9_HARDENING. No speech/device/date-boundary/human-language, native200%zoom or OS-reduced-motion acceptance is inferred from this run. Full persona/conditional-state/quantitative/retry/recovery coverage, current-head publication/CI and human release review remain. Security/performance waves were not started. No Stage9, demo, merge or release readiness claim.

## Files in the local repair commit

- `prisma/migrations/0009_stage9_economics_selection_lineage/migration.sql`
- `prisma/schema.prisma`
- `src/app/[locale]/projects/[projectKey]/compare/actions.ts`
- `src/app/[locale]/projects/[projectKey]/compare/loading.tsx`
- `src/app/[locale]/projects/[projectKey]/compare/page.tsx`
- `src/components/comparisons/comparison-experience-client.tsx`
- `src/components/projects/project-workspace-overview.tsx`
- `src/modules/comparison-experience/copy.ts`
- `src/modules/comparison-experience/route-state.ts`
- `src/modules/localization/workspace-state-copy.ts`
- `src/repositories/prisma/prisma-economics-enrichment-run-repository.ts`
- `src/repositories/prisma/prisma-economics-observation-repository.ts`
- `tests/comparison-experience/selection-action.test.ts`
- `tests/comparison-experience/selection-lineage-postgres.test.ts`
- `tests/comparison-experience/selection-navigation.test.ts`
- `tests/evidence-panel/modal-focus.test.ts`
- `tests/localization/stage9-workspace-loading.test.ts`
