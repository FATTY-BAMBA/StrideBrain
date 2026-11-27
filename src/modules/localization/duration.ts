import type { Locale } from "./config";
export function durationLabel(ms: number | null | undefined, locale: Locale): string {
  return ms == null ? "—" : `${(ms / 1000).toFixed(1)} ${locale === "zh-TW" ? "秒" : "s"}`;
}
