# Copy-ready dedicated Cloud QA task

No new task has been created by this package. The Product Director must create a
new **Cloud** task for `FATTY-BAMBA/StrideBrain` and paste the following prompt.
The Orchestrator's handoff supplies the exact portability commit after push.

---

Act as the independent Computer QA Coordinator for StrideBrain Stage 8, GitHub
Issue #29. This is a dedicated Cloud QA task authorized to **recreate an isolated
synthetic preview in this new task's environment** and run its actual Cloud
browser. Do not depend on another task's localhost or private runtime files.

Repository: `FATTY-BAMBA/StrideBrain`.
Branch: `build/sb-029-governed-internal-review`.
Evidence checkpoint: `2a23d31f46e0b6c7b465b3774ad765c81a3417eb`.
Tested application source: `4c13f726bb75f4a31d263eb6e54622224807d019`.
Use the exact portability HEAD supplied with this prompt; otherwise fetch the
named branch and record its actual full HEAD. Verify all later changes since the
checkpoint are under `foundry/tasks/SB-029/` and the source-tree manifest matches
the tested application. Stop if product source changed unexpectedly. A fresh
production build gets its own actual BUILD_ID; do not claim the old build ID.

First read Issue #29, all governing sources listed in
`foundry/tasks/SB-029/computer-qa-plan.yaml`, accepted `architecture.md` and
`build-contract.md`, historical `computer-qa-report.json`, and the Cloud
runtime/desktop skills. The historical attempt was BLOCKED by browser-control
infrastructure; **zero complete browser scenarios passed**. Historical HTTP/unit
checks and partial screenshots do not count as browser passes in this task.

Follow `foundry/tasks/SB-029/cloud-qa/README.md` exactly to verify the source and
create a fresh private runtime. Use new random credentials, a new isolated
PostgreSQL 17 container/database, all eight migrations, repeated synthetic seeds,
SQL verification, locked dependency installation, Prisma generation and the
production build. Record deterministic command results and source/build identity.
Use `localhost` both for Next's bind hostname and configured origin. Do not copy
old environment secrets, sessions, cookies, data volumes or build artifacts.

Use only the provided operator's trusted `DemoSessionService` issuance for fixed
synthetic personas. Follow the actual browser tool's authentication guidance; do
not inject cookies/browser state, run standalone CDP/Playwright outside the
documented Cloud browser tool, or weaken Secure/HttpOnly/SameSite/origin controls.
Supported API locators inside that tool are allowed. Never expose bootstrap URLs or credentials in
reports/screenshots. If the browser or authentication flow is unavailable, record
the exact blocker and stop instead of claiming readiness or pass.

After this task's readiness is proved, execute **all 18 scenarios QA-01–QA-18**
from the accepted plan with actual browser observations: English and Taiwan
Traditional Chinese, PM/Estimator, Finance, Admin, Viewer, cross-tenant and
no-assign variation; desktop/tablet/mobile/200%-zoom viewports; prepare, finite
title/rationale edits, mandatory evidence/warnings, assignee/due-date limits,
confirmation, durable receipt, Workspace Actions, receipt reopen, retry,
refresh/back/forward, locale/route/selection/evidence/draft restoration, direct
denials, stale/permission/evidence/assignee/expiry/failure states, keyboard/focus,
reduced motion and real browser latency. Specifically verify locked-assignee
unavailability focuses its localized error, each actor creates a fresh comparison,
and evidence-sheet return preserves edited fields with only one modal open.

Use read-only database observations for before/after Action, evidence snapshot,
AuditEvent, proposal consumption and receipt consistency. Necessary failure-case
fixture mutations are permitted only in this disposable synthetic preview, scoped
and restored with evidence; never change product source or policy. Record each
case's actual PASS/FAIL/BLOCKED/NOT_RUN, locale/persona/viewport, steps, observed
outcome, screenshot path and severity. Stop for P0/P1 safety findings. Report
defects to the Orchestrator/Builder; do not fix or approve your own fixes.

Preserve historical `computer-qa-report.json` and old evidence. Write this new
run's report, readiness, sanitized logs, screenshots, timings and restoration
proof under `foundry/tasks/SB-029/evidence/cloud-qa/<UTC-run-id>/`. Create an evidence
branch `qa/sb-029-cloud-<UTC-run-id>` from the recorded portability HEAD, then
commit/push only that new evidence subtree after checking staged paths and
redacting credentials. Do not stage product files, private runtime state or old
report changes. Return its exact branch/full evidence commit so the Orchestrator
can fetch/review the report and screenshots across the separate filesystem. If
push is unavailable, deliver a sanitized report/screenshots archive through an
available artifact tool and return its accessible reference; local paths alone
are insufficient. If both delivery paths are unavailable, report the blocker.

Return exact preview source branch/HEAD, application fingerprint, new BUILD_ID,
local preview URL/environment, all 18 outcomes and delivered evidence paths,
authorization/non-disclosure results,
bilingual/accessibility findings, actual performance, blockers and limitations.
Complete the computer-use tool's observed summary after browser work. Request
independent review of the resulting evidence; do not claim merge/release readiness.

No product source changes, policy changes, new integrations, external messages,
real customer data, Vercel changes, DNS/demo-domain changes, public deployment,
merge or release. Only the bounded internal-review business action and authorized
synthetic test setup/mutations are in scope. Do not mark the original task MERGED
or DONE; the Product Director retains final approval.
