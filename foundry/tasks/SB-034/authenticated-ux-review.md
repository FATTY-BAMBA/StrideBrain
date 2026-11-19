# SB-034 authenticated UX review

Status: **authenticated visual capture complete; first-slice review checkpoint**. No product-source changes were made during this review. No deployment or merge. The first-60-second success criterion remains **NOT MEASURED with first-time participants**.

## Environment and protected state

- Identifier: `SB034-AUTH-20261119`.
- Isolated database: `stridebrain_sb034_ux_20261119`; separate PostgreSQL 17 cluster/container `stridebrain-sb034-ux-20261119`, bound only to `127.0.0.1:54354` while running.
- Production app ran only on local port 3004 using build `Fj_JGSmdikTqYKo9DsVdl` from the uncommitted SB-034 first slice on baseline `19c98f799de43876e6eea83fd9d336518476fe0a`.
- Fresh private owner/app credentials; the app role has no superuser, database creation, role creation or RLS bypass privileges. Credentials are outside the repository in a mode-0700 private runtime directory; no secrets are in this report.
- Loaded unchanged repository migrations and canonical Horizon Atelier synthetic fixtures into the new cluster. No Stage 9 database connection, copy query or write was needed. No remote database was accessed.
- Stage 9 QA data remained untouched by this work. All 2,268 recorded protected file hashes match, including SB-032 evidence, SB-029 Prisma fixtures and SB-034 product source/schema. This is a no-access isolation statement and file-hash check, not a new query or certification of historical Stage 9 database contents.
- The normal DemoSession service issued a temporary synthetic Mei session. The local one-use operator handoff set the existing signed HttpOnly session cookie; no product authorization/session controls were weakened or changed.

## Captures and minimum state

[Capture matrix and all screenshots](evidence/authenticated/README.md): **54 authenticated images plus 1 post-revocation access check**. Captures cover Home, Projects, Xinyi workspace, Knowledge, StrideBrain, comparison, findings, evidence, source detail and review in en/zh-TW at 1440×900 and 390×844. Additional screenshots show task destinations, mobile task lists and review confirmation controls.

The zh-TW desktop workspace capture is a scrolled context/attention view. It does not establish that locale's initial desktop fold. Initial workspace fold evidence exists for English desktop and both mobile locales. No additional physical iPhone/Android QA was performed.

Only one comparison result, one economics enrichment and one unconsumed review proposal were created, through existing UI flows, in the isolated database. The same saved result was reused for language/viewport captures. **Actions created: 0. Receipts created: 0.** The form was inspected and cancelled without submission. There was no repeat action-creation/idempotency QA in this pass.

The selected baseline was Neihu Tech Flagship, Zhongshan Lifestyle Store and Nanjing Brand Experience Center. Its visible findings are +7.2% quoted-price variance, +6.0% forecast-versus-actual variance, +18.4% imported-stone forecast-versus-actual variance, +9.4% lighting quoted-price variance, and 2/3 lighting actual observations. These differ from earlier phone captures using another selection. No calculation or source value was changed to match old screenshots.

## First-60-second expert assessment

This was an expert walkthrough using browser tools, with no new participant and no valid human timing sample. It assesses what can be discovered, not whether a first-time designer actually understood it in 60 seconds. No time-saved, comprehension-rate or participant “wow” claim is made.

| Comprehension question | Visible answer and current limit |
|---|---|
| What can StrideBrain do for me? | Home names compare past work, review a quotation, find evidence and use company knowledge. All four fit on desktop. Mobile initially exposes the current project and comparison; the remaining tasks require a scroll. |
| Where do I start? | Open project and Start a comparison are explicit. Projects offers the authorized Xinyi workspace. No dead-end Commercial/Evidence navigation was observed. |
| How does it help my current project? | Xinyi, quote-review stage and 16 weeks are visible. Workspace brings current quote, forecast, comparison and missing-actual attention together. Home's attention is a general missing-record notice, not a prioritized financial finding. |
| How does it use company knowledge? | Comparison shows three named precedents, separates saved baseline names from ranking, and links findings to exact sources with project/version/authority. Knowledge remains a bounded task launcher; it is not freeform company search. |
| How does it help me decide and act? | What needs review leads to See evidence, source detail and the existing internal review form. Financial authority and insufficiency remain explicit. The form requires confirmation and does not itself approve a quote. |

