# Comparable Project Intelligence — Extraction Brief

**Vertical slice:** StrideBrain v0.1  
**Primary question:** “Have we done something like this before?”  
**Status:** Product + domain extraction specification; implementation not started

## 1. Why this is the first vertical slice

This workflow proves the central StrideBrain thesis in one journey:

```text
company history
  → connected project context
  → retrieval
  → comparison
  → evidence
  → recommendation
  → action
```

It also reuses the strongest prototype learning without preserving the prototype architecture.

## 2. User outcome

A project owner, estimator or business owner can open a current project/opportunity and determine:

- whether the company has completed comparable work;
- which projects are most relevant;
- why they are similar;
- what materially differs;
- what historical costs/quotes/suppliers/documents support the comparison;
- whether evidence is sufficient;
- what should be reviewed next.

## 3. Target first user

Taiwan interior design / renovation firms with:

- multiple active projects;
- meaningful completed project history;
- quotations and revisions;
- supplier/subcontractor records;
- scattered project documents;
- more accumulated knowledge than the owner can recall reliably.

The domain design must remain extensible to other industries through configuration and additional objects, not separate application implementations.

## 4. Primary entry points

1. **Project workspace** — current project context already active.
2. **StrideBrain** — user identifies a current opportunity/project in the question.
3. **Quote review** — compare an active quote against historical projects.
4. **Home suggestion** — system notices potentially relevant historical matches.

The preferred demo starts inside an active project so context does not need to be restated.

## 5. Prerequisites

The slice requires production-shaped versions of:

- Organization and Membership;
- Project and Client;
- Document and DocumentVersion;
- Quote, QuoteVersion and QuoteItem;
- Supplier;
- Material/CostCode taxonomy;
- EvidenceReference;
- IntelligenceRun;
- Action/ReviewTask;
- demo tenant fixture.

Minimum fixture quality:

- 20–30 historical projects;
- 4–6 active projects;
- 40+ quote versions;
- 300–600 quote items;
- 15–25 suppliers;
- 100+ evidence records;
- overlapping scope/material/supplier patterns;
- deliberate conflicts, stale records and insufficient-evidence cases.

## 6. Context envelope

Every request resolves:

```ts
type ContextEnvelope = {
  organizationId: string;
  userId: string;
  membershipId: string;
  role: string;
  locale: "zh-TW" | "en";
  surface: "project" | "stridebrain" | "quote" | "home";
  activeProjectId?: string;
  activeQuoteVersionId?: string;
  permissions: PermissionSet;
};
```

The browser must not choose the authoritative organization or permissions.

## 7. User journey

### Step 1 — understand the current project

StrideBrain reads structured current-project context:

- project type;
- location;
- area/quantity/unit;
- scope categories;
- materials;
- active quote composition;
- supplier choices;
- target schedule;
- client/project attributes allowed for comparison.

The system shows which fields were used and which were missing.

### Step 2 — filter eligible history

Before semantic ranking, exclude projects that fail configured requirements:

- wrong organization;
- no access permission;
- incomplete/cancelled status where completed history is required;
- incompatible project class/unit;
- insufficient source authority;
- excluded/archived/test data not allowed by policy;
- missing required structured context.

### Step 3 — rank comparable projects

Use a hybrid, explainable comparison:

#### Structured factors

- project type/class;
- floor area or relevant quantity;
- location;
- scope-category overlap;
- quote-category overlap;
- material overlap;
- supplier overlap;
- budget/cost scale;
- completion recency;
- client type if permitted/relevant;
- timeline/delivery pattern.

#### Semantic factor

Semantic similarity over approved project scope summaries and selected source text may supplement structured factors.

It must not override mandatory eligibility or permissions.

### Step 4 — explain each match

Every comparable result contains:

- overall score;
- strongest similarity factors;
- important differences;
- evidence sufficiency;
- source freshness;
- source authority;
- warning/conflict count.

### Step 5 — retrieve supporting economics

For selected comparables, distinguish:

- quoted price;
- supplier offer;
- recorded direct cost;
- final/reconciled actual cost;
- derived unit cost;
- current supplier evidence;
- assumptions.

