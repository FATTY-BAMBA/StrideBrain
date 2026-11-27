import { NextResponse, type NextRequest } from "next/server";
/** Replace any browser-supplied path header. This is navigation, never identity. */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-stridebrain-page-path", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!api|_next|fonts|favicon.ico).*)"] };
