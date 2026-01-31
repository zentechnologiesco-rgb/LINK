import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Prevent font render blocking
  preload: true,
})

export const metadata: Metadata = {
  title: 'LINK - Property Rental Platform',
  description: 'Modern, end-to-end property rental platform for Namibia.',
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
  themeColor: '#ffffff',
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
        <link rel="dns-prefetch" href="https://admired-falcon-221.convex.cloud" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://tiles.mapbox.com" />

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://admired-falcon-221.convex.cloud" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexClientProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  )
}
