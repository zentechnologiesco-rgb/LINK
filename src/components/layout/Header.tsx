'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { toast } from 'sonner'
import { getDisplayName, getInitials } from '@/lib/user-name'
import {
    Menu,
    User,
    Settings,
    LogOut,
    Building2,
    Heart,
    MessageSquare,
    LayoutDashboard,
    Wallet,
    FileText,
} from 'lucide-react'

interface HeaderProps {
    user?: any
    userRole?: 'tenant' | 'landlord' | 'admin' | null
    isLoading?: boolean
}

export function Header({ user, userRole, isLoading }: HeaderProps) {
    const router = useRouter()
    const { signOut } = useAuthActions()
    const [isScrolled, setIsScrolled] = useState(false)

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

    const totalNotifications = unreadCount + leaseActionCount

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSignOut = async () => {
        try {
            await signOut()
            router.push('/')
            router.refresh()
            toast.success('Signed out successfully')
        } catch (error) {
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
                <div className="max-w-[1200px] mx-auto px-4 sm:px-5">
                    <div className="flex items-center h-16 md:h-20">
                        {/* Left Side: Hamburger Menu */}
                        <div className="flex-1 flex justify-start">
                            {user && (
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
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {/* Center: Logo */}
                        <div className="flex-1 flex justify-center">
                            <Link
                                href="/"
                                className="flex items-center"
                            >
                                <span className="font-bold text-2xl md:text-[28px] tracking-tight text-neutral-900">
                                    Link.
                                </span>
                            </Link>
                        </div>

                        {/* Right Side: Avatar */}
                        <div className="flex-1 flex justify-end">
                            {isLoading ? (
                                <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                            ) : user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="relative outline-none">
                                            <Avatar className="h-9 w-9 sm:h-10 sm:h-10 border-2 border-white shadow-sm ring-1 ring-neutral-100">
                                                <AvatarImage src={user.avatarUrl} alt={user.email || ''} className="object-cover" />
                                                <AvatarFallback className="bg-neutral-900 text-white font-medium text-xs">
                                                    {getInitials(user) || user.email?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
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
