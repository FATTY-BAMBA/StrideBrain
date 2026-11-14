# StrideGraph v0.1 — Implementation Schema

**Status:** Implementation-ready logical schema for review  
**Persistence target:** PostgreSQL with Prisma adapter  
**Scope:** minimum entities required by Comparable Project Intelligence

## 1. Schema principles

1. Internal primary keys are opaque UUID/CUID-style identifiers.
2. Human-readable business keys such as `PRJ-XINYI-026` are organization-scoped and immutable after publication.
3. Every tenant-private row carries `organizationId` directly, including join/audit/intelligence rows.
4. Quotations, supplier offers, forecasts, and reconciled actual costs use distinct tables/types.
5. Versioned commercial/evidence records are immutable after approval; correction creates a successor version.
6. Supersession is explicit.
7. Conflict is explicit and never inferred away by timestamp.
8. Evidence references support exact claims/fields/values and locators.
9. Comparison runs store immutable input/output snapshots and policy fingerprints.
10. Action creation and AuditEvent insertion are atomic.
11. Fixture records use the same schema as future tenant records.
12. Soft deletion is not a substitute for audit/version history.

## 2. Core enums

```text
DataMode
  DEMO_SYNTHETIC
  TENANT_PRIVATE

DataClassification
  DEMO_SYNTHETIC
  PUBLIC_REFERENCE
  TENANT_PRIVATE
  TENANT_RESTRICTED
  TENANT_APPROVED

Locale
  zh-TW
  en

Role
  ORGANIZATION_ADMIN
  PROJECT_MANAGER_ESTIMATOR
  FINANCIAL_REVIEWER
  VIEWER

Capability
  project:read
  project:compare
  quote:read
  commercial:forecast-read
  commercial:actual-read
  evidence:read
  action:internal-review:propose
  action:internal-review:create
  action:assign
  authority:financial-conflict:resolve
  settings:manage

ProjectStatus
  DRAFT
  ACTIVE
  QUOTE_REVIEW
  IN_PROGRESS
  COMPLETED
  CLOSED
  CANCELLED
  ARCHIVED

ObservationType
  QUOTED_PRICE
  SUPPLIER_OFFER
  FORECAST_DIRECT_COST
  RECONCILED_ACTUAL_COST

AuthorityState
  OBSERVED
  HUMAN_REVIEWED
  APPROVED_COMMERCIAL
  RECONCILED_ACTUAL
  SUPERSEDED
  CONFLICTED

VersionStatus
  DRAFT
  APPROVED
  SUPERSEDED
  CONFLICTED

EvidenceSourceType
  PROJECT_RECORD
  QUOTE_VERSION
  QUOTE_ITEM
  FORECAST_COST_VERSION
  FORECAST_COST_LINE
  PROJECT_COST_VERSION
  COST_LINE
  SUPPLIER_OFFER
  SUPPLIER_OFFER_ITEM
  DOCUMENT_VERSION
  APPROVED_FACT

EvidenceLocatorType
  RECORD_FIELD
  DOCUMENT_PAGE
  DOCUMENT_TEXT_RANGE
  SPREADSHEET_CELL_RANGE
  TABLE_ROW_RANGE
  QUOTE_ITEM_RANGE
  COST_LINE_RANGE

TaxonomyKind
  PROJECT_SCOPE
  COMMERCIAL_CATEGORY
  MATERIAL_CATEGORY

ComparisonRunStatus
  RUNNING
  COMPLETE
  FAILED
  STALE

FactorState
  KNOWN
  UNKNOWN
  NOT_APPLICABLE

MatchBand
  STRONG
  RELEVANT
  PARTIAL
  BROADER

EvidenceSufficiency
  STRONG
  PARTIAL
  INSUFFICIENT

ConflictStatus
  OPEN
  RESOLVED
  DISMISSED

ProposedActionStatus
  DRAFT
  CONSUMED
  EXPIRED
  CANCELLED

ActionType
  INTERNAL_REVIEW

ActionStatus
  OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED

IntelligenceRunType
  COMPARABLE_PROJECT
  OPTIONAL_EXPLANATION

IntelligenceRunStatus
  RUNNING
  SUCCEEDED
  FAILED
  STALE
```

