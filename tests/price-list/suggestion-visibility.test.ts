// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { revealQuoteSuggestions } from "@/components/price-list/suggestion-visibility";
afterEach(() => document.body.replaceChildren());
function fixture(width = 390) {
  document.body.innerHTML =
    '<div data-quote-scroll style="padding:8px"><table style="width:720px"><thead></thead><tbody><tr><td colspan="7"><div id="suggestions"></div></td></tr></tbody></table></div>';
  const scroll = document.querySelector<HTMLElement>("[data-quote-scroll]")!;
  const panel = document.querySelector<HTMLElement>("#suggestions")!;
  Object.defineProperties(scroll, { clientWidth: { value: width }, clientHeight: { value: 300 } });
  vi.spyOn(scroll, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
  vi.spyOn(scroll.querySelector("thead")!, "getBoundingClientRect").mockReturnValue({
    height: 32,
  } as DOMRect);
  return { scroll, panel };
}
it.each([390, 800])("limits a full-width suggestion row to the %ipx document viewport", (width) => {
  const { scroll, panel } = fixture(width);
  vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({ top: 200, bottom: 360 } as DOMRect);
  revealQuoteSuggestions(panel);
  expect(panel.style.getPropertyValue("--suggestion-width")).toBe(`${width - 16}px`);
  expect(panel.style.getPropertyValue("--suggestion-max-height")).toBe("252px");
  expect(scroll.scrollTop).toBe(0);
});
it("brings the last row above the totals by scrolling only the document box", () => {
  const { scroll, panel } = fixture();
  scroll.scrollTop = 80;
  scroll.scrollLeft = 100;
  vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({ top: 350, bottom: 500 } as DOMRect);
  revealQuoteSuggestions(panel);
  expect(scroll.scrollTop).toBe(188);
  expect(scroll.scrollLeft).toBe(100);
  expect(window.scrollY).toBe(0);
});
it("keeps a suggestion above the viewport clear of the sticky header", () => {
  const { scroll, panel } = fixture();
  scroll.scrollTop = 80;
  vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({ top: 110, bottom: 200 } as DOMRect);
  revealQuoteSuggestions(panel);
  expect(scroll.scrollTop).toBe(50);
});
