# SB-029 Stage 8 architecture

Status: reviewable architecture proposal; implementation requires orchestrator acceptance following independent contract review. This document is not evidence that implementation or QA passed.

Baseline: `0ecd65bdb0ae752f3244960d6848a74a30d5da01` (`origin/main`, verified 2026-11-16 Asia/Taipei). Issue: <https://github.com/FATTY-BAMBA/StrideBrain/issues/29>. Policy: `INTERNAL-REVIEW-ACTION-1.0`.

## 1. Governing evidence and reconciliation

Read Issue #29 and its complete governing set: `docs/build/IMPLEMENTATION_SEQUENCE.md` Stage 8; ADR-004; `V0_1_BUILD_CONTRACT.md`; `SHARED_DTO_AND_STATE_CONTRACT.md`; authorization and evidence/authority models; merged Stages 3–7. Supporting sources are ADR-002/003/005/006, repository boundaries, implementation schema, accepted interaction matrix/wireframes, acceptance matrix and `research.md`.

The implementation extends the existing objects, ports, signed identity and comparison-library policy. It does not introduce a second action concept. Issue #29 names precise outcome variants; these refine the older indicative shared DTO aliases (`ALREADY_CREATED`/`STALE` etc.) in a new versioned Stage 8 DTO. Stored proposal status remains existing `PREPARED` then `CONFIRMED`; consumption is not a new business action type.

The merged authorization service requires an active assignment and `canCreateAction` for non-admins, including Financial Reviewer. Admin bypasses assignment, not tenant or capability checks. Retain this actual implementation. The Financial Reviewer fixture already has assignments. The existing one-enrichment-per-comparison database constraint remains unchanged; Stage 8 consumes the actual immutable pair it receives and never repairs or extends Stage 6 selection behavior opportunistically.

## 2. Outcome and boundaries

An authorized comparison opens a deterministic review sheet. Explicit confirmation creates exactly one internal review Action, immutable authorized evidence snapshot, append-only audit event, consumed proposal and durable receipt/idempotency row in one transaction. Project Actions and Overview show only currently authorized actions. Receipt and comparison/evidence links are reopenable.

No model, external communication, financial mutation, quote approval, action lifecycle changes, top-level surface, Vercel/DNS/live-domain changes or real data. Existing structural ranking and financial authority rules remain unchanged. Safe implementation extraction of existing fingerprint functions is permitted; duplicated formulas or fixture-specific service branches are not.

## 3. Modules and service API

- `src/modules/internal-review/domain/`: versioned contracts, proposal policy, bounded edit/date validation, exact mandatory-claim selection, immutable statement assembly.
- `src/modules/internal-review/application/`: prepare/reopen, freshness verification, confirm, receipt/list queries; no Prisma imports.
- `src/repositories/ports/internal-review-repository.ts`: scoped preparatory persistence, current identity/assignee metadata, transactional unit of work, receipt reads, bounded action metadata queries.
- `src/repositories/prisma/prisma-internal-review-repository.ts`: Prisma/SQL mapping, locks, scope predicates, uniqueness, atomic writes; no React imports.
- `src/lib/server/internal-review-services.ts`: server-only composition using existing comparison/economics/evidence adapters bound to the same transaction where necessary.
- route/server adapters validate bounded selectors, request origin and cookie identity, then call services. Presentation receives safe DTOs only.

Public application methods:

```ts
prepare(context, { projectKey, comparisonRunId, enrichmentRunId, locale, returnContext })
reopenProposal(context, proposalKey, locale)
confirm(context, { proposalKey, title, rationale, assigneeKey?, dueDate?, confirmation: true,
                   idempotencyKey, locale })
getReceipt(context, actionKey, locale)
listProjectActions(context, projectKey, locale)
```

`context` comes only from trusted identity resolution. `returnContext` is a bounded object of comparison/enrichment IDs, up to three eligible selected business keys and validated Stage 7 evidence selection/return-trigger key. No arbitrary return URL. Date is a date-only ISO string; null/absence means unassigned/no due date where permitted. Assignee keys are opaque candidate selectors, resolved server-side against the authorized candidate set; browser organization/member-role/capability fields are rejected/ignored as authority.

## 4. Preparatory and committed records

Use existing ProposedAction, Action and AuditEvent tables. Add fields additively; do not reset existing data or change earlier migrations. Legacy rows without the new versioned snapshot remain unavailable to Stage 8 commands rather than acquiring fabricated evidence.

### ProposedAction

