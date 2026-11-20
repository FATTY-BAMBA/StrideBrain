import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { NewJobForm } from "@/components/projects/new-job-form";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { isSupportedLocale } from "@/modules/localization/config";
import { jobsCopy } from "@/modules/localization/jobs";

export default async function NewProjectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const copy = jobsCopy(locale);
  const context = await resolveServerRuntimeContext().catch(() => null);
  const allowed =
    context?.dataMode === "DEMO_SYNTHETIC" &&
    context.capabilities.has("project:create") &&
    context.capabilities.has("project:read");
  return (
    <FoundationPage
      eyebrow={copy.newJob}
      title={copy.newJob}
      description={allowed ? copy.description : copy.unavailable}
    >
      {allowed ? (
        <NewJobForm locale={locale} idempotencyKey={randomUUID()} />
      ) : (
        <p role="status">{copy.unavailable}</p>
      )}
    </FoundationPage>
  );
}
