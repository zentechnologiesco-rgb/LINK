'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthActions } from "@convex-dev/auth/react"
import { Bell, Building2, LogOut, Menu } from '@/components/ui/icons'
import { toast } from 'sonner'

import {
    canAccessDiscover,
    discoverNavItem,
    getNavigationItemsForSurface,
    settingsNavItem,
    type NavigationBadgeType,
    type NavigationItem,
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTrigger,
    SheetClose,
    SheetTitle,
} from '@/components/ui/sheet'
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

    const isNavItemActive = (href: string) => {
        if (href === '/') {
            return pathname === href
        }

        return pathname === href || pathname.startsWith(`${href}/`)
    }

    const discoverMenuItem = headerMenuItems.find((item) => item.id === discoverNavItem.id)
    const messagesMenuItem = headerMenuItems.find((item) => item.id === 'messages')
    const workspaceMenuItems = headerMenuItems.filter(
        (item) => item.id !== discoverNavItem.id && item.id !== 'messages'
    )
    const navigationSections = [
        {
            id: 'browse',
            label: currentRole === 'admin' ? 'Overview' : 'Explore',
            items: discoverMenuItem ? [discoverMenuItem] : [],
        },
        {
            id: 'workspace',
            label: currentRole === 'admin' ? 'Manage' : 'Workspace',
            items: workspaceMenuItems,
        },
        {
            id: 'connect',
            label: 'Connect',
            items: messagesMenuItem ? [messagesMenuItem] : [],
        },
    ].filter((section) => section.items.length > 0)

    const renderDrawerMenuItem = (item: NavigationItem) => {
        const Icon = item.icon
        const badgeCount = getBadgeCount(item.badgeType)
        const hasBadge = badgeCount > 0
        const isActive = isNavItemActive(item.href)

        return (
            <SheetClose asChild key={item.id}>
                <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                        'group flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100',
                        isActive && 'bg-neutral-100 text-neutral-950'
                    )}
                >
                    <span className="flex min-w-0 items-center gap-3">
                        <span className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors group-hover:text-neutral-900',
                            isActive && 'text-neutral-950'
                        )}>
                            <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className={cn(
                            'truncate font-medium tracking-tight',
                            isActive && 'font-semibold'
                        )}>
                            {item.label}
                        </span>
                    </span>
                    {hasBadge && (
                        <span className={cn(
                            'ml-3 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white',
                            getBadgeClassName(item.badgeType)
                        )}>
                            {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                    )}
                </Link>
            </SheetClose>
        )
    }

    const DiscoverIcon = discoverNavItem.icon
    const SettingsIcon = settingsNavItem.icon

    const renderBrandLink = (className?: string) => (
        <Link
            href="/"
            className={cn('flex items-center gap-1.5', className)}
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

    const renderBecomeLandlordLink = (options?: { iconOnly?: boolean }) => (
        <Link
            href="/become-landlord"
            className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-[8px] transition-all active:scale-[0.98]',
                options?.iconOnly
                    ? 'h-9 w-9 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'h-[38px] border border-amber-200 bg-amber-50 px-4 text-[15px] font-semibold text-amber-900 hover:bg-amber-100'
            )}
        >
            <Building2 className={cn(options?.iconOnly ? 'h-4 w-4' : 'h-[18px] w-[18px]')} strokeWidth={2.2} />
            {!options?.iconOnly && <span>Become Landlord</span>}
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
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <button
                                                type="button"
                                                aria-label="Open navigation menu"
                                                className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 outline-none transition-colors hover:bg-neutral-100"
                                            >
                                                <Menu className="h-6 w-6" />
                                                {totalNotifications > 0 && (
                                                    <span className="absolute -right-0.5 top-0 z-10 flex h-4.5 min-w-[18px] items-center justify-center rounded-full border border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                                                        {totalNotifications > 9 ? '9+' : totalNotifications}
                                                    </span>
                                                )}
                                            </button>
                                        </SheetTrigger>
                                        <SheetContent
                                            side="left"
                                            className="w-[16.5rem] border-r border-neutral-200 bg-white p-0 shadow-none sm:max-w-[16.5rem] [&>button]:hidden"
                                        >
                                            <SheetTitle className="sr-only">
                                                Navigation menu
                                            </SheetTitle>
                                            <SheetDescription className="sr-only">
                                                Browse app sections, open your profile, and sign out.
                                            </SheetDescription>
                                            <div className="flex h-full flex-col overflow-hidden">
                                                <div className="flex items-center gap-3 border-b border-neutral-200 px-3 py-2.5">
                                                    <SheetClose asChild>
                                                        <button
                                                            type="button"
                                                            aria-label="Close navigation menu"
                                                            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100"
                                                        >
                                                            <Menu className="h-5 w-5" />
                                                        </button>
                                                    </SheetClose>
                                                    <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
                                                        Menu
                                                    </span>
                                                </div>

                                                <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-5 pt-3.5">
                                                    <SheetClose asChild>
                                                        <Link
                                                            href={settingsNavItem.href}
                                                            className="flex items-center gap-3 rounded-lg px-3 py-3 outline-none transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100"
                                                        >
                                                            <UserAvatar
                                                                user={user}
                                                                className="h-11 w-11 shrink-0 border border-neutral-200"
                                                            />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-[15px] font-semibold tracking-tight text-neutral-950">
                                                                    {getDisplayName(user)}
                                                                </span>
                                                                <span className="mt-0.5 block truncate text-[13px] text-neutral-500">
                                                                    {user?.email || '@user'}
                                                                </span>
                                                                <span className="mt-1 block text-[12px] font-medium text-neutral-500">
                                                                    Profile & preferences
                                                                </span>
                                                            </span>
                                                        </Link>
                                                    </SheetClose>

                                                    <div className="mt-2 h-px bg-neutral-200" />

                                                    <div className="mt-4 space-y-4">
                                                        {navigationSections.map((section) => (
                                                            <section key={section.id} className="space-y-1.5">
                                                                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                                                                    {section.label}
                                                                </p>
                                                                <div className="space-y-0.5">
                                                                    {section.items.map(renderDrawerMenuItem)}
                                                                </div>
                                                            </section>
                                                        ))}
                                                    </div>

                                                    <section className="mt-4 space-y-1.5">
                                                        <div className="h-px bg-neutral-200" />
                                                        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                                                            Account
                                                        </p>
                                                        <SheetClose asChild>
                                                            <button
                                                                type="button"
                                                                onClick={handleSignOut}
                                                                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] text-red-600 outline-none transition-colors hover:bg-red-50 focus-visible:bg-red-50"
                                                            >
                                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-500">
                                                                    <LogOut className="h-[18px] w-[18px]" />
                                                                </span>
                                                                <span className="font-medium tracking-tight">Sign out</span>
                                                            </button>
                                                        </SheetClose>
                                                    </section>
                                                </div>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
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
                                    {currentRole === 'tenant' && (
                                        <>
                                            <div className="hidden sm:flex">
                                                {renderBecomeLandlordLink()}
                                            </div>
                                            <div className="sm:hidden">
                                                {renderBecomeLandlordLink({ iconOnly: true })}
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
                                            className="mt-2 w-[16.5rem] rounded-[24px] border border-neutral-100/50 bg-white/90 p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)] backdrop-blur-2xl"
                                            align="end"
                                        >
                                            <div className="px-3.5 py-3.5">
                                                <p className="text-[15px] font-semibold tracking-tight text-neutral-900">
                                                    {getDisplayName(user)}
                                                </p>
                                                <p className="mt-0.5 truncate text-[13px] font-medium text-neutral-500">
                                                    {user.email}
                                                </p>
                                            </div>

                                            <DropdownMenuSeparator className="mx-2 my-1 bg-neutral-100" />

                                            <DropdownMenuItem
                                                className="cursor-pointer flex items-center rounded-[14px] px-3.5 py-3 text-[15px] font-medium tracking-tight text-neutral-900 outline-none transition-colors focus:bg-neutral-100/80"
                                                onClick={() => router.push(settingsNavItem.href)}
                                            >
                                                <SettingsIcon className="mr-3.5 h-[18px] w-[18px] text-neutral-500" />
                                                {settingsNavItem.label}
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={handleSignOut}
                                                className="cursor-pointer flex items-center rounded-[14px] px-3.5 py-3 text-[15px] font-medium tracking-tight text-red-600 outline-none transition-colors focus:bg-red-50"
                                            >
                                                <LogOut className="mr-3.5 h-[18px] w-[18px] text-red-500" />
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