The strongest visible value moment is **a specific cost variance tied to named past projects, with a direct route to its supporting source and an internal review**. This is a credible demonstration of usefulness. It still takes several steps and scrolling; a genuine first-minute outcome should be observed with the planned 3–5 first-time participants.

## Findings and remaining weak spots

1. **P3 — reproducible mobile Projects spacing defect.** At 390×844, the dark navigation area expands to about 290px in English and 280px in zh-TW on the short Projects page. English Home uses about 165px; zh-TW Home about 119px. This produces blank space before the page title. English reload reproduced it, and both languages show it. The project link remains visible and usable; no horizontal overflow was observed (document width 390px). Evidence: `en-projects-mobile.jpg`, `en-projects-mobile-repeat.jpg`, `zh-TW-projects-mobile.jpg`. A narrow mobile shell sizing/alignment correction is justified.
2. **Mobile entry density.** English Knowledge's first task action is below the initial fold; repeated heading/project context and the second navigation row consume space. StrideBrain repeats much of Knowledge. Reducing this repetition could make the supported capabilities easier to scan, but the evidence does not justify inventing new capabilities or another broad product build.
3. **Comparison reading effort.** Closest projects are visible first; one mobile scroll reveals money findings. Long financial-authority headings and separate cards slow scanning. The imported-stone and lighting outcomes are available before the matrix, which is a substantial hierarchy improvement, but the strongest business finding is not in the initial mobile viewport.
4. **Evidence and review density.** Compact Close/Back leaves useful space. Exact source and authority are accessible, with calculation details secondary. Review still repeats findings and places raw run identifiers prominently. The identifiers are traceability information, not credentials, but would be clearer in secondary details.
5. **Home's attention signal is limited.** Missing current actual cost is honest for the active project but offers less immediate business value than the comparison findings. No new financial alerts, counts or latest-run lookup were fabricated.
6. **Unmeasured outcomes.** Knowledge versus StrideBrain differentiation, natural Taiwan wording, first-minute comprehension and a real “wow” response need first-time human observation. Viewport captures do not establish physical-device, VoiceOver or wider release acceptance.

## Is another product change justified?

**One narrow layout follow-up is justified** by the reproduced mobile Projects blank-space defect. Optional density improvements can be considered within the existing first slice, particularly mobile bounded-task entry and secondary placement of run IDs. **A broad additional feature/UX pass is not justified before participant feedback.** No product-source edit was made during this authorized capture review; the build under review remains unchanged.

Independent verdict: **PASS_SCOPED_AUTHENTICATED_VISUAL_REVIEW_WITH_P3_FOLLOW_UP** after inspecting all 54 authenticated screenshots. See [independent UX review](independent-ux-review.md) for its limits.

## Sanitization, session revocation and cleanup

- All 55 images passed OCR credential/private-path scanning, exact private-secret matching, binary/metadata checks and visual inspection. No image required redaction; EXIF entries were absent. Chinese copy was visually inspected; English OCR was used for ASCII credential scanning, not as Chinese linguistic certification.
- Only sanitized viewport captures and non-secret manifests were added to SB-034 evidence. No browser chrome, cookie, bootstrap URL, password or private runtime log was published. No remote publication occurred.
- Temporary session revoked through the unchanged service; final database query confirms **zero unexpired, unrevoked sessions**. Refreshing Projects with the revoked cookie showed no accessible projects. Cookie was then cleared, viewport reset and temporary tab closed.
- Production app process stopped. The isolated PostgreSQL container is **exited**. No listener remains on ports 3004 or 54354.
- One-use bootstrap files and the temporary signing secret were removed. The stopped isolated database is retained privately for reproducibility of this review checkpoint and the mobile Projects finding, pending review acceptance. It is not connected to Stage 9 and has no active session.
- [Final state counts](evidence/authenticated/final-records.json), [protected files](evidence/authenticated/protected-files-verification.json), [sanitization manifest](evidence/authenticated/sanitization-report.json), [cleanup record](evidence/authenticated/cleanup-report.json).

Prior deterministic check/build results remain documented in [implementation-review.md](implementation-review.md). No broad new QA suite or fresh Stage 9 acceptance was run for this visual review.
