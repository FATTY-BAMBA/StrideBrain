import { expect, it } from "vitest";
import { claimFindingText } from "@/modules/economics/presentation/claim-findings";
import type { StructuredEconomicsClaimDTO } from "@/modules/economics/domain/contracts";

it.each([
  [
    "CATEGORY_QUOTED_VARIANCE",
    "SIGNAGE",
    "ABOVE",
    "12.34",
    "Signage and display installation: quoted price is 12.3% above past quoted prices.",
    "標示與展示安裝：報價比過往報價高 12.3%",
  ],
  [
    "CATEGORY_FORECAST_ACTUAL_VARIANCE",
    "CUSTOM_MILLWORK",
    "BELOW",
    "-8.26",
    "Custom millwork: forecast cost is 8.3% below past reconciled actual costs.",
    "客製木作：預估成本比過往已核對實際成本低 8.3%",
  ],
  [
    "OVERALL_QUOTED_VARIANCE",
    undefined,
    "BELOW",
    "-57.2",
    "Overall: quoted price is 57.2% below past quoted prices.",
    "整體：報價比過往報價低 57.2%",
  ],
  [
    "OVERALL_FORECAST_ACTUAL_VARIANCE",
    undefined,
    "ABOVE",
    "18",
    "Overall: forecast cost is 18.0% above past reconciled actual costs.",
    "整體：預估成本比過往已核對實際成本高 18.0%",
  ],
] as const)(
  "renders complete bilingual sentences for %s/%s",
  (kind, categoryId, direction, variancePercent, en, zh) => {
    const claim: StructuredEconomicsClaimDTO = {
      claimKey: "sentence",
      titleEn: "Stored claim",
      titleZhTw: "已儲存項目",
      evidenceReferenceIds: [],
      warningCodes: [],
      kind,
      ...(categoryId ? { categoryId } : {}),
      value: { direction, variancePercent },
    };
    expect(claimFindingText(claim, "en")).toBe(en);
    expect(claimFindingText(claim, "zh-TW")).toBe(zh);
  },
);
it("renders insufficiency and programme sentences exactly", () => {
  const insufficient: StructuredEconomicsClaimDTO = {
    claimKey: "insufficient",
    titleEn: "Stored claim",
    titleZhTw: "已儲存項目",
    evidenceReferenceIds: [],
    warningCodes: [],
    kind: "CATEGORY_ACTUAL_INSUFFICIENT",
    categoryId: "SIGNAGE",
    value: { eligibleObservationCount: 1, requiredObservationCount: 3 },
  };
  expect(claimFindingText(insufficient, "en")).toBe(
    "Signage and display installation: too few past reconciled actual costs to compare (1 of 3 needed).",
  );
  expect(claimFindingText(insufficient, "zh-TW")).toBe(
    "標示與展示安裝：過往已核對實際成本紀錄不足，無法比較（1/3）",
  );
  const programme: StructuredEconomicsClaimDTO = {
    claimKey: "programme",
    titleEn: "Stored claim",
    titleZhTw: "已儲存項目",
    evidenceReferenceIds: [],
    warningCodes: [],
    kind: "PROGRAMME_DIFFERENCE_UNQUANTIFIED",
    value: {},
  };
  expect(claimFindingText(programme, "en")).toBe(
    "The programme differs from the selected past jobs; the cost effect is not quantified.",
  );
  expect(claimFindingText(programme, "zh-TW")).toBe(
    "工期與所選過往專案不同，對成本的影響尚未量化。",
  );
});
