export const supportedLocales = ["zh-TW", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "zh-TW";

export function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function htmlLanguage(locale: Locale): "zh-Hant" | "en" {
  return locale === "zh-TW" ? "zh-Hant" : "en";
}
