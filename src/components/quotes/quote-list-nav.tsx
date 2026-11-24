import type { Route } from "next";
import type { Locale } from "@/modules/localization/config";
import { priceListCopy } from "@/modules/localization/price-list";
import { Tabs } from "@/components/ui/tabs";
export function QuoteListNav({
  locale,
  active,
  canReadPrices,
}: {
  locale: Locale;
  active: "quotes" | "prices";
  canReadPrices: boolean;
}) {
  const c = priceListCopy(locale);
  return (
    <Tabs
      label={c.quotes}
      items={[
        { href: `/${locale}/quotes` as Route, label: c.quotes, active: active === "quotes" },
        ...(canReadPrices
          ? [
              {
                href: `/${locale}/quotes/prices` as Route,
                label: c.title,
                active: active === "prices",
              },
            ]
          : []),
      ]}
    />
  );
}
