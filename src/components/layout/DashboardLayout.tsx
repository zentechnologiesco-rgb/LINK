'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import {
    Building2,
    FileCheck,
    Wallet,
    LayoutDashboard,
    Users,
    Shield,
    ClipboardList,
    FileText,
    Heart,
    MessageSquare,
} from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
    title?: string
    user?: any
}

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    tag?: string
}

// Dashboard navigation items based on role
const landlordNavItems: NavItem[] = [
    { label: 'My Properties', href: '/landlord/properties', icon: Building2 },
    { label: 'Leases', href: '/landlord/leases', icon: FileCheck },
    { label: 'Payments', href: '/landlord/payments', icon: Wallet, tag: 'Soon' },
]

const tenantNavItems: NavItem[] = [
    { label: 'My Favorites', href: '/tenant/saved', icon: Heart },
    { label: 'My Leases', href: '/tenant/leases', icon: FileCheck },
    { label: 'Payments', href: '/tenant/payments', icon: Wallet, tag: 'Soon' },
]

const adminNavItems: NavItem[] = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'All Properties', href: '/admin/properties', icon: Building2 },
    { label: 'Property Requests', href: '/admin/property-requests', icon: Shield },
    { label: 'Landlord Requests', href: '/admin/landlord-requests', icon: ClipboardList },
    { label: 'System Reports', href: '/admin/reports', icon: FileText },
]

export function DashboardLayout({ children, title = 'Dashboard', user }: DashboardLayoutProps) {
    const pathname = usePathname()

    const currentRole = user?.role

    // Get nav items based on role
    const getNavItems = () => {
        if (currentRole === 'landlord') return landlordNavItems
        if (currentRole === 'admin') return adminNavItems
        return tenantNavItems
    }

    const navItems = getNavItems()

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === href
        }
        return pathname?.startsWith(href)
    }

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Unified Top Header - Matches Home Page */}
            <Header user={user} isLoading={!user} />

            {/* Main Content Wrapper */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-4 pb-24">



                {/* Page Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation - Identical style to MobileNav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/5 md:hidden safe-area-bottom pb-safe">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.slice(0, 5).map((item) => { // show max 5 items on mobile
                        const active = isActive(item.href)
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors relative',
                                    active
                                        ? 'text-black'
                                        : 'text-neutral-400 hover:text-neutral-600'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-6 w-6 transition-all duration-300',
                                        active && 'scale-105'
                                    )}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span className={cn(
                                    'text-[10px]',
                                    active ? 'font-semibold' : 'font-medium'
                                )}>
                                    {item.label.split(' ')[0]} {/* Shorten label for mobile */}
                                </span>
                                {active && (
                                    <span className="absolute -top-[1px] w-8 h-0.5 bg-black rounded-b-full" />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
