# StrideBrain v0.1 — Annotated Low-Fidelity Wireframes

**Scope:** Comparable Project Intelligence  
**Purpose:** communicate hierarchy and interaction before visual styling or component implementation.

These wireframes are intentionally low fidelity. They define information priority, not final colors, typography, motion, or brand treatment.

---

## 1. Project Overview — hero entry

```text
┌───────────────┬──────────────────────────────────────────────────────────────┐
│ STRIDEBRAIN   │ Horizon Atelier        Search      繁中 / EN       Mei Lin   │
│               ├──────────────────────────────────────────────────────────────┤
│ Home          │ Projects / 信義旗艦店裝修                                    │
│ Projects  ●   │                                                              │
│ Knowledge     │ 信義旗艦店裝修                           DEMO DATA             │
│ StrideBrain   │ PRJ-XINYI-026 · 報價審查                                    │
│ Settings      │ Aster Retail Taiwan · 台北市信義區 · 640 m²                  │
│               │                                                              │
│               │ [Overview] [Compare] [Commercial] [Evidence] [Actions]       │
│               │                                                              │
│               │ ┌──────────────────────────────────────────────────────────┐ │
│               │ │ STRIDEBRAIN                                             │ │
│               │ │ 我們以前做過類似的案子嗎？                              │ │
│               │ │ [開始比較]                                              │ │
│               │ └──────────────────────────────────────────────────────────┘ │
│               │                                                              │
│               │ ┌────────────────────┐ ┌────────────────────┐               │
│               │ │ 目前報價 v3       │ │ 專案資料完整度     │               │
│               │ │ NT$16,480,000      │ │ 92% · 2 項待確認   │               │
│               │ │ 預估直接成本       │ │ [查看資料依據]     │               │
│               │ │ NT$12,650,000      │ └────────────────────┘               │
│               │ └────────────────────┘                                      │
│               │                                                              │
│               │ Current scope · risks · open actions                         │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

### Annotations

1. The active project is visually dominant; the global navigation is secondary.
2. Quote and forecast are labeled separately.
3. The hero question is available without opening a separate chat screen.
4. The evidence-health card provides a direct path to missing/stale context.
5. No agent/model selector appears.

---

## 2. Comparison loading

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 信義旗艦店裝修 / Compare                                                    │
│                                                                              │
│ Comparing this project with completed work                                  │
│                                                                              │
│ ✓ Checking current project context                                          │
│ ✓ Filtering eligible historical projects                                    │
│ ● Ranking comparable projects                                               │
│ ○ Assembling economics and evidence                                         │
│                                                                              │
│ ┌────────────────────────┐ ┌────────────────────────┐ ┌───────────────────┐ │
│ │ skeleton card          │ │ skeleton card          │ │ skeleton card     │ │
│ │ no fake names/numbers  │ │                        │ │                   │ │
│ └────────────────────────┘ └────────────────────────┘ └───────────────────┘ │
│                                                                              │
│ You can continue reviewing the project while this finishes.                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Annotations

- Progress uses business-language stages, not internal tool names.
- Skeletons never contain invented values.
- Optional AI explanation is not part of the blocking sequence.

---

## 3. Successful ranked comparison

```text
┌───────────────┬──────────────────────────────────────────────────────────────┐
│ Global nav    │ 信義旗艦店裝修 / Compare                                    │
│               │                                                              │
│               │ 6 個類似歷史專案                                             │
│               │ 3 個具備已核對實際成本 · CPI-SIM-1.0                        │
│               │ 資料完整度：良好      [比較目前報價]                         │
│               │                                                              │
│               │ ┌────────────────────┐ ┌────────────────────┐               │
│               │ │ 88 高度相似        │ │ 81 高度相似        │               │
│               │ │ 內湖科技旗艦店     │ │ 中山生活概念店     │               │
│               │ │ 610 m² · 2025      │ │ 590 m² · 2024      │               │
│               │ │ ✓ 相同專案類型     │ │ ✓ 相近面積         │               │
│               │ │ ✓ 工項高度重疊     │ │ ✓ 工項高度重疊     │               │
│               │ │ ✓ 進口石材         │ │ ✓ 報價組成相近     │               │
│               │ │ ! 國產燈具         │ │ ! 石材規格較低     │               │
│               │ │ ! 20 週工期        │ │                   │               │
│               │ │ [歷史報價]         │ │ [歷史報價]         │               │
│               │ │ [已核對實際成本]   │ │ [已核對實際成本]   │               │
│               │ │ DOC… COST… +4      │ │ DOC… COST… +3      │               │
│               │ │ [開啟專案] [比較✓] │ │ [開啟專案] [比較✓] │               │
│               │ └────────────────────┘ └────────────────────┘               │
│               │                                                              │
│               │ ┌────────────────────┐ ┌────────────────────┐               │
│               │ │ 79 具參考價值      │ │ 71 具參考價值      │               │
│               │ │ 南京品牌體驗中心   │ │ 大安精品展示中心   │               │
│               │ └────────────────────┘ └────────────────────┘               │
│               │                                                              │
│               │ What history suggests / Important differences / Gaps        │
│               │ [建立內部審查事項]                                           │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

