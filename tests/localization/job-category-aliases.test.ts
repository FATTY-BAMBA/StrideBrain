import { seededFirmLists } from "@/fixtures/firm-lists";
import { expect, it } from "vitest";
import { categoryLabel, mentionedCategory } from "@/modules/localization/jobs";
it.each([
  ["SELECTIVE_DEMOLITION", "selective demolition", "選擇性拆除"],
  ["PARTITIONS_CEILINGS", "partitions", "天花"],
  ["DEMOLITION_CEILING", "demolition", "拆除"],
  ["CUSTOM_MILLWORK", "millwork", "木作"],
  ["LIGHTING_ELECTRICAL", "electrical", "電氣"],
  ["IMPORTED_STONE", "stone", "石材"],
  ["SIGNAGE", "signage", "招牌"],
  ["COORDINATION", "handover", "協調"],
])("recognizes labels and bilingual aliases for %s", (id, en, zh) => {
  expect(
    mentionedCategory(
      `What supports the ${en.toUpperCase()} quote?`,
      seededFirmLists.workCategories,
    ),
  ).toBe(id);
  expect(mentionedCategory(`${zh}的報價有哪些差異？`, seededFirmLists.workCategories)).toBe(id);
  for (const locale of ["en", "zh-TW"] as const)
    expect(
      mentionedCategory(
        categoryLabel(locale, id, seededFirmLists.workCategories),
        seededFirmLists.workCategories,
      ),
    ).toBe(id);
});
it.each(["milestone", "stonework", "electrically", "signages", "precoordination"])(
  "does not match an alias inside %s",
  (word) => {
    expect(
      mentionedCategory(`What about ${word} in the quote?`, seededFirmLists.workCategories),
    ).toBeUndefined();
  },
);
it("matches punctuation-delimited Latin words", () => {
  expect(mentionedCategory('Evidence for "stone"?', seededFirmLists.workCategories)).toBe(
    "IMPORTED_STONE",
  );
});
