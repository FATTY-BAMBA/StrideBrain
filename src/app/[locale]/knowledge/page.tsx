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
  const labels =
    rawLocale === "zh-TW"
      ? ["專案", "文件", "報價", "供應商", "資料依據"]
      : ["Projects", "Documents", "Quotations", "Suppliers", "Evidence"];

  return (
    <FoundationPage
      eyebrow={catalog["knowledge.eyebrow"]}
      title={catalog["knowledge.title"]}
      description={catalog["knowledge.description"]}
    >
      <div className="boundary-list" aria-label={catalog["knowledge.title"]}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </FoundationPage>
  );
}
