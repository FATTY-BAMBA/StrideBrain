# SB-050 verification

Pull request: [#51 — SB-050](https://github.com/FATTY-BAMBA/StrideBrain/pull/51).

Hosted acceptance: **WAITING FOR THE PRODUCT DIRECTOR**. Keep the single pull request in draft. No agent deployment, hosted migration, seed, settings change or hosted browser session was performed.

## Implemented in A → B → C order

A exposes the existing quoted-history category aggregation without a current quote, preserves its authority/normalization/median rules and required-count constant, and adds `QUOTE-DRAFT-1.0` and exact 5% tax totals. Current zero-valued quotes are valid; a draft is explicitly excluded from past quoted history even if its authority were incorrectly marked approved.

B adds the scoped quote port, serializable Prisma adapter, read-only preparation, transactional save and `quote:draft`. Matching concurrent retries return the original receipt. New versions supersede the preceding draft. Evidence JSON stores the original basis, date, source IDs and manual-entry actor; the audit names changed quote-item IDs/categories, comparison runs, policy version and carried-over/refreshed mode.

C adds the bilingual Quote tab, editable amount/description, server totals, explicit refresh/use-suggestion actions, existing evidence panel and explicit first-save stage transition. Home adds Draft quote in the required order, counts all visible claim cards including overall findings, and shares the finance formatter with Quote and overview.

## Review changes and current verification — 22 November 2026

- Draft policy, baseline input, canonical validation, editable-draft recognition, required-category checks and the screen now use `Project.commercialCategoryIds`. The inverse of the existing server scope mapping determines pricing coverage. Two demolition/ceiling scopes yield one combined pricing line; partial coverage retains the exact combined reference rate/range and sources, suppresses the suggested amount, and renders the requested sentence naming both scope lists. Coverage-only changes mark the recorded basis stale without modifying it or the entered amount. Out-of-date rows show that notice instead of describing old scope coverage as current.
- Rates display as whole dollars rounded half up with fixed-decimal helpers; areas display without fractional trailing zeros. Each amount input also displays `formatMoney`. Browser/database assertions confirm that the visible `NT$5,833` still stores `5833.333333`, and area `640` still stores `640.000`; `641` and `641.5` were also inspected.
- New lines store each category’s own English and zh-TW labels. Editing one language preserves the other language’s stored text, including typed descriptions. No schema or fixture changes were needed for this review.
- **Node 24.22.3 `npm run check`: PASS, all 1,055 tests across 102 files, including PostgreSQL tests; format, lint, types and production build passed.** The existing Prisma config lint warning remains. [Current full output](evidence/review-check.log). The fixture-reseed test passed in this complete run; the initial implementation’s timeout/retry below is historical.
- Focused regression coverage: complete and partial pricing coverage; no allocation/splitting; required commercial categories; current saved-price comparison; coverage-only staleness; unchanged basis across edits; language defaults and independent renames; exact rounding/area display; existing permission, tenant, idempotency, audit and source-access denials.
- Local production HTTPS Chrome: 26 refreshed screenshots, English/zh-TW, 390px viewport, versions 1–3 without reranking, explicit refresh, source panel, partial-coverage manual amount, scope-change staleness, default/renamed descriptions, roles and saved combined-line findings. A price equal to the baseline has no warning card; changing the combined price to NT$5,000,000 produced its price-variance finding. No browser console/page errors; final local server logs clean.
- Comparison eligibility, selection and history-count requirements remain unchanged. In the current synthetic fixture, jobs with only the two demolition/ceiling scopes select fewer than three primary prices, and ceilings alone has no primary comparison. The pure policy test isolates exactly those two scopes with sufficient history; database/browser suggestion checks additionally include Custom millwork and Imported stone to obtain three selected prices. The new commercial mapping does not invent extra eligible history.
- Hosted acceptance is **waiting for the Product Director**. PR #51 stays draft; no hosted deployment, migration, seed or settings changes were performed.

## Initial implementation checks (before this review)

- Node 24.22.3 `npm run check`: **PASS** (880 tests passed; 169 PostgreSQL cases skipped in that run; production build passed). Includes format, lint, TypeScript, tests and production build. The existing `prisma.config.ts` anonymous-default-export lint warning remains; no new lint warnings.
- Shared baseline equals the pre-existing economics category aggregate without any current quote. Rounding tests straddle the half-thousand boundary and cover values beyond binary-float precision. Insufficient history has no suggestion; cost aggregates cannot suggest a quoted price.
- PostgreSQL-enabled run: **1,048 passed; one existing fixture-reseed subprocess timed out** (`spawnSync npm ETIMEDOUT`). That single test passed on focused retry with cached pinned dependencies in offline mode (1 passed, 94 unrelated tests skipped). An earlier full PostgreSQL check also passed all 1,048 tests before the final compatibility assertion was added. No timeout or test limit was weakened. Real PostgreSQL tests use randomly named disposable local databases and committed migrations/fixtures. They cover preparation without writes; same-member/current-source fingerprints; source panel access; concurrent matching retries; changed-input rejection; successive versions without a comparison rerun; superseding; audit; area/scope changes; explicit refresh; source conflicts; Viewer/finance/structural/other-tenant denials; actual-cost absence; and loss of access to one underlying source.
- After saving, Home returns out of date; rerunning comparison reads the new quote amounts. Home Draft quote disappears after save. Xinyi's Home count is 12 other visible claim cards.
- Local production HTTPS browser: owner creates a two-scope job, prepares, opens source records, edits an amount, saves versions 1–3 without rerunning comparison, explicitly moves to Quote review, changes area, observes stale suggestions and preserved amounts, refreshes after comparison, explicitly adopts a suggestion and saves version 4. The initial scope-based missing-history check is superseded by the commercial-category and partial-coverage checks in this review. English and zh-TW, finance read-only, Viewer without amounts, project-manager editing, Home counts and overview money were checked. Browser console/page errors: none.
- Existing quotes with duplicate categories or noncanonical detailed lines remain read-only. One canonical commercial line per category can be edited; lines are never merged or split.
- Disposable local browser sessions were revoked, the browser database was dropped, and its invitation/signing/TLS private files were removed.
- `git diff --check` passes. All financial calculations stay in domain/finance code. No model call or feature-level data-mode gate was added.

## Schema and fixture evidence

`EvidenceReference.locator` and `supportedValue` JSON can hold the full versioned provenance, so **no provenance table or column migration is needed**. The sole migration extends the existing capability CHECK constraint to include `quote:draft` and the already-supported project-write capabilities. It is forward-only and does not alter financial rows.

`quote-draft.sql` adds explicit finance/Viewer denies and a synthetic conflicting reading of the past imported-stone quote line on `PRJ-HIST-018`; `verify-quote-draft.sql` checks both. Existing authority policy excludes conflicted records. A selected-source conflict is also exercised through Prepare and the existing panel in the PostgreSQL test.

Draft lines use the stored commercial categories. Demolition and partitions/ceilings share one pricing line; partial coverage keeps the past combined rate as a reference without suggesting an amount. The existing comparison selection and history-count rules remain unchanged. A category line uses quantity 1 lot; its maximum input is constrained by the existing unit-price column (14 integer digits, two decimals), not by a floating-point limit.

## Not verified

- Hosted acceptance, hosted migrations/seed, hosted deployment and test-site settings: waiting for the Product Director using [TEST_SITE.md](../../../docs/development/TEST_SITE.md). The agent did not perform them.
- Real tenant data, issuing/PDF/export/client acceptance, currencies other than TWD, alternative taxes, 坪, detailed line editing and imported-quote conversion are outside #50.
- Browser coverage is local Chrome desktop and a 390px mobile viewport, not a physical device or a cross-browser matrix.

## Product Director test-site clickthrough

1. Use the Test site workflow to put this draft PR on the test site and apply its committed migration/fixtures through the documented workflow. Sign in as owner.
2. Create a job with Custom millwork and Imported stone, run comparison, open Quote and Draft a quote. Check rates × area rounded to NT$1,000, flags and source panels.
3. Change one amount, save, inspect version/tax/total, then edit/save twice without rerunning comparison. Confirm the basis/date remain unchanged and Home marks its saved comparison out of date.
4. Run comparison, Refresh suggestions, confirm entered amounts remain, and choose Use suggestion for one line. Save. If testing an area/scope change, verify stale rows, preserved amounts and a new category without a suggestion.
5. Try Partitions and ceilings without Selective demolition for the partial-coverage reference/manual-entry path (include Custom millwork and Imported stone to obtain enough primary history from the current synthetic fixture). Check the synthetic quote conflict with selected supporting history and inspect its evidence.
6. Check finance read-only and Viewer structural-only access; repeat labels/source inspection in zh-TW. On Xinyi, compare Home's “12 more findings” with the other claim cards. Check `NT$` on Home, overview and Quote.
7. Only the Product Director's successful hosted clickthrough completes acceptance; the PR stays draft until then.

## Evidence

See the current [browser verification](evidence/browser-verification.json) and [screen index](evidence/README.md). All screenshots use disposable local synthetic data. Initial implementation outputs (superseded by the current full check above): [npm run check](evidence/check.log), [PostgreSQL run](evidence/postgres-check.log), and [successful fixture-reseed retry](evidence/reseed-retry.log). Current GitHub CI status is attached to [draft PR #51](https://github.com/FATTY-BAMBA/StrideBrain/pull/51/checks).
