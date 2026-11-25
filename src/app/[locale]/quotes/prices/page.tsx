import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { FilterForm } from "@/components/ui/filter-form";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { QuoteListNav } from "@/components/quotes/quote-list-nav";
import { PriceListTable } from "@/components/price-list/price-list-table";
import ui from "@/components/ui/ui.module.css";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createPriceListService } from "@/lib/server/price-list-services";
import { isSupportedLocale } from "@/modules/localization/config";
import { priceListCopy } from "@/modules/localization/price-list";
export default async function PricesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const context = await resolveServerRuntimeContext();
  if (!context?.capabilities.has("quote:read") || !context.capabilities.has("project:read"))
    notFound();
  const c = priceListCopy(locale),
    search = await searchParams;
  const page =
    search.page === undefined
      ? 1
      : typeof search.page === "string" && /^\d{1,5}$/.test(search.page)
        ? Number(search.page)
        : 0;
  const term = search.search ?? "";
  const result = await createPriceListService().execute(
    { ...context, locale },
    { mode: "LIST", search: term, unit: "", page, projectKey: null },
  );
  const href = (page: number) =>
    `/${locale}/quotes/prices?${new URLSearchParams({ page: String(page), search: typeof term === "string" ? term : "" })}` as Route;
  return (
    <div className={ui.page}>
      <PageHeader context={c.quotes} title={c.title} description={c.description} />
      <QuoteListNav locale={locale} active="prices" canReadPrices />
      <FilterForm loadingLabel={c.loading}>
        <Field
          id="price-search"
          name="search"
          label={c.search}
          maxLength={500}
          defaultValue={typeof term === "string" ? term : ""}
        />
        <Button type="submit" variant="primary">
          {c.searchAction}
        </Button>
      </FilterForm>
      {result.kind === "AVAILABLE" ? (
        <>
          <PriceListTable rows={result.rows} locale={locale} />
          <nav className={ui.pagination} aria-label={c.title}>
            {page > 1 && <Link href={href(page - 1)}>{c.previous}</Link>}
            {result.hasMore && <Link href={href(page + 1)}>{c.next}</Link>}
          </nav>
        </>
      ) : (
        <Notice tone="error">{result.kind === "INVALID" ? c.invalid : c.unavailable}</Notice>
      )}
    </div>
  );
}
