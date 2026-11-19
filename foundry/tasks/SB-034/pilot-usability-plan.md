# SB-034 pilot usability plan

Status: prepared, not run. Sample: 3–5 first-time interior-design users. Purpose: learn whether the product is immediately useful and understandable. This is not an architecture demonstration, release certification, or statistically representative study.

## Setup before the participant arrives

- Recruit people who actually review project quotations, coordinate delivery, or look for past project information. Include a designer and a project lead/owner if possible. Exclude people who have seen the walkthrough, screenshots or storyboard from the first-time denominator.
- Use the final SB-034 candidate in a separately authorized, isolated hosted synthetic preview only after the hosted rehearsal and essential gates below. Do not use Stage 9 QA or customer records. Use one fresh authorized session per participant, and isolate any review actions created during the exercise.
- Start authenticated on Home with the participant's preferred language, no open panels, no preselected demonstration path, and no expired review proposal. Use the same Xinyi synthetic starting data for everyone. Record the exact commit and selected history. Never reset a shared database during another session.
- Aim for at least one actual iPhone session and one desktop session. Include both English and Traditional Chinese across the group where participants naturally use them. One first exposure per participant: a later language/device switch is a secondary check, not another first-time result. Record any missing coverage honestly.
- Reserve 15–20 minutes: consent/setup, 60-second exploration, brief comprehension answers, 5–10 minutes of tasks, then post-test questions. Ask for recording permission without describing features. If declined, take notes. Use participant codes, not names, in the report; sanitize any shared recording/still images.
- The moderator reads the script; a quiet observer records clicks, hesitation, exact language, timing and assistance. No founder narration, guided tour, pitch deck, hints about the best feature, or architecture vocabulary before the test.

## First-time-user script

Give only this product context, verbatim:

> “StrideBrain is designed to make everyday project work easier using your company’s own knowledge and experience. Please explore it as if this were your company.”

Start the clock when the ready Home page is visible. Allow free exploration for 60 seconds. Do not identify the current project, name navigation choices, point to controls, or ask them to seek evidence. Record spontaneous comments without asking for praise. If they ask what to click, say only: “Please choose what you would naturally try.” Mark the request for help. If the page is technically unavailable, stop and record a setup/product failure; do not count a coached restart as the same first exposure.

## 60-second comprehension test

At exactly 60 seconds, ask them to pause where they are. Record their current route and what they actually reached. Then ask, without correcting their answers:

1. “In your own words, what is this for?”
2. “What could you use it to do in your work?”
3. “Where would you start, and what would you expect to happen?”
4. “What do you think it uses to help you?”
5. “What would you do next with what you found?”

Capture each answer verbatim. Answers are elicited immediately after the 60-second exposure; do not claim that the interview itself fit inside 60 seconds. Record the first spontaneous correct explanation and its time if one occurred earlier. Do not award comprehension for repeating the introductory sentence alone, reciting labels, or mentioning AI.

**Comprehension PASS:** the participant connects company records/past experience to at least one concrete current-project benefit (such as finding relevant precedent, reviewing quotation differences, checking a source, or organizing an internal follow-up), identifies a plausible start without a navigation hint, and does not attribute unsupported approval, messaging, unrestricted chat, or autonomous decision-making to the product. Record partial understanding separately: benefit understood / company context understood / start understood / next step understood / unsupported expectation. Also record the five original objective questions separately; a single composite score must not hide a failed dimension.

## Task sequence: 5–10 minutes after comprehension

Read one goal at a time. These are goals, not UI instructions. If the participant already achieved a goal during free exploration, acknowledge completion and continue; do not force a second attempt. Task time excludes time spent answering moderator questions. Allow roughly 60–90 seconds per goal, up to 10 minutes total. After 30 seconds with no progress, repeat the goal once without naming a control. At the time limit, record the failure before offering a rescue so later tasks remain observable.

