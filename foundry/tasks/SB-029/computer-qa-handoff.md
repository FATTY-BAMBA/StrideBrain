# SB-029 independent Computer QA handoff

Preview: `http://localhost:3000` in this task's shared Cloud browser. This is an isolated local synthetic preview, not a public deployment.

Branch: `build/sb-029-governed-internal-review`  
Exact application head: `4c13f726bb75f4a31d263eb6e54622224807d019`  
Production build: `3arTh5JwUyUt0e73FJY-z`  
CI: <https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/43767600389>

Independent deterministic validation: all 16 commands passed, 436 tests including 88 PostgreSQL adversarial cases; see `validation-final.json`. Source/config/schema/tests are unchanged from the tested commit. Later changes, if any, are task evidence/state only; compare the source-tree fingerprint in validation-final.json.

## Actual gate status and access

The preview reached PREVIEW_READY. Task state is now BLOCKED at the Computer QA gate because direct CUA navigation failed twice with `Browser Use could not read requirements` and the documented desktop fallback reported an unavailable AT-SPI input provider. No complete browser scenario passed; final independent review and merge approval remain pending. This is recorded tool evidence, not an application failure.

The URL is reachable only inside the existing StrideBrain cloud environment. A separate @Computer Work session must attach to that same environment/shared desktop before using localhost. If it cannot access this environment, stop and report the access limitation; do not publish a new deployment, change the demo domain, or interpret your own localhost as this preview.

Environment ID: `ccarenv_b64_Y2NhcmVudl9lOGNmYmQyY2I2ZjQ4MTkxYWVjZDY4Nzk0ZWE5NDBiNQ`.

Start the exact built application with `node --env-file=/tmp/sb029-preview/preview.env node_modules/next/dist/bin/next start --hostname localhost --port 3000` from the repository. Bind hostname and configured public origin must both be localhost; binding to 0.0.0.0 makes Next reconstruct a different request origin and correctly triggers the strict origin denial. The current process is already running.

## Synthetic personas and login

Use the existing trusted session issuer through the private operator procedure at `/tmp/sb029-preview/README.md`. Start `/tmp/sb029-preview/run-operator.sh serve`, then issue a fixed persona with `/tmp/sb029-preview/run-operator.sh issue mei en` (or `finance`, `admin`, `viewer`, `northern`; locale `en`/`zh-TW`). Open the private single-use URL from its untracked output file. Do not put credentials, bootstrap URLs, cookies, or environment values in screenshots or committed artifacts. Revoke sessions when switching personas. Never weaken cookie attributes or add a browser-selected role.

Personas: Mei Lin — Project Manager/Estimator with explicit actual-read; Iris Huang — assigned Financial Reviewer; Alex Chen — Admin; Kai Wu — Viewer; Northern Owner — other synthetic organization. No-assign and changed-access scenarios require controlled synthetic fixture mutation and restoration on the preview database only.

## Locale routes and limits

Both HTTP workspace routes responded successfully; browser behavior remains to be tested:

- `/en/projects/PRJ-XINYI-026` and `/zh-TW/projects/PRJ-XINYI-026`;
- corresponding `/compare` and `/actions` routes, preserving run, economics, selected projects, evidence and proposal/receipt selectors.

Known limits: finite approved title/rationale wording; 30-minute proposal expiry; source-table locks suitable for the controlled demo; current caller must use a matching run permission fingerprint; baseline permits one economics enrichment per comparison. Historical Stage 3/7 presentation defects should be recorded separately and fixed only when they block the Stage 8 journey. Human Traditional Chinese copy/release approval remains separate from automated QA. No browser pass is claimed by this handoff.

## Exact @Computer prompt

The preview now contains one synthetic Finance action created by an explicitly labeled non-UI HTTP smoke check. Prepare, confirmation, identical retry, payload conflict, Chinese receipt reopening, and database/audit consistency passed through HTTP/PostgreSQL; this gives no browser-QA credit. Record the initial action count, issue a fresh persona session, and create a fresh comparison for browser cases rather than reusing that consumed proposal. Evidence: `evidence/computer-qa/finance-http-action-smoke.json`.

Act as the independent Computer QA Coordinator for SB-029. Attach to the existing StrideBrain cloud environment named above; do not use a different environment’s localhost. Resume from the recorded infrastructure blocker, with no prior full browser pass assumed. Test the running isolated StrideBrain production preview at http://localhost:3000 on branch build/sb-029-governed-internal-review, exact application commit 4c13f726bb75f4a31d263eb6e54622224807d019, build 3arTh5JwUyUt0e73FJY-z. Follow foundry/tasks/SB-029/computer-qa-plan.yaml and the private synthetic-session procedure above. Use actual shared Chrome/browser tooling, read its initial documentation, and capture observed evidence for every tested locale/persona/viewport. Exercise canonical prepare/edit/evidence/confirm/receipt/workspace/reopen, Viewer/direct-path denial, non-disclosure, stale/access/assignee failure, duplicate retry and refresh/back/forward, route/locale/draft restoration, keyboard/focus/mobile/reduced-motion, and real browser latency. Observe database results through the authorized independent synthetic test operator when required. Do not modify product source, weaken policy, approve fixes, merge, deploy, use real data, or communicate externally. Record actual results, screenshots, timings and severity/stop conditions in computer-qa-report.json; never infer a pass from unit tests. Report defects to the Orchestrator/Builder and independently retest their fixes. Keep all credentials out of reports. Complete the computer-use tool's observed summary when the browser work ends.
