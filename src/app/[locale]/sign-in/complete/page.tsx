import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { realIdentityState } from "@/lib/server/real-identity";
import { isSupportedLocale } from "@/modules/localization/config";
import { sameSiteReturn, signInMode } from "@/modules/sign-in/domain/policy";
export default async function Complete({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (signInMode(process.env) === "demo") notFound();
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const state = await realIdentityState();
  if (!state) redirect(`/${locale}/sign-in`);
  const next = sameSiteReturn((await searchParams).returnTo, locale);
  if (!state.choices.length) redirect(`/${locale}/no-access`);
  if (!state.context) redirect(`/${locale}/choose-firm?returnTo=${encodeURIComponent(next)}`);
  redirect(next as Route);
}
