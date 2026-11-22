# SB-050 — Quote draft from past quoted prices

Issue: https://github.com/FATTY-BAMBA/StrideBrain/issues/50
Baseline: main at `a93fb4793dab33b361e107d276979b54ac4946f6` (PR #49 merged).
Branch: `build/sb-050-quote-draft`. One draft pull request.

A. Reuse the existing quoted-history authority, normalization and median for jobs without a quote; implement QUOTE-DRAFT-1.0 and exact tax/totals.
B. Add the tenant-scoped port/adapter, preparation and transactional versioned save, provenance and quote:draft capability; test normal, denied and retried requests.
C. Bilingual Quote tab, Home Draft quote decision and finding-card count parity, shared exact money formatting, local checks and evidence.

No issuing, PDF/export, client acceptance, model call, data-mode branch or hosted action. Hosted acceptance waits for the Product Director's Test site workflow and clickthrough; keep the PR draft.

Review, 22 November 2026: draft lines use commercial pricing categories; partial scope coverage shows the combined rate only as a reference. Improve rate/area/amount readability and preserve default/edited descriptions in each language. Same branch and draft PR #51.
