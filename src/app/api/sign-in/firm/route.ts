import { realIdentityState } from "@/lib/server/real-identity";
import { getPrismaClient } from "@/lib/server/prisma";
import { getServerEnvironment } from "@/lib/env/server-env";
import { sameSiteReturn, signInMode } from "@/modules/sign-in/domain/policy";
export async function POST(request: Request) {
  if (signInMode(process.env) === "demo") return new Response(null, { status: 404 });
  if (request.headers.get("origin") !== getServerEnvironment().appOrigin.origin)
    return new Response(null, { status: 403 });
  const form = await request.formData();
  const locale = form.get("locale") === "en" ? "en" : "zh-TW";
  const state = await realIdentityState();
  const membership = state?.choices.find((m) => m.id === form.get("membershipId"));
  if (!state || !membership) return new Response(null, { status: 404 });
  await getPrismaClient().authSession.updateMany({
    where: { id: state.session.id, userId: state.session.userId },
    data: { selectedMembershipId: membership.id },
  });
  return new Response(null, {
    status: 303,
    headers: { Location: sameSiteReturn(form.get("returnTo"), locale) },
  });
}