Use language-compatible database enum names or validated strings according to migration/tooling constraints. Policy identifiers remain strings to allow version evolution.

## 3. Identity and tenancy

## Organization

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| slug | string | globally unique, immutable |
| nameEn | string | required |
| nameZhTw | string | required for hero fixture |
| defaultLocale | Locale | required |
| timezone | string | required; hero `Asia/Taipei` |
| dataMode | DataMode | required |
| status | string | `ACTIVE`, `SUSPENDED`, `ARCHIVED` |
| createdAt / updatedAt | timestamp | required |

## UserIdentity

Represents the verified external/local identity subject, not an organization role.

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| provider | string | required |
| providerSubject | string | unique with provider |
| displayName | string | required |
| email | string? | optional/normalized |
| status | string | required |
| createdAt / updatedAt | timestamp | required |

## Membership

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | FK, indexed |
| userIdentityId | ID | FK |
| role | Role | required |
| locale | Locale | required |
| status | string | `ACTIVE`, `SUSPENDED`, `REVOKED` |
| createdAt / updatedAt | timestamp | required |

Unique: `(organizationId, userIdentityId)`.

## MembershipCapabilityGrant

Supports explicit grants/denials such as Mei’s `commercial:actual-read`.

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| membershipId | ID | required |
| capability | Capability | required |
| effect | string | `ALLOW` or `DENY` |
| createdByMembershipId | ID? | audited |
| createdAt | timestamp | required |

Unique: `(membershipId, capability)`.

## ProjectAssignment

| Field | Type | Constraints |
|---|---|---|
| organizationId | ID | required |
| projectId | ID | required |
| membershipId | ID | required |
| assignmentRole | string | e.g. `PROJECT_MANAGER`, `ESTIMATOR`, `REVIEWER` |
| active | boolean | required |

Unique: `(projectId, membershipId, assignmentRole)`.

## 4. Parties and taxonomies

## Client

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required, indexed |
| businessKey | string | tenant-unique |
| nameEn / nameZhTw | string? | at least one required |
| clientType | string? | canonical configured type |
| status | string | required |
| classification | DataClassification | required |

## Supplier

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required, indexed |
| businessKey | string | tenant-unique |
| nameEn / nameZhTw | string? | required display name |
| supplierType | string? | vendor/subcontractor/fabricator |
| status | string | required |
| classification | DataClassification | required |

## Material

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| businessKey | string | tenant-unique |
| nameEn / nameZhTw | string? | display |
| materialCategoryTermId | ID | FK TaxonomyTerm |
| specification | json? | bounded structured properties |
| status | string | required |

## TaxonomyTerm

Canonical configured IDs for comparison rather than free-form labels.

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID? | null for system term; otherwise tenant-specific |
| kind | TaxonomyKind | required |
| code | string | unique within `(organizationId, kind)` |
| nameEn / nameZhTw | string | required |
| active | boolean | required |
| adjacentCodes | json | configured subtype/location adjacency where applicable |

Taxonomy changes used by scoring require versioned policy/fixture review.

## 5. Projects and comparison profile

## Project

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required, indexed |
| businessKey | string | tenant-unique, e.g. `PRJ-XINYI-026` |
| clientId | ID | FK Client |
| nameEn / nameZhTw | string | required for hero fixture |
| comparisonClass | string | required for comparison |
| projectSubtype | string | required for primary scoring |
| status | ProjectStatus | required |
| locationCountry | string | required |
| locationCity | string | required |
| locationDistrict | string? | optional but scored when known |
| areaQuantity | decimal | required for primary scoring |
| areaUnit | string | required; hero `M2` |
| currency | string | required; hero `TWD` |
| programmeWeeks | decimal? | optional factor/difference |
| startDate | date? | optional |
| completionDate | date? | required for completed candidates |
| targetHandoverDate | date? | active project |
| metadataAuthority | AuthorityState | minimum HUMAN_REVIEWED for candidate eligibility |
| classification | DataClassification | required |
| recordVersion | integer | optimistic/version fingerprint |
| createdAt / updatedAt | timestamp | required |
| deletedAt | timestamp? | excluded by policy |

Indexes:

- `(organizationId, status, comparisonClass)`;
- `(organizationId, completionDate)`;
- `(organizationId, businessKey)` unique.

