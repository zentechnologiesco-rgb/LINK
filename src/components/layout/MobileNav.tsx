'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Heart, MessageSquare, User, Building2, LayoutDashboard, FileText, LucideIcon } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

interface MobileNavProps {
    user?: any
    userRole?: 'tenant' | 'landlord' | 'admin' | null
}

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
    badgeType?: 'messages' | 'leases'
}

const tenantNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Leases', href: '/tenant/leases', icon: FileText, badgeType: 'leases' },
    { label: 'Messages', href: '/chat', icon: MessageSquare, badgeType: 'messages' },
    { label: 'Profile', href: '/settings', icon: User },
]

const landlordNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Properties', href: '/landlord/properties', icon: Building2 },
    { label: 'Leases', href: '/landlord/leases', icon: FileText, badgeType: 'leases' },
    { label: 'Messages', href: '/chat', icon: MessageSquare, badgeType: 'messages' },
]

const adminNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Messages', href: '/chat', icon: MessageSquare, badgeType: 'messages' },
    { label: 'Profile', href: '/settings', icon: User },
]

const guestNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Sign In', href: '/sign-in', icon: User },
]

export function MobileNav({ user, userRole }: MobileNavProps) {
    const pathname = usePathname()
    const currentRole = userRole || user?.role

    // Only fetch counts if user is logged in
    const unreadCountQuery = useQuery(
        api.messages.getUnreadCount,
        user ? {} : "skip"
    )
    const unreadCount = typeof unreadCountQuery === 'number' ? unreadCountQuery : 0

    const leaseActionCountQuery = useQuery(
        api.leases.getActionRequiredCount,
        user ? {} : "skip"
    )
    const leaseActionCount = typeof leaseActionCountQuery === 'number' ? leaseActionCountQuery : 0

    let items: NavItem[] = guestNavItems
    if (user) {
        if (currentRole === 'landlord') items = landlordNavItems
        else if (currentRole === 'admin') items = adminNavItems
        else items = tenantNavItems
    }

    const getBadgeCount = (badgeType?: 'messages' | 'leases') => {
        if (badgeType === 'messages') return unreadCount
        if (badgeType === 'leases') return leaseActionCount
        return 0
    }

    return (
        <>
            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="h-16 md:hidden" />

            {/* Fixed Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-neutral-100 md:hidden">
                <div className="flex items-center justify-around h-16 px-2">
                    {items.map((item) => {
                        const isActive = item.href === '/'
                            ? pathname === '/'
                            : pathname?.startsWith(item.href)
                        const Icon = item.icon
                        const badgeCount = getBadgeCount(item.badgeType)
                        const hasBadge = badgeCount > 0

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200 relative',
                                    isActive
                                        ? 'text-neutral-900'
                                        : 'text-neutral-400 hover:text-neutral-600'
                                )}
                            >
                                <div className="relative">
                                    <Icon
                                        className={cn(
                                            'h-6 w-6 transition-all duration-200',
                                            isActive && 'scale-105'
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    {hasBadge && (
                                        <span className={cn(
                                            "absolute -top-1 -right-1 h-4 w-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in duration-200",
                                            item.badgeType === 'leases' ? 'bg-amber-500' : 'bg-red-500'
                                        )}>
                                            {badgeCount > 9 ? '9+' : badgeCount}
                                        </span>
                                    )}
                                </div>
                                <span className={cn(
                                    'text-[10px]',
                                    isActive ? 'font-bold' : 'font-medium'
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
