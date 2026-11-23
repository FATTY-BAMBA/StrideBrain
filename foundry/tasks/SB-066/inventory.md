# SB-066 inventory — before behavior changes

Baseline: `6310c1628e4a2e82e9647bc02cdd297326f6b363`. Scope: every matching production TypeScript/TSX reader or declaration under `src/`; fixture modules are excluded. Line references below are for this baseline. No behavior has changed.

## Findings and delivery plan

| Area                    | Current behavior and required change                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Client persistence      | `Client` has organization/key, bilingual names, fixed type and active status. Job creation creates clients in its existing audited transaction. Add bounded optional contact fields; separate client read/write capabilities, tenant-scoped list/detail/edit queries and audited changes. Existing project and assistant name-only DTOs must stay name-only. |
| Quotes                  | Versions live below Quote and Project, with issued snapshots. Add an authorized cross-job read model and status filter, omitting amounts for Viewer. Version-list semantics await the Product Director.                                                                                                                                                      |
| Documents               | Issue preparation reads client names; snapshot and PDF contain name/attention only. Add optional contact/address/tax fields to newly issued snapshots; absent fields preserve old snapshot rendering.                                                                                                                                                        |
| Job choices             | Four form subtypes, seven scope keys and six pricing keys; their union has eight work-category keys. The two demolition/ceiling scope keys share one pricing parent. Seed the existing keys/mapping without changing stored IDs. Three additional subtype labels exist for historical non-retail jobs and must retain their meaning.                         |
| Labels and recognition  | Labels and bilingual aliases are static in jobs/project-context, with another category/unit table in evidence-panel. Callers span Home, chat, comparisons, proposals and quote drafts. Move tenant-specific labels/aliases to loaded data; preserve canonical keys and observation types.                                                                    |
| Comparison              | Only the related-subtype table moves to data. Factor weights, eligibility, normalization, tie ordering, score bands and financial rules remain fixed. Capture ranking, exact scores, claims and both-language finding sentences before migration; assert equality after. Stop for Product Director review on any difference.                                 |
| Quote drafts            | Category validation, inverse coverage mapping, line ordering and default descriptions are constant-driven. Save currently stores quantity 1 / unit lot. Read active choices/current labels and preserve retired entries already used. Existing issued document descriptions remain immutable.                                                                |
| Area and rates          | Stored project areas and comparisons use m2 at scale 3; entry is m2 and #62 converts numeric 坪. Add firm input/display preference using exact conversion; retain canonical m2 for calculations. Audit all area and rate labels so changing display units never relabels unchanged numbers.                                                                  |
| Navigation and Settings | Home, Projects, then Knowledge and Customer care (planned). Insert Quotes and capability-gated Clients. Add owner firm-list controls beside existing firm document/AI settings.                                                                                                                                                                              |

## Decisions pending

- Whether a used category's priced-under mapping is locked, or versioned for future jobs while preserving existing jobs.
- Whether Quotes shows every version or only each quote's current version.

No dependent behavior will be implemented until these are resolved. Independent inventory, baseline verification and client detail work can proceed.

## Schema and fixture readers

`prisma/schema.prisma`: Organization, Client, Project, ProjectScope, Quote, QuoteVersion, QuoteItem, QuoteDocumentDetails. Existing fields use strings for keys/subtypes/units; scope labels are also copied into ProjectScope rows. New tables need organizationId and compound unique [id, organizationId], tenant-aware relations/indexes and audited writes. Existing migrations will not be edited. Seed existing organizations in a new migration; the synthetic reset fixtures must also populate lists because they insert organizations after migrations on a clean database.

The fixture SQL under `prisma/fixtures/` owns synthetic labels/keys and old comparison/quote meaning. Tests and fixture data may retain literal keys; production code must not. `tests/assistant/database-fixture.ts` and integration fixture loaders need the new fixture. No hosted migration/seed is permitted.

## Mechanical source inventory

These are the baseline line hits, grouped by responsibility. Contracts are included because widening a DTO can expose client contacts to unrelated readers. CSS and generic React `use client` declarations are excluded.

### Fixed lists, labels, relationships and category order

