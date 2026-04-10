import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  isProduction
    ? "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  "connect-src 'self' https: wss: https://api.mapbox.com https://events.mapbox.com https://*.mapbox.com https://*.convex.cloud https://*.convex.site https://vitals.vercel-insights.com https://*.vercel-insights.com",
  "worker-src 'self' blob:",
  !isProduction ? "" : "upgrade-insecure-requests",
].filter(Boolean).join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  ...(isProduction
    ? [{
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    }]
    : []),
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    key: "Origin-Agent-Cluster",
    value: "?1",
  },
];

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
      '@phosphor-icons/react',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
    // Keep route payloads warm between navigations so revisits feel instant.
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
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
    // Allow the quality values used by our image components and Next's default
    qualities: [60, 70, 75, 80, 85, 90],
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
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
