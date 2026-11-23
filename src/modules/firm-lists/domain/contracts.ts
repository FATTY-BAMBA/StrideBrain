import type { AreaDisplayUnit } from "./area-unit";
import type { Locale } from "@/modules/localization/config";

export type FirmListEntry = Readonly<{
  key: string;
  nameEn: string;
  nameZhTw: string;
  sortOrder: number;
  active: boolean;
}>;
export type FirmJobType = FirmListEntry & Readonly<{ relatedKeys: readonly string[] }>;
export type FirmWorkCategory = FirmListEntry &
  Readonly<{
    scopeSelectable: boolean;
    aliases: readonly string[];
    pricedUnderKey: string | null;
  }>;
export type FirmLists = Readonly<{
  revision: string;
  areaDisplayUnit: AreaDisplayUnit;
  jobTypes: readonly FirmJobType[];
  workCategories: readonly FirmWorkCategory[];
  quoteUnits: readonly FirmListEntry[];
}>;

/** The stable key is a safe fallback for old records whose label is unavailable. */
export function firmEntryLabel(
  entries: readonly FirmListEntry[],
  key: string,
  locale: Locale,
): string {
  const entry = entries.find((entry) => entry.key === key);
  return entry ? (locale === "zh-TW" ? entry.nameZhTw : entry.nameEn) : key;
}

export function orderFirmEntries<T extends FirmListEntry>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
}
