# SB-034 independent UX/value review

Current status: **PASS_SCOPED_AUTHENTICATED_VISUAL_REVIEW_WITH_P3_FOLLOW_UP.** The authenticated addendum below supersedes the earlier visual-evidence limit; the first-60-second human objective remains unmeasured.

Historical status: **PASS_SCOPED_SOURCE_AND_PUBLIC_VISUAL_REVIEW — bounded findings addressed; authenticated visual acceptance and first-60-second comprehension remain unverified.**

Reviewer: independently delegated Codex agent `sb034_independent_ux_review`, separate from the implementation author. Date: 2026-11-19. Reviewed the uncommitted SB-034 implementation against baseline `19c98f799de43876e6eea83fd9d336518476fe0a` and the user's approved implementation direction.

This is an independent source review and comparison with supplied historical iPhone evidence. It is not a current authenticated browser pass, human Taiwan Traditional Chinese language approval, independent rerun of F01–F05, or measured first-time-user study. The author reports automatic approval review rejected a synthetic database copy/session setup. This reviewer did not access a database, issue a session, or attempt a workaround. Public screenshots can establish only anonymous layout.

## Implementation review

The hierarchy changes are meaningful: authorized current work and real tasks replace build framing, financial findings precede the long comparison matrix, and source records precede calculation mechanics. Four bounded presentation findings were sent to the author and independently re-reviewed after revision. None requires new backend capabilities or restarting Stage 9 certification. No unresolved source-level blocker was observed within this UX slice; this does not establish runtime or visual acceptance.

| ID | Priority | Initial source | Finding and correction | Disposition |
| --- | --- | --- | --- | --- |
| UX-01 | P2 value | `src/components/demo-value/value-launchpad.tsx:74–96` | Four distinct questions lose their intent at the same generic comparison start. Prerequisite copy is truthful, but users must remember their question and rediscover the relevant result. Preserve validated presentation intent or narrow tasks to the real workflow they open. | **Addressed in source.** Final lines 74–103 offer distinct comparison, current quotation, records attention and Actions destinations. Home quotation goes directly to commercial context. Specific stone/material answer promises are not rendered. |
| UX-02 | P2 interpretation | `src/components/comparisons/comparison-experience-client.tsx:403–424` | The top-three ranked projects always appear immediately above financial findings, even after the selected baseline changes. Show the persisted selected names adjacent to findings; pending checkbox state must not relabel stored figures. | **Addressed in source.** Final lines 422–432 name projects from `view.route.selectedProjectKeys`, separate from pending checkbox state. The new regression explicitly covers a stored B/C/D baseline while A/B/C is pending. |
| UX-03 | P2 mobile navigation risk | `src/components/evidence/evidence-panel.module.css:383–386` | Making the entire mobile header non-sticky removes the only visible Close/Back control during long source-list reading. Keep a compact sticky control bar while the title scrolls. This is a source-backed risk, not a newly observed device failure. | **Addressed in source.** Final `evidence-panel.tsx:107–118` separates sticky controls from the scrolling title; CSS retains sticky position and a mobile 44px control. The existing close-layer handler is unchanged. Actual mobile scroll/focus behavior remains unverified. |
| UX-04 | P3 comprehension | `src/components/evidence/evidence-panel.tsx:378–395,451–455` | Factor mode has no claim summary, so collapsing the whole trace hides the factor explanation/state until after sources. Keep the existing factor explanation/state visible before sources; leave mechanics in details. | **Addressed in source.** Final lines 389–404 expose the existing factor explanation/state/value before sources, leaving calculation details collapsed. No new formula or unsupported interpretation was added. |
| UX-05 | P2 visible navigation | Intermediate `evidence/screenshots/en-home-mobile-public.jpg`; `src/app/globals.css:750` | Projects, Knowledge and StrideBrain overlapped because hiding the marker left the inherited two-column grid sizing. | **Addressed and visually rechecked.** Mobile nav items now use non-shrinking flex sizing. Replacement EN/zh-TW mobile captures show separated readable navigation; English Settings wraps to a second row. |

## Public visual review

Independently inspected all 16 final screenshots in `evidence/screenshots/`: Home, Knowledge, StrideBrain and Settings, EN/zh-TW, 1440×900 and 390×844. They are explicitly signed out. The intermediate mobile navigation overlap was observed, reported, fixed by the author, and confirmed absent in replacement captures.

