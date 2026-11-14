# StrideBrain v0.1 — Interaction and State Matrix

**Scope:** Comparable Project Intelligence  
**Purpose:** ensure every material loading, success, uncertainty, permission, stale, conflict, and action state is designed before implementation.

## 1. State-design rules

1. Preserve project context in every state.
2. Never replace verified structured results with a generic error because optional AI failed.
3. Never show fabricated placeholder business values while loading.
4. Explain what is known, what is missing, and what the user can do next.
5. Do not reveal inaccessible record names, values, counts, or existence.
6. Distinguish `empty`, `insufficient`, `conflicted`, `stale`, `restricted`, and `failed`.
7. Preserve user edits after recoverable failures.
8. Show success only after authoritative service confirmation.
9. Use natural Taiwan Traditional Chinese, not implementation terminology.
10. Every visual state requires keyboard, focus, screen-reader, and responsive behavior.

## 2. Project-context states

| State | Trigger | Primary UI | Allowed action | Backend/authority behavior | Key copy |
|---|---|---|---|---|---|
| `PROJECT_LOADING` | authorized project route opened | stable project-header skeleton; no fake amounts | navigate away | resolve runtime context and project access | EN: “Opening project…” / ZH: “正在開啟專案…” |
| `PROJECT_READY` | project and permission context resolved | project header, quote summary, evidence health, hero prompt | run comparison; inspect project | server-derived organization, role, project, locale | EN: “Have we done something like this before?” / ZH: “我們以前做過類似的案子嗎？” |
| `PROJECT_NOT_FOUND_OR_HIDDEN` | invalid ID or inaccessible project | neutral not-found state; no object metadata | return to Projects | use non-disclosing response for missing/inaccessible | EN: “This project is unavailable.” / ZH: “無法使用此專案。” |
| `PROJECT_CONTEXT_INCOMPLETE` | mandatory comparison fields missing | missing-context list beside project summary | complete/request data; inspect sources | comparison not started | EN: “More project context is required.” / ZH: “需要補齊專案資料才能比較。” |
| `PROJECT_PERMISSION_REDACTED` | user may view project but not commercial data | project context with economics removed/restricted label | run redacted comparison if allowed | sensitive fields never retrieved to client/model | EN: “Commercial details are restricted.” / ZH: “商務資料權限受限。” |

## 3. Comparison-run states

| State | Trigger | Primary UI | Allowed action | Backend/authority behavior | Key copy |
|---|---|---|---|---|---|
| `COMPARISON_IDLE` | no current run | hero prompt and short explanation | start comparison | no run exists | EN: “Compare this project with completed work.” / ZH: “將目前專案與已完成案件進行比較。” |
| `COMPARISON_RUNNING` | run submitted | progress stages + card/table skeletons | cancel safely; browse project | deterministic service runs with authorized context | EN stages: “Checking context”, “Filtering history”, “Ranking projects”, “Assembling evidence” |
| `COMPARISON_SUCCESS` | eligible ranked results returned | summary, ranked cards, synthesis, comparison entry | select/open/compare/evidence/action | structured result is authoritative; optional explanation secondary | EN: “6 comparable projects found” / ZH: “找到 6 個類似歷史專案” |
| `COMPARISON_NO_ELIGIBLE_HISTORY` | zero candidates after eligibility | explanation of allowed exclusion categories; no hidden counts | review current context; explore general knowledge | inaccessible records omitted entirely | EN: “No eligible historical projects were found.” / ZH: “目前沒有符合條件的歷史專案。” |
| `COMPARISON_PARTIAL_CONTEXT` | result produced with optional factors unknown | cards show coverage and unknown factor states | inspect missing context; compare | unknown earns no points; never shown as mismatch | EN: “Some comparison factors are unknown.” / ZH: “部分比較條件尚無資料。” |
| `COMPARISON_FAILED` | deterministic service fails before verified result | project context retained; no result values | retry; report issue | safe error category and trace; no partial fake success | EN: “The comparison could not be completed.” / ZH: “目前無法完成專案比較。” |
| `COMPARISON_STALE` | quote/policy/evidence/permissions changed | stale banner over inspectable prior result | refresh comparison | prior run read-only; action writes blocked | EN: “This comparison is out of date.” / ZH: “此比較結果已過期，請重新整理。” |
| `OPTIONAL_EXPLANATION_PENDING` | structured result complete, synthesis model pending | structured result usable; small explanation status | continue using result | model cannot block or mutate result | EN: “Preparing a concise explanation…” / ZH: “正在整理重點說明…” |
| `OPTIONAL_EXPLANATION_UNAVAILABLE` | model timeout/failure | structured result and actions remain | retry explanation; ignore | safe model error trace | EN: “The optional explanation is unavailable. The verified comparison is still complete.” / ZH: “附加說明目前無法產生，但已驗證的比較結果仍可正常使用。” |

