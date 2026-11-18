# Stage 9 rollback and reseed rehearsal

Status: planned, NOT_EXECUTED. This document does not authorize touching a deployed environment or a historical QA database. Use new, explicitly disposable, synthetic-only PostgreSQL for rehearsals; retain browser-run history separately.

## Preflight and separation

1. Record exact code SHA, BUILD_ID, runtime version, eight migration checksums, database identity and owner in a private ledger. Publish safe aliases/hashes only. Confirm both expected synthetic tenants and no real data, unrelated sessions or operator activity.
2. Identify every process using that database. Stop the owned preview before any reset and prevent new connections from that preview. Do not stop unrelated previews or reuse their databases.
3. Before a destructive rehearsal, create an access-controlled backup of the disposable DB and verify restore into another disposable DB. Record schema/history counts and hashes. Never put dumps, credentials or connection strings in git/evidence.
4. Keep two paths separate: a **disposable reset rehearsal** may intentionally delete its own synthetic history; **retained-history containment/rollback** must preserve all existing Action/Audit/Receipt/Proposal/comparison history. Browser cleanup always follows the latter preservation rule.

## Clean migration and seed rehearsal

On a brand-new disposable DB, run `npm run db:migrate`, `npm run db:seed`, `npm run db:verify`, then seed/verify again. Record all eight migrations and canonical scores/economics/relations. `db:reset-fixture` is migrate+seed+verify, not a harmless refresh.

Read `prisma/fixtures/horizon-atelier.sql` before running: it validates the two named synthetic tenants, locks Organization then action history tables, disables four immutable triggers inside one transaction, deletes fixture history, recreates the fixtures and re-enables guards. This is an existing owner-only reset, not a new product bypass. Never run it against retained QA history, arbitrary tenants or a live service.

Verify all four guards enabled with expected function hashes after repeat seed, and owner reset failure rolls back trigger state and prior rows. In a separate disposable clone, simulate a controlled seed failure within the transaction and verify no partial reset; test mixed/non-synthetic tenant refusal. Use existing adversarial harness where available, not edits to committed seed files. Preserve unrelated-tenant snapshots. Verify migration failure is surfaced and stops promotion; do not force migration completion or edit recorded checksums.

## Retained-history containment and application rollback

There is no assumed global feature flag. Rehearse existing capability DENY for `action:internal-review:propose` and `action:internal-review:create` on every active synthetic membership, using a ledger-backed administrative DB operation in the isolated rehearsal only. Preserve each pre-existing grant exactly for restoration. Keep needed read capabilities. Verify direct proposal/confirm requests fail closed for existing and new sessions, including a previously prepared proposal; verify authorized receipt, Actions and Overview readers stay safe and cross-tenant readers stay unavailable. Capability changes are an operator rehearsal, not an authorization-policy code change. Do not change a deployed account without separate authorization.

If existing controls cannot reliably contain writes across all principals/in-flight requests, stop the owned preview and revoke its sessions; do not advertise read-only continuity. Record how transactions already in flight are drained/checked and verify no partial action/audit/receipt state.

Only roll application code to a reviewed commit that retains Stage 8 fail-closed readers and immutable-record compatibility, or a separately reviewed security backport. **Unmodified Stage 7 is not a safe rollback target with retained Stage 8 actions**, because legacy readers may disclose titles. A production/preview rollback target must be explicitly identified and tested later; no hosted promotion/rollback occurs now.

Do not down-migrate/delete Stage 8 tables, disable immutable guards, rewrite old proposals/actions, or replay confirmation as a recovery shortcut. Preserve audit/receipt and idempotency semantics. Re-enable writes only after exact restored grant comparison and explicit operator decision on the isolated rehearsal. Recheck authorized/denied readers and no duplicate receipts.

## Browser-run cleanup and evidence

Restore every mutable fixture via its exact pre-change value/hash; verify no concurrent change before restoring. Never restore entire old tables over new history. Revoke all ledger-owned QA sessions; prove zero active owned sessions without issuing a new authenticated browser request. Stop bootstrap listeners, close owned QA tabs/processes as appropriate, restore original zoom/motion, and leave unrelated sessions/settings untouched.

Compare original fixture/history row hashes, current migration checksums and guard/function definitions. Retain intentional new comparison/economics/proposal/action/audit/receipt history with counts and safe identifiers. Record failures separately from browser observations, including exact sanitized endpoint and whether revocation preceded cleanup errors.

Closure artifacts: rehearsal commands/exit codes; safe DB identity; backup/restore verification; migration/guard proof; reset/refusal/rollback evidence; capability containment/read checks; fixture restoration; session revocation; settings restoration; retained-history inventory; sanitizer and SHA256 manifest. Any failed restoration or weakened guard blocks completion. Private dumps and credentials remain outside evidence.
