# Verification — SB-084

Current evidence is in the final 28 November continuation section below. Earlier partial reports are historical. No hosted changes or paid evaluation.

## Decisions awaiting the Product Director

- Reviewer comment 7227915416: application-owned per-email rate-limit guard, its listed
  conditions, and example refusal copy are provisional.
- Issue #84 copy remains provisional except the confirmed 驗證碼 wording.

Session duration is confirmed: 30 days from sign-in, without activity extension.

## Existing job creator access

The create-project repository creates a ProjectAssignment for the creator in the same
transaction as the job. The People UI must expose the stored assignment, not imply a
separate permanent creator privilege.

## Not verified

All implementation checks, local fake-provider flows, screenshots and hosted acceptance.

## 28 November — partial implementation, stopped for clarification

Draft PR #85. Foundation, sign-in/People/firm-selection scaffolding and first security tests
are implemented; A–F are NOT complete and this is NOT ready for hosted testing.

Verified locally:
- Better Auth and Prisma adapter pinned to 1.7.28 (MIT).
- Current official Prisma, Next.js, email OTP, Google, account-linking, rate-limit and
  session documentation read. Absolute session expiry uses disableSessionRefresh.
- npm audit reports no Better Auth finding; nine moderate findings remain in existing
  development tooling (Vitest/mocker and TypeScript ESLint/minimatch).
- `npm test -- tests/sign-in` against isolated local PostgreSQL: 3 files, 20 tests passed.
  Includes atomic concurrent guard decisions, daily cap, expired-key cleanup, closed
  unused endpoints, known/unknown refusal parity, counter-failure fail-closed, Viewer and
  foreign-id denial, last-owner/self protection, deferred fake-mail delivery, hashed code,
  one-use sign-in, logout, and next-request deactivation/reactivation.

Current rate-limit proposal: code requests 1/60 seconds and 10/anchored 24-hour window;
entries 5/10 minutes and 20/anchored 24-hour window. The latter permits at most 40 entries
in an arbitrary rolling 24 hours crossing a reset boundary, not 20. Invitation resends
1/60 seconds and 10/anchored 24-hour window. Final report/validation still pending.
Network header: x-vercel-forwarded-for only on Vercel; local requests use one loopback
bucket and ignore supplied forwarding headers. Hosted behavior is not exercised.

Pending product decision: if invitation email delivery fails, should membership access
already be enabled, or remain pending until delivery succeeds? The current local draft
preserves the invitation and reports the mail failure, but this is NOT a confirmed rule.
Do not treat that path as finished or ready for use.

Not verified / still unfinished:
- Full A–F acceptance, npm run check, current complete-branch typecheck/lint/build/CI.
- Fake Google callback flow, exhaustive OTP expiry/attempt tests, both-mode session
  switching, firm-selection and People UI acceptance, privacy grep tests.
- Final invitation lifecycle/delivery handling, idempotency review, complete application
  layering review, route sweep, 390px/keyboard/bilingual screenshots.
- Operations guide, all environment documentation, final limits and advisory report.
- Hosted Google/Resend, mail arrival timing/provider deliverability, Product Director acceptance.

No hosted changes, no hosted sign-in and no paid evaluation.

## 28 November — reviewer 7228243025 continuation

Owner-authored decision read. Invitation persistence on delivery failure is now permitted
provisionally; Product Director confirmation remains outstanding. The old delivery-policy
question above is answered, not an active blocker.

Implemented since e513b48:
- Forward-only migration for persistent invitationEmailStatus; original migration unchanged.
- Invitation save remains one transaction. The awaited, 10-second Resend send is the second
  step. Delivery status and a membership-only success/failure audit commit together.
- Failed status survives reload, and only a successful send clears it. Both languages carry
  the reviewer's immediate failure sentence and direct-sign-in explanation.
- Every protected page now invokes a shared request-time identity helper outside its local
  catch. The layout is no longer the only sign-in gate. Proxy only replaces the page-path
  header; a regression proves a browser cannot supply that value.
- Google requests openid/email only, online access, no incremental scopes. Account create
  and update hooks discard access, refresh and ID tokens and token expiry/scope fields.
- Fake Google signs a local RSA token and serves fake token/JWK responses. The actual
  Better Auth callback verifies it, links email OTP to the same user, rejects an unverified
  email, and persists no provider tokens. No hosted provider was contacted.
- Demo/real session kind is explicit at internal-review refresh; demo transactions retain
  their existing table boundary. Experience imports use server composition functions.
- Form endpoints are size/field bounded; unused Better Auth endpoints are closed.

