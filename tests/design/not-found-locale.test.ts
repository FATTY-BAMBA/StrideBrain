import { NextRequest } from "next/server";
import { expect, it } from "vitest";
import { proxy } from "@/proxy";
it.each([
  ["/en/nothing-here", "en"],
  ["/zh-TW/nothing-here", "zh-TW"],
])(
  "derives recovery locale from the route and overwrites an inbound header: %s",
  (path, locale) => {
    const response = proxy(
      new NextRequest("https://example.test" + path, {
        headers: { "x-stridebrain-page-locale": locale === "en" ? "zh-TW" : "en" },
      }),
    );
    expect(response.headers.get("x-middleware-request-x-stridebrain-page-locale")).toBe(locale);
  },
);
