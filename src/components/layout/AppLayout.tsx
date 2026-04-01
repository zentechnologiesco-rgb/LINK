'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface AppLayoutProps {
    children: ReactNode
}

// No sidebar, no global nav - each page handles its own layout
// - Home page uses Header + CategoryBar + MobileNav
// - Dashboard pages use DashboardLayout
// - Auth pages are standalone

export function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname()

    // Auth pages have their own full layout
    const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')

    return (
        <div className={cn(
            "min-h-screen transition-colors duration-300",
            isAuthPage ? "bg-white" : "bg-white"
        )}>
            {children}
        </div>
    )
}
