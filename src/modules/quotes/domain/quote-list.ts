/** One public row per quote. Issued amounts survive a later draft revision. */
export type QuoteListVersion = Readonly<{
  versionNumber: number;
  status: string;
  documentNumber: string | null;
  issuedAt: string | null;
  createdAt: string;
  currency: string;
  totalAmount?: string;
}>;
export const QUOTE_LIST_STATUSES = ["DRAFT", "ISSUED", "ACCEPTED"] as const;
export type QuoteListStatus = (typeof QUOTE_LIST_STATUSES)[number];
export function currentQuoteRow(versions: readonly QuoteListVersion[]) {
  const candidates = versions
    .filter((v) => v.status !== "SUPERSEDED")
    .sort((a, b) => b.versionNumber - a.versionNumber);
  const issued = candidates.find((v) => v.status === "ISSUED" || v.status === "ACCEPTED");
  const current = issued ?? candidates[0];
  if (!current) return null;
  return {
    status: (issued ? issued.status : "DRAFT") as QuoteListStatus,
    documentNumber: issued?.documentNumber ?? null,
    date: issued?.issuedAt ?? current.createdAt,
    currency: current.currency,
    ...(current.totalAmount !== undefined ? { totalAmount: current.totalAmount } : {}),
    revisionInDraft:
      !!issued &&
      candidates.some((v) => v.status === "DRAFT" && v.versionNumber > issued.versionNumber),
  };
}
export function quoteListSearch(
  raw: unknown,
): { status: QuoteListStatus | null; page: number; clientKey?: string } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  if (
    Object.keys(v).some((key) => !["status", "page", "clientKey"].includes(key)) ||
    (v.status !== null && !QUOTE_LIST_STATUSES.includes(v.status as QuoteListStatus)) ||
    !Number.isInteger(v.page) ||
    Number(v.page) < 1 ||
    Number(v.page) > 10000 ||
    (v.clientKey !== undefined &&
      (typeof v.clientKey !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v.clientKey)))
  )
    return null;
  return {
    status: v.status as QuoteListStatus | null,
    page: v.page as number,
    ...(v.clientKey !== undefined ? { clientKey: v.clientKey as string } : {}),
  };
}
