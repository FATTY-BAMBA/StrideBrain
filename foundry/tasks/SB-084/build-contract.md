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

Fix round 1 (owner-authored review 7231731273): last-owner protection applies to joined
active owners only; reopen the sole cancelled invitation using the same Person and
Membership; cancelled rows stay off the People list. No uninvited sign-in creates a user,
account or session. Google must control the verified mailbox (Gmail, Googlemail or hd).
Enumerate protected pages in a guard regression. Cap new invitation attempts at 50 per
firm-local day using the shared atomic counter. People is RowList plus native dialogs;
name, role and job access have one transactional save. Confirm serious actions by name,
hide self-deactivation, derive role sentences from capabilities, show firm switching only
for multiple firms. Standalone identity pages retain visible language links and cap at
the form-width token. Google authority and screen copy remain provisional for Director
confirmation. No paid evaluation or hosted changes.

Fix round 2 (owner-authored review 7237737479): use the specified Paper-sheet identity
frame for sign-in, no-access and choose-firm; two replacing sign-in steps with Field/Notice,
segmented language switch, mode-both-only test strip, phone layout and scoped Google
branding assets/tokens. Preserve all existing strings, neutral copy, requests, limits and
timings. Shadow, replaceable brand mark and every new copy-table string are provisional
pending Product Director confirmation. Verify locally, run full check and CI, capture the
requested bilingual state matrix, report on the same draft PR, then stop. No hosted work.
