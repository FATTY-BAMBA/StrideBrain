# StrideBrain Prototype Product Flow & UX Audit

## 1. Audit lens

This review evaluates the prototype as a business user would experience it, not as a collection of source files.

For each workflow it records:

- user goal;
- entry point;
- inputs;
- outputs;
- evidence;
- actions;
- current state handling;
- bilingual status;
- production conversion.

## 2. Global experience finding

The prototype demonstrates many useful outcomes, but its navigation presents too many capabilities as peer modules:

- Overview;
- Copilot;
- AI Team;
- Projects;
- Knowledge;
- Quotations;
- Work orders;
- Customer service;
- Approvals;
- Suppliers;
- Analytics;
- Historical estimate;
- Operational checks;
- Document intelligence;
- Industry playbook;
- Learning and feedback.

This is strong for demonstrating breadth but weak for product coherence.

The new product should organize around a smaller set of enduring surfaces:

1. **Home** — operational briefing and attention.
2. **Projects** — active and historical work.
3. **Knowledge** — documents, references and organizational memory.
4. **StrideBrain** — universal contextual intelligence.
5. **Settings** — organization, users, integrations and policies.

Quotes, suppliers, risks, decisions, approvals, documents and actions should appear as contextual objects rather than independent destinations by default.

---

## 3. Workflow inventory

## 3.1 Controlled demo entry

### User goal

Enter a protected demonstration without being asked repeatedly for access.

### Current entry

- guest invitation link;
- guest session cookie;
- staff session/token;
- demo session status checks.

### Inputs

Invitation code/token, guest link or staff access.

### Outputs

Bounded Copilot/model access and demo workspace state.

### Current strengths

- failed access is explicit;
- guest/staff modes are separated;
- access can limit model choices;
- session state has dedicated regression tests;
- the user is not asked to paste provider credentials.

### Current weaknesses

- demo session logic is complex and tightly coupled to one preview;
- the distinction between invitation access and provider authorization has previously leaked into UX;
- it is not organization membership or customer authentication.

### Classification

HISTORICAL REFERENCE, RETIRE AFTER PARITY.

### Production conversion

Trusted identity → invitation acceptance → membership → organization → role/assignment → authorized workspace.

---

## 3.2 Overview / operational briefing

### User goal

Understand what requires attention without opening multiple modules.

### Current entry

Overview navigation.

### Inputs

Synthetic project, quote, work-order, approval and activity arrays.

### Outputs

Portfolio counts, blocked work, approvals, operational signals and suggested exploration.

### Evidence

Structured register sources and linked document IDs.

### Actions

Open project, approval, work item, Copilot or supporting source.

### Strengths

- structured, not chat-only;
- operational signals are deterministic;
- risk statements avoid inventing business impact;
- source references can be inspected.

### Weaknesses

- some metrics are broad demonstration counts rather than decision-ready briefing;
- Home competes with many module destinations;
- the hierarchy does not yet make a single primary next action obvious.

### Classification

KEEP CONCEPT, REBUILD EXPERIENCE.

### Production conversion

Home should surface a small number of high-confidence attention cards with:

- what changed;
- why it matters;
- evidence;
- recorded owner;
- safe next action;
- uncertainty.

---

## 3.3 Contextual Copilot

### User goal

Ask natural questions about projects, quotations, suppliers, priorities and knowledge.

### Current entry

StrideBrain Copilot screen.

### Inputs

Bounded transcript, selected industry, optional selected project, permitted model.

### Outputs

Concise narrative, structured tables, citations, follow-up suggestions and navigation/action hints.

### Evidence

Fresh server-side register reads and source passages; an evidence ledger validates IDs and citations.

### Actions

- inspect source;
- ask follow-up;
- navigate to a workflow;
- prepare a draft handoff;
- hand a risk class to a bounded agent planner.

### Current state handling

- sample mode versus connected model mode;
- busy state;
- model/provider errors;
- ambiguous project clarification;
- conversation persistence for bounded guest sessions;
- evidence repair if the model cites unsupported material.

### Bilingual status

English and Traditional Chinese are meaningfully supported, including synonyms, suggestions, terminology and answer-quality rules. Some copy remains duplicated/hand-authored across modules.

### Strengths

