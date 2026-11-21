import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateJobReference } from "@/lib/server/job-reference";

const { randomInt } = vi.hoisted(() => ({ randomInt: vi.fn<(max: number) => number>() }));
vi.mock("node:crypto", () => ({ randomInt }));

beforeEach(() => randomInt.mockReset().mockReturnValue(0));

describe("Server-generated job references", () => {
  it("formats the short editable reference with four independently selected characters", () => {
    randomInt
      .mockReturnValueOnce(8)
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(17)
      .mockReturnValueOnce(1);
    expect(generateJobReference(new Date("2026-11-21T12:00:00Z"))).toBe("J-2611-A7K3");
    expect(randomInt).toHaveBeenCalledTimes(4);
    expect(randomInt).toHaveBeenCalledWith(31);
  });

  it.each([
    ["2026-11-30T23:59:59.999Z", "2611"],
    ["2026-12-01T00:00:00Z", "2612"],
    ["2026-12-31T23:59:59.999Z", "2612"],
    ["2027-01-01T00:00:00Z", "2701"],
    ["2000-01-01T00:00:00Z", "0001"],
    ["2026-12-01T00:30:00+08:00", "2611"],
  ])("uses the zero-padded UTC month for %s", (date, month) => {
    expect(generateJobReference(new Date(date))).toBe(`J-${month}-2222`);
  });

  it("excludes look-alikes across the entire suffix alphabet", () => {
    const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    for (let index = 0; index < alphabet.length; index++) {
      randomInt.mockReturnValue(index);
      const suffix = generateJobReference(new Date("2026-11-21T00:00:00Z")).split("-")[2]!;
      expect(suffix).toBe(alphabet[index]!.repeat(4));
      expect(suffix).not.toMatch(/[0O1IL]/);
    }
  });

  it("uses the current server date when no date is supplied", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-21T00:00:00Z"));
      expect(generateJobReference()).toBe("J-2611-2222");
    } finally {
      vi.useRealTimers();
    }
  });
});
