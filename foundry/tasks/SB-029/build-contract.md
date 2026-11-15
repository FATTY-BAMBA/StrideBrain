# SB-029 implementation contract

Status: READY_FOR_CONTRACT_REVIEW; not accepted for build until independent review and orchestrator acceptance are recorded. Architecture owner: Product and Technical Architect. Builder and final Reviewer must be different agents.

## Outcome and source precedence

Implement GitHub Issue #29 only: one explicitly confirmed, evidence-linked, idempotent internal review Action from the existing immutable Stage 4/5 pair, with durable audit/receipt and Project Workspace integration. Follow `architecture.md`, Issue #29, its governing documents and actual merged code at `0ecd65bdb0ae752f3244960d6848a74a30d5da01`. No Stage 9 expansion or completed-stage rewrite. Follow `research.md` for verified seam hazards.

## Chosen decisions for independent acceptance

1. Extend existing ProposedAction/Action/AuditEvent; store versioned immutable authorized evidence snapshot plus exact IDs instead of adding duplicate ActionEvidence semantics.
2. Add durable receipt/idempotency table with unique organization+key/proposal/action constraints and unique Action organization+proposal constraint.
3. Validate full current source state using capture-only existing Stage 4/5 deterministic services with original run time/IDs; supplement historical fingerprints with complete exact evidence-binding hash and current wall-clock freshness checks.
4. Confirmation uses source-table SHARE locks before authoritative reread, proposal FOR UPDATE and atomic commit at READ COMMITTED; no unchecked validation/write gap. Global contention is an explicit controlled-demo limitation.
5. Current signed session is reloaded inside transaction via a server-only verified session selector; no browser authority fields.
6. Existing assignment semantics, including Financial Reviewer, are retained. Assignee defaults prefer an eligible Financial Reviewer, then eligible proposer, then unassigned. No-assign capability permits exactly stored policy default only.
7. Title and rationale intent have visible, server-enforced finite localized wording alternatives. Locked structured facts/warnings are immutable separate fields. No claimed semantic guarantee from a phrase blacklist. Exact alternatives/limits are in architecture §5.
8. Proposal TTL 30 minutes; suggested due date +7 organization-local calendar days; optional date limited to today…today+365 at confirmation. `Asia/Taipei` for fixture; no browser timezone authority.
9. New Stage 8 receipt/list reads replace insufficient Stage 3 non-Viewer-only action summary gate in production composition; enforce current evidence authorization before sensitive titles/counts.
10. Audit UPDATE/DELETE rejection below application layer; operator-only transactional synthetic reset can explicitly disable/re-enable the named trigger. No application/API bypass. Ordinary rollback preserves records.

## DTO and endpoint contract

Use `internal-review-proposal.v1`, `internal-review-command.v1`, `action-receipt.v1` and `internal-review-action-list.v1` public version tags. A proposal exposes business-safe key/project/run references, bilingual-localized title/rationale intent options and chosen defaults, locked localized mandatory statements/warnings, opaque authorized assignee options/default, date bounds/default/expiry, authorized claim navigation links, server-issued confirmation UUID and validated return state. It never exposes raw evidence/organization/member-role IDs or fingerprints. Internal snapshots contain those exact audit/freshness facts server-side.

Concrete route adapters:

| Method | Route | Behavior |
|---|---|---|
| POST | `/api/actions/internal-review/proposals` | Validate run/project/locale/return selectors, fresh signed context, prepare/reopen one proposal. |
| GET | `/api/actions/internal-review/proposals/[proposalKey]` | Current-authorized proposal reopen; no business write. |
| POST | `/api/actions/internal-review` | Explicit confirmation command; atomically create or replay receipt. |
| GET | `/api/actions/[actionKey]` | Current-authorized durable receipt; no mutation. |

Thin equivalent server-action adapters may be used by UI but must call these same application services/security guards and be covered by direct-path denial tests. POST validates same-origin/Origin, body limit and exact bounded input; all private responses no-store. No cookie values in URLs/logs.

