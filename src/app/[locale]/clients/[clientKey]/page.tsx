import { requirePageIdentity } from "@/lib/server/require-page-identity";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { ClientDetailsForm } from "@/components/clients/client-details-form";
import { QuoteListTable } from "@/components/quotes/quote-list-table";
import { createClientServices } from "@/lib/server/client-services";
import { createQuoteListService } from "@/lib/server/quote-list-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { isSupportedLocale } from "@/modules/localization/config";
import { clientRecordsCopy } from "@/modules/localization/client-records";
import { PROJECT_STAGES } from "@/modules/projects/domain/job-input";
import { projectStageLabel } from "@/modules/localization/jobs";
export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; clientKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageIdentity();
  const { locale, clientKey } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const c = clientRecordsCopy(locale),
    context = await resolveServerRuntimeContext();
  if (!context?.capabilities.has("client:read")) notFound();
  const service = createClientServices(),
    runtime = { ...context, locale },
    result = await service.get.execute(runtime, clientKey);
  if (result.kind !== "AVAILABLE") notFound();
  const search = await searchParams,
    jobsPage = search.jobsPage === undefined ? 1 : Number(search.jobsPage),
    quotesPage = search.quotesPage === undefined ? 1 : Number(search.quotesPage);
  const [jobs, quotes] = await Promise.all([
    service.jobs.execute(runtime, clientKey, jobsPage),
    createQuoteListService().execute(runtime, { status: null, page: quotesPage, clientKey }),
  ]);
  const href = (kind: "jobsPage" | "quotesPage", page: number) =>
    `/${locale}/clients/${encodeURIComponent(clientKey)}?${new URLSearchParams({ jobsPage: String(jobsPage), quotesPage: String(quotesPage), [kind]: String(page) })}` as Route;
  return (
    <FoundationPage
      eyebrow={c.title}
      title={locale === "zh-TW" ? result.client.nameZhTw : result.client.nameEn}
      description={result.client.businessKey}
    >
      <Link href={`/${locale}/clients` as Route}>{c.title}</Link>
      <ClientDetailsForm
        client={result.client}
        canEdit={result.canEdit}
        locale={locale}
        clientTypes={context.firmLists?.clientTypes ?? []}
      />
      <section className="records-panel">
        <h2>{c.jobs}</h2>
        {jobs.kind === "AVAILABLE" ? (
          <>
            {jobs.jobs.length ? (
              <ul className="records-list">
                {jobs.jobs.map((job) => (
                  <li key={job.businessKey}>
                    <Link
                      href={`/${locale}/projects/${encodeURIComponent(job.businessKey)}` as Route}
                    >
                      {job.name}
                    </Link>
                    <span>
                      {job.businessKey} ·{" "}
                      {PROJECT_STAGES.includes(job.stage as (typeof PROJECT_STAGES)[number])
                        ? projectStageLabel(locale, job.stage as (typeof PROJECT_STAGES)[number])
                        : job.stage}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{c.noJobs}</p>
            )}
            <nav className="records-pagination" aria-label={c.jobs}>
              {jobsPage > 1 && <Link href={href("jobsPage", jobsPage - 1)}>{c.previous}</Link>}
              {jobs.hasMore && <Link href={href("jobsPage", jobsPage + 1)}>{c.next}</Link>}
            </nav>
          </>
        ) : (
          <p>{c.FAILED}</p>
        )}
      </section>
      <section className="records-panel">
        <h2>{c.quotes}</h2>
        {quotes.kind === "AVAILABLE" ? (
          <>
            <QuoteListTable rows={quotes.rows} locale={locale} />
            <nav className="records-pagination" aria-label={c.quotes}>
              {quotesPage > 1 && (
                <Link href={href("quotesPage", quotesPage - 1)}>{c.previous}</Link>
              )}
              {quotes.hasMore && <Link href={href("quotesPage", quotesPage + 1)}>{c.next}</Link>}
            </nav>
          </>
        ) : (
          <p>{c.FAILED}</p>
        )}
      </section>
    </FoundationPage>
  );
}
