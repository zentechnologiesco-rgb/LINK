import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'admired-falcon-221.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: 'friendly-crab-162.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: 'admired-falcon-221.convex.site',
      },
      {
        protocol: 'https',
        hostname: 'friendly-crab-162.convex.site',
      },
      {
        // Catch-all for any Convex storage domain
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.convex.site',
      },
    ],
    // Skip optimization for Convex storage images to avoid timeouts
    unoptimized: process.env.NODE_ENV === 'development',
    // Increase cache TTL to reduce re-fetching
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },
};

export default nextConfig;