- `src/app/[locale]/home-chat-actions.ts` — lines 9, 441, 553, 555
- `src/components/projects/new-job-form.tsx` — lines 6, 7, 12, 13, 173, 213, 222
- `src/components/quote-draft/quote-draft-workspace.tsx` — lines 2, 26, 57, 61, 146, 151, 283, 288, 300, 352, 356
- `src/components/quote-issue/quote-issue-panel.tsx` — lines 24, 461
- `src/modules/assistant/application/draft-job.ts` — lines 4, 5, 6, 18, 20, 21, 28, 30, 31
- `src/modules/assistant/application/read-tools.ts` — lines 15, 16, 86, 87, 88, 358, 415, 447, 464, 468
- `src/modules/assistant/domain/job-draft.ts` — lines 1, 47, 52, 53, 121, 162, 179
- `src/modules/comparison-experience/build-comparison-experience.ts` — lines 7, 9, 580, 585, 688, 852
- `src/modules/comparisons/domain/contracts.ts` — lines 84, 85
- `src/modules/comparisons/domain/eligibility-policy.ts` — lines 44, 45
- `src/modules/comparisons/domain/similarity-policy.ts` — lines 53, 56, 57, 58, 59, 61, 62, 63, 161
- `src/modules/economics/presentation/claim-findings.ts` — lines 3, 20, 60
- `src/modules/evidence-panel/presentation.ts` — lines 3, 28, 29, 30, 32, 33, 34, 35, 36, 146, 187
- `src/modules/home-desk/presentation.ts` — lines 7, 68
- `src/modules/internal-review/domain/proposal-policy.ts` — lines 2, 185, 188, 241, 242
- `src/modules/localization/jobs.ts` — lines 13, 17, 21, 25, 29, 33, 37, 41, 56, 175
- `src/modules/localization/project-context.ts` — lines 4, 5, 6, 7, 8, 9, 10, 13
- `src/modules/projects/domain/job-input.ts` — lines 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 59, 62, 66, 67, 154, 160, 167
- `src/modules/quote-draft/application/get-quote-draft-evidence.ts` — lines 10, 119
- `src/modules/quote-draft/application/get-quote-draft.ts` — lines 1, 73
- `src/modules/quote-draft/application/save-quote-draft.ts` — lines 4, 129
- `src/modules/quote-draft/domain/draft-policy.ts` — lines 1, 15, 57, 136
- `src/modules/quote-draft/domain/quote-line-order.ts` — lines 1, 4, 8, 9
- `src/modules/quote-draft/domain/save-input.ts` — lines 1, 2, 38, 48, 68, 77
- `src/modules/quote-issue/domain/issue-policy.ts` — lines 1, 98
- `src/repositories/prisma/prisma-project-write-repository.ts` — lines 6, 161, 162
- `src/repositories/prisma/prisma-quote-draft-repository.ts` — lines 1, 2, 259, 278, 282
- `src/repositories/prisma/prisma-quote-issue-repository.ts` — lines 1, 343

### Client field contracts, reads, writes and presentation

- `src/app/[locale]/projects/new/actions.ts` — lines 28, 30
- `src/components/projects/new-job-form.tsx` — lines 17, 33, 45, 52, 55, 122, 230, 232, 233, 236, 240, 242, 252, 253, 256, 260, 262
- `src/components/projects/project-workspace-overview.tsx` — lines 129
- `src/components/quote-issue/quote-issue-panel.tsx` — lines 317
- `src/lib/server/project-write-services.ts` — lines 4, 12
- `src/modules/assistant/application/draft-job.ts` — lines 3, 23, 43, 102, 103, 105, 109
- `src/modules/assistant/application/job-draft-action-state.ts` — lines 1, 6
- `src/modules/assistant/domain/job-draft.ts` — lines 7, 8, 27, 45, 46, 74, 88, 89, 93, 94, 107, 108, 109, 153, 156, 162
- `src/modules/localization/home-desk.ts` — lines 34
- `src/modules/localization/jobs.ts` — lines 79, 80, 81, 133, 134, 135
- `src/modules/localization/quote-issue.ts` — lines 41, 113
- `src/modules/projects/application/get-project-workspace.ts` — lines 417
- `src/modules/projects/application/list-project-clients.ts` — lines 2, 4, 5, 6, 8, 9, 10, 14
- `src/modules/projects/domain/job-input.ts` — lines 82, 83, 84, 103, 104, 105, 169, 170, 171, 174
- `src/modules/projects/domain/project-workspace.ts` — lines 162
- `src/modules/quote-issue/domain/contracts.ts` — lines 71, 93, 94
- `src/modules/quote-issue/domain/issue-policy.ts` — lines 90
- `src/modules/quote-issue/infrastructure/render-quote-pdf.ts` — lines 18, 39, 127
- `src/repositories/ports/project-repository.ts` — lines 10, 15, 16
- `src/repositories/ports/project-workspace-repository.ts` — lines 24
- `src/repositories/prisma/prisma-project-workspace-repository.ts` — lines 36, 238, 324
- `src/repositories/prisma/prisma-project-write-repository.ts` — lines 9, 19, 23, 26, 112, 114, 122, 126, 127, 128, 129, 140, 188
- `src/repositories/prisma/prisma-quote-issue-repository.ts` — lines 69, 73, 164, 165

