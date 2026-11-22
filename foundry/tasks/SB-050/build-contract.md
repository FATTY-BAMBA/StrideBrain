# Build contract

## A — Shared domain calculations

- HistoricalEconomicsService exposes the same category quoted-history aggregate without requiring a current quote. The authority service, normalized rates, median/min/max and required-history constant remain shared.
- QUOTE-DRAFT-1.0: one line per stored canonical commercial category (`Project.commercialCategoryIds`); median quoted rate × area, half-up to NT$1,000. Insufficient eligible history has no suggestion. Supplier offers, forecast and actual cost cannot suggest client prices.
- ClosedJobEconomicsService exposes its per-category reconciled actual-minus-quoted differences for the selected past jobs. Cost flags are absent when actuals are unauthorized. Source conflicts are explicit; conflicted sources remain excluded from eligible quoted history.
- Fixed-decimal server totals use one Taiwan business-tax constant (5%). No browser-supplied totals.

## B — Authorized persistence

- Prepare requires the current member's fresh saved comparison and its selection, never reruns ranking and saves nothing.
- Save checks capabilities, tenant, assignment and bounded line input. New quote/version/items, superseding the previous draft, provenance and one audit receipt are committed atomically. Same idempotency key/input/member returns the original receipt; different input is refused.
- EvidenceReference locator/supportedValue JSON will carry per-line provenance and manual entry identity; no new provenance table is planned. Capability constraint changes are forward-only.
- Read-only quote viewers cannot edit; structural access never loads amounts. Every source lookup is authorized again.
- Edits carry recorded basis, sources and calculation date unchanged, without requiring a fresh comparison. Area/scope changes mark affected suggestions out of date; typed amounts remain. New categories have no suggestion.
- Refresh is explicit, requires the current saved comparison, and presents a new suggestion beside the person's amount. It never overwrites an amount without that person's choice. Save audits carried-over versus refreshed basis.
- A basis is visible only if every source behind it is readable by the viewer; otherwise only the amount and a basis-unavailable message are returned.

## C — Experience and verification

- Quote tab uses supplied English/zh-TW wording and existing evidence panel. Rates display half-up whole-dollar values, areas omit fractional trailing zeros, and each amount input has the shared formatted-money reading beside it. Stored values remain exact. New descriptions store each language’s category label; a typed edit changes only the viewed language. Saves show version and compare-again link; Discovery/Design offer explicit stage update after first save.
- Home order: Confirm review, Review quote, Draft quote, Compare with past jobs. Draft quote requires quote:draft, an active Discovery/Design/Quote review job, a completed comparison and no quote version.
- Additional-finding count uses exactly the comparison page's visible finding set, including its overall lines. Home, overview and Quote share an exact decimal money formatter.
- Run Node 24 npm run check, local PostgreSQL tests and local production browser flows. Record verified and not verified. Agents never deploy/migrate/seed/change hosted resources. Hosted acceptance waits for the Product Director; PR stays draft.

## Storage and compatibility details

- Preparation is a read-only, domain-separated HMAC snapshot bound to organization, member, job, base quote version and the accepted comparison fingerprints. It expires after one hour. Save verifies it and current access; it does not run the price policy again. Carry-over reads the recorded basis inside the save transaction.
- `EvidenceReference.supportedValue.quoteDraft` stores the recorded basis and manual-entry actor. Normal economics and evidence reads strip this reserved metadata; only the quote read model returns it after authorizing every underlying source. Actual-cost flags also require actual access to the active job.
- Serializable transactions retry conflicts, check the previous version and return the stored audit receipt for a matching retry. Changed-line audit IDs refer to the new quote items, with category IDs alongside them.
- Category lines have quantity 1 lot. Amount input therefore uses the tighter existing `unitPrice Decimal(20,6)` range: at most 14 integer digits and two decimal places. Totals fit the existing `Decimal(20,2)` columns. Descriptions are bounded to 500 characters.
- Line IDs, baseline input, validation and required-category checks use the job’s commercial categories. Both demolition and partitions/ceilings produce one `DEMOLITION_CEILING` line. The inverse of the existing creation mapping identifies covered scopes: partial coverage retains the combined rate/range as a reference, suppresses the suggestion, and names all/included scopes in one computed bilingual sentence. A coverage change marks the recorded basis stale; unrelated scope changes do not.
- Existing quotes with duplicate categories or noncanonical detailed line IDs are displayed faithfully as read-only. The category editor does not merge or split them. Issuing, converting imported quotes and detailed line editing remain outside this issue.
- A removed saved category remains visible with its amount and an out-of-date basis. An added category has no suggestion until explicit refresh. Existing amounts are never silently discarded.
- Home checks saved-comparison freshness for compared active jobs, including Discovery/Design after a save. Review-quote findings remain restricted to Quote review. No ranking or economics is replayed on Home.
