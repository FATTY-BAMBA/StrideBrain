/** Size to the document viewport, not the wider table, and reveal only inside that viewport. */
export function revealQuoteSuggestions(panel: HTMLElement) {
  const scroll = panel.closest<HTMLElement>("[data-quote-scroll]");
  if (!scroll || !scroll.clientWidth || !scroll.clientHeight) return;
  const style = getComputedStyle(scroll);
  const pixels = (value: string) => Number.parseFloat(value) || 0;
  const horizontal = pixels(style.paddingLeft) + pixels(style.paddingRight);
  const topPadding = pixels(style.paddingTop),
    bottomPadding = pixels(style.paddingBottom);
  const headerHeight = scroll.querySelector("thead")?.getBoundingClientRect().height ?? 0;
  panel.style.setProperty(
    "--suggestion-width",
    `${Math.max(0, scroll.clientWidth - horizontal)}px`,
  );
  panel.style.setProperty(
    "--suggestion-max-height",
    `${Math.max(0, scroll.clientHeight - headerHeight - topPadding - bottomPadding)}px`,
  );
  const viewportTop = scroll.getBoundingClientRect().top + scroll.clientTop;
  const top = viewportTop + headerHeight + topPadding;
  const bottom = viewportTop + scroll.clientHeight - bottomPadding;
  const bounds = panel.getBoundingClientRect();
  if (bounds.bottom > bottom) scroll.scrollTop += bounds.bottom - bottom;
  else if (bounds.top < top) scroll.scrollTop -= top - bounds.top;
}
