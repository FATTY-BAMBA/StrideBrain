import { describe, expect, it } from "vitest";

import { catalogs, messageKeys } from "@/modules/localization/catalog";
import { supportedLocales } from "@/modules/localization/config";

describe("localization catalogs", () => {
  it("provide every approved key for every supported locale", () => {
    const expected = [...messageKeys].sort();

    for (const locale of supportedLocales) {
      expect(Object.keys(catalogs[locale]).sort()).toEqual(expected);
    }
  });

  it("do not contain empty critical messages", () => {
    for (const locale of supportedLocales) {
      for (const key of messageKeys) {
        expect(catalogs[locale][key].trim(), `${locale}:${key}`).not.toBe("");
      }
    }
  });
});
