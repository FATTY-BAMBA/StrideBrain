import { defaultLocale, isSupportedLocale, type Locale } from "./config";
export const LOCALE_PREFERENCE_COOKIE = "stridebrain_locale";
export function preferredLocale(value: unknown): Locale {
  return typeof value === "string" && isSupportedLocale(value) ? value : defaultLocale;
}
export function localePreferenceCookie(locale: Locale, secure: boolean): string {
  return `${LOCALE_PREFERENCE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
}