Never collapse these into one number.

### Step 6 — show evidence

The user can inspect:

- project record;
- quote version/register row;
- quote items;
- document version/page/cell;
- supplier record/offer;
- cost-line evidence;
- policy/calculation version.

### Step 7 — synthesize implications

StrideBrain summarizes:

- what history suggests;
- what differs materially;
- whether the current quote appears outside observed history;
- what cannot yet be concluded;
- what evidence should be gathered next.

### Step 8 — move to action

Allowed v0.1 actions:

- open/compare selected projects;
- open supporting quote/source;
- compare current quote categories;
- create an internal review action;
- draft a supplier clarification request;
- assign review to an authorized person.

No autonomous external send or financial approval.

## 8. Evidence authority policy

### Eligible for project similarity

A completed project record with approved project metadata may be considered even if actual-cost evidence is incomplete, but the result must state which comparison dimensions are supported.

### Eligible for actual-cost comparison

Only records that meet the organization’s HistoricalEligibilityPolicy, initially requiring:

- completed project;
- reconciled cost version;
- known unit/quantity;
- line-level cost taxonomy;
- source evidence;
- accepted authority state.

### Quote-only records

May support quoted-price history but must be labeled `QUOTED`, never `ACTUAL`.

### Supplier offers

Require validity/effective date and should not be presented as current after expiration without confirmation.

## 9. Similarity policy v0.1

The exact weights remain an architecture/product decision, but the service must support a versioned configuration.

Initial candidate:

| Factor | Candidate weight |
|---|---:|
| Project type/class | mandatory or 15% |
| Scope/category overlap | 25% |
| Quantity/area similarity | 20% |
| Quote-category overlap | 10% |
| Material overlap | 10% |
| Recency | 10% |
| Location | 5% |
| Supplier overlap | 5% |
| Semantic scope similarity | optional 15%, with weights rebalanced |

Prototype historical scoring (size/recency/location) should be preserved as a regression reference, not accepted automatically as the final product policy.

## 10. Result contract

```ts
type ComparableProjectResult = {
  query: {
    activeProjectId: string;
    comparisonPolicyVersion: string;
    factorsUsed: string[];
    missingContext: string[];
  };
  matches: Array<{
    project: ProjectSummary;
    score: number;
    similarityFactors: SimilarityFactor[];
    materialDifferences: Difference[];
    economics: {
      quoted?: AmountObservation[];
      actual?: AmountObservation[];
      unitCostRange?: RangeObservation;
    };
    suppliers: SupplierObservation[];
    warnings: ResultWarning[];
    evidence: EvidenceReference[];
  }>;
  sufficiency: EvidenceSufficiencyDecision;
  synthesis: StructuredSynthesis;
  proposedActions: ProposedAction[];
};
```

## 11. User interface contract

### Primary result header

```text
6 comparable projects found
Evidence quality: Strong / Partial / Insufficient
```

### Comparable cards

Each card shows:

- project name;
- score;
- type/location/area;
- completion date;
- three strongest similarities;
- one or two important differences;
- economics available;
- warning/conflict indicator;
- `Open project` and `Compare` actions.

### Comparison view

Columns:

- current project;
- selected comparable projects.

Rows:

- scope;
- area/quantity;
- materials;
- suppliers;
- quote categories;
- quoted price;
- reconciled cost where authorized;
- schedule/outcome;
- evidence count/freshness.

### Evidence panel

Persistent side panel showing:

- objects used;
- exact sources;
- source type;
- version/effective date;
- authority;
- conflicts;
- open source action.

### Synthesis panel

Structured sections:

- **What history suggests**
- **Important differences**
- **Evidence gaps**
- **Recommended next step**

Avoid a single long chat paragraph.

## 12. Empty, error and uncertainty states

### No active project

Ask user to choose/create a project or supply enough context.

### No eligible history

Explain which eligibility filters removed records and offer broader non-cost similarity search where safe.

### Insufficient cost evidence

Show comparable projects but abstain from cost range.

### Conflicting evidence

List exact values/versions and request human resolution.

### Stale supplier data

Show historical value and age, never present as current.

### Retrieval/provider failure