### Annotations

1. The result summary communicates count, actual-cost sufficiency, and policy.
2. Cards explain the score; users are not asked to trust “88%” alone.
3. Economics badges use explicit authority language.
4. Evidence chips open the side panel.
5. The action follows the synthesis rather than appearing as an autonomous AI control.

---

## 4. Factor-detail disclosure

```text
┌─────────────────────────────────────────────┐
│ Why Neihu scored 88                         │
│ Policy: CPI-SIM-1.0                         │
│ Evidence coverage: 96%                      │
│                                             │
│ Factor                  Value   Weight  Pts  │
│ Project subtype         1.00      15   15.0 │
│ Scope overlap           0.88      25   21.9 │
│ Area similarity         0.93      20   18.6 │
│ Quote/cost categories   0.86      15   12.9 │
│ Material overlap        0.75      10    7.5 │
│ Supplier overlap        0.20       5    1.0 │
│ Recency                  …         5    …    │
│ Location                 …         5    …    │
│                                             │
│ Total                                   88  │
│ [Inspect factor evidence]                   │
└─────────────────────────────────────────────┘
```

### Annotations

- Factor detail may be a popover on desktop and sheet on mobile.
- All contributions reconcile to the stored result.
- Unknown factors show `Unknown`, not mismatch.

---

## 5. Evidence panel — claim mode

```text
┌──────────────────────── MAIN COMPARISON ───────────────────────┬─────────────┐
│                                                                │ Evidence  × │
│ Imported stone: +18%                                           │             │
│ [selected finding]                                             │ Claim       │
│                                                                │ Xinyi stone│
│                                                                │ forecast is │
│                                                                │ 18% above   │
│                                                                │ eligible    │
│                                                                │ actual med. │
│                                                                │             │
│                                                                │ Current     │
│                                                                │ FORECAST    │
│                                                                │ NT$…        │
│                                                                │             │
│                                                                │ Historical  │
│                                                                │ RECONCILED  │
│                                                                │ median NT$… │
│                                                                │             │
│                                                                │ Sources     │
│                                                                │ COST-NEIHU… │
│                                                                │ line/locator│
│                                                                │ [Open]      │
│                                                                │ COST-ZHONG… │
│                                                                │ [Open]      │
│                                                                │             │
│                                                                │ Calculation │
│                                                                │ [Expand]    │
└────────────────────────────────────────────────────────────────┴─────────────┘
```

### Annotations

- Panel begins with the claim, not a document list.
- Authority, locator, freshness, and source type are visible.
- Main comparison remains in place.
- Closing returns focus to the exact finding/evidence chip.

---