- company-specific claims require read-only tools;
- prior assistant text is not treated as evidence;
- exact record types and project relationships are validated;
- conflicting records remain visible;
- no business write is implied after a read-only answer.

### Weaknesses

- the model menu is too prominent for the product thesis;
- some answers are still rendered as formatted prose rather than generated interface objects;
- “sample answer” mode can blur product intelligence and scripted behavior;
- the Copilot lives as a separate destination rather than being deeply contextual everywhere.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE.

### Production conversion

- StrideBrain as the default intelligence identity;
- active context automatically resolved from route and selection;
- structured result schema for projects, comparisons, risks, evidence and actions;
- provider routing mostly hidden;
- tenant/role-filtered tools;
- durable conversation policy and traceable IntelligenceRun.

---

## 3.4 Project exploration

### User goal

Understand a project’s current state, records and next work.

### Current entry

Projects list or Copilot result.

### Inputs

Project ID/name and synthetic registers.

### Outputs

Project metadata, documents, latest quote, work items, approvals, progress and sources.

### Evidence

Project register source plus linked quote/work/approval/document sources.

### Actions

Open records, inspect evidence, ask Copilot, review change/readiness.

### Strengths

- project context is already an organizing object;
- related records retain their own record types;
- evidence can be opened without leaving the workflow.

### Weaknesses

- project detail competes with top-level module views that repeat the same data;
- project is not yet the dominant context boundary across the UI;
- no durable activity/event model.

### Classification

KEEP CONCEPT, REBUILD EXPERIENCE.

### Production conversion

Project workspace tabs/sections:

- Overview;
- Activity;
- Documents;
- Quotes/Costs;
- Suppliers;
- Decisions/Changes;
- Risks;
- Actions;
- Ask StrideBrain.

---

## 3.5 Knowledge and evidence inspection

### User goal

Find what the company knows and verify where an answer came from.

### Current entry

Knowledge Hub, source chips, inspector or evidence modal.

### Inputs

Search query, document type/filter or source ID.

### Outputs

Documents, excerpts, metadata, public source links and source context.

### Evidence

Exact demo document/register IDs, source excerpts and public URLs where applicable.

### Actions

Open source, use it in follow-up, inspect related project.

### Strengths

- source IDs are visible;
- public references are distinguished from company/demo records;
- document text is treated differently from register facts;
- source inspector is an important trust surface.

### Weaknesses

- Knowledge resembles a document catalogue more than a connected organizational memory graph;
- static Markdown sources are not equivalent to real document versions/chunks;
- access control is not production-grade.

### Classification

KEEP CONCEPT, REBUILD EXPERIENCE.

### Production conversion

Knowledge should support object exploration:

- Projects;
- Clients;
- Suppliers;
- Materials;
- People/expertise;
- Documents;
- Historical costs;
- Decisions and lessons.

The evidence panel should remain available beside every intelligence result.

---

## 3.6 Quotation and commercial change

### User goal

Review a proposed change, understand price/margin, collect approvals and release downstream work safely.

### Current entry

Quotations, flagship change scenario or Copilot navigation.

### Inputs

Direct cost, target margin, illustrative tax, supplier check, owner approval, customer acceptance, readiness assessment.

### Outputs

Deterministic price, tax, gross profit, approval status and generated downstream work item.

### Evidence

Quote/register sources, source documents and readiness source IDs.

### Actions

- edit cost/margin;
- verify supplier;
- approve internally;
- record customer acceptance;
- commit change;
- create work order.

### Strengths

- calculations are deterministic;
- editing price invalidates prior approvals;
- gates are ordered;
- work release requires current readiness with no blocking gaps;
- the workflow is auditable in demo state.

### Weaknesses

- one flagship scenario is hard-coded per pack;
- approvals are simulated browser state;
- no versioned durable quote/change/decision model;
- no role-based financial authority.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE.

### Production conversion

Create first-class:

- Quote;
- QuoteVersion;
- QuoteItem;
- Change;
- ApprovalRequest;
- ApprovalDecision;
- Action/WorkOrder;
- AuditEvent.

---

## 3.7 Historical estimate

### User goal

Use completed historical work to prepare a cautious planning estimate.

### Current entry

Estimate from history.

### Inputs

Category, finish tier, location, quantity, scope codes, margin, escalation and contingency.

### Outputs