Add opaque unique `(organizationId, businessKey)`; enrichment linkage; actor membership/person identity; original bilingual fields and approved edit variants; mandatory rationale fragments and uncertainty warnings; exact ordered claim keys; exact evidence IDs and claim/reference bindings; complete freshness snapshot; comparison/economics result hashes; server-issued random UUID confirmation key; locale/validated return context; preparation identity key; consumption timestamp. Preserve existing type/status/title/rationale/assignee/date/expiry fields. Store structured/bilingual components in a versioned JSON snapshot where that avoids redundant columns. Fields needed for scope, foreign keys and uniqueness remain typed columns.

Required freshness snapshot components are specified in §7, not an opaque hash with unspecified contents. Store policy/calculation versions explicitly in the snapshot. `createdBy=SYSTEM`. The preparing actor is separate from this source enumeration. Original fields never change when the client edits its draft. Preparation timestamps and expiry use the trusted server clock.

One deterministic preparatory identity per organization + actor membership + comparison + enrichment + policy + material input fingerprint. A unique constraint makes repeated/concurrent opens return the same proposal. An unexpired PREPARED proposal reopens. Expired or consumed proposals are not silently reset; a new comparison is needed for a new business intent. Identical confirmation retries use receipt state, not proposal reset.

### Action and immutable evidence snapshot

Add opaque business key; enrichment reference; actor membership reference; assignee membership reference while retaining resolved `assigneePersonId`; versioned bilingual final fields; immutable `evidenceSnapshot`; snapshot schema version. Existing `evidenceReferenceIds` are retained and must equal the union in the snapshot.

Choose the immutable authorized evidence snapshot option explicitly permitted by Issue #29 rather than inventing a competing ActionEvidence relation. Snapshot contains exact claim keys/kinds/values/observation types/authority/warnings, per-claim evidence-reference IDs, exact source subject/version/locator/supported value/classification/authority/freshness/conflicts/supersession/checksum metadata where present, source comparison/enrichment IDs and hashes, and the authorization decision scope at confirmation. It is server-private; no raw source IDs/storage keys are sent to UI. It is never treated as continuing permission to read evidence.

Enforce one Action per `(organizationId, proposedActionId)` with database uniqueness. Scope project/run/enrichment/proposal/actor/assignee relationships with composite organization foreign keys using existing `[id, organizationId]` keys; add narrowly scoped unique tuples where needed to enforce the same run/project pair below application code. Keep `type=INTERNAL_REVIEW`, status `OPEN`; no update API is introduced. Database triggers reject changes to a committed Action's evidence snapshot/lineage and a consumed Proposal's original data. Nullable Stage 8 columns on legacy rows are allowed with contract-version-conditional CHECK constraints; a legacy record is not eligible for Stage 8 without a valid complete snapshot.

### Durable ActionReceipt/idempotency

Add one durable receipt/idempotency table (e.g. `InternalReviewReceipt`) with organization, project, proposal, action, actor membership, key, canonical payload hash and creation timestamp. Its canonical versioned receipt content and validated return context are stored once in immutable `Action.contentSnapshot`, referenced by the receipt row; do not duplicate that JSON unnecessarily. Unique `(organizationId, idempotencyKey)`, `(organizationId, proposedActionId)` and `(organizationId, actionId)` enforce the corresponding invariants. An explicit separate generalized idempotency subsystem is unnecessary.

Receipt snapshot is a durable business record, not a permanently authorized DTO. Every reopen/replay regenerates the current permission-safe view after access checks. Snapshot stores both locales/final variant keys; switching to Chinese does not expose an English creation title or backend policy plumbing. It exposes only action key/title/project, eligible assignee display or unassigned, date, OPEN, created time/by display, comparison/enrichment references, authorized evidence count and validated local links.

### AuditEvent

Create exactly one `INTERNAL_REVIEW_CREATED` event, including actor identity/membership, organization/project, proposal/action business keys, both runs, all policies/calculation versions, exact claim/reference bindings, original and final fields in both locales, assignee/date, request/correlation/idempotency identifiers, payload hash, timestamp and result. No end-user audit payload endpoint is added.

Enforce append-only UPDATE/DELETE rejection in the database for application operation; no update/delete port or HTTP bypass. A deliberate isolated synthetic fixture reset is an operator operation, not application rollback: the seed/reset script verifies that both targeted known fixture tenants are DEMO_SYNTHETIC (or absent), acquires exclusive locks on affected immutable tables, temporarily disables only the named immutability triggers inside its own transaction with owner privileges, resets only those known synthetic tenants using the existing bounded organization deletion, re-enables before commit, and verifies every trigger enabled. No broad TRUNCATE or unknown-tenant deletion. Transaction failure restores trigger state. Normal application code never changes trigger state, SQL roles or a bypass GUC. Preserve audit data on ordinary code rollback.

