import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
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
    <FoundationPage eyebrow={c.title} title={c.title} description={c.description}>
      <form className="records-filter" method="get">
        <label>
          {c.status}
          <select name="status" defaultValue={typeof status === "string" ? status : ""}>
            <option value="">{c.all}</option>
            {QUOTE_LIST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {c[s]}
              </option>
            ))}
          </select>
        </label>
        <button>{c.filter}</button>
      </form>
      {result?.kind === "AVAILABLE" ? (
        <>
          <QuoteListTable rows={result.rows} locale={locale} />
          <nav className="records-pagination" aria-label={c.title}>
            {page > 1 && <Link href={href(page - 1)}>{c.previous}</Link>}
            {result.hasMore && <Link href={href(page + 1)}>{c.next}</Link>}
          </nav>
        </>
      ) : (
        <p role="status">{c.unavailable}</p>
      )}
    </FoundationPage>
  );
}
