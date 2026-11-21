# Build contract

## A — Claim identity and compatibility

- New economics claim keys have no job-name prefix. Category claims carry categoryId; runtime consumers select kind/categoryId, never decode keys.
- Add nullable categoryId and originalClaimKey metadata to ComparisonClaim. The forward-only migration renames prefixed ComparisonClaim and EvidenceReference keys and records original ComparisonClaim keys. Category metadata is backfilled by matching known claim kinds against the owning snapshot's explicit category IDs. Abort on ambiguous/unmatched category identity or unique-key collisions.
- Preserve immutable EconomicsEnrichmentRun snapshots, ProposedAction/Action content, AuditEvent, InternalReviewReceipt, all row IDs and evidenceReferenceIds. Historical snapshot claim/bundle keys remain historical link targets. The authorized read adapter attaches migrated category metadata without changing the stored snapshot or old link identity. New runs use neutral keys; old prepared proposals must pass unchanged freshness checks and the new review policy.
- Verify a populated upgrade and evidence opening from a receipt prepared before migration. No disabled immutability triggers or relaxed evidence checks.

## B — Job-specific findings

- Add a second active synthetic job with a quote and non-stone/non-lighting variances. Do not tune existing fixture figures.
- Comparison synthesis, category rows and recommendations iterate actual categories and semantic claims. Use existing variance direction/alignment and display formatting; no new financial calculations.
- Home loads the authorized stored comparison/economics selection used by the comparison screen, with real ranked names/scores. Before comparison show a linked empty state. Without a quote explain why cost findings are unavailable.
- STRUCTURAL_ONLY shows no financial amounts/percentages. Data-mode metadata only controls the synthetic-data notice.

## C — Review, chat and wording

- Bump the internal review policy. Select out-of-range category variance, insufficient actual history and programme claims when present, retaining exact-source, conflict and supersession checks.
- Typed no-quote and nothing-to-review outcomes; bounded bilingual category-aware titles/rationales. Preserve old receipt access.
- Existing Home chat intents use active-job claims; absent categories get a plain no-record reply. No new intent routing scope.
- Organization/project wording comes from trusted context. Add the specified src guard (preview-session exemption only).

## Verification

Run npm run check with isolated PostgreSQL, migration/fixture checks, both languages, both synthetic quoted jobs and one screen-created unquoted job. Verify denied Viewer/financial access, Home/comparison agreement, source evidence and receipt compatibility. Record old 18%/9%/7% Home values versus computed values without fixture adjustment. Hosted acceptance is separate from local verification.
