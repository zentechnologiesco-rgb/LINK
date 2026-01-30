'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthActions } from "@convex-dev/auth/react"
import { toast } from 'sonner'
import { getDisplayName, getInitials } from '@/lib/user-name'
import {
    LayoutDashboard,
    BarChart3,
    FileText,
    MessageSquare,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Plus,
    Mail,
    Home,
    Building2,
    FileCheck,
    Settings,
    Search,
    Heart,
    LogOut,
    User,
    Wallet,
    ClipboardList,
    Shield,
    Users,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
    userRole?: 'tenant' | 'landlord' | 'admin' | null
    user?: any
    isLoading?: boolean
    onItemClick?: () => void
    showCollapseToggle?: boolean
}

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    badge?: number
    tag?: string
}

// Public navigation for all users (visible even when not logged in)
import {
    publicNavItems,
    authenticatedNavItems,
    tenantNavItems,
    landlordNavItems,
    adminNavItems
} from '@/config/navigation'

export function Sidebar({ collapsed, onToggle, userRole, user, isLoading, onItemClick, showCollapseToggle = true }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useAuthActions()

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/'
        }
        return pathname?.startsWith(href)
    }

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

    // Determine which role-specific nav items to show
    const currentRole = userRole || user?.role

    const roleNavItems = currentRole === 'landlord' ? landlordNavItems :
        currentRole === 'tenant' ? tenantNavItems :
            currentRole === 'admin' ? adminNavItems :
                []

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col',
                'bg-gray-50', // Consistent gray background, no border
                collapsed ? 'w-[60px]' : 'w-[200px]'
            )}
        >
            {/* Brand Header */}
            <div className={cn(
                "flex items-center h-20 pt-6 pb-4 px-6 transition-all duration-300",
                collapsed ? "justify-center px-0" : "justify-start"
            )}>
                <Link
                    href="/"
                    onClick={() => onItemClick?.()}
                    className={cn(
                        "flex items-center gap-3 transition-transform duration-300 hover:scale-105 active:scale-95",
                        collapsed && "justify-center"
                    )}
                >
                    {collapsed ? (
                        <span className="font-[family-name:var(--font-anton)] text-2xl tracking-wide text-black dark:text-white">
                            L
                        </span>
                    ) : (
                        <span className="font-[family-name:var(--font-anton)] text-4xl tracking-wide text-black dark:text-white">
                            LINK
                        </span>
                    )}
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-6 overflow-y-auto scrollbar-hide">
                <div className="space-y-6">
                    {/* General Navigation */}
                    <div>
                        {!collapsed && (
                            <h3 className="px-3 mb-2 text-xs font-bold text-black/60 uppercase tracking-widest font-[family-name:var(--font-anton)]">
                                Menu
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {publicNavItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => onItemClick?.()}
                                            className={cn(
                                                'group flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200 ease-in-out hover:bg-black/5',
                                                active
                                                    ? 'text-black font-bold'
                                                    : 'text-black/60 font-medium hover:text-black',
                                                collapsed && 'justify-center px-0 w-12 h-12 mx-auto aspect-square'
                                            )}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <item.icon strokeWidth={active ? 3 : 2} className={cn(
                                                "h-6 w-6 transition-colors",
                                                active ? "text-black" : "text-black/60 group-hover:text-black"
                                            )} />
                                            {!collapsed && (
                                                <span className="text-sm">{item.label}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                            {/* Authenticated-only items (Messages) */}
                            {user && authenticatedNavItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => onItemClick?.()}
                                            className={cn(
                                                'group flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200 ease-in-out hover:bg-black/5',
                                                active
                                                    ? 'text-black font-bold'
                                                    : 'text-black/60 font-medium hover:text-black',
                                                collapsed && 'justify-center px-0 w-12 h-12 mx-auto aspect-square'
                                            )}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <item.icon strokeWidth={active ? 3 : 2} className={cn(
                                                "h-6 w-6 transition-colors",
                                                active ? "text-black" : "text-black/60 group-hover:text-black"
                                            )} />
                                            {!collapsed && (
                                                <span className="text-sm">{item.label}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Role-specific Navigation */}
                    {isLoading ? (
                        <div className="space-y-3 pt-4 px-3">
                            {!collapsed && <Skeleton className="h-4 w-24 mb-4 bg-black/10" />}
                            <Skeleton className="h-9 w-full rounded-lg bg-black/5" />
                            <Skeleton className="h-9 w-full rounded-lg bg-black/5" />
                            <Skeleton className="h-9 w-full rounded-lg bg-black/5" />
                        </div>
                    ) : user && roleNavItems.length > 0 && (
                        <div>
                            {!collapsed && (
                                <h3 className="px-3 mb-2 text-xs font-bold text-black/60 uppercase tracking-widest font-[family-name:var(--font-anton)]">
                                    {currentRole}
                                </h3>
                            )}
                            <ul className="space-y-1">
                                {roleNavItems.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => onItemClick?.()}
                                                className={cn(
                                                    'group flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200 ease-in-out hover:bg-black/5',
                                                    active
                                                        ? 'text-black font-bold'
                                                        : 'text-black/60 font-medium hover:text-black',
                                                    collapsed && 'justify-center px-0 w-12 h-12 mx-auto aspect-square'
                                                )}
                                                title={collapsed ? item.label : undefined}
                                            >
                                                <item.icon strokeWidth={active ? 3 : 2} className={cn(
                                                    "h-6 w-6 transition-colors",
                                                    active ? "text-black" : "text-black/60 group-hover:text-black"
                                                )} />
                                                {!collapsed && (
                                                    <span className="text-sm flex-1">{item.label}</span>
                                                )}
                                                {!collapsed && item.tag && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-900 border-none">
                                                        {item.tag}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Tenant: Become a Landlord CTA */}
                {!isLoading && currentRole === 'tenant' && (
                    <div className="mt-8 px-2">
                        <Link
                            href="/become-landlord"
                            onClick={() => onItemClick?.()}
                            className={cn(
                                'relative overflow-hidden group flex flex-col items-center justify-center rounded-xl transition-all duration-300',
                                'border border-dashed border-black/10 hover:border-black bg-gray-50 hover:bg-[#a9ff3c]/10',
                                collapsed ? 'w-10 h-10 mx-auto p-0 border-transparent hover:border-black' : 'p-4 gap-3'
                            )}
                            title="Become a Landlord"
                        >
                            <div className={cn(
                                'flex items-center justify-center rounded-lg transition-all duration-300',
                                collapsed ? 'text-black/60 group-hover:text-black' : 'h-8 w-8 bg-black/5 text-black group-hover:bg-black group-hover:text-[#a9ff3c]'
                            )}>
                                <Building2 className={cn("transition-all", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                            </div>

                            {!collapsed && (
                                <div className="text-center relative z-10">
                                    <p className="text-sm font-bold text-black group-hover:text-black">Start Listing</p>
                                    <p className="text-[10px] text-black/40 font-medium mt-0.5 group-hover:text-black/60">Become a Landlord today</p>
                                </div>
                            )}
                        </Link>
                    </div>
                )}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 mt-auto">
                {isLoading ? (
                    <div className={cn("flex items-center gap-3 w-full p-2", collapsed && 'justify-center')}>
                        <Skeleton className="h-9 w-9 rounded-full bg-black/5" />
                        {!collapsed && (
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-20 bg-black/5" />
                                <Skeleton className="h-2 w-24 bg-black/5" />
                            </div>
                        )}
                    </div>
                ) : user ? (
                    <div className={cn("flex items-center gap-2 w-full", collapsed && "justify-center")}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        'group flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-black/5',
                                        collapsed ? 'justify-center px-0 w-full' : 'flex-1 text-left min-w-0'
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="h-8 w-8 border-none opacity-90 group-hover:opacity-100 transition-opacity">
                                            <AvatarImage src={user.avatarUrl} alt={user.email || ''} className="object-cover" />
                                            <AvatarFallback className="bg-gray-100 text-gray-600 font-medium text-xs">
                                                {getInitials(user) || user.email?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    {!collapsed && (
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-black/90 truncate group-hover:text-black">
                                                {getDisplayName(user) || 'User'}
                                            </p>
                                            <p className="text-[11px] text-black/40 truncate capitalize">
                                                {currentRole || 'Guest'}
                                            </p>
                                        </div>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-60 p-2 rounded-2xl border border-black/5 bg-white shadow-xl shadow-black/5 z-50"
                                align="start"
                                side="right"
                                sideOffset={12}
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

                        {!collapsed && (
                            <button
                                onClick={onToggle}
                                className="p-2 rounded-lg text-black/20 hover:text-black hover:bg-black/5 transition-all shrink-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <Link href="/sign-in" onClick={() => onItemClick?.()}>
                            <Button className={cn(
                                "w-full rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800 h-9",
                                collapsed && "h-9 w-9 p-0"
                            )}>
                                {collapsed ? <User className="h-4 w-4" /> : "Sign In"}
                            </Button>
                        </Link>
                        {/* Collapse Toggle for Guest */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggle}
                            className={cn(
                                "w-full text-black/40 hover:text-black h-8",
                                collapsed ? "p-0" : "justify-between px-2"
                            )}
                        >
                            {!collapsed && <span className="text-[10px] uppercase font-medium tracking-wider">Close</span>}
                            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    </div>
                )}

                {/* Collapse Toggle */}
                {showCollapseToggle && !collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="h-8 w-8 rounded-full bg-black/5 hover:bg-black/10 text-black/60 hover:text-black transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
                {/* Guest Collapse Toggle */}
                {showCollapseToggle && collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="h-8 w-8 rounded-full bg-black/5 hover:bg-black/10 text-black/60 hover:text-black transition-all"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </aside>
    )
}