## 5. Deterministic proposal and bounded edits

Prepare exclusively from verified immutable Stage 5 claims/bundles plus authorized Stage 4 context. Required semantic claims are imported-stone `CATEGORY_FORECAST_ACTUAL_VARIANCE`, lighting `CATEGORY_QUOTED_VARIANCE`, lighting `CATEGORY_ACTUAL_INSUFFICIENT`, and `PROGRAMME_DIFFERENCE_UNQUANTIFIED`. Select by kind and taxonomy category, not named fixture IDs or fixed percentages. Assert one valid claim/bundle for each, exact claim/evidence equality, supported stored numeric values and sufficient imported-stone/quoted evidence; lighting insufficiency is mandatory content, not a blocker. Missing/conflicted/unverifiable mandatory support makes proposal unavailable. Stale supplier history outside these mandatory claims is not reinterpreted as current pricing or a blanket blocker.

Render the percentages/counts/programme range from stored verified claims with existing decimal-formatting semantics. The canonical fixture produces the exact default English title `Validate imported-stone and lighting assumptions for Xinyi quote v3`. Derive the short project label from authorized location district (`Xinyi District` → `Xinyi`) with full authorized project name as fallback, and current quote version from the reopened run; no `if Xinyi` branch. Chinese uses the authorized Chinese project name and quote version.

Mandatory content, stored as immutable separate fields allowed by the shared DTO contract:

1. imported-stone forecast variance relative to eligible reconciled actual history;
2. lighting quoted-price variance relative to eligible quoted history;
3. lighting actual evidence is insufficient, with authorized count/threshold;
4. accelerated programme difference with no evidence supporting a quantified premium;
5. exact comparison/enrichment references;
6. this internal review does not approve/issue the quote or communicate externally, and historical findings do not establish that a quote is wrong or a supplier overcharges.

Arbitrary prose cannot be deterministically proven non-contradictory. v0.1 therefore provides bounded editable review-purpose wording, transparently explained in the form. Use labeled selects or clearly guided equivalent controls; do not present an apparently unrestricted textarea. Both fields are editable through these server-approved localized alternatives, with final full text validated by exact membership in the proposal's stored approved values:

| Field | English | Taiwan Traditional Chinese |
|---|---|---|
| Title default | Validate imported-stone and lighting assumptions for {project} quote v{version} | 檢核{專案}第{版本}版報價的進口石材與照明假設 |
| Title alternative | Review imported-stone and lighting assumptions for {project} quote v{version} | 審查{專案}第{版本}版報價的進口石材與照明假設 |
| Title alternative | Check evidence for imported-stone and lighting assumptions in {project} quote v{version} | 確認{專案}第{版本}版報價之進口石材與照明假設的佐證資料 |
| Rationale default intent | Review these assumptions against the linked evidence before the next internal quotation review. | 下次內部報價審查前，依連結的佐證資料檢核這些假設。 |
| Rationale alternative intent | Check the supporting evidence and record questions for internal review. | 確認佐證資料，並記錄內部審查需要釐清的問題。 |
| Rationale alternative intent | Validate the imported-stone and lighting assumptions using the linked historical evidence. | 依連結的歷史佐證資料，檢核進口石材與照明假設。 |

Title maximum 200 Unicode code points; editable intent maximum 500; complete rationale maximum 8,000 including server-owned fragments. No controls, markup, invented numbers, unsupported claims, arbitrary generated text or client-supplied mandatory statements. The server stores final rationale as chosen intent + original immutable mandatory facts/warnings. The UI explicitly labels editable review wording and locked verified findings. This is an implementation content bound, not a claim that regular expressions understand arbitrary natural language. Original/final variant keys and fully rendered bilingual fields are audited.

## 6. Dates and assignees

These deterministic v0.1 parameter choices make the existing bounded-policy requirement executable; they are reviewable here rather than inherited unstated policy: proposal expires 30 minutes after preparation; default due date is seven calendar days after preparation in organization timezone; date may be cleared or chosen from confirmation-local today through 365 calendar days inclusive. Validate real Gregorian dates, including leap days, using organization timezone (fixture `Asia/Taipei`), never browser UTC offsets. Expiry equality is expired. Revalidate date bounds at confirmation.

