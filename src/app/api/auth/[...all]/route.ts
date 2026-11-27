import { clearDemoIdentity } from "@/lib/server/switch-sign-in-kind";
import { signInMode } from "@/modules/sign-in/domain/policy";
import { guardedAuthHandler } from "@/modules/sign-in/application/auth-handler";
import { realSignInSettings } from "@/lib/env/sign-in";
import { getRealAuth } from "@/lib/server/better-auth";
import { getPrismaClient } from "@/lib/server/prisma";
import { PrismaSignInCounter } from "@/repositories/prisma/prisma-sign-in-counter";
export const runtime = "nodejs";
async function handler(request: Request) {
  if (signInMode(process.env) === "demo") return new Response(null, { status: 404 });
  const settings = realSignInSettings(process.env);
  const response = await guardedAuthHandler(request, {
    handler: (req) => getRealAuth().handler(req),
    counter: new PrismaSignInCounter(getPrismaClient()),
    secret: settings.secret,
    origin: settings.origin,
    hosted: process.env.VERCEL === "1",
  });
  if (
    response.headers
      .getSetCookie()
      .some((c) => /session_token=.+/.test(c) && !c.includes("Max-Age=0"))
  )
    await clearDemoIdentity(request, response);
  return response;
}
export const GET = handler;
export const POST = handler;