Review lives on `/{locale}/projects/{projectKey}/compare?...&proposal={key}`. Receipt can live there with `action={key}` and be reopened at `/{locale}/projects/{projectKey}/actions?action={key}`. Persist/restore `run`, `economics`, `selected`, every validated Stage 7 evidence selector and safe trigger return key. Do not accept arbitrary `returnTo` URLs. Locale switch changes localized view, not action identity/idempotency payload.

Proposal outcomes: PREPARED, PROPOSAL_UNAVAILABLE, PROPOSAL_EXPIRED, PROPOSAL_STALE, PROPOSAL_NOT_AUTHORIZED, PROPOSAL_FAILED. Confirmation outcomes: CREATED, IDEMPOTENT_REPLAY, ACTION_NOT_AUTHORIZED, ASSIGNEE_UNAVAILABLE, EVIDENCE_UNAVAILABLE, STALE_COMPARISON, PROPOSAL_EXPIRED, PROPOSAL_ALREADY_CONSUMED, IDEMPOTENCY_CONFLICT, ACTION_CREATE_FAILED, plus bounded field-validation errors for authorized input. No outcome contains hidden object existence/count details. Reopen unavailable can use neutral ACTION_NOT_AUTHORIZED/UNAVAILABLE; internal trace reason is not returned.

## Work packages and ownership boundaries

### A. Foundation and persistence

- Add additive `0008` migration, Prisma models/relations/indexes/checks and SQL invariant verifier.
- Scope all linked objects by organization; reject cross-tenant relationships at database boundary.
- Add immutable evidence/action snapshots, append-only audit enforcement and durable receipt uniqueness.
- Do not change Stage 4/5 immutable storage semantics or enrichment cardinality.
- Update fixture reset safely for append-only audit; no fake pre-created successful action is required.

### B. Domain and application

- Implement deterministic claim selection and verified statement creation; canonical fixture title/facts derive from data.
- Implement visible finite wording edits, date and assignee policy, original/final audit fields.
- Implement preparation/reopen, exact current freshness/evidence verifier, transactional confirm, authorized receipt/list.
- Include trusted identity refresh under source locks and all idempotency replay ordering from architecture §8.
- Expose safe operator trace codes/request IDs for denies/failures; no raw fields in user-facing failures.

### C. Presentation and integration

- Replace disabled Stage 8 entry with explicit authorized entry.
- Build bilingual review sheet, validation states, immutable findings/warnings, evidence inspection and accessible assignee/date controls.
- Build durable receipt and real authorized Project Actions/Overview integration.
- Preserve route/locale/selection/evidence context, edit choice across locale switch, focus and cancel restoration.
- Never create optimistic fake business records; receipt requires committed service success.

### D. Validation and evidence

- Builder tests implementation; independent Test/Evaluation reruns actual commands and adversarial DB checks.
- Provide exact-head CI link, migration/rollback notes, measured serial/concurrent p50/p95/query counts, production audit and stage-regression results.
- Prepare isolated synthetic preview/session operator setup; do not alter Vercel/DNS/live domain.
- Keep computer-qa-plan.yaml accurate; computer-qa-report.json NOT_RUN until actual browser evidence.
- Keep draft PR linked to #29. Builder commits/pushes progress; no merge.

## Acceptance mapping

