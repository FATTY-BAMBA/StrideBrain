# SB-034 current UX audit

Status: historical Phase 1 audit of baseline 19c98f799de43876e6eea83fd9d336518476fe0a from supplied evidence. User subsequently approved implementation. See implementation-review.md for the current changes and evidence.

## Method and evidence limits

Surface: StrideBrain controlled synthetic demo. Task: first-time discovery → Xinyi → historical comparison → supporting evidence → internal review. Capture source: original physical-iPhone screenshots explicitly supplied by the user in this conversation. Eleven exact originals were copied unchanged to a private numbered evidence set, visually reviewed as supplied, and verified byte-for-byte after copying. Their hashes appear below. A private local walkthrough presents the same images beside these findings; originals include private network browser chrome and are not committed.

Read-only source inspection corroborates the current route and data contracts. No authenticated desktop capture, new phone interaction, timed first-user trial, contrast measurement, screen-reader run or new action creation was performed. Code-confirmed observations are distinguished from visually observed ones. Screenshot scroll positions do not establish every initial viewport. Closed/select-menu screenshots do not establish keyboard behavior. No full accessibility or mobile-certification claim is made.

Classification: A = immediately communicates user value; B = understandable but passive; C = developer/internal framing; D = dead-end/not active; E = hides an existing useful capability. Multiple classifications can apply; these are UX classifications, not new Stage 9 severity findings.

## Current surfaces and flow

| Step | Surface / source | Class | General health and evidence | Proposed direction |
| --- | --- | --- | --- | --- |
| 1 | Home, IMG_4527 / 01-home | C, E | Product promise is readable but the large headline occupies most of the phone screen. Build-stage content and architecture link follow; source confirms no useful task launch in the Home body. | Compact outcome launchpad with one authorized current-project entry and three real tasks. |
| 2 | Projects, IMG_4528 / 02-projects | B, E | Working authorized Xinyi card and clear Open project link. Only name/Active is offered; useful project context is another step away. One visible project is not an authorization defect. | Clear active work; richer selected-project context only from the existing authorized workspace read. Do not pad the list with comparator records. |
| 3 | Knowledge, IMG_4529 / 03-knowledge | C, D, E | Broad promise, long introduction, category pills that are spans in source, no knowledge task to perform. | Bounded questions linked to actual comparison/evidence paths. Explain that freeform search is planned. |
| 4 | StrideBrain, IMG_4530 / 04-stridebrain | C, D, E | Negative chatbot positioning and implementation language precede an inactive composer. | Ask StrideBrain with explicit suggested-workflow buttons and selected project context; no fake chat box. |
| 5 | Settings, IMG_4531 / 05-settings | C, D | Server-side identity/permission architecture dominates. Source shows an informational placeholder, not editable preferences. | Language first; accurately labeled account/access information; planned controls plainly marked. |
| 6 | Global/project navigation, IMG_4527–4532 | B, E; D for specific tabs | Navigation works in the supplied sequence, but labels extend beyond the narrow viewport. Source confirms Commercial and Evidence project tabs fall through to unavailable placeholders; actual evidence is inside comparison. | Clearly reachable mobile navigation; distinguish implemented paths. Do not link new prompts to those placeholder tabs. |
| 7 | Xinyi workspace and comparison entry, IMG_4532–4533 / 06–07 | A, E | Real project/client/location/area/programme and a useful “Have we done something like this before?” action. In the supplied portrait views, header/context pushes the task farther down. Warning says data needs attention without naming it. | Compact context plus Compare with past work; specific authorized warning wording and visible next task. |
| 8 | Comparison, IMG_4535 / 08-compare-results plus IMG_4541 | A, C, E | Ranked projects, selection and matching explanations are useful. Large header/metadata, six tall candidate cards and detailed tables put financial signals and review entry farther down. “Immutable economics enrichment” and selection IDs expose implementation. | Short result summary/decision signals above the long details; keep ranked projects, change-selection controls and derivation inspectable. |
| 9 | Evidence/source, IMG_4543–4547 / 09–10 | A, B | Exact source version, authority and calculation are visible; source return worked in supplied sequence. “Open source object” is internal wording; detailed maths dominate some panels. | “View source”; plain claim meaning first, source/authority next, calculation expandable. Preserve all provenance and distinctions. |
| 10 | Internal review, IMG_4549–4550 / 11-internal-review | A, B | Bounded wording choices and retained findings are visible. Full selected wording below truncated native selects is helpful. Title “Review internal review action” is repetitive. Creation/receipt was not completed in this phone run. | “Review next steps”; keep explicit confirmation, uncertainty, due date and retained findings; persistent receipt/action link remains essential. |

## Biggest five value-communication problems

