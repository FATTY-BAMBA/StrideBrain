import { notFound } from "next/navigation";
import { ProjectLocalNav } from "@/components/projects/project-local-nav";
import { QuoteDraftWorkspace } from "@/components/quote-draft/quote-draft-workspace";
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
  let view;
  try {
    view = context
      ? await createQuoteDraftServices().read.execute({ ...context, locale }, projectKey)
      : null;
  } catch {
    view = null;
  }
  return (
    <div className="foundation-page">
      <ProjectLocalNav locale={locale} projectKey={projectKey} labels={getCatalog(locale)} />
      {view?.kind === "AVAILABLE" ? (
        <QuoteDraftWorkspace key={`${locale}:${projectKey}`} locale={locale} initial={view} />
      ) : (
        <p role="status">{quoteDraftCopy(locale).UNAVAILABLE}</p>
      )}
    </div>
  );
}