Verified on the current work:
- Focused suite: 12 files, 104 tests passed, including all sign-in tests, invitation failure
  and resend persistence/audit, fake Google, OTP expiry and five-wrong-entry refusal,
  proxy header replacement, job failure propagation, architecture and existing internal
  review/repository/selection-lineage regressions.
- Typecheck passed; git diff --check passed.
- The earlier full npm run check reached tests and failed (12 failures, 23 skipped).
  These included the new real-only routes in the demo HTTP sweep, old job-error-to-404
  expectations, architecture imports and demo refresh touching real tables. Corresponding
  fixes are made, but the FULL check and HTTP sweep have NOT been rerun to green.

New clarification: Better Auth 1.7.28's validateAuthorizationCode calls the token endpoint
through fetchRefusingRedirects with method/body/headers, but no timeout or abort signal.
The Google/provider config exposes no transport timeout. Better Fetch creates an abort
 timer only when timeout is supplied. The client fetch timeout does not bound this server
 exchange. AGENTS requires every outside call to have a timeout; issue #84 requires asking
 before filling a library gap. Proposed: a minimal version-controlled patch to the pinned
 dependency that passes a 10-second abort timeout to that token-exchange request, with a
 timeout regression and no changes to state, PKCE, token verification or account linking.
No dependency patch has been made. Stop pending the reviewer/Product Director decision.

Still not verified: browser sidebar navigation after deactivation/sign-out, local screenshots,
390px/keyboard/bilingual flow, full route sweep/check/CI, final operations/settings docs,
and all hosted acceptance. A–F remain incomplete; draft is not ready for hosted testing.
No paid evaluation, hosted changes, hosted sign-in or bounce tracking. Bounce tracking is
later work, per 7228243025.

## 28 November — reviewer 7230432439 continuation (current)

The owner's actual GitHub author metadata is FATTY-BAMBA. Its patch decision is provisional,
awaiting the Product Director before merge. The earlier timeout question is answered.
The previous partial reports above are historical; use this section for the current state.

### Implemented

- Exactly pinned @better-auth/core 1.7.28 and patch-package 8.0.1. Postinstall applies the
  one-line shared fetchRefusingRedirects patch with --error-on-fail. Caller timeout/signal
  remains authoritative. No existing migration changed; no global production fetch override.
- The Google provider imports the patched dist/oauth2/reject-redirects.mjs. Its token exchange
  defaults to ten seconds. Auth route maxDuration is thirty seconds. The localized failure
  sentence and server-chosen error callback return to sign-in, with Google/code choices.
- IMPORTANT correction to the earlier fake-Google report: this pinned authorization-code
  callback consumes Google's server-to-server HTTPS token response; it does NOT fetch JWKs
  or cryptographically validate that returned ID token through the separate certificate
  helper. The earlier assertion that our callback test verified the RSA signature was
  inaccurate. Its test proves verified-email refusal and linking, not JWK verification.
  Library state, PKCE, token handling and linking remain untouched, as requested.
- Both token timeout locales and the actual separate getGooglePublicKey/certs fetch are
  tested with stalled local fetches. The latter is tested directly because the callback
  never reaches it. Timeout leaves AuthUser/AuthSession/IdentityLink empty and membership
  invited. The patch-path assertion also fails if the patch is absent.
- Completed operations/environment/test-site documentation, licence modification record,
  source privacy grep and mail-template checks, fresh role/job/firm authority tests, actual
  foreign membership denial, absolute-expiry and production-no-demo tests. Session-kind
  helpers revoke/clear the prior kind; real-only sign-in needs no demo secret merely to
  clear an old demo cookie. Added schema invariant verification without changing seed emails.
- People job checkboxes are expandable, with distinct per-job permission labels. Native POST
  logout/firm controls show busy feedback. Code paste strips non-digits before submission.
  Initial invitation sends now honor a rejected counter decision as well as resend sends.

### Local verification

- Clean `npm ci --no-audit --no-fund`: postinstall successfully applied the patch. The same
  npm lifecycle is used by CI and the standard Vercel install. Actual hosted Vercel install
  remains untested; no hosted action is authorized or performed.
- First complete check after the timeout work: 215 test files / 2,082 tests, build passed.
  Additional access/session/privacy tests were added afterward; final result recorded below.
- Local production app, real Chrome through Playwright, disposable synthetic PostgreSQL and
  fake Resend only. No Google/Resend service was contacted. Checked:
  - English email code, neutral response, automatic six-digit submit, signed-out return to
    the requested People page, keyboard focus, 390px sign-in and People without overflow.
  - Traditional Chinese code entry and exact signed-out return to the requested Xinyi job.
  - Owner creates a Viewer in the People UI. Failed invitation notice survives page reload.
  - Deactivation committed through a separate database connection, then an existing browser
    clicks a sidebar link: no-access. Reactivation restores access.
  - Viewer gets 404 at People. Removing their stored job assignment makes the next direct
    job request 404 and removes it from the list; no NT$ amounts appear in that list.
  - Logout ends the session; opening a job again returns to sign-in.
  - Two invited firms: chooser after sign-in, selecting the second firm, then sidebar switch
    back to Horizon updates the account correctly.
  - Localized Google failure sentence, including zh-TW at 390px. Screenshots inspected.
