'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type AvatarIdentity } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthActions } from "@convex-dev/auth/react"
import { toast } from 'sonner'
import { getDisplayName } from '@/lib/user-name'
import { useNotificationCounts } from '@/components/providers/NotificationCountsProvider'
import {
    Bell,
    Menu,
    Settings,
    LogOut,
    Building2,
    Heart,
    MessageSquare,
    LayoutDashboard,
    FileText,
} from 'lucide-react'

interface HeaderProps {
    user?: (AvatarIdentity & {
        email?: string | null
        role?: 'tenant' | 'landlord' | 'admin' | null
    }) | null
    userRole?: 'tenant' | 'landlord' | 'admin' | null
    isLoading?: boolean
}

export function Header({ user, userRole, isLoading }: HeaderProps) {
    const router = useRouter()
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

    const currentRole = userRole || user?.role

    // Get dashboard link based on role
    const getDashboardLink = () => {
        if (currentRole === 'landlord') return '/landlord/properties'
        if (currentRole === 'admin') return '/admin'
        return '/tenant/saved'
    }

    const getNotificationLink = () => {
        if (leaseActionCount > 0) {
            if (currentRole === 'landlord') return '/landlord/leases'
            if (currentRole === 'tenant') return '/tenant/leases'
        }

        if (unreadCount > 0) return '/chat'
        if (currentRole === 'admin') return '/admin'
        return '/chat'
    }

    const renderNavigationMenuItems = () => (
        <>
            {currentRole === 'admin' && (
                <DropdownMenuItem
                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                    onClick={() => router.push(getDashboardLink())}
                >
                    <LayoutDashboard className="mr-3 h-4 w-4 opacity-70" />
                    Dashboard
                </DropdownMenuItem>
            )}

            {currentRole === 'tenant' && (
                <>
                    <DropdownMenuItem
                        className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                        onClick={() => router.push('/tenant/saved')}
                    >
                        <Heart className="mr-3 h-4 w-4 opacity-70" />
                        Saved Properties
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                        onClick={() => router.push('/tenant/leases')}
                    >
                        <div className="flex items-center flex-1">
                            <FileText className="mr-3 h-4 w-4 opacity-70" />
                            My Leases
                        </div>
                        {leaseActionCount > 0 && (
                            <span className="h-5 min-w-[20px] px-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-2">
                                {leaseActionCount}
                            </span>
                        )}
                    </DropdownMenuItem>
                </>
            )}

            {currentRole === 'landlord' && (
                <>
                    <DropdownMenuItem
                        className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                        onClick={() => router.push('/landlord/properties')}
                    >
                        <Building2 className="mr-3 h-4 w-4 opacity-70" />
                        My Properties
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                        onClick={() => router.push('/landlord/leases')}
                    >
                        <div className="flex items-center flex-1">
                            <FileText className="mr-3 h-4 w-4 opacity-70" />
                            Leases
                        </div>
                        {leaseActionCount > 0 && (
                            <span className="h-5 min-w-[20px] px-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-2">
                                {leaseActionCount}
                            </span>
                        )}
                    </DropdownMenuItem>
                </>
            )}

            <DropdownMenuItem
                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                onClick={() => router.push('/chat')}
            >
                <div className="flex items-center flex-1">
                    <MessageSquare className="mr-3 h-4 w-4 opacity-70" />
                    Messages
                </div>
                {unreadCount > 0 && (
                    <span className="h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-2">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </DropdownMenuItem>
        </>
    )

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
            <span className="font-bold text-[28px] leading-none md:text-[34px] tracking-tight text-neutral-900">
                Link
            </span>
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
                        {/* Left Side: Mobile Logo / Desktop Menu */}
                        <div className="flex items-center gap-2 md:flex-1 md:justify-start md:gap-3">
                            {user && (
                                <div className="hidden md:block">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="relative outline-none">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors">
                                                    <Menu className="h-6 w-6 text-neutral-900" />
                                                </div>
                                                {/* Notification badge on hamburger */}
                                                {totalNotifications > 0 && (
                                                    <span className="absolute top-0 right-0 h-4.5 w-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white z-10">
                                                        {totalNotifications > 9 ? '9+' : totalNotifications}
                                                    </span>
                                                )}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="w-64 p-2 rounded-[20px] border border-neutral-100 bg-white shadow-xl mt-2"
                                            align="start"
                                        >
                                            {renderNavigationMenuItems()}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            {renderBrandLink('md:hidden')}
                        </div>

                        {/* Center: Desktop Logo */}
                        <div className="hidden items-center justify-center md:flex">
                            {renderBrandLink()}
                        </div>

                        {/* Right Side: Avatar */}
                        <div className="ml-auto flex justify-end md:flex-1">
                            {isLoading ? (
                                <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                            ) : user ? (
                                <div className="flex items-center gap-1.5">
                                    <Link
                                        href={getNotificationLink()}
                                        aria-label="Open notifications"
                                        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 shadow-none transition-colors hover:bg-neutral-200 md:hidden"
                                    >
                                        <Bell className="h-5 w-5 stroke-[1.75]" />
                                        {totalNotifications > 0 && (
                                            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full border border-white bg-sky-500" />
                                        )}
                                    </Link>

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
                                            className="w-64 p-2 rounded-[20px] border border-neutral-100 bg-white shadow-xl mt-2"
                                            align="end"
                                        >
                                            <div className="px-3 py-2 mb-1">
                                                <p className="text-sm font-semibold text-black">
                                                    {getDisplayName(user)}
                                                </p>
                                                <p className="text-xs text-black/50 truncate">
                                                    {user.email}
                                                </p>
                                            </div>

                                            <DropdownMenuSeparator className="bg-neutral-100" />

                                            <DropdownMenuItem
                                                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-neutral-50"
                                                onClick={() => router.push('/settings')}
                                            >
                                                <Settings className="mr-3 h-4 w-4 opacity-70" />
                                                Settings
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
                                <Link href="/sign-in">
                                    <Button
                                        variant="outline"
                                        className="rounded-full text-xs font-semibold px-4 border-neutral-200 hover:bg-neutral-50"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-16 md:h-20" />
        </>
    )
}
