# StrideBrain v0.2 — Workflow Slice

**Status:** PROPOSED, awaiting Product Director decision  
**Date:** 2026-11-21  
**Slice:** From inquiry to closed job, for an interior design firm  
**Builds on:** v0.1 Comparable Project Intelligence, issue #37 (Real Project Intake), issue #39 (Grounded AI Conversation)  
**Checked against:** `main` at `42a62bc`, `build/sb-037-real-intake-contracts` at `c26b30d`

## 1. Why this slice

v0.1 answers one question: "Have we done something like this before?" An owner pays for work done: a quote drafted, a mistake caught before it costs money, a task not forgotten.

This slice puts a workflow around the intelligence that already exists. A job comes in, the product drafts the quote from confirmed past prices, a person confirms it, work items and reminders follow, and the closed job becomes evidence for the next quote. That last step is what delivers the product promise, "Every completed project should make the next project easier." Today nothing enters or closes through the product, so the promise cannot be kept.

Issues #37 and #39 remain valid. #37 is Stage 3 of this slice. #39 is a separate track that does not block it.

## 2. Decision requested

Lift these five items for this slice. They are listed under "Explicitly deferred work" in `docs/build/IMPLEMENTATION_SEQUENCE.md` and as non-goals in section 24 of `docs/architecture/TECHNICAL_ARCHITECTURE_V0_1.md`.

