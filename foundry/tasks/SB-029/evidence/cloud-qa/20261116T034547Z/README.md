# SB-029 Cloud browser QA — BLOCKED

Run: `20261116T034547Z`. Fresh dedicated Cloud preview; zero complete browser scenarios executed.

**Blocker:** Cloud navigation returned `Browser Use could not read requirements.` The documented native fallback returned an unavailable AT-SPI provider error. The actual Cloud tab remained `about:blank`. No product defect or browser pass is inferred.

- Source branch: `build/sb-029-governed-internal-review`
- Exact portability commit: `13e7191f340e998c93b644949602f1c0774fe9ff`
- Tested application commit: `4c13f726bb75f4a31d263eb6e54622224807d019`
- Verified application fingerprint: `7fe5157f84f9c88023462ec1e958b62a53bcdb5aef30eb0dc4ac95dfdac85920`
- New production BUILD_ID: `NrPF3g6uij46utRxxoxjJ`
- Cloud environment: `ccarenv_b64_Y2NhcmVudl9jZGJmMWVhOWQ5NDQ4MTkxOTg3ODhmMzFlMzMxMDI0ZA`
- Local preview: `http://localhost:3000`; production server binds `localhost`.
- Fresh PostgreSQL 17.12 container, eight migrations, two repeated seed/verification cycles, reviewed DEMO_SYNTHETIC organizations only.
- 436 tests passed across 57 files; localization 11 passed; production dependency audit found zero vulnerabilities. These give no browser pass credit.

| Scenario | Outcome |
|---|---|
| QA-01 — Authorized preparation is preparatory only | BLOCKED |
| QA-02 — Bounded edits and mandatory content | BLOCKED |
| QA-03 — Explicit confirmation and durable receipt | BLOCKED |
| QA-04 — Cancel, Escape, and evidence round trip | BLOCKED |
| QA-05 — Locale and route restoration | BLOCKED |
| QA-06 — Retry, double submit, and replay | BLOCKED |
| QA-07 — Viewer and unauthenticated denial | BLOCKED |
| QA-08 — Cross-tenant selectors | BLOCKED |
| QA-09 — Assignee authorization | BLOCKED |
| QA-10 — Quote, project, and run staleness | BLOCKED |
| QA-11 — Evidence authority, access, and availability change | BLOCKED |
| QA-12 — Permission downgrade during review | BLOCKED |
| QA-13 — Expiry and consumed proposal | BLOCKED |
| QA-14 — Safe service failure and transaction rollback | BLOCKED |
| QA-15 — Keyboard, focus, semantics, and zoom | BLOCKED |
| QA-16 — Mobile and Taiwan Traditional Chinese layout | BLOCKED |
| QA-17 — Browser and PostgreSQL performance baseline | BLOCKED |
| QA-18 — Stage 0-7 regression smoke and excluded behavior | BLOCKED |

The common navigation blocker applies before each scenario. No scenario steps, persona login, viewport matrix, product screenshot, keyboard/focus check or browser latency sample was completed.

Server-only measurements from this run (30 samples, one excluded warmup; excluding network transit): proposal p50/p95 **103.60/152.75 ms**, confirmation **117.72/145.38 ms**; 110/131 queries respectively. Concurrent confirmation p95 **248.48 ms**. Batching checks remained 21 queries with 20 more evidence references and 110 queries with 20 more eligible assignees. These are separate from the blocked browser performance scenario.

Read-only before/after SQL: Action, ProposedAction, AuditEvent, consumed proposals, evidence snapshots and receipts all zero. All four immutability triggers are enabled. No successful browser transaction or receipt consistency claim is possible.

Authorization/non-disclosure, bilingual UI, accessibility, mobile/tablet/zoom and reduced-motion browser checks are **BLOCKED**. No P0/P1 product finding was observed; the browser could not exercise the product.

臺灣繁體中文：本次雲端瀏覽器無法開啟預覽。QA-01 至 QA-18 全部受阻，沒有任何完整瀏覽器情境通過。英文與繁體中文介面、權限、不洩漏資料、無障礙及瀏覽器效能仍須獨立驗證。

Evidence:
- [Complete scenario report](computer-qa-report.json)
- [Readiness and build identity](readiness.json)
- [Browser attempts and exact errors](browser-blocker.json)
- [Actual blank Cloud tab screenshot](screenshots/cloud-browser-blocked.jpg)
- [Fresh server/PostgreSQL performance](server-performance.json)
- [Read-only database observer](database-observer.sql)
- [Final database observation](commands/34-final-database.log)
- [Restoration and scope attestation](restoration.json)
- [Sanitized command results](commands/)

**Independent review requested:** Orchestrator/independent reviewer, please review this evidence-only branch and coordinate recovery of the Cloud browser, followed by the complete 18-scenario browser matrix. No external notification was sent. The preview is preserved for review; newly issued fixed-persona sessions and renewed readiness checks are required before resuming. A new Cloud task must recreate all runtime state.

Historical evidence and application source remain unchanged. This is not merge or release readiness.
