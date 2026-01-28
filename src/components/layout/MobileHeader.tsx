'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Settings, Building2, User as UserIcon } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { getDisplayName, getInitials } from '@/lib/user-name'

interface MobileHeaderProps {
    userRole?: 'tenant' | 'landlord' | 'admin' | null
    user?: any
}

export function MobileHeader({ userRole, user }: MobileHeaderProps) {
    const router = useRouter()
    const { signOut } = useAuthActions()

    // Determine role (fallback to user.role if not passed directly, though AppLayout passes it)
    const currentRole = userRole || user?.role

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-black/5 md:hidden">
            {/* Logo */}
            <Link href="/" className="flex items-center">
                <span className="text-xl font-bold tracking-tight text-black">LINK</span>
            </Link>

            {/* Profile Section */}
            <div>
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative outline-none group">
                                <Avatar className="h-9 w-9 border border-black/5 transition-all group-hover:border-black/20">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback className="bg-black/5 text-black font-medium text-xs">
                                        {getInitials(user)}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="bottom"
                            align="end"
                            className="w-56 p-2 rounded-2xl border border-black/5 bg-white mt-1 shadow-lg shadow-black/5"
                        >
                            <div className="px-3 py-2 mb-1">
                                <p className="text-sm font-semibold text-black/90">
                                    {getDisplayName(user)}
                                </p>
                                <p className="text-[11px] text-black/40 font-medium truncate mt-0.5">
                                    {user.email}
                                </p>
                            </div>

                            <div className="space-y-0.5">
                                {currentRole === 'tenant' && (
                                    <>
                                        <DropdownMenuItem
                                            className="cursor-pointer rounded-xl px-3 py-2 text-xs font-medium text-black/90 focus:text-black focus:bg-black/5 transition-colors mb-1"
                                            onClick={() => router.push('/become-landlord')}
                                        >
                                            <Building2 className="mr-2 h-3.5 w-3.5 text-black" />
                                            Start Listing
                                        </DropdownMenuItem>
                                        <div className="h-px bg-black/5 mx-2 my-1" />
                                    </>
                                )}

                                <DropdownMenuItem
                                    className="cursor-pointer rounded-xl px-3 py-2 text-xs font-medium text-black/70 focus:text-black focus:bg-black/5 transition-colors"
                                    onClick={() => router.push('/settings')}
                                >
                                    <Settings className="mr-2 h-3.5 w-3.5 opacity-70" />
                                    Account Settings
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="cursor-pointer rounded-xl px-3 py-2 text-xs font-medium text-red-600/80 focus:text-red-600 focus:bg-red-50/50 transition-colors"
                                >
                                    <LogOut className="mr-2 h-3.5 w-3.5 opacity-70" />
                                    Sign Out
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Link href="/sign-in">
                        <div className="p-2 bg-black text-white rounded-xl hover:bg-zinc-800 transition-all">
                            <UserIcon className="h-5 w-5" />
                        </div>
                    </Link>
                )}
            </div>
        </header>
    )
}
