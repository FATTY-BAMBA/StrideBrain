import { headers } from "next/headers";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { NotFoundContent } from "@/components/ui/not-found-content";
import { getCatalog } from "@/modules/localization/catalog";
import { htmlLanguage } from "@/modules/localization/config";
import { loadWorkspaceAccount } from "@/lib/server/workspace-account";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import "./globals.css";
export default async function GlobalNotFound() {
  const locale = (await headers()).get("x-stridebrain-page-locale") === "en" ? "en" : "zh-TW";
  const account = await loadWorkspaceAccount(locale);
  const context = await resolveServerRuntimeContext().catch(() => null);
  return (
    <html lang={htmlLanguage(locale)}>
      <body>
        <WorkspaceShell
          locale={locale}
          catalog={getCatalog(locale)}
          account={account}
          canReadClients={context?.capabilities.has("client:read") ?? false}
        >
          <NotFoundContent locale={locale} />
        </WorkspaceShell>
      </body>
    </html>
  );
}
