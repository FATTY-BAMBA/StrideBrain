import { requirePageIdentity } from "@/lib/server/require-page-identity";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { assistantCopy } from "@/modules/localization/assistant";
import { isSupportedLocale } from "@/modules/localization/config";
export default async function CustomerCarePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePageIdentity();
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const c = assistantCopy(locale);
  return (
    <FoundationPage eyebrow={c.planned} title={c.customerCare} description={c.careDescription} />
  );
}
