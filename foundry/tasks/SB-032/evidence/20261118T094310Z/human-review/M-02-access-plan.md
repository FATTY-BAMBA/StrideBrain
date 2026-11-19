# M-02 safe physical-device access — not executed

Current device availability needs confirmation; see M-02-device-inventory.json. The prior paired model/iOS record is historical, not a new detection or Safari pass.

The proposed temporary address remains `https://<PRIVATE_LAN_IP>:8443` on a trusted private LAN. No public tunnel, router port, DNS, deployment or Vercel change is proposed. A runtime-only TLS endpoint and same-origin one-use session issuer must be reviewed and validated before use. The phone must trust the certificate through a user-managed trust procedure; do not bypass browser certificate warnings.

Preserve Secure, HttpOnly, Path=/ and the __Host cookie prefix. Configure exactly the same application origin as the phone URL, verify server-observed request origin/protocol and CSRF rejection, retain tenant guards, use no wildcard CORS, and keep PostgreSQL/issuer management loopback-only. The current loopback operator deliberately rejects non-localhost origin; do not patch around that guard. No product-source change is established necessary. The minimal candidate is a separately bounded QA runtime/issuer with strict host and synthetic-database checks, subject to review before implementation.

Then record real iOS Safari keyboard occlusion, touch targets, native picker set/clear, locale preservation, evidence close/reopen, action review and receipt reachability in both locales. Android stays DEVICE_EVIDENCE_REQUIRED_ANDROID unless physically supplied. Revoke owned sessions, stop TLS/LAN listeners and restore runtime configuration after testing.
