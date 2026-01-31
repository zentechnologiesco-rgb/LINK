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
        return '/tenant'
    }

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                    isScrolled
                        ? 'bg-white/80 backdrop-blur-md border-b border-neutral-200/60'
                        : 'bg-transparent border-b border-transparent'
                )}
            >
                <div className="max-w-[2000px] mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="flex items-center gap-2 shrink-0"
                        >
                            <span className="font-[family-name:var(--font-anton)] text-2xl md:text-3xl tracking-wide text-black">
                                LINK
                            </span>
                        </Link>

                        {/* Right Side */}
                        <div className="flex items-center gap-2 md:gap-3">
                            {/* Become a Host - Desktop */}
                            {user && currentRole === 'tenant' && (
                                <Link href="/become-landlord" className="hidden md:block">
                                    <Button
                                        variant="ghost"
                                        className="rounded-full text-sm font-medium hover:bg-gray-100"
                                    >
                                        Become a Host
                                    </Button>
                                </Link>
                            )}

                            {/* User Menu */}
                            {isLoading ? (
                                <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                            ) : user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 p-1 pr-2 md:pr-3 rounded-full hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">
                                            <Menu className="h-4 w-4 ml-2 text-neutral-600" />
                                            <Avatar className="h-8 w-8 border-none">
                                                <AvatarImage src={user.avatarUrl} alt={user.email || ''} className="object-cover" />
                                                <AvatarFallback className="bg-gray-900 text-white font-medium text-xs">
                                                    {getInitials(user) || user.email?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-64 p-2 rounded-2xl border border-black/5 bg-white shadow-xl shadow-black/10 mt-2"
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

                                        <DropdownMenuSeparator className="bg-black/5" />

                                        {/* Dashboard - Tenant and Admin only (landlords go directly to My Properties) */}
                                        {currentRole !== 'landlord' && (
                                            <DropdownMenuItem
                                                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                                onClick={() => router.push(getDashboardLink())}
                                            >
                                                <LayoutDashboard className="mr-3 h-4 w-4 opacity-70" />
                                                Dashboard
                                            </DropdownMenuItem>
                                        )}

                                        {/* Tenant-specific links */}
                                        {currentRole === 'tenant' && (
                                            <>
                                                <DropdownMenuItem
                                                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                                    onClick={() => router.push('/tenant/saved')}
                                                >
                                                    <Heart className="mr-3 h-4 w-4 opacity-70" />
                                                    Saved Properties
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                                    onClick={() => router.push('/tenant/applications')}
                                                >
                                                    <Building2 className="mr-3 h-4 w-4 opacity-70" />
                                                    My Applications
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        {/* Landlord-specific links */}
                                        {currentRole === 'landlord' && (
                                            <>
                                                <DropdownMenuItem
                                                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                                    onClick={() => router.push('/landlord/properties')}
                                                >
                                                    <Building2 className="mr-3 h-4 w-4 opacity-70" />
                                                    My Properties
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                                    onClick={() => router.push('/landlord/leases')}
                                                >
                                                    <Heart className="mr-3 h-4 w-4 opacity-70" />
                                                    Leases
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        {/* Admin-specific links */}
                                        {currentRole === 'admin' && (
                                            <>
                                                <DropdownMenuItem
                                                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                                    onClick={() => router.push('/admin/properties')}
                                                >
                                                    <Building2 className="mr-3 h-4 w-4 opacity-70" />
                                                    Manage Properties
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                                    onClick={() => router.push('/admin/landlord-requests')}
                                                >
                                                    <User className="mr-3 h-4 w-4 opacity-70" />
                                                    Verification Queue
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        {/* Messages - All Roles */}
                                        <DropdownMenuItem
                                            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                            onClick={() => router.push('/chat')}
                                        >
                                            <MessageSquare className="mr-3 h-4 w-4 opacity-70" />
                                            Messages
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator className="bg-black/5" />

                                        <DropdownMenuItem
                                            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-black focus:bg-gray-100 transition-colors"
                                            onClick={() => router.push('/settings')}
                                        >
                                            <Settings className="mr-3 h-4 w-4 opacity-70" />
                                            Settings
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={handleSignOut}
                                            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-black/80 focus:text-red-600 focus:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="mr-3 h-4 w-4 opacity-70" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/sign-in">
                                        <Button
                                            variant="ghost"
                                            className="rounded-full text-sm font-medium hover:bg-gray-100"
                                        >
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Link href="/sign-up" className="hidden md:block">
                                        <Button className="rounded-full bg-black hover:bg-gray-800 text-white text-sm font-medium px-5">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </div>
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