- The shared demo HTTP route sweep remains in the full check, including real-only routes
  returning 404 in demo mode. Real-mode journeys above supplement that sweep.
- React review: server authority stays outside client components; all waiting controls have
  feedback, forms use native labels, requests have bounds, no new component library.

### Screenshots (synthetic data only)

- [English sign-in](screenshots/en-sign-in.png), [390px](screenshots/en-sign-in-390.png),
  [code](screenshots/en-code.png).
- [中文登入 390px](screenshots/zh-sign-in-390.png), [驗證碼 390px](screenshots/zh-code-390.png).
- [English People](screenshots/en-people.png), [390px](screenshots/en-people-390.png),
  [中文成員](screenshots/zh-people.png), [390px](screenshots/zh-people-390.png).
- [Invitation send failure](screenshots/en-invitation-failed.png),
  [firm choice](screenshots/en-choose-firm.png), [no access](screenshots/zh-no-access.png).
- [Viewer job](screenshots/zh-viewer-job-390.png),
  [Viewer after job removal](screenshots/zh-viewer-no-jobs-390.png).
- [English Google timeout](screenshots/en-google-timeout.png),
  [中文 Google timeout](screenshots/zh-google-timeout-390.png).

### Not verified / awaiting the Product Director

Hosted acceptance, actual Google/Resend credentials and consoles, Vercel install/runtime
maxDuration enforcement and trusted network header, inbox timing/deliverability across
Gmail/Yahoo奇摩/HiNet/Outlook, real mobile OTP keyboard suggestions, and a real thirty-day
wall-clock session. Local clocks/expiry records cover the expiry rules. Browser both-kind
switching under the preview-only HTTPS handoff was not exercised; helper regressions and
existing demo tests cover it locally. Bounce tracking remains later work. All provisional
copy/per-email guard/invitation failure/timeout decisions await Director confirmation.
No hosted changes, hosted sign-in, Test site workflow or paid evaluation.

### Proposed upstream issue — text only; not filed

Title: Add a bounded default or configurable timeout to server-side OAuth fetches

Using @better-auth/core 1.7.28 with the Google authorization-code flow, a stalled token
endpoint leaves validateAuthorizationCode waiting indefinitely: it calls
fetchRefusingRedirects without a timeout or signal. The Google public-key helper also
calls that function without options. A client-side request timeout does not cancel these
server fetches. Reproduction: intercept the token endpoint (or call getGooglePublicKey
with a stalled certs endpoint), return a promise that rejects only when its signal aborts,
and observe no abort with the shipped default. Expected: a documented, bounded timeout
or a provider-level transport option that applies to both requests. Our temporary MIT
package patch defaults the helper's betterFetch timeout to 10,000 ms only when the caller
has neither a timeout nor a signal; it changes no state, PKCE, redirect or validation rule.
Would upstream support this timeout at the shared helper/configuration boundary? We will
remove the local patch when a supported option is available.

Current dependency audit: `npm audit --omit=dev` reports zero high/critical and two
moderate findings in the existing Vitest/mocker packages (GHSA-82fw-gwwq-j7x9 and
GHSA-qxg6-89mg-rqv8). No Better Auth or patch-package advisory is reported. The complete
install audit reports nine moderate findings including existing ESLint/minimatch tooling.
No broad dependency upgrade was mixed into this issue.

Final local check: `npm run check` passed, 219 files / 2,091 tests, production build
passed. The final same-site Google error-return regression was then run separately
(the success/error paths both retain the validated requested job); its focused handler
suite passed. No unrelated test was weakened. CI status is recorded in the Builder PR
comment once available. A–F are locally implemented; review and Director hosted
acceptance remain outstanding. PR stays draft.

CI run 46086808727 attempts 1 and 2: 2,091 tests passed; the existing repeated CLI
seed/verify invariant test exceeded its 180-second deadline (182.8s and 185.5s). Both
standalone CI migration/seed/verify/repeat steps passed. To avoid an extra Prisma process
per verification pass, moved all three new sign-in SQL assertions unchanged into the
existing verify-relations.sql invocation. No test, assertion, timeout or migration changed.
The separate verify-sign-in.sql is removed; the same checks run in db:verify and test
template verification. Follow-up local/CI results are recorded in the Builder comment.
