import type { Locale } from "@/modules/localization/config";

/** NLSC county names: https://maps.nlsc.gov.tw/pro/download.jsp (COUNTY_MOI_1090820).
 * Keys are stable reference identities, not firm settings. Ambiguous bare Hsinchu/Chiayi are omitted. */
export const TAIWAN_CITIES = [
  {
    key: "TAIPEI_CITY",
    nameZhTw: "臺北市",
    nameEn: "Taipei City",
    aliases: ["台北市", "臺北", "台北", "Taipei", "Taibei"],
  },
  {
    key: "NEW_TAIPEI_CITY",
    nameZhTw: "新北市",
    nameEn: "New Taipei City",
    aliases: ["新北", "New Taipei", "Xinbei City"],
  },
  {
    key: "TAOYUAN_CITY",
    nameZhTw: "桃園市",
    nameEn: "Taoyuan City",
    aliases: ["桃園", "Taoyuan"],
  },
  {
    key: "TAICHUNG_CITY",
    nameZhTw: "臺中市",
    nameEn: "Taichung City",
    aliases: ["台中市", "臺中", "台中", "Taichung", "Taizhong"],
  },
  {
    key: "TAINAN_CITY",
    nameZhTw: "臺南市",
    nameEn: "Tainan City",
    aliases: ["台南市", "臺南", "台南", "Tainan"],
  },
  {
    key: "KAOHSIUNG_CITY",
    nameZhTw: "高雄市",
    nameEn: "Kaohsiung City",
    aliases: ["高雄", "Kaohsiung", "Gaoxiong"],
  },
  {
    key: "KEELUNG_CITY",
    nameZhTw: "基隆市",
    nameEn: "Keelung City",
    aliases: ["基隆", "Keelung", "Jilong"],
  },
  {
    key: "HSINCHU_CITY",
    nameZhTw: "新竹市",
    nameEn: "Hsinchu City",
    aliases: ["Xinzhu City"],
  },
  {
    key: "CHIAYI_CITY",
    nameZhTw: "嘉義市",
    nameEn: "Chiayi City",
    aliases: ["Jiayi City"],
  },
  {
    key: "HSINCHU_COUNTY",
    nameZhTw: "新竹縣",
    nameEn: "Hsinchu County",
    aliases: ["新竹县", "Xinzhu County", "Hsinchu Hsien"],
  },
  {
    key: "MIAOLI_COUNTY",
    nameZhTw: "苗栗縣",
    nameEn: "Miaoli County",
    aliases: ["苗栗", "Miaoli", "苗栗县"],
  },
  {
    key: "CHANGHUA_COUNTY",
    nameZhTw: "彰化縣",
    nameEn: "Changhua County",
    aliases: ["彰化", "Changhua", "彰化县"],
  },
  {
    key: "NANTOU_COUNTY",
    nameZhTw: "南投縣",
    nameEn: "Nantou County",
    aliases: ["南投", "Nantou", "南投县"],
  },
  {
    key: "YUNLIN_COUNTY",
    nameZhTw: "雲林縣",
    nameEn: "Yunlin County",
    aliases: ["雲林", "云林县", "Yunlin"],
  },
  {
    key: "CHIAYI_COUNTY",
    nameZhTw: "嘉義縣",
    nameEn: "Chiayi County",
    aliases: ["嘉义县", "Jiayi County", "Chiayi Hsien"],
  },
  {
    key: "PINGTUNG_COUNTY",
    nameZhTw: "屏東縣",
    nameEn: "Pingtung County",
    aliases: ["屏東", "屏东县", "Pingtung", "Pingdong"],
  },
  {
    key: "YILAN_COUNTY",
    nameZhTw: "宜蘭縣",
    nameEn: "Yilan County",
    aliases: ["宜蘭", "宜兰县", "Yilan", "Ilan", "Ilan County"],
  },
  {
    key: "HUALIEN_COUNTY",
    nameZhTw: "花蓮縣",
    nameEn: "Hualien County",
    aliases: ["花蓮", "花莲县", "Hualien", "Hualian"],
  },
  {
    key: "TAITUNG_COUNTY",
    nameZhTw: "臺東縣",
    nameEn: "Taitung County",
    aliases: ["台東縣", "臺東", "台東", "台东县", "Taitung", "Taidong"],
  },
  {
    key: "PENGHU_COUNTY",
    nameZhTw: "澎湖縣",
    nameEn: "Penghu County",
    aliases: ["澎湖", "Penghu", "澎湖县"],
  },
  {
    key: "KINMEN_COUNTY",
    nameZhTw: "金門縣",
    nameEn: "Kinmen County",
    aliases: ["金門", "金门县", "Kinmen", "Jinmen", "Quemoy"],
  },
  {
    key: "LIENCHIANG_COUNTY",
    nameZhTw: "連江縣",
    nameEn: "Lienchiang County",
    aliases: ["連江", "连江县", "Lienchiang", "Lianjiang County", "Matsu", "馬祖", "马祖"],
  },
  {
    key: "OTHER",
    nameZhTw: "其他地區",
    nameEn: "Other area",
    aliases: ["其他地区", "Other"],
  },
] as const;
export type TaiwanCityKey = (typeof TAIWAN_CITIES)[number]["key"];
const normalize = (value: string) => value.normalize("NFKC").trim().toLowerCase();
export function taiwanCity(value: string) {
  const text = normalize(value);
  return TAIWAN_CITIES.find((city) =>
    [city.key, city.nameEn, city.nameZhTw, ...city.aliases].some(
      (alias) => normalize(alias) === text,
    ),
  );
}
export function taiwanCityKey(value: string): TaiwanCityKey | null {
  return taiwanCity(value)?.key ?? null;
}
export function cityLabel(locale: Locale, value: string): string {
  const city = taiwanCity(value);
  return city ? (locale === "zh-TW" ? city.nameZhTw : city.nameEn) : value;
}
/** Unknown legacy text and Other have no location-comparison match. */
export function comparableCityKey(value: string): TaiwanCityKey | null {
  const key = taiwanCityKey(value);
  return key === "OTHER" ? null : key;
}

/** Preserve pre-migration comparison snapshots byte-for-byte while the city is unchanged.
 * Includes presentation/factor values as well as hashes: the quote panel compares full results.
 * A later city change never reuses the old value. Project rows and new-job input store keys. */
export function comparisonCityValue(stored: string, original: string | null | undefined): string {
  return original != null && taiwanCityKey(original) === stored ? original : stored;
}