Ranked comparables, normalized cost lines, base cost, adjusted forecast, proposed pre-tax price, illustrative range, sources and limitations.

### Evidence

Only completed, reconciled historical cost records and their source documents.

### Actions

Inspect comparables, adjust assumptions, prepare a reviewed draft.

### Strengths

- quote-only records are excluded;
- category/tier/scope/unit eligibility is explicit;
- minimum comparable and observation thresholds exist;
- similarity is explainable;
- weighted median reduces outlier sensitivity;
- limitations and source IDs are part of the result.

### Weaknesses

- hard-coded dates and synthetic authority;
- similarity factors are fixed globally;
- current supplier/market data is absent;
- range is illustrative, not a confidence interval;
- experience is an isolated estimator rather than connected project intelligence.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE, DEMO FIXTURE.

### Production conversion

Make this the analytical core of Comparable Project Intelligence, with configurable factors and clear distinction between:

- historical actual costs;
- historical quoted values;
- current supplier evidence;
- assumptions;
- generated planning outputs.

---

## 3.8 Document intelligence

### User goal

Open a messy file, understand what is observable, review extracted values and preserve lineage.

### Current entry

Document Intelligence.

### Inputs

CSV, TSV, XLSX, PDF or DOCX up to the demo limit.

### Outputs

Classification, observed facts, candidate cost rows, cell/page references, parsing warnings and review state.

### Evidence

Original local file plus cell/page references.

### Actions

- approve/exclude/request review for a row;
- correct quantity/unit price;
- confirm currency;
- add reviewer note;
- approve extraction draft;
- create review report.

### Strengths

- file remains local in demo;
- observed values are not presented as independently verified facts;
- parser safety limits exist;
- source coordinates are preserved;
- blockers prevent approval;
- review requires an explicit note.

### Weaknesses

- browser-only processing and temporary memory;
- no durable original, hash, document version or processing job;
- no production OCR or malware scanning;
- heuristic aliases are embedded in one module;
- PDF text extraction cannot handle scanned/image-only files.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE.

### Production conversion

`upload → retain original → hash/version → ingestion job → parser/extractor → proposal → human review → publish approved facts`

---

## 3.9 Document-to-history bridge

### User goal

Turn a reviewed structured source into a provisional historical cost example without losing uncertainty.

### Current entry

After Document Intelligence review.

### Inputs

Reviewed cost lines, cost-code mappings, job metadata, explicit acknowledgements and exclusion reason.

### Outputs

Session-only synthetic completed precedent and source note.

### Evidence

Original row references, mapping decisions, review timestamp and explicit self-attested provenance.

### Actions

Attach or remove precedent from the current session.

### Strengths

- all accepted lines must map to canonical codes;
- totals must reconcile;
- blockers and truncation prevent promotion;
- excluded lines need explanation;
- fictional/self-attested authority is explicit.

### Weaknesses

- session-only precedent is not a production fact model;
- the user can attest completeness without independent ledger/invoice verification;
- hard-coded sandbox dates and labels.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE.

### Production conversion

Use authority states such as:

- `EXTRACTED_PROPOSAL`;
- `HUMAN_REVIEWED`;
- `COMPANY_CONFIRMED`;
- `RECONCILED_ACTUAL_COST`;
- `REJECTED/ARCHIVED`.

Only sufficiently authoritative states may contribute to comparable-cost calculations.

---

## 3.10 Operational readiness

### User goal

Check whether sufficient evidence exists before promising or releasing work.

### Current entry

Operational checks.

### Inputs

Manual facts specific to interior renovation or printing.

### Outputs

Pass/hold/review checks, evidence links, next actions and overall readiness.

### Evidence

Named public and company/demo sources.

### Actions

Record assessment, create review task, return to blocked change release.

### Strengths

- manual input is not misrepresented as actual inspection;
- legal/regulatory certification is explicitly denied;
- each failed check has an action;
- any hold blocks work release.

### Weaknesses

- policies are hard-coded in JavaScript;
- no policy version, tenant configuration or decision authority record;
- checklist breadth does not prove completeness.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE.

### Production conversion

Versioned PolicyPack + PolicyRun + EvidenceReference + ReviewDecision.

---

## 3.11 AI Team / bounded agent planning

### User goal

Ask a specialized AI coworker to inspect records and prepare follow-up work.

### Current entry

