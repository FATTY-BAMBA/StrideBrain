import type { Locale } from "./config";

const subtypes: Readonly<Record<string, readonly [string, string]>> = {
  RETAIL_FLAGSHIP: ["Retail flagship", "零售旗艦店"],
  RETAIL_RENOVATION: ["Retail renovation", "零售門市改裝"],
  RETAIL_CONCEPT_STORE: ["Retail concept store", "零售概念店"],
  RETAIL_SHOWROOM: ["Retail showroom", "零售展示店"],
  CORPORATE_OFFICE: ["Corporate office", "企業辦公室"],
  WORKPLACE_RENOVATION: ["Workplace renovation", "辦公空間改裝"],
  BOUTIQUE_HOSPITALITY: ["Boutique hospitality", "精品旅宿"],
};

export function projectSubtypeLabel(locale: Locale, subtype: string): string | undefined {
  return Object.hasOwn(subtypes, subtype)
    ? subtypes[subtype]![locale === "zh-TW" ? 1 : 0]
    : undefined;
}

// Translate known stored place names without changing source records or guessing
// translations for customer-supplied locations. Districts are scoped by city.
const locations: Readonly<
  Record<string, Readonly<{ city: string; districts: Readonly<Record<string, string>> }>>
> = {
  "Taipei City": {
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
  "New Taipei City": { city: "新北市", districts: { "Banqiao District": "板橋區" } },
};

export function projectLocationLabel(
  locale: Locale,
  location: Readonly<{ city: string; district?: string | undefined }>,
): string {
  const known = Object.hasOwn(locations, location.city) ? locations[location.city] : undefined;
  if (locale === "zh-TW" && known) {
    const district = location.district;
    if (!district) return known.city;
    if (Object.hasOwn(known.districts, district))
      return `${known.city}${known.districts[district]}`;
    return `${known.city} · ${district}`;
  }
  return [location.district, location.city].filter(Boolean).join(", ");
}