## 4. Match-card and selection states

| State | Trigger | Primary UI | Allowed action | Notes |
|---|---|---|---|---|
| `MATCH_PRIMARY` | score ≥ 50 and coverage ≥ 75%; primary result | standard match card with band/factors/economics/evidence | compare/open/evidence | bands follow `CPI-SIM-1.0` |
| `MATCH_BROADER` | score < 50 or policy labels broader | separated “Broader matches” section | inspect only; optionally add to comparison with warning | never implied strong/relevant |
| `MATCH_SELECTED` | card selected for table | selected border/check + column appears | remove/replace/open | maximum three historical columns |
| `MATCH_UNKNOWN_FACTOR` | optional factor missing | factor labeled `Unknown` | inspect missing source/context | no negative mismatch language |
| `MATCH_CONFLICT_WARNING` | relevant evidence conflict exists | warning indicator with exact affected dimension | open conflict evidence | affected value excluded from aggregates |
| `MATCH_RESTRICTED_ECONOMICS` | Viewer/no actual-cost permission | card retains non-sensitive factors; economics redacted | compare non-sensitive context | no hidden-value inference |

## 5. Economics and evidence states

| State | Meaning | Presentation | Prohibited behavior | Key copy |
|---|---|---|---|---|
| `QUOTED_HISTORY_AVAILABLE` | approved quotation observations exist | `Quoted price / 歷史報價` badge and values | call it actual cost | — |
| `FORECAST_AVAILABLE` | current/internal forecast exists | `Forecast direct cost / 預估直接成本` | imply completed outcome | — |
| `RECONCILED_ACTUAL_AVAILABLE` | eligible reconciled actual observations exist | `Reconciled actual / 已核對實際成本` with source count | blend with quotes/offers | — |
| `INSUFFICIENT_ACTUAL_COST_EVIDENCE` | <3 eligible projects/line observations | explicit abstention; quote history may remain | display range or zero | EN: “Insufficient actual-cost evidence” / ZH: “實際成本資料不足” |
| `SUPPLIER_OFFER_STALE` | validity expired or >90 days without validity | historical offer with date and `Stale / 已過期` | call current price | EN: “Historical supplier offer—not current pricing.” |
| `AUTHORITY_CONFLICTED` | incompatible approved records unresolved | conflict card listing records/values/versions | choose newest/model-preferred silently | EN: “Conflicting records” / ZH: “資料紀錄不一致” |
| `SOURCE_SUPERSEDED` | explicit successor exists | muted historical record + successor link | treat active | EN: “Superseded by…” / ZH: “已由新版取代…” |
| `EVIDENCE_RESTRICTED` | source exists but user lacks access | generic restricted source row only where existence may be disclosed by policy | reveal title/excerpt/value | EN: “Source access is restricted.” / ZH: “此資料來源權限受限。” |
| `EVIDENCE_MISSING` | expected accessible source unavailable | affected claim marked unsupported/omitted | preserve claim without support | EN: “Supporting evidence is unavailable.” |
| `EVIDENCE_PANEL_LOADING` | source/panel requested | panel skeleton retaining selected claim heading | close panel | focus remains managed |
| `EVIDENCE_PANEL_READY` | authorized bundle loaded | claim, authority, source/version, locator, value, freshness, conflicts | edit authority in v0.1 | open underlying object |
| `EVIDENCE_PANEL_FAILED` | evidence request fails | selected claim retained; safe retry | imply claim verified if not already in run | retry/close |

## 6. Comparison-table states

| State | Presentation | Interaction |
|---|---|---|
| `TABLE_DEFAULT` | current project + top three comparables | select row, evidence, replace comparable |
| `TABLE_ROW_SELECTED` | selected row highlighted across columns | opens row detail/evidence summary |
| `TABLE_VALUE_UNKNOWN` | em dash plus `Unknown` label and explanation | inspect missing factor/evidence |
| `TABLE_VALUE_NOT_APPLICABLE` | `Not applicable`, distinct from unknown/zero | no misleading numeric comparison |
| `TABLE_VALUE_REDACTED` | `Restricted`, no masked digits or inferred range | request access only if product supports it |
| `TABLE_CONFLICTED_VALUE` | no aggregate value; conflict icon and record count | open conflict bundle |
| `TABLE_INSUFFICIENT_RANGE` | no range; show observation count and threshold | inspect eligible observations |
| `TABLE_MOBILE` | each row becomes a horizontal card with current + selected values | swipe/accordion without losing labels |

## 7. Structured synthesis states

| Section | Required content | Empty behavior |
|---|---|---|
| What history suggests | verified structured findings only | “No supported pattern can be stated from the available evidence.” |
| Important differences | material differences and unknowns | “No material differences were identified in the compared fields.” |
| Evidence gaps | insufficiency, stale, conflict, missing context | omit only when there are genuinely none |
| Recommended next step | one bounded, role-appropriate recommendation | no action when evidence is too weak; suggest data review instead |

