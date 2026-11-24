import { seededFirmLists } from "@/fixtures/firm-lists";
import { describe, expect, it } from "vitest";

import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type {
  Stage5EconomicsResult,
  StructuredEconomicsClaimDTO,
} from "@/modules/economics/domain/contracts";
import type {
  ConfirmInternalReviewInput,
  ProposalContent,
} from "@/modules/internal-review/domain/contracts";
import {
  addCalendarDays,
  calendarDate,
  dateBounds,
  dueDatePolicy,
  fullRationale,
  mandatoryClaims,
  proposalWording,
  validDueDate,
  validateEdits,
} from "@/modules/internal-review/domain/proposal-policy";

// These isolated policy fixtures deliberately use non-canonical run/source IDs and values.
function claims(): StructuredEconomicsClaimDTO[] {
  const values = [
    [
      "CATEGORY_FORECAST_ACTUAL_VARIANCE",
      "ALT_IMPORTED_STONE_VARIANCE",
      { variancePercent: "17.34", direction: "ABOVE" },
    ],
    [
      "CATEGORY_QUOTED_VARIANCE",
      "ALT_LIGHTING_ELECTRICAL_QUOTE",
      { variancePercent: "-4.26", direction: "BELOW" },
    ],
    [
      "CATEGORY_ACTUAL_INSUFFICIENT",
      "ALT_LIGHTING_ELECTRICAL_ACTUAL",
      { eligibleObservationCount: 1, requiredObservationCount: 3 },
    ],
    [
      "PROGRAMME_DIFFERENCE_UNQUANTIFIED",
      "ALT_PROGRAMME",
      {
        activeProgrammeWeeks: "11",
        historicalMinimumWeeks: "13",
        historicalMaximumWeeks: "16",
        quantifiedPremiumState: "UNQUANTIFIED",
      },
    ],
  ] as const;
  return values.map(([kind, claimKey, value], index) => ({
    kind,
    ...(index === 0
      ? { categoryId: "IMPORTED_STONE" }
      : index < 3
        ? { categoryId: "LIGHTING_ELECTRICAL" }
        : {}),
    claimKey,
    value,
    titleEn: "Verified finding",
    titleZhTw: "已驗證發現",
    evidenceReferenceIds: [`reference-${index}`],
    warningCodes: [],
  }));
}
function stage5(): Stage5EconomicsResult {
  const selected = claims();
  return {
    run: { id: "economics-independent" },
    claims: selected,
    categories: [
      {
        categoryId: "IMPORTED_STONE",
        actualHistory: { state: "SUFFICIENT" },
        forecastVariance: { state: "VALUE" },
      },
      {
        categoryId: "LIGHTING_ELECTRICAL",
        actualHistory: { state: "INSUFFICIENT" },
        quoteVariance: { state: "VALUE" },
      },
    ],
    evidenceBundles: selected.map((claim, index) => ({
      claimKey: claim.claimKey,
      warningCodes: [],
      sources: [
        {
          referenceId: claim.evidenceReferenceIds[0]!,
          subjectId: `subject-${index}`,
          subjectType: "PROJECT",
          locator: {},
          claimKey: claim.claimKey,
          authorityState: "HUMAN_REVIEWED",
          dataClassification: "DEMO_SYNTHETIC",
          conflictIds: [],
        },
      ],
    })),
  } as unknown as Stage5EconomicsResult;
}
function stage4(district: string | null = "Xinyi District"): Stage4ComparisonResult {
  return {
    run: { id: "comparison-independent" },
    activeContext: {
      location: { city: "Taipei City", district },
      nameEn: "Harbour Renovation",
      nameZhTw: "港灣裝修",
      activeQuoteVersionKey: "quote-independent-v3",
    },
  } as Stage4ComparisonResult;
}
function wording() {
  const result = stage5();
  return proposalWording(
    stage4(),
    result,
    mandatoryClaims(result)!,
    seededFirmLists.workCategories,
  );
}
function content(): ProposalContent {
  return { ...wording(), timezone: "Asia/Taipei" } as ProposalContent;
}
function command(overrides: Partial<ConfirmInternalReviewInput> = {}): ConfirmInternalReviewInput {
  return {
    version: "internal-review-command.v1",
    proposalKey: "proposal-one",
    title: wording().titleOptions[0]!.text.en,
    rationale: wording().rationaleOptions[0]!.text.en,
    confirmation: true,
    idempotencyKey: "8e33a52e-78fd-4ec9-ad1d-46613eed8942",
    locale: "en",
    dueDate: null,
    ...overrides,
  };
}

