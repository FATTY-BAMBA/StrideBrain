import Link from "next/link";
import type { Route } from "next";
import type { Locale } from "@/modules/localization/config";
import type { QuoteListRow } from "@/repositories/ports/quote-list-repository";
import { quoteListCopy } from "@/modules/localization/quote-list";
import { formatMoney } from "@/modules/finance/format-money";
export function QuoteListTable({
  rows,
  locale,
}: {
  rows: readonly QuoteListRow[];
  locale: Locale;
}) {
  const c = quoteListCopy(locale);
  if (!rows.length) return <p>{c.empty}</p>;
  return (
    <div className="records-table-scroll">
      <table className="records-table">
        <thead>
          <tr>
            {[c.number, c.job, c.client, c.status, c.total, c.date].map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.quoteKey}>
              <td>
                <Link
                  href={`/${locale}/projects/${encodeURIComponent(row.projectKey)}/quote` as Route}
                >
                  {row.documentNumber ?? c.noNumber}
                </Link>
              </td>
              <td>{row.projectName}</td>
              <td>{row.clientName}</td>
              <td>
                {c[row.status]}
                {row.revisionInDraft && <small className="records-marker">{c.revision}</small>}
              </td>
              <td>
                {row.totalAmount === undefined
                  ? c.hidden
                  : formatMoney(row.totalAmount, row.currency)}
              </td>
              <td>{row.date.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
