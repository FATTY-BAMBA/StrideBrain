# SB-034 first UX slice — implementation review

Status: first slice implemented locally; authenticated visual capture is now complete in the user-approved isolated synthetic environment. See [authenticated-ux-review.md](authenticated-ux-review.md) for the current findings, evidence and cleanup. This is not first-time participant acceptance or pilot readiness.

Branch: `build/sb-034-demo-value-ux`

Baseline/HEAD: `19c98f799de43876e6eea83fd9d336518476fe0a`

Worktree: `/private/tmp/sb034-demo-value-ux`

Changes: uncommitted, not pushed, not merged, not deployed.

Production build: `Fj_JGSmdikTqYKo9DsVdl`

Preview status: stopped after authenticated review. No local listener remains on port 3004.

## Before → after

| Surface | Before | First slice |
| --- | --- | --- |
| Home | Build-stage orientation and internal architecture | Outcome heading, authorized current project, four tasks, existing record warnings, secondary Planned assistance |
| Workspace | Tall context/intro before comparison and commercial details | Compact project/stage/status, prominent comparison action, quote and forecast together, specific record warnings |
| Comparison | Large headline/metadata and long selection list before useful findings | Closest matches, What needs review, named saved baseline projects, typed findings + See evidence, existing review action, then selection/table |
| Evidence | Large persistent title/description and calculation-first reading | Compact persistent Close/Back, scrolling title, finding/factor meaning, exact sources, expandable calculation details |
| Knowledge / StrideBrain | Architecture explanation / non-working future capabilities | Bounded project questions with distinct real routes; no freeform input or fake answers |
| Navigation / Settings | Dead-end Commercial/Evidence entries and technical framing | Home / Projects / Knowledge / StrideBrain; secondary Settings; only working language settings and Planned future areas |

## What a new user can see first

The entry names the tasks: compare past work, review the quotation, find supporting evidence, and use company knowledge. With an authorized session it also names the selected project, project stage and programme, plus real workspace warnings. Comparison promotes saved findings before detailed cards/matrix and labels the projects supplying those findings separately from the strongest structural matches.

This is implemented structure, not a measured 60-second outcome. The initial screenshot set below covers signed-out surfaces; the later [authenticated capture matrix](evidence/authenticated/README.md) covers the requested project journey. No first-time participant trial has been run and no time-saved claim is made.

## Bounded task routing

- Home comparison → explicit comparison-start workflow. Home quotation → current project's commercial section. Home evidence → comparison start with an explicit compare-first prerequisite. Knowledge → bounded question surface, preserving the authorized project key.
- Knowledge: similar work → comparison; current quote → commercial section; records needing attention → project attention section.
- StrideBrain adds the existing open-actions list to those three questions.
- Specific imported-stone/material/history prompts were omitted from this slice because the existing entry cannot hand off directly to that precise saved answer. Their intelligence remains available inside comparison. No new backend lookup, command or invented result was added.
- Planned assistance is informational only. Missing session/project and restricted comparison roles do not gain active comparison controls.

## Integrity and verification

Presentation composition calls the existing session resolver, authorized list and one authorized workspace read. No schema, migration, repository policy, authorization policy, financial formula, comparison ranking, server action or internal-review command changes. Financial finding bodies still come from the existing view model. Saved selection names use the persisted result rather than pending checkbox edits. Existing modal/return handlers remain in place.

`npm run check` on Node 24.22.3 passed: formatting, lint (zero errors; one existing prisma.config.ts default-export warning), typecheck, **67 test files passed / 5 skipped**, **580 tests passed / 130 skipped**, and production build. Database integration suites were skipped because no database environment was configured. See [check.log](evidence/check.log).

The subsequent two-line mobile navigation CSS correction passed formatting and a separate production build; see [final-build.log](evidence/final-build.log). Public browser capture verified corrected label layout. No broad new Stage 9 physical-device certification was performed. New regression coverage includes authorization-derived entry, missing/foreign project rejection, locale routing, distinct bounded task destinations, no fake controls, saved baseline versus unsaved selection, factor-before-source hierarchy and existing modal return behavior.

## Screenshots

All are unedited production browser captures. Desktop = 1440×900; mobile = 390×844. Every capture is **public / signed out** and therefore does not prove authenticated project, comparison, evidence or action behavior. The mobile captures are viewport checks, not physical iPhone certification.

