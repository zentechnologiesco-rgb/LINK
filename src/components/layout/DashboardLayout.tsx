'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
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
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Menu, PanelLeft } from 'lucide-react'
import { getDisplayName } from '@/lib/user-name'
import { useAuthActions } from "@convex-dev/auth/react"

interface DashboardLayoutProps {
    children: React.ReactNode
    title?: string
    user?: any
}

export function DashboardLayout({ children, title = 'Dashboard', user }: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const router = useRouter()
    const { signOut } = useAuthActions()

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
        router.refresh()
        toast.success('Signed out successfully')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    user={user}
                />
            </div>

            {/* Main Content */}
            <div
                className={cn(
                    'transition-all duration-300 ease-in-out',
                    sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[240px]'
                )}
            >
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-14 px-4 lg:px-6">
                        <div className="flex items-center gap-4">
                            {/* Mobile menu button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden h-8 w-8"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>

                            {/* Page Icon & Title */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <PanelLeft className="h-4 w-4 text-gray-600" />
                                </div>
                                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="https://github.com"
                                target="_blank"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
                            >
                                GitHub
                            </Link>

                            {user && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatarUrl} alt={user.email || ''} />
                                                <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                                                    {user.email?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {getDisplayName(user)}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push('/profile')}>
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleSignOut}>
                                            Log out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div
                        className="fixed left-0 top-0 h-full w-[240px] bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Sidebar
                            collapsed={false}
                            onToggle={() => setMobileMenuOpen(false)}
                            user={user}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
