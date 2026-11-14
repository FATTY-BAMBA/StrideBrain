# Horizon Atelier — StrideBrain v0.1 Hero Narrative

**Organization:** Horizon Atelier / 禾序空間設計  
**Industry:** Taiwan interior design and renovation  
**Data classification:** `DEMO_SYNTHETIC`  
**Snapshot date:** 2026-11-14  
**Primary user:** Mei Lin / 林美玲 — Senior Estimator and Project Manager  
**Hero project:** Xinyi Flagship Renovation / 信義旗艦店裝修  
**Target duration:** 7–9 minutes

## 1. What the demonstration must prove

The demonstration is successful when a prospect understands this idea without a technical explanation:

> Horizon Atelier’s completed projects are not dead folders. StrideBrain can connect their scope, quotations, final costs, suppliers, materials, outcomes, and evidence so the next project begins with the company’s accumulated intelligence.

The demonstration must visibly complete this loop:

```text
current project
  → relevant history
  → explainable comparison
  → source evidence
  → current-quote review
  → internal action
```

The “wow” is not that an AI can write prose. The “wow” is that StrideBrain knows which company records matter, distinguishes their authority, explains its comparison, and moves the user into governed work.

---

## 2. Fictional company fixture

Horizon Atelier is a fictional Taipei interior design and renovation studio.

Target fixture composition:

- 24 completed projects;
- 5 active projects;
- 14 people;
- 14 clients;
- 20 suppliers/subcontractors;
- 48–56 quotation versions;
- 350–500 quote/cost lines;
- 100+ source/evidence records;
- explicit stale, conflicting, partial, and inaccessible examples.

The dataset must not be perfectly clean. It should include:

- a superseded quote version;
- one unresolved conflicting cost record;
- a stale supplier offer;
- a historical project with strong scope similarity but insufficient actual-cost evidence;
- a project the hero user cannot access;
- at least one partial match below the primary threshold.

---

## 3. Hero user and permission context

### Mei Lin / 林美玲

- Senior Estimator and Project Manager;
- assigned to `PRJ-XINYI-026`;
- may read its commercial records;
- may read approved historical actual-cost summaries under `commercial_actual_read`;
- may run comparisons;
- may create and assign an internal review action;
- may not resolve financial authority conflicts;
- may not issue a quotation or contact a supplier from this slice.

The browser does not choose Horizon Atelier or Mei’s permissions. The runtime context supplies them.

---

## 4. Current project fixture

| Field | Value |
|---|---|
| Project ID | `PRJ-XINYI-026` |
| English name | Xinyi Flagship Renovation |
| Chinese name | 信義旗艦店裝修 |
| Client | Aster Retail Taiwan / 星序零售台灣 |
| Comparison class | `COMMERCIAL_INTERIOR_FIT_OUT` |
| Subtype | `RETAIL_FLAGSHIP` |
| Location | Taipei City, Xinyi District |
| Area | 640 m² |
| Stage | Quote review |
| Target programme | 16 weeks |
| Target handover | 2027-02-20 |
| Active quote | `Q-XINYI-026` v3 |
| Proposed price before tax | NT$16,480,000 |
| Forecast direct cost | NT$12,650,000 |
| Calculated target gross margin | 23.2% |

### Current scope

- selective demolition;
- partitions and ceilings;
- custom millwork;
- lighting and electrical works;
- imported stone and hard finishes;
- signage and display installation;
- site coordination and handover.

### Current uncertainty

The quote is ready for internal review, but Mei wants to understand whether:

- the imported-stone allowance is outside relevant history;
- the lighting/electrical package is unusual;
- the accelerated 16-week programme explains part of the variance;
- the evidence is strong enough to recommend a pricing adjustment.

---

## 5. Canonical comparable set

The fixture and `CPI-SIM-1.0` tests should produce the following expected primary ordering. Scores are fixture expectations, not hard-coded UI content.

| Rank | Project | Area | Completed | Expected band | Expected score |
|---:|---|---:|---|---|---:|
| 1 | Neihu Tech Flagship / 內湖科技旗艦店 (`PRJ-NEIHU-021`) | 610 m² | 2025-06-30 | Strong | 88 |
| 2 | Zhongshan Lifestyle Store / 中山生活概念店 (`PRJ-ZHONGSHAN-018`) | 590 m² | 2024-11-15 | Strong | 81 |
| 3 | Nanjing Brand Experience Center / 南京品牌體驗中心 (`PRJ-NANJING-023`) | 720 m² | 2026-02-10 | Relevant | 79 |
| 4 | Daan Premium Showroom / 大安精品展示中心 (`PRJ-DAAN-016`) | 520 m² | 2024-04-20 | Relevant | 71 |
| 5 | Songshan Retail Renewal / 松山門市改裝 (`PRJ-SONGSHAN-020`) | 680 m² | 2025-02-28 | Relevant | 69 |
| 6 | Banqiao Concept Store / 板橋概念店 (`PRJ-BANQIAO-015`) | 760 m² | 2023-09-30 | Partial | 63 |

