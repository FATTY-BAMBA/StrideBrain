# Issue draft — Quote Draft v0.1: evidence-backed draft, flags, governed issue, PDF

Stage 2 of `docs/product/V0_2_WORKFLOW_SLICE.md`. Needs Stage 1 (Jobs), ADR-008 and the decision to lift "quotation approval" and "conflict-resolution workflow" from the deferred list. Copy the text below into a new GitHub issue.

---

## Goal

For a job in `QUOTE_REVIEW`, the product drafts a quote from confirmed past prices, shows the source of every price, flags what needs a decision, and lets an authorized person issue it and download a PDF. Code picks every number. No model is required for this issue.

## Scope

1. A draft policy as a pure function in `src/modules/quote-draft/domain/draft-policy.ts`, version `QUOTE-DRAFT-1.0`. Input: the job context, the ranked similar jobs from CPI-SIM-1.0, and confirmed price observations. Output: draft lines, flags, and the evidence ids behind each price.
2. First price rule: for each scope category, propose the most recent confirmed unit price from the highest-ranked similar job, and keep the range across matches. Where a current supplier offer exists for the same material, show it beside the proposal. Never pick silently between two conflicting sources.
3. A repository port that reads confirmed prices from `QuoteItem`, `SupplierOfferItem` and `CostLine` for one organization, respecting authority state.
4. Flags. Reuse what the economics module already produces (`CATEGORY_QUOTED_VARIANCE`, `STALE_SUPPLIER_EVIDENCE`, `CONFLICTED_EVIDENCE`, `LINE_NOT_RECONCILED`). Add two: a draft price below the last actual cost for that category, and a category that similar jobs had but this quote lacks. When two confirmed sources disagree beyond tolerance, open an `EvidenceConflict`.
5. A `PrepareQuoteDraft` use case that saves a `QuoteVersion` with `status = DRAFT` and `authorityState = OBSERVED`, its items, and `EvidenceReference` rows.
6. A quote editor in the project workspace: lines by category, a source link on every price that opens the existing evidence panel, flags on the lines that need a decision. Any line can be edited.
7. Conflict resolution with a required note, using the existing `authority:financial-conflict:resolve` capability.
8. An `IssueQuote` use case on the prepare then confirm pattern of `InternalReviewService`: capabilities `quote:draft` and `quote:issue`, idempotency key, `AuditEvent`. On issue: `status = ISSUED`, `authorityState = APPROVED_COMMERCIAL`, `approvedAt` set, the previous version superseded.
9. PDF output and Excel export. The PDF library needs a registered static Traditional Chinese TTF font.
10. A 客戶已接受 action: quote `status = ACCEPTED`, project `stage = APPROVED`.

## Security gates

- The model, if present, has no part in price selection, flags, conflict resolution or issue (ADR-006).
- Issue is blocked while any `EvidenceConflict` on the quote is `OPEN`.
- The PDF is generated on the server from stored records, not from browser state.

## Acceptance

- The seeded Xinyi job gets a draft, and every price opens its source in the evidence panel.
- The seeded imported-stone conflict (`conflict_hist_018_stone`) appears as a flag on the line that would use that evidence, and that evidence is not used for a proposed price while the conflict is open.
- A conflict between two sources for the same line blocks issue until it is resolved with a note.
- Sending the same issue request twice produces one issued version and one audit record.
- An edited line keeps its original evidence link and records who changed it.
- The PDF renders Traditional Chinese correctly and its totals match the stored version exactly.
- A `VIEWER` can neither draft nor issue. Another organization cannot read the quote.
- With no model configured, every step above still works.
- `npm run check` passes.

## Out of scope

Model-written line descriptions and flag notes (Stage 5), sending the quote to the client by email or LINE, client-side e-signature, tax rules beyond the existing `taxAmount` field, and price lists as a separate record type.

## Delivery sequence

A. Draft policy and its unit tests, with fixed inputs.
B. Price port, `PrepareQuoteDraft`, conflicts.
C. Editor and evidence links.
D. `IssueQuote`, capabilities, audit, idempotency.
E. PDF, Excel export, client-accepted action.
