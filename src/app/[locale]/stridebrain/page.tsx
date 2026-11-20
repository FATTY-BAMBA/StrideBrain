import { notFound, redirect } from "next/navigation";
import { isSupportedLocale } from "@/modules/localization/config";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ project?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const search = await searchParams;
  const project = typeof search.project === "string" ? search.project : undefined;
  redirect(`/${locale}${project ? `?project=${encodeURIComponent(project)}` : ""}`);
}