The desktop first viewport now visibly presents the task choices without requiring introductory scrolling. The mobile heading is substantially smaller than the supplied original; the shell and task titles are readable after the nav correction. Settings visibly separates working language choices from Planned items. No new clipping or overlap was observed in the final public capture set.

The English mobile shell uses a second row for Settings, and the context/prerequisite content means Knowledge's first question only begins near the viewport bottom. This is a remaining density weakness, not a demonstrated core-path failure; the authenticated layout may differ. The screenshots cannot prove current project identity, commercial signals, comparison results, evidence drawer scrolling, confirmation, or action creation, because none of those authorized states is shown. They do not establish that the user can see a meaningful financial finding within 60 seconds.

## Positive source observations and limits

- Home uses the existing authorized list and one authorized workspace read. URL project selection is checked against that list, and missing identity has no synthetic fixture fallback. No new entry GET creates comparison, proposal or action records.
- New task labels expose recognizable outcomes; Planned assistance has no execution controls; no fake freeform composer or separate Agents destination was added.
- Workspace quote, forecast and actual remain distinct. Observation type, version, authority, freshness and unavailable/restricted/conflicted states remain represented.
- The comparison uses existing structured findings and claim keys. The lighting actual-evidence gap and unquantified programme premium remain explicit. No financial calculation or action policy is changed.
- Dead-end Commercial/Evidence tabs are removed, while the authorized Projects route and working Actions entry remain.
- English/Traditional Chinese primary copy has parity at source level. This is not qualified human language acceptance. Mobile CSS is more compact, but the requested authenticated matrix is still needed to judge real content wrapping and the fold.

## F01–F05 preservation assessment

At source level, F01's real authorized Projects route is retained; F02's localized workspace/evidence state mapping remains; F03's loading implementation is unchanged; F04's immutable economics/action implementation is unchanged; F05's date validation and action-form date handling are unchanged. The moved review controller retains its identity key and handlers. This is not a fresh independent regression pass. The author's deterministic test/build output is separate evidence.

## Remaining value questions

1. Does authenticated 390×844 Home expose a useful start promptly? Multiple authorized project choices and single-column tasks may delay Needs attention; source alone cannot establish the fold.
2. Home attention currently describes truthful workspace warnings, not stone/lighting findings. Those richer signals require the existing explicit comparison. Do not fabricate them merely to make Home look useful.
3. Knowledge and Ask StrideBrain still cover related capabilities; their distinction and the first 60 seconds need observation with an uncoached first-time user.
4. Presenter recording, deterministic checks and screenshots do not establish the 60-second comprehension objective.

The Phase 1 review packet below is retained as historical planning context. The latest user attachment explicitly approved implementation and supersedes its previous approval gate.

## Inputs ready for review

- `brief.md`: five-question 60-second outcome and narrow pilot boundary.
- `ux-audit.md`: supplied-image/source observations, classifications and evidence limits.
- `information-architecture.md`: Home/Projects/Knowledge/StrideBrain/Settings and conditional Agents decision.
- `copy-strategy.md`: proposed English/Taiwan Chinese strings and financial-language safeguards.
- `demo-storyboard.md`: all ten requested steps, target timing and consent/comprehension distinction.
- `build-contract.md`, `test-plan.md`: smallest scope, unchanged integrity boundaries and focused future checks.

## Review decisions requested

1. Does the first screen expose working outcomes and a clear authorized start?
2. Is Knowledge meaningfully distinct from Ask StrideBrain without implying unrestricted search/chat?
3. Does the proposed prompt mapping reach actual bounded workflows, avoiding unavailable tabs and invented source/run identifiers?
4. Is a small Planned assistance section preferable to an Agents top-level destination for this pass? Proposed answer: yes; dedicated Agents navigation deferred.
5. Are project stage/history/attention claims limited to data actually returned by authorized services?
6. Does the storyboard teach usefulness within 60 seconds without rushing consent or hiding uncertainty? Timing is a hypothesis; action completion may take longer in an uncoached trial.
7. Are financial distinctions, access boundaries, freshness, idempotency and audit/history intact?
8. Is the recommended scope small enough to improve the demo before a controlled pilot, without becoming a new platform build?
9. Is new Taiwan Traditional Chinese copy natural and precise? A separate qualified human language decision remains required.

## Author-identified risks for the reviewer

