# Build contract

Follow delivery A–F in order, one draft PR, one final Builder report after F, then stop.

A. Server-only named-job not-found sentence; recorded-answer replay.
B. Deterministic bilingual nearest readable job chips, maximum three, with a similarity floor. No automatic selection. A confirmed chip resends the original bounded question, verifies access/exclusion, and overrides page context.
C. Raise structured selection bound to 40; keep printed row limits. Expose fixed client/contact/site-address availability rows as ordinary job facts; one phrase id and no partial notice (review 7211242362).
D. Replace readable exact references in follow-ups with localized names; remove never-answerable contact/client-identity/site-address suggestions.
E. AI failures show the fixed sentence plus same-question retry; no keyword path for failed AI. AI-off and NO_KEY record search stay unchanged.
F. Extend free/evaluation suites; focused paid runs first, then at most one full run, total at most US$1.00. Enforce #79 pass rules and compare calls, p90 latency and cost with its baseline.

No private tool data fields or new reader access. No server word-list question classification. Preserve existing role, cross-organization, exclusion and redaction tests. No hosted changes. Run npm run check. Hosted acceptance waits for the Product Director.

## Reviewer clarification (7210266238)

Option 2 is provisional, awaiting the Product Director before merge. The user's typed question still reaches the model after existing PII redaction. No unreadable identity retrieved from records enters model context, chips or logs. Keep the final guard and its existing timing assertions. The same reader/question produces identical results and call metadata with an unreadable record present or absent.

Chip ranking uses Latin words (at least three characters) and adjacent Han pairs from bounded normalized text. At least half the shorter set of pieces must overlap. Rarer shared pieces among readable candidates carry greater weight; a stable reference resolves ties. Only access-checked, non-excluded candidates qualify. Up to three suggestions; never automatic selection.

F retains the 84 existing cases and adds 34 required cases (17 per language), including six fixed-detail cases from fix round 1. Full run: 118 × 3 questions plus existing draft cases. Absolute gates remain zero wrong values, disclosures and discards; every required case succeeds in at least two rounds and required answers at least 97% overall. The #79 baseline is accepted run 45804259788: median two calls, worst round p90 2,428 ms, aggregate question cost US$0.3526312 / 252. The 25% limits are 3,035 ms and US$0.001749162698 per question.

## Fix round 1 (7211242362)

Owner-authored review confirmed. The fixed availability facts are provisional, awaiting the Product Director before merge. Every job has Client, Contact details and Site address entries with the constant “Not shared with the AI.” / 「不提供給 AI。」. They contain no private value or additional record lookup. Follow-up questions about them remain filtered. Remove the partial phrase and provenance; complete answers must not select these entries unsolicited.

Rank missing-job candidates before access reads, examine at most ten and stop after three pass. Keep the paired present/absent and identity-boundary tests unchanged.

The Product Director authorized an additional US$1.00: focused partial/complete/new cases first, then only one full run after focused success. If any partial case is below 2/3, revise the single instruction sentence once and retry once; if still failing, stop and report. The original US$0.859081800 remains separately recorded. No pass-rule changes or hosted changes.

## Fix round 2 (7212254113)

Hosted acceptance at `5ebfbb6` was reported passed by the owner-authored Reviewer comment in all three roles; the Product Director will redeploy and recheck these three changes. No paid evaluation authorized or performed. No instruction, tool definition or tool-result change.

- A confirmed answer's follow-ups carry that confirmed key through the existing typed-chip path, unless existing identity matching finds another readable job in the follow-up. Unconfirmed turns stay unchanged; validation/access/exclusion checks are reused.
- Rank candidates as before, then drop scores below half the best score before the bounded access checks. Ties remain.
- Filter follow-ups asking for a job name/reference; quote document-number questions remain allowed.

The ranking floor and job-identity follow-up filter are provisional pending Product Director confirmation. Verify unit/integration tests, npm run check and a local one-tap confirmed follow-up screenshot, then report and stop.

### Item 2 decision (7214653618)

The owner-authored Reviewer comment replaces the half-best cutoff with 75%, keeping the scoring formula. Before that cutoff and before the limit, standalone digit runs in normalized searched text narrow already-ranked candidates if any candidate name/reference contains a matching run; leading zeros are ignored and digits inside Latin alphanumeric words are not standalone. No match leaves the ranked set unchanged. Numbers do not create candidates or change scores/coverage. Policy reads are unchanged.

This decision remains provisional pending Product Director confirmation. Cover the complete reviewer table with a 32-job identity fixture, keep tie/Chinese assertions, run the free evaluation and report old/new chips if any expectation changes. No model-facing change, paid evaluation or pass-rule change.
