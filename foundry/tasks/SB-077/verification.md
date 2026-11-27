# Verification — fix round 2

27 November 2026. PR #82, `build/sb-077-design-pass-v2`, baseline `a966b6e`. This supersedes [round 1](verification-round1.md). Read AGENTS.md and [owner review 7206932284](https://github.com/FATTY-BAMBA/StrideBrain/pull/82#issuecomment-7206932284); GitHub metadata identifies FATTY-BAMBA as its author. The user authorized all seven items in one run, one Builder report, then stop.

## Changes

1. Main's ordinary links use accent and underline. Linked record names share the NameCell/row-list/recordLink rule: accent, lead weight, 44px tap height and focus ring. Tabs and button-styled links keep their explicit control styles. Applied to the shared record tables, closed-job names, comparison hints, similar jobs and View all. DESIGN_SYSTEM.md records the rule.
2. Comparison findings are ordered row lists with adjacent repeated headings grouped once. Sentences, order, claim keys and evidence trigger ids are retained. Evidence is a quiet Button; internal review's primary action uses accent. Closest jobs are three ranked hairline rows beneath a full-width SectionHeading; the basis names use the locale separator and comparison details is a plain disclosure. Comparison/review/evidence layout gaps, padding, margins and numeric font weights now use tokens (the 1px screen-reader clipping offset remains structural). The gate rejects --focus outside outline declarations, including aliases; info colours remain on worded badges.
3. Dialog no longer closes on an outside click. Close, Escape, focus containment and focus return remain.
4. NameCell links wrap within the initially visible table width. The Playwright check includes populated Actions and measures every link and text rectangle with getClientRects(), at scrollLeft 0. Other columns may still scroll. Stored English action titles contain an existing ellipsis; that text is unchanged, not a CSS truncation.
5. Removed proxy.ts, global-not-found.tsx, experimental.globalNotFound and the locale-header test. Restored the localized catch-all and its sweep inventory entry. NotFoundContent remains shared. **A not-found page shows its frame after hydration.** HTTP 404 and non-disclosure assertions remain; no no-JavaScript framed-404 claim for this version.
6. The opened quote panel shows five findings followed by the accent-underlined View all link. Reference block titles use lead; category titles use body at lead weight. A real local comparison produced 13 findings; screenshots show the opened panel at 390px/1440px in both languages. No model call.
7. Firm document fields, job address controls and reader facts cap at --facts-width (640px); the Job settings heading remains full width and its contents align left. Removed the unreachable SiteAddressForm reader branch. Card detail values keep document numbers intact on one line.

## Verified

- Targeted design/comparison/quote-panel tests: **53 passed** before the final full check. New regressions cover contiguous grouping with unchanged sentence/order/trigger navigation, outside-click persistence with Close/Escape, focus-token restriction, and View all after the fifth finding. Existing baseline-selection assertions now compare the joined sentence rather than list markup; the expected selected jobs remain unchanged.
- Final `npm run check`: **PASS** — formatting, design-token gate, lint (zero errors; existing prisma.config.ts warning), TypeScript, **1,997 tests in 206 files**, isolated PostgreSQL tests and production build.
- [Local Playwright sweep](evidence/round2/checks.json): **164 screen/interaction states, zero failures**, owner/Viewer, en/zh-TW, 390px/1440px. Main links are visually distinct from surrounding text except explicit tabs/buttons; no page overflow; all 188 mobile linked names have every measured rectangle inside the viewport and a tap height of at least 44px. Includes populated Actions, quote list, clients, Home/decisions and the other swept page routes. This is not hosted acceptance.
- Eight real modal outside-click checks (evidence/review × two languages × two widths) kept the dialog open; the script then used Escape. Unit coverage retains Close/Escape.
- [Quote/field details](evidence/round2/detail-checks.json) and [final job field widths](evidence/round2/field-widths.json): 13 stored findings, five visible, View all follows them; firm fields and job controls/reader facts are 640px at desktop and fit the phone. The final field-width file supersedes the earlier section-box measurement.
- [Card replay](evidence/round2-cards/answer-inspection.json): document number Q-2611-0003 has nowrap and exactly one text line in all eight language/width/Home-or-job combinations. Five synthetic card kinds retained the prior layout; no provider call.
- Visually inspected all round-2 page/card captures in contact sheets, with individual inspection of mobile Actions, comparison findings, dialogs, price card and opened quote panel. Before images remain in the a966b6e evidence sets linked below. Native dialog captures use the viewport; long quote panels have separate focused-summary captures.
- React checklist: stable claim keys, grouping derived during render, native controls, unchanged server-authorized data and no new effects for layout.

## Not verified / limits

Hosted acceptance waits for the Product Director. The provisional decisions from review 7205827683 still await Product Director confirmation before merge (linked-name/row-list rule, overview grouping/removal/action slot, Actions title). PR stays draft.

No physical phone, Safari, screen reader or real browser zoom acceptance. No induced database outage. A not-found response can lack its frame in raw HTML until hydration; the restored catch-all does not change this known limit. Old production no-JavaScript 404 images describe the superseded round-1 implementation only.

No hosted deployment, Test site workflow, migration, seed or setting change. Comparisons and review-dialog preparation used only the disposable local synthetic database. No paid evaluation. No changes to model instructions, model tools, financial rules, repositories, API routes, Prisma, issued PDFs, workflow files, package.json or lockfile in this round.

CI status will be included in the single final Builder report after push.

## Screenshots

[Round-2 index and selected before/after pairs](screenshots-round2.md). [Earlier full index](screenshots.md) remains historical evidence.