Candidate membership/person must be active, same organization, permitted to create internal review under existing AuthorizationService/assignment policy, and able to read every mandatory claim/evidence source under current Stage 5/7 rules. Explicit deny wins. Viewer is never eligible. Batch membership/person/grants/assignments and source ownership/classification metadata, then evaluate pure policy per candidate; no per-assignee financial/evidence query waterfall.

Suggested assignee: first eligible Financial Reviewer by stable membership business selector; otherwise current proposer if eligible; otherwise unassigned. This is a suggestion, not role authority. A creator with `action:assign` can choose any currently eligible candidate or unassigned. Without it, the service permits only the stored default (including unassigned), returns no browsable alternate candidates and rechecks default eligibility at confirmation. Lost/default-ineligible assignment returns `ASSIGNEE_UNAVAILABLE`, never silently substitutes another person. Candidate selectors must be re-resolved under current trusted organization/project.

## 7. Freshness and evidence integrity

Existing Stage 4/5 reopen methods are necessary but insufficient: they do not reconstruct current fingerprints. Stage 8 must validate at preparation and again at confirmation, never auto-refresh and continue.

Reopen both immutable rows under scope before sensitive snapshot reads; require completed statuses, actual project equality, expected schemas and exact run IDs in nested snapshots. Require accepted eligibility/similarity/authority/calculation versions, row/snapshot input/source/permission agreement and `sha256(stage4Result) === economics.structuralResultFingerprint`.

Reconstruct current Stage 4/5 inputs with existing authorized adapters and existing deterministic application/domain functions using the original run snapshot date, original generatedAt and original run IDs. A capture-only persistence port collects the recomputed payload and performs **no database writes**; compare source, input, permission and result hashes with stored originals. This detects new/removed eligible candidates, changed profile inputs, active quote/forecast version, current commercial amounts/authority/supersession/conflict state and changed permissions without duplicating formulas or mutating immutable runs. No model is called. Do not use current wall clock to rewrite the historical result; evaluate actual expiry/freshness separately below.

Persist and compare all of:

- project id/key/status/stage/deletedAt/version (`updatedAt`) and active quote id/key/version;
- Stage 4 eligibility/similarity/calculation versions, source/input/permission hash, entire structured result hash and current candidate set;
- Stage 5 authority/calculation versions, source/input/permission/structural hash, entire economics result hash and exact selected candidate order;
- action-policy version, preparing actor permission fingerprint and original run actor ownership metadata;
- exact mandatory claim values/kinds/warnings/observation types/evidence bindings and authorized evidence snapshot hash;
- per-reference subject/document version/locator/supported value/classification/authority/observation type/effective/stale dates/open conflict identifiers/supersession and checksum where available;
- relevant source owner organization/project and current access predicate;
- proposal status/expiry and assignee current eligibility at confirmation.

Existing Stage 5 source hashing omits some locator/value/classification fields; the comprehensive Stage 8 evidence hash supplements it, not merely repeats it. Batch-load current required references through Stage 7 authorization and verify exact set equality with stored claim/bundle references before detailed data is returned. Compare current reference binding metadata to immutable Stage 5 bundles at preparation, so a mutated locator is not accepted merely because it changed before proposal creation. Required source missing/inaccessible → `EVIDENCE_UNAVAILABLE`; any required authority conflict, supersession or materially stale state blocks confirmation. Evaluate `staleAt`/validity against actual confirmation time, distinguishing historical final actuals from expiring offers. Irrelevant stale supplier history remains historical and cannot support current-price statements.

Actor must have current authorized access to the organization/project/run pair and required sources. Run creator IDs are validated as organization-owned lineage; accepted canonical comparison reads remain available to other authorized actors. For this write path, use the current proposing actor for capture-only reconstruction and require exact current permission fingerprint equality with the run/enrichment's stored fingerprints. Because the established fingerprint includes membership identity, another actor receives `PROPOSAL_STALE`/refresh-required and must run a fresh comparison in their own current context before preparing an action; the existing comparison remains readable. Do not recreate another actor's historic grants or silently ignore membership differences. Document and test this bounded write behavior for Financial Reviewer and Admin as well as Mei. It is not an additional restriction on authorized Stage 4–7 reads.

## 8. Confirmation, concurrency and linearization

Trusted request adapter resolves the signed session again on confirmation. Add optional server-only verified `sessionId` to RuntimeContext, populated by SignedDemoIdentityContext and never serialized; Stage 8 confirms only after persisted session expiry/revocation, membership/person/organization/grants/assignments are reloaded inside the transaction. Existing non-Stage-8 callers remain compatible.

