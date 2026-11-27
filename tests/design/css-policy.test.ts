import { describe, expect, it } from "vitest";
import { countViolations, compareCounts } from "../../scripts/design/css-policy";
import { checkDesignTokens } from "../../scripts/check-design-tokens";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
describe("CSS design-token gate", () => {
  it("detects raw colours, font sizes and radii, including functions and longhands", () => {
    expect(
      countViolations(
        ".a {color: #123456; background: linear-gradient(rgb(1 2 3), white); font-size: 1rem; border-top-left-radius: 0; border-radius: 6px 10px;}",
      ),
    ).toEqual({ color: 3, fontSize: 1, radius: 2 });
  });
  it("ignores comments, strings, selectors, URLs and variable names but checks fallbacks", () => {
    expect(
      countViolations(
        '/* color: red; */ #abcdef:hover {content: "red; font-size: 8px;"; background-image:url("data:image/svg+xml;#abcdef");color:var(--red);border-radius:var(--radius-control);font-size:var(--text-body);border:1px solid var(--line, #fff);}',
      ),
    ).toEqual({ color: 1, fontSize: 0, radius: 0 });
  });
  it("counts nested declarations and refuses font-size literals inside calc", () => {
    expect(
      countViolations(
        "@media (width < 800px) {.a {color: oklch(40% .2 1); font-size: calc(var(--text-body) + 2px);border-radius:var(--a) var(--b);}}",
      ),
    ).toEqual({ color: 1, fontSize: 1, radius: 0 });
  });
  it("gives every file zero allowance", () => {
    expect(compareCounts("old.css", { color: 1, fontSize: 0, radius: 0 })).toHaveLength(1);
  });
  it("fails an added raw colour in a CSS module with that file's name", () => {
    const root = mkdtempSync(join(tmpdir(), "design-policy-"));
    try {
      mkdirSync(join(root, "src/styles"), { recursive: true });
      mkdirSync(join(root, "scripts/design"), { recursive: true });
      writeFileSync(join(root, "src/probe.module.css"), ".probe { color: #123456; }");
      expect(checkDesignTokens(root)[0]).toContain("src/probe.module.css: color");
      writeFileSync(join(root, "src/probe.module.css"), ".probe { color: var(--ink); }");
      expect(checkDesignTokens(root)).toEqual([]);
      writeFileSync(join(root, "src/probe.module.css"), ".probe { --legacy-bypass: var(--ink); }");
      expect(checkDesignTokens(root)[0]).toContain("legacy custom properties");
      writeFileSync(join(root, "src/probe.module.css"), ".probe { color: var(--ink); }");
      for (const property of ["color", "background", "border-color", "--alias"]) {
        writeFileSync(join(root, "src/probe.module.css"), `.probe { ${property}: var(--focus); }`);
        expect(checkDesignTokens(root)[0]).toContain("--focus is allowed only in outline");
      }
      writeFileSync(
        join(root, "src/probe.module.css"),
        ".probe {outline:var(--focus-width) solid var(--focus);outline-offset:var(--focus-offset);}",
      );
      expect(checkDesignTokens(root)).toEqual([]);
      writeFileSync(join(root, "src/styles/tokens.css"), ".escape {color: #123456;}");
      expect(checkDesignTokens(root)[0]).toContain("only token declarations");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
