# StrideBrain Quality Constitution

## Purpose

Define the minimum evidence required before a StrideBrain capability can be called demo-ready, pilot-ready, or client-ready.

A feature is not complete because a screen renders or a model returns an answer.

## Readiness levels

### L0 — Exploration

Internal product or technical exploration only.

May contain:

- incomplete workflows;
- temporary fixtures;
- hard-coded behavior;
- missing edge cases;
- unverified visual design;
- no external-user access.

L0 behavior must not be presented as a working customer capability.

### L1 — Controlled demo

Safe for invited demonstration with fictional or public data.

Required:

- synthetic/public data clearly identified;
- no real customer secrets or private records;
- bounded and honest AI behavior;
- no fake success states;
- consequential actions disabled or explicitly staff-controlled;
- functional tests;
- browser acceptance journey;
- critical bilingual UI coverage;
- known limitations recorded;
- exact release commit/deployment identified;
- rollback path.

### L2 — Controlled pilot

Safe for a small real-business pilot.

Required in addition to L1:

- trusted user identity;
- server-derived organization membership;
- role/assignment authorization on every tenant request;
- durable tenant-scoped persistence;
- encrypted connector credentials;
- authenticated approval for business-changing actions;
- append-only or immutable audit events;
- backup and recovery procedures;
- retention and offboarding policy;
- monitoring for authentication, integration, AI, and action failures;
- tenant-isolation tests;
- pilot acceptance criteria and support owner.

### L3 — Client-ready

Suitable for repeatable onboarding of paying customers.

Required in addition to L2:

- multi-tenant isolation tested across read/write/retrieval/export/action paths;
- onboarding and offboarding workflows;
- connector lifecycle and credential rotation;
- document ingestion, versioning, and provenance;
- production migration and compatibility policy;
- sensitive-data authorization policy;
- SLOs and operational runbooks;
- export/deletion/retention controls;
- critical-path security review and penetration testing;
- measured pilot outcomes;
- release promotion and rollback procedures.

## Release dimensions

Every meaningful release receives an evidence-backed assessment across these dimensions.

### 1. Product coherence

Questions:

- Does the capability serve the Product Constitution?
- Does it fit the core loop?
- Is it attached to the correct business objects?
- Does it reduce or increase fragmentation?

Blocking failure:

- feature has no clear user outcome or product home.

### 2. UX clarity

Questions:

- Can a new user understand what happened within five seconds?
- Is the primary next action clear?
- Are technical internals hidden until needed?
- Are loading, empty, error, stale, and conflict states designed?

Blocking failure:

- critical workflow requires developer explanation.

### 3. Visual quality

Questions:

- Is hierarchy deliberate?
- Is density appropriate?
- Are components consistent?
- Does the experience feel like one product?

Blocking failure:

- critical states are illegible, inconsistent, or visually misleading.

### 4. Intelligence quality

Questions:

- Does the system use the right context?
- Does retrieval find relevant evidence?
- Does the answer synthesize rather than merely dump search results?
- Does it abstain when evidence is insufficient?

Blocking failure:

- material company-specific claims are fabricated or unsupported.

### 5. Evidence correctness

Questions:

- Can the user inspect why the answer was produced?
- Do citations point to the right object/version/location?
- Are conflicts and superseded sources visible?

Initial target for critical citation correctness: **≥ 98%** in the defined evaluation set.

Blocking failure:

- evidence links misrepresent the supporting source.

### 6. Action safety

Questions:

- Is the proposed action appropriate to the user's role and context?
- Are consequential actions explicit and approved?
- Is the resulting state auditable?

Blocking failure:

- unauthorized, unapproved, or untracked business-changing action.

### 7. Engineering quality

Questions:

- Is the capability built behind reusable domain/service contracts?
- Are tests present at the correct layers?
- Is technical debt recorded?
- Does implementation preserve migration and rollback safety?

Blocking failure:

- production behavior depends on an untracked one-off patch or browser-only security assumption.

### 8. Localization

Questions:

- Do English and Traditional Chinese critical paths have parity?
- Is terminology natural and consistent?
- Does layout survive text expansion?

Blocking failure:

- the selected language exposes mixed-language critical controls or misleading business terminology.

### 9. Accessibility

Questions:

- Are keyboard interaction, focus, labels, contrast, semantics, and responsive layouts verified?

Blocking failure:

- critical workflow cannot be completed with supported accessibility requirements.

### 10. Reliability

Questions:

- What happens on timeout, partial retrieval, model failure, storage failure, and stale data?
- Does the system fail honestly and recover safely?

Blocking failure:

- failure is presented as success, or state becomes corrupt.

### 11. Security and tenant isolation

Questions:

- Is organization context server-derived?
- Are reads, writes, retrieval, and actions scoped below the AI layer?
- Are secrets server-side?
- Can another tenant's data be inferred or accessed?

Blocking failure:

- critical or high-severity security issue;
- any verified cross-tenant leakage.

### 12. Observability and recovery

Questions:

- Can material actions and intelligence runs be reconstructed?
- Are errors visible to operators?
- Is rollback defined?

Blocking failure:

- a consequential release cannot be monitored or rolled back.

## Initial quantitative gates

These targets will be refined once the first eval baseline exists.

| Dimension | Initial release target |
|---|---:|
| Critical user-flow completion | ≥ 95% |
| Grounded company-specific answers | ≥ 95% |
| Critical citation correctness | ≥ 98% |
| Required abstention correctness | ≥ 95% |
| Critical English/zh-Hant parity | 100% |
| Critical accessibility blockers | 0 |
| Critical functional regressions | 0 |
| Critical/high security findings | 0 |
| Verified cross-tenant leakage | 0 |
| Unapproved consequential actions | 0 |

## Required evidence package

A release candidate should include:

- accepted product/feature contract;
- design review;
- architecture review;
- unit and integration results;
- browser journey results;
- intelligence evaluation report;
- grounding/citation report;
- bilingual report;
- accessibility result;
- security review;
- known limitations;
- exact commit and deployment;
- rollback instructions;
- human release approval.

## No unsupported quality claims

Do not use terms such as:

- perfect;
- fully secure;
- production-ready;
- comprehensively tested;
- hallucination-free;

unless the applicable scope and evidence are explicitly stated.

## Release rule

`Build complete` is not equal to `release approved`.

A capability is released only after independent review and the applicable readiness-level gates pass.
