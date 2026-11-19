# S9-F05 independent repair-contract review

Verdict: **PASS — scoped repair contract approved for implementation**. This is an independent pre-implementation review, not a source-review or browser-retest pass. Reviewer: delegated S9-F05 repair reviewer, separate from the implementing agent. Baseline: `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`. Failed run `20261119T032345Z` remains unchanged.

## Confirmed cause and severity

The proposal view derives `minDueDate` and `maxDueDate` from the server clock and the stored organization timezone. The sheet uses those initial proposal attributes indefinitely. Confirmation correctly calls `validateEdits` with a fresh server instant, but its validation failure originally returned field errors without refreshed bounds. Thus a form spanning Taipei midnight can display yesterday as allowed while the server rejects it. This is a required-path **P2 presentation/recovery defect**, not evidence of invalid business writes or authorization failure.

The existing authenticated, private/no-store proposal GET calls `reopenProposal`, rechecks actor/project access, expiry, current material, fingerprints and eligible members, and returns a fresh proposal view without preparing a proposal or creating business records. It is the appropriate existing read mechanism.

## Approved minimal design

1. Extend the public proposal date-policy projection with server `datePolicyEvaluatedAt` and `nextDatePolicyBoundaryAt` alongside the existing min/max. Produce all fields from one domain policy helper using the same server instant and stored timezone. Compute the next calendar-date boundary through the existing explicit-timezone `calendarDate` semantics; no browser-local calendar, fixed UTC+8 shortcut or 24-hour refresh timeout.
2. Reuse the authenticated proposal GET for initial clock calibration, the next calculated boundary, and focus/visibility recovery after a suspended tab. Schedule from the server instant difference and monotonic elapsed time. Initial calibration matters because server-rendered metadata can be old by hydration; do not start the entire original interval again at mount. Conservatively anchor refresh-response timing to request-start monotonic time rather than the browser wall clock.
3. Apply only the fresh date-policy projection to the sheet. Preserve the proposal business key, confirmation/idempotency key, complete route draft, title, rationale, assignee and selected date. Neither a timer nor read refresh may prepare a new proposal or perform a business write.
4. Retain a date that has become yesterday as visibly invalid, with localized field association. Update native input min/max and the displayed hint together. Before submission, ensure an elapsed policy deadline is refreshed. The server remains final authority even if a client changes attributes, ignores guidance or races midnight.
5. An authenticated validation failure may carry the freshly calculated date-policy projection to recover from the confirmation-time race. Do not derive or expose proposal data for unauthenticated/unavailable selectors. The existing request parser must continue to reject unrecognized client authority fields.
6. On failed/denied/stale/expired refresh, retain the draft and use localized safe recovery. Do not continue presenting the old range as current. Block confirmation while current guidance is unavailable, without blocking cancel, close or appropriate retry. Preserve authorization/non-disclosure behavior and existing stale-proposal recovery.
7. Abort or disregard obsolete refreshes after unmount, proposal/locale change, or newer authoritative policy. Prevent overlapping responses from rolling bounds backward. Timer/focus refresh must not steal focus repeatedly or override a receipt/confirmation outcome.
8. A newly valid date edit must clear a stale due-date error without discarding unrelated validation errors. Keep the native date input and its existing keyboard/picker behavior.

No policy, schema/migration, financial/evidence authority, session, tenant, action type or idempotency change is required. The server's complete confirmation-time validation and today-through-today+365 rule must remain unchanged.

## Required regression evidence

- Server helper and actual service: pre/post-Taipei-midnight, leap-day transition, exact min/max, today/+365 accepted, yesterday/+366/impossible date rejected, different host/browser timezone and locale parity.
- Rendered component: timer updates the same open form without reopening or replacing its proposal; complete draft preserved; both locale hints and native attributes update together; prior today becomes visibly invalid; new boundary dates valid; error associations remain; background/focus recovery and failed refresh preserve draft; unmount/late-response races do not reset bounds.
- Real production browser: observe the pre-boundary and post-boundary form without navigation, forced rerender, manual attribute mutation or a focus-triggered refresh standing in for the automatic timer. Record actual GET timing, server metadata, displayed range, selected value, localized error, focus and complete draft.
- Real server/PostgreSQL: invalid client submission and deliberately tampered/stale guidance produce no Action, embedded action-evidence associations, AuditEvent, durable receipt or proposal consumption. Preserve hashes/counts as appropriate. This schema stores action evidence in Action fields; do not invent a separate ActionEvidence table. Valid today and +365 must yield actual durable receipts and the expected persisted due date. Preserve idempotent replay.
- Retain the complete deterministic gate and request a separate independent review of the final source diff before claiming repair acceptance.

## Independent process-clock assessment

**PASS for scoped isolated test use, with the timer-specific conditions below.** I inspected the prior private clock preload and probe. The preload substitutes zero-argument `Date`, `Date()` and `Date.now` from an operator-controlled instant, while explicit date construction, parsing/UTC and monotonic timers remain native. The Mac and browser clock, PostgreSQL system clock, real authorization, route responses, validators and business transactions are not replaced. The probe checks the fixed instant, explicit leap date, UTC construction, instanceof, Date function and advancing monotonic timers.

The fixed-clock method is valid for confirmation-boundary cases provided sessions/proposals remain unexpired, application timestamp semantics are recorded, and PostgreSQL system/default timestamps are not misrepresented as simulated. It does not by itself demonstrate the new automatic browser timer: advancing a frozen server file and then manually focusing/reopening the form would prove only a recovery path. For automatic-boundary evidence, advance the operator clock coherently with the actual elapsed browser timer derived from the server metadata, or independently document/probe a ticking process-clock variant. Capture the unchanged open form's automatic read and new bounds without a user focus event. Test server-controlled range behavior even when the browser's current calendar differs from the simulated server calendar; separately label deterministic timezone coverage instead of claiming an unexecuted native-browser timezone configuration.

Use a new isolated synthetic database/runtime and retain immutable records. Hash/preserve prior evidence, revoke only run-owned sessions, restore any temporary mutable fixture settings, retain new immutable history, and sanitize credentials/private runtime paths before publication. No system-clock change is needed or approved by this method.

## Review boundary

Implementation may proceed under this contract. **Source review and targeted M-05 browser acceptance remain pending** until the actual diff and resulting evidence are examined. Security/performance/deployment waves remain locked until S9-F05 passes as requested.