describe("Stage 8 verified claim selection", () => {
  it("selects all four required semantic claims in policy order, independent of input order", () => {
    const result = stage5();
    const selected = mandatoryClaims({ ...result, claims: [...result.claims].reverse() });
    expect(selected?.map((claim) => claim.claimKey)).toEqual(
      claims()
        .reverse()
        .map((claim) => claim.claimKey),
    );
  });

  it.each([
    "ambiguous claim",
    "missing bundle",
    "extra source",
    "missing source",
    "duplicate claim reference",
  ])("rejects %s without substituting nearby evidence", (defect) => {
    const result = stage5();
    const first = result.claims[0]!;
    const bundle = result.evidenceBundles[0]!;
    const broken = {
      ...result,
      ...(defect === "ambiguous claim"
        ? { claims: [...result.claims, { ...first, claimKey: "SECOND_IMPORTED_STONE_VARIANCE" }] }
        : {}),
      ...(defect === "duplicate claim reference"
        ? {
            claims: [
              {
                ...first,
                evidenceReferenceIds: [
                  ...first.evidenceReferenceIds,
                  ...first.evidenceReferenceIds,
                ],
              },
              ...result.claims.slice(1),
            ],
          }
        : {}),
      ...(defect === "missing bundle" ? { evidenceBundles: result.evidenceBundles.slice(1) } : {}),
      ...(defect === "extra source"
        ? {
            evidenceBundles: [
              {
                ...bundle,
                sources: [
                  ...bundle.sources,
                  { ...bundle.sources[0]!, referenceId: "unrelated-private-source" },
                ],
              },
              ...result.evidenceBundles.slice(1),
            ],
          }
        : {}),
      ...(defect === "missing source"
        ? { evidenceBundles: [{ ...bundle, sources: [] }, ...result.evidenceBundles.slice(1)] }
        : {}),
    };
    expect(mandatoryClaims(broken)).toBeNull();
  });

  it.each(["CONFLICTED", "SUPERSEDED", "unresolved conflict"])(
    "rejects mandatory support with %s authority",
    (defect) => {
      const result = stage5();
      const bundle = result.evidenceBundles[0]!;
      const source = bundle.sources[0]!;
      expect(
        mandatoryClaims({
          ...result,
          evidenceBundles: [
            {
              ...bundle,
              sources: [
                {
                  ...source,
                  authorityState:
                    defect === "unresolved conflict"
                      ? "RECONCILED_ACTUAL"
                      : (defect as "CONFLICTED" | "SUPERSEDED"),
                  conflictIds: defect === "unresolved conflict" ? ["conflict-one"] : [],
                },
              ],
            },
            ...result.evidenceBundles.slice(1),
          ],
        }),
      ).toBeNull();
    },
  );

  it("keeps lighting insufficiency as required content and ignores unrelated stale supplier history", () => {
    const result = stage5();
    const stale: StructuredEconomicsClaimDTO = {
      ...result.claims[0]!,
      kind: "STALE_SUPPLIER_EVIDENCE",
      claimKey: "HISTORICAL_SUPPLIER",
      evidenceReferenceIds: ["stale-supplier"],
    };
    expect(mandatoryClaims({ ...result, claims: [...result.claims, stale] })).toEqual(
      result.claims,
    );
    expect(
      mandatoryClaims({
        ...result,
        categories: result.categories.map((category) =>
          category.categoryId === "IMPORTED_STONE"
            ? { ...category, actualHistory: { ...category.actualHistory, state: "INSUFFICIENT" } }
            : category,
        ),
      }),
    ).toBeNull();
  });

  it("rejects a bundle that repeats the same reference instead of providing exact claim support", () => {
    const result = stage5();
    const bundle = result.evidenceBundles[0]!;
    expect(
      mandatoryClaims({
        ...result,
        evidenceBundles: [
          { ...bundle, sources: [...bundle.sources, ...bundle.sources] },
          ...result.evidenceBundles.slice(1),
        ],
      }),
    ).toBeNull();
  });
});

