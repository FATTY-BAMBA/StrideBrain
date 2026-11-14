# Comparable Project Intelligence — User Flow

**Status:** Product/UX architecture for review  
**Hero project:** `PRJ-XINYI-026`  
**Hero user:** Mei Lin / 林美玲  
**Target duration:** 7–9 minutes

## 1. User job

Mei Lin needs to determine whether the current Xinyi quotation is reasonably aligned with relevant completed projects, which differences explain the variance, how trustworthy the evidence is, and what must be reviewed before internal approval.

The flow must answer this without requiring her to:

- select a model;
- choose an agent;
- search separate quotation/document/supplier modules;
- restate organization and project context;
- interpret an opaque similarity score;
- trust a long prose answer without evidence.

## 2. Preconditions

Trusted runtime context resolves:

```text
organization: Horizon Atelier
user: Mei Lin
membership/permissions: assigned project + commercial_actual_read
locale: zh-TW or en
surface: project
active project: PRJ-XINYI-026
active quote: Q-XINYI-026 v3
```

The active project context contains enough mandatory structured data for `CPI-ELIGIBILITY-1.0` and `CPI-SIM-1.0`.

## 3. End-to-end happy path

## Step 1 — Enter the active project

### Entry

User opens `PRJ-XINYI-026` from Projects, Home, or a direct authorized link.

### UI

The project header shows:

- Xinyi Flagship Renovation / 信義旗艦店裝修;
- quote review stage;
- 640 m²;
- Xinyi District;
- active quote v3;
- NT$16,480,000 proposed price before tax;
- NT$12,650,000 forecast direct cost;
- demo-data classification;
- evidence health summary.

The Overview foregrounds the contextual StrideBrain entry:

> Have we done something like this before?  
> 我們以前做過類似的案子嗎？

### Success condition

Within five seconds, the user understands:

- which project is active;
- what stage it is in;
- that StrideBrain already has project context;
- the obvious next action.

## Step 2 — Run the comparison

### User action

User selects the suggested question or types it in the contextual composer.

### Immediate interaction

The composer becomes a compact run-status row. The user remains on the project page.

The application announces:

1. checking current-project context;
2. filtering eligible history;
3. ranking comparable projects;
4. assembling evidence/economics.

Technical tool names are not displayed.

### Loading experience

Show stable skeletons for:

- result summary;
- three initial match cards;
- synthesis sections.

Do not render fake numbers or placeholder project names.

Provide `Cancel` only when cancellation is safe and meaningful. The user can continue to browse project Overview while the run completes.

### Deterministic result

Structured results appear when the deterministic service completes, regardless of optional AI explanation status.

Expected result header:

```text
6 comparable projects found
3 have eligible reconciled actual-cost evidence
Comparison policy: CPI-SIM-1.0
```

### Optional explanation

A concise explanation may arrive afterward. It is visually secondary and cannot reorder or alter results.

## Step 3 — Understand ranked matches

### Initial layout

The first three match cards are prominent; results four to six remain accessible below.

Expected ordering:

1. `PRJ-NEIHU-021` — 88, Strong match;
2. `PRJ-ZHONGSHAN-018` — 81, Strong match;
3. `PRJ-NANJING-023` — 79, Relevant match;
4. `PRJ-DAAN-016` — 71;
5. `PRJ-SONGSHAN-020` — 69;
6. `PRJ-BANQIAO-015` — 63.

### Card comprehension

The Neihu card shows at minimum:

- score/band;
- evidence coverage;
- 610 m², Taipei, completed 2025-06-30;
- same retail-flagship subtype;
- strong scope and quote-category overlap;
- imported-stone material overlap;
- domestic-lighting difference;
- 20-week versus 16-week programme difference;
- `Quoted` and `Reconciled actual` badges;
- top two evidence chips;
- source count;
- `Open project` and `Compare`.

### Factor detail

Selecting the score/factor area expands or opens a detail popover/panel showing:

- each known factor;
- normalized factor value;
- weight;
- contribution;
- unknown factors;
- total reconciliation to 88;
- policy version.

This detail is progressive disclosure, not the default card density.

## Step 4 — Select comparable projects

### Default selection

The comparison table initially includes:

- Xinyi current project;
- Neihu;
- Zhongshan;
- Nanjing.

### User controls

User can:

- replace one comparable with another eligible result;
- select up to three historical projects;
- reset to recommended top three;
- open a historical project without losing the comparison run.

### Constraints

- inaccessible projects never appear;
- broader matches are clearly separated;
- projects with incomplete actual-cost evidence may still be selected, but their economics remain labeled/limited;
- selection changes do not recompute ranking; they update the comparison view.

## Step 5 — Inspect evidence

### Entry points

Evidence panel opens from:

- an evidence chip;
- a financial observation;
- an authority badge;
- a stale/conflict warning;
- factor detail;
- “Where did those numbers come from?”

### Panel behavior

The selected claim appears at the top, followed by the exact supporting evidence.

Example:

```text
Claim
Neihu reconciled actual direct cost: NT$11,580,000

Authority
RECONCILED_ACTUAL

Source
COST-NEIHU-021-FINAL-v2
Locator: Final cost summary / total direct cost
Effective/completed date: 2025-06-30
```

The panel can also show:

- superseded records;
- stale supplier offer history;
- conflict state;
- access classification;
- calculation trace.

### Natural-language request

If the user asks “Where did those numbers come from?”, the UI opens/highlights the evidence bundle for the currently selected finding. A short answer may orient the user, but the primary response is navigable evidence.

## Step 6 — Compare the current quote

### User action

User asks:

> Compare our current quote with the strongest precedents.  
> 把目前報價和最接近的歷史專案比較一下。

or selects `Compare current quote`.

### Comparison table

Columns:

- Xinyi v3;
- Neihu;
- Zhongshan;
- Nanjing.

Grouped rows:

#### Context

- subtype;
- area;
- location;
- completion/target date;
- programme.

#### Scope/materials

- major scope categories;
- imported stone;
- lighting specification;
- custom millwork;
- signage;
- supplier overlap.

#### Commercial observations

- proposed/approved quoted price;
- forecast direct cost;
- reconciled actual direct cost;
- normalized per-m² values;
- category observations;
- observation type and authority;
- sufficiency.

#### Evidence

- coverage;
- freshness;
- conflict count;
- source count.

### Required structured highlights

- overall quoted price approximately 7% above top-three quoted-price median;
- forecast direct cost approximately 6% above top-three reconciled-actual median;
- imported stone approximately 18% above eligible reconciled-actual median;
- lighting approximately 9% above quoted history, with insufficient actual-cost evidence;
- millwork approximately aligned;
- signage below quoted history but materially different scope;
- accelerated programme is different but has no quantified premium evidence.

Every percentage opens its calculation/evidence trace.

## Step 7 — Review synthesis and uncertainty

The synthesis panel contains fixed structured sections.

### What history suggests

The current quotation is above relevant history, with the strongest evidence-backed variance in imported stone.

### Important differences

The current project has a shorter programme and higher-specification lighting.

### Evidence gaps

Lighting has only two reconciled actual observations; current supplier pricing/availability is not verified.

### Recommended next step

Validate imported-stone and lighting assumptions before internal quote approval.

### Prohibited presentation

Do not show:

- “The quote is overpriced”;
- “Supplier is overcharging”;
- a fabricated schedule premium;
- one blended “historical cost” value;
- green/red judgment based only on price variance.

## Step 8 — Prepare an internal review action

### Entry

User selects:

> Create internal review action  
> 建立內部審查事項

### Review surface

A side sheet or full-screen step displays:

- action type: Internal review;
- project;
- title;
- rationale;
- assignee;
- due date;
- linked comparison run;
- evidence references;
- mandatory uncertainty statements;
- explicit consequence of confirmation.

Default title:

> Validate imported-stone and lighting assumptions for Xinyi quote v3

The user may edit title, rationale, authorized assignee, and due date.

Required uncertainty/evidence lines cannot be removed silently. If the user edits them out, validation restores them or blocks confirmation with a clear explanation.

### Confirmation

Primary button:

> Create internal review action  
> 建立內部審查事項

Secondary:

> Cancel / 取消

No vague `Approve AI`, `Run agent`, or `Execute` language.

## Step 9 — Action receipt