## ProjectFacet

Associates a project with canonical scope/commercial/material taxonomy terms used in comparison.

| Field | Type | Constraints |
|---|---|---|
| organizationId | ID | required |
| projectId | ID | required |
| taxonomyTermId | ID | required |
| source | string | `MANUAL`, `QUOTE_DERIVED`, `COST_DERIVED`, `APPROVED_IMPORT` |
| authorityState | AuthorityState | required |

Unique: `(projectId, taxonomyTermId)` for active profile.

## ProjectSupplier

| Field | Type | Constraints |
|---|---|---|
| organizationId | ID | required |
| projectId | ID | required |
| supplierId | ID | required |
| relationshipType | string | required |
| authorityState | AuthorityState | required |

## ProjectMaterial

| Field | Type | Constraints |
|---|---|---|
| organizationId | ID | required |
| projectId | ID | required |
| materialId | ID | required |
| materialCategoryTermId | ID | required |
| authorityState | AuthorityState | required |

## 6. Documents and evidence

## Document

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required, indexed |
| businessKey | string | tenant-unique |
| projectId | ID? | optional project relationship |
| title | string | required |
| documentType | string | required |
| classification | DataClassification | required |
| status | string | required |
| createdAt / updatedAt | timestamp | required |

## DocumentVersion

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| documentId | ID | required |
| versionLabel | string | required |
| versionNumber | integer | required |
| authorityState | AuthorityState | required |
| effectiveAt | timestamp? | optional |
| supersedesVersionId | ID? | explicit self-reference |
| storageKey | string? | server-only object-storage key |
| checksum | string | required for immutable contents |
| mimeType | string | required |
| extractedTextKey | string? | server-only; future ingestion |
| classification | DataClassification | required |
| createdAt | timestamp | required |

Unique: `(documentId, versionNumber)`.

Approved/superseded versions are immutable.

## EvidenceReference

Canonical claim-to-source pointer.

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required, indexed |
| businessKey | string | tenant-unique |
| subjectType | string | domain subject type supported |
| subjectId | ID/string | domain subject identifier |
| claimKey | string | exact field/claim supported |
| sourceType | EvidenceSourceType | required |
| sourceRecordId | ID/string | required |
| documentVersionId | ID? | populated for document evidence |
| locatorType | EvidenceLocatorType | required |
| locator | json | validated bounded locator |
| supportedValue | json? | exact value snapshot where appropriate |
| unit | string? | optional |
| observationType | ObservationType? | for economics |
| authorityState | AuthorityState | required |
| classification | DataClassification | required |
| effectiveAt | timestamp? | source date |
| validUntil | timestamp? | supplier/current evidence |
| createdAt | timestamp | required |

`EvidenceReference` cannot elevate the authority of its subject. It records support and authority snapshot.

## EvidenceConflict

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| subjectType | string | required |
| subjectId | ID/string | required |
| fieldKey | string | required |
| status | ConflictStatus | required |
| impact | string | e.g. `EXCLUDE_FROM_AGGREGATE` |
| resolutionNote | string? | authorized resolution only |
| resolvedByMembershipId | ID? | optional |
| resolvedAt | timestamp? | optional |
| createdAt / updatedAt | timestamp | required |

## EvidenceConflictItem

| Field | Type | Constraints |
|---|---|---|
| conflictId | ID | required |
| organizationId | ID | required |
| evidenceReferenceId | ID | required |
| observedValue | json | required |
| authorityState | AuthorityState | required |

## 7. Quotation model

## Quote

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| businessKey | string | tenant-unique |
| projectId | ID | required |
| status | string | required |
| createdAt / updatedAt | timestamp | required |

## QuoteVersion

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| quoteId | ID | required |
| versionNumber | integer | required |
| versionLabel | string | e.g. `v3` |
| status | VersionStatus | required |
| authorityState | AuthorityState | only `APPROVED_COMMERCIAL` enters approved quote history |
| currency | string | required |
| proposedPriceBeforeTax | decimal | required |
| taxAmount | decimal? | optional |
| total | decimal? | optional |
| effectiveAt | timestamp? | optional |
| supersedesVersionId | ID? | explicit self-reference |
| approvedByMembershipId | ID? | optional |
| approvedAt | timestamp? | optional |
| recordVersion | integer | fingerprint |
| createdAt | timestamp | required |