Acquire fixed-order PostgreSQL SHARE table locks **before authoritative rereads**, then lock the scoped proposal row FOR UPDATE. Use READ COMMITTED so reads after waiting for locks see committed current values. Hold locks until commit/rollback. SHARE locks block source UPDATE/INSERT/DELETE (`ROW EXCLUSIVE`), including new quote/conflict/grant/assignment phantoms; serialized proposal row access plus unique constraints handles concurrent confirmation. Do not claim SERIALIZABLE alone prevents all confirmation-time source races.

Source lock set: Organization, Person, Membership, MembershipCapabilityGrant, DemoSession, ProjectAssignment, Project, ProjectScope, ProjectMaterial, Material, ProjectSupplier, Supplier, Quote, QuoteVersion, QuoteItem, ForecastCostVersion, ForecastCostLine, ProjectCostVersion, CostLine, SupplierOffer, SupplierOfferItem, Document, DocumentVersion, EvidenceReference, EvidenceConflict, IntelligenceRun, ComparisonRun, ComparisonCandidate, ComparisonFactor, ComparisonClaim, EconomicsEnrichmentRun, EconomicsObservationDecision. EvidenceConflict stores its two reference links directly in the current schema; there is no EvidenceConflictItem table. If an adapter adds another material read table, add it to this reviewed list. Use one fixed-order lock statement. Never SHARE-lock ProposedAction, Action, AuditEvent or receipt tables and then upgrade their locks: that risks deadlock. Set bounded lock/statement/transaction timeouts; recommended 2s/5s/10s, with neutral retryable failure on timeout. This conservative global contention is explicitly an L1 limitation; measure concurrent p95 as well as serial performance.

Transaction order:

1. lock source tables; reload trusted signed-session identity/current permissions;
2. capability gate before sensitive proposal/evidence/assignee/action reads; scoped project metadata gate;
3. lock authorized proposal; validate actor ownership of proposal, organization/project pair and selector;
4. validate server-issued confirmation key; normalize/hash full payload (proposal, actor, chosen title/rationale variants, assignee, due date, explicit confirmation; exclude request/correlation IDs, current time and display locale);
5. if receipt exists for organization/key: mismatch → `IDEMPOTENCY_CONFLICT`; match → current receipt authorization then `IDEMPOTENT_REPLAY`;
6. otherwise require PREPARED, unexpired/unconsumed, accepted project state `ACTIVE`, unchanged material fingerprints/evidence, current assignee eligibility and valid edits/date;
7. create Action with immutable evidence snapshot; append audit event; conditional PREPARED→CONFIRMED consumption with consumedAt; create durable receipt/key/hash row; commit;
8. only after commit return `CREATED` and a permission-safe durable receipt.

Same payload/key under concurrent requests returns the same receipt after lock wait. Same key/different payload rejects. Different key on consumed proposal returns consumed/key conflict without another Action. Never generate a replacement key automatically after a transport failure. A retry's newer request ID does not make its payload different. Uniqueness conflict at database boundary must be resolved by a fresh authorized lookup and payload comparison, not reported as false success.

Already-created business facts survive later source changes: idempotent replay/receipt reopen can skip *freshness* validation but must reauthorize every required source and current project/action access. Expired/consumed proposal does not invalidate the same successful key/payload receipt. A downgraded user must not see the receipt snapshot just because a key is known.

Failure injection is an internal test dependency only, never an HTTP option. Inject after Action/evidence snapshot, after audit, after consumption and after receipt-before-commit; every failure rolls back all records/state. Source-table locking is a linearization guarantee: source writers committed before lock acquisition are observed/rejected; writers arriving after acquisition wait until the authorized confirmation commits. Test both directions and lock timeout.

## 9. Routes, HTTP security and presentation

Use existing Compare surface for review/receipt overlays: bounded `proposal` and `action` selectors alongside `run`, `economics`, `selected` and existing evidence query keys. Existing `/{locale}/projects/{projectKey}/actions` becomes the scoped action list/receipt location, not a new global surface. A direct `action` selector reopens through getReceipt. All GET paths are read-only with no persistence, including proposal/receipt reopen; only explicit POST prepares a proposal or confirms an Action. Reopen does not auto-expire, regenerate or reset stored proposal state.