The synthesis must not convert a variance into a commercial judgment.

## 8. Action states

| State | Trigger | Primary UI | Backend behavior | Key copy |
|---|---|---|---|---|
| `ACTION_NOT_ALLOWED` | Viewer or missing capability | action control absent/disabled with explanation | no proposal/create call permitted | EN: “You can view this comparison, but cannot create project actions.” / ZH: “你可以查看比較結果，但無法建立專案事項。” |
| `PROPOSED_ACTION_READY` | structured result supports review | review sheet with title/rationale/assignee/due/evidence | no business state yet | EN: “Review before creating” / ZH: “建立前請先確認” |
| `PROPOSED_ACTION_EDITED` | user edits allowed fields | dirty-state indicator; mandatory evidence notes retained | proposal remains client draft/server token | — |
| `ACTION_CONFIRMING` | user explicitly confirms | controls disabled; progress label | server rechecks auth, run freshness, evidence, assignee | EN: “Creating internal review action…” |
| `ACTION_CREATED` | atomic Action + AuditEvent success | receipt, action ID/status/link; comparison retained | authoritative success | EN: “Internal review action created” / ZH: “內部審查事項已建立” |
| `ACTION_STALE_REJECTED` | material comparison inputs changed | review preserved; refresh required | no write | EN: “Refresh the comparison before creating this action.” |
| `ACTION_PERMISSION_REJECTED` | permissions/assignment changed | safe denial, no hidden detail | no write; security trace | EN: “You no longer have permission to create this action.” |
| `ACTION_ASSIGNEE_REJECTED` | assignee unavailable/ineligible | field error and candidate refresh | no write | EN: “Choose an eligible organization member.” |
| `ACTION_SERVICE_FAILED` | transient repository/service failure | edits preserved; retry/cancel | no partial Action/AuditEvent | EN: “The action was not created. Your draft is preserved.” |
| `ACTION_DUPLICATE` | retry/idempotency detects prior success | existing receipt returned | no duplicate | EN: “This action was already created.” |

## 9. Bilingual terminology matrix

| Domain meaning | English | Taiwan Traditional Chinese |
|---|---|---|
| Comparable projects | Comparable projects | 類似歷史專案 |
| Strong match | Strong match | 高度相似 |
| Relevant match | Relevant match | 具參考價值 |
| Partial match | Partial match | 部分相似 |
| Broader match | Broader match | 延伸參考 |
| Evidence coverage | Evidence coverage | 資料完整度 |
| Quoted price | Quoted price | 歷史報價 |
| Forecast direct cost | Forecast direct cost | 預估直接成本 |
| Supplier offer | Supplier offer | 供應商報價 |
| Reconciled actual cost | Reconciled actual cost | 已核對實際成本 |
| Important differences | Important differences | 重要差異 |
| Evidence gaps | Evidence gaps | 資料缺口 |
| Conflicting records | Conflicting records | 資料紀錄不一致 |
| Stale | Stale | 已過期 |
| Create internal review action | Create internal review action | 建立內部審查事項 |
| Comparison out of date | Comparison out of date | 比較結果已過期 |

Final copy review may refine phrasing but cannot merge distinct authority concepts.

## 10. Focus and accessibility behavior

- Comparison completion announces result count and sufficiency once.
- New optional-explanation text does not steal focus.
- Evidence panel focus moves to its heading and returns to the exact trigger on close.
- Conflict and stale status include text/icons, not color alone.
- Tables use row/column headers; mobile alternatives preserve associations.
- Action validation errors are summarized and linked to fields.
- Success receipt receives focus after confirmed creation.
- Disabled actions include an accessible reason where disclosure is allowed.
- Skeletons are `aria-hidden`; status copy is announced separately.

## 11. Recovery behavior

- Browser refresh may reload a stored comparison run by authorized ID.
- An expired/stale run loads read-only with refresh action.
- User action drafts may be retained briefly in session state, but cannot be mistaken for created business state.
- Retry requests use idempotency keys.
- No recoverable state uses a full-page crash when project context can remain useful.

## 12. Acceptance tests derived from this matrix

1. Structured results remain after optional AI failure.
2. No eligible history does not leak hidden project counts.
3. Unknown factor is not rendered as mismatch.
4. Quote-only history never appears under reconciled actual.
5. Lighting with two actual observations abstains.
6. Stale supplier offer is never labeled current.
7. Conflict removes affected value from aggregate and opens exact records.
8. Viewer receives redacted economics and cannot create action.
9. Stale comparison blocks action creation while preserving prior result.
10. Action success requires real receipt; failure never produces success UI.
11. Language switching preserves active project/run/selection/panel/draft.
12. Keyboard journey completes comparison, evidence inspection, and authorized action creation.