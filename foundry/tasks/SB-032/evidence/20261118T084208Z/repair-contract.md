# S9-F02 / S9-F03 / S9-F04 bounded repair contract

Baseline: 1bde2114d010c694d017ba2b4116ceffab3569e1. Preserve failed run 20261118T050551Z unchanged. No security/performance wave, deployment, PR readiness change or merge.

## Independent decision before implementation

Independent reviewer sb032_entry_classification traced submission, authorized batch, assembly, persistence, route/UI DTO, evidence snapshot and proposal paths. Forward schema change is necessary: the unique EconomicsEnrichmentRun.comparisonRunId disallows a second enrichment; ComparisonClaim uniqueness by organization/comparison/claimKey collides across economics runs. A UI-only change cannot satisfy the accepted immutable A→B→A contract. User permits schema changes only when independent review proves necessity; this decision meets that condition for local repair/test databases, not production migration/deployment.

## Repair

F02: exhaustive typed en/zh-TW workspace (six states) and evidence-health (five states) labels. Preserve enums, authority/state selection and accessible meaning.

F03: client loading boundary reads route locale via useParams; expose localized named status/busy shell, retain visual markup and unchanged motion CSS. Official Next.js loading and useParams contracts: https://nextjs.org/docs/app/api-reference/file-conventions/loading and https://nextjs.org/docs/app/api-reference/functions/use-params.

F04: one structural comparison may own multiple immutable enrichments. Add nullable ComparisonClaim.enrichmentRunId with matching organization/comparison composite FK and enrichment-scoped claim uniqueness; retain partial uniqueness for null structural/legacy claims. Backfill only uniquely attributable snapshot-owned claims, preserving IDs, content, comparison snapshots, enrichment snapshots and action/receipt/history. Reject ambiguity. Do not edit eight historical migrations or disable guards.

Strict submitted cardinality rejects zero and more than three before any truncation/fallback. Unauthorized selected keys must not affect economics; preserve fail-closed server authorization. Canonical selection order is structural ranking, unchanged scores 88/81/79/71/69/63. Persisted economics selectedProjectKeys govern display/route/evidence. Reset local selector on persisted comparison+economics identity change, retaining same-result locale/evidence/draft navigation. Successful transition clears obsolete evidence/proposal route selectors. Preserve exact historical reopen.

No existing economics retry/idempotency policy was found; action-receipt idempotency is separate and unchanged. Input fingerprints remain non-unique. Every accepted intentional transition may create a new immutable run even for previously used keys. UI pending state prevents repeated submission while in flight; concurrent explicit submissions may create separate complete immutable runs, never overwrite/mix history. No global latest pointer or silent rerank is introduced.

## Regression proof

Exhaustive bilingual label rendering and named loading status/unchanged motion CSS. DOM selector transitions with new server props/history. Action submission cardinality, unauthorized/cross-tenant keys, deterministic ordering and exact redirect ID. Real PostgreSQL ABC→AB→AC→ABC→DEF, ABC→AB→ABC, 1/2/3, zero/>3, same-set repeats/concurrency; each result/run/claim bundle/evidence/proposal must match its submitted set. Original comparisons/enrichments/actions/receipts remain unchanged and reopenable. Forward migration tested on fresh schema and a populated pre-migration copy with byte-equal old snapshots.

Full deterministic gate, independent source review, scoped repair commit and targeted real Chrome retest both locales/four sizes before broader browser baseline may resume. Security/performance remains deferred until targeted PASS. Evidence/task records stay local; no push authorized in this wave.
