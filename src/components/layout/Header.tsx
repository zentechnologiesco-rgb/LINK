'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthActions } from "@convex-dev/auth/react"
import { Bell, LogOut, Menu } from '@/components/ui/icons'
import { toast } from 'sonner'

import {
    canAccessDiscover,
    discoverNavItem,
    getNavigationItemsForSurface,
    settingsNavItem,
    type NavigationBadgeType,
} from '@/config/navigation'
import type { UserRole } from '@/lib/user-preferences'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationCounts } from '@/components/providers/NotificationCountsProvider'
import { type AvatarIdentity } from '@/lib/avatar'
import { getDisplayName } from '@/lib/user-name'
import { cn } from '@/lib/utils'
import { NotificationCenterSheet } from '@/components/layout/NotificationCenterSheet'

interface HeaderProps {
    user?: (AvatarIdentity & {
        email?: string | null
        role?: UserRole | null
    }) | null
    userRole?: UserRole | null
    isLoading?: boolean
}

export function Header({ user, userRole, isLoading }: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { signOut } = useAuthActions()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const { unreadCount, leaseActionCount, paymentActionCount, totalNotifications } = useNotificationCounts()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSignOut = async () => {
        try {
            await signOut()
            router.push('/')
            router.refresh()
            toast.success('Signed out successfully')
        } catch {
            toast.error('Failed to sign out')
        }
    }

    const currentRole = (userRole || user?.role || null) as UserRole | null
    const canShowDiscover = canAccessDiscover(currentRole)
    const isDiscoverActive = pathname === discoverNavItem.href
    const headerMenuItems = currentRole
        ? getNavigationItemsForSurface(currentRole, 'headerMenu')
        : []

    const getBadgeCount = (badgeType?: NavigationBadgeType) => {
        if (badgeType === 'messages') return unreadCount
        if (badgeType === 'leases') return leaseActionCount
        if (badgeType === 'payments') return paymentActionCount
        return 0
    }

    const getBadgeClassName = (badgeType?: NavigationBadgeType) => {
        if (badgeType === 'leases') return 'bg-amber-500'
        if (badgeType === 'payments') return 'bg-emerald-500'
        return 'bg-red-500'
    }

    const renderNavigationMenuItems = () => (
        <>
            {headerMenuItems.map((item) => {
                const Icon = item.icon
                const badgeCount = getBadgeCount(item.badgeType)
                const hasBadge = badgeCount > 0

                return (
                    <DropdownMenuItem
                        key={item.id}
                        className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                        onClick={() => router.push(item.href)}
                    >
                        <div className="flex items-center flex-1">
                            <Icon className="mr-3 h-4 w-4 opacity-70" />
                            {item.label}
                        </div>
                        {hasBadge && (
                            <span className={cn(
                                'ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white',
                                getBadgeClassName(item.badgeType)
                            )}>
                                {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                        )}
                    </DropdownMenuItem>
                )
            })}
        </>
    )

    const DiscoverIcon = discoverNavItem.icon
    const SettingsIcon = settingsNavItem.icon

    const renderBrandLink = (className?: string) => (
        <Link
            href="/"
            className={cn("flex items-center gap-1.5", className)}
        >
            <Image
                src="/logo-trans-cropped.png"
                alt="LINK logo"
                width={140}
                height={140}
                priority
                className="h-[38px] w-[38px] shrink-0 object-contain md:h-[46px] md:w-[46px]"
            />
            <span className="font-bold text-[28px] leading-none tracking-tight text-neutral-900 md:text-[34px]">
                Link
            </span>
        </Link>
    )

    const renderDiscoverLink = (options?: { iconOnly?: boolean }) => (
        <Link
            href={discoverNavItem.href}
            className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-[8px] transition-all active:scale-[0.98]',
                options?.iconOnly
                    ? 'h-9 w-9 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    : 'h-[38px] bg-neutral-900 px-4 text-[15px] font-semibold text-white hover:bg-neutral-800',
                isDiscoverActive
                    ? options?.iconOnly
                        ? 'bg-neutral-900 text-white'
                        : ''
                    : ''
            )}
        >
            <DiscoverIcon className={cn(options?.iconOnly ? 'h-4 w-4' : 'h-[18px] w-[18px]')} strokeWidth={2.5} />
            {!options?.iconOnly && <span>{discoverNavItem.label}</span>}
        </Link>
    )

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                    isScrolled
                        ? 'bg-white/90 backdrop-blur-md border-b border-neutral-100'
                        : 'bg-white border-b border-transparent'
                )}
            >
                <div className="w-full px-4 sm:px-5 lg:px-6">
                    <div className="flex h-16 items-center md:h-20">
                        <div className="flex items-center gap-2 md:flex-1 md:justify-start md:gap-3">
                            {user && (
                                <div className="hidden md:block">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="relative outline-none">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-neutral-100">
                                                    <Menu className="h-6 w-6 text-neutral-900" />
                                                </div>
                                                {totalNotifications > 0 && (
                                                    <span className="absolute top-0 right-0 z-10 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                                                        {totalNotifications > 9 ? '9+' : totalNotifications}
                                                    </span>
                                                )}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="mt-2 w-64 rounded-[20px] border border-neutral-100 bg-white p-2 shadow-xl"
                                            align="start"
                                        >
                                            {renderNavigationMenuItems()}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            {renderBrandLink('md:hidden')}
                        </div>

                        <div className="hidden items-center justify-center md:flex">
                            {renderBrandLink()}
                        </div>

                        <div className="ml-auto flex justify-end md:flex-1">
                            {isLoading ? (
                                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
                            ) : user ? (
                                <div className="flex items-center gap-1.5">
                                    {canShowDiscover && (
                                        <>
                                            <div className="hidden md:flex">
                                                {renderDiscoverLink()}
                                            </div>
                                            <div className="md:hidden">
                                                {renderDiscoverLink({ iconOnly: true })}
                                            </div>
                                        </>
                                    )}
                                    <NotificationCenterSheet userRole={currentRole}>
                                        <button
                                            type="button"
                                            aria-label="Open notifications"
                                            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 shadow-none transition-colors hover:bg-neutral-200 md:hidden"
                                        >
                                            <Bell className="h-5 w-5 stroke-[1.75]" />
                                            {totalNotifications > 0 && (
                                                <span className="absolute -right-1 -top-1 z-10 flex h-4.5 min-w-[18px] items-center justify-center rounded-full border border-white bg-neutral-950 px-1 text-[10px] font-bold text-white">
                                                    {totalNotifications > 9 ? '9+' : totalNotifications}
                                                </span>
                                            )}
                                        </button>
                                    </NotificationCenterSheet>

                                    <DropdownMenu onOpenChange={setIsProfileMenuOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <button className="relative rounded-full p-0.5 outline-none transition-colors md:bg-transparent md:p-0">
                                                <UserAvatar
                                                    activity={isProfileMenuOpen ? 'active' : totalNotifications > 0 ? 'unread' : 'idle'}
                                                    className="h-8 w-8 border-0 bg-white shadow-none ring-0 md:h-10 md:w-10 md:border-2 md:border-white md:shadow-sm md:ring-1 md:ring-neutral-100"
                                                    user={user}
                                                />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="mt-2 w-64 rounded-[20px] border border-neutral-100 bg-white p-2 shadow-xl"
                                            align="end"
                                        >
                                            <div className="mb-1 px-3 py-2">
                                                <p className="text-sm font-semibold text-black">
                                                    {getDisplayName(user)}
                                                </p>
                                                <p className="truncate text-xs text-black/50">
                                                    {user.email}
                                                </p>
                                            </div>

                                            <DropdownMenuSeparator className="bg-neutral-100" />

                                            <DropdownMenuItem
                                                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                                                onClick={() => router.push(settingsNavItem.href)}
                                            >
                                                <SettingsIcon className="mr-3 h-4 w-4 opacity-70" />
                                                {settingsNavItem.label}
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={handleSignOut}
                                                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 focus:bg-red-50"
                                            >
                                                <LogOut className="mr-3 h-4 w-4 opacity-70" />
                                                Sign Out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {canShowDiscover ? (
                                        <>
                                            <div className="hidden sm:flex">
                                                {renderDiscoverLink()}
                                            </div>
                                            <div className="sm:hidden">
                                                {renderDiscoverLink({ iconOnly: true })}
                                            </div>
                                        </>
                                    ) : null}
                                    <Link href="/sign-in">
                                        <Button
                                            variant="outline"
                                            className="rounded-full border-neutral-200 px-4 text-xs font-semibold hover:bg-neutral-50"
                                        >
                                            Sign In
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="h-16 md:h-20" />
        </>
    )
}
