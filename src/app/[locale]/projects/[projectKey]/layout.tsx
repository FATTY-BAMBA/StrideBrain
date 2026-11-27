import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { JobChatPanel } from "@/components/assistant/job-chat-panel";
import { JobChatStateProvider } from "@/components/assistant/job-chat-state";
import { ProjectLocalNav } from "@/components/projects/project-local-nav";
import styles from "@/components/assistant/job-chat-panel.module.css";
import { createAssistantControlServices } from "@/lib/server/assistant-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

/** Authorize the shared job boundary before rendering navigation or any tab. */
async function authorizedMember(
  projectKey: string,
): Promise<{ id: string; canReadQuote: boolean } | null> {
  const context = await resolveServerRuntimeContext();
  if (!context?.capabilities.has("project:read")) return null;
  const policy = await createAssistantControlServices().repository.jobPolicy(context, projectKey);
  return policy
    ? { id: context.membershipId, canReadQuote: context.capabilities.has("quote:read") }
    : null;
}

export default async function JobLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; projectKey: string }>;
}) {
  const { locale, projectKey } = await params;
  // Each page keeps its own locale and unavailable-state handling.
  if (!isSupportedLocale(locale)) return children;
  const member = await authorizedMember(projectKey);
  if (!member) notFound();
  return (
    <JobChatStateProvider key={`${locale}:${projectKey}`}>
      <div className={styles.navigation}>
        <ProjectLocalNav locale={locale} projectKey={projectKey} labels={getCatalog(locale)} />
        {member && (
          <JobChatPanel
            key={member.id}
            locale={locale}
            projectKey={projectKey}
            canReadQuote={member.canReadQuote}
          />
        )}
      </div>
      <div className={styles.body}>{children}</div>
    </JobChatStateProvider>
  );
}
