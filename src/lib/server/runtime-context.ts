import { signInMode } from "@/modules/sign-in/domain/policy";
import { realIdentityState } from "./real-identity";
import { cache } from "react";
import { headers } from "next/headers";

import { getDemoSessionSecret } from "@/lib/env/demo-session-secret";
import { getServerEnvironment } from "@/lib/env/server-env";
import { getPrismaClient } from "@/lib/server/prisma";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { readCookieValue } from "@/modules/runtime-context/session-cookie";
import { SignedDemoIdentityContext } from "@/modules/runtime-context/signed-demo-identity-context";
import { PrismaFirmListsRepository } from "@/repositories/prisma/prisma-firm-lists-repository";
import {
  PrismaDemoSessionRepository,
  type PrismaDemoSessionDatabase,
} from "@/repositories/prisma/prisma-demo-session-repository";

/**
 * Resolves identity only from the signed HTTP-only demo-session cookie and
 * current server-side membership/grant/assignment records. URL parameters and
 * browser state never select organization, role, or capability.
 */
export const resolveServerRuntimeContext = cache(async (): Promise<RuntimeContext | null> => {
  const mode = signInMode(process.env);
  if (mode !== "demo") {
    const real = await realIdentityState();
    if (real) {
      if (!real.context) return null;
      const firmLists = await new PrismaFirmListsRepository(getPrismaClient())
        .read(real.context)
        .catch(() => null);
      return Object.freeze({ ...real.context, firmLists: firmLists ?? undefined });
    }
    if (mode === "real") return null;
  }
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  if (!cookieHeader) return null;

  const request = new Request(
    new URL("/internal/runtime-context", getServerEnvironment().appOrigin),
    { headers: { cookie: cookieHeader } },
  );
  if (!readCookieValue(request)) return null;

  const database = getPrismaClient() as unknown as PrismaDemoSessionDatabase;
  const repository = new PrismaDemoSessionRepository(database);
  const identity = new SignedDemoIdentityContext(repository, getDemoSessionSecret());
  const context = await identity.resolve(request);
  if (!context) return null;
  // A catalog failure leaves identity available; dependent features return their unavailable state.
  const firmLists = await new PrismaFirmListsRepository(getPrismaClient())
    .read(context)
    .catch(() => null);
  return Object.freeze({ ...context, firmLists: firmLists ?? undefined });
});
