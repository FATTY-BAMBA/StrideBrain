import type { FirmWorkCategory } from "@/modules/firm-lists/domain/contracts";
import { isReviewClaim } from "@/modules/economics/domain/claim-selection";
import { categoryLabel } from "@/modules/localization/jobs";
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
  if (
    result.claims.some(
      (claim) =>
        (claim.kind === "CATEGORY_QUOTED_VARIANCE" ||
          claim.kind === "CATEGORY_FORECAST_ACTUAL_VARIANCE" ||
          claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT") &&
        !claim.categoryId,
    )
  )
    return null;
  const claims = result.claims.filter(isReviewClaim);
  const identities = claims.map((claim) => `${claim.kind}:${claim.categoryId ?? ""}`);
  if (
    new Set(identities).size !== identities.length ||
    new Set(claims.map((claim) => claim.claimKey)).size !== claims.length
  )
    return null;
  for (const claim of claims) {
    if (
      claim.categoryId &&
      !result.categories.some((category) => category.categoryId === claim.categoryId)
    )
      return null;
    const category = result.categories.find((category) => category.categoryId === claim.categoryId);
    if (
      claim.kind === "CATEGORY_FORECAST_ACTUAL_VARIANCE" &&
      (category?.forecastVariance.state !== "VALUE" ||
        category.actualHistory.state !== "SUFFICIENT")
    )
      return null;
    if (claim.kind === "CATEGORY_QUOTED_VARIANCE" && category?.quoteVariance.state !== "VALUE")
      return null;
    if (
      claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT" &&
      category?.actualHistory.state !== "INSUFFICIENT"
    )
      return null;
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
  }
  return claims;
}

export function proposalWording(
  stage4: Stage4ComparisonResult,
  stage5: Stage5EconomicsResult,
  claims: readonly StructuredEconomicsClaimDTO[],
  workCategories: readonly FirmWorkCategory[],
): Readonly<{
  titleOptions: readonly LocalizedWordingOption[];
  rationaleOptions: readonly LocalizedWordingOption[];
  mandatoryStatements: readonly ReviewStatement[];
  warnings: readonly ReviewStatement[];
}> {
  const compact = (text: string, limit: number) =>
    [...text].length <= limit ? text : [...text].slice(0, limit - 1).join("") + "…";
  const categoryIds = [
    ...new Set(claims.flatMap((claim) => (claim.categoryId ? [claim.categoryId] : []))),
  ];
  const categories = {
    en: compact(
      categoryIds.map((id) => categoryLabel("en", id, workCategories)).join(", ") ||
        "programme evidence",
      90,
    ),
    zhTw: compact(
      categoryIds.map((id) => categoryLabel("zh-TW", id, workCategories)).join("、") || "工期佐證",
      90,
    ),
  };
  const project = {
    en: compact(stage4.activeContext.nameEn, 80),
    zhTw: compact(stage4.activeContext.nameZhTw, 80),
  };
  const titleOptions = [
    {
      key: "VALIDATE",
      text: {
        en: `Validate ${categories.en} · ${project.en}`,
        zhTw: `檢核${categories.zhTw} · ${project.zhTw}`,
      },
    },
    {
      key: "REVIEW",
      text: {
        en: `Review ${categories.en} · ${project.en}`,
        zhTw: `審查${categories.zhTw} · ${project.zhTw}`,
      },
    },
    {
      key: "CHECK",
      text: {
        en: `Check ${categories.en} · ${project.en}`,
        zhTw: `確認${categories.zhTw} · ${project.zhTw}`,
      },
    },
  ];
  const rationaleOptions = [
    {
      key: "REVIEW_NEXT",
      text: {
        en: `Review ${categories.en} against the linked evidence before the next internal quotation review.`,
        zhTw: `下次內部報價審查前，依連結的佐證資料檢核${categories.zhTw}。`,
      },
    },
    {
      key: "RECORD_QUESTIONS",
      text: {
        en: `Check the evidence for ${categories.en} and record questions for internal review.`,
        zhTw: `確認${categories.zhTw}的佐證資料，並記錄內部審查需要釐清的問題。`,
      },
    },
    {
      key: "VALIDATE_HISTORY",
      text: {
        en: `Validate ${categories.en} using the linked historical evidence.`,
        zhTw: `依連結的歷史佐證資料，檢核${categories.zhTw}。`,
      },
    },
  ];
  const mandatoryStatements: ReviewStatement[] = claims.map((claim) => {
    const en = claim.categoryId ? categoryLabel("en", claim.categoryId, workCategories) : "";
    const zh = claim.categoryId ? categoryLabel("zh-TW", claim.categoryId, workCategories) : "";
    let text: LocalizedText;
    if (claim.kind === "CATEGORY_ACTUAL_INSUFFICIENT") {
      const eligible = numeric(claim.value.eligibleObservationCount);
      const required = numeric(claim.value.requiredObservationCount);
      if (Number(eligible) >= Number(required)) throw new Error("CLAIM_INVALID");
      text = {
        en: `${en} reconciled-actual evidence is insufficient: ${eligible} of ${required} required observations. No supported actual-cost range is available.`,
        zhTw: `${zh}已核對實際成本佐證資料不足：目前 ${eligible} 筆，需要 ${required} 筆；無法提供有佐證的實際成本區間。`,
      };
    } else if (claim.kind === "PROGRAMME_DIFFERENCE_UNQUANTIFIED") {
      if (claim.value.quantifiedPremiumState !== "UNQUANTIFIED") throw new Error("CLAIM_INVALID");
      const active = numeric(claim.value.activeProgrammeWeeks);
      const min = numeric(claim.value.historicalMinimumWeeks);
      const max = numeric(claim.value.historicalMaximumWeeks);
      text = {
        en: `The programme is ${active} weeks versus ${min}–${max} weeks in the selected history. No evidence supports a quantified programme premium.`,
        zhTw: `目前工期為 ${active} 週，所選歷史專案為 ${min}–${max} 週；目前沒有佐證支持量化工期溢價。`,
      };
    } else {
      const delta = percent(claim.value.variancePercent);
      const quoted = claim.kind === "CATEGORY_QUOTED_VARIANCE";
      text = {
        en: `${en} ${quoted ? "quoted price" : "forecast direct cost"} differs by ${delta}% from eligible ${quoted ? "quoted-price" : "reconciled-actual"} history.`,
        zhTw: `${zh}${quoted ? "報價與符合條件的歷史報價" : "預估直接成本與符合條件的已核對實際成本歷史"}比較，差異為 ${delta}%。`,
      };
    }
    return { key: claim.claimKey, claimKey: claim.claimKey, text };
  });
  mandatoryStatements.push({
    key: "REFERENCES",
    text: {
      en: `Comparison: ${stage4.run.id}; economics enrichment: ${stage5.run.id}.`,
      zhTw: `比較紀錄：${stage4.run.id}；成本分析紀錄：${stage5.run.id}。`,
    },
  });
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
