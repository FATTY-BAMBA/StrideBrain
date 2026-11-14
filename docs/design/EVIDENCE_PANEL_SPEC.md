# StrideBrain v0.1 — Evidence and Context Panel Specification

**Status:** Product/UX architecture for review  
**Applies to:** Comparable Project Intelligence and current-quote comparison

## 1. Purpose

The evidence panel makes StrideBrain’s intelligence inspectable without forcing the user to leave the comparison or read a technical bibliography.

It must answer:

1. What claim or value am I inspecting?
2. What exact source supports it?
3. What type of observation is it?
4. How authoritative is it?
5. Is it current, stale, superseded, conflicted, or incomplete?
6. How was a derived value calculated?
7. Can I open the underlying business object?

The panel is not a generic document preview sidebar. It is a claim-to-evidence interface.

## 2. Entry points

The panel opens when the user selects:

- an evidence chip on a comparable-project card;
- a quoted/forecast/actual financial value;
- an authority badge;
- a similarity factor;
- a conflict, stale, or insufficiency indicator;
- a calculation percentage/range;
- “Where did this come from?”;
- a source count;
- an evidence link in the action-review surface.

Every trigger supplies a validated selection context:

```ts
type EvidenceSelection = {
  comparisonRunId: string;
  claimId?: string;
  observationId?: string;
  evidenceReferenceId?: string;
  factorKey?: string;
};
```

The server resolves the actual organization and access context.

## 3. Panel hierarchy

```text
Panel header
  → selected claim/value
  → authority and status summary
  → supporting evidence list
  → calculation/factor trace when applicable
  → conflict/supersession/freshness context
  → open underlying object
```

## 4. Panel header

Required elements:

- title: `Evidence / 資料依據`;
- current project/comparison context;
- selected claim label;
- close control;
- optional previous/next evidence navigation within the current bundle.

Example:

```text
Evidence
Imported-stone forecast is 18% above eligible historical actual median
Xinyi quote v3 · Comparison CPI-RUN-0001
```

The header must not display provider/model information.

## 5. Claim summary

The first panel section states the inspected claim in plain business language.

Example:

```text
Current observation
Xinyi imported-stone forecast direct cost: NT$1,920,000

Historical comparison
Eligible reconciled actual median: NT$1,627,000

Derived variance
+18.0%
```

Each line includes a semantic type label:

- Forecast direct cost;
- Reconciled actual cost;
- Derived comparison.

The claim summary never uses one unlabeled “cost” field.

## 6. Authority summary

Display as text-plus-icon badges:

### Observation type

- `Quoted price / 歷史報價`
- `Supplier offer / 供應商報價`
- `Forecast direct cost / 預估直接成本`
- `Reconciled actual cost / 已核對實際成本`

### Authority state

- `Observed / 已擷取`
- `Human reviewed / 已人工檢視`
- `Approved commercial / 已核准商務紀錄`
- `Reconciled actual / 已核對實際紀錄`
- `Superseded / 已由新版取代`
- `Conflicted / 資料不一致`

### Condition

- `Current`;
- `Historical`;
- `Stale`;
- `Conflicted`;
- `Insufficient evidence`;
- `Restricted`.

Badges must use distinct labels and icons in addition to color.

## 7. Evidence list

Each evidence row/card contains:

```text
source title
source object type
object/version ID
effective/recorded date
evidence locator
authority state
data classification
claim/value supported
freshness/supersession/conflict status
open-source action
```

Example:

```text
Neihu final project cost summary
ProjectCostVersion · COST-NEIHU-021-FINAL-v2
Completed/effective: 2025-06-30
Locator: Stone & hard finishes / normalized direct-cost line
Authority: Reconciled actual
Supports: NT$1,590,000 total; NT$2,607/m² normalized observation
[Open cost version]
```

### Source types

The design must support:

- Project record;
- QuoteVersion;
- QuoteItem;
- ProjectCostVersion;
- CostLine;
- SupplierOffer;
- SupplierOfferItem;
- DocumentVersion;
- structured register record;
- approved human-entered fact.

The source type appears beside the title so users do not mistake a linked document for proof of a register value.

## 8. Exact locator display

Evidence locators may include:

- document page and section;
- spreadsheet sheet, row, and cell range;
- quote version and line IDs;
- cost version and cost-line IDs;
- structured-record field key;
- document text range;
- approved fact ID.

Examples:

```text
Page 14 · Final cost summary · Stone finish
Sheet “Final cost” · Rows 42–48 · Cells F42:F48
Quote v4 · Items QI-042–QI-048
Field: finalDirectCost
```

If the source cannot provide a precise locator, show the best available locator and label the granularity honestly.

## 9. Calculation trace

For derived values, include an expandable trace.

### Similarity score trace

Show:

- factor;
- source values;
- factor state;
- normalized score;
- weight;
- contribution;
- evidence references;
- total reconciliation;
- policy `CPI-SIM-1.0`.

Example:

| Factor | Values | Score | Weight | Contribution |
|---|---|---:|---:|---:|
| Project subtype | Retail flagship / Retail flagship | 1.00 | 15 | 15.0 |
| Scope overlap | 7 shared / 8 union | 0.875 | 25 | 21.9 |
| Area | 640 / 610 m² | 0.93 | 20 | 18.6 |

Unknown factors show `UNKNOWN`, zero contribution, and reduced evidence coverage.

### Financial comparison trace

Show:

- current observation ID/type/authority;
- eligible historical observation IDs;
- exclusions and reasons;
- normalization units;
- aggregation method;
- median/range values;
- calculation version;
- resulting variance;
- minimum-observation threshold.

