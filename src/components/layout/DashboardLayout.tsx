'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
import { toast } from 'sonner'
import { useAuthActions } from "@convex-dev/auth/react"
import { getDisplayName, getInitials } from '@/lib/user-name'
import {
    Menu,
    X,
    Home,
    Building2,
    FileCheck,
    Wallet,
    Settings,
    LogOut,
    LayoutDashboard,
    Users,
    Shield,
    ClipboardList,
    FileText,
    ChevronLeft,
    Heart,
    MessageSquare,
} from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
    title?: string
    user?: any
}

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    tag?: string
}

// Dashboard navigation items based on role
const landlordNavItems: NavItem[] = [
    { label: 'My Properties', href: '/landlord/properties', icon: Building2 },
    { label: 'Leases', href: '/landlord/leases', icon: FileCheck },
    { label: 'Inquiries', href: '/landlord/inquiries', icon: MessageSquare },
    { label: 'Payments', href: '/landlord/payments', icon: Wallet, tag: 'Soon' },
]

const tenantNavItems: NavItem[] = [
    { label: 'Overview', href: '/tenant', icon: LayoutDashboard },
    { label: 'My Favorites', href: '/tenant/saved', icon: Heart },
    { label: 'My Leases', href: '/tenant/leases', icon: FileCheck },
    { label: 'Payments', href: '/tenant/payments', icon: Wallet, tag: 'Soon' },
]

const adminNavItems: NavItem[] = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'All Properties', href: '/admin/properties', icon: Building2 },
    { label: 'Property Requests', href: '/admin/property-requests', icon: Shield },
    { label: 'Landlord Requests', href: '/admin/landlord-requests', icon: ClipboardList },
    { label: 'System Reports', href: '/admin/reports', icon: FileText },
]

export function DashboardLayout({ children, title = 'Dashboard', user }: DashboardLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useAuthActions()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
        router.refresh()
        toast.success('Signed out successfully')
    }

    const currentRole = user?.role

    // Get nav items based on role
    const getNavItems = () => {
        if (currentRole === 'landlord') return landlordNavItems
        if (currentRole === 'admin') return adminNavItems
        return tenantNavItems
    }

    const navItems = getNavItems()

    const isActive = (href: string) => {
        if (href === '/tenant' || href === '/admin') {
            return pathname === href
        }
        return pathname?.startsWith(href)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/5">
                <div className="flex items-center justify-between h-16 px-4 md:px-6">
                    {/* Left: Logo & Back */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <ChevronLeft className="h-5 w-5 text-black/40" />
                            <span className="font-[family-name:var(--font-anton)] text-xl tracking-wide text-black">
                                LINK
                            </span>
                        </Link>
                    </div>

                    {/* Center: Title (Desktop) */}
                    <h1 className="hidden md:block text-lg font-semibold text-black">
                        {title}
                    </h1>

                    {/* Right: Mobile Menu Button & User Menu */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden h-9 w-9"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>

                        {/* User Menu */}
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 p-1 pr-3 rounded-full border border-black/10 hover:shadow-md transition-all bg-white">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatarUrl} alt={user.email || ''} />
                                            <AvatarFallback className="bg-gray-900 text-white text-xs font-medium">
                                                {getInitials(user) || user.email?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden md:block text-sm font-medium text-black/80">
                                            {getDisplayName(user)}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 rounded-xl" align="end">
                                    <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Mobile Title */}
                <div className="md:hidden px-4 pb-3">
                    <h1 className="text-lg font-semibold text-black">{title}</h1>
                </div>
            </header>

            {/* Desktop Horizontal Navigation */}
            <nav className="hidden md:block fixed top-16 left-0 right-0 z-40 bg-white border-b border-black/5">
                <div className="flex items-center gap-1 px-6 py-2 overflow-x-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                                    active
                                        ? 'bg-black text-white'
                                        : 'text-black/60 hover:bg-gray-100 hover:text-black'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                                {item.tag && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
                                        {item.tag}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div
                        className="absolute top-[88px] left-0 right-0 bg-white border-b border-black/10 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 space-y-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href)
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                                            active
                                                ? 'bg-black text-white'
                                                : 'text-black/60 hover:bg-gray-100 hover:text-black'
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                        {item.tag && (
                                            <span className="ml-auto px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                                                {item.tag}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="pt-[120px] md:pt-[112px] min-h-screen">
                <div className="max-w-[2000px] mx-auto px-4 md:px-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
