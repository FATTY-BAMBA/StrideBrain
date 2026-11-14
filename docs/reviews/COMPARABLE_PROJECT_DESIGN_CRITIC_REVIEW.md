# Independent Design Critic Review — Comparable Project Intelligence

**Review scope:** v0.1 information architecture, user flow, state matrix, evidence panel, and low-fidelity wireframes  
**Reviewer stance:** adversarial business-user, accessibility, bilingual, and product-coherence review  
**Verdict:** **PASS FOR TECHNICAL RECONCILIATION; HIGH-FIDELITY DESIGN AND BUILD REMAIN BLOCKED**

## 1. Executive assessment

The proposed experience successfully moves StrideBrain away from the prototype’s module catalogue and toward one coherent project-centered workflow.

The strongest improvement is that the product no longer asks users to understand its internal architecture. The user enters a project, asks a business question, receives structured evidence-backed intelligence, and creates one governed action.

The design is ready to reconcile with Technical Architecture, provided the implementation preserves the required state/authority boundaries and does not simplify the experience back into a chat answer plus cards.

## 2. KEEP

### Project-first entry

Starting directly in `PRJ-XINYI-026` makes the context obvious and avoids a generic dashboard or chatbot introduction.

### Five-surface global IA

```text
Home
Projects
Knowledge
StrideBrain
Settings
```

This is appropriately restrained. Quotes, suppliers, evidence, risks, decisions, and actions remain accessible in context without becoming competing products.

### Structured comparison result

The hierarchy is strong:

```text
summary
→ ranked matches
→ selected comparison
→ structured synthesis
→ evidence
→ action
```

This is much more credible than one long model response.

### Explicit authority vocabulary

Quoted price, supplier offer, forecast direct cost, and reconciled actual cost remain semantically and visually distinct.

### Evidence as a claim interface

The evidence panel begins with the selected claim/value and then shows supporting sources. This is better than opening a generic document list.

### Honest insufficiency and conflict states

The lighting example correctly abstains from actual-cost conclusions while preserving quoted-price history. Conflict and stale records remain visible without being silently resolved.

### Separate action confirmation

The proposed action review and receipt make the `Think → Do` transition real while preserving human accountability.

### AI-failure resilience

The optional explanation can fail without removing the verified comparison. This must remain a core acceptance test.

## 3. CHANGE / IMPLEMENTATION REQUIREMENTS

These are not requests to expand product scope. They are conditions for a high-quality implementation.

### 3.1 Prevent badge overload

The specifications include many authority, freshness, conflict, evidence, and data-state labels. A literal implementation could become visually noisy.

Required approach:

- show one primary economics label per value;
- show one condition indicator only when material;
- move detailed authority/classification into the evidence panel;
- use consistent icon/text patterns;
- avoid rows of five colored pills.

### 3.2 Keep score explanation business-readable

The factor trace is valuable but should not dominate the primary experience.

Default card copy should explain human reasons such as:

- same retail-flagship subtype;
- similar area;
- overlapping stone/ceiling/millwork scope.

Weights, normalized values, and formulas belong in progressive disclosure.

### 3.3 Make comparison density adaptable

Four-column commercial tables can become unreadable in Chinese or on smaller laptop screens.

Implementation must support:

- sticky row labels;
- horizontal scroll with visible context;
- user-selected columns;
- row focus/highlight;
- stacked mobile cards;
- a two-column compact mode where needed.

### 3.4 Protect the primary action from premature prominence

`Create internal review action` should appear only after the user has a complete structured synthesis and sufficient accessible evidence.

It must not look like a generic AI recommendation button at the top of the result.

### 3.5 Clarify evidence coverage language

A percentage such as 92% can imply mathematical certainty.

The implementation should pair any percentage with a plain-language label and explain what coverage measures. Consider displaying:

> Good coverage · 92% of weighted comparison factors supported

rather than a naked percentage.

### 3.6 Avoid presenting top matches as objective truth

Use language such as:

> Ranked by CPI-SIM-1.0

and make important differences prominent. Do not label the first result “best project” or “most successful precedent.”

### 3.7 Localize semantics, not only strings

Traditional Chinese copy must be reviewed as a complete workflow.

Particular attention:

- `具參考價值` versus overly literal “relevant” wording;
- `已核對實際成本` must not imply an audit beyond the authority model;
- `資料完整度` needs an accessible explanation;
- action and conflict language should use ordinary Taiwan workplace terminology.

### 3.8 Preserve context when opening sources

Deep links to source objects must provide an obvious return path to the exact comparison run and selected finding. A generic browser Back behavior alone is insufficient.

### 3.9 Design redaction without teasing hidden data

Viewer states should not show blurred numbers, masked digits, or hidden-record counts. Use direct permission language and preserve useful non-sensitive comparison factors.

### 3.10 Keep loading brief and honest

Do not over-animate the four comparison stages or make a fast deterministic result feel artificially “AI-like.” If the result returns quickly, transition directly to it.

## 4. REMOVE / DO NOT INTRODUCE

- top-level AI Team or agent navigation;
- provider/model selector in the hero flow;
- a separate “Historical Estimator” module;
- a chat transcript as the main comparison artifact;
- decorative AI activity indicators that imply reasoning not occurring;
- green/red price judgments;
- default exposure of formulas/policy internals;
- inaccessible-record placeholders;
- success toasts without an action receipt;
- generic module cards on project Overview;
- a full-screen error when verified project context can remain useful.

## 5. Five-second comprehension test

A first-time user viewing the project Overview should be able to answer:

1. Which project am I viewing?
2. What stage is it in?
3. What quotation is active?
4. What can StrideBrain help me do here?
5. Is this demo or real company data?

A first-time user viewing comparison results should be able to answer:

1. How many matches were found?
2. Which are strongest?
3. Why are they similar?
4. Are the economics quoted, forecast, or actual?
5. What should I review next?

High-fidelity design fails if these answers require opening tooltips or reading a long paragraph.

## 6. Accessibility review

The written contracts cover the correct areas. Implementation must verify:

- keyboard-complete card selection and table comparison;
- focus return from evidence/action sheets;
- accessible labels that include authority for financial values;
- status indicators that do not rely on color;
- live-region restraint;
- meaningful heading hierarchy;
- mobile table alternatives;
- visible focus in light/dark appearance if both are supported;
- adequate target sizes and no hover-only controls.

## 7. Responsive review

Desktop wireframes are coherent.

On mobile, the product should not attempt to preserve the desktop four-column table. The required row-card transformation is the right approach.

The mobile primary sequence should be:

```text
summary
→ ranked cards
→ selected finding
→ compare row cards
→ synthesis
→ action
```

The evidence sheet should be full height and retain the selected claim at the top.

## 8. Bilingual review

The architecture properly treats bilingual behavior as system design rather than inline text replacement.

Before implementation approval, the UX copy set should include:

- all state messages;
- authority labels;
- match bands;
- factor names;
- evidence/source types;
- action confirmation/receipt;
- redaction and permission states;
- stale/conflict/insufficiency copy.

IDs, amounts, policy versions, and source relationships must remain stable across language switching.

## 9. Product-coherence review

The design serves the Product Constitution:

- **Know:** project and historical evidence;
- **Think:** explainable ranking and comparison;
- **Do:** internal review action;
- **Learn:** origin/evidence preserved for later outcome capture.

It does not attempt to rebuild the prototype’s full feature catalogue.

## 10. Required technical reconciliation

Technical Architecture must confirm that the design can support:

- a stable ComparisonRun that can be reopened;
- selected comparable IDs without client-side trust;
- claim-level EvidenceReference bundles;
- authority and redaction before data reaches UI/model;
- exact factor contributions;
- structured synthesis independent of AI prose;
- action proposal expiry/staleness;
- atomic action/audit creation;
- localized canonical labels;
- performance targets without loading theatre.

Any technical compromise that removes these contracts requires Product/UX review.

## 11. Final verdict

**PASS FOR TECHNICAL RECONCILIATION.**

The UX architecture is coherent enough to guide Technical Architecture and implementation planning.

It is not approval to begin high-fidelity design or application coding in isolation. Build authorization requires:

1. Technical Architecture acceptance;
2. reconciliation of shared result/evidence/action contracts;
3. component/state acceptance tests;
4. a design QA plan against the exact preview build.

The implementation should optimize for calm clarity, not visual novelty. The “wow” must come from connected company intelligence, explainable evidence, and safe action—not decorative AI styling.