| ID | Risk | Proposed resolution | Independent disposition |
| --- | --- | --- | --- |
| R1 | Ten deliberate steps including evidence/consent may exceed 60 seconds for a novice. | Separate measured comprehension from full action completion; do not rush or fake confirmation. | PENDING |
| R2 | Rich Projects/Continue cards could leak or invent data. | Existing list boundary; only authorized workspace data; no last-visited/completed claims from an active boolean. | PENDING |
| R3 | Suggested prompts could merely rename dead-ends. | Map each to valid comparison/evidence/Actions context and show a real prerequisite when no result exists. | PENDING |
| R4 | Agents could look operational despite a Planned badge. | Informational cards only; no Run/Enable, activity feed, agent counts or autonomy claims; defer new nav. | PENDING |
| R5 | Simplified quote language could imply approval or conceal insufficiency. | Preserve observation/authority/freshness labels and limitations adjacent to signals. | PENDING |
| R6 | A screenshot audit could be mistaken for measured usability or current authenticated desktop proof. | Explicit evidence limits; no fresh login, timed trial, product QA or action creation in Phase 1. | PENDING |

## Gate

Historical Phase 1 gate: the user required audit/storyboard review before product-source changes and subsequently approved the implementation direction. This independent review assesses that implementation. Authenticated visual acceptance and measured user usefulness remain pending; no deployment, merge or pilot readiness is approved by this document.

## Authenticated visual addendum — 2026-11-19

**Verdict: PASS_SCOPED_AUTHENTICATED_VISUAL_REVIEW_WITH_P3_FOLLOW_UP.** The supplied authenticated captures support the new value hierarchy and the visible insight → evidence → review path. The remaining concrete layout finding is excess mobile Projects header space. This is an independent expert assessment of captured screens, not measured first-time-user comprehension, live behavioral verification, pilot acceptance, or deployment approval. The earlier source/public review and its then-current limits remain above as historical evidence; this addendum adds the authenticated visual evidence that was previously unavailable.

Independently inspected all 54 supplied authenticated screenshots at 1440×900 and 390×844 across English and Traditional Chinese. They were read from the isolated local capture directory; links below point to the author's subsequently published, sanitized [evidence packet](evidence/authenticated/README.md). The separate revocation screenshot is not part of this 54-image UX review. The reviewer used no browser, session, database, runtime secret file, or product mutation and made no product-source changes.

### Captured journey and health

