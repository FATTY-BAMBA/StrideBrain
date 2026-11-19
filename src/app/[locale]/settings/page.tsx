import Link from "next/link";
import { notFound } from "next/navigation";
import { FoundationPage } from "@/components/ui/foundation-page";
import { getCatalog } from "@/modules/localization/catalog";
import { isSupportedLocale } from "@/modules/localization/config";
import { getValueCopy } from "@/modules/demo-value/copy";
import { LeavePreview } from "@/components/demo-value/preview-entry";
import { previewSessionOrigin } from "@/modules/preview-session/config";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const catalog = getCatalog(locale);
  const sections =
    locale === "en"
      ? ["Team & access", "Data connections", "AI preferences"]
      : ["團隊與存取權限", "資料連結", "AI 偏好設定"];
  return (
    <FoundationPage
      eyebrow={catalog["nav.settings"]}
      title={catalog["settings.title"]}
      description={catalog["settings.description"]}
    >
      {previewSessionOrigin(process.env) && <LeavePreview locale={locale} />}
      <section className="settings-language">
        <h2>{locale === "en" ? "Language" : "語言"}</h2>
        <nav aria-label={locale === "en" ? "Language" : "語言"}>
          <Link href="/en/settings" aria-current={locale === "en" ? "page" : undefined}>
            English
          </Link>
          <Link href="/zh-TW/settings" aria-current={locale === "zh-TW" ? "page" : undefined}>
            繁體中文
          </Link>
        </nav>
      </section>
      <div className="settings-planned">
        {sections.map((title) => (
          <section key={title}>
            <h2>{title}</h2>
            <span>{getValueCopy(locale).planned}</span>
          </section>
        ))}
      </div>
    </FoundationPage>
  );
}
