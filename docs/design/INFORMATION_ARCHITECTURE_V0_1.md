# StrideBrain v0.1 — Information Architecture

**Status:** Product/UX architecture for review  
**Scope:** Comparable Project Intelligence  
**Governing product contract:** `V0_1_DECISION_PACK.md`  
**Primary workflow:** “Have we done something like this before?”

## 1. IA objective

The first StrideBrain release must feel like one operating intelligence product, not a collection of AI features.

The information architecture is therefore organized around durable business objects and user context:

```text
organization
  → project
  → commercial/evidence context
  → intelligence
  → governed action
```

The user should not need to choose between a quotation agent, document agent, supplier agent, search module, evidence module, or historical-estimate module before asking a business question.

## 2. IA principles

1. **The active object is primary.** In the hero flow, that object is `PRJ-XINYI-026`.
2. **Global navigation is small and stable.** Capabilities do not become top-level navigation merely because they exist.
3. **StrideBrain is available in context.** It is not restricted to a separate chat destination.
4. **Structured intelligence precedes prose.** Comparisons, differences, authority, evidence, and actions are first-class UI.
5. **Evidence is adjacent, not buried.** Users can inspect why a result exists without leaving the workflow.
6. **Quoted and actual economics are separate.** Navigation and visual grouping must not collapse them.
7. **One governed action completes the loop.** The slice ends in an internal review action.
8. **Provider and agent plumbing stays hidden.** Normal users interact with StrideBrain, not model architecture.
9. **English and Traditional Chinese share the same hierarchy.** Localization cannot change information priority.
10. **Empty, stale, conflicting, restricted, and failed states retain context.** The user never lands on an unexplained blank screen.

## 3. Global product surfaces

```text
Home
Projects
Knowledge
StrideBrain
Settings
```

### 3.1 Home

**Purpose:** operational briefing and relevant entry points.

Home may show:

- assigned projects that need attention;
- recent comparisons;
- open internal review actions;
- evidence conflicts the user may resolve;
- context-aware suggestions such as “3 completed projects may help review Xinyi quote v3.”

Home does not become a generic KPI dashboard or a catalogue of modules.

The hero demonstration starts in the active project, not Home.

### 3.2 Projects

**Purpose:** the center of operational work.

Projects contains:

- active projects;
- completed historical projects;
- permission-aware search and filters;
- project workspace entry;
- recent project intelligence and action state.

The user cannot infer inaccessible projects from counts, gaps, or search results.

### 3.3 Knowledge

**Purpose:** explore approved organizational memory and connected objects.

Knowledge is object-oriented, not a file browser only. It may expose:

- projects;
- clients;
- suppliers;
- materials;
- documents and versions;
- approved cost/quote observations;
- decisions and lessons.

For v0.1, Knowledge primarily supports source inspection and object discovery. It is not a full ingestion/admin system.

### 3.4 StrideBrain

**Purpose:** universal intelligence interface across authorized company context.

StrideBrain supports questions that are not already anchored to one project. It resolves organization, role, permissions, language, and any named object before retrieval.

Inside a project, the same intelligence appears as a contextual control surface. The user should not be forced to leave the project and repeat context.

### 3.5 Settings

**Purpose:** organization, people, roles, locale, and product preferences.

For the L1 controlled demo, Settings may be intentionally limited. It must not simulate working tenant administration that does not exist.

## 4. Primary application shell

### 4.1 Desktop shell

```text
┌──────────────┬───────────────────────────────────────────────┐
│ Global nav   │ Top bar: organization · search · language    │
│              ├───────────────────────────────────────────────┤
│ Home         │ Main surface                                  │
│ Projects     │                                               │
│ Knowledge    │                                               │
│ StrideBrain  │                                               │
│ Settings     │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

The global sidebar is visually quiet. The project and its intelligence remain the focal point.

### 4.2 Context panel

A right-side panel is used for evidence and selected-object context.

It is not always open. It opens when the user selects:

- an evidence chip;
- an authority badge;
- a factor explanation;
- a financial observation;
- a conflict or stale warning;
- “Where did this come from?”

The panel preserves the main result state and selected comparison.

### 4.3 Mobile shell

On narrow screens:

- global navigation becomes a drawer;
- project local navigation becomes a horizontal/overflow tab row or compact menu;
- evidence becomes a full-height bottom sheet or route-level detail view;
- comparison tables become row-by-row comparison cards;
- action confirmation becomes a full-screen review step.

No critical information may exist only on hover.

## 5. Project workspace

### 5.1 Project header

The header establishes the active context before any question is asked.

Required elements:

- project name in the selected language;
- project ID;
- stage;
- client;
- location and area;
- assigned owner/manager;
- active quote version;
- demo-data classification;
- evidence coverage/freshness summary;
- contextual StrideBrain input.

The header must make clear that the user is operating on `PRJ-XINYI-026`, not searching the whole company without context.

### 5.2 Local project navigation

```text
Overview
Compare
Commercial
Evidence
Actions
```

#### Overview

Shows:

- project summary and stage;
- current scope;
- active quote summary;
- recent decisions/risks/actions;
- evidence health;
- contextual StrideBrain input;
- entry point to Comparable Project Intelligence.

#### Compare

Contains the current comparable-project run and selected side-by-side comparison.

It is the hero result surface, not a separate global “historical estimator” product.

#### Commercial

Separates:

- quotation versions;
- forecast direct cost;
- reconciled historical actuals from selected comparables;
- supplier offers where relevant;
- authority, freshness, and conflict states.

Commercial is permission-sensitive. Viewer economics may be redacted.

#### Evidence

Shows authorized project evidence and versions, plus evidence used by intelligence runs.

This is not arbitrary upload in v0.1.

#### Actions

Shows internal review actions and their origin.

The hero-created action appears here with:

- title;
- assignee;
- due date;
- status;
- origin comparison run;
- linked evidence;
- audit receipt summary.

### 5.3 Decisions and risks

Decisions and risks remain first-class domain objects but do not require dedicated local tabs in v0.1.

They appear contextually in:

- Overview;
- Compare synthesis;
- Evidence conflict states;
- Actions.

A future release may promote them if user research demonstrates a durable navigation need.

## 6. Comparable Project Intelligence hierarchy

The result surface uses this hierarchy:

```text
Result status and sufficiency
  → ranked comparable projects
  → selected comparison
  → structured implications
  → evidence/context
  → internal review action
