# SB-032 scoped entry repair and baseline resumption

**S9-F01: PASS / closed for tested scope. Current task: IN_QA. Full Stage 9 acceptance: incomplete.**

Run `20261118T040117Z`. Product commit `e8770a02f39273307334674bce76fc19815b8802`, parent `4df07c23a2896b5c13b96238f078d22941a55222`; BUILD_ID `-ghwpoAvKBJb3v0oRa-rh`. Commit is local, not pushed. Exact repair-head CI is not available; parent CI is historical only.

## Root cause and repair

Projects still rendered the original FoundationPage unavailable placeholder. The existing authorized workspace was present, but undiscoverable from Projects. The repair adds a minimal organization-scoped project read/list using trusted RuntimeContext, existing project-read authorization and a minimal localized DTO. It uses the existing workspace route. No fixture business key is hard-coded into presentation. Navigation serialization now sends only navigation labels, removing unrelated catalog business copy from client props. No policy, authorization, tenant, financial/evidence authority, schema/migration or unrelated feature changes.

Independent source review: **PASS**; see independent-source-review.md and repair-design.md. Thirteen committed files are listed in repair-commit.json.

## Validation

**576/576 tests across 66 files**, no skipped tests. Targeted entry regressions, localization and PostgreSQL adversarial subsets pass. Format, lint (one existing warning), strict types, Prisma validation/generation, eight clean migrations, repeated seed/SQL, production build and production dependency audit all pass. Audit: zero vulnerabilities. Preliminary test/tooling failures and corrections are retained, not hidden; see deterministic-results.json and tooling-observations.json.

## Browser evidence

Codex in-app browser, measured CSS viewports 1440×900, 768×1024, 390×844, 320×740. Both en and zh-TW Projects entries identify and open Xinyi via keyboard/pointer with locale preserved and local navigation present. Viewer follows existing assignment policy with financial workspace fields restricted; Finance/Admin follow existing access. Northern sees only its own entry, with no Horizon/Xinyi response content; browser selectors cannot confer authority. Revoked and unsigned sessions show the same neutral entry state. See entry-retest-result.json and entry-viewport-results.json.

After entry passed, the fresh baseline resumed: two comparisons, bilingual authority/lighting/programme evidence, source modal focus containment and settled hierarchical Escape/trigger return, native-keyboard draft edits through locale/refresh/evidence/back-forward, field validation, cancel/reopen, two explicitly authorized synthetic confirmations, copied/refreshed/reopened receipts and consumed-proposal replay safety. Database final counts are exactly two actions, receipts, audits and consumed proposals.

**This is not full Stage 9 scenario acceptance.** Timed comprehension, full selection/persona/security/fault/performance/rollback/native/human and date-boundary matrices remain. EN review screenshots at CSS widths 390/768 were captured at pixel widths 365/443 and require settled recapture; no clipping defect or visual pass is inferred. A preliminary source-return trace captured an in-flight transition; the settled trace confirms the exact third source trigger. IAB date fill alone did not commit React state; native keyboard edits did. Some preliminary review captures show expected consumed-proposal unavailability; valid form captures are separately named `valid-review`.

96 screenshot files were reviewed as contact sheets with key full-resolution inspection. DOM/state records qualify screenshots; no linguistic or human-device approval is inferred. See screenshot-review.json, browser-baseline-resumption.json and scenario-outcomes.json.

## Cleanup and remaining gates

All six run-owned sessions revoked, one-use records removed, operator stopped, browser tab closed and viewport override reset. No OS settings changed. No temporary fixture mutations or history deletion/reseed. Initial fixture/history rows, eight migrations and four immutable-history guards remain intact; new synthetic history is retained. Production preview remains running with revoked QA sessions.

M-01/M-02/M-06/M-07 remain BLOCKING_BEFORE_DEMO_RELEASE; M-05 remains STAGE_9_HARDENING. No actual speech, physical-device, human Chinese, or generic-failure pass was invented. Original FAIL run and SB-029 evidence are preserved. No push, merge, deployment or Vercel/DNS change.

Sanitization: PASS for new evidence, task records, all screenshot OCR/metadata and known runtime values in public static assets. See sanitization.json, cleanup-integrity.json and final-verification.json.
