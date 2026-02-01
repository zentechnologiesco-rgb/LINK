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
import { MobileNav } from '@/components/layout/MobileNav'

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

            {/* Mobile Bottom Navigation */}
            <MobileNav user={user} userRole={user?.role} />
        </div>
    )
}
