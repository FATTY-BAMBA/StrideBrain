# Verification — review fixes and steps D–G

27 November 2026. Draft PR #82, branch `build/sb-077-design-pass-v2`; main baseline `aacee10141ef03a5780286aa934c0ef890db16b4`. This supersedes the [step-C checkpoint](verification-step-c.md). Hosted acceptance is waiting for the Product Director.

## Authority and provisional decisions

Read owner-authored [review 7205827683](https://github.com/FATTY-BAMBA/StrideBrain/pull/82#issuecomment-7205827683), the updated issue #77 and AGENTS.md. GitHub metadata confirms author FATTY-BAMBA. The user authorized fixes 1–7 and D–G in one run, with one report at the end.

Built on these provisional decisions, **awaiting Product Director confirmation before merge**: linked record names without a separate Open column; Home/decisions/lessons as row lists; Job settings / 專案設定 heading; removal of the duplicate overview assistant section; empty overview action slot when comparison is unauthorized; Actions / 行動事項 page title matching its tab.

## Implemented

1. Native mobile details closes after navigation, language and Settings links. Native no-JavaScript behavior remains. CurrentArea uses only the person's available navigation.
2. Shared RowList preserves Home rows, order, sentences, figures, secondary comparison hint and action; figures still come from the permission-filtered read model. Projects, Quotes, Clients and Actions open from their NameCell. Action link ids retain focus return. Removed unused RowAction.
3. Card single values and their detail lines align right; grouped finding sentences align left. Removed dead card fact CSS. Five typed fixtures replay quote totals, item price/details, closed-job figures, job list and comparison on Home and the job panel.
4. Overview facts cap at --facts-width (640px). Job settings groups unchanged editor controls or reader FactsList rows. Removed the redundant overview comparison-link section and its unused copy. Overview content redesign remains out of scope.
5. Actions title matches its tab. The repository seed has no saved action for this job: local confirmation through the existing review UI created the synthetic action pictured in the populated-table evidence. No production fixture or hosted data changed.
6. Production unmatched-route 404 now renders the complete localized frame, h1 and Home link without JavaScript. Removed the catch-all route; Next's global-not-found handles unmatched URLs. A presentation-only proxy overwrites its locale header from the URL; a test covers spoofed inbound values. The header is never an authorization input.
7. New shared strings moved into localization modules; English Home placeholder fits. Same-404 regression assertions now inspect visible text for the requested key.

D: comparison uses PageHeader, SectionHeading and a table for selected candidates; mobile comparison data stays a scrolling table. Evidence and review share native Dialog, with focus containment, Escape/pending handling, drill-down return, and opener return. Existing recovery/edit/access tests remain. Removed obsolete overlay/mobile-card CSS.

E: Settings/firm lists, ancillary pages and preview styles use tokens and flat hierarchy. Timing count/latest/maximum remain visible; recent rows start closed, retain UTC timestamps and show seconds to one decimal. The CSS gate now requires zero raw values and rejects legacy properties. Deleted the baseline and allowance code. The only package.json change removes the deleted baseline from formatting commands; no dependency/lockfile change.

F: quote aside is 320px above 1100px, below the document at narrower widths. Comparison is directly above issue controls; details start closed, retain status/counts/run controls, open for #quote-comparison, show at most five findings and link to all. No internal comparison scrolling. Closed-job quote/comparison/evidence omit run/refresh controls. Region names are distinct. The five requested UI copies use 核發 / 已核發. Zero discount is omitted on screen and review; calculations, stored documents and PDFs are unchanged.

G: DESIGN_SYSTEM.md records the row list, name links, fact width, Dialog, quote aside/disclosure, timing and strict token rules. React review kept stable keys, native controls and server-authorized props; no client financial computation or model behavior was introduced.

## Automated verification

Final `npm run check`: **PASS** — format, zero-allowance design gate, lint (zero errors; existing prisma.config.ts warning), TypeScript, **1,996 tests in 206 files**, isolated local PostgreSQL integration checks and production build. Test phase: 144.06 seconds.
Targeted evidence/review focus recovery: **59/59 passed**, then the full suite above passed. No denial, fixed-decimal, issued-PDF or model-grounding assertion was relaxed.

## Local browser verification

Only localhost, synthetic repository data and a disposable PostgreSQL database. Playwright used the existing local installation; no new dependency. Private signed session/database configuration is not committed. No provider request or paid run.

- Owner/Viewer, en/zh-TW, 1440px/390px captures. Base pages and remaining surfaces were tabbed through; focus orders/outlines are in the inspection JSON files.
- [390px interaction checks](evidence/interaction/checks.json): Home, decisions, Projects, Quotes and owner Clients row links fit fully at scrollLeft 0; no page overflow. Home sentences/lessons wrap without clipping. Quotes keeps document number first; the tested job-name links remain fully visible. Other table columns still scroll within the table.
- Final production repeat: [localized no-JavaScript 404, Viewer quote headings and unique comparison regions](evidence/interaction/final-production.json), with refreshed screenshots inspected.
- Menu links to Projects, Settings and the other language close the disclosure and show the destination h1. Both production no-JavaScript 404s return 404 with visible h1/Home link; the native menu still opens.
- [Native review focus](evidence/interaction/dialog-focus.json): actual :modal state, 35 Tab presses remain inside, Escape closes after route completion, focus returns to the entry button. Existing unit tests cover evidence drill-down and error-state recovery. [Dialog bounds](evidence/interaction/modal-bounds.json) are within both viewports.
- [Quote/timing checks](evidence/interaction/quote-timings.json): disclosure initially closed; summary figures remain visible; fragment opens comparison; closed quote and comparison have zero run buttons. Timing fixture contains 1,234ms and 9,999ms, displayed as 1.2 and 10.0 seconds; UTC timestamps unchanged. On narrow screens the timing table scrolls horizontally like other tables.
- [Card alignment](evidence/after-cards2/answer-inspection.json): single values use end alignment, grouped sentences start alignment. The long 已核對實際成本 label remains readable on 390px. Fixtures are presentation replay, not a live model result; same server-ready values/links/sentences before and after.
- Inspected before/after contact sheets and detailed captures of Home, overview, quote, settings, cards, modals, populated actions and no-JavaScript recovery. Inspection caught the need to reset internal document scrolling for screenshots and to use separate viewport captures for native modals. Full-page modal screenshots alone are not reliable entry-view evidence; use interaction/*-entry-* for that.

## Limits / not verified

- Hosted acceptance and provisional decisions await the Product Director. PR stays draft. No Test site workflow, deploy, hosted migration, seed or setting change.
- Production no-JavaScript recovery is proven for unmatched URLs. Record-specific notFound() responses still depend on Next hydration for their frame; the HTTP sweep retains these H1/MAIN findings rather than hiding them. The browser and same-404 tests retain non-disclosure. A streaming denied price-list response can be HTTP 200 with no initial h1.
- The closed-job seed has no current saved comparison. No-run behavior is browser-tested; reading current saved findings without run controls is component-tested. Stale/permission checks remain unchanged.
- No physical phone, Safari, screen-reader or real browser zoom acceptance. Focus tests include constrained DOM and reduced-motion inputs; these are not a substitute for assistive-technology testing.
- Error recovery is component-tested, not an induced database outage. Preview capture shows its unavailable state; hosted invitation entry was not exercised.
- No paid AI evaluation: instructions, tools, grounding, provider, calculations and assistant application path are unchanged.
- No changes under prisma/, repositories/, app/api/, .github/, lockfile or issued-PDF implementation. No stored snapshot rewritten.

## Screenshots

[Full screenshot index](screenshots.md). Before means unchanged main; after means this branch. Earlier A–C checkpoint images remain archived. Each new card also has an individual crop, avoiding the job panel's normal internal scroll viewport.

CI: pending the final push; its result will be included in the Builder report.
