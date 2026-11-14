import { notFound } from "next/navigation";

import { FoundationPage } from "@/components/ui/foundation-page";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

type KnowledgePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) {
    notFound();
  }

  const catalog = getCatalog(rawLocale);

  return (
    <FoundationPage
      eyebrow={catalog["knowledge.eyebrow"]}
      title={catalog["knowledge.title"]}
      description={catalog["knowledge.description"]}
    >
      <div className="boundary-list" aria-label={catalog["knowledge.title"]}>
        <span>Projects</span>
        <span>Documents</span>
        <span>Quotations</span>
        <span>Suppliers</span>
        <span>Evidence</span>
      </div>
    </FoundationPage>
  );
}
