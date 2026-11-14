# StrideBrain Prototype Runtime Inventory

**Source:** `FATTY-BAMBA/primestride-web` at `b36c3cadb9250677e387a46a9610658546670439`

This inventory classifies the meaningful runtime surfaces that should inform the new customer-facing StrideBrain product.

## Classification key

- **KC** — KEEP CONCEPT
- **PL** — PORT LOGIC
- **RX** — REBUILD EXPERIENCE
- **DF** — DEMO FIXTURE
- **HR** — HISTORICAL REFERENCE
- **RP** — RETIRE AFTER PARITY

## 1. Browser entry and orchestration

| File | Current responsibility | Classification | Target home / decision |
|---|---|---|---|
| `public/stridebrain-demo/index.html` | Static application shell, broad navigation, context inspector, boot recovery | KC, RX, RP | Rebuild as Next.js application shell with simpler IA and route-level recovery. |
| `public/stridebrain-demo/app.js` | Global orchestration for navigation, locale, session, model, chat, document intake, history, connectors and actions | HR, RP | Do not port. Split into route state, server actions, domain services and feature components. |
| `public/stridebrain-demo/guest.html` | Controlled guest entry | HR, RP | Replace with trusted invitation/onboarding and organization membership. |
| `public/stridebrain-demo/guest-entry.js` | Guest invitation capture and entry state | HR, RP | Preserve UX lessons only. |
| `public/stridebrain-demo/session-client.js` | Browser transport for demo session endpoints | PL, RP | Replace with authenticated API client/session provider. |
| `public/stridebrain-demo/session-view.js` | Guest/staff session gating UI | KC, RX, RP | Rebuild as onboarding/access states; never reuse demo authorization assumptions. |
| `public/stridebrain-demo/connection-check.html` | Operator diagnostic surface | HR | Replace with protected admin/observability tools. |

## 2. Shared product/domain runtime

| File | Current responsibility | Classification | Target home / decision |
|---|---|---|---|
| `core-model.js` | Seed validation, workspace indexes, state defaults, calculations, approval gates, feedback and audit | KC, PL, RP | Split into domain entities, policy services, repositories and audit events. |
| `industry-packs.js` | Industry-neutral configuration and two vertical packs | KC, PL, DF | Create typed `IndustryTemplate` configuration; tenant identity remains separate. |
| `register-evidence.js` | Generates/normalizes source identities for structured records | KC, PL | Become `EvidenceReference` and register-record provenance service. |
| `industry-evidence.js` | Validates curated industry/public evidence | KC, PL, DF | Move into reference-source ingestion and validity metadata. |
| `commercial-review.js` | Structured quotation/commercial review helpers | KC, PL | Move into quotation-analysis domain service. |
| `priority-review.js` | Deterministic priority and coordination shortlist | KC, PL | Move into operational-signal service with explicit ranking basis and limits. |
| `operational-signals.js` | Deterministic blocker, approval and risk signals | KC, PL | Move into project/risk query service. |
| `margin-guardian.js` | Margin scenarios and historical scope warnings | KC, PL | Move into commercial policy/calculation package. |
| `conversation-state.js` | Resolves multi-turn project/source context | KC, PL | Become server-side conversation context resolver. |
| `record-locale.js` | Bilingual record presentation and terminology | KC, PL | Move into typed localization/terminology layer. |
| `readiness-locale.js` | Bilingual readiness terminology | KC, PL | Merge into policy-result localization. |
| `toast-locale.js` | Bilingual transient UI copy | HR | Rebuild through common i18n message catalog. |

## 3. Primary UI/render modules

