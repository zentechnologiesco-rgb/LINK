'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    publicNavItems,
    authenticatedNavItems,
    tenantNavItems,
    landlordNavItems,
    adminNavItems,
    NavItem
} from '@/config/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, User as UserIcon, Wallet, Building2 } from 'lucide-react'
import { useAuthActions } from "@convex-dev/auth/react"
import { getDisplayName, getInitials } from '@/lib/user-name'

interface BottomNavProps {
    userRole?: 'tenant' | 'landlord' | 'admin' | null
    user?: any
}

export function BottomNav({ userRole, user }: BottomNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useAuthActions()

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/'
        }
        return pathname?.startsWith(href)
    }

    // Determine role-specific items
    const currentRole = userRole || user?.role
    const roleItems = currentRole === 'landlord' ? landlordNavItems :
        currentRole === 'tenant' ? tenantNavItems :
            currentRole === 'admin' ? adminNavItems : []

    // Combine ALL items to match Sidebar parity
    const displayItems = [
        ...publicNavItems,
        ...(user ? authenticatedNavItems : []),
        ...roleItems
    ]

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 md:hidden pointer-events-none">
            <nav className="bg-gray-50/90 backdrop-blur-xl text-black rounded-2xl p-1.5 border border-black/5 flex items-center gap-1 pointer-events-auto transition-transform duration-300 w-full max-w-sm">

                {/* Navigation Items - Flexible Grid */}
                <div className="flex items-center justify-between flex-1 gap-1 px-1">
                    {displayItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all duration-300 relative group min-w-0",
                                    active ? "text-black bg-black/5" : "text-black/40 hover:text-black hover:bg-black/5"
                                )}
                            >
                                <item.icon strokeWidth={2.5} className="h-5 w-5 shrink-0" />
                                {active && (
                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#a9ff3c] ring-2 ring-white" />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-black/5 flex-shrink-0 mx-1" />

                {/* Profile Popup */}
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative outline-none group shrink-0 pr-1">
                                <Avatar className="h-10 w-10 border border-black/5 transition-all group-hover:border-black/20">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback className="bg-black/5 text-black font-medium text-xs">
                                        {getInitials(user)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-1 h-2.5 w-2.5 rounded-full bg-[#a9ff3c] ring-2 ring-white" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="top"
                            align="end"
                            className="w-60 p-2 rounded-2xl border border-black/5 bg-white mb-2"
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

                                <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2 text-xs font-medium text-black/70 focus:text-black focus:bg-black/5 transition-colors" onClick={() => router.push('/settings')}>
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
                    <Link href="/sign-in" className="shrink-0 pr-1">
                        <div className="p-2.5 bg-black text-white rounded-xl hover:bg-gray-900 transition-all">
                            <UserIcon className="h-5 w-5" />
                        </div>
                    </Link>
                )}
            </nav>
        </div>
    )
}

