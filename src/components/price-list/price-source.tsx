import type { QuotedItemPrice } from "@/repositories/ports/price-list-repository";
import { formatMoney } from "@/modules/finance/format-money";
import { priceListCopy } from "@/modules/localization/price-list";
import type { Locale } from "@/modules/localization/config";
export function PriceSource({ price, locale }: { price: QuotedItemPrice; locale: Locale }) {
  const amount = formatMoney(price.unitPrice, price.currency);
  return (
    <a
      href={`/api/quotes/${encodeURIComponent(price.versionId)}/pdf`}
      target="_blank"
      rel="noreferrer"
      aria-label={`${amount} · ${priceListCopy(locale).source} ${price.documentNumber}`}
    >
      {amount} · {price.documentNumber}
    </a>
  );
}