Preserve any deterministic/retrieved results already verified; do not fake a complete answer.

### Permission restriction

Do not reveal existence, title or count of inaccessible records.

## 13. Intelligence tool contracts

Initial read-only tools:

```text
get_active_project_context
find_comparable_projects
get_project_comparison
get_project_quote_history
get_project_cost_history
get_supplier_history
get_source
get_evidence_conflicts
```

Action proposal tools:

```text
propose_review_action
prepare_supplier_clarification_draft
```

Execution remains a separate authorized service.

## 14. Suggested service boundaries

```text
ComparableProjectService
  eligibility
  structured similarity
  semantic similarity
  explanation

HistoricalCostService
  actual/quote authority
  normalization
  evidence sufficiency
  aggregation/range

ComparisonEvidenceService
  source selection
  conflict/freshness
  citations

ComparableProjectOrchestrator
  context
  service calls
  structured result
  optional model synthesis
  verification
```

The model may summarize and recommend from the structured result. It must not calculate or invent the comparison dataset.

## 15. Prototype behavior to port

- completed actual-cost eligibility;
- reconciliation checks;
- quote-only exclusion from actual-cost calculation;
- minimum three comparable/line observations as initial fixture rule;
- explainable size/recency/location factors;
- weighted median cost concept;
- explicit escalation, contingency and margin assumptions;
- source IDs and limitations;
- source/document versus register distinction;
- ambiguity clarification;
- evidence-ledger verification;
- structured follow-up/action handoff;
- bilingual terminology and suggestions.

## 16. Prototype behavior not to port directly

- static JSON as repositories;
- hard-coded 2026-10-18 snapshot logic;
- `localStorage` history/import state;
- self-attested sandbox costs as real actual costs;
- one fixed industry scoring policy;
- HTML-string rendering;
- prominent provider/model menu;
- demo token/session authorization;
- deterministic scripted answer mode as a substitute for product intelligence.

## 17. First demo narrative

1. Open `Xinyi Flagship Renovation`.
2. Ask: “Have we done something like this before?”
3. StrideBrain returns ranked historical projects.
4. Open the top match and inspect why it is similar.
5. Ask: “Where did those numbers come from?”
6. Evidence panel opens quote/cost/document sources.
7. Ask: “Compare our current quote.”
8. StrideBrain highlights category differences and limitations.
9. Create an internal review action for the largest anomaly.

This proves:

`Know → Think → Do`, with the beginning of `Learn` through preserved review/action outcomes.

## 18. Acceptance criteria

### Product

- user understands the outcome without knowing system architecture;
- one dominant workflow, not a collection of demo modules;
- result leads naturally to evidence and action.

### Data/domain

- tenant-scoped objects;
- quote versus actual cost distinction;
- versioned evidence;
- explainable scoring;
- insufficiency/conflict states.

### Intelligence

- no unsupported project/company claim;
- no cross-tenant retrieval;
- calculations deterministic;
- citations verified;
- ambiguous context clarified;
- source authority visible.

### UX

- structured cards/comparison/evidence panel;
- full English/Traditional Chinese critical-state parity;
- keyboard and screen-reader support;
- responsive layout;
- complete empty/loading/error/conflict states.

### Action

- creates only a proposal/internal review action;
- authorization checked server-side;
- audit event written;
- no automatic external send/financial approval.

### Quality

- canonical questions and adversarial cases pass agreed thresholds;
- zero critical permission, citation, calculation or tenant failures;
- browser journey passes against the exact preview commit.

## 19. Non-goals for the first slice

- autonomous quotation approval;
- current market pricing without current evidence;
- legal/compliance certification;
- full project-management replacement;
- generalized workflow builder;
- every industry pack;
- every connector;
- opaque “AI similarity” with no factor explanation.

## 20. Decision needed before build

Product Director, Product/UX Architect and Technical Architect must approve:

1. exact v0.1 factor/weight policy;
2. minimum data-authority states;
3. current project fixture and top comparable set;
4. source/evidence UI contract;
5. allowed first actions;
6. whether semantic similarity is in the first build or a later iteration;
7. performance and latency budget;
8. pilot roles and permissions.
