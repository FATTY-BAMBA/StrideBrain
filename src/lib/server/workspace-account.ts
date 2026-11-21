import { getPrismaClient } from "./prisma";
import { resolveServerRuntimeContext } from "./runtime-context";
import { GetWorkspaceAccount } from "@/modules/runtime-context/get-workspace-account";
import { PrismaWorkspaceAccountRepository } from "@/repositories/prisma/prisma-workspace-account-repository";
import type { Locale } from "@/modules/localization/config";
export async function loadWorkspaceAccount(locale: Locale) {
  const context = await resolveServerRuntimeContext().catch(() => null);
  return context
    ? new GetWorkspaceAccount(new PrismaWorkspaceAccountRepository(getPrismaClient())).execute({
        ...context,
        locale,
      })
    : null;
}
