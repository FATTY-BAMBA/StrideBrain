# SB-032 bounded work contract

## User outcome and current authorization

Deliver reviewable Stage 9 quality evidence for the existing L1 synthetic demo. Current phase creates plans and obtains independent contract review. Product source is frozen at `fec8830398f213e19879eae23e9720ad8563d7b4`; no code repair is currently justified. Contract PASS means ready to execute QA, not release acceptance.

## Objects and workflow

Planning touches only `foundry/tasks/SB-032/`. Later execution creates new evidence there and uses isolated runtime/test databases. Product objects remain Project, Quote/Forecast/Actual/Offer, immutable ComparisonRun/EconomicsEnrichmentRun, exact EvidenceReference, bounded ProposedAction, Action/Audit/Receipt. The approved flow is Home → Projects → Xinyi → comparison → selection/economics → claim/factor/source inspection → explicit internal-review proposal/edit/confirm → receipt → Actions reopen.

Test ready/loading/empty/partial/error/stale/insufficient/conflict/superseded/restricted states, validation, permission/assignee/evidence changes, safe server failures, pending, retry/idempotency and expired sessions. Preserve safe drafts and route/locale/back-forward/refresh state. Do not invent supported data for an abstained or unavailable result.

## Immutable constraints

- Financial authority and quote/forecast/actual/offer labels remain distinct; 2-of-3 lighting abstention and all similarity/sufficiency policies unchanged.
- Authorization/tenant isolation is enforced server-side on every read/write; missing and inaccessible selectors remain non-disclosing.
- Evidence links reconstruct exact allowed field/version/location; freshness blocks new action preparation/confirmation while stored stale results remain inspectable with warning and refresh/re-run affordance.
- Consequential creation requires authorized explicit confirmation and atomic immutable action/audit/receipt; replay cannot duplicate it.
- English and natural Taiwan Chinese preserve object identity, semantic authority, full draft and navigation context; presentation localization must not mutate provenance.
- Preserve F-01 authority, F-02 draft, F-03 terminology, F-04 neutral receipt, F-05 error focus, F-06 stale warnings, F-07 insufficiency mapping, F-08 nested source focus.
- No schema/migration, API/domain policy, auth, external communication, AI/model, deployment or DNS change is authorized by this plan.

## Defect-driven repair decision

Before any later product edit, record scenario ID, exact head/BUILD_ID, locale/persona/device, reproduction, expected contract, observed result, screenshot/trace and severity. Distinguish tooling failure, expired session and unsupported manual evidence from product behavior. Require an independently reviewable reproducible defect, identify the smallest affected files and a regression assertion, then preserve the constraints above. If the fix requires policy/auth/schema/feature scope change, stop and obtain an explicit scope decision. Do not weaken tests or thresholds to pass.

Test-only additions needed to measure existing behavior may be proposed during execution, separately from product repairs; they must not introduce production hooks/backdoors or alter fixtures' accepted business meaning. A missing test or unavailable device is not proof of a product defect.

## Acceptance contract

`computer-qa-plan.yaml` maps execution scenarios to all accepted matrix groups. Every blocking requirement must have its own result and evidence; group coverage does not imply every item passed. Record denominators for flow completion (≥95%), grounded claims (≥95%), citation precision (≥98%), abstention correctness (≥95%), comparable recall (≥95%), top-three reviewer acceptance (≥90%), factor correctness (≥95%). Additionally require exact canonical order/scores, 100% critical locale parity, zero unsupported material claims, critical accessibility/functional failures, unauthorized actions or cross-tenant leaks, and zero critical/high security findings. Percentage targets cannot excuse a failed required path.

Performance uses the accepted budgets in `test-plan.md`, including stricter Stage 8 proposal ≤500ms and confirmation ≤800ms server p95. Missing samples or unsupported human checks remain unverified. All five inherited gates remain unresolved until evidence at their required layer is obtained.

## Review and release

Independent reviewer evaluates plan scope, completeness, inherited gates, reproducibility, safety, quantitative acceptance and honest release boundaries. Record findings and revisions in `independent-contract-review.md`; the author cannot self-approve. Execution then needs independent functional/eval/security and human language/accessibility evidence as appropriate. Final Stage 9 state cannot be READY_FOR_HUMAN from planning alone. Exact deployment smoke and human release approval remain future gates; do not deploy, change Vercel/DNS, mark PR ready or merge as part of this task.
