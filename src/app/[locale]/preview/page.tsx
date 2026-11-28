import { signInMode } from "@/modules/sign-in/domain/policy";
import { notFound } from "next/navigation";
import { PreviewEntry } from "@/components/demo-value/preview-entry";
import { isSupportedLocale } from "@/modules/localization/config";
import { previewInvitation } from "@/modules/preview-session/config";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ unavailable?: string }>;
}) {
  if (signInMode(process.env) === "real") notFound();
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const search = await searchParams;
  return (
    <PreviewEntry
      locale={locale}
      available={Boolean(previewInvitation(process.env, new Date()))}
      failed={search.unavailable === "1"}
    />
  );
}
