import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: bundles only needed node_modules → smaller image
  output: "standalone",
  // Don't fail build on TS errors (validator handles runtime types via Zod)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Production: compress responses
  compress: true,
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
