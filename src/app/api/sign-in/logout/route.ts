import { boundedSignInForm } from "@/modules/sign-in/application/bounded-form";
import { getRealAuth } from "@/lib/server/better-auth";
import { getServerEnvironment } from "@/lib/env/server-env";
import { signInMode } from "@/modules/sign-in/domain/policy";
export async function POST(request: Request) {
  if (signInMode(process.env) === "demo") return new Response(null, { status: 404 });
  if (request.headers.get("origin") !== getServerEnvironment().appOrigin.origin)
    return new Response(null, { status: 403 });
  const form = await boundedSignInForm(request, ["locale"]);
  if (!form) return new Response(null, { status: 400 });
  const locale = form.get("locale") === "en" ? "en" : "zh-TW";
  const result = await getRealAuth().api.signOut({ headers: request.headers, asResponse: true });
  const headers = new Headers(result.headers);
  headers.set("Location", `/${locale}/sign-in`);
  return new Response(null, { status: 303, headers });
}
