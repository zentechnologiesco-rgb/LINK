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
// Note: signout is now handled via Convex useAuthActions hook

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
    userRole?: 'tenant' | 'landlord' | 'admin' | null
    user?: any
    isLoading?: boolean
}

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
}

// General navigation for all users
const generalNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
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
    { label: 'Payments', href: '/landlord/payments', icon: Wallet },
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

// Documents section


export function Sidebar({ collapsed, onToggle, userRole, user, isLoading }: SidebarProps) {
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
    const roleNavItems = userRole === 'landlord' ? landlordNavItems :
        userRole === 'tenant' ? tenantNavItems :
            userRole === 'admin' ? adminNavItems :
                []



    // ... existing code ...

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-gray-100 transition-all duration-300 ease-in-out flex flex-col',
                collapsed ? 'w-[68px]' : 'w-[240px]'
            )}
        >
            {/* Brand Header */}
            <div className="flex items-center justify-between h-14 px-4">
                <Link href="/chat" className={cn("flex items-center gap-2", collapsed && "justify-center")}>
                    <span className={cn("font-bold tracking-tight text-gray-900", collapsed ? "text-sm" : "text-2xl")}>LINK</span>
                </Link>
                {!collapsed && (
                    <Link href="/chat">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600">
                            <Mail className="h-4 w-4" />
                        </Button>
                    </Link>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-2 overflow-y-auto">
                {/* General Navigation */}
                <ul className="space-y-1">
                    {generalNavItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive(item.href)
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900',
                                    collapsed && 'justify-center px-0'
                                )}
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Role-specific Navigation - Only show when logged in */}
                {isLoading ? (
                    <div className="mt-6 space-y-1">
                        {!collapsed && <Skeleton className="h-3 w-20 mb-3 mx-2 bg-gray-200" />}
                        <Skeleton className="h-9 w-full rounded-lg bg-gray-200" />
                        <Skeleton className="h-9 w-full rounded-lg bg-gray-200" />
                        <Skeleton className="h-9 w-full rounded-lg bg-gray-200" />
                    </div>
                ) : user && roleNavItems.length > 0 && (
                    <div className="mt-6">
                        {!collapsed && (
                            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {userRole === 'landlord' ? 'Landlord' : userRole === 'admin' ? 'Admin' : 'Tenant'}
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {roleNavItems.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                            isActive(item.href)
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900',
                                            collapsed && 'justify-center px-0'
                                        )}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {!collapsed && <span>{item.label}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}




            </nav>

            {/* Tenant: Become a Landlord CTA */}
            {!isLoading && userRole === 'tenant' && (
                <div className="px-3 pb-2">
                    <Link
                        href="/become-landlord"
                        className={cn(
                            'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 transition-all hover:border-gray-900 hover:bg-white',
                            collapsed && 'p-2 border-0 bg-transparent hover:bg-gray-100'
                        )}
                        title="Become a Landlord"
                    >
                        <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-200 transition-colors group-hover:ring-gray-900',
                            collapsed && 'bg-transparent shadow-none ring-0'
                        )}>
                            <Building2 className="h-4 w-4 text-gray-900" />
                        </div>
                        {!collapsed && (
                            <div className="text-center">
                                <p className="text-xs font-semibold text-gray-900">Become a Landlord</p>
                                <p className="mt-1 text-[10px] text-gray-500">List properties & earn</p>
                            </div>
                        )}
                    </Link>
                </div>
            )}

            {/* Settings Link - Just above User Profile */}
            {user && (
                <div className="px-3 pt-1">
                    <Link
                        href="/settings"
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive('/settings')
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900',
                            collapsed && 'justify-center px-0'
                        )}
                        title={collapsed ? 'Settings' : undefined}
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>Settings</span>}
                    </Link>
                </div>
            )}

            {/* User Profile / Auth Section */}
            <div className="p-3">
                {isLoading ? (
                    <div className={cn("flex items-center gap-3 w-full px-3 py-2 rounded-lg border border-transparent", collapsed && 'justify-center px-0')}>
                        <Skeleton className="h-7 w-7 rounded-full bg-gray-200" />
                        {!collapsed && (
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-3 w-24 bg-gray-200" />
                                <Skeleton className="h-2 w-32 bg-gray-200" />
                            </div>
                        )}
                    </div>
                ) : user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200/60',
                                    collapsed && 'justify-center px-0'
                                )}
                            >
                                <Avatar className="h-8 w-8 border border-gray-200 shadow-sm">
                                    <AvatarImage src={user.avatarUrl} alt={user.email || ''} />
                                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-xs font-medium">
                                        {getInitials(user) || user.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {!collapsed && (
                                    <div className="flex-1 text-left truncate">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{getDisplayName(user) || user.email}</p>
                                        <p className="text-[10px] text-gray-500 truncate">View Profile</p>
                                    </div>
                                )}
                                {!collapsed && (
                                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-72 p-2 rounded-2xl border-gray-200/60 shadow-xl shadow-gray-200/20 bg-white/95 backdrop-blur-sm"
                            align={collapsed ? "start" : "start"}
                            side={collapsed ? "right" : "right"}
                            sideOffset={collapsed ? 16 : 8}
                        >
                            <div className="flex items-center gap-4 p-3 bg-gray-50/80 rounded-xl mb-2 border border-gray-100/50">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                    <AvatarImage src={user.avatarUrl} alt={user.email || ''} />
                                    <AvatarFallback className="bg-white text-gray-900 font-bold">
                                        {getInitials(user) || user.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold text-gray-900 truncate">
                                        {getDisplayName(user)}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate font-medium">
                                        {user.email}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                            {userRole === 'landlord' ? 'Landlord' : userRole === 'admin' ? 'Admin' : 'Tenant'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-3 pl-3">Account</div>

                            <DropdownMenuItem className="rounded-xl cursor-pointer text-gray-600 focus:bg-gray-50 focus:text-gray-900 py-2.5 px-3" onClick={() => router.push('/settings')}>
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <User className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Profile Settings</span>
                            </DropdownMenuItem>

                            {/* Show Billing for Landlords - placeholder for now */}
                            {userRole !== 'tenant' && (
                                <DropdownMenuItem className="rounded-xl cursor-pointer text-gray-600 focus:bg-gray-50 focus:text-gray-900 py-2.5 px-3" onClick={() => router.push('/settings/billing')}>
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Billing & Payments</span>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="my-2 bg-gray-100/80" />

                            <DropdownMenuItem onClick={handleSignOut} className="rounded-xl cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-2.5 px-3 group">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 mr-3 group-focus:bg-white group-focus:shadow-sm transition-all">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className={cn(
                        'rounded-xl transition-all',
                        collapsed ? 'flex flex-col items-center gap-2' : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/60 p-4'
                    )}>
                        {!collapsed && (
                            <div className="mb-3 text-center">
                                <p className="text-sm font-medium text-gray-900">Welcome to LINK</p>
                                <p className="text-xs text-gray-500 mt-0.5">Sign in to access all features</p>
                            </div>
                        )}
                        <div className={cn('flex gap-2', collapsed ? 'flex-col' : 'flex-col w-full')}>
                            <Link href="/sign-up" className="w-full">
                                <Button
                                    size={collapsed ? 'icon' : 'sm'}
                                    className={cn(
                                        'w-full bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-sm',
                                        collapsed ? 'h-9 w-9' : 'h-9'
                                    )}
                                    title={collapsed ? 'Sign up' : undefined}
                                >
                                    {collapsed ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        'Get Started'
                                    )}
                                </Button>
                            </Link>
                            <Link href="/sign-in" className="w-full">
                                <Button
                                    variant="ghost"
                                    size={collapsed ? 'icon' : 'sm'}
                                    className={cn(
                                        'w-full text-gray-600 hover:text-gray-900 hover:bg-white/60',
                                        collapsed ? 'h-9 w-9' : 'h-9'
                                    )}
                                    title={collapsed ? 'Log in' : undefined}
                                >
                                    {collapsed ? (
                                        <LogOut className="h-4 w-4 rotate-180" />
                                    ) : (
                                        'Log in'
                                    )}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Collapse Toggle */}
            <div className="p-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className={cn(
                        'w-full text-gray-500 hover:text-gray-700 hover:bg-white/60',
                        collapsed ? 'justify-center px-0' : 'justify-start gap-2'
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4" />
                            <span>Collapse</span>
                        </>
                    )}
                </Button>
            </div>
        </aside>
    )
}