| File | Current responsibility | Classification | Target home / decision |
|---|---|---|---|
| `views-primary.js` | Overview, Copilot, projects, knowledge and inspector rendering | KC, RX, RP | Extract flows; rebuild as components and routes. |
| `views-operations.js` | Service, quotes, work, suppliers, approvals, analytics and learning | KC, RX, RP | Recompose as contextual project/object views rather than many top-level modules. |
| `experience-views.js` | Overview/context presentation and cross-view experience helpers | KC, RX | Preserve information patterns, not string-template rendering. |
| `views-ai-team.js` | AI teammate run/proposal UI | KC, RX | Rebuild as bounded proposal/review timeline. |
| `views-history.js` | Historical estimate workflow | KC, RX | Fold into Comparable Project Intelligence and quote review. |
| `views-history-bridge.js` | Reviewed document-to-history mapping UI | KC, RX | Rebuild as ingestion/review/publish workflow. |
| `views-readiness.js` | Readiness check UI | KC, RX | Rebuild as policy checklist with evidence and approval state. |
| `views-document-intelligence.js` | File extraction/review UI | KC, RX | Rebuild as durable ingestion job and review workspace. |
| `views-playbook.js` | Industry guidance/reference exploration | KC, RX | Rebuild inside Knowledge/reference experience. |
| `ui-shared.js` | String-template UI primitives | HR, RP | Replace with typed accessible React component library. |
| `evidence-presentation.js` | Source/evidence list presentation | KC, RX | Become shared evidence panel, citation chip and source viewer. |
| `copilot-format.js` | Safe Copilot answer formatting | KC, PL | Reimplement as structured answer renderer; maintain output escaping. |
| `copilot-errors.js` | User-safe Copilot error copy | KC, PL | Move into normalized intelligence error taxonomy. |
| `copilot-suggestions.js` | Contextual prompts/next questions | KC, PL | Rebuild as outcome-oriented suggestion service using active context. |
| `copilot-draft-handoff.js` | Detects draft answers and prepares handoff | KC, PL | Become typed `DraftArtifact → ProposedAction` workflow. |
| `model-catalog.js` | Provider/model allowlist and labels | PL, RX | Keep server-side routing/allowlist; minimize normal-user exposure. |
| `studio.css`, `experience.css` | Current visual system and layout refinements | HR | Use as visual reference only; establish new design tokens/components. |

## 4. Document and historical-intelligence modules

| File | Current responsibility | Classification | Target home / decision |
|---|---|---|---|
| `document-intelligence.js` | Browser-local CSV/TSV/XLSX/PDF/DOCX parsing, heuristic extraction, source references and review | KC, PL, RX | Split into upload/storage, ingestion jobs, parser adapters, extraction proposals and review UI. |
| `document-history-bridge.js` | Maps reviewed extraction into a session-only synthetic precedent | KC, PL, RX, DF | Replace with reviewed canonical mapping and authority state; never treat self-attestation as verified actual cost. |
| `historical-estimator.js` | Comparable completed-history selection, weighted unit costs, range and estimate draft | KC, PL, RX | Core input to Comparable Project Intelligence service and evals. |
| `sample-documents.js` | Creates demo file samples | DF | Convert into versioned test fixtures. |
| `fixtures/**` | Small CSV/HTML demonstration sources | DF | Preserve for parser and browser E2E fixtures. |
| `library/history/**` | Fictional historical cost/source notes | DF | Map to Projects, Quotes, QuoteItems and EvidenceReferences. |
| `library/industry/**` | Curated industry references | DF, KC | Import as PublicReference records with applicability metadata. |

## 5. Readiness and work-release modules

| File | Current responsibility | Classification | Target home / decision |
|---|---|---|---|
| `readiness-rules.js` | Per-industry manual checks, pass/hold/review states, source-linked next actions | KC, PL, RX | Convert into typed configurable policy packs and policy-run records. |
| `core-model.js` approval/commit functions | Supplier → owner → customer gates plus readiness recheck | KC, PL | Move into `ApprovalPolicy` and `WorkReleasePolicy`. |
| `margin-guardian.js` | Commercial scenario/scope warnings | KC, PL | Join commercial review and approval policy. |
| `operational-signals.js` | Blocked work and pending approval signals | KC, PL | Join Project Intelligence queries. |

