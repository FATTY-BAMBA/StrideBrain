# M-05 live date-boundary method — unresolved

Status: PARTIAL / STAGE_9_HARDENING. The prior 15 injected-clock tests remain passing evidence; no live leap-day or midnight pass is asserted here. The ordered execution is waiting for M-01/M-06 speech completion before advancing this wave.

Source inspection confirms an injected clock at createInternalReviewServices(options.clock), but production page and API callers use createInternalReviewServices() without an external test-clock control. No reviewed production-browser clock method is configured. Do not add a production clock bypass, change the Mac clock, rewrite immutable timestamps or fake route responses.

Candidate for independent review: a separate disposable synthetic database and a private process-only Date preload, loaded before the unchanged production server, with fixed test instants supplied by a local operator file. Prove that server Date/time, authentication/session expiry, proposal expiry, database timestamps and browser-derived date bounds remain coherent. Timers should remain monotonic and the browser must exercise real APIs. This is a proposal, not an implemented or approved method. If that coherence cannot be demonstrated, keep the live item blocked.

Required actual cases: valid 2028-02-29 inside the permitted window; invalid 2027-02-29; yesterday rejected; today accepted; today+365 accepted; today+366 rejected; preparation at Taipei 23:59:59 and confirmation after midnight with session/proposal still valid. For every invalid case prove no action, receipt, audit or proposal consumption. Snapshot before/after and retain history; only new disposable databases may be reseeded. Do not infer browser acceptance from the existing service tests.
