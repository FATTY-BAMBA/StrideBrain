import { describe, expect, it } from "vitest";
import { normalizeSignInEmail, sameSiteReturn, signInMode } from "@/modules/sign-in/domain/policy";
import { guardEmail, signInCounterKey } from "@/modules/sign-in/application/email-guard";

describe("sign-in boundary", () => {
  it("defaults to the unchanged demo mode, but production refuses it", () => {
    expect(signInMode({})).toBe("demo");
    for (const mode of [undefined, "demo", "both", "invalid"])
      expect(() =>
        signInMode({ NEXT_PUBLIC_STRIDEBRAIN_ENV: "production", STRIDEBRAIN_SIGN_IN_MODE: mode }),
      ).toThrow();
    expect(
      signInMode({ NEXT_PUBLIC_STRIDEBRAIN_ENV: "production", STRIDEBRAIN_SIGN_IN_MODE: "real" }),
    ).toBe("real");
  });
  it("only returns to app paths on this site", () => {
    for (const path of [
      "https://evil.invalid",
      "//evil.invalid",
      "/\\evil.invalid",
      "/%2f%2fevil.invalid",
      "/en/sign-in",
      "/api/auth",
      "/en/%0aevil",
    ])
      expect(sameSiteReturn(path, "zh-TW")).toBe("/zh-TW");
    expect(sameSiteReturn("/en/projects/J-2611-A7K3/quote?version=2", "en")).toBe(
      "/en/projects/J-2611-A7K3/quote?version=2",
    );
  });
  it("normalizes case/whitespace without Gmail-style alias guessing", () => {
    expect(normalizeSignInEmail(" Sample+tag@EXAMPLE.invalid ")).toBe("sample+tag@example.invalid");
  });
  it("keys counters without email and separates operations and secrets", async () => {
    const keys: string[] = [];
    const counter = {
      consume: async (key: string) => {
        keys.push(key);
        return true;
      },
    };
    await guardEmail(counter, "secret", "request", " Sample@EXAMPLE.invalid ");
    await guardEmail(counter, "secret", "request", "sample@example.invalid");
    expect(keys[0]).toBe(keys[1]);
    expect(keys[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(signInCounterKey("secret", "entry", "sample@example.invalid")).not.toBe(keys[0]);
    expect(signInCounterKey("other", "request", "sample@example.invalid")).not.toBe(keys[0]);
  });
  it("fails closed on counter failure", async () => {
    await expect(
      guardEmail(
        {
          consume: async () => {
            throw new Error("unavailable");
          },
        },
        "secret",
        "request",
        "sample@example.invalid",
      ),
    ).rejects.toThrow("unavailable");
  });
});
