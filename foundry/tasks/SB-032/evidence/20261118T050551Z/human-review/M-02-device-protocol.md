# M-02 physical-device execution package

Status: DEVICE_EVIDENCE_REQUIRED. A paired wired iPhone was detected (model identifier iPhone16,1, iOS 26.5). Safari version is not separately recorded. Android physical availability is unknown; DEVICE_EVIDENCE_REQUIRED_ANDROID remains explicit. Do not publish serial/UDID/IMEI/phone numbers.

## Access blocker and proposed method

Current app and one-use operator are loopback only. A plain HTTP private-IP URL is not an authenticated test path: the __Host session cookie is Secure/HttpOnly/Path=/ with SameSite=Lax; review POST requires both Origin and request URL origin to equal configured origin. The operator additionally enforces localhost Host/origin and redirects to localhost. Pairing does not establish browser network access.

Candidate, not configured: `https://<PRIVATE_LAN_IP>:8443` on the same trusted network, with phone-trusted local TLS and exactly matching application origin. Keep DB and credential issuer private; design a bounded same-host one-use synthetic-session delivery over trusted HTTPS. Verify the production server sees the correct origin/protocol, host-only cookie behavior, CSRF checks, tenant isolation and redirect target. Do not disable Secure, rename __Host, wildcard origins, bypass certificates, expose a reusable token, open router ports or deploy. No CORS relaxation is needed for a correctly same-origin design. A public tunnel is not proposed.

No product change was made or established necessary solely for device access. An operator/runtime TLS plan must be reviewed before implementation. If the existing safe session workflow cannot support it, retain the blocker and request the smallest explicit scope decision; never patch around guards. macOS pairing is reported paired; a new unanticipated trust/security prompt requires user handling.

## Real device cases — repeat en and zh-TW

Record model/OS/browser/CSS viewport, orientation, physical device, test time, exact head/BUILD_ID and safe screenshot references. Use a fresh one-use synthetic session only after safe access is proven.

1. Projects → Xinyi → comparison → select comparable set → evidence → source. Verify real touch targets and evidence close/reopen.
2. Open review; edit all approved title/rationale options, assignee, and actual native date picker set/clear. Record soft keyboard occlusion and scroll reachability.
3. Switch locale with an edited draft, refresh and reopen; verify no draft loss.
4. Trigger unchecked-consent validation; keyboard/touch recovery controls must remain reachable.
5. Explicitly confirm one synthetic action; read receipt and reopen from Actions. Check no double-tap duplicate action.
6. Record failures with exact steps and video/screenshots where supplied. Desktop emulation never counts as device evidence. Unsupported physical widths stay explicit.
7. Revoke owned session, stop temporary LAN listener/TLS path, restore runtime origin/binding, verify guards and preserve history.

Result form: case ID; locale; model/OS/browser; expected; observed; screenshot; PASS/FAIL/NOT_TESTED; reviewer/time. No result is prefilled PASS.
