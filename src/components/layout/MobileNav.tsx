'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Heart, MessageSquare, User, Building2, LayoutDashboard, FileText, LucideIcon } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Suspense } from 'react'

type MobileNavUser = {
    role?: 'tenant' | 'landlord' | 'admin' | null
} | null

interface MobileNavProps {
    user?: MobileNavUser
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
    { label: 'Saved', href: '/tenant/saved', icon: Heart },
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

function MobileNavInner({ user, userRole }: MobileNavProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
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

    // Hide mobile nav completely when inside a chat thread, creation wizards, or detail pages with action bars
    const isChatThread = pathname === '/chat' && (
        searchParams.get('id') !== null ||
        searchParams.get('propertyId') !== null
    )
    const isWizard = pathname?.endsWith('/new') || pathname?.includes('/edit')
    const isLeaseDetail = pathname?.includes('/leases/') && pathname.split('/').pop() !== 'leases'

    if (!user || isChatThread || isWizard || isLeaseDetail) return null

    let items: NavItem[] = tenantNavItems
    if (currentRole === 'landlord') items = landlordNavItems
    else if (currentRole === 'admin') items = adminNavItems

    const navLabel = currentRole === 'admin'
        ? 'Admin navigation'
        : currentRole === 'landlord'
            ? 'Landlord navigation'
            : 'Primary navigation'

    const getBadgeCount = (badgeType?: 'messages' | 'leases') => {
        if (badgeType === 'messages') return unreadCount
        if (badgeType === 'leases') return leaseActionCount
        return 0
    }

    const isActiveRoute = (href: string) => (
        href === '/'
            ? pathname === '/'
            : pathname?.startsWith(href)
    )

    return (
        <>
            {/* Spacer to prevent content from being hidden behind nav */}
            <div
                className="mobile-nav-spacer md:hidden"
                style={{ height: 'calc(6.55rem + env(safe-area-inset-bottom, 0px))' }}
            />

            {/* Floating glass bottom navigation */}
            <nav
                aria-label={navLabel}
                className="mobile-nav-root fixed inset-x-0 bottom-0 z-50 px-3 md:hidden"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.9rem)' }}
            >
                <div className="mx-auto w-[min(27rem,calc(100vw-1.5rem))]">
                    <div className="mobile-nav-shell px-2 py-1.5">
                        <div className="pointer-events-none absolute inset-x-10 top-1 h-8 rounded-full bg-white/70 blur-2xl dark:bg-white/10" />
                        <div
                            className="relative grid items-start gap-0.5"
                            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
                        >
                            {items.map((item) => {
                                const isActive = isActiveRoute(item.href)
                                const Icon = item.icon
                                const badgeCount = getBadgeCount(item.badgeType)
                                const hasBadge = badgeCount > 0

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={cn(
                                            'focus-ring group relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-1 py-1 text-center transition-all duration-300 ease-out active:scale-[0.98]',
                                            isActive
                                                ? 'mobile-nav-item-active text-[var(--mobile-nav-accent)]'
                                                : 'text-[var(--mobile-nav-muted)]'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'relative flex h-8 w-8 items-center justify-center transition-all duration-300 ease-out',
                                                isActive
                                                    ? 'text-[var(--mobile-nav-accent)]'
                                                    : 'text-[var(--mobile-nav-muted)] group-hover:text-[var(--mobile-nav-text)]'
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'h-5 w-5 transition-all duration-300',
                                                    isActive
                                                        ? 'scale-105'
                                                        : 'group-hover:text-[var(--mobile-nav-text)]'
                                                )}
                                                strokeWidth={isActive ? 2.35 : 2}
                                            />
                                            {hasBadge && (
                                                <span className={cn(
                                                    'absolute -right-1 -top-1 z-20 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ring-2 ring-white/90 transition-transform duration-300 dark:ring-slate-950/80',
                                                    item.badgeType === 'leases' ? 'bg-amber-500' : 'bg-neutral-900'
                                                )}>
                                                    {badgeCount > 9 ? '9+' : badgeCount}
                                                </span>
                                            )}
                                        </div>

                                        <span
                                            className={cn(
                                                'mobile-nav-label max-w-full truncate px-0.5 transition-all duration-300',
                                                isActive
                                                    ? 'text-[var(--mobile-nav-accent)]'
                                                    : 'text-[var(--mobile-nav-muted)] group-hover:text-[var(--mobile-nav-text)]'
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}

export function MobileNav(props: MobileNavProps) {
    return (
        <Suspense fallback={null}>
            <MobileNavInner {...props} />
        </Suspense>
    )
}