A change to this canonical ordering requires a fixture or policy-version change and corresponding eval updates.

### Top-match explanation

`PRJ-NEIHU-021` should rank first because it has:

- the same `RETAIL_FLAGSHIP` subtype;
- 610 m² versus 640 m²;
- strong overlap in demolition, ceiling, millwork, electrical, stone, signage, and coordination categories;
- the same imported-stone material category;
- comparable quotation composition;
- one supplier overlap;
- relatively recent completion.

Important difference:

- Neihu used a domestic lighting package and a 20-week programme; Xinyi uses a higher-specification lighting package and a 16-week programme.

---

## 6. Canonical historical economics

All figures below are synthetic.

### Top three historical project records

| Project | Final quoted price before tax | Reconciled actual direct cost | Authority |
|---|---:|---:|---|
| Neihu Tech Flagship | NT$15,120,000 | NT$11,580,000 | quote: `APPROVED_COMMERCIAL`; cost: `RECONCILED_ACTUAL` |
| Zhongshan Lifestyle Store | NT$13,950,000 | NT$10,840,000 | quote: `APPROVED_COMMERCIAL`; cost: `RECONCILED_ACTUAL` |
| Nanjing Brand Experience Center | NT$17,300,000 | NT$13,420,000 | quote: `APPROVED_COMMERCIAL`; cost: `RECONCILED_ACTUAL` |

### Intended comparison findings

The deterministic comparison should support these structured findings:

1. **Overall quoted price**  
   Xinyi v3 is approximately 7% above the median quoted price per m² of the top three comparables.

2. **Forecast direct cost**  
   Xinyi’s forecast direct cost per m² is approximately 6% above the median reconciled actual direct cost per m² of the top three comparables.

3. **Imported stone and hard finishes**  
   Xinyi’s current forecast is approximately 18% above the normalized reconciled actual-cost median for eligible comparable stone/finish lines.

4. **Lighting and electrical**  
   Xinyi’s quoted category is approximately 9% above the historical quoted-price median. Only two eligible reconciled actual observations exist, so StrideBrain must not produce an actual-cost range for this category.

5. **Custom millwork**  
   Xinyi is within approximately 2% of the relevant reconciled historical median.

6. **Signage**  
   Xinyi appears approximately 5% below quoted history, but the scope differs materially, so the system must not describe this as savings without qualification.

7. **Programme difference**  
   Xinyi’s 16-week programme is shorter than the 18–22 week range of the strongest comparables. No authoritative evidence quantifies the schedule premium, so the system may identify the difference but not assign a cost cause.

### Required conclusion

StrideBrain may conclude:

> The current quote is above the strongest historical comparables, with the largest evidence-backed variance in imported stone. Lighting also deserves review, but actual-cost evidence is insufficient. The accelerated programme is a meaningful difference, although the available records do not prove how much premium it creates.

StrideBrain may not conclude:

- the quote is wrong;
- the contractor or supplier is overcharging;
- the schedule premium explains the full difference;
- historical prices are current market prices;
- a customer quote should be reduced automatically.

---

## 7. Evidence fixture requirements

The hero flow needs evidence for:

- project metadata and scope;
- each quote version;
- reconciled final-cost versions;
- line-level stone, electrical, millwork, and signage observations;
- supplier/material relationships;
- programme dates;
- supersession links;
- one stale supplier offer;
- one conflicting value outside the primary aggregate;
- one insufficient-evidence category.

Recommended evidence IDs should follow typed patterns rather than generic filenames, for example:

```text
Q-NEIHU-021-v4
COST-NEIHU-021-FINAL-v2
EVID-NEIHU-021-STONE-01
DOC-NEIHU-021-CLOSEOUT-v1
SUP-OFFER-STONE-2025-041
```

Exact IDs may change during schema design, but their object types and version relationships must remain explicit.

---

## 8. Demonstration script

## 0:00–0:40 — Enter the project, not a feature catalogue

Open the Xinyi project workspace directly.

The screen should immediately show:

- project identity and stage;
- quote v3 summary;
- current project context;
- evidence freshness/coverage indicator;
- one contextual StrideBrain input.

Narrator framing:

> “We’re reviewing a real work object in the demo company—not opening a generic chatbot. StrideBrain already knows which organization, project, quote, language, and permissions apply.”

Do not begin on a dashboard full of module cards.

## 0:40–1:30 — Ask the hero question

User asks:

> **Have we done something like this before?**  
> **我們以前做過類似的案子嗎？**

Structured results load independently of any model-written explanation.

Expected header:

```text
6 comparable projects found
3 have eligible reconciled actual-cost evidence
Comparison policy: CPI-SIM-1.0
```

## 1:30–2:40 — Understand why, not just what

Open the Neihu result card.

The card must show:

- 88 / Strong match;
- evidence coverage;
- three strongest similarities;
- the domestic-lighting and programme differences;
- quote and actual-cost badges;
- top evidence chips;
- warning count;
- `Open project` and `Compare`.

