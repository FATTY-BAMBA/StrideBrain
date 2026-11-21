import { sha256 } from "@/modules/comparisons/application/fingerprints";
import type { Stage4ComparisonResult } from "@/modules/comparisons/domain/contracts";
import type {
  Stage5EconomicsResult,
  StructuredEconomicsClaimDTO,
} from "@/modules/economics/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import type {
  ConfirmInternalReviewInput,
  FieldErrors,
  DueDatePolicyDTO,
  LocalizedText,
  LocalizedWordingOption,
  ProposalContent,
  ReviewStatement,
} from "@/modules/internal-review/domain/contracts";

export const SAFE_REVIEW_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
export const CONFIRMATION_KEY =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const PROPOSAL_TTL_MS = 30 * 60 * 1000;

export function localize(text: LocalizedText, locale: Locale): string {
  return locale === "zh-TW" ? text.zhTw : text.en;
}
export function calendarDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-${parts.find((p) => p.type === "day")!.value}`;
}
export function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function dateBounds(now: Date, timezone: string): Readonly<{ min: string; max: string }> {
  const min = calendarDate(now, timezone);
  return { min, max: addCalendarDays(min, 365) };
}
/** Server-only calendar boundary calculation; never derives policy from a browser clock. */
export function dueDatePolicy(now: Date, timezone: string): DueDatePolicyDTO {
  const bounds = dateBounds(now, timezone);
  // Find the first instant outside this organization-local calendar day. The search
  // also handles IANA zones with DST; the UI schedules this instant, not a 24h delay.
  let before = now.getTime();
  let after = before + 36 * 60 * 60 * 1000;
  while (after - before > 1) {
    const middle = Math.floor((before + after) / 2);
    if (calendarDate(new Date(middle), timezone) === bounds.min) before = middle;
    else after = middle;
  }
  return {
    minDueDate: bounds.min,
    maxDueDate: bounds.max,
    datePolicyEvaluatedAt: now.toISOString(),
    nextDatePolicyBoundaryAt: new Date(after).toISOString(),
  };
}

export function validDueDate(
  value: string | null | undefined,
  now: Date,
  timezone: string,
): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    return false;
  const bounds = dateBounds(now, timezone);
  return value >= bounds.min && value <= bounds.max;
}
function percent(value: unknown): string {
  if (typeof value !== "string" || !/^-?\d+(\.\d+)?$/.test(value)) throw new Error("CLAIM_INVALID");
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    signDisplay: "always",
  }).format(Number(value));
}
function numeric(value: unknown): string {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !/^\d+(\.\d+)?$/.test(String(value))
  )
    throw new Error("CLAIM_INVALID");
  return String(value);
}
function exactIds(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    sha256([...new Set(left)].sort()) === sha256([...new Set(right)].sort()) &&
    new Set(left).size === left.length &&
    new Set(right).size === right.length
  );
}

/** Select semantic claim kinds and taxonomy categories, never named fixture identifiers. */
export function mandatoryClaims(
  result: Stage5EconomicsResult,
): readonly StructuredEconomicsClaimDTO[] | null {
  const specifications = [
    ["CATEGORY_FORECAST_ACTUAL_VARIANCE", "IMPORTED_STONE"],
    ["CATEGORY_QUOTED_VARIANCE", "LIGHTING_ELECTRICAL"],
    ["CATEGORY_ACTUAL_INSUFFICIENT", "LIGHTING_ELECTRICAL"],
    ["PROGRAMME_DIFFERENCE_UNQUANTIFIED", ""],
  ] as const;
  const claims: StructuredEconomicsClaimDTO[] = [];
  for (const [kind, category] of specifications) {
    const matches = result.claims.filter(
      (claim) => claim.kind === kind && (!category || claim.categoryId === category),
    );
    if (matches.length !== 1) return null;
    const claim = matches[0]!;
    const bundles = result.evidenceBundles.filter((bundle) => bundle.claimKey === claim.claimKey);
    if (
      bundles.length !== 1 ||
      claim.evidenceReferenceIds.length === 0 ||
      !exactIds(
        claim.evidenceReferenceIds,
        bundles[0]!.sources.map((source) => source.referenceId),
      )
    )
      return null;
    if (
      bundles[0]!.sources.some(
        (source) =>
          source.authorityState === "CONFLICTED" ||
          source.authorityState === "SUPERSEDED" ||
          source.conflictIds.length > 0,
      )
    )
      return null;
    claims.push(claim);
  }
  const stone = result.categories.find((category) => category.categoryId === "IMPORTED_STONE");
  const lighting = result.categories.find(
    (category) => category.categoryId === "LIGHTING_ELECTRICAL",
  );
  if (
    stone?.actualHistory.state !== "SUFFICIENT" ||
    stone.forecastVariance.state !== "VALUE" ||
    lighting?.quoteVariance.state !== "VALUE" ||
    lighting.actualHistory.state !== "INSUFFICIENT"
  )
    return null;
  return claims;
}

export function proposalWording(
  stage4: Stage4ComparisonResult,
  stage5: Stage5EconomicsResult,
  claims: readonly StructuredEconomicsClaimDTO[],
): Readonly<{
  titleOptions: readonly LocalizedWordingOption[];
  rationaleOptions: readonly LocalizedWordingOption[];
  mandatoryStatements: readonly ReviewStatement[];
  warnings: readonly ReviewStatement[];
}> {
  const district = stage4.activeContext.location.district?.replace(/\s+District$/i, "");
  const project = district || stage4.activeContext.nameEn;
  const quoteVersion =
    stage4.activeContext.activeQuoteVersionKey?.match(/(?:[:_-]|\b)v(\d+)$/i)?.[1];
  if (!quoteVersion) throw new Error("QUOTE_VERSION_REQUIRED");
  const zhProject = stage4.activeContext.nameZhTw;
  const titleOptions = [
    {
      key: "VALIDATE",
      text: {
        en: `Validate imported-stone and lighting assumptions for ${project} quote v${quoteVersion}`,
        zhTw: `檢核${zhProject}第${quoteVersion}版報價的進口石材與照明假設`,
      },
    },
    {
      key: "REVIEW",
      text: {
        en: `Review imported-stone and lighting assumptions for ${project} quote v${quoteVersion}`,
        zhTw: `審查${zhProject}第${quoteVersion}版報價的進口石材與照明假設`,
      },
    },
    {
      key: "CHECK",
      text: {
        en: `Check evidence for imported-stone and lighting assumptions in ${project} quote v${quoteVersion}`,
        zhTw: `確認${zhProject}第${quoteVersion}版報價之進口石材與照明假設的佐證資料`,
      },
    },
  ];
  if (
    titleOptions.some((option) =>
      Object.values(option.text).some((value) => [...value].length > 200),
    )
  )
    throw new Error("TITLE_BOUND");
  const rationaleOptions = [
    {
      key: "REVIEW_NEXT",
      text: {
        en: "Review these assumptions against the linked evidence before the next internal quotation review.",
        zhTw: "下次內部報價審查前，依連結的佐證資料檢核這些假設。",
      },
    },
    {
      key: "RECORD_QUESTIONS",
      text: {
        en: "Check the supporting evidence and record questions for internal review.",
        zhTw: "確認佐證資料，並記錄內部審查需要釐清的問題。",
      },
    },
    {
      key: "VALIDATE_HISTORY",
      text: {
        en: "Validate the imported-stone and lighting assumptions using the linked historical evidence.",
        zhTw: "依連結的歷史佐證資料，檢核進口石材與照明假設。",
      },
    },
  ];
  const [stone, lighting, insufficient, programme] = claims;
  if (!stone || !lighting || !insufficient || !programme) throw new Error("CLAIMS_REQUIRED");
  const stonePercent = percent(stone.value.variancePercent);
  const lightingPercent = percent(lighting.value.variancePercent);
  const eligible = numeric(insufficient.value.eligibleObservationCount);
  const required = numeric(insufficient.value.requiredObservationCount);
  const activeWeeks = numeric(programme.value.activeProgrammeWeeks);
  const minWeeks = numeric(programme.value.historicalMinimumWeeks);
  const maxWeeks = numeric(programme.value.historicalMaximumWeeks);
  if (
    programme.value.quantifiedPremiumState !== "UNQUANTIFIED" ||
    Number(eligible) >= Number(required)
  )
    throw new Error("CLAIM_INVALID");
  const mandatoryStatements: ReviewStatement[] = [
    {
      key: "STONE",
      claimKey: stone.claimKey,
      text: {
        en: `Imported-stone forecast direct cost differs by ${stonePercent}% from eligible reconciled-actual history.`,
        zhTw: `進口石材預估直接成本與符合條件的已核對實際成本歷史比較，差異為 ${stonePercent}%。`,
      },
    },
    {
      key: "LIGHTING",
      claimKey: lighting.claimKey,
      text: {
        en: `Lighting quoted price differs by ${lightingPercent}% from eligible quoted-price history.`,
        zhTw: `照明報價與符合條件的歷史報價比較，差異為 ${lightingPercent}%。`,
      },
    },
    {
      key: "LIGHTING_INSUFFICIENT",
      claimKey: insufficient.claimKey,
      text: {
        en: `Lighting reconciled-actual evidence is insufficient: ${eligible} of ${required} required observations. No supported actual-cost range is available.`,
        zhTw: `照明已核對實際成本佐證資料不足：目前 ${eligible} 筆，需要 ${required} 筆；無法提供有佐證的實際成本區間。`,
      },
    },
    {
      key: "PROGRAMME",
      claimKey: programme.claimKey,
      text: {
        en: `The programme is ${activeWeeks} weeks versus ${minWeeks}–${maxWeeks} weeks in the selected history. No evidence supports a quantified programme premium.`,
        zhTw: `目前工期為 ${activeWeeks} 週，所選歷史專案為 ${minWeeks}–${maxWeeks} 週；目前沒有佐證支持量化工期溢價。`,
      },
    },
    {
      key: "REFERENCES",
      text: {
        en: `Comparison: ${stage4.run.id}; economics enrichment: ${stage5.run.id}.`,
        zhTw: `比較紀錄：${stage4.run.id}；成本分析紀錄：${stage5.run.id}。`,
      },
    },
  ];
  const warnings: ReviewStatement[] = [
    {
      key: "REVIEW_ONLY",
      text: {
        en: "This creates an internal review item. It does not approve or issue the quotation, authorize commercial commitments, or contact anyone externally.",
        zhTw: "此操作只會建立內部審查事項，不會核准或發出報價、授權商業承諾，或對外聯繫。",
      },
    },
    {
      key: "NO_UNSUPPORTED_CONCLUSION",
      text: {
        en: "Historical comparisons do not establish that this quotation is wrong, a supplier is overcharging, or an accelerated programme caused a specific premium. Supplier prices are not confirmed as currently valid.",
        zhTw: "歷史比較不能證明這份報價有誤、供應商收費過高，或趕工造成特定溢價；供應商價格也未確認目前仍有效。",
      },
    },
  ];
  return { titleOptions, rationaleOptions, mandatoryStatements, warnings };
}

export function findWording(
  options: readonly LocalizedWordingOption[],
  text: string,
): LocalizedWordingOption | undefined {
  return options.find((option) => option.text.en === text || option.text.zhTw === text);
}
export function validateEdits(
  content: ProposalContent,
  command: ConfirmInternalReviewInput,
  now: Date,
): FieldErrors {
  const errors: Record<string, string> = {};
  if (
    typeof command.title !== "string" ||
    [...command.title].length > 200 ||
    !findWording(content.titleOptions, command.title)
  )
    errors.title = "INVALID_TITLE";
  if (
    typeof command.rationale !== "string" ||
    [...command.rationale].length > 500 ||
    !findWording(content.rationaleOptions, command.rationale)
  )
    errors.rationale = "INVALID_RATIONALE";
  if (command.confirmation !== true) errors.confirmation = "CONFIRMATION_REQUIRED";
  if (!validDueDate(command.dueDate, now, content.timezone)) errors.dueDate = "INVALID_DUE_DATE";
  return errors as FieldErrors;
}
export function fullRationale(content: ProposalContent, intent: LocalizedText): LocalizedText {
  const fragments = [...content.mandatoryStatements, ...content.warnings];
  const result = {
    en: [intent.en, ...fragments.map((f) => f.text.en)].join("\n\n"),
    zhTw: [intent.zhTw, ...fragments.map((f) => f.text.zhTw)].join("\n\n"),
  };
  if (Object.values(result).some((text) => [...text].length > 8000))
    throw new Error("RATIONALE_BOUND");
  return result;
}
