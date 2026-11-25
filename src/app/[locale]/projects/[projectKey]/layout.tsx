import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { JobChatPanel } from "@/components/assistant/job-chat-panel";
import { createAssistantControlServices } from "@/lib/server/assistant-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { isSupportedLocale } from "@/modules/localization/config";

export default async function JobLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; projectKey: string }>;
}) {
  const { locale, projectKey } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const context = await resolveServerRuntimeContext();
  if (!context?.capabilities.has("project:read")) notFound();
  // Use the same tenant/member/assignment check as the assistant. Excluded jobs
  // still show the panel; the existing server action supplies the no-model refusal.
  const policy = await createAssistantControlServices().repository.jobPolicy(context, projectKey);
  if (!policy) notFound();
  return (
    <>
      {children}
      <JobChatPanel
        key={`${context.membershipId}:${locale}:${projectKey}`}
        locale={locale}
        projectKey={projectKey}
      />
    </>
  );
}
