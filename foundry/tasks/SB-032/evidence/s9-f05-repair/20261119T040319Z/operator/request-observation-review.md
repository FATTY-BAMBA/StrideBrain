# Independent review — passive automatic-refresh observation

Verdict: **PASS for the isolated M-05 timer retest**. This approves the observation method, not a browser or product outcome.

The independent reviewer inspected the concrete private preload after its observation addition. It wraps the owned Node HTTP server's `request` event and attaches a single `finish` listener. The original emit is called synchronously with the original receiver and arguments, and its return value/exception behavior is preserved. The observer neither consumes nor changes request/response bodies, headers, status or routing. Observer work is separately guarded so observation errors cannot fail a request.

Capture is allowlisted to the proposal GET and the two existing preparation/confirmation POST routes. Proposal selectors are normalized to `:proposalKey`; query strings, cookies, headers, bodies, origins and arbitrary paths are not retained. Operator/bootstrap endpoints are outside the allowlist. The observation file contains only method, normalized path, simulated application timestamps, monotonic timestamps and final response status. Private runtime paths and credentials are not evidence content.

This is sufficient to correlate an automatic proposal GET with the server-advertised Taipei boundary and the unchanged open form's before/after screenshots/DOM evidence. It also distinguishes a client-invalid attempt producing no confirmation POST from an actual server rejection. Request observations must be combined with UI and database evidence; a GET status alone is not proof of correct bounds, and absence of a POST is not proof of server rejection.

The owned preview was restarted after adding the observer. Recapture the pre-boundary baseline under this runtime, then leave the same form open while the ticking application clock passes midnight. Do not substitute a manual focus/navigation/refresh event for the automatic-timer observation. Other owned-process traffic must be identifiable from the operator log, and missing/failed observations must not be interpreted as passes.

The atomic clock setter was also inspected: it writes a temporary next-state file and renames it over the current clock file. The runtime probe records fixed and explicit leap/UTC dates, Date identity/function behavior, ticking elapsed time of 122 ms against 121.577791 ms monotonic time, cross-process consistency within the parent envelope, and unchanged Mac/browser clocks. These satisfy the earlier timer-method conditions.

The observer and Date preload are private test harness instrumentation. Production source/build files, authentication, tenant guards and business validation remain unchanged. Do not use timings collected under this preload as normal product performance evidence. No deployment or merge is authorized by this approval.