1. **The first screen consumes attention without offering a useful start.** Home's large generic promise and build narrative delay the first task. Put a compact current-work card and a primary next action in the first viewport. Evidence: step 1.
2. **Primary-value destinations promise more than they let a user do.** Knowledge and StrideBrain are top-level but inactive; Commercial/Evidence project tabs also lead to unavailable surfaces. Replace broad promises with bounded working entry points. Evidence: steps 3–6 and route source.
3. **The most useful conclusion arrives after the longest reading/scrolling.** Context, ranking cards, metadata and full comparisons precede the “what should I review?” moment. Promote existing structured signals and a review entry; do not change the calculation or silently create a result on page load. Evidence: steps 7–8.
4. **Technical language competes with business meaning.** Deterministic, immutable, server-side, later-slice and source-object copy makes users learn the system. Move necessary derivation/provenance into details and use task labels. Evidence: steps 1, 3–5, 8–9; source copy.
5. **Company experience and the next action feel disconnected.** A lone project card, inert knowledge categories and a review entry far below results fail to make the product feel like one working company context. Connect the existing authorized project, comparator summaries, exact sources and internal actions into one visible journey. Evidence: steps 2–3, 7–10.

## Strengths to preserve

- Ranked precedents and inspectable matching factors answer a useful real question.
- Financial observation labels and source versions preserve meaningful distinctions.
- Evidence can be opened and returned from without losing the selected comparison.
- Bounded review wording makes action intent editable while retaining verified findings and limits.
- Language controls are visible; supplied native-input and language-switch attestations are useful but narrower than comprehensive proof.

## Accessibility and device considerations

Large text itself is not a defect; the observed issue is hierarchy and time spent reaching the task. Check reflow and readable type when compacting it. Horizontal navigation requires discoverable movement; clipping alone does not establish an unusable control. Preserve native selects, full selected wording, date input, labels, focus return and touch targets. Do not remove warnings or consent to shorten the flow. Screen-reader completeness, keyboard/zoom behavior and measured contrast remain outside this screenshot audit.

## Source corroboration

- Home and inactive global pages: `src/app/[locale]/page.tsx`, `knowledge/page.tsx`, `stridebrain/page.tsx`, `settings/page.tsx`; `src/modules/localization/catalog.ts`.
- Authorized list only exposes businessKey/name/active: `src/modules/projects/application/list-authorized-projects.ts`; repository filters tenant and assignments before returning names.
- Workspace already exposes authorized stage, context, warnings, commercial observations, evidence health and open actions: `src/modules/projects/domain/project-workspace.ts`.
- Comparison and action routes are real; Commercial/Evidence tabs fall through to unavailable: `src/app/[locale]/projects/[projectKey]/[[...surface]]/page.tsx`.
- Actual results and signals: `src/modules/comparison-experience/build-comparison-experience.ts`; UI in `src/components/comparisons/comparison-experience-client.tsx`.
- Evidence routes require actual run/enrichment/source context: `src/modules/evidence-panel/route-state.ts`.

## Evidence inventory

The following SHA-256 identifiers tie observations to user-supplied originals. Images are private local evidence, not remotely published. The inventory is appended by the preparation script.

| ID | Supplied image | SHA-256 |
| --- | --- | --- |
| 01-home | IMG_4527.PNG | `597041d0bcab3843812ff001596bb582d48f07d941954dfff7abfae9d180f6f0` |
| 02-projects | IMG_4528.PNG | `9a8991cdbaa7fa4b302f205469a0d3d9d26531d9d479c4648308b4d1f7531694` |
| 03-knowledge | IMG_4529.PNG | `5b32b63445015575e6caeedd006f40a4068de657a205a0c90a051db5d0022b2f` |
| 04-stridebrain | IMG_4530.PNG | `c0bc3565619dbdbddfe4612fdc069e82345f5e65c444f250c7f42ed1d43e93de` |
| 05-settings | IMG_4531.PNG | `4e798588a63085e4124b00e645404445496410fc08cb7536760cd284f10b48c9` |
| 06-workspace | IMG_4532.PNG | `3ef831f6019b03633ba72208f910451ef92afa1b66fd6d0812ec80d4fbdbeab5` |
| 07-compare-entry | IMG_4533.PNG | `2abcdc8383555eecb431634ee71c62a35486f49122ffa84f75c881ddede49eee` |
| 08-compare-results | IMG_4535.PNG | `d484507308ed54c62916ef4ba0100e77c72fd3eda7152f18c1f62002bcb5118a` |
| 09-factor-source | IMG_4545.PNG | `7055bd60be2d085b8e702234c5f0d9591e648b50edf704b79a208206d6a02591` |
| 10-claim-evidence | IMG_4547.PNG | `067ed2df15567258e476bd696ee2f328bf5255863d82d2560be12a632cb791fa` |
| 11-internal-review | IMG_4550.PNG | `c4dad2a594767981bea9458638e5d02ebda471d7f5dc69454cb4cde4a523cac8` |
