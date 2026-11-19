# Independent S9-F05 / M-05 evidence reassessment

Verdict: **PASS for targeted M-05 acceptance; S9-F05 CLOSED_FOR_TESTED_SCOPE**.

Reviewed run: `20261119T040319Z`. Product baseline: `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`, plus the separately reviewed local repair. Tested production BUILD_ID: `tJ3t0INa7eLqU4wZug1oZ`. All 12 independently reviewed source/test hashes and all product hashes in `source-fingerprint.json` match the current files. This review assesses the captured evidence independently; it is not a claim that the reviewer performed a second live browser run.

## Boundary behavior

| Locale | Authoritative boundary | Before displayed range | After displayed range | Retained selected date |
| --- | --- | --- | --- | --- |
| en | `2028-02-28T16:00:00.000Z` / Taipei Feb 29 midnight | `2028-02-28` through `2029-02-27` | `2028-02-29` through `2029-02-28` | `2028-02-28`, visibly invalid |
| zh-TW | `2028-02-29T16:00:00.000Z` / Taipei Mar 1 midnight | `2028-02-29` through `2029-02-28` | `2028-03-01` through `2029-03-01` | `2028-02-29`, visibly invalid |

The raw before/after browser records retain the exact proposal route, title key `CHECK`, rationale key `VALIDATE_HISTORY`, assignee, selected due date and focused native input. The updated localized hint and native min/max agree; `aria-invalid` changes to true and the existing visible localized date error is added to the input's description relationship. The screenshots corroborate the changed range and visible error/focus.

The allowlisted server observer records automatic proposal GETs spanning `15:59:59.980Z`–`16:00:00.217Z` for English and `15:59:59.946Z`–`16:00:00.134Z` for Chinese. These corroborate the operator-recorded no-navigation/no-focus/no-manual-refresh interval under the independently reviewed ticking application clock. They do not establish an exact browser paint latency. The form was not reopened and no automatic proposal/action write was introduced.

## No-write and successful-write proof

I independently compared all four browser-negative before/after snapshot pairs. Action, AuditEvent, InternalReviewReceipt and ProposedAction counts and full-row hashes are identical for previous-day and +366 attempts in each locale. Full Action hashes cover the embedded evidence reference IDs and evidence snapshot; this schema has no separate ActionEvidence table.

I also compared all six direct production-HTTP negative records: previous day, +366 and impossible `2027-02-29` in both locales. Each returns `VALIDATION_FAILED` with `INVALID_DUE_DATE` and fresh server date-policy bounds; all before/after business-row counts/hashes match, including unconsumed proposal rows. These bypass presentation guidance only, so they establish retained server authority. A client-blocked attempt is not mislabeled as a server rejection. The observer's ten confirmation POSTs reconcile with six server negatives and four valid browser confirmations.

The four valid browser receipts display and the database verification records retain the expected dates: English new today `2028-02-29` and +365 `2029-02-28`; Chinese new today `2028-03-01` and +365 `2029-03-01`. Exactly four actions, audits, receipts and confirmed proposals are retained. No invalid write or duplicate action is evidenced. The independent source/transaction tests additionally verify idempotent replay.

## Deterministic validation

Final raw command logs and exit records support **686 tests / 71 files PASS**, including PostgreSQL-enabled adversarial coverage; localization **37 tests / five files PASS**; strict TypeScript, formatting, lint, Prisma validation/generation, nine clean migrations, two complete seed/SQL rounds, production build and production audit PASS. Lint retains one pre-existing warning. Production audit reports zero vulnerabilities. The independent source review separately ran **185 tests / five files PASS** with actual default `TZ=America/Los_Angeles` and an explicit timezone assertion.

This is local validation. No new exact-head GitHub CI result is claimed before publication.

## Cleanup and the supplemental SQL failure

The two browser-session revocation logs each record one revoked owned session; the supplemental suite-session closure records two more. Four run-owned sessions are revoked, with the original two fixture session rows preserved. Baseline/final snapshots corroborate six total retained session rows. Independent listener inspection found no listener on owned ports 3002 or 3003. The recorded closure says the QA tab was closed before revocation, bootstrap files removed, the main preview untouched, and no authenticated post-revocation browser request made.

I compared baseline/final migration and immutable-guard records: all nine migration records/checksums and all four enabled guard definitions are unchanged. Non-history fixture tables have unchanged full-table hashes; the observed differences are the expected retained comparison/economics/proposal/action/receipt/audit/session history. The run records no temporary fixture mutation and no Mac/browser clock or preference changes.

**The supplemental post-QA pristine-fixture SQL command FAILED and remains failed.** Its raw log says: `Expected two deliberately invalid fixture sessions, found 6`. The command stops at that assertion; later commands in that supplemental chain were not completed by that invocation. This is an operator scope mismatch after intentional history retention, not a new S9-F05 product failure. It must not be recast as a complete post-QA SQL PASS. The two complete clean pre-QA SQL passes and the separate closure snapshot/invariant checks support their respective, narrower conclusions. No rows were deleted to force the pristine verifier to pass.

## Visual inspection and qualifications

I visually inspected **all 19 screenshots**, including both automatic boundary states, all four receipts, the before/ready/error states and English refresh-unavailable recovery. No visible credential, cookie, bootstrap URL, database credential, private path or personal path was found. The displayed names and business references are synthetic QA content. The screenshot inspection inventory/hashes are in `independent-screenshot-review.json`. This visual check complements, rather than substitutes for, the operator's complete text/metadata sanitization.

Initial browser evidence is 2056×1290 CSS pixels; the calibrated English boundary and subsequent Chinese test records show **2056×1234**, DPR 2. Use the per-capture measured viewport as authoritative; do not claim uniform 1290 height or rerun the test solely for this metadata distinction. Native Chrome's wall clock/timezone were unchanged; this review does not claim native Chrome timezone emulation. Non-Taipei default-timezone coverage is independently established in component tests, and the real browser runs demonstrate a different unchanged host calendar from the simulated 2028 application calendar.

Intermediate native-date editing states that were never submitted are not server outcomes. The English preview-restart interruption is correctly recorded as unavailable date-policy recovery, followed by a fresh calibrated baseline; it is not a midnight product failure. Existing failed run `20261119T032345Z` must remain unchanged and is not retroactively passed.

## Stage 9 consequence

S9-F05 no longer blocks M-05 for the reviewed build and tested scope. Stage 9 may return to **IN_QA**, and M-02 physical-device access/testing plus M-07 human zh-TW review may resume. This does not pass either gate: device trust/access must be established using actual inventory and safe HTTPS/session behavior, and M-07 requires an independent human decision. M-01 remains `DEFERRED_BEFORE_BROADER_RELEASE`; speech-dependent M-06 remains deferred while existing DOM/focus evidence is retained.

Security, performance and deployment-readiness waves retain their upstream conditions. No pilot, release, deployment or merge readiness follows from this targeted pass. No new product P0/P1/P2 finding emerged from this evidence reassessment. No product source, historical evidence, publication, merge or deployment was changed by this reviewer.