| Contract | Required proof |
|---|---|
| Canonical deterministic proposal | Real seeded PM/Estimator pipeline reopens immutable pair, obtains exact title, imported-stone forecast/actual and lighting quoted variances, 2/3 lighting warning, unquantified programme; no model. |
| Roles and tenant non-disclosure | Mei, assigned Financial Reviewer and Admin succeed; Viewer proposal/direct-create denied before sensitive repository calls; explicit grants/denials honored; foreign project/run/enrichment/proposal/assignee/action/evidence are neutral/no writes. |
| Bounded edits | Each authorized alternate works in both locales; arbitrary/injected/numeric/authority/causation wording rejected; mandatory structured statements remain exact; original/final audit distinguish edits. |
| Source freshness | Mutate quote/version/project/candidate set/run source-input-permission-result hashes/economics structural-result hashes/source authority/conflict/freshness/supersession/locator/value/classification. Prepare and confirm fail safely without Action. |
| Permissions and assignees | Capability downgrade/session expiry/revocation/person inactive/project assignment removal denies; candidate eligibility/source access changes fail; no-assign cannot choose arbitrary candidate; hidden names/counts absent. |
| Proposal lifetime | Expired at boundary denies; consumed with wrong key denies; repeated proposal opens return one stable preparatory identity; correct committed retry remains same receipt. |
| Idempotency | Same key/payload returns same action/receipt; same key/different payload rejects; concurrent same-key requests create exactly one Action/audit/receipt; concurrent different-key attempts cannot consume twice. |
| Atomicity | Inject after each Action/evidence, audit, consumption, receipt-before-commit step; verify no partial rows and PREPARED remains; real PostgreSQL rollback proof. |
| Linearization | Writer before source lock is observed/rejected; writer after lock waits until action commit; source phantom insert scenarios include quote/conflict/grant; bounded lock timeout returns safe failure. |
| Audit | Reconstruct actor/org/project/proposal/action/runs/policies/claims/evidence/original+final edits/assignee/date/request/correlation/key/time/result; direct UPDATE/DELETE rejected. |
| Receipt/workspace | Same durable key reopens, current authorization applied before titles/counts; authorized action appears in Actions and Overview; failure never appears; future stale source does not erase already-created receipt while denied access still hides it. |
| Safe technical rollback | Disable proposal/create UI and POST paths while retaining verified authorized/fail-closed Action reads. Against retained Stage 8 rows, capability/source downgrades reveal no titles, keys, counts or receipt details; no new Action is created; schema, immutable evidence/audit/receipt history and guards remain intact. Unmodified Stage 7 is not an acceptable rollback target. |
| Routes and HTTP | All route selectors bounded/rebound; malicious return URL ignored/rejected; no business mutation on GET; direct unauthenticated/Viewer/cross-origin POST safe; refresh/back/forward no duplicate. |
| Bilingual/a11y | EN/zh-TW parity; no English plumbing; locale-switch retains chosen intent; keyboard labels/errors/focus/cancel/receipt/mobile full-height/reduced motion; actual browser evidence. |
| Boundaries and performance | No UI Prisma/domain authority/model writes; one bounded evidence batch and assignee batch, no N+1; seeded proposal p95 ≤500ms, confirmation p95 ≤800ms excluding network, serial and concurrent results recorded. |
| Regression and migration | Format/lint/strict TS/Prisma validate+generate/clean DB migrations/repeat fixture+SQL invariants/unit+repository+integration/localization/production build/audit all pass; Stage 0–7 regressions remain green. |

## Rollback, limits and gates

Safe technical rollback disables or reverts proposal preparation and Action creation UI/POST paths while retaining the current authorized/fail-closed Overview, Actions and receipt read boundary, or a separately verified secure backport. Preserve additive schema, committed Action/evidence/audit/receipt history, uniqueness constraints and immutability triggers; no destructive migration reversal or record deletion. Unmodified Stage 7 is prohibited as a rollback target once Stage 8 Actions exist: its non-Viewer-only workspace reader would expose retained sensitive Action titles after a capability/evidence downgrade. Validate the rollback revision against those downgrade cases and disabled direct mutation paths before use. Disposable synthetic preview reset is explicitly separate from operational rollback and requires trigger-enabled verification afterward; it does not prove safe preservation of existing Action history.

Known baseline limitation: only one economics enrichment per comparison is supported by the current schema; Stage 8 does not change that cardinality. Known Stage 8 design limit: finite review-purpose wording rather than arbitrary prose; conservative source-table locks serialize source writers across tenants and need replacement with a reviewed narrower concurrency protocol before broad production scaling. L1 signed synthetic sessions only; no production identity/readiness claim.

Independent reviewer must evaluate the above choices before Builder begins product implementation. Record verdict and exact artifact/head in independent-review.md; orchestrator records READY_FOR_BUILD. Any policy conflict, weakened authorization/evidence rule, new business-write type or destructive migration escalates instead of silently changing this contract. Build completion does not imply browser QA, merge or release readiness.