| Step | Visual health | Independent observation | Representative evidence |
| --- | --- | --- | --- |
| 1. Recognize current work on Home | Good | Xinyi, its quotation-review context and the Open project control are immediately identifiable. Desktop shows the four useful starts together; mobile shows current context and the first comparison task in the initial viewport. | [EN desktop](evidence/authenticated/screenshots/en-home-desktop.jpg), [EN mobile](evidence/authenticated/screenshots/en-home-mobile.jpg), [zh-TW desktop](evidence/authenticated/screenshots/zh-TW-home-desktop.jpg), [zh-TW mobile](evidence/authenticated/screenshots/zh-TW-home-mobile.jpg) |
| 2. Open an authorized project | Good, with P3 density issue | Projects gives one clear current project and an Open project link. Both mobile locales have a large unused dark area below navigation; the project remains reachable and visible in the captured viewport. Desktop has no equivalent layout problem. | [EN repeated mobile capture](evidence/authenticated/screenshots/en-projects-mobile-repeat.jpg), [zh-TW mobile](evidence/authenticated/screenshots/zh-TW-projects-mobile.jpg), [EN desktop](evidence/authenticated/screenshots/en-projects-desktop.jpg) |
| 3. Understand current project position | Good | Identity and comparison entry are compact. Quote and forecast appear separately with versions and review authority. Actual-cost availability, attention and data health remain explicit. Mobile exposes identity, comparison and commercial figures without the former oversized introduction. | [EN desktop](evidence/authenticated/screenshots/en-workspace-desktop.jpg), [EN mobile](evidence/authenticated/screenshots/en-workspace-mobile.jpg), [zh-TW mobile](evidence/authenticated/screenshots/zh-TW-workspace-mobile.jpg), [zh-TW lower workspace](evidence/authenticated/screenshots/zh-TW-workspace-desktop.jpg) |
| 4. Choose a bounded Knowledge or StrideBrain task | Good; distinction still modest | The task cards describe working destinations and the comparison prerequisite. Similar work, current quotation, records needing attention and open actions have recognizable purposes. The supplied destination captures show commercial context, attention and an honest empty Actions state. Repeated current-project introduction delays the tasks on mobile, and the two destinations still share much of their purpose. | [EN Knowledge tasks](evidence/authenticated/screenshots/en-knowledge-tasks-mobile.jpg), [zh-TW StrideBrain tasks](evidence/authenticated/screenshots/zh-TW-stridebrain-tasks-mobile.jpg), [quotation destination](evidence/authenticated/screenshots/zh-TW-knowledge-quote-destination-desktop.jpg), [attention destination](evidence/authenticated/screenshots/en-stridebrain-attention-destination-mobile.jpg), [Actions destination](evidence/authenticated/screenshots/zh-TW-stridebrain-actions-destination-desktop.jpg) |
| 5. Find relevant past work | Good | Three ranked precedents and readable scores provide an immediate answer to whether comparable work exists. The introductory title is substantially more compact than the supplied original iPhone experience. On mobile, the three precedents occupy most of the first viewport, so financial findings require further scrolling. | [EN desktop](evidence/authenticated/screenshots/en-comparison-desktop.jpg), [EN mobile](evidence/authenticated/screenshots/en-comparison-mobile.jpg), [zh-TW desktop](evidence/authenticated/screenshots/zh-TW-comparison-desktop.jpg), [zh-TW mobile](evidence/authenticated/screenshots/zh-TW-comparison-mobile.jpg) |
| 6. Understand what needs review | Good, with scanning opportunity | Financial findings precede the long comparison and selection detail. Saved baseline names appear beside findings, distinct from the ranked summary. Quote, forecast versus reconciled actual, insufficient lighting actual evidence and an unsupported programme premium remain differentiated. See evidence is conspicuous, and internal review follows the findings before the long matrix. | [EN desktop](evidence/authenticated/screenshots/en-findings-desktop.jpg), [EN mobile](evidence/authenticated/screenshots/en-findings-mobile.jpg), [zh-TW desktop](evidence/authenticated/screenshots/zh-TW-findings-desktop.jpg), [zh-TW mobile](evidence/authenticated/screenshots/zh-TW-findings-mobile.jpg) |
| 7. Inspect evidence supporting a finding | Good in captured claim mode | The claim summary and its forecast authority are visible before supporting sources and mechanics. Close evidence has a compact separate control bar. The distinction between a forecast claim and the historical reconciled-actual source is visible. Dense prose still makes amounts and variance slower to scan than the main finding cards. | [EN desktop](evidence/authenticated/screenshots/en-evidence-desktop.jpg), [EN mobile](evidence/authenticated/screenshots/en-evidence-mobile.jpg), [zh-TW desktop](evidence/authenticated/screenshots/zh-TW-evidence-desktop.jpg), [zh-TW mobile](evidence/authenticated/screenshots/zh-TW-evidence-mobile.jpg) |
| 8. Inspect the exact source | Good | The source exposes project, record type, version, date, exact locator and historical/reconciled-actual authority. Back to evidence bundle is visible, and the result relying on the source is identified. This is a concrete company-knowledge value moment rather than only an assurance that evidence exists. | [EN desktop](evidence/authenticated/screenshots/en-source-desktop.jpg), [EN mobile](evidence/authenticated/screenshots/en-source-mobile.jpg), [zh-TW desktop](evidence/authenticated/screenshots/zh-TW-source-desktop.jpg), [zh-TW mobile](evidence/authenticated/screenshots/zh-TW-source-mobile.jpg) |
| 9. Review the proposed internal action | Good; some mechanical wording | The form retains the findings and uncertainty while permitting review wording. Narrow native selects truncate their displayed options, but the full selected text is immediately repeated below, preserving comprehension. The English title “Review internal review action” and visible run identifiers add avoidable reading effort. | [EN desktop](evidence/authenticated/screenshots/en-review-desktop.jpg), [EN mobile](evidence/authenticated/screenshots/en-review-mobile.jpg), [zh-TW desktop](evidence/authenticated/screenshots/zh-TW-review-desktop.jpg), [zh-TW mobile](evidence/authenticated/screenshots/zh-TW-review-mobile.jpg) |
| 10. Review controls and explicit consent | Good visually; submission not exercised | Assignee, due date, permitted date range, clear-date control, consent checkbox and Create/Cancel controls are legible. The warning distinguishes a persistent internal review action from quotation approval or an external message. Mobile controls are stacked and visible. No action-creation outcome is asserted. | [EN desktop controls](evidence/authenticated/screenshots/en-review-controls-desktop.jpg), [EN mobile controls](evidence/authenticated/screenshots/en-review-controls-mobile.jpg), [zh-TW mobile controls](evidence/authenticated/screenshots/zh-TW-review-controls-mobile.jpg) |

