import type { VerifiedSession } from "@/repositories/ports/real-identity";
import { BetterAuthIdentityContext } from "@/modules/runtime-context/better-auth-identity-context";
import { cache } from "react";
import { headers } from "next/headers";
import { getRealAuth } from "./better-auth";
import { getPrismaClient } from "./prisma";
import { PrismaRealIdentity } from "@/repositories/prisma/prisma-real-identity";
export const realIdentityState = cache(async () => {
  const result = await getRealAuth().api.getSession({ headers: await headers() });
  if (
    !result ||
    !result.user.emailVerified ||
    result.session.createdAt.getTime() + 30 * 86400_000 <= Date.now()
  )
    return null;
  const repository = new PrismaRealIdentity(getPrismaClient());
  const session = {
    id: result.session.id,
    userId: result.user.id,
    emailVerified: result.user.emailVerified,
    expiresAt: result.session.expiresAt,
    createdAt: result.session.createdAt,
  };
  return {
    session,
    choices: await repository.choices(result.user.id),
    context: await new BetterAuthIdentityContext({ read: async () => session }, repository).resolve(
      new Request("https://stridebrain.invalid/internal"),
    ),
  };
});

export async function selectRealFirm(session: VerifiedSession, membershipId: string) {
  return new PrismaRealIdentity(getPrismaClient()).selectFirm(session, membershipId);
}
