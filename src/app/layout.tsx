import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider'
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt'
import { LoadingProgressBar } from '@/components/ui/LoadingProgressBar'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Prevent font render blocking
  preload: true,
})

const convexOrigin = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new URL(process.env.NEXT_PUBLIC_CONVEX_URL).origin
  : null

const convexSiteOrigin = convexOrigin?.includes('.convex.cloud')
  ? convexOrigin.replace('.convex.cloud', '.convex.site')
  : null

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  applicationName: 'LINK',
  title: 'LINK - Property Rental Platform',
  description: 'Modern, end-to-end property rental platform for Namibia.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LINK',
  },
  formatDetection: {
    telephone: false,
  },
  // Add OpenGraph for better sharing performance
  openGraph: {
    title: 'LINK - Property Rental Platform',
    description: 'Modern, end-to-end property rental platform for Namibia.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LINK - Verified Properties in Namibia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LINK - Property Rental Platform',
    description: 'Modern, end-to-end property rental platform for Namibia.',
    images: ['/og-image.png'],
  },
}

// Viewport config for better mobile performance
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050505',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* DNS Prefetch for external resources */}
        {convexOrigin ? <link rel="dns-prefetch" href={convexOrigin} /> : null}
        {convexSiteOrigin ? <link rel="dns-prefetch" href={convexSiteOrigin} /> : null}
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://tiles.mapbox.com" />

        {/* Preconnect to critical origins */}
        {convexOrigin ? <link rel="preconnect" href={convexOrigin} crossOrigin="anonymous" /> : null}
        {convexSiteOrigin ? <link rel="preconnect" href={convexSiteOrigin} crossOrigin="anonymous" /> : null}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexClientProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <LoadingProgressBar />
          <PwaInstallPrompt />
          <Toaster />
        </ConvexClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
