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


interface BottomNavProps {
    userRole?: 'tenant' | 'landlord' | 'admin' | null
    user?: any
}

export function BottomNav({ userRole, user }: BottomNavProps) {
    const pathname = usePathname()
    const router = useRouter()


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
                                    active ? "text-black" : "text-black/40 hover:text-black hover:bg-black/5"
                                )}
                            >
                                <item.icon strokeWidth={active ? 3 : 2.5} className="h-6 w-6 shrink-0" />
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}

