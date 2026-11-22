# SB-052 verification

Hosted acceptance: **WAITING FOR THE PRODUCT DIRECTOR**. The single pull request stays in draft. Agents did not deploy, migrate, seed, change settings, or run browser acceptance on a hosted project. The Product Director uses [TEST_SITE.md](../../../docs/development/TEST_SITE.md).

## Delivered in A → B → C order

A adds organization document details, owner-default `quote:issue`, read-only signed preparation, issuance, revision, conflict resolution and acceptance. Mutations use the trusted context, serializable transactions, matching-request replay and atomic audit receipts. The issue confirmation rechecks the draft, client/job data, firm settings, underlying source access, blockers and warnings. Browser totals, document numbers, snapshots and issuing identities are refused.

Issuance changes the saved draft to ISSUED / APPROVED_COMMERCIAL and records the document snapshot and issuing member. Numbers count issued versions for that job. Revision copies the exact stored lines and recorded basis into a new draft; the earlier issued quote remains effective until its revision is issued. Acceptance records the date/member/note atomically. It moves only DISCOVERY, DESIGN or QUOTE_REVIEW jobs to APPROVED and leaves every other stage unchanged; the audit records the actual previous and resulting stages. Expired quotes remain acceptable with a warning. Future acceptance dates are refused using the organization's calendar date.

PostgreSQL guards issued versions and quote items against changes, additions and deletion, while allowing only the required supersession and acceptance transitions. The fixture reset uses the existing guarded owner-only transaction and restores all six immutable triggers. The additive migration preserves existing rows; two older populated-upgrade test harnesses install this independent schema before using today's seed while still withholding the migration they test.

