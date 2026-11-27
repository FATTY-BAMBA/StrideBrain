import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, relative, join } from "node:path";
import { compareCounts, countViolations, declarations } from "./design/css-policy.ts";
const root = fileURLToPath(new URL("../", import.meta.url));
const tokenFile = "src/styles/tokens.css";
export function checkDesignTokens(directory = root): string[] {
  const errors: string[] = [];
  function visit(path: string) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && file.endsWith(".css")) {
        const name = relative(directory, file).split("\\").join("/");
        const css = readFileSync(file, "utf8");
        if (
          declarations(css).some(
            ({ property, value }) => property.startsWith("--legacy-") || /--legacy-/.test(value),
          )
        )
          errors.push(`${name}: legacy custom properties are forbidden.`);
        if (name === tokenFile) {
          if (declarations(css).some(({ property }) => !property.startsWith("--")))
            errors.push(`${name}: only token declarations are allowed.`);
        } else errors.push(...compareCounts(name, countViolations(css)));
      }
    }
  }
  visit(join(directory, "src"));
  return errors;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkDesignTokens();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else console.log("Design tokens: no raw values or legacy custom properties.");
}