```

### 6.1 Result status

Always visible:

- number of eligible comparable projects;
- number with eligible reconciled actual-cost evidence;
- comparison policy version;
- evidence quality/sufficiency;
- factors used and missing current-project context.

### 6.2 Ranked matches

Up to six primary cards appear in rank order.

Each card shows:

- score and band;
- evidence coverage;
- project type, area, location, completion date;
- three strongest similarities;
- up to two important differences/unknowns;
- economics authority badges;
- top evidence chips and source count;
- conflict/stale/insufficiency warnings;
- `Open project` and `Compare`.

### 6.3 Selected comparison

Default comparison columns:

- Xinyi current project;
- Neihu;
- Zhongshan;
- Nanjing.

Rows are grouped into:

1. project context;
2. scope and materials;
3. commercial observations;
4. programme/outcome;
5. evidence quality.

The user can replace a selected comparable, up to three history columns.

### 6.4 Structured synthesis

The synthesis is not a free-form answer block. It contains:

- **What history suggests**;
- **Important differences**;
- **Evidence gaps**;
- **Recommended next step**.

An optional model explanation may add concise natural-language framing but cannot replace or alter the structured sections.

### 6.5 Action transition

The recommended next step leads to one explicit control:

> Create internal review action / 建立內部審查事項

The action opens a review surface rather than writing state immediately.

## 7. Object entry and return behavior

Opening a comparable project or source must preserve:

- the active Xinyi project;
- current comparison run;
- selected comparable projects;
- scroll position where feasible;
- evidence panel selection;
- language;
- permission context.

Back navigation returns the user to the same comparison state.

## 8. URL and route model

Indicative routes:

```text
/[locale]
/[locale]/projects
/[locale]/projects/[projectId]
/[locale]/projects/[projectId]/compare
/[locale]/projects/[projectId]/commercial
/[locale]/projects/[projectId]/evidence
/[locale]/projects/[projectId]/actions
/[locale]/knowledge
/[locale]/stridebrain
/[locale]/settings
```

Comparison run, selected candidate IDs, and selected evidence may use validated query parameters or nested routes, but organization identity and permissions never come from URL trust.

Example:

```text
/zh-TW/projects/PRJ-XINYI-026/compare?run=CPI-RUN-0001&selected=PRJ-NEIHU-021,PRJ-ZHONGSHAN-018,PRJ-NANJING-023
```

The server validates every ID against the trusted runtime context.

## 9. Search and command behavior

Global search/command entry may navigate to authorized objects or invoke StrideBrain.

It must not reveal inaccessible object names or counts.

Examples:

- “Xinyi quote v3” → active quote within project;
- “Neihu flagship” → authorized completed project;
- “Have we done something like Xinyi?” → project-context comparison;
- “Where did the stone range come from?” → selected comparison evidence.

## 10. Language architecture

Language selection is an interface preference, not a data-authority change.

Rules:

- critical labels have `zh-TW` and `en` parity;
- domain IDs remain identical across languages;
- canonical taxonomy IDs remain language-neutral;
- translated names preserve the same object link;
- Taiwan business terminology is used rather than literal translations;
- numbers, currency, dates, and units follow locale presentation while preserving source values;
- switching language does not reset the comparison or selected evidence.

## 11. Progressive disclosure

### Primary surface

Shows what the user needs to decide:

- strongest matches;
- why;
- material differences;
- economics authority;
- evidence sufficiency;
- next action.

### Secondary detail

Shows:

- factor contributions;
- source/version details;
- calculation trace;
- supersession/conflict history;
- policy version details.

### Administrative detail

Shown only where appropriate:

- data classification;
- model/runtime metadata;
- correlation IDs;
- evaluation/debug traces.

Provider names are not part of the normal business experience.

## 12. Accessibility contract

The IA must support:

- keyboard navigation across global/local navigation;
- visible focus states;
- semantic landmarks;
- headings that reflect hierarchy;
- screen-reader labels for match scores, warnings, authority, and evidence counts;
- non-color-only authority/warning distinctions;
- focus return when evidence/action panels close;
- table alternatives on narrow screens;
- live-region announcements for comparison completion and action receipts.

## 13. Non-goals

The v0.1 IA does not include top-level navigation for:

- Quotations;
- Suppliers;
- Documents;
- Approvals;
- AI Team;
- Agents;
- Historical Estimator;
- Model selection;
- Connectors;
- Analytics.

Those concepts may appear inside the correct object context or later earn a surface through evidence and user need.

## 14. Acceptance criteria

- a first-time user understands the project context within five seconds;
- the hero question is available without leaving the project;
- comparable results are structured and useful without model prose;
- quotes and actual costs cannot be confused;
- evidence is one interaction away;
- action creation is explicit and reviewable;
- no normal workflow exposes model/provider architecture;
- critical flow works in English and Traditional Chinese;
- desktop and mobile preserve the same decision hierarchy;
- inaccessible records cannot be inferred through navigation or search.