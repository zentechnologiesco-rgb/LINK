'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Anton } from 'next/font/google'

interface AppLayoutProps {
    children: React.ReactNode
}

// No sidebar, no global nav - each page handles its own layout
// - Home page uses Header + CategoryBar + MobileNav
// - Dashboard pages use DashboardLayout
// - Auth pages are standalone

export function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname()

    // Auth pages have their own full layout
    const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')

    // Dashboard pages (will use DashboardLayout wrapper)
    const isDashboardPage = pathname?.startsWith('/landlord') ||
        pathname?.startsWith('/admin') ||
        pathname?.startsWith('/tenant')

    return (
        <div className={cn(
            "min-h-screen transition-colors duration-300",
            isAuthPage ? "bg-white" : "bg-white"
        )}>
            {children}
        </div>
    )
}
