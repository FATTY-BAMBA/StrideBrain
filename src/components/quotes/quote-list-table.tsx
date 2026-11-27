import Link from "next/link";
import type { Route } from "next";
import type { Locale } from "@/modules/localization/config";
import type { QuoteListRow } from "@/repositories/ports/quote-list-repository";
import { quoteListCopy } from "@/modules/localization/quote-list";
import { formatMoney } from "@/modules/finance/format-money";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, NameCell, NumericCell } from "@/components/ui/table";
import styles from "@/components/ui/ui.module.css";
export function QuoteListTable({
  rows,
  locale,
}: {
  rows: readonly QuoteListRow[];
  locale: Locale;
}) {
  const c = quoteListCopy(locale);
  if (!rows.length) return <EmptyState title={c.empty} />;
  return (
    <Table
      caption={c.title}
      headings={[
        { label: c.number },
        { label: c.job },
        { label: c.client },
        { label: c.status },
        { label: c.total, numeric: true },
        { label: c.date },
      ]}
    >
      {rows.map((row) => (
        <tr key={row.quoteKey}>
          <td>{row.documentNumber ?? (row.status === "FINAL" ? "—" : c.noNumber)}</td>
          <NameCell>
            <Link href={`/${locale}/projects/${encodeURIComponent(row.projectKey)}/quote` as Route}>
              {row.projectName}
            </Link>
          </NameCell>
          <td>{row.clientName}</td>
          <td>
            <Badge status={row.status} locale={locale} />
            {row.revisionInDraft ? <small className={styles.marker}>{c.revision}</small> : null}
          </td>
          <NumericCell>
            {row.totalAmount === undefined ? c.hidden : formatMoney(row.totalAmount, row.currency)}
          </NumericCell>
          <td>{row.date}</td>
        </tr>
      ))}
    </Table>
  );
}
