import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root: while this app lives inside another repo, Next
  // would otherwise pick up the parent's lockfile and PostCSS config.
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  async headers() {
    return [
      {
        // Everything except the embeddable widget page refuses to be framed.
        // /embed/* gets a per-tenant frame-ancestors policy from src/proxy.ts.
        source: "/((?!embed/).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/widget.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
