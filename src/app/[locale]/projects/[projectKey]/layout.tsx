import type { ReactNode } from "react";
import { JobChatPanel } from "@/components/assistant/job-chat-panel";
import { JobChatStateProvider } from "@/components/assistant/job-chat-state";
import { ProjectLocalNav } from "@/components/projects/project-local-nav";
import ui from "@/components/ui/ui.module.css";
import styles from "@/components/assistant/job-chat-panel.module.css";
import { createAssistantControlServices } from "@/lib/server/assistant-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

/** This lookup controls an optional bar, never access to the page or a model call. */
async function panelMember(projectKey: string): Promise<string | null> {
  try {
    const context = await resolveServerRuntimeContext();
    if (!context?.capabilities.has("project:read")) return null;
    const policy = await createAssistantControlServices().repository.jobPolicy(context, projectKey);
    return policy ? context.membershipId : null;
  } catch {
    return null;
  }
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
  const member = await panelMember(projectKey);
  return (
    <JobChatStateProvider key={`${locale}:${projectKey}`}>
      <div className={`${ui.page} ${styles.navigation}`}>
        <ProjectLocalNav locale={locale} projectKey={projectKey} labels={getCatalog(locale)} />
        {member && <JobChatPanel key={member} locale={locale} projectKey={projectKey} />}
      </div>
      {children}
    </JobChatStateProvider>
  );
}
