import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, it } from "vitest";
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)],
  );
}
it("keeps runtime findings independent of a named fixture or favored category", () => {
  const violations: string[] = [];
  for (const path of files("src")) {
    const name = relative("src", path).replaceAll("\\", "/");
    if (name.startsWith("modules/preview-session/")) continue; // Temporary exemption until SB-042.
    const text = readFileSync(path, "utf8");
    if (/XINYI_|Xinyi Flagship|Horizon Atelier/.test(text)) violations.push(name);
    if (
      name !== "modules/projects/domain/job-input.ts" &&
      !name.startsWith("modules/localization/") &&
      /["'](?:IMPORTED_STONE|LIGHTING_ELECTRICAL)["']/.test(text)
    )
      violations.push(name);
  }
  expect(violations).toEqual([]);
});
