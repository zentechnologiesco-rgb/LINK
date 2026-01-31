'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search, Heart, MessageSquare, User } from 'lucide-react'

interface MobileNavProps {
    user?: any
}

const navItems = [
    { label: 'Explore', href: '/', icon: Search },
    { label: 'Saved', href: '/tenant/saved', icon: Heart, requiresAuth: true },
    { label: 'Messages', href: '/chat', icon: MessageSquare, requiresAuth: true },
    { label: 'Profile', href: '/settings', icon: User, requiresAuth: true },
]

const guestNavItems = [
    { label: 'Explore', href: '/', icon: Search },
    { label: 'Sign In', href: '/sign-in', icon: User },
]

export function MobileNav({ user }: MobileNavProps) {
    const pathname = usePathname()

    const items = user ? navItems : guestNavItems

    // Don't show on dashboard pages
    const isDashboard = pathname?.startsWith('/landlord') ||
        pathname?.startsWith('/admin') ||
        pathname?.startsWith('/tenant')

    if (isDashboard) return null

    return (
        <>
            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="h-16 md:hidden" />

            {/* Fixed Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/10 md:hidden safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {items.map((item) => {
                        const isActive = item.href === '/'
                            ? pathname === '/'
                            : pathname?.startsWith(item.href)
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
                                    isActive
                                        ? 'text-black'
                                        : 'text-black/40'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-6 w-6 transition-all',
                                        isActive && 'scale-105'
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={cn(
                                    'text-[10px]',
                                    isActive ? 'font-semibold' : 'font-medium'
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