### First-minute expert assessment

The experience now supplies a credible answer to “what can I do here?”: identify the current project, choose a comparison or quotation task, see a concrete variance or evidence gap, and open its supporting record. The strongest captured value sequence is ranked past work → a quotation or imported-stone finding → See evidence → an exact historical record → an internal review proposal. Current-project intelligence and company knowledge are visibly connected to a practical decision.

The first screen does not itself expose the richest financial insight. Home's attention is the truthful current-workspace warning, while the richer stone/lighting findings require the explicit comparison. That boundary is preferable to an invented result. Whether a novice reaches and understands that value inside 60 seconds is still an untested hypothesis. No timing, uncoached user task, comprehension interview or successful action submission was performed by this reviewer.

### Actionable finding

| ID | Priority | Evidence and user effect | Narrow follow-up | Scope disposition |
| --- | --- | --- | --- | --- |
| UX-06 | P3 | The dark shell extends to approximately 290px on [EN Projects mobile](evidence/authenticated/screenshots/en-projects-mobile-repeat.jpg) and 280px on [zh-TW Projects mobile](evidence/authenticated/screenshots/zh-TW-projects-mobile.jpg), versus roughly 165px/119px on the respective Home captures. The extra blank area delays the project content and makes this route feel less compact. The EN repeat capture shows the same issue. | Investigate the Projects shell's height/alignment and remove unused mobile space while preserving wrapping and touch targets. Re-capture just Projects in both locales after a narrow fix. Screenshot evidence justifies this investigation; it does not establish the responsible CSS rule. | Open visual follow-up. No clipped control or blocked core task was observed; this does not justify another broad product pass. No source change was made in this review. |

### Remaining weak spots, not new acceptance blockers

- Mobile comparison prioritizes all three precedents before money findings. Future first-user observation should determine whether a small direct “What needs review” entry would help; the current screenshots alone do not justify rearranging the approved flow.
- Knowledge and StrideBrain repeat current context and share three tasks. Their individual roles remain less distinct than their honest working destinations. On English mobile, the Knowledge first task starts near the initial viewport bottom.
- Technical financial headings, paragraph-style claim metadata and raw run identifiers compete with the user's decision. A later presentation refinement could make the outcome easier to scan and move technical identifiers into details while keeping every authority, uncertainty and lineage value attached. This is a readability opportunity, not evidence that the underlying claim is wrong.

### Evidence boundaries and preservation

The Traditional Chinese desktop workspace image is scrolled to commercial/attention/context content. It proves that portion's rendering, not its initial fold. Initial workspace fold evidence exists in English desktop and both mobile locales; Traditional Chinese Home initial-fold evidence also exists. This is a precise capture limit, not missing coverage of the entire workspace.

The authenticated evidence captures show financial-claim and source modes, not the revised similarity-factor disclosure. UX-04 therefore retains its source-level disposition without a new authenticated factor-mode visual claim. Static captures also cannot prove sticky controls throughout scrolling, focus return, keyboard/VoiceOver behavior, dynamic loading, date interaction, confirmation handling, action creation/idempotency, authorization or financial arithmetic. This addendum does not recertify F01–F05 or reinterpret the older user screenshots' figures as belonging to the new saved baseline.

Both locales show readable layouts and equivalent visible authority/uncertainty concepts in the inspected states; this is not a qualified Taiwan Traditional Chinese linguistic approval. No new overlap or clipping was observed in the reviewed authenticated core screens, apart from the documented excess space rather than obstruction on Projects.

The 390×844 images establish the captured mobile viewport layout, not a fresh physical iPhone/Safari run or Android device certification. Earlier user-reported device testing remains separate evidence.

The author reports the isolated session was revoked, its cookie cleared, the server and database container stopped, and signing material removed after capture; reported final state includes one comparison, one enrichment, one unconsumed PREPARED proposal and no Action or Receipt. These cleanup and integrity statements are author-supplied evidence, not an independent database audit. This review's own scope remained read-only screenshots and this report.
