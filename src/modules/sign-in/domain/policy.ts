import type { Locale } from "@/modules/localization/config";

export type SignInMode = "demo" | "real" | "both";
export function signInMode(env: Record<string, string | undefined>): SignInMode {
  const mode = env.STRIDEBRAIN_SIGN_IN_MODE ?? "demo";
  if (mode !== "demo" && mode !== "real" && mode !== "both") {
    throw new Error("STRIDEBRAIN_SIGN_IN_MODE must be demo, real, or both.");
  }
  if (env.NEXT_PUBLIC_STRIDEBRAIN_ENV === "production" && mode !== "real") {
    throw new Error("Production requires real sign-in.");
  }
  return mode;
}

export function sameSiteReturn(value: unknown, locale: Locale): string {
  const home = `/${locale}`;
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x20\x7f]/.test(value)
  )
    return home;
  try {
    const url = new URL(value, "https://stridebrain.invalid");
    if (url.origin !== "https://stridebrain.invalid") return home;
    const decoded = decodeURIComponent(url.pathname);
    if (/[\\\x00-\x20\x7f]/.test(decoded) || decoded.startsWith("//")) return home;
    if (
      !/^\/(en|zh-TW)(\/|$)/.test(decoded) ||
      /\/(sign-in|no-access|choose-firm|preview)(\/|$)/.test(decoded)
    )
      return home;
    return url.pathname + url.search;
  } catch {
    return home;
  }
}

export function normalizeSignInEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export const EMAIL_LIMITS = {
  request: { shortSeconds: 60, shortMax: 1, dayMax: 10 },
  entry: { shortSeconds: 600, shortMax: 5, dayMax: 20 },
  invitation: { shortSeconds: 60, shortMax: 1, dayMax: 10 },
} as const;
