'use client'

import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobilePageTransition } from '@/components/layout/MobilePageTransition'
import { useUser } from '@/components/providers/UserProvider'

interface DashboardLayoutProps {
    children: React.ReactNode
    title?: string
}

export function DashboardLayout({ children, title = 'Dashboard' }: DashboardLayoutProps) {
    const { user } = useUser()

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900">
            {/* Unified Top Header - Matches Home Page */}
            <Header user={user} isLoading={!user} />

            {/* Main Content Wrapper */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-4 pb-24" data-title={title}>
                {/* Page Content */}
                <MobilePageTransition>{children}</MobilePageTransition>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNav user={user} userRole={user?.role} />
        </div>
    )
}
