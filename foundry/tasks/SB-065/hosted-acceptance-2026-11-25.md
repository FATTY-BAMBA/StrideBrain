# PR #74 hosted acceptance continuation — 25 November 2026

Target: test-site commit `7a306fc06336065a0b6c091092484397b9b13b54`, owner 陳柏宇. PR remains draft. No application code, deployment, migration, seed, hosted settings or hosted records were changed during this continuation.

## Reported passed by the Product Director

Legacy drafts, totals arithmetic, saving, issuing, preservation of the old PDF, quote-list numbers, and acceptance confirmation. These are the user's reported results; they were not independently repeated during this continuation.

## Still pending on the test site

- Quote on a job with no comparison.
- Two sections sharing a pricing category: one combined reference, combined amount and Use suggestion hidden whenever either section has a line.
- Issue review with populated client details and site address, matching the printed document.
- Revise an issued quote and edit/save its new draft.
- 6.23 坪 × NT$3,200 = NT$19,936, with the supplied remark, then remove the example line.
- PDF visual inspection.
- 390px layout; keyboard; English; Viewer.

This chat has no browser/computer-control tool connected to the existing signed-in session. The remaining hosted checks were not attempted. Earlier local evidence does not count as hosted acceptance. Resume these checks in the browser-enabled chat or after browser control becomes available here; do not put the invitation code in chat.

## Confirmed code findings at the target commit

These findings describe `7a306fc`. The subsequent five-change review and local fixes are recorded in [verification.md](verification.md#review-fixes--25-november-2026); this historical note does not claim a hosted retest.

1. **Quote-list date uses UTC.** `src/repositories/prisma/prisma-quote-list-repository.ts:96` converts timestamps to ISO UTC; `src/components/quotes/quote-list-table.tsx:46` slices the first ten characters. A timestamp such as `2026-11-24T16:30:00Z` is shown as 24 November even though it is 25 November in Taipei. The display should format in the organization's timezone. A midnight-boundary regression test should cover issued and draft rows.
2. **Duplicate accessible name.** `src/components/quote-document/quote-document-editor.tsx:545` assigns the row-menu summary the same `Item / 項目 N.N` name as the description textarea at line 584. Give the row menu its own bilingual action name and retain the item's name for the description. Verify both accessible names and keyboard behavior.
3. **4 MB limit — measured rationale and limit of the evidence.** `next.config.ts:8` raises the global server-action limit to 4 MiB. The existing 30-section/300-line stress fixture uses 500-character CJK descriptions, 200-character remarks, 10,000-character terms, one ordinary item and 299 percentage lines. Running it through the real local repositories, signing codec and installed React `encodeReply` produced:

   | Payload | Bytes |
   | --- | ---: |
   | Save action body | 652,571 |
   | Issue preparation JSON | 1,682,437 |
   | Signed issue token | 2,243,294 |
   | Issue action body | 2,243,436 |
   | Next default limit | 1,048,576 |
   | Configured limit | 4,194,304 |

   The issue action exceeds 1 MiB and 2 MiB because its signed, base64url-encoded preparation includes the document snapshot, legacy lines and fee summaries. Increasing the limit is necessary for this supported fixture. **This measurement does not establish that 4 MiB is the minimum:** 3 MiB also fits the measured request and the 2,500,000-character ASCII token cap plus the small issue-action envelope. Four MiB is conservative headroom, applied globally; a measured lower cap or a server-held preparation with a short reference would be narrower. This continuation does not change the chosen implementation.

   [Exact measurement](evidence/hosted-review-payload-size.json). One targeted local test passed, including save, sign, issue and revise. It used an isolated local database and recorded only byte counts, not document bodies or secrets. No hosted HTTP size-boundary test was performed, and the fixture is not a proof of the maximum across every allowed field combination.