Unique: `(quoteId, versionNumber)`.

## QuoteItem

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| quoteVersionId | ID | required |
| businessKey | string | version-scoped stable line key |
| commercialCategoryTermId | ID | required |
| materialId | ID? | optional |
| supplierId | ID? | optional |
| description | string | required |
| unit | string | required |
| quantity | decimal | required |
| unitPrice | decimal | required |
| amount | decimal | required |
| authorityState | AuthorityState | inherits/validated with version |

Quote items always represent `QUOTED_PRICE`, never actual cost.

## 8. Forecast direct-cost model

## ForecastCostVersion

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| projectId | ID | required |
| versionNumber | integer | required |
| status | VersionStatus | required |
| authorityState | AuthorityState | typically HUMAN_REVIEWED/APPROVED_COMMERCIAL according to policy |
| currency | string | required |
| totalDirectCost | decimal | required |
| effectiveAt | timestamp | required |
| supersedesVersionId | ID? | explicit |
| recordVersion | integer | fingerprint |
| createdAt | timestamp | required |

## ForecastCostLine

Same structure as CostLine but observation type is fixed to `FORECAST_DIRECT_COST`.

Required fields:

- organizationId;
- forecastCostVersionId;
- businessKey;
- commercialCategoryTermId;
- materialId/supplierId optional;
- description;
- unit/quantity;
- unitCost;
- amount;
- authorityState.

## 9. Reconciled actual-cost model

## ProjectCostVersion

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| projectId | ID | required |
| versionNumber | integer | required |
| status | VersionStatus | required |
| authorityState | AuthorityState | must equal RECONCILED_ACTUAL for actual aggregates |
| currency | string | required |
| totalDirectCost | decimal | required |
| reconciliationUnit | string | required |
| reconciledByMembershipId | ID? | required outside demo fixture |
| reconciledAt | timestamp? | required for real authority |
| supersedesVersionId | ID? | explicit |
| recordVersion | integer | fingerprint |
| createdAt | timestamp | required |

## CostLine

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| projectCostVersionId | ID | required |
| businessKey | string | version-scoped stable key |
| commercialCategoryTermId | ID | required |
| materialId | ID? | optional |
| supplierId | ID? | optional |
| description | string | required |
| unit | string | required |
| quantity | decimal | required |
| unitCost | decimal | required |
| amount | decimal | required |
| authorityState | AuthorityState | must be compatible with parent |

Invariants:

- line totals reconcile to `totalDirectCost` within configured currency tolerance;
- each aggregate-eligible line has accessible evidence;
- conflicted/superseded lines are excluded;
- quote items cannot be joined as cost lines by convention or matching business key.

## 10. Supplier offers

## SupplierOffer

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| supplierId | ID | required |
| projectId | ID? | optional |
| businessKey | string | tenant-unique |
| versionNumber | integer | required |
| authorityState | AuthorityState | APPROVED_COMMERCIAL where approved offer |
| currency | string | required |
| offeredAt | timestamp | required |
| validUntil | timestamp? | optional |
| supersedesOfferId | ID? | explicit |
| total | decimal? | optional |
| createdAt | timestamp | required |

## SupplierOfferItem

Contains:

- organizationId;
- supplierOfferId;
- commercialCategoryTermId;
- materialId optional;
- description;
- unit/quantity/unitPrice/amount;
- authorityState.

Freshness is derived under policy; it is not permanently stored as truth.

## 11. Intelligence and comparison persistence

## IntelligenceRun

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| type | IntelligenceRunType | required |
| status | IntelligenceRunStatus | required |
| createdByMembershipId | ID | required |
| activeProjectId | ID? | optional |
| locale | Locale | required |
| inputFingerprint | string | required |
| permissionScopeHash | string | required |
| runtimeMetadata | json | sanitized |
| errorCode | string? | safe code only |
| startedAt / completedAt | timestamp | required/optional |

## ComparisonRun

