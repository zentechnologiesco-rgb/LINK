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
}

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    badge?: number
    tag?: string
}

// General navigation for all users
const generalNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
]

// Tenant-specific navigation
const tenantNavItems: NavItem[] = [
    { label: 'My Favorites', href: '/tenant/saved', icon: Heart },
    { label: 'My Leases', href: '/tenant/leases', icon: FileCheck },
    { label: 'Payments', href: '/tenant/payments', icon: Wallet },
]

// Landlord-specific navigation
const landlordNavItems: NavItem[] = [
    { label: 'My Properties', href: '/landlord/properties', icon: Building2 },
    { label: 'Leases', href: '/landlord/leases', icon: FileCheck },
    { label: 'Payments', href: '/landlord/payments', icon: Wallet, tag: 'Soon' },
]

// Admin-specific navigation
const adminNavItems: NavItem[] = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'All Properties', href: '/admin/properties', icon: Building2 },
    { label: 'Property Requests', href: '/admin/property-requests', icon: Shield },
    { label: 'Landlord Requests', href: '/admin/landlord-requests', icon: ClipboardList },
    { label: 'System Reports', href: '/admin/reports', icon: FileText },
]

export function Sidebar({ collapsed, onToggle, userRole, user, isLoading, onItemClick }: SidebarProps) {
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
                'bg-transparent md:bg-sidebar/0', // Transparent on desktop to blend with body, handled by wrapper on mobile if needed
                collapsed ? 'w-[80px]' : 'w-[260px]'
            )}
        >
            {/* Brand Header */}
            <div className={cn(
                "flex items-center h-20 px-6 transition-all duration-300",
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
                        <span className="font-black text-2xl tracking-tighter text-lime-500">
                            L
                        </span>
                    ) : (
                        <span className="font-black text-3xl tracking-tighter text-lime-500">
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
                            <h3 className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-widest">
                                Menu
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {generalNavItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => onItemClick?.()}
                                            className={cn(
                                                'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out',
                                                active
                                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm ring-1 ring-sidebar-border'
                                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                                                collapsed && 'justify-center px-0 w-10 h-10 mx-auto aspect-square'
                                            )}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <item.icon className={cn(
                                                "h-[1.15rem] w-[1.15rem] transition-colors",
                                                active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
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
                            {!collapsed && <Skeleton className="h-4 w-24 mb-4 bg-sidebar-accent" />}
                            <Skeleton className="h-9 w-full rounded-lg bg-sidebar-accent" />
                            <Skeleton className="h-9 w-full rounded-lg bg-sidebar-accent" />
                            <Skeleton className="h-9 w-full rounded-lg bg-sidebar-accent" />
                        </div>
                    ) : user && roleNavItems.length > 0 && (
                        <div>
                            {!collapsed && (
                                <h3 className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-widest">
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
                                                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out',
                                                    active
                                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm ring-1 ring-sidebar-border'
                                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                                                    collapsed && 'justify-center px-0 w-10 h-10 mx-auto aspect-square'
                                                )}
                                                title={collapsed ? item.label : undefined}
                                            >
                                                <item.icon className={cn(
                                                    "h-[1.15rem] w-[1.15rem] transition-colors",
                                                    active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                                                )} />
                                                {!collapsed && (
                                                    <span className="text-sm flex-1">{item.label}</span>
                                                )}
                                                {!collapsed && item.tag && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-lime-100 text-lime-700">
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
                                'relative overflow-hidden group flex flex-col items-center justify-center gap-3 rounded-xl p-5 transition-all duration-300',
                                'bg-gradient-to-br from-lime-500 to-lime-600 text-white shadow-lg shadow-lime-500/20',
                                'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
                                collapsed ? 'p-2 bg-none bg-transparent text-lime-600 shadow-none hover:bg-lime-50' : ''
                            )}
                            title="Become a Landlord"
                        >
                            {!collapsed && (
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}

                            <div className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300',
                                collapsed ? 'bg-lime-100 text-lime-600' : 'bg-white/20 text-white group-hover:scale-110'
                            )}>
                                <Building2 className="h-4 w-4" />
                            </div>

                            {!collapsed && (
                                <div className="text-center relative z-10">
                                    <p className="text-sm font-bold">Start Listing</p>
                                    <p className="text-[10px] text-lime-50 font-medium mt-0.5">Become a Landlord today</p>
                                </div>
                            )}
                        </Link>
                    </div>
                )}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-sidebar-border">
                {isLoading ? (
                    <div className={cn("flex items-center gap-3 w-full p-2", collapsed && 'justify-center')}>
                        <Skeleton className="h-9 w-9 rounded-full bg-sidebar-accent" />
                        {!collapsed && (
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-20 bg-sidebar-accent" />
                                <Skeleton className="h-2 w-24 bg-sidebar-accent" />
                            </div>
                        )}
                    </div>
                ) : user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    'group flex items-center gap-3 w-full p-2 rounded-xl transition-all duration-200',
                                    'hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent',
                                    collapsed ? 'justify-center px-0' : 'text-left'
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="h-9 w-9 border border-sidebar-border shadow-sm">
                                        <AvatarImage src={user.avatarUrl} alt={user.email || ''} />
                                        <AvatarFallback className="bg-primary/5 text-primary font-medium text-xs">
                                            {getInitials(user) || user.email?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
                                </div>

                                {!collapsed && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-sidebar-foreground truncate">
                                            {getDisplayName(user) || 'User'}
                                        </p>
                                        <p className="text-[11px] text-sidebar-foreground/60 truncate capitalize">
                                            {currentRole || 'Guest'}
                                        </p>
                                    </div>
                                )}

                                {!collapsed && (
                                    <MoreHorizontal className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground transition-colors" />
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-64 p-2 rounded-xl border-sidebar-border shadow-2xl shadow-black/10 bg-sidebar/95 backdrop-blur-xl"
                            align="start"
                            side="right"
                            sideOffset={20}
                        >
                            <div className="flex items-center gap-3 p-2 mb-1 bg-sidebar-accent/50 rounded-lg">
                                <Avatar className="h-10 w-10 border border-sidebar-border shadow-sm">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {getInitials(user)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-sidebar-foreground truncate">
                                        {getDisplayName(user)}
                                    </p>
                                    <p className="text-xs text-sidebar-foreground/60 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            <DropdownMenuSeparator className="bg-sidebar-border" />

                            <DropdownMenuItem className="cursor-pointer rounded-lg p-2.5 text-sm focus:bg-sidebar-accent focus:text-sidebar-accent-foreground" onClick={() => router.push('/settings')}>
                                <Settings className="mr-2 h-4 w-4 text-sidebar-foreground/70" />
                                <span className="font-medium">Settings</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-sidebar-border" />

                            <DropdownMenuItem
                                onClick={handleSignOut}
                                className="cursor-pointer rounded-lg p-2.5 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span className="font-medium">Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex flex-col gap-2">
                        <Link href="/sign-in" onClick={() => onItemClick?.()}>
                            <Button className={cn(
                                "w-full rounded-xl bg-lime-500 text-white shadow-lg shadow-lime-500/20 hover:bg-lime-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300",
                                collapsed && "h-10 w-10 p-0"
                            )}>
                                {collapsed ? <User className="h-5 w-5" /> : "Sign In"}
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Collapse Toggle */}
                {!collapsed && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggle}
                        className="w-full mt-2 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent justify-between group h-8"
                    >
                        <span className="text-[10px] uppercase font-bold tracking-wider">Collapse</span>
                        <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    </Button>
                )}
                {collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="w-full mt-2 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </aside>
    )
}
