import { expect, it } from "vitest";
import { missingContextLabel } from "@/modules/localization/comparison-fields";
import { durationLabel } from "@/modules/localization/duration";
it.each(["en", "zh-TW"] as const)(
  "labels all known and unknown missing fields without raw codes (%s)",
  (locale) => {
    for (const field of [
      "COMPARISON_CLASS",
      "SUBTYPE",
      "AREA",
      "AREA_UNIT",
      "CURRENCY",
      "SCOPE_CATEGORIES",
      "COMMERCIAL_CATEGORIES",
      "LOCATION_CITY",
      "METADATA_AUTHORITY",
      "SNAPSHOT_DATE",
      "UNKNOWN_CODE",
    ])
      expect(missingContextLabel(locale, field)).not.toMatch(/[A-Z]{3,}_[A-Z_]{2,}/);
    expect(missingContextLabel(locale, "COMMERCIAL_CATEGORIES")).toBe(
      locale === "en" ? "Pricing categories" : "報價類別",
    );
    expect(durationLabel(2500, locale)).toBe(locale === "en" ? "2.5 s" : "2.5 秒");
  },
);
