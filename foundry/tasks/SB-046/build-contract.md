# Build contract

## A — Read model

- `GetHomeDesk` uses one Home repository port plus the existing freshness-checked saved-comparison service. It checks organization, project assignment and capabilities before exposing records. The port's decision-source method is the extension point for later shipped workflows.
- Fixed ordering: Confirm review, Review quote, Compare with past jobs; then job business key; then proposal key. One quote-review item per job uses the first category claim in stable category/kind/key order. Each prepared, unexpired proposal belongs to its preparing member and is independently authorized again when opened/confirmed.
- Home never runs comparison ranking or historical economics. A saved run must satisfy the existing viewer-permission and current-job fingerprint checks. Stale/unavailable findings remain explicit; a saved but stale comparison is not presented as never compared.
- Latest three completed jobs with non-superseded reconciled actuals, ordered by completion date descending then business key. Read only amounts the viewer can access. Economics domain validates authority, reconciliation and evidence, aggregates category amounts with fixed decimals, and chooses greatest actual-minus-quote difference (category key breaks ties). Missing categories are not invented as zero.
- No schema/fixture changes are required. Every amount and lesson retains source EvidenceReference ids. No financial arithmetic in components.

## B — Experience

- The single display mapping groups existing stages as Inquiry, Quote, Confirmed, Work, Closed. Projects validates `group`; no active tile on Home. Counts use the identical authorized project list.
- At most five decisions on Home; full count links to a complete decision-list route using the same use case. Empty firm has a sentence and an authorized New job action. Viewer has no create action.
- Existing chat action/intent behavior stays unchanged; its entry becomes one labelled line with Ask/提問 and the cross-job example. No suggestion chips or current-project panel.
- Sidebar account names come from the trusted member and organization. Language, Settings and Sign out live there on all signed-in screens; language remains visible at sign-in. A bounded, persistent locale preference restores the choice on entry without changing authority.
- Shared finding sentences remain shared; zh-TW recommendation uses fullwidth punctuation.

## C — Verification

Normal, Viewer, structural-only, cross-organization, empty, overflow, filtering, freshness, failed reads, closed-job economics/evidence and account/locale coverage. Run Node 24 `npm run check`, local production browser clickthrough and screenshots. Report limitations honestly. Hosted acceptance is waiting for the Product Director; keep PR draft. Agents never deploy, migrate, seed or change settings on hosted projects/databases.
