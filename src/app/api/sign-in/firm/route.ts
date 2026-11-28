import { boundedSignInForm } from "@/modules/sign-in/application/bounded-form";
import { realIdentityState, selectRealFirm } from "@/lib/server/real-identity";
import { getServerEnvironment } from "@/lib/env/server-env";
import { sameSiteReturn, signInMode } from "@/modules/sign-in/domain/policy";
export async function POST(request: Request) {
  if (signInMode(process.env) === "demo") return new Response(null, { status: 404 });
  if (request.headers.get("origin") !== getServerEnvironment().appOrigin.origin)
    return new Response(null, { status: 403 });
  const form = await boundedSignInForm(request, ["locale", "returnTo", "membershipId"]);
  if (!form) return new Response(null, { status: 400 });
  const locale = form.get("locale") === "en" ? "en" : "zh-TW";
  const state = await realIdentityState();
  const membership = state?.choices.find((m) => m.id === form.get("membershipId"));
  if (!state || !membership) return new Response(null, { status: 404 });
  if (!(await selectRealFirm(state.session, membership.id)))
    return new Response(null, { status: 404 });
  return new Response(null, {
    status: 303,
    headers: { Location: sameSiteReturn(form.get("returnTo"), locale) },
  });
}
