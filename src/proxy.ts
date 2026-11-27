import { NextResponse, type NextRequest } from "next/server";
/** Presentation locale for the routing-level 404; never used for authorization. */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(
    "x-stridebrain-page-locale",
    request.nextUrl.pathname.split("/")[1] === "en" ? "en" : "zh-TW",
  );
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!api|_next|fonts|favicon.ico).*)"] };
