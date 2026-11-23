import Link from "next/link";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { assistantCopy } from "@/modules/localization/assistant";
import { isSupportedLocale } from "@/modules/localization/config";
export default async function AiDataPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const c = assistantCopy(locale);
  return (
    <FoundationPage eyebrow="StrideBrain" title={c.data} description={c.dataIntro}>
      <div className="assistant-data">
        <p>{c.dataSent}</p>
        <p>{c.dataNever}</p>
        <p>
          {c.dataTraining} <a href="https://ai.google.dev/gemini-api/terms">{c.terms}</a>
        </p>
        <p>{c.dataOff}</p>
        <Link href={`/${locale}/settings`}>{c.title}</Link>
      </div>
    </FoundationPage>
  );
}
