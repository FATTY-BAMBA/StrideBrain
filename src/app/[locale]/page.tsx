import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { ValueLaunchpad } from "@/components/demo-value/value-launchpad";
import { loadDemoValueContext } from "@/lib/server/demo-value-context";
import { isSupportedLocale } from "@/modules/localization/config";
import { previewSessionOrigin } from "@/modules/preview-session/config";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { resolveHomeIntent } from "@/modules/home-intelligence/home-intelligence";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ project?: string | string[]; q?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  if (
    previewSessionOrigin(process.env) &&
    !(await resolveServerRuntimeContext().catch(() => null))
  ) {
    redirect(`/${locale}/preview`);
  }
  const search = await searchParams;
  const context = await loadDemoValueContext(
    locale,
    typeof search.project === "string" ? search.project : undefined,
  );
  const query = typeof search.q === "string" ? search.q : "";
  if (query) {
    const intent = resolveHomeIntent(locale, query, context);
    if (intent.kind === "MATCH") redirect(intent.href as Route);
  }
  return <ValueLaunchpad locale={locale} context={context} {...(query ? { unmatchedQuery: query } : {})} />;
}