Narrator framing:

> “The score is not an AI guess. These are the factors and records that produced it.”

## 2:40–3:40 — Inspect the evidence

Open the evidence panel.

Show:

- project and quote versions;
- final-cost version;
- exact stone cost-line evidence;
- authority state;
- date and source locator;
- one superseded record;
- one stale supplier offer clearly labeled as historical.

Ask:

> **Where did those numbers come from?**  
> **這些數字是從哪裡來的？**

The answer should navigate or highlight evidence rather than produce a separate bibliography paragraph.

## 3:40–5:20 — Compare the current quote

Ask:

> **Compare our current quote with the strongest precedents.**  
> **把目前報價和最接近的歷史專案比較一下。**

The comparison table shows:

- current Xinyi v3;
- Neihu, Zhongshan, and Nanjing;
- quoted price separately from actual direct cost;
- category differences;
- programme and material differences;
- evidence sufficiency.

Expected structured highlights:

- imported stone: +18% versus reconciled actual median;
- lighting/electrical: +9% versus quoted median, but insufficient actual-cost evidence;
- millwork: approximately aligned;
- accelerated programme: meaningful difference, unquantified.

## 5:20–6:30 — Demonstrate honest uncertainty

The synthesis panel should contain:

### What history suggests

The current quotation is above relevant history, with the strongest evidence-backed variance in imported stone.

### Important differences

The current project has a shorter programme and higher-specification lighting.

### Evidence gaps

Lighting has only two reconciled actual observations; supplier availability/current pricing is not verified.

### Recommended next step

Validate the imported-stone allowance and lighting assumptions before internal quote approval.

Narrator framing:

> “StrideBrain is useful because it knows what it cannot conclude. It gives us a focused review, not a confident-sounding guess.”

## 6:30–7:40 — Turn intelligence into governed work

Select:

> **Create internal review action**  
> **建立內部審查事項**

Prepared action:

```text
Title:
Validate imported-stone and lighting assumptions for Xinyi quote v3

Rationale:
Stone forecast is 18% above the eligible reconciled historical median.
Lighting quoted value is 9% above quoted history, but actual-cost evidence is insufficient.
The 16-week programme may affect cost, but no quantified premium is supported.

Suggested assignee:
Financial Reviewer

Evidence:
Comparison run + selected quote/cost/document references
```

The user reviews, edits if necessary, and explicitly confirms creation.

The application creates:

- one internal Action;
- one audit event;
- a link to the comparison run;
- evidence references.

No email, LINE message, supplier contact, price approval, or quote issue occurs.

## 7:40–8:30 — Close the product story

Return to the project action list and show the new review action.

Closing line:

> “The completed projects did not merely produce search results. They informed a decision, showed their evidence, and created the next governed piece of work. When that review is completed, its outcome becomes part of what Horizon Atelier knows.”

This completes `Know → Think → Do` and demonstrates the beginning of `Learn`.

---

## 9. Traditional Chinese hero language

Recommended key phrases:

| English | Taiwan Traditional Chinese |
|---|---|
| Comparable projects | 類似歷史專案 |
| Strong match | 高度相似 |
| Relevant match | 具參考價值 |
| Partial match | 部分相似 |
| Evidence coverage | 資料完整度 |
| Quoted price | 歷史報價 |
| Forecast direct cost | 預估直接成本 |
| Reconciled actual cost | 已核對實際成本 |
| Important differences | 重要差異 |
| Evidence gaps | 資料缺口 |
| Create internal review action | 建立內部審查事項 |
| Insufficient actual-cost evidence | 實際成本資料不足 |
| Conflicting records | 資料紀錄不一致 |

The final design review may refine terminology, but critical labels must remain semantically distinct.

---

## 10. Required states during the demo

The fixture and UX must make these states testable even if they are not all shown in the main presentation:

- successful comparison;
- no eligible history;
- partial match without actual-cost evidence;
- conflicting records;
- stale supplier offer;
- permission-redacted economics;
- optional AI explanation unavailable while structured results remain usable;
- action creation success;
- action creation safely rejected for a Viewer.

---

## 11. Demo integrity rules

The presenter must not say or imply that:

- the data belongs to a real company;
- the historical amounts are market benchmarks;
- the comparison is a legal, accounting, or commercial approval;
- the system has contacted suppliers or customers;
- the optional model created the deterministic ranking;
- the first release is ready for real customer data.

The fixture may be rich and realistic. Its classification must remain visible and honest.

---

## 12. Acceptance criteria

The narrative passes when:

- a first-time viewer understands the product within 30 seconds;
- the hero question returns structured results in the required performance budget;
- top comparable order matches the canonical eval;
- score factors and important differences are visible;
- quoted price and actual cost cannot be confused;
- all material amounts open exact evidence;
- lighting correctly abstains from an actual-cost range;
- the system does not claim the quote is wrong or overpriced;
- one internal review action is created with audit/evidence links;
- the journey works in English and Traditional Chinese;
- the complete flow fits inside ten minutes.
