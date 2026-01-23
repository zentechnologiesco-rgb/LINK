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
    ],
    // Skip optimization for Convex storage images to avoid timeouts
    unoptimized: process.env.NODE_ENV === 'development',
    // Increase cache TTL to reduce re-fetching
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },
};

export default nextConfig;

