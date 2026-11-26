// Local presentation replay only. No provider call or production-route fixture.
import { readFileSync, writeFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const config = JSON.parse(readFileSync(process.env.SB077_SESSION_FILE));
const phase = process.argv[2] || "after",
  origin = phase === "before" ? "http://localhost:3478" : "http://localhost:3477";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const locale of ["zh-TW", "en"])
    for (const width of [1440, 390])
      for (const surface of ["home", "job"]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 } });
        await context.addCookies([
          {
            name: "__Host-stridebrain_demo_session",
            value: config.cookies.owner,
            domain: "localhost",
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "Lax",
          },
        ]);
        const page = await context.newPage();
        const label = locale === "en" ? "Findings" : "比較結果";
        const sentences =
          locale === "en"
            ? [
                "Lighting and electrical: quoted price is 9.4% above past quoted prices.",
                "Imported stone and hard finishes: forecast cost is 43.0% above past reconciled actual costs.",
              ]
            : [
                "照明與電氣：報價比過往報價高 9.4%",
                "進口石材與硬質面材：預估成本比過往已核對實際成本高 43.0%",
              ];
        const presentation = {
          version: 1,
          locale,
          blocks: [
            {
              kind: "CARD",
              key: "comparison",
              title: locale === "en" ? "Active Design Project 03" : "進行中設計專案03",
              reference: "PRJ-ACTIVE-003",
              rows: sentences.map((value, i) => ({
                ref: "finding" + i,
                sourceId: "synthetic",
                path: "findings." + i,
                label,
                value,
              })),
              link: {
                href: `/${locale}/projects/PRJ-ACTIVE-003/compare`,
                label: locale === "en" ? "Open comparison" : "開啟比較",
              },
            },
          ],
        };
        await page.route("**/*", async (route) => {
          if (route.request().method() !== "POST" || !route.request().headers()["next-action"])
            return route.continue();
          // React action envelope; interception stays in this browser, not in app code.
          const state = {
            turns: [
              {
                id: "user-1",
                role: "user",
                text: locale === "en" ? "Show saved findings." : "顯示已儲存的比較結果。",
              },
              {
                id: "assistant-2",
                role: "assistant",
                text: sentences.join("\n"),
                ai: true,
                aiPresentation: presentation,
                aiSources: [],
              },
            ],
            context: {},
          };
          await route.fulfill({
            status: 200,
            contentType: "text/x-component",
            body: '0:{"a":"$@1","f":"","b":"development"}\n1:' + JSON.stringify(state) + "\n",
          });
        });
        await page.goto(
          origin + "/" + locale + (surface === "job" ? "/projects/PRJ-ACTIVE-003" : ""),
          { waitUntil: "networkidle" },
        );
        await page.addStyleTag({ content: "nextjs-portal { display:none !important; }" });
        if (surface === "job")
          await page
            .getByRole("button", {
              name: locale === "en" ? "Ask about this job" : "詢問這個專案",
              exact: true,
            })
            .click();
        await page
          .locator('textarea[name="message"]')
          .fill(locale === "en" ? "Show saved findings." : "顯示已儲存的比較結果。");
        await page
          .getByRole("button", { name: locale === "en" ? "Ask" : "提問", exact: true })
          .click();
        await page.getByText(sentences[0], { exact: true }).waitFor();
        await page
          .locator("section footer a")
          .filter({ hasText: locale === "en" ? "Open comparison" : "開啟比較" })
          .first()
          .focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        await page.evaluate(() => {
          window.scrollTo(0, 0);
          document.querySelectorAll('[role="region"]').forEach((e) => (e.scrollLeft = 0));
        });
        await page.waitForTimeout(250);
        await page.screenshot({
          path: `foundry/tasks/SB-077/evidence/${phase}/owner-${locale}-answer-${surface}-${width}.png`,
          fullPage: true,
        });
        checks.push({
          locale,
          width,
          surface,
          labels: await page.locator("dt").filter({ hasText: label }).count(),
          sentences: await page.locator("dd").allTextContents(),
          overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        });
        await context.close();
      }
} finally {
  await browser.close();
  writeFileSync(
    `foundry/tasks/SB-077/evidence/${phase}/answer-inspection.json`,
    JSON.stringify(checks, null, 2),
  );
}