B adds the server PDF route and renderer. **PDFKit 0.21.0** provides A4 layout, TrueType embedding, text wrapping and streaming without a browser. **StrideBrain Sans TC Regular** is the renamed static weight-400 instance of **Noto Sans TC**, retaining the Traditional Chinese character repertoire. The committed [font provenance](../../../assets/fonts/README.md) includes the upstream source hash; [SIL OFL 1.1](../../../assets/fonts/OFL.txt) allows redistribution. This avoids font downloads at runtime and variable-font support requirements. The Next server trace explicitly includes the font. PDF.js reads generated text back for tests. [PDFKit font documentation](https://pdfkit.org/docs/text.html) describes the supported embedding path.

Issued PDFs use only the stored snapshot; changing Settings or client/job records does not change that document. The authorized route uses `private, no-store`, a document-number filename and non-disclosing denials. Draft previews share the renderer and carry a watermark on every page. No file storage or email integration was added.

C adds bilingual Settings and Quote controls, the existing evidence panel for both conflict readings, fresh saved findings above issuance and explicit confirmation. Resolving a conflict updates the live flag without changing a recorded basis or discarding edited amounts. Home uses the existing decision-source port and now gives each job only its highest-priority row: Confirm review → Review quote (cannot issue) → Issue quote → Awaiting client → Draft quote → Compare. The Issue row retains the largest current finding and count; Awaiting client includes number, validity and an authorized acceptance link.

The three repairs retain one/two eligible past prices as evidence-backed reference rates/ranges without a suggestion or sufficient-history variance; clear a new-job field's error when that field changes; clarify the client-code alphabet and the prohibition on signing in during `reload-seed`.

## PR #53 review fixes

- Acceptance uses one domain rule for the project update and audit. Real PostgreSQL regressions verify CONSTRUCTION → CONSTRUCTION and QUOTE_REVIEW → APPROVED, accepted quote metadata, exact `previousStage`/`newStage` and retry without a second audit. Unit cases cover all eight stages.
- Firm completeness follows the **document language**, independently of the reader's UI language. Each requires its own legal name/address, an eight-digit tax ID and phone. English fields, email and both terms may be empty for a zh-TW issue. Partial Settings saves remain allowed. Preparation and confirmation blockers carry typed missing-field identifiers; the screen names them in the reader's English or Traditional Chinese.
- Integration tests issue a zh-TW document with every English field, email and terms empty; refuse an English issue missing its English legal name; and check that the missing field is named in both reader languages. Rendered Settings form tests verify optional labels and that incomplete fields do not prevent submitting the form.
- PDFs without terms omit the heading; without email they show the phone alone. English/zh-TW issued and draft text tests cover this. Both issued examples were rendered and visually inspected for spacing, totals, glyphs, signatures and footer: [English PDF](evidence/review-no-terms-en.pdf), [English page](evidence/review-no-terms-en.png), [zh-TW PDF](evidence/review-no-terms-zh-TW.pdf), [zh-TW page](evidence/review-no-terms-zh-TW.png).
- The existing migration is byte-for-byte unchanged from the original PR commit `17a4bfc`; no schema or fixture changes are included in this review update.

## Automated verification

- **Full `npm run check`: PASS — 1,096 tests across 107 files, none skipped; formatting, lint, typecheck and the production build pass.** [review-fixes-check.log](evidence/review-fixes-check.log). Node 24.22.3, real disposable localhost PostgreSQL databases and pinned dependencies. Two local workers and a process-scoped sleep inhibitor avoid host process timeouts; no assertion or timeout limit was weakened. The existing Prisma config anonymous-default-export warning remains. The Prisma schema also [validates](evidence/schema.log).
- PostgreSQL tests cover prepare without writes; default language and number; concurrent same-request issuance with exactly one audit event; zero lines/incomplete settings/changed draft/tampered confirmation; immutability through direct database writes; unchanged snapshot after Settings changes; carried basis on revision; Q1/Q2 supersession; expired and future acceptance; role and tenant denials; open-conflict blockers, note requirement, resolution and replay; Home transitions; and fixture reset after issued/accepted records.
- Production dependency audit: **0 vulnerabilities** ([report](evidence/production-audit.json)). The local production trace includes PDFKit and the committed static TTF; hosted packaging is still waiting for Product Director testing.
- Unit/route tests cover bounded input, organization date, signature expiry, PDF text/totals/Traditional Chinese/signatures, repeated snapshot text, long terms, English draft watermark, authorization before rendering, cache/filename headers, bounded preview bodies and rendering failures.
- Existing draft, authority, tenant, evidence, comparison and review-policy tests remain in the full suite. The shared history threshold, authority eligibility and financial calculations have not been relaxed.

## Local browser and PDF evidence

The original PR commit's [local browser report](evidence/browser-verification.json) records 13 passed flow checks and 22 screenshots from the production-build Chrome walkthrough on disposable synthetic PostgreSQL and loopback HTTPS:

- Settings in both languages; new-job field errors; one/two-price reference rates with no suggestions; immediate Save → Prepare; zero-amount and incomplete-firm blockers.
- Existing conflict panel shows both readings; a required note resolves the conflict and clears its live flag. The owner issues Q1, revises it without replacing it, and issues Q2 to supersede Q1.
- Home Issue/Awaiting client rows; Viewer sees no amounts and receives PDF 404; the project manager has no issue control and records acceptance, moving the job to APPROVED and removing Awaiting client.
- Fresh saved findings and counts are retained on the Home Issue row and the identical sentence appears on Quote. Document language, attention, validity and document-number download filenames were clicked through.
- English/zh-TW desktop screens and a 390px viewport. No page errors; the sole console error is the deliberately requested Viewer PDF 404.
- PDFs were rendered to PNG and inspected for Traditional Chinese glyphs, totals, watermark, signatures, layout and footer. A short quote occupies one A4 portrait page. Browser inspection found an extra footer page and a Save/Prepare refresh race; both were fixed and reverified. A four-page, 120-clause Traditional Chinese draft was inspected, with every page watermarked, no footer overlap, the final clause and both signatures retained. Q1 downloaded again after Settings changes and supersession has identical extracted text. See [PDF checks](evidence/pdf-verification.json). Long-term pagination and repeated snapshot text are also covered in automated tests.

Representative evidence: [Settings](evidence/zh-TW-settings.png), [issue preparation](evidence/zh-TW-prepare-issue.png), [conflict readings](evidence/en-conflict-evidence.png), [Awaiting client](evidence/en-home-awaiting.png), [accepted by PM](evidence/en-accepted-pm.png), [mobile](evidence/zh-TW-prepare-mobile.png), [issued PDF](evidence/issued-q1.pdf), [issued page](evidence/issued-q1-page-1.png), [draft page](evidence/draft-preview-page-1.png).

The browser fixture, sessions, temporary invitation/signing/TLS files and local server were [removed after capture](evidence/local-cleanup.log). No hosted application is involved.

## Not verified

- The full interactive browser walkthrough was not repeated for the review fixes. The original screenshots above are retained as prior evidence; the review adds PostgreSQL, domain, rendered-form and PDF checks plus fresh PDF renderings.

- Hosted acceptance, the hosted migration/seed and the hosted PDF font bundle: waiting for the Product Director on the test site. Keep the pull request in draft.
- Physical printing, a physical phone and browsers other than local desktop Chrome; mobile verification is a 390px viewport.
- Real tenant/customer data; sending documents, stored files, e-signatures, declining quotes, automatic expiry, Excel, discounts, deposits, payment schedules, other taxes or currencies. These remain outside #52.
