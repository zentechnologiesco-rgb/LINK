'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { getNavigationItemsForSurface, type NavigationBadgeType } from '@/config/navigation'
import { useNotificationCounts } from '@/components/providers/NotificationCountsProvider'
import type { UserRole } from '@/lib/user-preferences'
import { cn } from '@/lib/utils'
import { persistMobileNavTransition } from '@/components/layout/mobile-nav-transition'

type MobileNavUser = {
    role?: UserRole | null
} | null

interface MobileNavProps {
    user?: MobileNavUser
    userRole?: UserRole | null
}

function MobileNavInner({ user, userRole }: MobileNavProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentRole = (userRole || user?.role || null) as UserRole | null
    const { unreadCount, leaseActionCount, paymentActionCount } = useNotificationCounts()

    const isChatThread = pathname === '/chat' && (
        searchParams.get('id') !== null ||
        searchParams.get('propertyId') !== null
    )
    const isWizard = pathname?.endsWith('/new') || pathname?.includes('/edit')
    const isLeaseDetail = pathname?.includes('/leases/') && pathname.split('/').pop() !== 'leases'

    if (!user || !currentRole || isChatThread || isWizard || isLeaseDetail) return null

    const items = getNavigationItemsForSurface(currentRole, 'mobileNav')

    const navLabel = currentRole === 'admin'
        ? 'Admin navigation'
        : currentRole === 'landlord'
            ? 'Landlord navigation'
            : 'Primary navigation'

    const getBadgeCount = (badgeType?: NavigationBadgeType) => {
        if (badgeType === 'messages') return unreadCount
        if (badgeType === 'leases') return leaseActionCount
        if (badgeType === 'payments') return paymentActionCount
        return 0
    }

    const getBadgeClassName = (badgeType?: NavigationBadgeType) => {
        if (badgeType === 'leases') return 'bg-amber-500'
        if (badgeType === 'payments') return 'bg-emerald-500'
        return 'bg-neutral-900'
    }

    const isActiveRoute = (href: string) => (
        href === '/'
            ? pathname === '/'
            : pathname?.startsWith(href)
    )

    return (
        <>
            <div
                className="mobile-nav-spacer md:hidden"
                style={{ height: 'calc(6.55rem + env(safe-area-inset-bottom, 0px))' }}
            />

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
                                        key={item.id}
                                        href={item.href}
                                        onNavigate={() => {
                                            persistMobileNavTransition(items, pathname, item.href)
                                        }}
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
                                                    getBadgeClassName(item.badgeType)
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
