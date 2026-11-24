import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createClientServices } from "@/lib/server/client-services";
import { isSupportedLocale } from "@/modules/localization/config";
import { clientRecordsCopy } from "@/modules/localization/client-records";
export default async function ClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const c = clientRecordsCopy(locale),
    query = await searchParams,
    context = await resolveServerRuntimeContext();
  if (!context?.capabilities.has("client:read")) notFound();
  const search = query.search ?? "",
    page = query.page === undefined ? 1 : Number(query.page);
  const result = await createClientServices().list.execute(
    { ...context, locale },
    { search, page },
  );
  const href = (n: number) =>
    `/${locale}/clients?${new URLSearchParams({ page: String(n), search: typeof search === "string" ? search : "" })}` as Route;
  return (
    <FoundationPage eyebrow={c.title} title={c.title} description={c.description}>
      <form className="records-filter" method="get">
        <label>
          {c.search}
          <input
            type="search"
            name="search"
            maxLength={100}
            defaultValue={typeof search === "string" ? search : ""}
          />
        </label>
        <button>{c.searchButton}</button>
      </form>
      {result.kind === "AVAILABLE" ? (
        <>
          {result.clients.length ? (
            <ul className="records-list">
              {result.clients.map((client) => (
                <li key={client.businessKey}>
                  <Link
                    href={`/${locale}/clients/${encodeURIComponent(client.businessKey)}` as Route}
                  >
                    {locale === "zh-TW" ? client.nameZhTw : client.nameEn}
                  </Link>
                  <span>
                    {client.businessKey}
                    {!client.active && ` · ${c.retired}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{c.empty}</p>
          )}
          <nav className="records-pagination" aria-label={c.title}>
            {page > 1 && <Link href={href(page - 1)}>{c.previous}</Link>}
            {result.hasMore && <Link href={href(page + 1)}>{c.next}</Link>}
          </nav>
        </>
      ) : (
        <p role="status">{c.FAILED}</p>
      )}
    </FoundationPage>
  );
}
