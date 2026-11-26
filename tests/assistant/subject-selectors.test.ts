import { describe, it, expect } from "vitest";
import {
  identityMention,
  namedProjects,
  mentionsUnreadableIdentity,
} from "@/modules/assistant/domain/subjects";
const visible = [{ projectKey: "PRJ-XINYI-026", names: ["Xinyi flagship", "信義旗艦店裝修"] }];
describe("exact server identity matching", () => {
  it.each(["prj-xinyi-026 status?", "XINYI FLAGSHIP total?", "信義旗艦店裝修目前在哪個階段？"])(
    "matches the complete identity: %s",
    (text) => {
      expect(namedProjects(text, visible)).toEqual(visible);
    },
  );
  it.each(["026?", "PRJ-XINYI-026-extra?", "Xinyi?", "What stage is this job in?"])(
    "does not interpret fragments or ordinary wording: %s",
    (text) => {
      expect(namedProjects(text, visible)).toEqual([]);
    },
  );
  it("preserves the question's letter case", () => {
    expect(identityMention("XINYI FLAGSHIP total?", "Xinyi flagship")).toBe("XINYI FLAGSHIP");
  });
});

describe("unreadable identity occurrence containment", () => {
  it.each([
    ["信義旗艦店裝修二期的報價？", ["信義旗艦店裝修二期"], ["信義旗艦店裝修"], false],
    ["信義旗艦店裝修二期的報價？", ["信義旗艦店裝修"], ["信義旗艦店裝修二期"], true],
    [
      "信義旗艦店裝修二期，以及信義旗艦店裝修的報價？",
      ["信義旗艦店裝修二期"],
      ["信義旗艦店裝修"],
      true,
    ],
    ["信義旗艦店裝修二期和信義旗艦店裝修二期", ["信義旗艦店裝修二期"], ["信義旗艦店裝修"], false],
    ["XINYI FLAGSHIP PHASE TWO status?", ["Xinyi flagship phase two"], ["Xinyi flagship"], false],
    ["Xinyi flagship phase two status?", ["Xinyi flagship"], ["Xinyi flagship phase two"], true],
    [
      "Xinyi flagship phase two and Xinyi flagship?",
      ["Xinyi flagship phase two"],
      ["Xinyi flagship"],
      true,
    ],
    ["PRJ-ACTIVE-002?", ["PRJ-ACTIVE-001"], ["PRJ-ACTIVE-002"], true],
    ["PRJ-ACTIVE-002-extra?", ["PRJ-ACTIVE-001"], ["PRJ-ACTIVE-002"], false],
  ])("checks every complete occurrence: %s", (question, readable, unreadable, denied) => {
    expect(mentionsUnreadableIdentity(question, readable, unreadable)).toBe(denied);
  });
});