### Area, units and normalized-rate consumers

- `src/components/projects/new-job-form.tsx` — lines 106, 111, 114, 198, 215
- `src/components/projects/project-workspace-overview.tsx` — lines 114, 115, 133
- `src/components/quote-draft/quote-draft-workspace.tsx` — lines 273
- `src/modules/assistant/application/read-tools.ts` — lines 268, 476, 482, 485, 488
- `src/modules/assistant/domain/job-draft.ts` — lines 18, 209
- `src/modules/comparison-experience/build-comparison-experience.ts` — lines 99, 422, 597, 600, 853
- `src/modules/comparison-experience/copy.ts` — lines 235, 354
- `src/modules/comparisons/application/fingerprints.ts` — lines 34, 35
- `src/modules/comparisons/application/run-comparable-project-analysis.ts` — lines 53, 54, 259, 260
- `src/modules/comparisons/domain/contracts.ts` — lines 53, 54, 164, 165, 215, 216
- `src/modules/comparisons/domain/eligibility-policy.ts` — lines 41, 42, 58, 59, 86
- `src/modules/comparisons/domain/similarity-policy.ts` — lines 245
- `src/modules/economics/application/run-historical-economics-enrichment.ts` — lines 27, 28
- `src/modules/economics/domain/closed-job-economics-service.ts` — lines 44, 127
- `src/modules/economics/domain/contracts.ts` — lines 67, 68
- `src/modules/economics/domain/historical-economics-service.ts` — lines 131, 139, 397, 542, 583, 1013, 1024
- `src/modules/economics/domain/observation-authority.ts` — lines 139, 208
- `src/modules/evidence-panel/copy.ts` — lines 226, 247, 398, 419
- `src/modules/evidence-panel/presentation.ts` — lines 41, 42
- `src/modules/localization/jobs.ts` — lines 71, 72, 90, 125, 126, 144
- `src/modules/projects/application/get-project-workspace.ts` — lines 428
- `src/modules/projects/domain/job-input.ts` — lines 17, 75, 76, 95, 96, 161, 162, 179, 180, 182
- `src/modules/quote-draft/domain/draft-policy.ts` — lines 20, 29, 77, 128
- `src/repositories/ports/project-workspace-repository.ts` — lines 17, 18
- `src/repositories/prisma/prisma-comparable-project-repository.ts` — lines 52, 53, 203, 204, 236, 237
- `src/repositories/prisma/prisma-economics-observation-repository.ts` — lines 28, 29, 236, 237, 294, 295
- `src/repositories/prisma/prisma-evidence-panel-repository.ts` — lines 329, 330, 405, 406
- `src/repositories/prisma/prisma-home-desk-repository.ts` — lines 308, 309
- `src/repositories/prisma/prisma-project-workspace-repository.ts` — lines 29, 30, 231, 232, 317, 318
- `src/repositories/prisma/prisma-project-write-repository.ts` — lines 146, 147
- `src/repositories/prisma/prisma-quote-draft-repository.ts` — lines 79, 80, 97, 98, 285

## Additional routing, authorization and composition points

- `src/modules/runtime-context/contracts.ts`, `capabilities.ts`: capability union, role bundles and presentation hints.
- `src/modules/navigation/global-navigation.ts`, `src/components/shell/global-nav.tsx`, shell/layout/catalog callers: navigation keys, labels and per-person availability.
- `src/app/[locale]/settings/page.tsx`, `src/app/[locale]/projects/[projectKey]/quote/issue-actions.ts`, `src/app/[locale]/assistant-actions.ts`: existing settings route/action composition.
- `src/lib/server/*-services.ts`: pass authorized catalog snapshots into domain/application/presentation; no Prisma imports into screens or domain.
- `src/modules/comparisons/application/active-project-context-service.ts` and `fingerprints.ts`: freshness remains permission/source checked; mutable related-type/list data needs an explicit freshness dependency.

## Verification plan

Unit and disposable PostgreSQL tests for validation, permissions, cross-tenant identifiers, audit/idempotency and retired entries; ranking/claim/finding parity against the captured baseline; privacy assertions on every assistant tool DTO/model request; bilingual local browser and PDF render checks; npm run check and CI; at most two authorized paid evaluation dispatches with each cost/report retained. Hosted acceptance waits for the Product Director; PR remains draft.
