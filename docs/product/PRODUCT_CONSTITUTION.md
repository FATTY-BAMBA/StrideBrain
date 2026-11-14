# StrideBrain v0.1 — Product Constitution

## Mission

StrideBrain turns accumulated company knowledge into intelligence that helps people understand, decide, and act.

## First customer

The first market wedge is Taiwan interior design and renovation firms with:

- meaningful historical project volume;
- multiple simultaneous projects;
- frequent quotation and revision work;
- supplier and subcontractor coordination;
- fragmented company knowledge across folders, drives, spreadsheets, messaging apps, and individual memory.

The trigger is not company size alone. It is the point at which the company has accumulated more useful operating knowledge than any one person can reliably keep in their head.

## Core promise

> **Every completed project should make the next project easier.**

## Product loop

`KNOW → THINK → DO → LEARN`

### Know

Projects, clients, documents, quotations, suppliers, materials, people, decisions, risks, changes, actions, and historical outcomes.

### Think

Resolve context, retrieve evidence, compare, reason, identify patterns, surface conflicts, and explain uncertainty.

### Do

Turn intelligence into bounded work: create a comparison, draft, review action, project decision, follow-up, or approved workflow step.

### Learn

Preserve decisions, outcomes, approved corrections, and evidence so future work starts with more intelligence.

## Product identity

StrideBrain is:

- a customer-facing operating intelligence platform;
- built around real company objects and relationships;
- evidence-backed and permission-aware;
- conversational where conversation helps;
- structured and action-oriented where prose alone is insufficient.

StrideBrain is not:

- a generic chatbot;
- a public model playground;
- a collection of disconnected AI tools;
- an agent marketplace;
- a prompt library;
- a full ERP, accounting system, or MRP replacement.

## Primary v0.1 surfaces

1. **Home** — an operational briefing showing what deserves attention.
2. **Projects** — active and historical project workspaces.
3. **Knowledge** — organisational memory and connected business objects.
4. **StrideBrain** — the universal intelligence interface across company context.
5. **Settings** — organisation, people, roles, integrations, language, and preferences.

Quotations, documents, suppliers, decisions, risks, and actions should normally be first-class objects inside these surfaces—not separate top-level mini-apps.

## Intelligence principles

1. Company-specific claims must be grounded in authorized company context and evidence.
2. Important answers must make their sources inspectable.
3. The system should resolve context before asking users to restate it.
4. Conversation is a control surface, not the whole application.
5. AI may synthesize, explain, classify, compare, and propose.
6. Deterministic code should calculate authoritative financial and workflow values.
7. Missing evidence, conflicting sources, and uncertainty must remain visible.
8. Useful answers should lead naturally to relevant actions.
9. Internal model, agent, tool, and provider complexity should remain mostly hidden from users.
10. The product should abstain rather than fabricate company-specific knowledge.

## Architecture principles

1. **Objects before features.**
2. **Relationships before isolated records.**
3. **Context before prompting.**
4. **Evidence beside intelligence.**
5. **Actions beside answers.**
6. **One intelligence, many internal tools.**
7. **Production foundations even when using fictional demo data.**
8. **One canonical model; tenant variation should be configuration-first.**
9. **No demo-only architecture that must be discarded later.**
10. **Build complete vertical user outcomes, not horizontal feature piles.**
11. **Human approval remains the boundary for consequential actions until explicitly redesigned.**
12. **Tenant isolation, provenance, and authorization live below the AI layer.**

## UX principles

1. A first-time user should understand the product without learning its architecture.
2. AI results should become structured interfaces—comparisons, cards, evidence, alerts, and actions—not only paragraphs.
3. The primary next action should be visually obvious.
4. Evidence and context should be one click away.
5. Technical details should be progressive disclosure, not the default experience.
6. English and Traditional Chinese must have parity in critical workflows.
7. Empty, loading, failure, stale, conflicting, and uncertain states are product states—not afterthoughts.
8. Model providers and authorization plumbing should not leak into normal user experience.
9. The interface should feel calm, deliberate, and operational rather than feature-dense.
10. Accessibility and responsive behavior are release requirements.

## First vertical slice

### Comparable Project Intelligence

Primary user question:

> **Have we done something like this before?**

StrideBrain should:

1. understand the active project or opportunity context;
2. retrieve and rank comparable historical projects;
3. explain why each project is similar;
4. reveal meaningful differences;
5. surface historical quotation and cost evidence;
6. identify relevant suppliers, materials, risks, and lessons;
7. show the underlying evidence;
8. compare the current project or quote against history;
9. recommend bounded next actions;
10. allow the user to act from the result.

This slice must prove the connection between the domain model, retrieval, reasoning, evidence, UI, and action.

## Demo principle

The demo is StrideBrain v0.1 populated with a realistic fictional organisation. It is not a separate disposable application.

Allowed:

- fictional organisations and projects;
- synthetic documents and quotations;
- controlled access;
- pilot-scale infrastructure;
- constrained integrations.

Not allowed:

- fake intelligence presented as live reasoning;
- hard-coded conclusions masquerading as retrieval;
- browser-held secrets;
- client-side authorization;
- one-off architecture intended to be thrown away;
- claims that exceed tested capability.

## Non-goals for v0.1

- giant workflow builder;
- dozens of industry-specific implementations;
- autonomous pricing approval;
- autonomous customer communication;
- full accounting, inventory, or project ERP replacement;
- public access to unrestricted models;
- multiple top-level agent personalities;
- feature additions without a place in the core product loop.

## Demo-ready standard

A new person should be able to:

- understand what StrideBrain is within roughly 30 seconds;
- ask a meaningful question within roughly 2 minutes;
- see company-specific intelligence within roughly 3 minutes;
- inspect evidence within roughly 5 minutes;
- turn intelligence into an action within roughly 7 minutes;
- leave the first session understanding why StrideBrain becomes more valuable when connected to their own company.

## Quality rule

No capability ships merely because it works technically.

Every release must be judged across:

- product coherence;
- user outcome;
- UX clarity;
- visual quality;
- intelligence quality;
- grounding and evidence correctness;
- actionability;
- engineering quality;
- localization;
- accessibility;
- reliability;
- security;
- tenant isolation;
- observability and recovery.
