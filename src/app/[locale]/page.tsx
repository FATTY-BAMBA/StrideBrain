import { notFound } from "next/navigation";

import { FoundationPage } from "@/components/ui/foundation-page";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) {
    notFound();
  }

  const catalog = getCatalog(rawLocale);

  return (
    <FoundationPage
      eyebrow={catalog["home.eyebrow"]}
      title={catalog["home.title"]}
      description={catalog["home.description"]}
    >
      <div className="foundation-grid">
        <article className="foundation-card foundation-card--primary">
          <span className="foundation-card__index">01</span>
          <div>
            <h2>{catalog["home.foundationTitle"]}</h2>
            <p>{catalog["home.foundationDescription"]}</p>
          </div>
        </article>
        <article className="foundation-card">
          <span className="foundation-card__index">02</span>
          <div>
            <h2>{catalog["home.nextTitle"]}</h2>
            <p>{catalog["home.nextDescription"]}</p>
          </div>
        </article>
      </div>

      <a
        className="text-link"
        href="https://github.com/FATTY-BAMBA/StrideBrain/blob/main/docs/build/V0_1_BUILD_CONTRACT.md"
        target="_blank"
        rel="noreferrer"
      >
        {catalog["action.viewArchitecture"]} <span aria-hidden="true">↗</span>
      </a>
    </FoundationPage>
  );
}
