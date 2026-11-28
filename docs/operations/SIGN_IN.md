# Sign-in and people

Issue #84 supplies Google and emailed-code identity through Better Auth. StrideBrain's
current membership, role, grants and assignments decide access. Real customer data remains
blocked. Only the Product Director configures hosted services and runs hosted acceptance.

## Provider setup (official documentation checked 28 November 2026)

### Google

In StrideBrain's Google Cloud project, open **Google Auth Platform → Branding** and enter
app/support details and the authorized domain. In **Audience**, add acceptance testers
when using External/Testing. **Data Access** needs only `openid` and `email`.
In **Clients → Create client**, choose **Web application**. Register exactly
`<STRIDEBRAIN_APP_ORIGIN>/api/auth/callback/google` under Authorized redirect URIs.
Store the client ID and secret directly in the test project's server environment.
Never put secrets in GitHub, chat or screenshots.

The app requests online access, no incremental scopes and no offline access. Its
state/PKCE authorization-code flow consumes Google's HTTPS token response and checks
`email_verified`. This library path does not fetch certificates or call the separate
JWK/ID-token verification helper. Browser-supplied ID-token sign-in is not exposed.
Sources: [Google Auth Platform](https://support.google.com/cloud/answer/15544987?hl=en),
[web-server client setup](https://developers.google.com/identity/protocols/oauth2/web-server).

### Resend

In **Domains**, add the chosen subdomain of `primestrideai.com` (for example
`mail.primestrideai.com`). Add the exact DNS records shown to the DNS provider; wait for
verification. Keep open and click tracking disabled on this transactional domain.
In **API Keys**, create a **Sending access** key restricted to that domain. Put the key,
verified sender and monitored reply-to `hello@primestrideai.com` directly in the server
settings. Domain verification does not create a mailbox.
Sources: [domains](https://resend.com/docs/dashboard/domains/introduction),
[API keys](https://resend.com/docs/dashboard/api-keys/introduction),
[sending permission](https://resend.com/changelog/new-api-key-permissions).

Invitation save is one atomic transaction; awaited mail submission is a second step
bounded at ten seconds. A failed send leaves access invited and the failure visible;
a successful resend clears it. The email is a notice, not a credential. A timeout and
resend may deliver two copies. Bounce tracking is later work. Code mail is scheduled
after the response; only invited/membership addresses receive it. Unknown addresses
get the same neutral response. API acceptance does not prove inbox delivery.

## Settings and modes

See `.env.example`. All new values are server-only.

| Setting | Purpose |
| --- | --- |
| `STRIDEBRAIN_SIGN_IN_MODE` | `demo` default; `both` test site; `real` production identity |
| `STRIDEBRAIN_APP_ORIGIN` | Exact HTTPS origin, no path; HTTP loopback is local only |
| `STRIDEBRAIN_AUTH_SECRET` | Independent random >=32-byte secret; never the demo secret |
| `STRIDEBRAIN_GOOGLE_CLIENT_ID` | Web OAuth client ID |
| `STRIDEBRAIN_GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `STRIDEBRAIN_RESEND_API_KEY` | Domain-restricted Sending access key |
| `STRIDEBRAIN_MAIL_FROM` | Verified sender |
| `STRIDEBRAIN_MAIL_REPLY_TO` | Monitored reply address |

Absent/demo preserves the frozen pilot. Both exposes sign-in and a sample-person link;
entering either session kind revokes/clears the other. Real never constructs the demo
adapter and `/preview` is not-found. The production public-environment label requires
real at startup. The data gate stays in server-env.ts.

PrimeStride still provisions companies and first owners outside this issue; there is
no bootstrap-owner HTTP endpoint. The sample owner can invite real acceptance testers
in both mode. Sample people's unverifyable addresses remain unchanged.

## Storage, expiry and limits

AuthUser stores verified email and provider name/image if supplied. AuthAccount stores
provider/user identifiers; hooks null access/refresh/ID tokens and related expiry/scope.
No password method is enabled. AuthSession stores its opaque token, user, selected
membership, expiry/creation, network address and browser description. Tenant IdentityLink
binds user to Person; Membership holds invitation/delivery status. Audits name membership
IDs, never addresses. Roles and assignments are loaded each request.

Codes are hashed, six digits, one use, ten minutes, cancelled after five wrong entries.
They are not browser-bound, per the provisional review decision. Sessions last exactly
thirty days from sign-in, without activity extension; logout ends them earlier. Cookies
are Secure, HTTP-only and SameSite=Lax, without a cookie identity cache.

| App counter | Short window | Anchored 24-hour window |
| --- | --- | --- |
| Code requests, per normalized email | 1 / 60 seconds | 10 |
| Entries, per normalized email | 5 / 10 minutes | 20 |
| Invitation notices, per invitation | 1 / 60 seconds | 10 |

An arbitrary rolling day across a reset admits at most 40 guesses, at most 0.004% against
a uniform six-digit code before its five-try cancellation. Limits bound cost/guessing
while allowing retries. Email keys are domain-separated HMACs derived from the auth
secret. One SQL decision atomically checks both windows and cleans expired keys; failure
refuses the attempt. Better Auth also keeps network counters in the database: 10 requests
per minute, 30 entries per ten minutes, 60/minute otherwise. Only Vercel's platform
`x-vercel-forwarded-for` is trusted there; local runs ignore supplied forwarding headers
and share a loopback bucket. Hosted forwarding remains acceptance work.

## Rotation

Only the Director rotates hosted secrets and deploys. Replace the auth secret with a
new independent random value and redeploy: old signed cookies/OAuth state fail, people
sign in again, and old counter keys expire. For an incident also revoke stored sessions
and pending verifications through the operational database process. No rotation grace
period is configured.

Google: reset/create the client secret in Clients, update the server setting, redeploy
and test, then retire the old secret. Resend: create another restricted Sending key,
replace/redeploy/test code and invitation delivery, then remove the old key. Revoke a
compromised credential immediately. Sender/reply-to are not secrets. The demo secret is
separate; rotating it also invalidates unsaved quote-preparation signatures.

## Pinned OAuth timeout patch and licences

Directly pinned `@better-auth/core@1.7.28` is modified in
`patches/@better-auth+core+1.7.28.patch`. One line in the sole shipped build
`dist/oauth2/reject-redirects.mjs` defaults fetches to 10,000 ms, retaining a caller's
own timeout or signal. Token exchange and the separate certificate helper import it.
State, PKCE, validation and linking are untouched; production never overrides global fetch.

Pinned `patch-package@8.0.1` runs at postinstall with `--error-on-fail`. It is a production
dependency so production-only installs retain it. Do not disable install scripts in CI
or Vercel. The auth route declares a 30-second platform backstop. Failure returns to
localized sign-in with the reviewer's plain retry/email-code sentence.

Any Better Auth version change requires reading `dist/oauth2/reject-redirects.mjs`,
`dist/oauth2/validate-authorization-code.mjs` and `dist/social-providers/google.mjs` again,
confirming runtime import resolution, and rerunning `tests/sign-in/oauth-timeout.test.ts`.
Remove the patch once upstream provides a supported timeout. Missing-patch tests fail.

Licence record: better-auth 1.7.28, @better-auth/core 1.7.28 (modified),
@better-auth/prisma-adapter 1.7.28 and patch-package 8.0.1 are MIT. Retain their package
licences. No Resend SDK is added. Audit results and verified/unverified acceptance are
in `foundry/tasks/SB-084/verification.md`.
