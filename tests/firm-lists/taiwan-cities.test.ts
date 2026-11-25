import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  TAIWAN_CITIES,
  taiwanCityKey,
  cityLabel,
  comparisonCityValue,
} from "@/modules/projects/domain/taiwan-cities";
import { locationSimilarity } from "@/modules/comparisons/domain/similarity-policy";
import {
  TAIWAN_CITY_BORDERS,
  citiesShareBorder,
} from "@/modules/comparisons/domain/taiwan-city-neighbours";
import { supportJobDraft, draftFields } from "@/modules/assistant/domain/job-draft";
import { seededFirmLists } from "@/fixtures/firm-lists";
import { projectLocationLabel } from "@/modules/localization/project-context";
const empty = () =>
  Object.fromEntries(draftFields.map((key) => [key, key === "scopeCategoryIds" ? [] : null]));
const quote = (value: string) => ({ value, quote: value });
describe("Taiwan cities and county borders", () => {
  it("has 22 cities/counties plus Other and resolves every unambiguous spelling", () => {
    expect(TAIWAN_CITIES).toHaveLength(23);
    const aliases = new Map<string, string>();
    for (const city of TAIWAN_CITIES)
      for (const alias of [city.key, city.nameEn, city.nameZhTw, ...city.aliases]) {
        const normalized = alias.normalize("NFKC").toLowerCase();
        expect(aliases.get(normalized) ?? city.key).toBe(city.key);
        aliases.set(normalized, city.key);
        expect(taiwanCityKey(` ${alias.toUpperCase()} `)).toBe(city.key);
      }
    for (const text of ["台北市", "臺北市", "Taipei", "Taipei City"])
      expect(taiwanCityKey(text)).toBe("TAIPEI_CITY");
    for (const unknown of ["Hsinchu", "Chiayi", "Unknown place", ""])
      expect(taiwanCityKey(unknown)).toBeNull();
    expect(cityLabel("en", "TAICHUNG_CITY")).toBe("Taichung City");
    expect(cityLabel("zh-TW", "TAICHUNG_CITY")).toBe("臺中市");
    expect(cityLabel("zh-TW", "Unknown place")).toBe("Unknown place");
    expect(projectLocationLabel("zh-TW", { city: "TAIPEI_CITY", district: "Xinyi District" })).toBe(
      "臺北市信義區",
    );
  });
  it("matches the 33 official shared borders symmetrically, with no island or self border", () => {
    const source = JSON.parse(
      readFileSync("foundry/tasks/SB-073/evidence/county-borders.json", "utf8"),
    ) as { pairs: [string, string][] };
    const expected = source.pairs
      .map((pair) =>
        pair
          .map((name) => taiwanCityKey(name)!)
          .sort()
          .join("|"),
      )
      .sort();
    expect(TAIWAN_CITY_BORDERS.map((pair) => [...pair].sort().join("|")).sort()).toEqual(expected);
    expect(new Set(expected).size).toBe(33);
    for (const left of TAIWAN_CITIES)
      for (const right of TAIWAN_CITIES) {
        expect(citiesShareBorder(left.key, right.key)).toBe(citiesShareBorder(right.key, left.key));
        if (
          left === right ||
          [left.key, right.key].some((key) =>
            ["OTHER", "PENGHU_COUNTY", "KINMEN_COUNTY", "LIENCHIANG_COUNTY"].includes(key),
          )
        )
          expect(citiesShareBorder(left.key, right.key)).toBe(false);
      }
  });
  it("keeps the scoring scale, canonicalizes aliases and never matches unknown legacy text", () => {
    const at = (city: string, district?: string) => ({ city, district });
    expect(locationSimilarity(at("台北市", "信義區"), at("Taipei City", "信義區"))).toBe(1);
    expect(locationSimilarity(at("TAIPEI_CITY"), at("臺北市"))).toBe(0.6);
    expect(locationSimilarity(at("台北市"), at("新北市"))).toBe(0.3);
    expect(locationSimilarity(at("台中市"), at("彰化縣"))).toBe(0.3);
    expect(locationSimilarity(at("台北市"), at("高雄市"))).toBe(0);
    for (const city of ["OTHER", "Unknown place", ""])
      expect(locationSimilarity(at(city, "same"), at(city, "same"))).toBe(0);
  });
  it("carries old comparison values only while their stored canonical city is unchanged", () => {
    expect(comparisonCityValue("TAIPEI_CITY", "台北市")).toBe("台北市");
    expect(comparisonCityValue("TAICHUNG_CITY", "台北市")).toBe("TAICHUNG_CITY");
    expect(comparisonCityValue("TAIPEI_CITY", null)).toBe("TAIPEI_CITY");
  });
  it("keeps city, client, district and area when the job type is not on the firm's list", () => {
    const text = "幫測試客戶甲在台北市大安區做一間 30 坪的住宅裝修";
    const result = supportJobDraft(
      text,
      {
        ...empty(),
        name: quote("住宅裝修"),
        clientName: quote("測試客戶甲"),
        locationCity: quote("台北市"),
        locationDistrict: quote("大安區"),
        subtype: { value: "RESIDENTIAL", quote: "住宅裝修" },
        area: { digits: "30", unit: "坪", quote: "30 坪" },
      },
      seededFirmLists,
    );
    expect(result?.values).toEqual({
      name: "住宅裝修",
      clientName: "測試客戶甲",
      locationCity: "TAIPEI_CITY",
      locationDistrict: "大安區",
      areaQuantity: "99.174",
    });
    expect(result?.dropped).toContain("subtype");
    expect(
      supportJobDraft("信義區", { ...empty(), locationCity: quote("台北市") }, seededFirmLists)
        ?.values.locationCity,
    ).toBeUndefined();
    expect(
      supportJobDraft(
        "台北市",
        { ...empty(), locationCity: { value: "Taipei City", quote: "台北市" } },
        seededFirmLists,
      )?.values.locationCity,
    ).toBeUndefined();
  });
});
