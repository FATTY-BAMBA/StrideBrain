// Evidence tooling only: requires a locally installed Playwright; never a repository dependency.
// Supply a private local session file and PLAYWRIGHT_MODULE. Never use a hosted URL.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const config = JSON.parse(readFileSync(process.env.SB077_SESSION_FILE));
const phase = process.argv[2] ?? "before",
  origin = "http://localhost:3477";
const routes = [
  ["home", ""],
  ["projects", "/projects"],
  ["new-job", "/projects/new"],
  ["overview", "/projects/PRJ-XINYI-026"],
  ["actions", "/projects/PRJ-XINYI-026/actions"],
  ["decisions", "/decisions"],
];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const selection = process.env.SB077_CAPTURE_FILTER;
const records = selection
  ? JSON.parse(readFileSync(`foundry/tasks/SB-077/evidence/${phase}/inspection.json`)).filter(
      (r) => !new RegExp(selection).test(`${r.role}-${r.screen}`),
    )
  : [];
mkdirSync(`foundry/tasks/SB-077/evidence/${phase}`, { recursive: true });
try {
  for (const role of ["owner", "viewer"])
    for (const locale of ["zh-TW", "en"])
      for (const width of [1440, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 } });
        await context.addCookies([
          {
            name: "__Host-stridebrain_demo_session",
            value: config.cookies[role],
            domain: "localhost",
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "Lax",
          },
        ]);
        const page = await context.newPage();
        for (const [screen, route] of routes) {
          if (role === "viewer" && screen === "new-job") continue;
          if (selection && !new RegExp(selection).test(`${role}-${screen}`)) continue;
          const response = await page.goto(origin + "/" + locale + route, {
            waitUntil: "networkidle",
            timeout: 90000,
          });
          await page.evaluate(() => document.fonts.ready);
          await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
          const focus = [];
          for (let i = 0; i < 500; i++) {
            await page.keyboard.press("Tab");
            const f = await page.evaluate(() => {
              const e = document.activeElement,
                s = getComputedStyle(e);
              return {
                tag: e.tagName,
                text: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 100),
                outline: s.outlineStyle,
                width: s.outlineWidth,
              };
            });
            focus.push(f);
            if ((i > 0 && f.text.includes("Skip to main")) || (i > 0 && f.text === "跳至主要內容"))
              break;
          }
          await page.locator("main").focus();
          await page.keyboard.press("Tab");
          await page.evaluate(() => {
            window.scrollTo(0, 0);
            document.querySelectorAll('[role="region"]').forEach((e) => (e.scrollLeft = 0));
          });
          const file = `${role}-${locale}-${screen}-${width}.png`;
          await page.screenshot({
            path: `foundry/tasks/SB-077/evidence/${phase}/${file}`,
            fullPage: true,
          });
          records.push({
            role,
            locale,
            width,
            screen,
            status: response.status(),
            file,
            focus,
            overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            h1: await page.locator("h1").count(),
          });
        }
        await context.close();
      }
} finally {
  await browser.close();
  writeFileSync(
    `foundry/tasks/SB-077/evidence/${phase}/inspection.json`,
    JSON.stringify(records, null, 2) + "\n",
  );
}