AI Team or Copilot handoff.

### Inputs

Goal, agent type, locale, selected model and bounded read-only tools.

### Outputs

Tool timeline, source-backed proposals and drafts requiring human approval.

### Evidence

Structured registers and exact source IDs.

### Actions

Review, edit, approve internal task, and in controlled connector flows approve an external send.

### Strengths

- agent roles are bounded;
- proposal count is capped;
- unknown projects/sources are rejected;
- no execution authority is granted to the planner;
- deterministic fallback exists for coordination proposals.

### Weaknesses

- “AI Team” adds another major surface before the core product loop is fully coherent;
- agent roles can expose internal architecture;
- generated plans and action state remain demo-oriented.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE.

### Production conversion

Present one StrideBrain intelligence layer. Specialized planners become internal capabilities. Surface a proposal/review timeline only when it helps complete a user outcome.

---

## 3.12 External message draft/send

### User goal

Turn evidence into a reviewed customer/supplier message and send through an authorized channel.

### Current entry

Customer service, AI proposal or draft handoff.

### Inputs

Reviewed draft, recipient identity, provider connection and explicit approval.

### Outputs

Draft, send attempt and receipt/status.

### Evidence

Source IDs, contact identity registry and audit entries.

### Actions

Edit, save, approve and send.

### Strengths

- send is not automatic;
- provider credentials remain server-side;
- recipient identity can be verified;
- receipts/errors are normalized and tested.

### Weaknesses

- connector ownership is demo-wide, not organizational;
- user/role/assignment authority is incomplete;
- customer/contact data lifecycle is not production-ready.

### Classification

KEEP CONCEPT, PORT LOGIC, HISTORICAL REFERENCE.

### Production conversion

OrganizationConnector + ContactIdentity + DraftArtifact + ApprovalDecision + ExternalAction + ActionReceipt.

---

## 3.13 Learning and feedback

### User goal

Report whether an answer/source was useful without corrupting approved knowledge.

### Current entry

Feedback controls under answers and Learning view.

### Inputs

Helpful/Needs review, source ID and optional note.

### Outputs

Feedback review record.

### Evidence

Original answer/source association.

### Actions

Mark feedback reviewed.

### Strengths

- negative feedback does not silently mutate source knowledge;
- review state is explicit.

### Weaknesses

- feedback is browser-local;
- no correction proposal/version/publish workflow.

### Classification

KEEP CONCEPT, PORT LOGIC, REBUILD EXPERIENCE.

### Production conversion

FeedbackCase → CorrectionProposal → HumanReview → VersionedPublish.

---

## 4. Bilingual UX findings

### Keep

- Traditional Chinese as a first-class locale;
- Taiwan-specific terminology;
- localized suggestions and error messages;
- English/Chinese state parity tests;
- preservation of exact IDs while translating titles naturally.

### Change

- move all UI strings into one message/terminology system;
- distinguish canonical domain term from display label;
- avoid inline language maps inside rendering files;
- design table/card layouts using Chinese text expansion from the start;
- test full workflows, not only label presence.

### Remove

- technical provider/auth explanations from normal end-user states;
- mixed-language leakage caused by locally maintained labels;
- provider-specific names as the main intelligence identity.

## 5. UX states required in the new product

Every major flow must define:

- empty;
- loading;
- partial evidence;
- conflict;
- permission denied;
- no comparable history;
- stale source;
- provider unavailable;
- retryable failure;
- non-retryable failure;
- approval required;
- action completed;
- action receipt;
- bilingual parity.

## 6. Proposed primary interaction pattern

```text
Question or object context
        ↓
StrideBrain resolves active company/project/quote
        ↓
Structured retrieval and evidence
        ↓
Result composed as UI objects
        ↓
Evidence panel beside result
        ↓
Recommended safe next action
        ↓
Proposal → review → approval → execution → receipt
```

## 7. UX acceptance bar for the first vertical slice

A new user should be able to:

1. open one active project;
2. ask “Have we done something like this before?”;
3. understand the top comparable projects without reading a long essay;
4. see why each match was selected;
5. inspect the exact quote/cost/document evidence;
6. understand important differences and limitations;
7. continue to compare the current quote or create a review action;
8. complete the journey in English or Traditional Chinese;
9. never need to understand provider, agent or retrieval architecture.
