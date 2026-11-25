import { cityLabel, taiwanCityKey } from "@/modules/projects/domain/taiwan-cities";
import type { FirmJobType } from "@/modules/firm-lists/domain/contracts";
import type { Locale } from "./config";

export function projectSubtypeLabel(
  locale: Locale,
  subtype: string,
  types: readonly FirmJobType[],
): string | undefined {
  const entry = types.find((type) => type.key === subtype);
  return entry ? (locale === "zh-TW" ? entry.nameZhTw : entry.nameEn) : undefined;
}

// Translate known stored place names without changing source records or guessing
// translations for customer-supplied locations. Districts are scoped by city.
const locations: Readonly<
  Record<string, Readonly<{ city: string; districts: Readonly<Record<string, string>> }>>
> = {
  TAIPEI_CITY: {
    city: "臺北市",
    districts: {
      "Xinyi District": "信義區",
      "Neihu District": "內湖區",
      "Zhongshan District": "中山區",
      "Songshan District": "松山區",
      "Daan District": "大安區",
      "Nangang District": "南港區",
    },
  },
  NEW_TAIPEI_CITY: { city: "新北市", districts: { "Banqiao District": "板橋區" } },
};

export function projectLocationLabel(
  locale: Locale,
  location: Readonly<{ city: string; district?: string | undefined }>,
): string {
  const key = taiwanCityKey(location.city);
  const known = key && Object.hasOwn(locations, key) ? locations[key] : undefined;
  const name = cityLabel(locale, location.city);
  if (locale === "zh-TW" && known) {
    const district = location.district;
    if (!district) return known.city;
    if (Object.hasOwn(known.districts, district))
      return `${known.city}${known.districts[district]}`;
    return `${known.city} · ${district}`;
  }
  return locale === "zh-TW"
    ? [name, location.district].filter(Boolean).join(" · ")
    : [location.district, name].filter(Boolean).join(", ");
}
