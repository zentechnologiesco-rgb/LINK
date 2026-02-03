import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Production source maps for better debugging
  productionBrowserSourceMaps: false,

  // Optimize package imports
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
  },

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
        hostname: 'admired-falcon-221.convex.site',
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
    // Lower default quality for bandwidth savings (can be overridden per-image)
    // 75 is visually nearly identical to 100 but ~40% smaller file size
    // Increase cache TTL to reduce re-fetching (30 days)
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Device sizes for responsive images - optimized breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for srcset - added smaller sizes for thumbnails
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Use modern formats for smaller file size with same quality
    // AVIF is ~50% smaller than WebP, which is ~30% smaller than JPEG
    formats: ['image/avif', 'image/webp'],
    // Disable static image imports optimization for faster builds (optional)
    // disableStaticImages: false,
  },

  // Add caching headers for static assets
  async headers() {
    return [
      {
        source: '/(.*).(ico|png|jpg|jpeg|gif|svg|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*).(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*).(woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

