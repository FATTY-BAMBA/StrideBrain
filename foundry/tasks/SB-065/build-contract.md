# SB-065 build contract

A. Forward-only QuoteSection/line/discount/site-address schema, seeded units and verification; bounded document input and fixed-point calculations in quote-totals.ts. Preserve existing totals and snapshots.

B. Authorized opening and saving without a comparison; atomic audit/idempotency; reference suggestions with source access; immutable version 2 issue snapshots and revisable versions. Viewer receives structure without financial values. Site address never enters assistant tools or logs.

C. Token-based document editor with Paper/Tabs, seven columns, explicit save/unsaved state, sticky totals, accessible cells, mobile contained scrolling and a settings column. Include issue-review details, nonempty unavailable states, quote number fallback and acceptance confirmation.

D. Render both snapshot schemas without altering version 1 PDF behavior. Inspect bilingual rendered pages, wrapping, section subtotals, remarks, fees, discount, tax and site/client headers.

E. Roll up section lines for category economics; uncategorized items, percentage fees and discount affect overall figures only. Prove seeded comparison/findings/suggestions/Home parity, run npm run check and a three-round paid evaluation. Keep one draft PR; no hosted operations.

Product Director clarification: section selectors use the job's pricing categories and the firm's labels. Several sections may share a category. Category amounts sum only ordinary item lines across the mapped sections; show the suggestion once beside that combined amount, naming that it covers those sections together. Offer Use suggestion only when the category has no lines in any section. Individual scopes remain job attributes.

25 November review: percentage fees remain separate rows and total-block entries; section subtotals sum to the ordinary-item subtotal. Correct new snapshots without rewriting issued snapshots. Quote-list dates use the firm's timezone. Description and row-menu names are distinct. An untyped discount stays empty in a draft and gets its default in the document language. Bound the server action using the measured maximum issue-token envelope; no additional paid evaluation when assistant code is unchanged.
