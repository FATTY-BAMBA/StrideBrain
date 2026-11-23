import { notFound, redirect } from "next/navigation";
import { HomeDeskScreen } from "@/components/home-desk/home-desk";
import { createHomeDeskService } from "@/lib/server/home-desk-services";
import { isSupportedLocale } from "@/modules/localization/config";
import { previewSessionOrigin } from "@/modules/preview-session/config";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { jobDraftAvailable } from "@/lib/server/job-draft-services";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ project?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  if (
    previewSessionOrigin(process.env) &&
    !(await resolveServerRuntimeContext().catch(() => null))
  ) {
    redirect(`/${locale}/preview`);
  }
  const identity = await resolveServerRuntimeContext().catch(() => null);
  const outcome = identity
    ? await createHomeDeskService().execute({ ...identity, locale })
    : { kind: "UNAVAILABLE" as const };
  const requested = (await searchParams)?.project;
  return (
    <HomeDeskScreen
      locale={locale}
      outcome={outcome}
      canDraftJob={await jobDraftAvailable(identity)}
      requestedProject={typeof requested === "string" ? requested : undefined}
    />
  );
}
