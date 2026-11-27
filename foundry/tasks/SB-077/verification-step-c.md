# Verification — steps A–C

27 November 2026. Base: main `aacee10141ef03a5780286aa934c0ef890db16b4`. Draft PR #82, branch `build/sb-077-design-pass-v2`. Stop after C; this is not completion of issue #77.

## Authority and environment

Read the updated issue (including 11 and 12) and AGENTS.md. GitHub metadata identifies FATTY-BAMBA as the author of comments [7203211092](https://github.com/FATTY-BAMBA/StrideBrain/issues/77#issuecomment-7203211092) and [7203263260](https://github.com/FATTY-BAMBA/StrideBrain/issues/77#issuecomment-7203263260). The latter confirms Product Director approval for local Playwright/Chrome; no provisional decision remains.

All browser work used localhost and an isolated PostgreSQL database containing repository synthetic seeds. The before app is an untouched main snapshot; after is this branch. No hosted site, invitation code or paid model was used. Playwright comes from the existing local installation, not package.json, lockfile, CI or npm run check. The capture scripts require PLAYWRIGHT_MODULE and a private SB077_SESSION_FILE containing locally signed synthetic sessions; that file is not committed. The scripts pin localhost origins.

## Changes and checks

- A: explicit page-file inventory and running Next HTTP sweep, owner/Viewer and en/zh-TW. It checks HTTP status, one h1, main, unique named regions, visible raw enum codes and negative zero. React streaming boundaries are materialized without executing scripts. The test fails if a page file is absent from the inventory. The HTTP suite also checks unknown, unassigned and other-organization job/client addresses.
- A: removed the unreachable QuoteDraftWorkspace and its CSS; the only remaining consumer was its own two UI tests, removed with it. The live quote-document editor and its tests remain. Removed the unused brainTitle/brainDescription copy. Search of src/tests confirms no remaining references. No denial or PDF assertion was removed.
- B: native details/summary menu below 900px; product/current area, navigation, account, languages, Settings and sign-out. Skip link remains first. The no-JavaScript check exposed plain-text language fallbacks, now real links. Unknown overview addresses use the same localized, non-disclosing 404 as missing clients/URLs. Optional assistant-panel lookup failures still do not deny an otherwise available page. Signed-out overview retains its unavailable state. Locale error boundary delegates to the existing localized retry control.
- C: documented SectionHeading, FactsList and the future Dialog before use. Home decisions/closed jobs, Projects, overview and action rows use shared headings, tables and facts. New-job fields and assistant surfaces use tokens. Answer cards group adjacent equal labels above unchanged values, preserving order and links. No text composition, model inputs or stored answer text changed.
- Final npm run check: passed: format/design guard, lint, TypeScript, 203 test files / 1,981 tests, and production build.
- React review: pure shared render components, stable row keys, native interactive controls, no new fetch effect or provider call; responsive navigation uses the same server-authorized props. Existing capability checks remain server-side.

## HTTP evidence and limits

[Before sweep](evidence/http-sweep-before.json) and [after sweep](evidence/http-sweep.json) contain 84 local HTTP requests each, including unknown addresses. The automated suite additionally resolves an actual client key for the page inventory. Initially unknown job overviews returned 200 and echoed the requested key; now they return 404. Baseline unknown URLs had the framework-only 404, outside the app.

Allowed pages in the automated inventory return 200 with the expected structure. Viewer Clients and price-list denials are not classified as allowed pages. Existing streamed price-list denial can have HTTP 200 but exposes no amounts; this behavior was not changed. Raw initial Next development HTML for notFound contains neither main nor h1; after hydration, the localized 404 is inside the frame, has one h1 and a Home link. Browser evidence checks the same visible 404 text for unknown URL/job/client and unassigned job in both languages. Do not interpret the HTTP 404 evidence as a no-JavaScript recovery-page pass. Error recovery is component-tested, not a deliberately induced database outage.

## Visual and keyboard review

Every before and after PNG linked below was opened and inspected against DESIGN_SYSTEM.md. 1440px and 390px are full-page captures, in both languages. Owner and Viewer are separate where permissions differ. Every base screen was tabbed through; [before focus order](evidence/before/inspection.json) and [after focus order](evidence/after/inspection.json) record each stop and computed outline. All final app stops have a visible ring; no document-level horizontal overflow. Tables deliberately scroll inside their named focusable regions, not the page. Screenshots include focused controls. Next's development indicator is hidden in final captures, not a product element.

The answer screenshots are an explicit synthetic presentation replay, not a live AI result or saved finding for that job. A local browser route interception supplies the same typed card fixture before/after and never forwards the action request. The two sentences and source destination are identical. [Before card checks](evidence/before/answer-inspection.json) show two repeated labels; [after card checks](evidence/after/answer-inspection.json) show one. The underlying Home/job page uses the actual seed records. No comparison was run for these captures.

Changes driven by inspection:

- Home/decisions: oversized headings and rounded record cards became the page type scale and table rows; closed figures now align right. Empty Viewer decisions have one sentence, no empty table. Narrow tables remain keyboard-scrollable.
- Projects: long cards became stage tables with row names and named Open links. The status column is labelled Status/狀態; stage controls and all eight groups remain.
- New job: smaller shared heading, control tokens and a clear gap between scope and client fields. The field order and submission are unchanged.
- Overview/actions: removed gradient/large rounded header, tiny context and card borders; fact labels and numeric values align consistently. Viewer restrictions remain visible without amounts.
- Mobile shell: the first iteration stretched the top grid row, leaving blank space; explicit auto/1fr rows fixed it. The closed menu leaves the page immediately visible. The open menu retains the firm name in both languages, including with JavaScript disabled.
- Answer cards: repeated labels squeezed full sentences into a right-aligned column on phones. One label now precedes the unchanged, left-aligned sentences.

## Screenshot index

Each row links both inspected versions. The screen/role, language and width are explicit. See the observations above for the corresponding changes.

| Screen / role       | Language | Width  | Before                                                     | After                                                    |
| ------------------- | -------- | ------ | ---------------------------------------------------------- | -------------------------------------------------------- |
| actions / owner     | en       | 1440px | [Before](evidence/before/owner-en-actions-1440.png)        | [After](evidence/after/owner-en-actions-1440.png)        |
| actions / owner     | en       | 390px  | [Before](evidence/before/owner-en-actions-390.png)         | [After](evidence/after/owner-en-actions-390.png)         |
| answer-home / owner | en       | 1440px | [Before](evidence/before/owner-en-answer-home-1440.png)    | [After](evidence/after/owner-en-answer-home-1440.png)    |
| answer-home / owner | en       | 390px  | [Before](evidence/before/owner-en-answer-home-390.png)     | [After](evidence/after/owner-en-answer-home-390.png)     |
| answer-job / owner  | en       | 1440px | [Before](evidence/before/owner-en-answer-job-1440.png)     | [After](evidence/after/owner-en-answer-job-1440.png)     |
| answer-job / owner  | en       | 390px  | [Before](evidence/before/owner-en-answer-job-390.png)      | [After](evidence/after/owner-en-answer-job-390.png)      |
| decisions / owner   | en       | 1440px | [Before](evidence/before/owner-en-decisions-1440.png)      | [After](evidence/after/owner-en-decisions-1440.png)      |
| decisions / owner   | en       | 390px  | [Before](evidence/before/owner-en-decisions-390.png)       | [After](evidence/after/owner-en-decisions-390.png)       |
| home / owner        | en       | 1440px | [Before](evidence/before/owner-en-home-1440.png)           | [After](evidence/after/owner-en-home-1440.png)           |
| home / owner        | en       | 390px  | [Before](evidence/before/owner-en-home-390.png)            | [After](evidence/after/owner-en-home-390.png)            |
| new-job / owner     | en       | 1440px | [Before](evidence/before/owner-en-new-job-1440.png)        | [After](evidence/after/owner-en-new-job-1440.png)        |
| new-job / owner     | en       | 390px  | [Before](evidence/before/owner-en-new-job-390.png)         | [After](evidence/after/owner-en-new-job-390.png)         |
| overview / owner    | en       | 1440px | [Before](evidence/before/owner-en-overview-1440.png)       | [After](evidence/after/owner-en-overview-1440.png)       |
| overview / owner    | en       | 390px  | [Before](evidence/before/owner-en-overview-390.png)        | [After](evidence/after/owner-en-overview-390.png)        |
| projects / owner    | en       | 1440px | [Before](evidence/before/owner-en-projects-1440.png)       | [After](evidence/after/owner-en-projects-1440.png)       |
| projects / owner    | en       | 390px  | [Before](evidence/before/owner-en-projects-390.png)        | [After](evidence/after/owner-en-projects-390.png)        |
| actions / owner     | zh-TW    | 1440px | [Before](evidence/before/owner-zh-TW-actions-1440.png)     | [After](evidence/after/owner-zh-TW-actions-1440.png)     |
| actions / owner     | zh-TW    | 390px  | [Before](evidence/before/owner-zh-TW-actions-390.png)      | [After](evidence/after/owner-zh-TW-actions-390.png)      |
| answer-home / owner | zh-TW    | 1440px | [Before](evidence/before/owner-zh-TW-answer-home-1440.png) | [After](evidence/after/owner-zh-TW-answer-home-1440.png) |
| answer-home / owner | zh-TW    | 390px  | [Before](evidence/before/owner-zh-TW-answer-home-390.png)  | [After](evidence/after/owner-zh-TW-answer-home-390.png)  |
| answer-job / owner  | zh-TW    | 1440px | [Before](evidence/before/owner-zh-TW-answer-job-1440.png)  | [After](evidence/after/owner-zh-TW-answer-job-1440.png)  |
| answer-job / owner  | zh-TW    | 390px  | [Before](evidence/before/owner-zh-TW-answer-job-390.png)   | [After](evidence/after/owner-zh-TW-answer-job-390.png)   |
| decisions / owner   | zh-TW    | 1440px | [Before](evidence/before/owner-zh-TW-decisions-1440.png)   | [After](evidence/after/owner-zh-TW-decisions-1440.png)   |
| decisions / owner   | zh-TW    | 390px  | [Before](evidence/before/owner-zh-TW-decisions-390.png)    | [After](evidence/after/owner-zh-TW-decisions-390.png)    |
| home / owner        | zh-TW    | 1440px | [Before](evidence/before/owner-zh-TW-home-1440.png)        | [After](evidence/after/owner-zh-TW-home-1440.png)        |
| home / owner        | zh-TW    | 390px  | [Before](evidence/before/owner-zh-TW-home-390.png)         | [After](evidence/after/owner-zh-TW-home-390.png)         |
| new-job / owner     | zh-TW    | 1440px | [Before](evidence/before/owner-zh-TW-new-job-1440.png)     | [After](evidence/after/owner-zh-TW-new-job-1440.png)     |
| new-job / owner     | zh-TW    | 390px  | [Before](evidence/before/owner-zh-TW-new-job-390.png)      | [After](evidence/after/owner-zh-TW-new-job-390.png)      |
| overview / owner    | zh-TW    | 1440px | [Before](evidence/before/owner-zh-TW-overview-1440.png)    | [After](evidence/after/owner-zh-TW-overview-1440.png)    |
| overview / owner    | zh-TW    | 390px  | [Before](evidence/before/owner-zh-TW-overview-390.png)     | [After](evidence/after/owner-zh-TW-overview-390.png)     |
| projects / owner    | zh-TW    | 1440px | [Before](evidence/before/owner-zh-TW-projects-1440.png)    | [After](evidence/after/owner-zh-TW-projects-1440.png)    |
| projects / owner    | zh-TW    | 390px  | [Before](evidence/before/owner-zh-TW-projects-390.png)     | [After](evidence/after/owner-zh-TW-projects-390.png)     |
| actions / viewer    | en       | 1440px | [Before](evidence/before/viewer-en-actions-1440.png)       | [After](evidence/after/viewer-en-actions-1440.png)       |
| actions / viewer    | en       | 390px  | [Before](evidence/before/viewer-en-actions-390.png)        | [After](evidence/after/viewer-en-actions-390.png)        |
| decisions / viewer  | en       | 1440px | [Before](evidence/before/viewer-en-decisions-1440.png)     | [After](evidence/after/viewer-en-decisions-1440.png)     |
| decisions / viewer  | en       | 390px  | [Before](evidence/before/viewer-en-decisions-390.png)      | [After](evidence/after/viewer-en-decisions-390.png)      |
| home / viewer       | en       | 1440px | [Before](evidence/before/viewer-en-home-1440.png)          | [After](evidence/after/viewer-en-home-1440.png)          |
| home / viewer       | en       | 390px  | [Before](evidence/before/viewer-en-home-390.png)           | [After](evidence/after/viewer-en-home-390.png)           |
| overview / viewer   | en       | 1440px | [Before](evidence/before/viewer-en-overview-1440.png)      | [After](evidence/after/viewer-en-overview-1440.png)      |
| overview / viewer   | en       | 390px  | [Before](evidence/before/viewer-en-overview-390.png)       | [After](evidence/after/viewer-en-overview-390.png)       |
| projects / viewer   | en       | 1440px | [Before](evidence/before/viewer-en-projects-1440.png)      | [After](evidence/after/viewer-en-projects-1440.png)      |
| projects / viewer   | en       | 390px  | [Before](evidence/before/viewer-en-projects-390.png)       | [After](evidence/after/viewer-en-projects-390.png)       |
| actions / viewer    | zh-TW    | 1440px | [Before](evidence/before/viewer-zh-TW-actions-1440.png)    | [After](evidence/after/viewer-zh-TW-actions-1440.png)    |
| actions / viewer    | zh-TW    | 390px  | [Before](evidence/before/viewer-zh-TW-actions-390.png)     | [After](evidence/after/viewer-zh-TW-actions-390.png)     |
| decisions / viewer  | zh-TW    | 1440px | [Before](evidence/before/viewer-zh-TW-decisions-1440.png)  | [After](evidence/after/viewer-zh-TW-decisions-1440.png)  |
| decisions / viewer  | zh-TW    | 390px  | [Before](evidence/before/viewer-zh-TW-decisions-390.png)   | [After](evidence/after/viewer-zh-TW-decisions-390.png)   |
| home / viewer       | zh-TW    | 1440px | [Before](evidence/before/viewer-zh-TW-home-1440.png)       | [After](evidence/after/viewer-zh-TW-home-1440.png)       |
| home / viewer       | zh-TW    | 390px  | [Before](evidence/before/viewer-zh-TW-home-390.png)        | [After](evidence/after/viewer-zh-TW-home-390.png)        |
| overview / viewer   | zh-TW    | 1440px | [Before](evidence/before/viewer-zh-TW-overview-1440.png)   | [After](evidence/after/viewer-zh-TW-overview-1440.png)   |
| overview / viewer   | zh-TW    | 390px  | [Before](evidence/before/viewer-zh-TW-overview-390.png)    | [After](evidence/after/viewer-zh-TW-overview-390.png)    |
| projects / viewer   | zh-TW    | 1440px | [Before](evidence/before/viewer-zh-TW-projects-1440.png)   | [After](evidence/after/viewer-zh-TW-projects-1440.png)   |
| projects / viewer   | zh-TW    | 390px  | [Before](evidence/before/viewer-zh-TW-projects-390.png)    | [After](evidence/after/viewer-zh-TW-projects-390.png)    |

Additional inspected B evidence (390px): [English menu, JavaScript disabled](evidence/after/owner-en-menu-no-js-390.png), [繁中選單，停用 JavaScript](evidence/after/owner-zh-TW-menu-no-js-390.png), [English 404](evidence/after/viewer-en-not-found-390.png), [繁中 404](evidence/after/viewer-zh-TW-not-found-390.png). [Menu and denial checks](evidence/after/menu-not-found.json).

## Scope audit and not verified

No prisma/, src/repositories/, src/app/api/, package/dependency, model instruction/tool/grounding, financial rule or PDF implementation changes. The new locale catch-all only calls notFound for unknown addresses; it adds no product capability or data route. Existing access tests remain; markup tests now assert table rows and accessible link names instead of removed cards. Seven legacy CSS baseline entries remain for later steps; the gate is not removed early.

D–G are not implemented or visually accepted: comparison/evidence/internal-review Dialog, Settings and timing disclosure (item 12), remaining global token cleanup, quote panel details and the final full design review. No paid evaluation was run because only presentation changed. Hosted acceptance is waiting for the Product Director. Keep PR #82 draft and stop after the step-C Builder report.
