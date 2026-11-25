/** Complete positive-length shared county borders derived from NLSC COUNTY_MOI_1090820.
 * Source: https://maps.nlsc.gov.tw/pro/download.jsp — 縣市界線(TWD97經緯度).
 * Government Open Data Licence v1.0. Each pair appears once; lookup is symmetric.
 * Islands sharing no land border and point-only contacts are not neighbours.
 * Source checksum and derivation: foundry/tasks/SB-073/evidence/county-borders.json. */
export const TAIWAN_CITY_BORDERS: readonly (readonly [string, string])[] = [
  ["CHANGHUA_COUNTY", "NANTOU_COUNTY"],
  ["CHANGHUA_COUNTY", "TAICHUNG_CITY"],
  ["CHANGHUA_COUNTY", "YUNLIN_COUNTY"],
  ["CHIAYI_CITY", "CHIAYI_COUNTY"],
  ["CHIAYI_COUNTY", "KAOHSIUNG_CITY"],
  ["CHIAYI_COUNTY", "NANTOU_COUNTY"],
  ["CHIAYI_COUNTY", "TAINAN_CITY"],
  ["CHIAYI_COUNTY", "YUNLIN_COUNTY"],
  ["HSINCHU_CITY", "HSINCHU_COUNTY"],
  ["HSINCHU_CITY", "MIAOLI_COUNTY"],
  ["HSINCHU_COUNTY", "MIAOLI_COUNTY"],
  ["HSINCHU_COUNTY", "TAICHUNG_CITY"],
  ["HSINCHU_COUNTY", "TAOYUAN_CITY"],
  ["HSINCHU_COUNTY", "YILAN_COUNTY"],
  ["HUALIEN_COUNTY", "KAOHSIUNG_CITY"],
  ["HUALIEN_COUNTY", "NANTOU_COUNTY"],
  ["HUALIEN_COUNTY", "TAICHUNG_CITY"],
  ["HUALIEN_COUNTY", "TAITUNG_COUNTY"],
  ["HUALIEN_COUNTY", "YILAN_COUNTY"],
  ["KAOHSIUNG_CITY", "NANTOU_COUNTY"],
  ["KAOHSIUNG_CITY", "PINGTUNG_COUNTY"],
  ["KAOHSIUNG_CITY", "TAINAN_CITY"],
  ["KAOHSIUNG_CITY", "TAITUNG_COUNTY"],
  ["KEELUNG_CITY", "NEW_TAIPEI_CITY"],
  ["MIAOLI_COUNTY", "TAICHUNG_CITY"],
  ["NANTOU_COUNTY", "TAICHUNG_CITY"],
  ["NANTOU_COUNTY", "YUNLIN_COUNTY"],
  ["NEW_TAIPEI_CITY", "TAIPEI_CITY"],
  ["NEW_TAIPEI_CITY", "TAOYUAN_CITY"],
  ["NEW_TAIPEI_CITY", "YILAN_COUNTY"],
  ["PINGTUNG_COUNTY", "TAITUNG_COUNTY"],
  ["TAICHUNG_CITY", "YILAN_COUNTY"],
  ["TAOYUAN_CITY", "YILAN_COUNTY"],
];
const pairs = new Set(TAIWAN_CITY_BORDERS.map((pair) => [...pair].sort().join("|")));
export function citiesShareBorder(left: string, right: string): boolean {
  return pairs.has([left, right].sort().join("|"));
}