## 6. Quote comparison table

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Compare current quote                                                        │
│                                                                              │
│                         Xinyi v3       Neihu        Zhongshan      Nanjing    │
│ CONTEXT                                                                      │
│ Area                    640 m²          610 m²        590 m²         720 m²   │
│ Programme               16 weeks        20 weeks      18 weeks       22 weeks │
│                                                                              │
│ COMMERCIAL OBSERVATIONS                                                      │
│ Quoted price / m²       NT$… Forecast?  NT$… Quoted  NT$… Quoted   NT$…      │
│ Forecast direct cost    NT$… Forecast   —             —              —        │
│ Reconciled actual / m²  —               NT$… Actual  NT$… Actual   NT$…      │
│                                                                              │
│ CATEGORY FINDINGS                                                            │
│ Imported stone          +18% vs eligible actual median       [Evidence]      │
│ Lighting/electrical     +9% vs quoted median                                 │
│                         Actual range unavailable: 2 observations / 3 required │
│ Millwork                Approximately aligned                  [Evidence]      │
│ Signage                 -5% quoted history; scope differs       [Evidence]     │
│                                                                              │
│ PROGRAMME                                                                    │
│ 16 weeks is shorter; no supported quantified premium                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Annotations

- Row grouping prevents price/cost/authority confusion.
- Current forecast is not placed under reconciled actual.
- Insufficient evidence occupies the result location where a range might otherwise appear.
- Every material percentage opens its trace.

---

## 7. Structured synthesis

```text
┌──────────────────────────────────────────────────────────────┐
│ What history suggests                                        │
│ Current quote is above relevant history; imported stone has  │
│ the strongest evidence-backed variance.                      │
├──────────────────────────────────────────────────────────────┤
│ Important differences                                        │
│ Shorter programme and higher-specification lighting.         │
├──────────────────────────────────────────────────────────────┤
│ Evidence gaps                                                │
│ Only two reconciled lighting observations; current supplier  │
│ pricing and availability are not verified.                   │
├──────────────────────────────────────────────────────────────┤
│ Recommended next step                                        │
│ Validate stone allowance and lighting assumptions before     │
│ internal quote approval.                                     │
│                                                              │
│ [建立內部審查事項]                                            │
└──────────────────────────────────────────────────────────────┘
```

### Annotations

- The structure is stable even when optional model wording changes.
- No red/green “good/bad quote” judgment.

---

## 8. Internal action review sheet

```text
┌──────────────────────────────────────────────────────────────┐
│ Review internal action                                    ×  │
│                                                              │
│ Project                                                      │
│ PRJ-XINYI-026 · 信義旗艦店裝修                               │
│                                                              │
│ Title                                                        │
│ [Validate imported-stone and lighting assumptions …       ]  │
│                                                              │
│ Rationale                                                    │
│ [Stone +18% vs eligible actual median…                     ]  │
│ [Lighting +9% vs quoted history; actual evidence limited…  ]  │
│ [16-week programme difference remains unquantified…        ]  │
│                                                              │
│ Assignee              Due date                               │
│ [Financial Reviewer▾] [YYYY-MM-DD]                           │
│                                                              │
│ Evidence                                                     │
│ CPI-RUN-0001 · 8 references              [Inspect]            │
│                                                              │
│ This creates one internal review action. It does not approve  │
│ or issue the quote and does not contact anyone externally.   │
│                                                              │
│ [Cancel]                   [Create internal review action]    │
└──────────────────────────────────────────────────────────────┘
```

### Annotations

- Consequence is explicit.
- Mandatory uncertainty/evidence statements cannot be silently removed.
- No “Approve AI” wording.

---

## 9. Action receipt

```text
┌──────────────────────────────────────────────────────────────┐
│ ✓ Internal review action created                             │
│                                                              │
│ ACT-XINYI-0042                                               │
│ Validate imported-stone and lighting assumptions…           │
│                                                              │
│ Status       OPEN                                            │
│ Assignee     Financial Reviewer                              │
│ Due          2026-11-20                                      │
│ Project      PRJ-XINYI-026                                   │
│ Origin       CPI-RUN-0001 · CPI-SIM-1.0                      │
│ Evidence     8 references                                    │
│ Created      2026-11-14 16:20 Asia/Taipei                    │
│                                                              │
│ [View in project actions] [Return to comparison]             │
└──────────────────────────────────────────────────────────────┘
```