| Step / target time    | Read to participant                                                                                                                              | Observe before intervening                                                                                                                     | Completion evidence                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 / 1 minute          | “Find the current project and tell me where it stands.”                                                                                          | Starting choice, project recognition, confusion about demo context.                                                                            | Opens Xinyi and identifies quote-review context; does not need to recite IDs or exact amounts.                                                                                                                                                                                                                                                                                                                |
| 2 / 1–2 minutes       | “You are preparing to review this quotation. Find out whether your company has done similar work before.”                                        | Whether they discover the comparison entry themselves; expectation before clicking.                                                            | Reaches actual historical matches using the existing comparison workflow. Record time to discover ‘Compare with past work’ separately from result loading.                                                                                                                                                                                                                                                    |
| 3 / 1–2 minutes       | “What deserves your attention here, and what would you do about it?”                                                                             | Which finding they choose; whether they inspect supporting material spontaneously; what the percentages mean to them.                          | Explains a specific finding with the correct financial basis and a review implication; recognizes at least one limit. For the default three projects, stone forecast is +18.4% versus eligible historical actual cost, and lighting actual evidence is insufficient (2/3). Values depend on selection: use the visible persisted result, not memorized percentages.                                           |
| 4 / 1 minute          | Only after the unprompted opportunity: “What would make you comfortable relying on that finding?”                                                | Whether and how they seek support, return from the panel, and relate the source to the claim.                                                  | Opens supporting evidence and explains why it is relevant. If they already did this, ask what they learned. Opening evidence after this question is **prompted**, not natural discovery.                                                                                                                                                                                                                      |
| 5 / 1–2 minutes       | “You want a colleague to look into that concern. Show what you would do next, and tell me what you expect it to do before you confirm anything.” | Whether internal review is discoverable; expectations about persistence, recipient, approval and external contact; confidence at confirmation. | Opens the review, explains that it records an internal follow-up with findings/limits, and understands it does not approve/send the quotation or contact anyone. Record their answer before correction. In an authorized isolated pilot workspace, let the participant choose to confirm and inspect the receipt; otherwise stop before submission and mark creation untested. Do not submit on their behalf. |
| 6 / optional 1 minute | “Where would you look for something your company already knows? Where would you go when you have a project task to do?”                          | Knowledge versus StrideBrain expectations, repeated destinations, unsupported chat expectations.                                               | Can explain or demonstrate a useful distinction; confusion is a finding, not an invitation to teach.                                                                                                                                                                                                                                                                                                          |

If a rescue is needed, offer the smallest navigational hint only after recording the unaided result. Mark every later task influenced by the hint. Do not correct a financial misconception until its answer is recorded; then prevent it carrying into an actual decision. The synthetic exercise must not become advice about a real quotation.

## Observer sheet and coding

Use [pilot-observer-sheet.md](pilot-observer-sheet.md), one copy per participant. Record actual behavior and quotes first, interpretation second. Mark an outcome as `NOT OBSERVED` when time, setup, consent or a prior failure prevents it; never turn missing evidence into PASS.

- **Task PASS (P):** completes the goal unaided within its time window and explains the result correctly.
- **Friction (F):** eventually succeeds after a wrong turn, repeated rereading, unclear wording, or a prompt. Record seconds, backtracks and the concrete cause. A successful click with a wrong interpretation remains friction or failure, not PASS.
- **Blocked / incorrect (B):** cannot finish, abandons, or fundamentally misunderstands the outcome after the time window.
- **Assistance:** A0 none; A1 neutral repeat of goal; A2 navigation/content hint; A3 moderator takeover. Only A0 is an unaided PASS. Mark help requested even if no hint was supplied.
- **Friction severity:** F0 none; F1 brief self-recovery; F2 repeated hesitation or a hint needed; F3 task blocked or consequential misunderstanding. These are observation codes, not engineering P0–P3 severity.
- **Wow:** W0 no value statement; W1 prompted positive reaction; W2 spontaneous, specific time-saving/usefulness statement tied to a screen or task. Record the exact words and what they currently do instead. “Looks nice” alone is not W2. Do not ask “Was that a wow moment?”
- **Evidence discovery:** E0 not opened; E1 opened only after an evidence/trust prompt or hint; E2 opened spontaneously before such a prompt. Record the timestamp and triggering question, if any.
- Keep confidence (self-reported 1–5), comprehension, task completion and wow as separate columns; do not average away a dangerous misunderstanding.

## Post-test questions

Ask in this order, after the task observations are frozen:

