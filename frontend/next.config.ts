import type { NextConfig } from "next";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://backend:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
  experimental: {
    // Next's proxy (formerly middleware) buffers and clones the request body
    // in memory. The default cap is 10MB, which silently truncates asset
    // uploads (contract allows up to 50MB). Raise it to cover the largest
    // allowed upload with headroom.
    proxyClientMaxBodySize: "64mb",
    // Default proxy timeout is 30s; asset uploads/backend calls can take
    // longer, so extend it to avoid the proxy aborting slow requests.
    proxyTimeout: 120_000,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        // No `search` constraint: asset URLs always carry `?v=<updatedAt>`,
        // which is not a fixed value we can pin here.
      },
    ],
  },
};

export default nextConfig;
