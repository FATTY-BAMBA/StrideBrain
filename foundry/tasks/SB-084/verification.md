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
