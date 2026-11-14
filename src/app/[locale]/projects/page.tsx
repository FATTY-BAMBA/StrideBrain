import { notFound } from "next/navigation";

import { FoundationPage } from "@/components/ui/foundation-page";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

type ProjectsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) {
    notFound();
  }

  const catalog = getCatalog(rawLocale);

  return (
    <FoundationPage
      eyebrow={catalog["projects.eyebrow"]}
      title={catalog["projects.title"]}
      description={catalog["projects.description"]}
    >
      <div className="empty-state" role="status">
        <span className="empty-state__symbol" aria-hidden="true">
          P
        </span>
        <div>
          <strong>{catalog["state.notConnected"]}</strong>
          <p>{catalog["home.foundationDescription"]}</p>
        </div>
      </div>
    </FoundationPage>
  );
}
