import { getRealAuth } from "./better-auth";
import { getPrismaClient } from "./prisma";
import { getDemoSessionSecret } from "@/lib/env/demo-session-secret";
import {
  readCookieValue,
  serializeClearedDemoSessionCookie,
} from "@/modules/runtime-context/session-cookie";
import { verifySignedSessionToken } from "@/modules/runtime-context/session-token";
export async function clearDemoIdentity(request: Request, response: Response) {
  const token = readCookieValue(request);
  if (token && process.env.STRIDEBRAIN_DEMO_SESSION_SECRET) {
    const verified = verifySignedSessionToken(getDemoSessionSecret(), token);
    if (verified)
      await getPrismaClient().demoSession.updateMany({
        where: { id: verified.sessionId, tokenHash: verified.tokenHash },
        data: { revokedAt: new Date() },
      });
  }
  response.headers.append("Set-Cookie", serializeClearedDemoSessionCookie());
  return response;
}
export async function clearRealIdentity(request: Request, response: Response) {
  const signout = await getRealAuth().api.signOut({ headers: request.headers, asResponse: true });
  for (const cookie of signout.headers.getSetCookie())
    response.headers.append("Set-Cookie", cookie);
  return response;
}
