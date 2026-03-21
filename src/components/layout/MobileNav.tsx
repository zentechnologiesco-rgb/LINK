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

    if (!user) return null

    let items: NavItem[] = tenantNavItems
    if (currentRole === 'landlord') items = landlordNavItems
    else if (currentRole === 'admin') items = adminNavItems

    const getBadgeCount = (badgeType?: 'messages' | 'leases') => {
        if (badgeType === 'messages') return unreadCount
        if (badgeType === 'leases') return leaseActionCount
        return 0
    }

    return (
        <>
            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="h-24 md:hidden" />

            {/* Floating Bottom Navigation */}
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
                <div
                    className={cn(
                        "flex items-center bg-neutral-100 rounded-full p-1.5 border border-neutral-200",
                    )}
                >
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
                                    'relative flex items-center justify-center rounded-full transition-all duration-300 ease-out',
                                    isActive
                                        ? 'bg-white h-14 px-5 gap-2.5'
                                        : 'h-14 w-14 text-neutral-400 hover:text-neutral-600 active:scale-90'
                                )}
                            >
                                <div className="relative flex items-center justify-center">
                                    <Icon
                                        className={cn(
                                            'h-[22px] w-[22px] transition-all duration-300',
                                            isActive
                                                ? 'text-neutral-900'
                                                : 'text-neutral-400'
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        {...(isActive && item.icon === Home ? { fill: 'currentColor' } : {})}
                                    />
                                    {hasBadge && (
                                        <span className={cn(
                                            "absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-0.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-neutral-100 animate-in zoom-in duration-200",
                                            item.badgeType === 'leases' ? 'bg-amber-500' : 'bg-red-500'
                                        )}>
                                            {badgeCount > 9 ? '9+' : badgeCount}
                                        </span>
                                    )}
                                </div>

                                {/* Label shown only when active */}
                                {isActive && (
                                    <span className="text-[13px] font-bold text-neutral-900 whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-200">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
