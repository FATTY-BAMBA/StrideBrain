// Local Chrome only; explicitly no JavaScript for the menu check.
import { readFileSync, writeFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE),
  c = JSON.parse(readFileSync(process.env.SB077_SESSION_FILE));
const b = await chromium.launch({ channel: "chrome", headless: true }),
  checks = [];
try {
  for (const locale of ["en", "zh-TW"]) {
    const ctx = await b.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 1000 },
    });
    await ctx.addCookies([
      {
        name: "__Host-stridebrain_demo_session",
        value: c.cookies.owner,
        domain: "localhost",
        path: "/",
        secure: true,
      },
    ]);
    const p = await ctx.newPage();
    await p.goto("http://localhost:3477/" + locale);
    await p.locator("details").first().locator("summary").click();
    await p.keyboard.press("Tab");
    await p.screenshot({
      path: `foundry/tasks/SB-077/evidence/after/owner-${locale}-menu-no-js-390.png`,
      fullPage: true,
    });
    checks.push({
      locale,
      open: (await p.locator("details").first().getAttribute("open")) !== null,
      navigationVisible: await p.locator("details nav").isVisible(),
      firmVisible: await p
        .getByText(locale === "en" ? "Horizon Atelier" : "禾序空間設計", { exact: true })
        .filter({ visible: true })
        .count(),
      settings: await p.locator('details a[href$="/settings"]').isVisible(),
    });
    await ctx.close();
  }
  const ctx = await b.newContext({ viewport: { width: 390, height: 1000 } });
  await ctx.addCookies([
    {
      name: "__Host-stridebrain_demo_session",
      value: c.cookies.viewer,
      domain: "localhost",
      path: "/",
      secure: true,
    },
  ]);
  const p = await ctx.newPage();
  for (const locale of ["en", "zh-TW"]) {
    const texts = [];
    for (const key of [
      "nothing-here",
      "projects/NO-SUCH-JOB",
      "projects/PRJ-ACTIVE-003",
      "clients/NO-SUCH-CLIENT",
    ]) {
      const res = await p.goto("http://localhost:3477/" + locale + "/" + key, {
        waitUntil: "networkidle",
      });
      texts.push({ key, status: res.status(), text: await p.locator("main").innerText() });
    }
    checks.push({ locale, notFound: texts });
    await p.addStyleTag({ content: "nextjs-portal {display:none!important}" });
    await p.locator("main").focus();
    await p.keyboard.press("Tab");
    await p.screenshot({
      path: `foundry/tasks/SB-077/evidence/after/viewer-${locale}-not-found-390.png`,
      fullPage: true,
    });
  }
  await ctx.close();
} finally {
  await b.close();
  writeFileSync(
    "foundry/tasks/SB-077/evidence/after/menu-not-found.json",
    JSON.stringify(checks, null, 2),
  );
}
