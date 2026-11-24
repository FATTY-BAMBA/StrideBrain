import { orderQuoteLines } from "@/modules/quote-draft/domain/quote-line-order";
import type {
  FirmDetails,
  RequiredFirmField,
  IssueOptions,
  IssueState,
  IssueBlocker,
  IssueWarning,
  QuoteDocumentSnapshot,
} from "./contracts";
import { emptyFirmDetails } from "./contracts";
import type { Locale } from "@/modules/localization/config";
import { money } from "@/modules/finance/fixed-decimal";

export function organizationDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((key) => parts.find((part) => part.type === key)!.value)
    .join("-");
}
export function isDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
export function stageAfterAcceptance(stage: string): string {
  return ["DISCOVERY", "DESIGN", "QUOTE_REVIEW"].includes(stage) ? "APPROVED" : stage;
}
export function missingFirmFields(
  details: FirmDetails | null,
  language: Locale,
): RequiredFirmField[] {
  const fields: RequiredFirmField[] = [
    language === "zh-TW" ? "legalNameZhTw" : "legalNameEn",
    "taxId",
    language === "zh-TW" ? "addressZhTw" : "addressEn",
    "phone",
  ];
  return fields.filter((field) =>
    field === "taxId" ? !/^\d{8}$/.test(details?.taxId ?? "") : !details?.[field].trim(),
  );
}
export function completeFirm(details: FirmDetails | null, language: Locale): boolean {
  return missingFirmFields(details, language).length === 0;
}
export function prepareIssuePolicy(
  state: IssueState,
  versionId: string,
  options: IssueOptions,
  now: Date,
) {
  const today = organizationDate(now, state.timezone),
    firm = state.firm ?? emptyFirmDetails;
  const blockers: IssueBlocker[] = [],
    warnings: IssueWarning[] = [];
  if (!state.current || state.current.id !== versionId || state.current.status !== "DRAFT")
    blockers.push("DRAFT_NOT_CURRENT");
  if (state.conflicts.length) blockers.push("OPEN_CONFLICT");
  if (state.current?.lines.some((line) => money(line.amount).atoms <= 0n))
    blockers.push("ZERO_LINE");
  if (
    state.current?.document?.sections.some(
      (section) => !section.title.trim() || section.lines.length === 0,
    )
  )
    blockers.push("EMPTY_SECTION");
  if (state.current?.document && !state.current.lines.length && !blockers.includes("ZERO_LINE"))
    blockers.push("ZERO_LINE");
  const missingFields = missingFirmFields(state.firm, options.language);
  if (missingFields.length) blockers.push("FIRM_INCOMPLETE");
  if (state.basisOutOfDate) warnings.push("BASIS_OUT_OF_DATE");
  if (state.comparisonOutOfDate) warnings.push("COMPARISON_OUT_OF_DATE");
  if (state.noComparison) warnings.push("NO_COMPARISON");
  if (state.unreviewedFindings) warnings.push("UNREVIEWED_FINDINGS");
  const zh = options.language === "zh-TW";
  const legacy = {
    schemaVersion: "QUOTE-DOCUMENT-1.0",
    language: options.language,
    firm: {
      legalName: zh ? firm.legalNameZhTw : firm.legalNameEn,
      taxId: firm.taxId,
      address: zh ? firm.addressZhTw : firm.addressEn,
      phone: firm.phone,
      email: firm.email,
    },
    clientName: zh ? state.clientNameZhTw : state.clientNameEn,
    ...(state.clientDetails && Object.values(state.clientDetails).some((value) => value.length)
      ? { clientDetails: { ...state.clientDetails } }
      : {}),
    attention: options.attention,
    projectName: zh ? state.projectNameZhTw : state.projectNameEn,
    projectKey: state.job.businessKey,
    documentNumber: `${state.job.businessKey}-Q${state.issuedCount + 1}`,
    issueDate: today,
    validUntil: options.validUntil ?? addDays(today, firm.defaultValidityDays),
    currency: state.job.currency,
    lines: orderQuoteLines(state.current?.lines ?? [], state.job.catalog.workCategories).map(
      (line) => {
        const labels = state.descriptions.find((entry) => entry.id === line.id);
        return {
          categoryId: line.categoryId,
          description: (zh ? labels?.zh : labels?.en) ?? line.description,
          amount: line.amount,
        };
      },
    ),
    totals: state.current?.totals ?? {
      amountBeforeTax: "0.00",
      taxAmount: "0.00",
      totalAmount: "0.00",
    },
    terms: options.terms ?? (zh ? firm.termsZhTw : firm.termsEn),
  };
  const snapshot: QuoteDocumentSnapshot = state.current?.document
    ? {
        ...legacy,
        schemaVersion: "QUOTE-DOCUMENT-2.0",
        siteAddress: state.job.siteAddress ?? "",
        document: state.current.document,
      }
    : { ...legacy, schemaVersion: "QUOTE-DOCUMENT-1.0" };
  return { snapshot, blockers, missingFirmFields: missingFields, warnings };
}
