import { expect, it } from "vitest";
import {
  organizationDate,
  addDays,
  isDate,
  completeFirm,
  missingFirmFields,
  stageAfterAcceptance,
} from "@/modules/quote-issue/domain/issue-policy";
import { emptyFirmDetails } from "@/modules/quote-issue/domain/contracts";
import { firmDetails, issueOptions } from "@/modules/quote-issue/domain/input";
import { SignedQuoteIssueCodec } from "@/modules/quote-issue/application/issue-codec";
import type { IssuePreparation } from "@/modules/quote-issue/domain/contracts";
it("uses the organization's date across midnight and calendar-valid expiry dates", () => {
  expect(organizationDate(new Date("2026-11-22T17:00:00Z"), "Asia/Taipei")).toBe("2026-11-23");
  expect(addDays("2026-12-22", 30)).toBe("2027-01-21");
  expect(isDate("2026-02-29")).toBe(false);
  expect(isDate("2028-02-29")).toBe(true);
  expect(completeFirm(emptyFirmDetails, "zh-TW")).toBe(false);
});
it("bounds settings and issue options, allows incomplete settings but no invalid tax id", () => {
  expect(firmDetails(emptyFirmDetails)).toEqual(emptyFirmDetails);
  for (const taxId of ["1234567", "123456789", "abcdefgh"])
    expect(firmDetails({ ...emptyFirmDetails, taxId })).toBeNull();
  expect(firmDetails({ ...emptyFirmDetails, defaultValidityDays: 0 })).toBeNull();
  expect(firmDetails({ ...emptyFirmDetails, defaultValidityDays: 366 })).toBeNull();
  expect(issueOptions({ language: "zh-TW", attention: "", validUntil: "2026-02-29" })).toBeNull();
  expect(issueOptions({ language: "en", attention: "", totals: {} })).toBeNull();
  expect(issueOptions({ language: "en", attention: "a".repeat(201) })).toBeNull();
});
it("expires and authenticates a preparation and separates it from other signed operations", () => {
  let now = new Date("2026-11-22T00:00:00Z");
  const codec = new SignedQuoteIssueCodec(
    "synthetic-test-secret-with-more-than-32-bytes",
    () => now,
  );
  const value = { preparedAt: now.toISOString() } as IssuePreparation;
  const token = codec.seal(value);
  expect(codec.open(token)).toEqual(value);
  expect(codec.open(`x${token}`)).toBeNull();
  now = new Date("2026-11-22T00:16:00Z");
  expect(codec.open(token)).toBeNull();
});

it.each([
  ["DISCOVERY", "APPROVED"],
  ["DESIGN", "APPROVED"],
  ["QUOTE_REVIEW", "APPROVED"],
  ["APPROVED", "APPROVED"],
  ["PROCUREMENT", "PROCUREMENT"],
  ["CONSTRUCTION", "CONSTRUCTION"],
  ["HANDOVER", "HANDOVER"],
  ["COMPLETE", "COMPLETE"],
])("acceptance changes %s only to %s", (previous, next) => {
  expect(stageAfterAcceptance(previous)).toBe(next);
});
it("requires only the document language's legal name/address plus an eight-digit tax id and phone", () => {
  const zh = {
    ...emptyFirmDetails,
    legalNameZhTw: "合成公司",
    addressZhTw: "合成地址",
    taxId: "00000000",
    phone: "02-0000-0000",
  };
  expect(completeFirm(zh, "zh-TW")).toBe(true);
  expect(missingFirmFields(zh, "en")).toEqual(["legalNameEn", "addressEn"]);
  const en = {
    ...emptyFirmDetails,
    legalNameEn: "Synthetic firm",
    addressEn: "Synthetic address",
    taxId: zh.taxId,
    phone: zh.phone,
  };
  expect(completeFirm(en, "en")).toBe(true);
  expect(missingFirmFields(en, "zh-TW")).toEqual(["legalNameZhTw", "addressZhTw"]);
  for (const taxId of ["", "1234567", "123456789", "abcdefgh"])
    expect(missingFirmFields({ ...zh, taxId }, "zh-TW")).toEqual(["taxId"]);
  expect(missingFirmFields({ ...zh, phone: "  " }, "zh-TW")).toEqual(["phone"]);
  expect(missingFirmFields(null, "zh-TW")).toEqual([
    "legalNameZhTw",
    "taxId",
    "addressZhTw",
    "phone",
  ]);
});
