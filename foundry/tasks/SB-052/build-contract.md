# Build contract

- Delivery follows A → B → C from issue #52. All reads/writes use the trusted tenant/member context and capabilities; no model or feature-level data-mode branch.
- Prepare is read-only and binds the current draft, document settings, client/job data and chosen language/validity/attention/terms in a signed confirmation. Issue rechecks inside a serializable transaction. Browser totals, number, snapshot and issuer are never accepted.
- Issue numbers count issued versions per job; issuing, revision, acceptance, settings changes and conflict resolution write atomic idempotent audit receipts. Revision preserves the issued version until the revision is issued.
- Issued lines, money, document metadata and snapshot are immutable in PostgreSQL. Only lifecycle transitions, supersession and acceptance metadata may change. Synthetic reset temporarily disables/re-enables these triggers in its existing owner-only transaction.
- PDF reads the issued snapshot only, embeds a committed licensed static TTF, uses A4 portrait, and returns private/no-store. Draft preview uses the same snapshot renderer with a watermark. Exact decimal formatting and existing tax totals remain authoritative.
- Home priority: Confirm review, Review quote (cannot issue), Issue quote, Awaiting client, Draft quote, Compare. One decision per job. Issue rows preserve available finding sentences/counts; the Quote screen summarizes findings before issue.
- One or two eligible quoted prices are reference-only, never suggestions. New-job errors clear for the edited field; the code hint states the accepted alphabet. Test-site docs prohibit sign-in during reload-seed.
- Verification includes real disposable local PostgreSQL, role/tenant denials, replay/concurrency, database immutability, PDF text and rendered zh-TW, and browser flows. Hosted acceptance waits for the Product Director; PR remains draft.
