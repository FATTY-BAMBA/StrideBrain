import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signInMode, sameSiteReturn } from "@/modules/sign-in/domain/policy";
import { realIdentityState } from "./real-identity";
import { resolveServerRuntimeContext } from "./runtime-context";
/** Called outside page-local catches, on every protected page render (including RSC navigation). */
export const requirePageIdentity = cache(async () => {
  const mode = signInMode(process.env);
  if (mode === "demo") return;
  const path = (await headers()).get("x-stridebrain-page-path") ?? "/zh-TW";
  const locale = /^\/en(?:\/|\?|$)/.test(path) ? "en" : "zh-TW";
  const identity = await realIdentityState();
  if (identity && !identity.choices.length) redirect(`/${locale}/no-access`);
  if (identity && !identity.context)
    redirect(`/${locale}/choose-firm?returnTo=${encodeURIComponent(sameSiteReturn(path, locale))}`);
  if (!identity && !(mode === "both" && (await resolveServerRuntimeContext())))
    redirect(`/${locale}/sign-in?returnTo=${encodeURIComponent(sameSiteReturn(path, locale))}`);
});
