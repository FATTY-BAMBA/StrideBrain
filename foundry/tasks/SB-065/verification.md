# SB-065 verification

## Scope and decisions

Base main: `a7ee58c` after #72. Delivery follows A–E in #65. Section selectors use the job's pricing categories (Product Director clarification). Multiple sections can share a category; reference amounts and Use suggestion are evaluated for the category as a whole. Individual scopes are not a quote level.

## A — Schema and domain

Additive migration adds tenant/version-bound QuoteSection rows, optional section links and typed line fields, document version/discount fields, and the optional site address. It does not backfill or rewrite old items, totals or issued snapshots. Old documents remain version 1 until a new draft version is explicitly saved. New unit suggestions retain existing keys and edited labels.

The fixed-point domain computes whole-dollar line amounts, independent percentage fees on the original non-percentage subtotal, discount before tax, and half-up 5% tax. Inputs are bounded to 30 sections / 300 lines and the issue's text/decimal limits. Submitted amounts and subtotals are discarded.

[Baseline capture](evidence/baseline-capture.log) used an isolated local database with all migrations before SB-065 and asserted QuoteSection did not exist. It recorded rankings, exact findings in both languages, suggestions and Home figures in [seeded-before.json](evidence/seeded-before.json). [Delivery A](evidence/delivery-a.log) proves the populated migration preserves every old item/version/job value (including an immutable snapshot), tenant/version constraints reject foreign links, unit seeding is repeatable, and the new schema produces identical seeded results.

Prisma schema validation, TypeScript, and all **11 delivery-A tests** pass.

## Pending

Repository/use cases, editor, PDF, category roll-up, full check, browser/PDF evidence and the required three-round paid evaluation. No hosted operations. Hosted acceptance waits for the Product Director; the single PR will stay draft.

## Delivery B — repository and application

95 targeted tests passed across quote-document, quote-draft and quote-issue (16 files). This includes saving without a comparison, server-recomputed totals, concurrent idempotency, Viewer structure without financial fields, cross-tenant denials, immutable version 2 issue/revision snapshots and site-address audit redaction. A second forward migration preserves the legacy amount constraint while adding whole-dollar item, percentage and note invariants. Hosted acceptance remains waiting for the Product Director.

## Delivery C — editor

The section editor, Paper and navigation Tabs, per-category references, site-address form, pre-issue client review and acceptance confirmation are implemented. 19 focused UI/list tests passed in both languages. Typecheck caught a missing terms field in the new UI fixture; that fixture was corrected and the complete check is still pending. Local browser/responsive evidence is still pending and will be recorded after the PDF and category rollup deliveries. No hosted changes.

## Delivery D — immutable PDF

13 PDF tests passed, including the pre-SB-054 issued PDF byte-parity assertion. Rendered and visually inspected the English and Traditional Chinese seven-column documents, the totals page and a continued page of the 40-line document. Notes, remarks, non-compounding fees, discount, client/site details and repeated column headings are present; no overlapping content was seen. Empty terms and email are omitted. Typecheck now passes.