1. “Which part, if any, would be useful in your work? What would it replace?”
2. “Where did you hesitate or feel unsure? What did you expect instead?”
3. “What did you think the internal review action would do?”
4. “Was anything presented as more certain than you felt it should be?”
5. “What is the difference, if any, between Knowledge and StrideBrain to you?”
6. “What did you immediately wonder whether it could also do?”
7. “If you could change one thing before using this again, what would it be?”
8. “How confident would you be using this without help, from 1 to 5? Why?”

For a claimed time saving, ask for the present-day task and effort: “How do you do that today?” Treat estimated saved time as a participant estimate, not a measured product performance claim. Do not pitch a roadmap in response to feature requests until the interview is over.

## Pilot decision rules

Predeclare these thresholds before participant 1. Report every participant and raw counts (for example 3/4), device/language, assistance and exact quotes. With 3–5 users, this is a directional usability gate, not statistical validation.

- **Directional usability PASS:** at least n−1 participants meet the 60-second comprehension PASS and independently find the current project and comparison; at least n−1 correctly explain a finding and the internal review outcome. No unresolved consequential misconception or required-path product blocker. Report each condition separately.
- **Evidence discovery signal:** E2 from at least half the group, rounded up, suggests evidence is naturally discoverable. Lower E2 with successful E1 calls for a focused affordance/content review, not a claim that users do not care about evidence.
- **Felt-value signal:** W2 from at least half the group, rounded up, with concrete work displaced. Below that, value remains unproven even if all tasks are operable. W1 counts separately and cannot substitute for W2.
- **Friction outcome:** a repeated F2 pattern in two or more participants justifies investigating a narrow revision. A single F3 that could mislead financial decisions or block the core journey is enough to pause rollout for diagnosis. Single low-impact preferences are logged without automatically expanding scope.
- **Next step:** retain what participants understand, fix reproducible blockers, and prioritize the strongest repeated problem. If the 60-second or value signal fails, revise the specific entry/copy/sequence implicated and use new first-time participants to retest. Do not teach the original users and relabel their second attempt as a first-time PASS.

## Defects, usability problems and feature requests

| Classification      | Example                                                                                                                                     | What to record / do                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product defect      | Required action fails; content overlaps a control; wrong financial basis; source opens the wrong record; duplicate action creation.         | Expected versus observed result, steps, candidate, locale/device and sanitized evidence. Reproduce separately; security/integrity or core-path blockers gate pilot continuation.                                               |
| Usability problem   | Existing capability works, but two users cannot find it; they confuse quotation with actual cost; Knowledge and StrideBrain seem identical. | Exact expectation, observed route, assistance and affected goal. Treat misleading framing as a product issue, even if the code behaves as designed. Test a narrow remedy.                                                      |
| Feature request     | “Can this draft an email, search all PDFs, coordinate suppliers, or answer any question?” when those are not current capabilities.          | Underlying job, current workaround, frequency and desired outcome. Do not promise delivery or count absence as a broken existing workflow. If current UI implies the capability exists, log a copy/expectation defect as well. |
| Setup / study issue | Expired test session, slow connection, moderator named the button, participant already saw the demo.                                        | Record contamination or setup failure. Repair setup without silently replacing the observation; exclude from first-time claims when necessary.                                                                                 |

## Gates before hosted participant access

This plan does not authorize deployment. The final local candidate can move to a separately scoped isolated hosted preview, then a rehearsal of Home → current project → comparison → evidence → confirmed internal review/receipt. Before testers enter: no open P0/P1 security/integrity issue or required-path P2; tenant/session isolation, bilingual flow, financial/evidence claims and action/idempotency intact; usable real iPhone path; stable hosted preview and rehearsed rollback. Carry forward Stage 9 evidence accurately and record environment-specific gaps. Full VoiceOver completion, unavailable-device Android certification, exhaustive visual baselines and performance micro-optimization remain deferred as agreed.

Revoke pilot sessions after each session, retain only approved synthetic study records, sanitize evidence, and stop temporary local services. Produce a one-page synthesis with the ten primary questions, raw outcomes, top three confusions, exact W2 quotes, and separate defect/feature-request lists. Human comprehension and felt usefulness remain **NOT MEASURED** until these sessions actually run.
