# Verification — fix round 3

27 November 2026. PR #82, `build/sb-077-design-pass-v2`, baseline `34686fa`. Supersedes [round 2](verification-round2.md). Read AGENTS.md and [review 7209015810](https://github.com/FATTY-BAMBA/StrideBrain/pull/82#issuecomment-7209015810); GitHub metadata identifies the repository owner FATTY-BAMBA as author. All thirteen items were authorized in one run, with one final Builder report, then stop.

## Changes

1. The shared job layout checks trusted membership/capability and the existing tenant-scoped job policy before rendering tabs or chat. Unknown, unassigned and other-organization jobs reach the same not-found boundary on Overview, Quote, Compare and Actions. Feature-level authorization remains. The HTTP regression now checks all four tabs in both languages for identical visible responses, HTTP 404, no key disclosure and no job navigation. Existing foreign-client denial checks remain.
2. Unauthorized `/projects/new` uses `notFound()` before reading client choices. Viewer screen/action tests retain direct-action denial checks.
3. Evidence triggers, including factors, table cells and nested sources, use a transition-aware navigation button with localized busy text through the server round trip. Review preparation keeps its busy state through navigation; Actions receipt links now show busy text too. Close/Escape dismiss the native dialog immediately, release scroll lock and return focus before the URL update finishes. Review's trigger remains focusable during closing. Nested source focus and reopening a previously dismissed source are covered. Backdrop clicks still do nothing.
4. Fill form is secondary; Create job remains primary. Both-language regression renders drafting enabled without a model call.
5. Closed jobs with no saved comparison say “This job has no saved comparison.” / 「此專案沒有已儲存的比較。」, with no drafting instructions or run control.
6. Selection columns use exactly `Select | Job | Similarity score | Factors` / `選取｜專案｜相似度分數｜比較因素`.
7. The selection SectionHeading is outside the text/status flex row, so its rule spans the section.
8. Home closed-job figures cap at `--facts-width` (640px).
9. Shared linked names keep their 8px hover padding and use a negative start margin so the text aligns with adjacent text.
10. Stage chips have no underline. Audited other control links: comparison buttons and pagination now explicitly suppress it; shared buttons, tabs and review action links already do. Ordinary sentence links remain underlined.
11. The View all link is followed by a `--space-24` section gap before past-price references.
12. DESIGN_SYSTEM.md now places dialog, row/link, facts, quote and comparison rules in their relevant sections; the review-round appendix and review-number references are removed.
13. `next.config.ts` matches main's single-line serverActions setting; no diff remains against the main baseline for that file.

## Verified

- Targeted modal, focus, job-draft, quote-panel and authorization regressions pass. Changed older tests that required unavailable pages with tabs to require the newly requested 404 instead. Nested Back now recreates the dismissed native dialog; its focus target, containment and return assertions remain. The navigation-race test now checks aria-disabled, busy text and focusability while retaining its actual repeated-click / one-proposal assertions.
- Local Chromium delayed-response checks: [56 checks](evidence/round3/checks.json), en/zh-TW, 390px/1440px. Server responses delayed by 1,800ms. Evidence and review Escape dismissal **7–11ms**, with immediate focus return. Busy-state screenshots captured before dialogs arrive. Both unknown and unassigned keys return 404 without tabs on every job surface; unauthorized new-job pages match.
- Actions receipt navigation: [four checks](evidence/round3/actions-checks.json), both languages/widths. Busy link visible; Close dismissal **53–67ms**, immediate focus return, URL update still pending.
- Measured closed-job facts: 640px on desktop; linked-name text and figures share the same left edge. Selection heading rule equals section width; column labels match exactly. Home and Projects stage chips have `text-decoration: none`.
- Final `npm run check`: **PASS** — formatting, token gate, lint (zero errors; existing prisma.config.ts warning), TypeScript, **2,003 tests in 207 files**, isolated PostgreSQL/HTTP tests and production build. Local layout sweep: **164 screen/interaction states, zero failures**, both roles/languages/widths; all 188 mobile linked-name rectangles fit and tap heights are at least 44px. CI result will be included in the final Builder report.
- Local production-build selection viewports in both languages/widths also have no page overflow; see [production checks](evidence/round3/production-checks.json).
- React checklist: native controls and links retained; transition pending state surrounds URL navigation, dismissal state is separate from server navigation, changed route selections reset dismissal, and explicit return targets prevent disabled/removed triggers from losing focus. No new browser business-data reads.

## Not verified / limits

Hosted acceptance of this final revision is waiting for the Product Director. The PR stays draft. Provisional decisions in this review (unauthorized new-job not-found, closed-job copy and selection-column copy) may be built on and remain awaiting Product Director confirmation. Earlier provisional row-list/name-link, overview and Actions-title decisions remain awaiting confirmation where not already accepted by the Product Director.

No physical phone, Safari, screen-reader session, real browser zoom or induced database outage. The restored localized catch-all still supplies its frame after hydration; no new no-JavaScript framed-404 claim. Local browser timing under an injected delay is not a measurement of hosted performance.

No hosted deployment, workflow dispatch, migration, seed or setting change. All browser work used the disposable local synthetic database. Review preparation created local proposals only; no new action was confirmed. No paid evaluation, instruction/model/tool changes, financial-rule changes, schema changes or issued-PDF changes. The Viewer's repetitive overview denial copy remains out of scope, as the reviewer requested.

## Screenshots

[Focused screenshots and before/after links](screenshots-round3.md). Earlier screenshots remain historical evidence.
