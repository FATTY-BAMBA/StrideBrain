import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { DraftableNewJob } from "@/components/projects/draftable-new-job";
import { jobDraftAvailable } from "@/lib/server/job-draft-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createProjectWriteServices } from "@/lib/server/project-write-services";
import { generateJobReference, generateClientReference } from "@/lib/server/job-reference";
import { isSupportedLocale } from "@/modules/localization/config";
import { jobsCopy } from "@/modules/localization/jobs";

export default async function NewProjectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const copy = jobsCopy(locale);
  const context = await resolveServerRuntimeContext().catch(() => null);
  const allowed =
    context &&
    context.firmLists &&
    context.capabilities.has("project:create") &&
    context.capabilities.has("project:read");
  const clients = allowed
    ? await createProjectWriteServices().listClients.execute({ ...context, locale })
    : null;
  return (
    <FoundationPage
      eyebrow={copy.newJob}
      title={copy.newJob}
      description={allowed ? copy.description : copy.unavailable}
    >
      {allowed && clients?.kind === "AVAILABLE" ? (
        <DraftableNewJob
          locale={locale}
          enabled={await jobDraftAvailable(context)}
          initialForm={{
            idempotencyKey: randomUUID(),
            businessKey: generateJobReference(),
            clientBusinessKey: generateClientReference(),
            catalog: context.firmLists!,
            clients: clients.clients,
          }}
        />
      ) : (
        <p role="status">{allowed ? copy.clientsUnavailable : copy.unavailable}</p>
      )}
    </FoundationPage>
  );
}