## 6. AI Team browser modules

| File | Current responsibility | Classification | Target home / decision |
|---|---|---|---|
| `ai-team.js` | Runs/selects agents, records proposed plans and receipts, handles approve/execute actions | KC, PL, RX, RP | Split planner, proposal, approval and execution into server-owned services. |
| `agent-planners.js` | Deterministic/fallback agent plan construction | KC, PL | Preserve bounded planner schemas and fallbacks. |
| `agent-runtime.js` | Agent-run state, proposal lifecycle and audit behavior | KC, PL | Become durable AgentRun/ProposedAction/AuditEvent models. |
| `contact-channels.js` | Demo channel options and contact behavior | KC, PL, DF | Replace with organization connector registry and contact identity policy. |

## 7. Copilot/server intelligence modules

| File | Current responsibility | Classification | Target home / decision |
|---|---|---|---|
| `src/lib/stridebrain-demo/copilot-tools.js` | Read-only bundled workspace tools and source retrieval | KC, PL, DF | Define production tool contracts backed by tenant repositories. |
| `copilot-runner.js` | OpenAI Responses tool loop, evidence ledger, repair and bounded calls | KC, PL | Generalize into provider-neutral intelligence orchestrator. |
| `openrouter-runner.js` | OpenRouter tool loop, allowlist, streaming and safe error mapping | KC, PL | Keep as provider adapter behind common runtime. |
| `answer-quality.js` | Priority-answer and citation quality policy | KC, PL | Convert into evaluation rubric plus runtime validators. |
| `conversation-evidence.js` | Fresh turn context, evidence ledger and answer verification | KC, PL | Core `ContextResolver` and `EvidenceLedger` contracts. |
| `copilot-locale.js` | Response-language directive | KC, PL | Move into locale-aware response policy. |
| `runtime-context.js` | Demo runtime/organization context | KC, PL, RP | Replace demo context with trusted user → membership → organization → role context. |
| `priority-review.js` | Server bridge to deterministic priority/coordination logic | KC, PL | Fold into operational intelligence service. |
| `agent-planner-runner.js` | Bounded AI SDK agent planner and proposal tools | KC, PL | Preserve bounded plan/propose pattern, add durable authorization and audit. |
| `demo-budget.js` | Preview spending guard | KC, PL | Generalize into usage budget policy. |
| `demo-concurrency.js` | Preview concurrency lease | KC, PL | Generalize into runtime capacity/rate policy. |
| `demo-quota.js` | In-memory/session quota | KC, PL, RP | Replace with durable organization/user quota service. |
| `supabase-quota.js`, `supabase-retry.js` | Distributed preview quota/retry | KC, PL, HR | Preserve fail-closed/retry lessons; choose production store later. |
| `staff-session.js` | Demo staff token/cookie authorization | HR, RP | Do not reuse as product identity. |
| `guest-session.js`, `guest-attempt.js` | Guest invitation/session behavior | HR, RP | Rebuild through trusted identity and pilot invitation flow. |
| `session-status.js` | Demo access/provider status | KC, PL | Rebuild as safe capability/status endpoint. |
| `contact-identity-registry.js` | Allowed/verified demo recipient identities | KC, PL | Convert into organization contact identity and recipient policy. |
| `email-connector.js` | Email provider adapter and action guard | KC, PL, HR | Rebuild as org-owned connector with encrypted credentials and receipts. |
| `gmail-connector.js` | Gmail-specific send adapter | KC, PL, HR | Keep provider contract/receipt tests; reimplement credential lifecycle. |
| `google-oauth.js`, `google-oauth-transaction.js` | Preview Google OAuth flow/state | KC, PL, HR | Rebuild with organization ownership, encryption, rotation and revocation. |
| `line-connector.js`, `line-inbox.js` | LINE send/webhook/inbox prototype | KC, PL, HR | Rebuild behind verified channel and contact identities. |
| `message-connectors.js` | Shared message-provider dispatch | KC, PL | Become connector registry and normalized receipt/error contract. |

