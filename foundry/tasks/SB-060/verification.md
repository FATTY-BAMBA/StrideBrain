# SB-060 verification

Hosted acceptance is waiting for the Product Director. Keep the PR draft. No migration, hosted deployment, hosted database/settings change, model change or instruction-text change.

## What changed

- The amount check recognizes a clause with its first label after its first amount and reads following labels throughout that clause. Other clauses retain the existing reading. Amounts are never rewritten.
- An exact sent category carries across the clauses of its list item or semicolon/full-stop segment, including natural Chinese attachment to the label. Category/kind/percentage must resolve to exactly one cited saved finding. The whole segment is expanded into complete saved sentences, which supply the direction and wording. Context resets at item/segment boundaries.
- Unaccepted quote facts are projected as Acceptance: not accepted yet / 接受狀態：尚未接受. Accepted quotes retain Accepted on and the recorded date. Canonical tool values and the oracle stay unchanged.

## Verified locally

npm run check passed: **1,395 tests in 127 files**, format, lint, strict typecheck and production build, on Node 24 with disposable loopback PostgreSQL and synthetic fixtures. Existing prisma.config.ts lint warning only. [Check log](evidence/check.log).

Regression coverage includes the exact two discarded drafts from [run 45128767042](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45128767042) and all three zh-TW finding drafts from [run 45117528592](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/45117528592). They pass against newly prepared authorized database records. Every expanded percentage sentence is checked verbatim against the cited saved sentences.

All security examples in issue #60 are rejected: wrong before-tax/tax/total labels in either position, lighting forecast cost 9.4%, and demolition quoted price 9.4%. Missing labels, unknown percentages, ambiguous matches and category leakage across item/segment boundaries also reject. A model's wrong direction cannot survive because only the saved sentence is displayed. Bilingual projection tests distinguish acceptance state from an accepted date. Existing tenant/role denials and other grounding regressions pass.

All 50 deterministic evaluation cases pass in each of three rounds. [Deterministic report](evidence/fake-evaluation.json). This verifies the harness and data paths, not live model quality.

## Paid evaluation

Issue #60 authorizes at most three AI evaluation workflow dispatches for this branch. No dispatch yet. Each run, evaluated commit, outcome and estimated token cost will be recorded here. Acceptance additionally requires zh-TW-finding to pass at least two of three rounds; the existing score, required-case, number/label and call gates are unchanged.

## Not verified yet

Paid model quality on this change, the local browser flow and hosted acceptance are pending. The Product Director alone runs the Test site workflow and the hosted checks: five English PRJ-ACTIVE-001 totals without fallback, exact saved Riverside finding sentences, and acceptance wording without a state under a date label. Billed costs are not verified; reported evaluation costs will be token-based estimates.
