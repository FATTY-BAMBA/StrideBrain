import { quoteIssueCopy } from "@/modules/localization/quote-issue";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { FirmDetailsForm } from "@/components/quote-issue/firm-details-form";
import { emptyFirmDetails } from "@/modules/quote-issue/domain/contracts";
vi.mock("@/app/[locale]/projects/[projectKey]/quote/issue-actions", () => ({
  quoteIssueMutationAction: vi.fn(),
}));
it.each([
  {
    locale: "en" as const,
    labels: [
      "Email (optional)",
      "Default terms (English, optional)",
      "Default terms (Traditional Chinese, optional)",
    ],
  },
  {
    locale: "zh-TW" as const,
    labels: ["電子郵件（選填）", "預設條款（英文，選填）", "預設條款（繁體中文，選填）"],
  },
])(
  "labels optional Settings fields in $locale without requiring completion to save",
  ({ locale, labels }) => {
    const html = renderToStaticMarkup(
      createElement(FirmDetailsForm, { locale, details: emptyFirmDetails, canManage: true }),
    );
    for (const label of labels) expect(html).toContain(label);
    expect(html).not.toMatch(/required[ =]/);
    expect(html).not.toContain("disabled");
  },
);

it.each(["en", "zh-TW"] as const)(
  "puts the four Chinese-quote requirements first in Settings (%s)",
  (locale) => {
    const html = renderToStaticMarkup(
      createElement(FirmDetailsForm, { locale, details: emptyFirmDetails, canManage: true }),
    );
    const copy = quoteIssueCopy(locale);
    expect([...html.matchAll(/<label>([^<]+)/g)].map((match) => match[1])).toEqual([
      copy.legalNameZhTw,
      copy.taxId,
      copy.addressZhTw,
      copy.phone,
      copy.email,
      copy.defaultValidityDays,
      copy.termsZhTw,
      copy.legalNameEn,
      copy.addressEn,
      copy.termsEn,
    ]);
  },
);
