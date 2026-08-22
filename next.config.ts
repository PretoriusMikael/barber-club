import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Photography-led site: AVIF first, WebP fallback. See BLUEPRINT.md perf budget.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Add the CDN that ends up hosting the shoot assets (Sanity, Cloudinary, Mux thumbs).
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Type errors fail the build on purpose — keep it clean.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