| Deferred in v0.1 | What this slice needs |
| --- | --- |
| Arbitrary file upload and OCR | Reviewed intake of quote and cost tables (issue #37), then model reading of PDF and photos into review-only staging |
| Quotation approval | Issuing a quote as a governed action |
| Conflict-resolution workflow | Resolving an open `EvidenceConflict` with a note before a quote can be issued |
| External email and LINE | A daily digest by email; LINE push later |
| Recurring monitoring | The daily digest job |

Stays deferred: real customer data (until the L2 list in architecture section 10 and the security gates in #37), vector or semantic search, autonomous agents, connectors, analytics dashboards.

Two ADRs are needed: ADR-007, a model may read files into review-only staging; ADR-008, issuing a quote is a governed action like internal review.

## 3. The flow

At each step the product prepares the work and a person confirms it.

| Step | The product does | The person does |
| --- | --- | --- |
| 1 Inquiry | Offers a job form; later prefills it from a pasted client message | Checks type, size, district and scope, then saves |
| 2 Quote draft | Ranks similar closed jobs, proposes a price per line with its source, flags conflicts | Edits lines and resolves flags |
| 3 Confirm | Locks the version, logs who confirmed, produces the PDF | Issues the quote and sends it |
| 4 Work items | Creates dated tasks once the client accepts, sends a daily digest | Ticks tasks off and adjusts dates |
| 5 Close | Compares actual cost with the quote and saves the job as evidence | Enters actual costs |

One-time setup before step 1: the firm brings in old quotes, price lists and supplier offers through reviewed intake.

## 4. What exists and what is missing

The data model already covers the whole flow. What is missing is every way to put data in other than the seed files in `prisma/fixtures/`.

| Step | Exists | Missing |
| --- | --- | --- |
| Bring files in | `Document`, `DocumentVersion` (`storageKey`, `mimeType`, `checksum`), `EvidenceReference.locator`; validation rules in `src/modules/intake/domain/intake-review.ts` on the SB-037 branch | Upload, storage, staging, reviewed commit |
| New job | `Project`, `ProjectScope`, `ProjectStage` | A way to create a job from the screen |
| Similar jobs | `similarity-policy.ts` (CPI-SIM-1.0), `eligibility-policy.ts` | Job types beyond commercial retail; a decision on 坪 or m2 |
| Quote draft | `Quote`, `QuoteVersion`, `QuoteItem`, `SupplierOfferItem`, `CostLine`, `EvidenceConflict`, the economics module | A draft policy, a quote editor, PDF output |
| Confirm | `InternalReviewService` prepare then confirm, `AuditEvent`, receipts, capabilities | A confirm path for quotes |
| Work items and reminders | `Action` has a due date, assignee and status | `Action` requires a comparison run and no route changes its status; no scheduler or sender |
| Close | `ProjectCostVersion`, `CostLine`, `RECONCILED_ACTUAL` | A screen to enter actual costs and complete the job |

Constraints in the code today:

- `src/lib/env/server-env.ts` refuses any data mode except `DEMO_SYNTHETIC`. This slice keeps that gate and is built with synthetic files.
- ADR-006 forbids a model from calculating financial values, approving quotes or creating action state. This slice keeps that: code picks every number.
- `ADJACENT_SUBTYPES` covers only `COMMERCIAL_INTERIOR_FIT_OUT` retail subtypes, and candidates with a different area unit are rejected.

## 5. Stages

Build in this order. Each stage is one issue and one pull request. Draft issue texts are in `docs/build/v0.2/`.

| Stage | Issue | What the owner can see afterwards |
| --- | --- | --- |
| 0 Decisions and setup | This document, ADR-007, ADR-008 | Nothing yet |
| 1 Jobs | Draft: `ISSUE_DRAFT_1_JOBS.md` | Create a job and see all jobs by stage |
| 2 Quote draft | Draft: `ISSUE_DRAFT_2_QUOTE_DRAFT.md` | A draft quote with a source on every price, issue, PDF |
| 3 Intake | Issue #37, then draft `ISSUE_DRAFT_3_FILE_READING.md` | Bring in old quotes and confirm what was read |
| 4 Work items and closing | Draft: `ISSUE_DRAFT_4_WORK_ITEMS_AND_CLOSE.md` | A task list after acceptance, and closing a job |
| 5 Digest and wording | Draft: `ISSUE_DRAFT_5_DAILY_DIGEST.md` | A morning message; quote lines in the firm's own words |
| P Production foundation | Draft: `ISSUE_DRAFT_P_PRODUCTION_FOUNDATION.md` | Real sign-in and a separate production environment |

The quote draft comes before intake because it gives a convincing demo on the seed data. Intake then feeds the same screen with the firm's own records.

Stage P runs alongside the others and must pass before any real customer data enters the product. Stages 1 to 5 are built and tested on synthetic data, in the same code that production will run.

## 6. System design additions

This extends `docs/architecture/TECHNICAL_ARCHITECTURE_V0_1.md`. The layer model, repository ports and tenant rules are unchanged. The application stays one deployment.

New or extended modules:

| Module | Does | Location |
| --- | --- | --- |
| Jobs | Create a job, move it through stages, close it | `src/modules/projects/` (extend) |
| Intake | Store files, stage lines, reviewed commit | `src/modules/intake/` (started in SB-037) |
| Quote draft | Draft lines from confirmed prices, flags, PDF | `src/modules/quote-draft/` |
| Work items | Task list per job and status changes | `src/modules/work-items/` |
| Digest | Decide what each person needs today and send it | `src/modules/digest/` |

New ports, each with one adapter: `FileStorePort` (private file store), `DocumentReaderPort` (model call with a fixed output schema), `WordingPort` (same provider), `NotifierPort` (email first).

Data model changes:

| Model | Change |
| --- | --- |
| `ExtractionRun`, `ExtractedLine` | New. Review-only staging for what was read from a file. |
| `WorkItem` | New. Project, source quote version, title, category, assignee, due date, status. |
| `DigestDelivery` | New. Unique on membership, date and channel, so a retry never sends twice. |
| `QuoteVersion` | `status` gains `ISSUED` and `ACCEPTED`; add draft policy version and source comparison run. |
| `AuditEvent` | Optional links to a quote version, a work item and a document version. |
| `Organization` | Digest settings. `timezone` already exists. |

Every new table carries `organizationId` and a compound unique key on `[id, organizationId]`.

States:

- A file: uploaded, read into staging, needs review, confirmed (records written as `HUMAN_REVIEWED`), or failed or rejected.
- A quote: `DRAFT` (`OBSERVED`), `ISSUED` (`APPROVED_COMMERCIAL`, audit written), `ACCEPTED` (job moves to `APPROVED`, work items created), `SUPERSEDED`.

## 7. Rules

The standing rules are in `AGENTS.md` at the repository root. The ones that matter most here: a model never writes records, every financial claim is traceable to evidence, every person-made state change is audited in the same transaction, and the flow works with the model switched off.

Everything in this slice is built for the production application, not as a demo patch. `AGENTS.md` holds the production standard: one code path for demo and real tenants, no hard-coded ids, no stubs behind production routes, forward-only migrations, and limits, timeouts and visible failure states on every input and outside call.

Two things make the product production-ready, and they are separate. The first is that each feature is built properly once; the production standard covers that. The second is that the platform is safe for real customers: real sign-in, a second barrier for tenant isolation, a separate production environment, backups and a security review. None of that exists yet, and Stage P builds it.

## 8. Tools proposed

Each sits behind a port and can be replaced. To be confirmed in Stage 0.

| Job | Proposed |
| --- | --- |
| Model calls with typed output | AI SDK with a schema library |
| Reading PDF and photos | A model with PDF input; test two providers on the synthetic file set |
| Reading Excel | SheetJS, installed from its own distribution site |
| File storage | A private Vercel Blob store |
| Background extraction | Vercel Workflows |
| Daily schedule | Vercel Cron Jobs |
| Email | Resend |
| LINE | LINE Messaging API push messages |
| PDF output | `@react-pdf/renderer` with a registered Traditional Chinese TTF font |

## 9. Out of scope for this slice

- LINE inbound. Client messages are pasted into the job form.
- The printing factory flow. It uses the same skeleton and follows once this runs.
- AI customer service and analytics dashboards.
- Real customer data and production sign-in.
- Site photos, a scheduling calendar, a materials database and 3D.
