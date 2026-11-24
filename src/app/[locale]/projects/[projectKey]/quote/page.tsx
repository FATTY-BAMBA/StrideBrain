import ui from "@/components/ui/ui.module.css";
import { QuoteWorkspace } from "@/components/quote-issue/quote-workspace";
import { createQuoteIssueServices } from "@/lib/server/quote-issue-services";
import { notFound } from "next/navigation";
import { ProjectLocalNav } from "@/components/projects/project-local-nav";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";
import { quoteDraftCopy } from "@/modules/localization/quote-draft";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createQuoteDraftServices } from "@/lib/server/quote-draft-services";
export default async function QuotePage({
  params,
}: {
  params: Promise<{ locale: string; projectKey: string }>;
}) {
  const { locale, projectKey } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const context = await resolveServerRuntimeContext();
  const [view, issue] = context
    ? await Promise.all([
        Promise.resolve()
          .then(() => createQuoteDraftServices().read.execute({ ...context, locale }, projectKey))
          .catch(() => null),
        Promise.resolve()
          .then(() => createQuoteIssueServices().read.execute({ ...context, locale }, projectKey))
          .catch(() => null),
      ])
    : [null, null];
  return (
    <div className={ui.page}>
      <ProjectLocalNav locale={locale} projectKey={projectKey} labels={getCatalog(locale)} />
      {view?.kind === "AVAILABLE" ? (
        <QuoteWorkspace
          key={`${locale}:${projectKey}`}
          view={view}
          issue={issue?.kind === "AVAILABLE" ? issue : null}
          locale={locale}
        />
      ) : (
        <p role="status">{quoteDraftCopy(locale).UNAVAILABLE}</p>
      )}
    </div>
  );
}
