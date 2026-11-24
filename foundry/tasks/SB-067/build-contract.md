# SB-067 build contract

A. Add only derived price data (view/index if needed), no drifting maintained table. Authorize quote amounts and job access in the application and repository. Select only the latest issued/accepted version, item lines only, with source version and firm-local issue date. Test owner, assigned manager, finance, Viewer and other organization. Bound every query and return only needed fields.

B. Bilingual keyboard-operable suggestions after two characters, explicit selection and price-history controls. Selection changes ordinary editor input only; server totals, validation, audit, idempotency and issuance remain authoritative. Price list under Quotes, searchable, read-only, 50 rows/page. Exact normalized item/unit identity, no fuzzy/AI matching.

C. Independent comparison state/loading/error in a side panel. Reuse saved-result permission and source fingerprints. Explicit Run/Refresh use existing authorized, audited comparison and economics services; never run on page load or save. Saved findings retain their exact shared sentences. Category reference amounts aggregate all mapped sections and appear once. The full comparison tab stays. A job without a quote is offered Draft quote on Home.

Verification: npm run check with isolated local PostgreSQL, role/tenant tests, relevant component tests and local visual evidence where tools permit. Preserve seeded findings/Home figures except the explicitly changed no-quote action. No model calls or paid evaluation in #67. Hosted acceptance waits for the Product Director; keep PR draft.

Product Director decisions: suggestions show the newest readable price, identical to the price list. Same-client history affects ordering only; if the client’s last price differs, also show its price/date/source, while choosing still fills the newest price. Times quoted counts distinct quotes. History deduplicates identical prices within each quote but keeps different prices, and the last line in document order determines that quote’s last price.
