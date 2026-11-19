# SB-032 execution wave — 20261118T031855Z

Verdict: **REVISE**. Deterministic validation PASS; required browser entry S9-02 FAIL due to independently classified P2 **S9-F01**. No observed P0/P1 within executed scope; unexecuted security, persona and downstream checks remain unresolved.

Branch: `build/sb-032-stage9-quality-hardening`. Exact tested head: `4df07c23a2896b5c13b96238f078d22941a55222`. Exact-head CI: [44224883503](https://github.com/FATTY-BAMBA/StrideBrain/actions/runs/44224883503) PASS. BUILD_ID: `2qJuXmIaTnV_wQ5diyp-K`. Node v24.22.3; PostgreSQL 17.12. Source manifest SHA-256: `11ec53c15429d1d155818b61e7e3b94a645c6b25403d84d7e88bbd2e7ac8c5d7` (482 tracked files before task-record updates).

## Deterministic baseline

Locked install, environment, Prisma validate/generate, eight clean migrations, seed/SQL verification/repeat, formatting, lint, strict TypeScript, tests, production build/audit and start smoke PASS. Full suite **535/535 across 62 files, zero skips**. Separate localization rerun **12/12 across 4 files** and PostgreSQL adversarial rerun **93/93** are subsets, not additional unique tests. One pre-existing lint warning in prisma.config.ts, zero errors. Production audit: zero vulnerabilities. Command durations and available test/query timings are retained in commands.jsonl/logs; these are not browser performance benchmarks.

Fresh credentials, clean disposable validation database, separate freshly migrated/seeded browser database and fresh app session were used. No Stage 8 runtime state reused. Existing Node executable was reused only as a toolchain. Production started on localhost:3000 and rendered public Home plus authorized Xinyi workspace; this smoke does not establish a passing hero.

## Browser boundary and independent classification

Fresh Mei assigned-PM session landed in the existing Xinyi workspace. From Home → Projects, the page shows **“This area is not active yet” / “此區域尚未啟用”** with no main-content entry into a workspace. Both locales reproduced at 1440×900, 768×1024, 390×844 and 320×740. See findings.json, eight-case screenshot/DOM mapping, and independent-finding-classification.md. The static route implementation corroborates the result. The complete hero cannot continue through UI navigation. No direct-route workaround counted as acceptance.

The browser was Codex in-app browser; engine/version not exposed. Chrome DOM connector was unavailable; native Chrome exists but no VoiceOver journey was attempted. Twelve screenshots were retained and visually inspected. Some raw BODY focus metadata contains non-visible framework text and is not evidence of a visible leak. One intermediate locale capture is retained alongside the authoritative settled capture. An early helper syntax error and unsupported navigator read were tooling observations before authentication, not product defects. No browser console warning/error was recorded in the captured console result.

Independent reviewer classified S9-F01 as required-path P2, newly observed but pre-existing, not an F-08 regression. Minimal localized navigation to an existing server-authorized workspace is justified. Candidate selection needs explicit review because the current repository port offers authorized business-key lookup, not a listing contract. Preserve non-disclosure, tenant/capability/assignment checks; no broad directory, CRUD/search, unconditional fixture link, permission/schema/policy expansion.

No downstream comparison/proposal/action/receipt, finance/admin/viewer/northern journey, destructive/security mutation or full accessibility/visual acceptance was executed after this boundary. Full plan disposition: **1 PASS / 1 FAIL / 5 PARTIAL / 14 BLOCKED / 1 NOT_RUN** across 22 scenarios. This is not a completed Stage 9 QA pass. Detailed and expanded per-ID dispositions are in scenario-outcomes.json and acceptance-coverage.json.

## Inherited gates

| Gate | Current-run status | Remaining work |
| --- | --- | --- |
| M-01 | NOT_RUN | User available to listen; actual VoiceOver + Chrome journey and speech evidence after baseline repair. NVDA/Windows unavailable on current Mac host. |
| M-02 | DEVICE_EVIDENCE_REQUIRED | iPhone available, not tested; Android availability unconfirmed. Protocol prepared, safe device preview access still needed. Emulation is not a physical pass. |
| M-05 | PARTIAL | Seven injected domain-clock cases and default +7 assertion PASS; exact-head service/PG no-write tests PASS. Live UI/server midnight/leap-day method not demonstrated, no E2E closure. |
| M-06 | NOT_RUN | Actual form/error description node, focus and spoken relationship not reached. |
| M-07 | HUMAN_REVIEW_REQUIRED / preparation PARTIAL | Bilingual copy/terminology inventory and checklist prepared. Full hero screenshots and independent human Taiwan review outstanding. |

M-01/M-02/M-06/M-07 remain BLOCKING_BEFORE_DEMO_RELEASE; M-05 remains STAGE_9_HARDENING. Prior M-03/M-04/F-08 passes remain historical with their tested scope; they are neither rewritten nor promoted to new Stage 9 passes.

## Closure and next wave

Cleanup PASS: one owned session revoked, zero active owned sessions; no fixture mutations; zero new comparison/proposal/action/audit/receipt records. Fixed fixtures/history unchanged, four immutable guards enabled and unchanged, all eight migration checksums match source. QA tab closed, responsive override reset; zoom, Reduce Motion and VoiceOver not changed. Bootstrap listener stopped; cleanup used operator/database evidence with no authenticated browser request after revocation.

Original SB-029 workspace preserved: 1,577 recorded file hashes and 678 pre-existing untracked files unchanged. Completed Stage 8 preview process was replaced to free localhost:3000; its files/build/databases were preserved. Stage 9 preview retained locally. Product source and index unchanged; generated next-env.d.ts restored to its original bytes. Sanitization PASS: new text/logs, all 12 screenshot visual/OCR/metadata checks, task records and known-runtime-secret public static bundle search are clean. Results and manifest are separate artifacts; no credentials/runtime files are included in this evidence directory.

Next: minimal S9-F01 repair design and scoped regression, exact-head deterministic validation/CI, then fresh bilingual production baseline, followed by inherited manual/device checks and later mutation/security/performance/recovery waves. No source edits, commit, push, merge, deployment, Vercel/DNS change or release approval performed in this execution wave.