describe("Stage 8 finite bilingual wording and immutable warnings", () => {
  it("derives the canonical title and displayed facts from stored values", () => {
    const result = wording();
    expect(result.titleOptions[0]!.text.en).toBe(
      "Validate Imported stone and hard finishes, Lighting and electrical · Harbour Renovation",
    );
    expect(result.titleOptions[0]!.text.zhTw).toBe("檢核進口石材與硬質面材、照明與電氣 · 港灣裝修");
    const facts = result.mandatoryStatements.map((statement) => statement.text.en).join("\n");
    expect(facts).toContain("+17.3%");
    expect(facts).toContain("-4.3%");
    expect(facts).toContain("1 of 3 required observations");
    expect(facts).toContain("11 weeks versus 13–16 weeks");
    expect(facts).toContain("comparison-independent");
    expect(facts).toContain("economics-independent");
    expect(
      proposalWording(
        stage4("Banqiao District"),
        stage5(),
        claims(),
        seededFirmLists.workCategories,
      ).titleOptions[0]!.text.en,
    ).toContain("Harbour Renovation");
    expect(
      proposalWording(stage4(null), stage5(), claims(), seededFirmLists.workCategories)
        .titleOptions[0]!.text.en,
    ).toContain("Harbour Renovation");
  });

  it.each(["en", "zhTw"] as const)(
    "accepts all approved %s combinations while preserving every locked statement verbatim",
    (locale) => {
      const original = content();
      const before = JSON.stringify(original);
      for (const title of original.titleOptions)
        for (const rationale of original.rationaleOptions) {
          expect(
            validateEdits(
              original,
              command({ title: title.text[locale], rationale: rationale.text[locale] }),
              new Date("2026-11-15T10:00:00Z"),
            ),
          ).toEqual({});
          const complete = fullRationale(original, rationale.text);
          for (const statement of [...original.mandatoryStatements, ...original.warnings]) {
            expect(complete[locale]).toContain(statement.text[locale]);
          }
        }
      expect(JSON.stringify(original)).toBe(before);
    },
  );

  it.each([
    "The supplier overcharges by 50%",
    "已核准報價並發送給客戶",
    "<script>alert(1)</script>",
    "Review\u0000now",
    " ",
  ])("rejects arbitrary wording: %s", (text) => {
    expect(
      validateEdits(
        content(),
        command({ title: text, rationale: text }),
        new Date("2026-11-15T10:00:00Z"),
      ),
    ).toMatchObject({ title: "INVALID_TITLE", rationale: "INVALID_RATIONALE" });
  });

  it("does not accept the mandatory warning text as a client-editable rationale", () => {
    const proposal = content();
    expect(
      validateEdits(
        proposal,
        command({
          rationale: fullRationale(proposal, proposal.rationaleOptions[0]!.text).en,
          confirmation: false,
        }),
        new Date("2026-11-15T10:00:00Z"),
      ),
    ).toMatchObject({ rationale: "INVALID_RATIONALE", confirmation: "CONFIRMATION_REQUIRED" });
  });

  it.each(["unsupported", "NaN", "1e3", "17%"])(
    "rejects unsupported stored variance %s instead of inventing a number",
    (variancePercent) => {
      const selected = claims();
      selected[0] = { ...selected[0]!, value: { variancePercent } };
      expect(() =>
        proposalWording(stage4(), stage5(), selected, seededFirmLists.workCategories),
      ).toThrow("CLAIM_INVALID");
    },
  );

  it("enforces complete-rationale and Unicode title bounds", () => {
    const proposal = content();
    expect(() =>
      fullRationale(
        { ...proposal, warnings: [{ key: "LARGE", text: { en: "x".repeat(8001), zhTw: "警" } }] },
        proposal.rationaleOptions[0]!.text,
      ),
    ).toThrow("RATIONALE_BOUND");
    const original = stage4();
    const bounded = proposalWording(
      {
        ...original,
        activeContext: {
          ...original.activeContext,
          nameEn: "𠮷".repeat(201),
          nameZhTw: "𠮷".repeat(201),
        },
      },
      stage5(),
      claims(),
      seededFirmLists.workCategories,
    );
    for (const option of bounded.titleOptions) {
      expect([...option.text.en].length).toBeLessThanOrEqual(200);
      expect([...option.text.zhTw].length).toBeLessThanOrEqual(200);
      expect(option.text.en).toContain("…");
      expect(option.text.en).not.toContain("�");
    }
  });
});