One-to-one with IntelligenceRun.

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| intelligenceRunId | ID | unique |
| activeProjectId | ID | required |
| activeQuoteVersionId | ID? | hero required |
| comparisonPolicyVersion | string | `CPI-SIM-1.0` |
| eligibilityPolicyVersion | string | required |
| authorityPolicyVersion | string | `EVIDENCE-AUTHORITY-1.0` |
| calculationVersion | string | required |
| activeContextSnapshot | json | immutable bounded snapshot |
| structuredSynthesis | json | deterministic sections |
| sufficiency | EvidenceSufficiency | required |
| evidenceCoverage | decimal | required |
| inputFingerprint | string | required |
| evidenceFingerprint | string | required |
| resultSnapshot | json | immutable bounded DTO snapshot |
| status | ComparisonRunStatus | required |
| staleReason | string? | optional |
| staleAt | timestamp? | optional |
| createdAt | timestamp | required |

## ComparisonCandidate

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| comparisonRunId | ID | required |
| candidateProjectId | ID | required |
| rank | integer | required |
| score | decimal | required 0–100 |
| band | MatchBand | required |
| evidenceCoverage | decimal | required 0–100 |
| economicsSufficiency | EvidenceSufficiency | required |
| warnings | json | bounded code list |
| differences | json | structured |

Unique: `(comparisonRunId, candidateProjectId)` and `(comparisonRunId, rank)`.

## ComparisonFactor

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| comparisonCandidateId | ID | required |
| factorKey | string | required |
| state | FactorState | required |
| currentValue | json? | snapshot |
| candidateValue | json? | snapshot |
| normalizedScore | decimal | 0–1 |
| weight | decimal | required |
| contribution | decimal | required |
| evidenceReferenceIds | json | bounded IDs or join table |

Unique: `(comparisonCandidateId, factorKey)`.

## ComparisonClaim

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| comparisonRunId | ID | required |
| comparisonCandidateId | ID? | optional |
| claimKind | string | required |
| subjectType / subjectId | string | required |
| value | json | required |
| unit | string? | optional |
| observationType | ObservationType? | economics |
| authorityState | AuthorityState? | economics |
| warningCodes | json | bounded |
| calculationTrace | json? | versioned bounded trace |

## ComparisonClaimEvidence

| Field | Type | Constraints |
|---|---|---|
| organizationId | ID | required |
| comparisonClaimId | ID | required |
| evidenceReferenceId | ID | required |
| relationship | string | `SUPPORTS`, `CONFLICTS`, `EXCLUDED`, `CONTEXT` |

Unique: `(comparisonClaimId, evidenceReferenceId, relationship)`.

## 12. Proposed action, action, and audit

## ProposedAction

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| projectId | ID | required |
| comparisonRunId | ID | required |
| type | ActionType | fixed INTERNAL_REVIEW |
| title | string | required/bounded |
| rationale | string | required/bounded |
| suggestedAssigneeMembershipId | ID? | optional |
| suggestedDueDate | date? | optional |
| evidenceReferenceIds | json or join table | required non-empty |
| policyVersion | string | `INTERNAL-REVIEW-ACTION-1.0` |
| createdByKind | string | SYSTEM/USER/MODEL_ASSISTED |
| status | ProposedActionStatus | required |
| proposalFingerprint | string | required |
| expiresAt | timestamp? | optional |
| createdAt / updatedAt | timestamp | required |

## Action

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required |
| businessKey | string | tenant-unique receipt ID |
| projectId | ID | required |
| type | ActionType | INTERNAL_REVIEW |
| title | string | required |
| rationale | string | required |
| assigneeMembershipId | ID? | optional |
| dueDate | date? | optional |
| status | ActionStatus | required |
| originComparisonRunId | ID | required |
| originProposedActionId | ID | required |
| createdByMembershipId | ID | required |
| idempotencyKey | string | unique within organization |
| createdAt / updatedAt | timestamp | required |

## ActionEvidence

| Field | Type | Constraints |
|---|---|---|
| organizationId | ID | required |
| actionId | ID | required |
| evidenceReferenceId | ID | required |

Unique: `(actionId, evidenceReferenceId)`.

## AuditEvent

Append-only.

