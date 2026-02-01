'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search, Heart, MessageSquare, User, Building2, LayoutDashboard } from 'lucide-react'

interface MobileNavProps {
    user?: any
    userRole?: 'tenant' | 'landlord' | 'admin' | null
}

const tenantNavItems = [
    { label: 'Explore', href: '/', icon: Search },
    { label: 'Saved', href: '/tenant/saved', icon: Heart },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
    { label: 'Profile', href: '/settings', icon: User },
]

const landlordNavItems = [
    { label: 'Explore', href: '/', icon: Search },
    { label: 'Properties', href: '/landlord/properties', icon: Building2 },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
    { label: 'Profile', href: '/settings', icon: User },
]

const adminNavItems = [
    { label: 'Explore', href: '/', icon: Search },
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
    { label: 'Profile', href: '/settings', icon: User },
]

const guestNavItems = [
    { label: 'Explore', href: '/', icon: Search },
    { label: 'Sign In', href: '/sign-in', icon: User },
]

export function MobileNav({ user, userRole }: MobileNavProps) {
    const pathname = usePathname()
    const currentRole = userRole || user?.role

    let items = guestNavItems
    if (user) {
        if (currentRole === 'landlord') items = landlordNavItems
        else if (currentRole === 'admin') items = adminNavItems
        else items = tenantNavItems
    }

    // Dashboard pages check removed to allow global usage
    // const isDashboard = pathname?.startsWith('/landlord') || ...

    return (
        <>
            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="h-16 md:hidden" />

            {/* Fixed Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-neutral-100 md:hidden safe-area-bottom">
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
                                    'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200',
                                    isActive
                                        ? 'text-neutral-900'
                                        : 'text-neutral-400 hover:text-neutral-600'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-6 w-6 transition-all duration-200',
                                        isActive && 'scale-105'
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={cn(
                                    'text-[10px]',
                                    isActive ? 'font-bold' : 'font-medium'
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
