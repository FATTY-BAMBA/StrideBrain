import Link from "next/link";
import { Table, NameCell, RowAction } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FilterForm } from "@/components/ui/filter-form";
import { Notice } from "@/components/ui/notice";
import { designSystemCopy } from "@/modules/localization/design-system";
import styles from "@/components/ui/ui.module.css";
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
    <div className={styles.page}>
      <PageHeader
        context={designSystemCopy(locale).workspace}
        title={c.title}
        description={c.description}
      />
      <FilterForm loadingLabel={designSystemCopy(locale).loading}>
        <Field
          id="client-search"
          label={c.search}
          type="search"
          name="search"
          maxLength={100}
          defaultValue={typeof search === "string" ? search : ""}
        />
        <Button type="submit" variant="primary">
          {c.searchButton}
        </Button>
      </FilterForm>
      {result.kind === "AVAILABLE" ? (
        <>
          {result.clients.length ? (
            <Table
              caption={c.title}
              headings={[
                { label: designSystemCopy(locale).name },
                { label: c.reference },
                { label: designSystemCopy(locale).action, action: true },
              ]}
            >
              {result.clients.map((client) => {
                const name = locale === "zh-TW" ? client.nameZhTw : client.nameEn;
                return (
                  <tr key={client.businessKey}>
                    <NameCell>
                      {name}
                      {!client.active ? <small className={styles.marker}>{c.retired}</small> : null}
                    </NameCell>
                    <td>{client.businessKey}</td>
                    <RowAction
                      href={`/${locale}/clients/${encodeURIComponent(client.businessKey)}` as Route}
                      label={designSystemCopy(locale).open}
                      name={name}
                    />
                  </tr>
                );
              })}
            </Table>
          ) : (
            <EmptyState title={c.empty} />
          )}
          <nav className={styles.pagination} aria-label={c.title}>
            {page > 1 && <Link href={href(page - 1)}>{c.previous}</Link>}
            {result.hasMore && <Link href={href(page + 1)}>{c.next}</Link>}
          </nav>
        </>
      ) : (
        <Notice tone="error">{c.FAILED}</Notice>
      )}
    </div>
  );
}
