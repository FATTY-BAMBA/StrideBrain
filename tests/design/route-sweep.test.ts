import { readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { pageRoutes, pageDefects } from "./route-sweep";
it("names every page file in the HTTP sweep", () => {
  const files = readdirSync("src/app", { recursive: true })
    .map(String)
    .filter((file) => file.endsWith("page.tsx"))
    .sort();
  expect(Object.keys(pageRoutes).sort()).toEqual(files);
});
it("checks rendered content, not scripts or attributes", () => {
  expect(
    pageDefects(
      '<main><h1>Jobs</h1><script>COMMERCIAL_CATEGORIES</script><div data-code="COMMERCIAL_CATEGORIES">Ready</div></main>',
    ),
  ).toEqual([]);
  expect(
    pageDefects(
      '<main><h1>Jobs</h1><h1>Other</h1><section aria-label="same"></section><section aria-label="same"></section>COMMERCIAL_CATEGORIES NT$-0</main>',
    ),
  ).toEqual(["H1", "REGION_NAME", "RAW_CODE", "NEGATIVE_ZERO"]);
});

it("inspects a completed streamed page, not its loading fallback", () => {
  expect(
    pageDefects(
      '<main><!--$?--><template id="B:0"></template><h1>Loading</h1><!--/$--></main><div hidden id="S:0"><h1>Prices</h1></div><script>$RC("B:0","S:0")</script>',
    ),
  ).toEqual([]);
});
