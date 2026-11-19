# SB-034 proposed information architecture

Status: approved direction implemented in the first slice. The proposal below is historical design context; implementation-review.md records actual task destinations and limitations.

## Global hierarchy

Home → Projects → Knowledge → StrideBrain; Settings is a secondary utility destination. Preserve existing URLs and locale routes where possible. Home is a launchpad; Projects organizes authorized work; Knowledge finds supporting company experience; StrideBrain presents useful questions and next tasks for a selected project. These are distinct entry purposes into the same bounded workflows, not three separate search/chat systems.

**Agents decision:** do not add a global Agents destination in the smallest pass. No autonomous execution surface exists. Show a small **Planned assistance** section within StrideBrain, optionally teased on Home, with Project coordination, Quote review preparation and Follow-up preparation labeled Planned. Existing internal review creation remains a working action, not an agent run. Reconsider a dedicated Agents Preview entry only after independent review confirms that the informational destination is useful, explicit and not another dead-end.

## Home layout, top to bottom

1. Compact heading: “What would you like to get done?” with the Find / Understand / Decide / Act framing and company-experience line.
2. **Continue working**: an authorized active project, e.g. Xinyi when the current session can read it. Name, true status, concise context when available, primary Open project. Do not invent recent activity or hard-code a tenant/project name into an anonymous landing page.
3. **Start with a task**: Compare with past work; Review a quotation; Find supporting evidence. Each uses a selected authorized project and a real destination. Secondary links to Knowledge and Ask StrideBrain explain their bounded scope.
4. **Your company's experience**: explain what real project/comparison/source records can be used. Show actual authorized counts/names only if returned by an existing read; otherwise use non-quantified category descriptions. This is not unrestricted document search.
5. Small Planned assistance section, below working capabilities. Keep the synthetic-data disclosure concise and visible.

On a phone, the current project and at least one working action should appear without a giant hero paragraph. Keep business context and navigation reachable; do not shrink text into unreadability.

## Projects

Use ListAuthorizedProjects unchanged as the identity/access boundary. Separate active from other authorized projects using truthful statuses. `active=false` alone does not prove “completed”; call it Other projects until accurate status is exposed. A literal Recently viewed or chronological Recent section requires visit timestamps or a reviewed timestamp field; omit it in the smallest pass.

Highlight the selected authorized project's current stage, context and attention signals from GetProjectWorkspace, if included. The list DTO does not currently provide those fields. Prefer a single authorized highlighted-project read over one workspace query for every card. Otherwise keep rich context in the workspace and make the Open project / Compare with past work actions clear.

Historical comparator summaries are available through comparison authorization. Their presence does not grant project-workspace access. Keep them under Past work in a comparison; do not make all six appear as accessible workspace cards.

## Knowledge

Heading: **Ask your company knowledge**. Explain: “Start with a suggested question to open the supporting project records.” Present selected-project context and real entry points:

| Question / action | Truthful destination | Limitation |
| --- | --- | --- |
| Have we done similar retail work? | Existing comparison entry/results for the selected project | Run comparison explicitly when no suitable stored result is available. |
| What supports this cost assumption? | Selected comparison claim → exact evidence/source | Requires valid authorized run and economics context; a question cannot invent identifiers. |
| What quotation are we reviewing? | Current project's quote summary and its authorized evidence when available | Current active quote is not automatically approved. |
| Which suppliers appear in the supporting history? | Actual supplier/source details within the appropriate comparison evidence | Do not imply a searchable supplier directory, current prices, or complete supplier history. |

“What did we decide about lighting on Zhongshan?” and “latest approved Xinyi quotation” must not be promised generically. The existing data/authority must establish that specific decision or approval. Use narrower truthful wording or label future support Planned. Freeform knowledge search, arbitrary document ingestion and full decision-history retrieval stay out of scope.

## StrideBrain

Heading: **Ask StrideBrain**. Subheading: **What do you want to know or get done?** Display context selection and suggested workflow buttons, not an unrestricted chat input. Add a concise explanation that the current demo opens reviewed project workflows.

- Have we done something similar before? → comparison.
- What looks unusual in this quotation? → existing structured findings after comparison.
- Show the evidence behind the imported-stone variance → authorized claim when an eligible result exists; otherwise compare first.
- What should I review before approving this quotation? → supported findings/limits and internal-review preparation; never an approval recommendation or approval command.
- What actions are still open? → real project Actions list.

No chat bubbles, simulated typing, fabricated responses or pretend autonomous status. If a prompt cannot resolve truthfully, show the actual next prerequisite or unavailable state.

## Settings

Use **Your workspace** or **Settings**, with Language as the working preference. Profile and Team & access can explain available read-only context only where an existing safe service exposes it. Data connections and AI preferences remain plainly Planned, not active toggles. Do not create identity editing, role management, integrations or model controls. Keep access enforcement unchanged and move internal architecture prose into developer documentation.

## Workspace, comparison, evidence and action

Compact the project header; retain relevant current quote/forecast distinctions and warnings. Put Compare with past work near the top. On an existing result, show a concise ranked-history summary and **What needs review** before long tables and selection mechanics. Each material signal has a visible **View evidence** action and correct observation type; unknown, insufficient, conflicted or stale cases remain explicit. Keep full ranked cards, selection update and calculation details available below.

Use the existing evidence modal/source path, not the unavailable standalone Evidence tab. Use **View source** for the source control. Place **Create internal review** near the findings and reuse the existing controlled form/confirmation/receipt flow. Loading a GET page or clicking a prompt must not silently create a run, proposal or action. Project context, locale, selected comparison and return context must survive the added navigation.
