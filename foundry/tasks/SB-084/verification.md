# Verification — SB-084

Implementation and checks pending. No hosted changes or paid evaluation.

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
