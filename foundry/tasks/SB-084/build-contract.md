# Build contract

Follow issue #84 A–F:

A. Exact-version Better Auth, forward-only tables, identity port adapter, demo/real/both modes.
B. Bilingual sign-in/code flow, Resend invitation and code mail, database limits.
C. Owner-only People: invite/resend/cancel, roles, deactivate/reactivate, transactional audits.
D. Assigned job controls and server-validated firm selection.
E. Same-site return paths and distinguish lookup failure from unreadable jobs.
F. Operations/setup documentation, route sweep, full check, Builder report.

Security: no authority from browser values; fresh membership and assignment resolution;
verified Google email; hashed one-use OTP; five wrong entries; 10-minute expiry; 60-second
resend; absolute 30-day sessions; fail-closed atomic counters; no personal data in logs,
audits, usage or model calls. No unused auth endpoints exposed.

Reviewer 7227915416: short and daily email windows, key derived from auth secret with a
separate label, expired counter cleanup, concurrency/bypass tests, trusted platform IP,
invitation resend limits. Do not bind OTP to requesting browser.

Hosted acceptance is for the Product Director. Keep the PR draft.
