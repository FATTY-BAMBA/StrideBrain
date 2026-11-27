import type { NextConfig } from "next";
import { MAX_QUOTE_ISSUE_TOKEN_LENGTH } from "./src/modules/quote-issue/domain/contracts";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  // Largest signed issue token plus the measured 230-byte React action envelope.
  // Regression/measurement: tests/quote-document/request-size.test.ts.
  experimental: {
    globalNotFound: true,
    serverActions: { bodySizeLimit: MAX_QUOTE_ISSUE_TOKEN_LENGTH + 230 },
  },
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: { "/api/quotes/*/pdf": ["./assets/fonts/**"] },
  async headers() {
    return [
      {
        source: "/fonts/v1/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
