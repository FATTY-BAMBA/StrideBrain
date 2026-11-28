import { requirePageIdentity } from "@/lib/server/require-page-identity";
import { notFound, redirect } from "next/navigation";
import { HomeDeskScreen } from "@/components/home-desk/home-desk";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { isSupportedLocale } from "@/modules/localization/config";
import { previewSessionOrigin } from "@/modules/preview-session/config";

export default async function DecisionsPage({ params }: { params: Promise<{ locale: string }> }) {
  await requirePageIdentity();
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const identity = await resolveServerRuntimeContext().catch(() => null);
  if (!identity && previewSessionOrigin(process.env)) redirect(`/${locale}/preview`);
  const outcome = identity
    ? await createHomeDeskService().execute({ ...identity, locale })
    : { kind: "UNAVAILABLE" as const };
  return <HomeDeskScreen locale={locale} outcome={outcome} complete />;
}