## 8. API routes

### Copilot and access

| Route | Current purpose | Classification | Decision |
|---|---|---|---|
| `api/stridebrain-demo/copilot/route.js` | Bounded AI chat/agent route with access, model, quota, budget and concurrency gates | KC, PL, RP | Split into authenticated intelligence endpoint and agent-plan endpoint. |
| `copilot/status/route.js` | Provider/model access status | KC, PL | Preserve safe status contract. |
| `copilot/session/route.js` | Demo staff session | HR, RP | Replace. |
| `copilot/guest-session/route.js` | Guest invite session | HR, RP | Replace. |
| `copilot/quota-status/route.js` | Preview quota status | KC, PL | Generalize. |
| `copilot/quota-integration-test/route.js` | Protected quota diagnostic | HR | Move to automated integration tests/admin tooling. |
| `copilot/guard-integration-test/route.js` | Protected guard diagnostic | HR | Move to automated tests. |
| `copilot/connection-check/route.js` | Provider/connection diagnostic | KC, PL, HR | Rebuild as protected health diagnostic. |

### Connections, Google, email and messaging

| Route family | Current purpose | Classification | Decision |
|---|---|---|---|
| `connections/health`, `connections/status` | Connector health/status | KC, PL | Generalize around organization connectors. |
| `google/connect`, `google/callback`, `google/status` | Preview Google OAuth lifecycle | KC, PL, HR | Rebuild with trusted org context and encrypted credential store. |
| `email/status`, `email/send` | Email availability and explicit send | KC, PL, HR | Rebuild with authorization, approval and audit. |
| `line/webhook`, `line/inbox`, `line/identities/verify` | LINE webhook/inbox/identity verification | KC, PL, HR | Rebuild as tenant channel integration. |
| `messages/send` | Shared message dispatch | KC, PL | Rebuild as approved external action service. |

## 9. Separate sample-answer runtime

| File | Current responsibility | Classification | Decision |
|---|---|---|---|
| `assistant-rules.js` | Deterministic sample answers when live model is unavailable | DF, HR, RP | Convert useful questions into canonical eval cases; do not present scripted answers as product intelligence. |
| `copilot-suggestions.js` | Suggested questions and follow-ups | KC, PL | Preserve as context-aware UX, not fixed prompt catalogue. |

## 10. QA and diagnostic surfaces

| Asset family | Classification | Migration |
|---|---|---|
| `qa.html`, `qa.js` | HR | Convert scenarios into E2E/eval cases. |
| `bridge-qa.html`, `bridge-qa.js` | HR | Convert document-to-history scenarios into integration tests. |
| `copilot-ui-qa.html`, `copilot-ui-qa.js` | HR | Convert to component/E2E/visual regression tests. |
| `guest-acceptance-qa.html`, `guest-acceptance-qa.js` | HR | Convert to invitation/onboarding E2E tests. |
| `connection-check.html` | HR | Replace with protected operational diagnostics. |

## 11. Runtime risks

1. Browser-global state can produce hidden coupling between unrelated workflows.
2. Static fixtures can make retrieval look more authoritative than it is.
3. Demo access tokens/cookies are not tenant authorization.
4. Provider/model concerns are visible in normal product UX.
5. Many module destinations compete for attention.
6. Some workflows mix product behavior, fixture state and UI rendering in the same file.
7. Static pages and route-specific diagnostics can drift from the canonical user journey.

## 12. Runtime extraction order

1. Evidence authority and source contracts.
2. Project/quote/document/supplier repositories.
3. Historical comparison domain service.
4. Conversation context and evidence ledger.
5. Typed intelligence tool registry.
6. Structured answer/result contracts.
7. Action proposal, approval and audit.
8. New object-centric experience.
9. Connector registry and external actions.
10. Retire old demo runtime after parity and cutover.
