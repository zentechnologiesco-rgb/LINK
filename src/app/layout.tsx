import type { Metadata } from 'next'
import { Inter, Anton } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' })

export const metadata: Metadata = {
  title: 'LINK - Property Rental Platform',
  description: 'Modern, end-to-end property rental platform for Namibia.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${anton.variable} font-sans antialiased`}>
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