### Annotations

- The receipt is authoritative and linkable, not a transient toast only.
- The comparison remains available.

---

## 10. No eligible history

```text
┌──────────────────────────────────────────────────────────────┐
│ No eligible historical projects found                       │
│                                                              │
│ StrideBrain could not find completed, accessible projects    │
│ that meet the current comparison class and required context. │
│                                                              │
│ Check:                                                       │
│ • project comparison class                                   │
│ • area and scope categories                                  │
│ • historical project metadata                                │
│                                                              │
│ [Review current project context] [Explore company knowledge] │
└──────────────────────────────────────────────────────────────┘
```

### Annotations

- No inaccessible project count/title leakage.
- Offers a useful next step rather than an empty search result.

---

## 11. Insufficient actual-cost evidence

```text
┌──────────────────────────────────────────────────────────────┐
│ Lighting & electrical                                        │
│                                                              │
│ Quoted-price history                                         │
│ +9% versus historical quoted median             [Evidence]   │
│                                                              │
│ Reconciled actual-cost range                                 │
│ Not available                                                │
│ 2 eligible observations · 3 required                         │
│                                                              │
│ [Inspect eligible observations]                              │
└──────────────────────────────────────────────────────────────┘
```

### Annotations

- Abstention is visible where the number would have appeared.
- Quote history remains useful but clearly separate.

---

## 12. Conflict state

```text
┌──────────────────────────────────────────────────────────────┐
│ ⚠ Conflicting final stone records                            │
│                                                              │
│ COST-DAAN-016-FINAL-v1   NT$1,240,000   RECONCILED_ACTUAL    │
│ ADJ-DAAN-016-03          NT$1,310,000   APPROVED_COMMERCIAL   │
│                                                              │
│ No explicit supersession exists. This project’s stone value  │
│ is excluded from the historical aggregate.                   │
│                                                              │
│ [Inspect records]                                            │
└──────────────────────────────────────────────────────────────┘
```

### Annotations

- The system does not choose the newer record automatically.
- Mei may inspect but cannot resolve financial authority.

---

## 13. Optional explanation failure

```text
┌──────────────────────────────────────────────────────────────┐
│ Verified comparison complete                                │
│                                                              │
│ The optional written explanation is unavailable.             │
│ Ranked matches, calculations, evidence, and review actions    │
│ remain available.                                            │
│                                                              │
│ [Retry explanation]                                          │
└──────────────────────────────────────────────────────────────┘
```

### Annotation

This is a minor sub-state, never a full comparison failure.

---

## 14. Mobile comparison result

```text
┌─────────────────────────────┐
│ ‹ 信義旗艦店裝修            │
│ Compare                     │
├─────────────────────────────┤
│ 6 類似歷史專案              │
│ 3 具備已核對實際成本        │
│ CPI-SIM-1.0                 │
├─────────────────────────────┤
│ 88 高度相似                 │
│ 內湖科技旗艦店              │
│ 610 m² · 2025               │
│ ✓ 類型 ✓ 工項 ✓ 石材        │
│ ! 燈具 ! 工期               │
│ [歷史報價] [已核對實際成本]│
│ [比較] [資料依據]           │
├─────────────────────────────┤
│ What history suggests       │
│ …                           │
├─────────────────────────────┤
│ [比較目前報價]              │
│ [建立內部審查事項]          │
└─────────────────────────────┘
```

### Annotations

- Cards stack vertically.
- Evidence opens a full-height sheet.
- Comparison table transforms into row cards with a project selector.
- Primary action remains reachable without hiding evidence warnings.

---

## 15. Visual-design constraints for the next phase

Final visual design should:

- use restrained hierarchy and whitespace;
- make authority/status readable without excessive badges;
- avoid generic glassmorphism/AI gradients as the primary identity;
- use motion to clarify state changes, not decorate;
- keep evidence and commercial values highly legible;
- test Chinese density at realistic content lengths;
- pass contrast and focus requirements;
- maintain a calm operational tone.

These wireframes must be reviewed before high-fidelity styling or component implementation.