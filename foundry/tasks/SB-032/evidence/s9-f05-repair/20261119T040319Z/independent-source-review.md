# S9-F05 independent source review

Final source-review verdict: **PASS — scoped S9-F05 source repair approved after corrections**. Production-browser acceptance remains a separate required gate.

Review is against baseline `5af47b7c9b02af34506b89ea7b29bb84b1a2b1c4`. The reviewer is separate from the implementing agent. Product source was inspected directly; no product source was edited by this reviewer.

## Initial review findings — corrected before source approval

1. **Explicit submission with failed date-policy refresh: post-render focus required.** The first implementation tried to focus `#review-date-policy` immediately after an asynchronous state update. React may not have committed that region yet. This can retain BODY focus after disabled controls lose focus. The implementer moved this into a post-render effect and associated the form with the recovery region. The permanent bilingual regression now passes.
2. **Keyboard retry loses focus when its button is removed.** The initial retry button lived inside a region removed while refreshing; a successful retry left BODY focused. An independent temporary DOM regression reproduced this in both en and zh-TW under Node 24 with the default timezone set to America/Los_Angeles: fresh bounds appeared, but activeElement was BODY rather than the due-date control. The temporary test was removed after the review attempt. Corrected: explicitly initiated retry restores visible due-date focus on success and recovery-region focus on failure after the relevant state commits. Automatic/background refresh continues to avoid focus stealing. Permanent successful and repeated-failed retry assertions now pass across five error cases in each locale.
3. **Timezone and overlap coverage.** A date literal containing a -07:00 offset changes an instant, not the process/browser default timezone. Corrected: the independent deterministic run uses `TZ=America/Los_Angeles` and asserts `Intl.DateTimeFormat().resolvedOptions().timeZone`. New tests prove both a late pre-boundary GET and a late failed GET cannot replace or invalidate a newer confirmation-policy response. Accepted confirmation metadata invalidates/aborts the older read generation.

These are scoped implementation-review corrections within S9-F05, not independent claims about unrelated product functionality.

## Sound portions verified by inspection

- Server policy calculation reuses the existing organization-timezone calendar-date and +365 bounds. The next boundary is located using explicit calendar-date comparisons; the 36-hour search bracket is not the browser refresh timeout. Taipei leap-day and non-Taipei DST cases are covered.
- Existing authenticated proposal GET is reused; no prepare/confirm/write operation was added to it. The full existing authorization, freshness, tenant and expiry checks remain.
- Additive metadata is derived from the server. Client scheduling uses server instant differences and monotonic elapsed time, including initial mount calibration, focus/pageshow/visibility recovery, abort and request-generation protection.
- Only date guidance changes on a successful read. The route draft, selected wording, assignee, date, proposal identity and idempotency key remain intact.
- Confirmation-time validation and its policy are unchanged. The server adds current date metadata to authenticated validation failure; client-supplied bounds do not determine writes.
- No schema/migration, authorization, tenant-isolation, financial/evidence authority, deployment, external communication or unrelated feature change was found in the inspected product diff.
- Added PostgreSQL regressions inspect all Action rows including embedded evidence, receipt/audit/consumption counts, unchanged proposal rows, valid boundary commits and idempotent replay. Full execution evidence is owned by the deterministic gate and must be reported separately.

## Reviewer execution at this checkpoint

An independent Node 24 invocation of the date-policy component, policy-unit, service-unit, navigation-race and modal-focus files passed **179 tests across five files** with `TZ=America/Los_Angeles`. This preceded the requested additional permanent regression assertions. The separate focused keyboard-retry probe then failed in both locales as described above. An initial attempt using the host's default Node 20 failed before tests started; that toolchain error is not a product-test failure and is excluded from the results.

## Final independent verification

After the corrections, the reviewer independently re-ran the five named files with Node 24 and `TZ=America/Los_Angeles`: **185 tests / five files PASS**. The actual non-Taipei default-timezone assertion, automatic timer, preserved draft/focus, visible invalid date, boundary values, failed refresh/retry, stale response generation and existing navigation/modal regressions passed. `git diff --check` passed for source/tests. The reviewed source/test file hashes are recorded separately in `independent-reviewed-source-sha256.json`.

The source diff remains limited to server date-policy metadata, boundary calculation, live date guidance/recovery and related tests. No migration/schema/deployment/config/dependency change is present. No authorization, tenant, financial/evidence authority, action type, server validation or idempotency policy is weakened. The client still cannot authorize a business write.

**No unresolved source-review findings remain.** Full deterministic/PostgreSQL gates and the targeted production-browser retest must be completed before M-05 is declared accepted. This source verdict does not claim those later gates passed, human language approval, pilot readiness, deployment readiness or merge readiness. No publication, merge or deployment was performed by this reviewer.

## Timer-specific private harness extension

The reviewer inspected the new ticking process-clock preload and setter. A fixed application instant plus a shared `process.hrtime.bigint()` anchor lets zero-argument application Date advance with real monotonic elapsed time while preserving explicit date parsing/construction. The native browser timer can therefore cross the server-advertised midnight deadline automatically. Mac/browser clocks and PostgreSQL system time remain unchanged. The design is approved for this isolated test, conditioned on a runtime probe of ticking/fixed behavior, cross-process consistency, native monotonic timers and explicit Date parsing/UTC behavior.

Before live use, the operator setter must update its clock file with an atomic temporary-file rename, rather than a truncating write that might race automatic Date reads. This is a private test-harness reliability correction, not a product-source change. Do not use performance measurements from a Date-file-preloaded process as normal product performance evidence. Native-browser timezone observations and deterministic non-Taipei timezone coverage must be labeled separately.
