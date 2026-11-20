# Issue draft — Daily Digest v0.1 and model wording

Stage 5 of `docs/product/V0_2_WORKFLOW_SLICE.md`. Needs Stage 4 (Work Items) and the decision to lift "external email" and "recurring monitoring" from the deferred list. Copy the text below into a new GitHub issue.

---

## Goal

Each person gets one message each morning listing what is due, late or expiring on their jobs, and sees the same list on Home. Separately, quote lines and flag notes can be worded by a model in the firm's own style. Both are additions: the flow already works without them.

## Scope

1. A digest policy as a pure function in `src/modules/digest/domain/digest-policy.ts`. It turns records into items per person using these rules, with the day counts held as organization settings:

   | Item | Rule |
   | --- | --- |
   | Work due soon | `WorkItem.dueDate` within 3 days, not done |
   | Work late | `WorkItem.dueDate` passed, not done |
   | Supplier offer expiring | `SupplierOffer.validUntil` within 7 days, on an active job |
   | Quote expiring | `QuoteVersion.validUntil` within 7 days, status still `ISSUED` |
   | Open conflicts | `EvidenceConflict` with status `OPEN` on an active job |
   | Quiet jobs | Active job with no change in 14 days |

2. `NotifierPort` with an email adapter. A `DigestDelivery` row, unique on membership, date and channel, so a retry never sends twice.
3. One scheduled route that only the scheduler can call, registered in `vercel.json`. It runs in the organization's `timezone`.
4. Home shows the same digest for the signed-in person, in place of the fixed findings.
5. `WordingPort` behind a feature flag: line descriptions rewritten from the firm's past quotes, and one short note per flag from the structured flag data. Output is checked against the claim ledger as ADR-006 describes. If the check fails, the draft is shown without the notes.
6. Optional and last: a LINE push adapter behind `NotifierPort`, using the Messaging API.

## Security gates

- A digest contains only items the recipient is authorized to read. Authorization is rechecked when the digest is built, not when it was scheduled.
- The email shows job names and counts. Amounts stay inside the product, behind sign-in.
- The scheduled route rejects any caller other than the scheduler.
- The wording model receives only structured, already-authorized data for one quote, and cannot write records.

## Acceptance

- The digest for a seeded person lists a late task and an expiring supplier offer.
- Running the route twice on the same day sends one message per person.
- A person with nothing to act on receives no message.
- A `VIEWER` receives only what a `VIEWER` may read.
- With the wording model switched off or failing, drafts are still complete and issue still works.
- A wording output that introduces an amount or a source not in the ledger is rejected.
- `npm run check` passes.

## Out of scope

Per-person notification preferences beyond on and off, digests by SMS, replies to the digest, and LINE inbound messages.

## Delivery sequence

A. Digest policy and tests.
B. Notifier port, email adapter, delivery uniqueness, scheduled route.
C. Home digest.
D. Wording port and verification, behind a flag.
E. LINE push adapter, if wanted.
