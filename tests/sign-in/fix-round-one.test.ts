import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it, expect } from "vitest";
import { googleMailboxAuthority } from "@/modules/sign-in/domain/google-mailbox";
import { roleDescription, peopleConfirmation } from "@/modules/localization/people";
import { parsePeopleChange } from "@/modules/people/domain/policy";

describe("round one identity rules", () => {
  it.each([
    ["person@gmail.com", undefined, true],
    ["person@googlemail.com", undefined, true],
    ["person@example.invalid", "example.invalid", true],
    ["person@example.invalid", undefined, false],
    ["person@gmail.com.evil.invalid", undefined, false],
  ])("Google mailbox authority for %s / %s", (email, hd, expected) => {
    expect(googleMailboxAuthority({ email, hd, email_verified: true })).toBe(expected);
    expect(googleMailboxAuthority({ email, hd, email_verified: false })).toBe(false);
  });
  it("every non-public locale page calls the identity gate", () => {
    const root = "src/app/[locale]";
    const publicPages = new Set([
      "sign-in/page.tsx",
      "sign-in/complete/page.tsx",
      "no-access/page.tsx",
      "choose-firm/page.tsx",
      "preview/page.tsx",
    ]);
    const pages: string[] = [];
    function walk(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name === "page.tsx") pages.push(path);
      }
    }
    walk(root);
    expect(pages.length).toBeGreaterThan(5);
    for (const path of pages)
      if (!publicPages.has(relative(root, path)))
        expect(readFileSync(path, "utf8"), path).toMatch(/await requirePageIdentity\(\)/);
    expect(pages.filter((path) => publicPages.has(relative(root, path)))).toHaveLength(5);
  });
  it("atomic edits require name, role and assignments together", () => {
    const update = {
      operation: "update",
      membershipId: "synthetic",
      name: "Synthetic",
      role: "VIEWER",
      assignments: [],
      idempotencyKey: "synthetic-update-key-001",
    };
    expect(parsePeopleChange(update)).toEqual(update);
    for (const key of ["name", "role", "assignments"])
      expect(parsePeopleChange({ ...update, [key]: undefined })).toBeNull();
  });
  it("role sentences derive their words from capabilities, including the Viewer exclusion", () => {
    expect(roleDescription("en", "VIEWER")).toBe("Can: open jobs. Cannot see quotes or amounts.");
    expect(roleDescription("zh-TW", "VIEWER")).toBe("可以：開啟專案。看不到報價與金額。");
    expect(roleDescription("en", "ORGANIZATION_ADMIN")).toContain("see quotes and amounts");
    expect(roleDescription("zh-TW", "ORGANIZATION_ADMIN")).toContain("查看實際成本（依專案勾選）");
    expect(peopleConfirmation("en", "deactivate", "Synthetic Person")).toBe(
      "Deactivate Synthetic Person? They lose access at once. What they created stays.",
    );
    expect(peopleConfirmation("zh-TW", "cancel", "範例成員")).toBe("取消對範例成員的邀請？");
  });
});
