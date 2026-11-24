import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FilterForm } from "@/components/ui/filter-form";
import { Notice } from "@/components/ui/notice";
import { designSystemCopy } from "@/modules/localization/design-system";
import styles from "@/components/ui/ui.module.css";
import { QuoteListNav } from "@/components/quotes/quote-list-nav";
import { QuoteListTable } from "@/components/quotes/quote-list-table";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createQuoteListService } from "@/lib/server/quote-list-services";
import { isSupportedLocale } from "@/modules/localization/config";
import { quoteListCopy } from "@/modules/localization/quote-list";
import { QUOTE_LIST_STATUSES } from "@/modules/quotes/domain/quote-list";
export default async function QuotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const c = quoteListCopy(locale),
    search = await searchParams,
    context = await resolveServerRuntimeContext();
  const status = search.status || null,
    page = search.page === undefined ? 1 : Number(search.page);
  const result = context
    ? await createQuoteListService().execute({ ...context, locale }, { status, page })
    : null;
  const href = (n: number) =>
    `/${locale}/quotes?${new URLSearchParams({ page: String(n), ...(typeof status === "string" ? { status } : {}) })}` as Route;
  return (
    <div className={styles.page}>
      <PageHeader
        context={designSystemCopy(locale).workspace}
        title={c.title}
        description={c.description}
      />
      <QuoteListNav
        locale={locale}
        active="quotes"
        canReadPrices={context?.capabilities.has("quote:read") === true}
      />
      <FilterForm loadingLabel={designSystemCopy(locale).loading}>
        <Field
          as="select"
          id="quote-status"
          label={c.status}
          name="status"
          defaultValue={typeof status === "string" ? status : ""}
        >
          <option value="">{c.all}</option>
          {QUOTE_LIST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {c[s]}
            </option>
          ))}
        </Field>
        <Button type="submit" variant="primary">
          {c.filter}
        </Button>
      </FilterForm>
      {result?.kind === "AVAILABLE" ? (
        <>
          <QuoteListTable rows={result.rows} locale={locale} />
          <nav className={styles.pagination} aria-label={c.title}>
            {page > 1 && <Link href={href(page - 1)}>{c.previous}</Link>}
            {result.hasMore && <Link href={href(page + 1)}>{c.next}</Link>}
          </nav>
        </>
      ) : (
        <Notice tone="error">{c.unavailable}</Notice>
      )}
    </div>
  );
}
