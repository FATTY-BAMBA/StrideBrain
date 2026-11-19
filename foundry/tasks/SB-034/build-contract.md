# SB-034 bounded build contract

Status: APPROVED for the first presentation slice by the user on 2026-11-19. Implemented locally on build/sb-034-demo-value-ux at baseline 19c98f799de43876e6eea83fd9d336518476fe0a. The Phase 1 gate below is historical; current scope and results are in implementation-review.md. No deployment or merge.

## Phase 1 boundary

Only `foundry/tasks/SB-034/` planning documents may change. Private copies of user-supplied screenshots may be retained outside Git. No product code, schema, migration, dependency, database/session state, live QA, deployment, Vercel or DNS change. No merge, remote issue comment, PR creation or publication is requested. The existing local visual-review server is left unchanged.

The user's instruction is explicit: “Do not change product source before the UX audit and storyboard are reviewed.” Review is not implied by creating the files or by author self-check. Independent UX/value review and proposed copy acceptance remain pending.

## Smallest recommended implementation after review

1. Home outcome launchpad with an authorization-derived project entry and three real tasks.
2. Clear Projects presentation using the existing list boundary; truthful active/other grouping. Add one highlighted workspace context read only if its benefit outweighs the extra composition; no activity timeline or list-wide workspace fetching.
3. Turn Knowledge and StrideBrain into bounded question/action entry points for existing comparison, evidence and Actions. Preserve canonical locale/project/run context. Do not implement an unrestricted composer.
4. Compact workspace/result hierarchy. Promote existing structured signals and review entry. Keep comparison creation explicit and read financial results from the same existing view model; do not duplicate formulas.
5. Simplify Settings and technical copy in both languages. Place Planned assistance within StrideBrain; no new Agents route in the smallest scope.
6. Fix new navigation targets truthfully: do not route prompts into unavailable Commercial/Evidence tabs. Either use established overview/comparison/evidence-panel destinations or demote inactive tabs. Any stable section anchors added later are UI work, not permission to weaken route authorization.

Likely presentation files: existing Home/Knowledge/StrideBrain/Settings/Projects pages, FoundationPage/global navigation/layout CSS, project overview/list components, comparison experience UI, evidence/internal-review copy and localization catalog. Extend presentation composition only where existing services already provide authorized data. No runtime-context, authorization, repository policy, calculation, proposal-policy, schema or migration changes in this scope. A newly necessary change outside this boundary must be separately specified and reviewed.

## Capability boundary

| Desired experience | Already implemented | Presentation/composition required | Excluded new functionality |
| --- | --- | --- | --- |
| Open current work | Authorized list/workspace | Home project entry; clearer cards | Last-visited tracking, fabricated activity |
| Project stage/attention | Workspace DTO contains stage/warnings/open actions | Localized stage/warning mapping; optional highlighted-project read | Invented risks, unrestricted list enrichment |
| Similar past work | Explicit comparison, ranking and selection | Outcome labels and shorter summary | Global project search/new ranking engine |
| Quote review signals | Stored structured commercial findings | Promote existing view model signals | New financial model, recommendations to approve |
| Exact support | Claim/factor/source evidence | Clear links/return route and readable hierarchy | Arbitrary document ingestion/RAG |
| Current quote | Authorized active quote + authority | Correct context labels and source path when available | Claiming active/Human reviewed means Approved |
| Open actions / review | Existing list, proposal, confirm, receipt | Visible entry points and clearer wording | External messaging, scheduling, autonomous follow-up |
| Ask StrideBrain | Existing bounded workflows | Question-to-workflow mapping and context chooser | General chat, model synthesis, fabricated answers |
| Agents direction | No autonomous execution surface established | Planned informational cards | Agent execution, monitoring, background delegation |
| Settings | Language switch; enforced access boundaries | Working language entry and honest read-only/planned sections | Account editing, team admin, integrations, AI control backend |

## Integrity that cannot change

- Derive project names, links, amounts and counts from current authorized services; protect anonymous, other-tenant and restricted roles.
- Comparator visibility does not imply workspace access; do not expose a full company/project list to every role.
- Preserve quotation / forecast / actual / supplier-offer distinctions, authority, source version, currency, normalization and freshness.
- Retain insufficient, conflicted, stale, unavailable and restricted states. No unsupported range, approval or “AI confidence.”
- Keep server-side stale/result/permission enforcement, explicit command boundaries, bounded edits, confirmation, idempotency and append-only audit/history.
- Never create a comparison, proposal or action as a side effect of visiting a new Home/Knowledge/StrideBrain GET route.
- Maintain bilingual labels and route/selection/draft/evidence-return identity through navigation. Do not claim a timed value test or independent/human language pass from static review.

## Acceptance and release scope

Use the focused future plan in `test-plan.md` for affected paths, plus the essential controlled-pilot gates in `brief.md`. Do not restart the full Stage 9 matrix as a default prerequisite for this pass. Existing F01–F05 evidence remains historical and must not be overwritten. No deployment or merge is authorized by contract review. A future isolated hosted preview, rollback and hosted rehearsal remain prerequisites before pilot participant access.
