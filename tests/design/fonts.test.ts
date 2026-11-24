import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "../../scripts/fonts/manifest.json";
describe("self-hosted app fonts", () => {
  it("pins every licensed font file by size and SHA-256", () => {
    for (const file of manifest.files) {
      const bytes = readFileSync(new URL(`../../public/fonts/${file.file}`, import.meta.url));
      expect(bytes.length).toBe(file.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(file.sha256);
    }
    for (const family of ["Inter", "Noto-Sans-TC"])
      expect(
        readFileSync(new URL(`../../public/fonts/${family}-OFL.txt`, import.meta.url), "utf8"),
      ).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });
  it("serves both families with swap, weight coverage and Unicode slices from our origin", () => {
    const css = readFileSync(new URL("../../src/styles/fonts.css", import.meta.url), "utf8");
    expect(css).not.toMatch(/https?:\/\/|@import/);
    expect(manifest.faces.filter((f) => f.family === "Noto Sans TC").length).toBeGreaterThan(1);
    for (const face of manifest.faces) {
      expect(face.weight).toBe("400 700");
      expect(face.unicodeRange).toMatch(/^U\+/);
      expect(css).toContain(`url("/fonts/${face.file}")`);
    }
    expect(css.match(/font-display: swap/g)?.length).toBe(manifest.faces.length);
  });
});
