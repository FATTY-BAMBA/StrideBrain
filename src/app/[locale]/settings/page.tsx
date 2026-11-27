import { signInMode } from "@/modules/sign-in/domain/policy";
import { createFirmListServices } from "@/lib/server/firm-list-services";
import { FirmListSettings } from "@/components/firm-lists/firm-list-settings";
import { firmListsCopy } from "@/modules/localization/firm-lists";
import Link from "next/link";
import { AssistantSettings } from "@/components/assistant/assistant-settings";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createQuoteIssueServices } from "@/lib/server/quote-issue-services";
import { FirmDetailsForm } from "@/components/quote-issue/firm-details-form";
import { quoteIssueCopy } from "@/modules/localization/quote-issue";
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
  const context = await resolveServerRuntimeContext();
  const firm = context
    ? await createQuoteIssueServices()
        .firm.execute({ ...context, locale })
        .catch(() => null)
    : null;
  const lists = context ? await createFirmListServices().get.execute(context) : null;
  const sections =
    locale === "en" ? ["Team & access", "Data connections"] : ["團隊與存取權限", "資料連結"];
  return (
    <FoundationPage
      eyebrow={catalog["nav.settings"]}
      title={catalog["settings.title"]}
      description={catalog["settings.description"]}
    >
      {previewSessionOrigin(process.env) && <LeavePreview locale={locale} />}
      {signInMode(process.env) !== "demo" && context?.role === "ORGANIZATION_ADMIN" && (
        <Link href={`/${locale}/settings/people`}>{locale === "en" ? "People" : "成員"}</Link>
      )}
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
      {firm?.kind === "AVAILABLE" ? (
        <FirmDetailsForm locale={locale} details={firm.details} canManage={firm.canManage} />
      ) : context?.capabilities.has("quote:read") ||
        context?.capabilities.has("settings:manage") ? (
        <p role="status">{quoteIssueCopy(locale).UNAVAILABLE}</p>
      ) : null}
      {lists?.kind === "AVAILABLE" ? (
        <FirmListSettings initial={lists} locale={locale} />
      ) : context?.capabilities.has("firm-lists:manage") ? (
        <p role="status">{firmListsCopy(locale).UNAVAILABLE}</p>
      ) : null}
      {context && <AssistantSettings context={{ ...context, locale }} />}
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