Provide thin route/server-action adapters for prepare, proposal reopen, confirm and receipt read; concrete URL names must be recorded in build-contract/tests/QA plan before integration. Use signed HTTP-only same-site cookie, same-origin/Origin check for POST (accepted SEC-016), bounded JSON/form bodies, `Cache-Control: private, no-store`, no redirects to arbitrary client URLs and no token in query string. Origin validation uses the configured trusted application origin and request target, never an arbitrary forwarded/client-supplied host. Missing/unauthorized/cross-tenant selectors share neutral outcomes.

Review UI: explicit entry/confirm language, editable bounded title/review intent, locked verified facts/warnings with Stage 7 evidence links, eligible assignee select or locked default, keyboard-usable date with clearable value, irreversible-effect explanation and cancel. On validation, retain authorized draft and focus first error; on sensitive access loss clear draft/evidence. Disable only current submission controls; after success replace proposal selector with action selector so refresh/back cannot resubmit a business write. Preserve selected keys and evidence context across receipt, Actions and locale switching. Safe memory/session draft state is not authoritative and is cleared on cancel/expiry/access loss/success.

One modal focus owner at a time. If evidence opens from review, keep authorized draft while moving to the existing evidence panel and restore review focus on return; do not stack two active traps. Escape/cancel restore triggering control or safe comparison heading. Receipt heading is focusable and receives focus. Semantic labels/error `aria-describedby`, text+icon warnings, mobile full-height sheet, reduced motion, readable full-width actions and no pointer-only due-date interaction are mandatory.

Complete catalog parity for prepare/edit/validation/confirmation/expiry/stale/denied/evidence/assignee/duplicate/failure/receipt/workspace states. Never show policy enums, provider names, SQL errors or English developer text in normal Chinese mode. Display timestamps in organization timezone; date-only due values remain date-only.

## 10. Current access for workspace and receipts

The existing Stage 3 `role !== VIEWER` action check is insufficient once actions can contain sensitive fields. Production workspace composition must use the new authorized action-summary query (an optional application port preserves existing Stage 3 dependency tests). Gate create/propose/evidence capabilities before querying sensitive titles, retrieve bounded action identity/scope metadata, batch all referenced evidence ownership/classification, authorize per action, then load/map only authorized title/receipt fields. Missing actual-read or explicit deny yields no action title, key, count, assignee name or source hint. Apply the same policy to Actions route and receipt reopen. Do not hide already-loaded unauthorized text in React.

Stage 8 must independently validate **current EvidenceReference.dataClassification**, not merely inherit the Stage 7 subject-project check. Before detailed source/Action snapshot reads, batch minimal reference IDs, organization, subject ownership, observation type and classification. Unknown classification or `TENANT_RESTRICTED` fails closed in v0.1. `DEMO_SYNTHETIC`, `PUBLIC_REFERENCE` and `TENANT_APPROVED` still require trusted same-organization/run-bound subject ownership and the relevant commercial capability. `TENANT_PRIVATE` additionally requires current direct project assignment or the existing Admin/Financial Reviewer organization-wide private-history policy; the active project always retains the normal assignment predicate. Actual references additionally require actual-read plus the applicable existing active/historical actual policy. Classifications never create a capability or authorize another tenant. Reclassification after creation must immediately hide the receipt/list entry when access no longer passes, even though these reads intentionally skip source freshness. The same predicate applies to preparation, confirmation and assignee eligibility. Extend a pure Stage 7 helper only if existing semantics remain unchanged; otherwise keep this additional guard local to Stage 8.

## 11. Validation, rollout and rollback

Builder supplies focused policy/service/repository/route tests and SQL invariants. Independent Test/Evaluation runs all existing CI commands plus real PostgreSQL transaction/concurrency/mutation/seed-repeatability tests, authorization/non-disclosure, bilingual/a11y/route checks, architecture boundaries, production audit and performance. Computer QA is separate and actual; report begins NOT_RUN. No readiness claim from deterministic tests substitutes for browser evidence.

Migration is additive and roll-forward. Code rollback restores prior application while leaving Stage 8 records/audit/constraints intact; disable new entry point through code rollback rather than deleting committed actions. Do not reverse migration or delete audit rows in an operational rollback. Isolated disposable preview reseed is a separate explicitly synthetic operation. Test fresh migrate, migrate on baseline, repeat seed after an action, invariant verification and audit-trigger enabled afterward.

Acceptance is blocked by any unproven tenant boundary, stale/evidence bypass, duplicate, partial commit, non-append-only audit, false receipt, missing locale/a11y critical path or actual browser-QA evidence. Preview/merge/release decisions belong to the orchestrator/human gates, never Builder self-approval.
