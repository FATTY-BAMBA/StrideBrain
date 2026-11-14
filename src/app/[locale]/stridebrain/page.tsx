import { notFound } from "next/navigation";

import { FoundationPage } from "@/components/ui/foundation-page";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

type StrideBrainPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function StrideBrainPage({ params }: StrideBrainPageProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) {
    notFound();
  }

  const catalog = getCatalog(rawLocale);

  return (
    <FoundationPage
      eyebrow={catalog["stridebrain.eyebrow"]}
      title={catalog["stridebrain.title"]}
      description={catalog["stridebrain.description"]}
    >
      <div className="composer-placeholder" aria-disabled="true">
        <span aria-hidden="true">✦</span>
        <p>{catalog["state.notConnected"]}</p>
      </div>
    </FoundationPage>
  );
}
