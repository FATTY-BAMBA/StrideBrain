import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  // Bounded 300-line documents and their signed issue snapshots can exceed the 1 MB default.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
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