describe("Stage 8 organization-local due dates", () => {
  it.each([
    [
      "2028-02-28T15:59:59.000Z",
      "Asia/Taipei",
      "2028-02-28",
      "2029-02-27",
      "2028-02-28T16:00:00.000Z",
    ],
    [
      "2028-02-28T16:00:00.000Z",
      "Asia/Taipei",
      "2028-02-29",
      "2029-02-28",
      "2028-02-29T16:00:00.000Z",
    ],
    [
      "2028-02-29T16:00:00.000Z",
      "Asia/Taipei",
      "2028-03-01",
      "2029-03-01",
      "2028-03-01T16:00:00.000Z",
    ],
    [
      "2026-03-08T07:30:00.000Z",
      "America/New_York",
      "2026-03-08",
      "2027-03-08",
      "2026-03-09T04:00:00.000Z",
    ],
    [
      "2026-11-01T05:30:00.000Z",
      "America/New_York",
      "2026-11-01",
      "2027-11-01",
      "2026-11-02T05:00:00.000Z",
    ],
  ])(
    "provides authoritative bounds and exact next calendar boundary for %s in %s",
    (instant, timezone, min, max, next) => {
      expect(dueDatePolicy(new Date(instant), timezone)).toEqual({
        minDueDate: min,
        maxDueDate: max,
        datePolicyEvaluatedAt: instant,
        nextDatePolicyBoundaryAt: next,
      });
      expect(calendarDate(new Date(Date.parse(next) - 1), timezone)).toBe(min);
      expect(calendarDate(new Date(next), timezone)).not.toBe(min);
    },
  );
  it("uses organization midnight, not UTC or the browser offset", () => {
    const instant = new Date("2026-11-15T16:00:00Z");
    expect(calendarDate(instant, "Asia/Taipei")).toBe("2026-11-16");
    expect(calendarDate(instant, "America/Los_Angeles")).toBe("2026-11-15");
    expect(validDueDate("2026-11-15", instant, "Asia/Taipei")).toBe(false);
    expect(validDueDate("2026-11-16", instant, "Asia/Taipei")).toBe(true);
  });

  it("includes today and today+365 and permits clearing", () => {
    const instant = new Date("2027-03-01T00:00:00Z");
    expect(dateBounds(instant, "Asia/Taipei")).toEqual({ min: "2027-03-01", max: "2028-02-29" });
    for (const date of [null, undefined, "", "2027-03-01", "2028-02-29"])
      expect(validDueDate(date, instant, "Asia/Taipei")).toBe(true);
    for (const date of ["2027-02-28", "2028-03-01"])
      expect(validDueDate(date, instant, "Asia/Taipei")).toBe(false);
    expect(addCalendarDays("2027-12-29", 7)).toBe("2028-01-05");
  });

  it.each([
    "2027-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-11-31",
    "2026-1-01",
    "2026-11-15T00:00:00Z",
  ])("rejects non-Gregorian or non-date-only input %s", (date) => {
    expect(validDueDate(date, new Date("2026-01-01T00:00:00Z"), "Asia/Taipei")).toBe(false);
  });

  it("adds calendar days across daylight-saving transitions", () => {
    expect(calendarDate(new Date("2026-03-08T07:30:00Z"), "America/New_York")).toBe("2026-03-08");
    expect(addCalendarDays("2026-03-08", 7)).toBe("2026-03-15");
  });
});

it("QA-18 keeps forecast versus reconciled actual and quoted-price findings explicit in every immutable bilingual rationale", () => {
  const proposal = content();
  for (const option of proposal.rationaleOptions) {
    const rationale = fullRationale(proposal, option.text);
    expect(rationale.en).toContain(
      "Imported stone and hard finishes forecast direct cost differs by +17.3% from eligible reconciled-actual history.",
    );
    expect(rationale.zhTw).toContain("進口石材與硬質面材預估直接成本");
    expect(rationale.zhTw).toContain("已核對實際成本");
    expect(rationale.en).toContain("Lighting and electrical quoted price");
    expect(rationale.en).not.toContain("Imported-stone actual cost differs");
    expect(rationale.zhTw).not.toContain("進口石材實際成本差異");
  }
});

it("selects variable categories by explicit identity and returns an empty review set for aligned claims", () => {
  const original = stage5();
  const remap = (categoryId: string | undefined) =>
    categoryId === "IMPORTED_STONE"
      ? "CUSTOM_MILLWORK"
      : categoryId === "LIGHTING_ELECTRICAL"
        ? "SIGNAGE"
        : undefined;
  const result = {
    ...original,
    categories: original.categories.map((c) => ({ ...c, categoryId: remap(c.categoryId)! })),
    claims: original.claims.map((c, i) => ({
      ...c,
      claimKey: `opaque-${i}`,
      categoryId: remap(c.categoryId),
    })),
    evidenceBundles: original.evidenceBundles.map((b, i) => ({ ...b, claimKey: `opaque-${i}` })),
  };
  expect(mandatoryClaims(result)).toEqual(result.claims);
  const text = proposalWording(
    stage4(),
    result,
    mandatoryClaims(result)!,
    seededFirmLists.workCategories,
  )
    .mandatoryStatements.map((s) => s.text.en)
    .join(" ");
  expect(text).toContain("Custom millwork");
  expect(text).toContain("Signage");
  expect(text).not.toMatch(/stone|lighting/i);
  expect(
    mandatoryClaims({
      ...result,
      claims: result.claims
        .filter((c) => c.kind === "CATEGORY_QUOTED_VARIANCE")
        .map((c) => ({ ...c, value: { ...c.value, direction: "ALIGNED" } })),
    }),
  ).toEqual([]);
  expect(mandatoryClaims({ ...result, claims: [] })).toEqual([]);
});