### Success

After the server returns success, show a receipt containing:

- action ID;
- title;
- project;
- assignee;
- due date;
- status `OPEN`;
- origin comparison run;
- evidence count;
- audit timestamp;
- `View in project actions`.

The current comparison remains visible.

### Project integration

The created action appears in the project Actions view and the Overview’s open-action summary.

### Narrative closure

The user can see that history informed a decision and produced governed work. Completing the review later can become a new approved learning artifact.

## 4. Alternate and failure flows

## A. No active project

The system asks the user to select a project or provide minimum structured context.

Do not run a company-wide ambiguous comparison and pretend it answers a specific project question.

## B. Missing mandatory current-project context

Show the missing fields and an authorized way to complete them.

Example:

> Area is required before comparable projects can be ranked.

The system may show unranked related history only if clearly labeled and policy allows it.

## C. No eligible historical projects

Show:

- no eligible matches;
- high-level exclusion categories without leaking inaccessible records;
- safe next steps: review project classification, complete context, or explore general company knowledge.

Do not display the number or names of unauthorized projects.

## D. Comparable projects but insufficient actual-cost evidence

Show ranked projects and quoted-price history.

The actual-cost area states:

> Insufficient actual-cost evidence / 實際成本資料不足

No actual-cost range is displayed.

## E. Conflicting authoritative records

Show exact conflicting records and exclude the value from aggregates.

The user may inspect evidence. Only an authorized Financial Reviewer/Admin may enter a future conflict-resolution flow; v0.1 does not resolve it from the comparison.

## F. Stale supplier offer

Show the historical offer, effective/valid date, and `Stale` label.

Do not call it current pricing.

## G. Viewer permission

The Viewer may run a comparison with sensitive economics redacted.

The UI explains that commercial details are restricted without revealing hidden values or record existence.

`Create internal review action` is absent or disabled with a role-appropriate explanation. Server denial remains authoritative.

## H. AI explanation unavailable

Structured result, evidence, and action flow remain usable.

A compact message states:

> The optional explanation is unavailable. The verified comparison is still complete.

Do not label the whole workflow as failed.

## I. Comparison becomes stale

If the active quote, authority state, policy, or material evidence changes, show:

> This comparison is out of date. Refresh it before creating an action.

The old run remains inspectable/auditable but cannot create new state.

## J. Action creation fails

No action is created and no success receipt appears.

The review surface preserves user edits and gives a specific safe next step:

- permissions changed;
- assignee unavailable;
- comparison stale;
- evidence access changed;
- transient service failure.

## 5. Interaction rules

1. `Enter` submits from the composer; `Shift+Enter` inserts a line break.
2. Result cards and evidence chips are keyboard reachable.
3. Selected comparable state is announced and visually persistent.
4. Opening evidence moves focus to the panel heading; closing returns focus to the trigger.
5. Loading status uses an accessible live region without excessive announcements.
6. Financial values include observation/authority in accessible labels.
7. Relative time is not used for historical snapshot dates where it could mislead.
8. Language switching retains project, run, selection, panel, and draft action state.
9. Errors never expose provider names, credentials, hidden records, or raw stack messages.
10. The UI never claims a write succeeded until the service returns the action receipt.

## 6. Analytics and evaluation events

The experience should emit privacy-safe product events such as:

```text
project_workspace_opened
comparison_started
comparison_completed
comparison_empty
comparable_selected
evidence_panel_opened
quote_comparison_opened
proposed_action_opened
action_creation_confirmed
action_created
action_creation_failed
optional_explanation_failed
```

Events carry organization-scoped internal identifiers and policy versions, not document bodies or sensitive financial values by default.

## 7. Acceptance criteria

- hero flow completes within 7–9 minutes;
- deterministic results are useful without optional explanation;
- canonical ranking is preserved;
- score and factors reconcile;
- quotes, forecasts, offers, and actuals remain visibly distinct;
- every material financial claim opens exact evidence;
- lighting abstains from an actual-cost range;
- uncertainty is explicit and useful;
- one authorized internal review action is created with a receipt;
- Viewer action creation is denied safely;
- English and Traditional Chinese flows have parity;
- keyboard and responsive journeys preserve all critical decisions.