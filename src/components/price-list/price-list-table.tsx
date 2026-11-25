import type { Locale } from "@/modules/localization/config";
import { priceListCopy } from "@/modules/localization/price-list";
import type { PriceListRow } from "@/repositories/ports/price-list-repository";
import { Table, NameCell, NumericCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceSource } from "./price-source";
import { PriceHistory } from "./price-history";
export function PriceListTable({
  rows,
  locale,
}: {
  rows: readonly PriceListRow[];
  locale: Locale;
}) {
  const c = priceListCopy(locale);
  if (!rows.length) return <EmptyState title={c.empty} />;
  return (
    <Table
      caption={c.title}
      headings={[
        { label: c.item },
        { label: c.unit },
        { label: c.lastPrice, numeric: true },
        { label: c.timesQuoted, numeric: true },
        { label: c.lastQuoted },
        { label: c.history },
      ]}
    >
      {rows.map((row) => (
        <tr key={`${row.description}-${row.unit}`}>
          <NameCell>{row.description}</NameCell>
          <td>{row.unit}</td>
          <NumericCell>
            <PriceSource price={row} locale={locale} />
          </NumericCell>
          <NumericCell>{row.timesQuoted}</NumericCell>
          <td>{row.issuedOn}</td>
          <td>
            <PriceHistory
              description={row.description}
              unit={row.unit}
              locale={locale}
              label={`${row.description} · ${row.unit}`}
            />
          </td>
        </tr>
      ))}
    </Table>
  );
}
