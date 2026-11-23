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

Pending product decisions are listed in inventory.md; do not implement dependent behavior until answered.
