import { notFound } from "next/navigation";

import { FoundationPage } from "@/components/ui/foundation-page";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) {
    notFound();
  }

  const catalog = getCatalog(rawLocale);

  return (
    <FoundationPage
      eyebrow={catalog["settings.eyebrow"]}
      title={catalog["settings.title"]}
      description={catalog["settings.description"]}
    >
      <div className="empty-state" role="status">
        <span className="empty-state__symbol" aria-hidden="true">
          S
        </span>
        <div>
          <strong>{catalog["state.stageZero"]}</strong>
          <p>{catalog["settings.description"]}</p>
        </div>
      </div>
    </FoundationPage>
  );
}