| Field | Type | Constraints |
|---|---|---|
| id | opaque ID | PK |
| organizationId | ID | required, indexed |
| eventType | string | e.g. `INTERNAL_REVIEW_ACTION_CREATED` |
| actorUserId / actorMembershipId | ID | required |
| projectId | ID? | optional |
| subjectType / subjectId | string | required |
| requestId | string | required |
| comparisonRunId | ID? | optional |
| policyVersions | json | required where applicable |
| evidenceReferenceIds | json | bounded |
| before | json? | edited proposal snapshot |
| after | json? | action receipt snapshot |
| result | string | required |
| createdAt | timestamp | required |

Application code cannot update/delete AuditEvent. Retention/export controls are defined before L2.

## 13. Organization-scope invariants

Because many tables use opaque IDs, application and database layers must prevent cross-organization relations.

Required controls:

- service validation that every related row shares organizationId;
- repository queries include organizationId predicates;
- composite unique/index keys include organization where appropriate;
- database triggers/check functions or RLS policies before real tenant data;
- fixture validator detects cross-org relationships;
- integration tests attempt cross-org project, evidence, assignee, quote, run, and action IDs.

The browser-supplied ID is never sufficient authority.

## 14. Immutability/version rules

- approved QuoteVersion, ProjectCostVersion, SupplierOffer, DocumentVersion, and ComparisonRun snapshots are immutable;
- updates create successor versions with explicit supersession;
- Project metadata may update with incremented `recordVersion` and audit;
- ComparisonRun does not recalculate in place; refresh creates a new run;
- ProposedAction edits are allowed before consumption; consumed proposals are immutable;
- Action lifecycle updates are separately audited;
- AuditEvent is append-only.

## 15. Decimal and currency rules

- use database decimal/numeric, never binary floating point for authoritative money;
- store currency per commercial version;
- v0.1 eligibility requires compatible currency and unit;
- store raw amount and normalized calculation trace separately;
- display rounding does not change stored calculations;
- reconciliation tolerance is explicit by currency/calculation version.

## 16. Fixture seeding contract

Horizon Atelier seed must create:

- one Organization;
- Mei and role/capability grants;
- active Xinyi project and quote v3;
- 24 completed and 5 active projects;
- canonical top-six comparable ordering;
- separate quote, forecast, supplier-offer, and actual-cost versions;
- required evidence references/locators;
- one superseded quote;
- one unresolved cost conflict outside primary aggregate;
- one stale supplier offer;
- lighting category with only two eligible actual observations;
- one inaccessible project in a separate permission scope;
- one broader/partial match;
- candidate assignees;
- deterministic IDs for evals.

The seed script validates invariants and fails rather than partially creating inconsistent data.

## 17. Minimum indexes

- every private table: `organizationId` leading index;
- Project: `(organizationId, status, comparisonClass)`;
- ProjectFacet: `(organizationId, taxonomyTermId, projectId)`;
- QuoteVersion: `(organizationId, quoteId, versionNumber)`;
- ProjectCostVersion: `(organizationId, projectId, authorityState, status)`;
- CostLine/QuoteItem: `(organizationId, categoryTermId)`;
- EvidenceReference: `(organizationId, subjectType, subjectId, claimKey)`;
- EvidenceConflict: `(organizationId, subjectType, subjectId, status)`;
- ComparisonRun: `(organizationId, activeProjectId, createdAt)`;
- ComparisonCandidate: `(organizationId, comparisonRunId, rank)`;
- Action: `(organizationId, projectId, status)`;
- AuditEvent: `(organizationId, createdAt)`.

Index design is verified with actual query plans after fixture scale is seeded.

## 18. Migration sequence

1. tenancy/identity;
2. parties/taxonomy;
3. projects/facets/assignments;
4. documents/evidence/conflicts;
5. quotes/forecasts/costs/supplier offers;
6. intelligence/comparison tables;
7. proposed actions/actions/audit;
8. indexes/constraints;
9. Horizon Atelier seed;
10. tenant-isolation and canonical-ranking integration tests.

## 19. Schema acceptance criteria

- no generic financial field can blur quote/forecast/offer/actual meaning;
- every private row is organization scoped;
- canonical ranking inputs are relational and versionable;
- each aggregate-eligible actual line has evidence;
- conflict and supersession are explicit;
- comparison runs can be reopened exactly;
- action creation links to run and evidence;
- action/audit write can be atomic and idempotent;
- fixture and future tenant adapters use the same domain schema;
- schema supports the UX states without requiring model inference or browser-owned truth.