| Surface | English desktop | English mobile | zh-TW desktop | zh-TW mobile |
| --- | --- | --- | --- | --- |
| home | [en desktop](evidence/screenshots/en-home-desktop-public.jpg) | [en mobile](evidence/screenshots/en-home-mobile-public.jpg) | [zh-TW desktop](evidence/screenshots/zh-TW-home-desktop-public.jpg) | [zh-TW mobile](evidence/screenshots/zh-TW-home-mobile-public.jpg) |
| knowledge | [en desktop](evidence/screenshots/en-knowledge-desktop-public.jpg) | [en mobile](evidence/screenshots/en-knowledge-mobile-public.jpg) | [zh-TW desktop](evidence/screenshots/zh-TW-knowledge-desktop-public.jpg) | [zh-TW mobile](evidence/screenshots/zh-TW-knowledge-mobile-public.jpg) |
| stridebrain | [en desktop](evidence/screenshots/en-stridebrain-desktop-public.jpg) | [en mobile](evidence/screenshots/en-stridebrain-mobile-public.jpg) | [zh-TW desktop](evidence/screenshots/zh-TW-stridebrain-desktop-public.jpg) | [zh-TW mobile](evidence/screenshots/zh-TW-stridebrain-mobile-public.jpg) |
| settings | [en desktop](evidence/screenshots/en-settings-desktop-public.jpg) | [en mobile](evidence/screenshots/en-settings-mobile-public.jpg) | [zh-TW desktop](evidence/screenshots/zh-TW-settings-desktop-public.jpg) | [zh-TW mobile](evidence/screenshots/zh-TW-settings-mobile-public.jpg) |

## Independent verdict and remaining limits

See [independent-ux-review.md](independent-ux-review.md). Current verdict: **PASS_SCOPED_AUTHENTICATED_VISUAL_REVIEW_WITH_P3_FOLLOW_UP**, covering the later authenticated capture set. The prior **PASS_SCOPED_SOURCE_AND_PUBLIC_VISUAL_REVIEW** covered all 16 final public captures. Independent source review cleared the bounded-destination, saved-baseline, mobile Close/Back and visible factor explanation concerns after corrections. The public mobile navigation overlap found during captures was corrected and recaptured.

Remaining weak spots:

- Authenticated captures are complete; see the new report for the reproduced mobile Projects spacing issue and the zh-TW initial desktop workspace-fold evidence limit.
- Home exposes general workspace-record warnings; it does not invent current financial alerts or perform a new latest-comparison lookup.
- Evidence entry needs an explicit comparison run; direct saved-result resumption and question-specific handoff are outside this first slice.
- Knowledge and StrideBrain share supported tasks; differentiated value still needs user observation.
- English mobile Settings wraps onto a second navigation row. Labels are readable, but that costs vertical space.
- New Taiwan Traditional Chinese wording needs human language review. Historical Stage 9 language attestation does not cover it.
- No measured first-60-second comprehension, wow moment, pilot pass or fresh full F01–F05 acceptance is claimed.

## Authenticated capture approval and completion

The original capture attempt was blocked because database mutation had not been explicitly authorized; it made no changes. The user then explicitly approved a separate local synthetic database and temporary session for SB-034 only. That work is complete. See [authenticated-ux-review.md](authenticated-ux-review.md) for 54 authenticated captures plus revocation evidence, protected-state checks and cleanup. Stage 9 was not accessed. No additional product-source changes were made during that review. The isolated database is stopped and preserved privately pending review acceptance; the temporary session is revoked.

## Product and test files changed

- `src/app/[locale]/knowledge/page.tsx`
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/settings/page.tsx`
- `src/app/[locale]/stridebrain/page.tsx`
- `src/app/globals.css`
- `src/components/comparisons/comparison-experience-client.tsx`
- `src/components/comparisons/comparison-experience.module.css`
- `src/components/demo-value/value-launchpad.module.css`
- `src/components/demo-value/value-launchpad.tsx`
- `src/components/evidence/evidence-panel.module.css`
- `src/components/evidence/evidence-panel.tsx`
- `src/components/projects/project-workspace-overview.module.css`
- `src/components/projects/project-workspace-overview.tsx`
- `src/components/shell/global-nav.tsx`
- `src/components/shell/workspace-shell.tsx`
- `src/lib/server/demo-value-context.ts`
- `src/modules/comparison-experience/copy.ts`
- `src/modules/demo-value/copy.ts`
- `src/modules/evidence-panel/copy.ts`
- `src/modules/localization/catalog.ts`
- `src/modules/navigation/project-navigation.ts`
- `tests/comparison-experience/selection-navigation.test.ts`
- `tests/demo-value/launchpad.test.ts`
- `tests/evidence-panel/modal-focus.test.ts`
- `tests/navigation/navigation-contract.test.ts`
