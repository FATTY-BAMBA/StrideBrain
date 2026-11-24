// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ path: "/zh-TW/quotes" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.path }));
import { GlobalNav } from "@/components/shell/global-nav";
import { SettingsLink } from "@/components/shell/settings-link";
import { Icon } from "@/components/ui/icons";
import { getCatalog } from "@/modules/localization/catalog";
it.each(["en", "zh-TW"] as const)(
  "marks the current area, labels icons and leaves planned areas unlinked in %s",
  (locale) => {
    route.path = `/${locale}/quotes`;
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(
      createElement(GlobalNav, { locale, labels: getCatalog(locale), canReadClients: true }),
    );
    expect(host.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe(
      `/${locale}/quotes`,
    );
    expect(host.querySelectorAll("a")).toHaveLength(4);
    expect(host.querySelectorAll("svg[aria-hidden=true]")).toHaveLength(6);
    expect(host.querySelector('a[href$="/knowledge"],a[href$="/customer-care"]')).toBeNull();
    expect(host.querySelectorAll("small")).toHaveLength(2);
    expect(host.querySelector("nav")?.textContent).toContain(
      locale === "zh-TW" ? "規劃中" : "Planned",
    );
    const viewer = renderToStaticMarkup(
      createElement(GlobalNav, { locale, labels: getCatalog(locale), canReadClients: false }),
    );
    expect(viewer).not.toContain(`href="/${locale}/clients"`);
  },
);
it("marks settings in the account area and supports a named standalone icon", () => {
  route.path = "/en/settings/ai-data";
  expect(
    renderToStaticMarkup(createElement(SettingsLink, { locale: "en", label: "Settings" })),
  ).toContain('aria-current="page"');
  const icon = renderToStaticMarkup(
    createElement(Icon, { name: "information", label: "Information" }),
  );
  expect(icon).toContain('aria-label="Information"');
  expect(icon).toContain('stroke-width="1.6"');
  expect(icon).toContain('width="18"');
});
