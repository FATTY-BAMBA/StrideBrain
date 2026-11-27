# Build contract

Follow delivery A–F in order, one draft PR, one final Builder report after F, then stop.

A. Server-only named-job not-found sentence; recorded-answer replay.
B. Deterministic bilingual nearest readable job chips, maximum three, with a similarity floor. No automatic selection. A confirmed chip resends the original bounded question, verifies access/exclusion, and overrides page context.
C. Raise structured selection bound to 40; keep printed row limits. Add typed partial-answer phrase and server-rendered notice.
D. Replace readable exact references in follow-ups with localized names; remove never-answerable contact/client-identity/site-address suggestions.
E. AI failures show the fixed sentence plus same-question retry; no keyword path for failed AI. AI-off record search stays unchanged.
F. Extend free/evaluation suites; focused paid runs first, then at most one full run, total at most US$1.00. Enforce #79 pass rules and compare calls, p90 latency and cost with its baseline.

No new tool data fields or reader access. No server word-list question classification. Preserve existing role, cross-organization, exclusion and redaction tests. No hosted changes. Run npm run check. Hosted acceptance waits for the Product Director.

## Reviewer clarification (7210266238)

Option 2 is provisional, awaiting the Product Director before merge. The user's typed question still reaches the model after existing PII redaction. No unreadable identity retrieved from records enters model context, chips or logs. Keep the final guard and its existing timing assertions. The same reader/question produces identical results and call metadata with an unreadable record present or absent.

Chip ranking uses Latin words (at least three characters) and adjacent Han pairs from bounded normalized text. At least half the shorter set of pieces must overlap. Rarer shared pieces among readable candidates carry greater weight; a stable reference resolves ties. Only access-checked, non-excluded candidates qualify. Up to three suggestions; never automatic selection.

F retains the 84 existing cases and adds 28 required cases (14 per language). Full run: 112 × 3 questions plus existing draft cases. Absolute gates remain zero wrong values, disclosures and discards; every required case succeeds in at least two rounds and required answers at least 97% overall. The #79 baseline is accepted run 45804259788: median two calls, worst round p90 2,428 ms, aggregate question cost US$0.3526312 / 252. The 25% limits are 3,035 ms and US$0.001749162698 per question.
