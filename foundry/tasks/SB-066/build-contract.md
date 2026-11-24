# SB-066 build contract

- Capabilities precede reads/writes; trusted organization and membership only. Owner/manager client changes, finance client reads, Viewer project client names only. Only owner changes firm lists.
- Every new table is tenant scoped, has compound unique [id, organizationId], bounded fields, indexes, and safe forward-only migration/seed. No existing migration changes.
- Client contact details stay out of assistant tools, prompts and logs. Every person-made change is audited atomically, with idempotent retries.
- Stable list keys preserve stored meaning; inactive entries remain readable on existing records. Labels and options come from firm data, client types remain the fixed three.
- Store areas in m2; exact 400/121 conversion, entry in firm preference, display rounded to two decimals. Never relabel numeric rates when units change.
- Preserve every seeded ranking, score, claim and finding sentence. Pin before changes and stop/ask if a difference is found.
- Newly issued documents snapshot client contact/address/tax fields; old issued snapshots/PDF content remain unchanged.
- Preserve all assistant permission, grounding, privacy, metering and evaluation gates. No live calls in CI; paid evaluation maximum two dispatches, reports and costs retained.
- Hosted acceptance is waiting for the Product Director. Keep the sole PR in draft.

Confirmed decisions are recorded in inventory.md: lock used pricing mappings; keep pricing-only parents hidden from scopes; one Quotes row per quote using issued/accepted amounts, with a draft-revision marker.

PR #68 review corrections:

- The selected quote version retains its own DRAFT, INTERNAL_REVIEW, ISSUED, ACCEPTED or FINAL status; the same five statuses are filterable. Version-selection precedence is unchanged. A newer version other than issued, accepted or superseded marks the issued row as a revision in draft.
- Displayed per-area prices use the firm's area unit across the Quote tab, comparison cells, evidence traces/values and assistant past-price facts. All share the exact 400/121 conversion; canonical stored rates, ranking and claims are unchanged. Existing m² output is preserved. Model-visible facts contain only formatted firm-unit rates, and the displayed-number grounding rule still checks them.
- Use paid evaluation dispatch 2 of 2 after npm run check. No hosted changes; keep the PR draft for Product Director acceptance.