A threshold of three observations is a product safety rule and must not be labeled a statistical confidence interval.

## 10. Exclusion and insufficiency display

When evidence is excluded, the panel may show aggregated exclusion reasons without leaking inaccessible records.

Allowed examples:

- quote-only record excluded from actual-cost aggregate;
- superseded version excluded;
- unresolved conflict excluded;
- incompatible unit excluded;
- stale supplier offer shown historically but excluded from current-price claim;
- insufficient category observations.

For unauthorized records, do not display titles, IDs, values, or exact counts unless policy explicitly permits disclosure.

Example:

```text
Actual-cost range unavailable
2 eligible reconciled observations; 3 required.

Quoted-price history remains available separately.
```

## 11. Conflict presentation

A conflict block contains:

- exact affected claim/field;
- each accessible conflicting record;
- values;
- versions/dates;
- authority states;
- why neither was selected;
- effect on calculation;
- next authorized step.

Example:

```text
Conflicting final stone values

COST-DAAN-016-FINAL-v1 · NT$1,240,000 · RECONCILED_ACTUAL
ADJ-DAAN-016-03 · NT$1,310,000 · APPROVED_COMMERCIAL

No explicit supersession relationship exists. This project’s stone value is excluded from the aggregate.
```

The panel does not offer conflict resolution to Mei Lin because her role cannot resolve financial authority. It may identify the Financial Reviewer as the appropriate role without inferring a specific person’s authority.

## 12. Supersession presentation

A superseded source remains inspectable.

Display:

- `Superseded` status;
- successor record/version;
- supersession date/reason where recorded;
- whether the old value was excluded from current calculations.

The active successor is visually primary; the old version remains available for audit.

## 13. Supplier-offer freshness

For supplier offers show:

- offer date;
- `validUntil` when present;
- age;
- freshness calculation;
- `Stale` status where applicable;
- historical-only use.

Required copy:

> Historical supplier offer—not current pricing.  
> 歷史供應商報價，非目前有效價格。

Do not show a stale offer as evidence for a current market-price conclusion.

## 14. Source preview

Where supported, the panel may render a safe preview:

- structured quote/cost lines;
- document excerpt;
- table rows;
- page image/text;
- linked project metadata.

Rules:

- preview content is escaped/sanitized;
- untrusted source instructions never influence StrideBrain policy;
- access is checked before retrieval;
- no unrestricted download URL is exposed;
- sensitive values respect field-level permissions;
- the preview distinguishes source text from StrideBrain interpretation.

## 15. Navigation behavior

`Open underlying object` navigates to the canonical object view while retaining a return link to the comparison run.

Examples:

- open quote v4;
- open final-cost version;
- open project;
- open document version;
- open supplier offer.

The user returns to the same selected comparable and table row.

## 16. Panel modes

### Claim mode

Shows all evidence supporting one structured claim.

### Source mode

Shows one source and all claims in the current result that rely on it.

### Factor mode

Shows similarity-factor calculation and evidence.

### Conflict mode

Shows incompatible records and impact.

### Action evidence mode

Shows evidence that will be linked to the proposed internal review action.

Mode switching does not broaden authorization.

## 17. Desktop behavior

- recommended width: 400–480 px depending on viewport;
- overlays or compresses main area only when enough width remains;
- resizable only if it does not complicate v0.1 accessibility;
- sticky header and selected-claim summary;
- evidence list scrolls independently;
- closing preserves comparison scroll/selection.

## 18. Mobile behavior

Use a full-height bottom sheet or detail route.

Required:

- clear selected claim at top;
- single-column source cards;
- sticky close/back and `Open source` controls;
- calculation tables rendered as stacked key/value groups;
- focus trapped appropriately for modal sheet;
- return to exact trigger/state.

## 19. Accessibility

- panel uses dialog or complementary-region semantics according to implementation;
- heading receives focus on open;
- close control is first/last reachable as appropriate;
- status badges include readable text;
- source cards use headings and definition lists;
- calculation tables have captions and headers;
- conflict/insufficiency is announced without repeating every evidence row;
- focus returns to the opening trigger;
- evidence count labels are understandable without visual context.

## 20. Security and non-disclosure

The panel must not:

- fetch all evidence and hide unauthorized rows client-side;
- reveal hidden source IDs or titles;
- show raw storage URLs;
- expose provider/model traces to business users;
- show data from a different organization;
- use an organization ID supplied only by the URL/browser;
- include inaccessible evidence in model context.

If a result was produced under broader permissions than the current session, the panel rechecks access and redacts/rejects as required.

## 21. Error states

### Source unavailable

The claim remains visible only if already verified in the stored comparison run. The panel states the source cannot currently be opened and offers retry.

### Access changed

The panel closes or redacts the source and states that access is no longer available. It does not preserve sensitive preview content.

### Stale comparison

The panel remains inspectable but shows the run’s stale status and blocks new action creation.

### Preview unsupported

Metadata, locator, authority, and claim relationship remain available even when inline preview is unavailable.

## 22. Acceptance criteria

- every material hero-flow amount opens exact evidence;
- quote/register values are not misattributed to linked document text;
- observation type and authority are always visible for economics;
- factor contributions reconcile to the similarity score;
- actual-cost exclusions and sufficiency are understandable;
- stale offers are clearly historical;
- conflicts show exact accessible records and calculation impact;
- inaccessible evidence does not leak;
- desktop/mobile/keyboard behavior preserves context;
- the panel supports the action-review evidence bundle without duplicating a separate bibliography experience.