// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ locale: "en" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: route.locale, projectKey: "PRIVATE-KEY" }),
  usePathname: () => `/${route.locale}/projects/PRIVATE-KEY`,
}));
import NotFound from "@/app/[locale]/not-found";
import ErrorPage from "@/app/[locale]/error";
import { LanguageSwitcherFallback } from "@/components/shell/language-switcher";
it.each(["en", "zh-TW"] as const)(
  "localizes recovery without echoing the address (%s)",
  (locale) => {
    route.locale = locale;
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(createElement(NotFound));
    expect(host.querySelectorAll("h1")).toHaveLength(1);
    expect(host.querySelector("h1")?.textContent).toBe(
      locale === "en" ? "Page not found" : "找不到頁面",
    );
    expect(host.textContent).not.toContain("PRIVATE-KEY");
    expect(host.querySelector("a")?.getAttribute("href")).toBe(`/${locale}`);
    const reset = vi.fn();
    const element = ErrorPage({ reset });
    expect(element.props.reset).toBe(reset);
    expect(element.props.area).toBe("workspace");
  },
);
it("offers real language links before hydration", () => {
  route.locale = "zh-TW";
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    createElement(LanguageSwitcherFallback, { locale: "zh-TW" }),
  );
  expect([...host.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual([
    "/zh-TW/projects/PRIVATE-KEY",
    "/en/projects/PRIVATE-KEY",
  ]);
});
