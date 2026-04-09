'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthActions } from "@convex-dev/auth/react"
import { Bell, LogOut, Menu } from 'lucide-react'
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
    const { unreadCount, leaseActionCount, totalNotifications } = useNotificationCounts()

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

    const getNotificationLink = () => {
        if (leaseActionCount > 0) {
            if (currentRole === 'landlord') return '/landlord/leases'
            if (currentRole === 'tenant') return '/tenant/leases'
        }

        if (unreadCount > 0) return '/chat'
        if (currentRole === 'admin') return '/admin'
        return '/chat'
    }

    const getBadgeCount = (badgeType?: NavigationBadgeType) => {
        if (badgeType === 'messages') return unreadCount
        if (badgeType === 'leases') return leaseActionCount
        return 0
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
                                item.badgeType === 'leases' ? 'bg-amber-500' : 'bg-red-500'
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
                'inline-flex items-center justify-center gap-1.5 rounded-full transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.98]',
                options?.iconOnly
                    ? 'apple-glass-control h-9 w-9 text-neutral-700 hover:text-neutral-900'
                    : 'apple-glass-control h-10 px-4 text-[15px] font-semibold text-neutral-800 hover:text-neutral-950',
                isDiscoverActive
                    ? options?.iconOnly
                        ? 'border-transparent bg-neutral-900 text-white shadow-[0_10px_22px_-12px_rgba(15,23,42,0.45)]'
                        : 'border-transparent bg-neutral-900 text-white shadow-[0_12px_26px_-16px_rgba(15,23,42,0.45)]'
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
                    'fixed top-0 left-0 right-0 z-50 border-b border-white/50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300',
                    'apple-glass-bar',
                    isScrolled
                        ? 'shadow-[0_18px_36px_-24px_rgba(15,23,42,0.24)]'
                        : 'shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]'
                )}
            >
                <div className="w-full px-4 sm:px-5 lg:px-6">
                    <div className="flex h-16 items-center md:h-20">
                        <div className="flex items-center gap-2 md:flex-1 md:justify-start md:gap-3">
                            {user && (
                                <div className="hidden md:block">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="relative rounded-full outline-none">
                                                <div className="apple-glass-control flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-[color,transform] duration-200 hover:text-black">
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
                                    <Link
                                        href={getNotificationLink()}
                                        aria-label="Open notifications"
                                        className="apple-glass-control relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 shadow-none transition-[color,transform] duration-200 hover:text-neutral-900 md:hidden"
                                    >
                                        <Bell className="h-5 w-5 stroke-[1.75]" />
                                        {totalNotifications > 0 && (
                                            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full border border-white bg-sky-500" />
                                        )}
                                    </Link>

                                    <DropdownMenu onOpenChange={setIsProfileMenuOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <button className="apple-glass-control relative rounded-full p-0.5 outline-none transition-[transform,box-shadow] duration-200 hover:scale-[1.01] md:p-0.5">
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
