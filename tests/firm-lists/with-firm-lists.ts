import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { PrismaFirmListsRepository } from "@/repositories/prisma/prisma-firm-lists-repository";
import { getPrismaClient } from "@/lib/server/prisma";
import type { PrismaClient } from "../../.generated/prisma/client";

/** Matches the production request composition; session authorization remains unchanged. */
export async function withFirmLists(
  context: RuntimeContext,
  database: PrismaClient = getPrismaClient(),
): Promise<RuntimeContext> {
  return {
    ...context,
    firmLists: (await new PrismaFirmListsRepository(database).read(context)) ?? undefined,
  };
}
