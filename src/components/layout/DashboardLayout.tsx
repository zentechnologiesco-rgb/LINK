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
        <div className="min-h-screen bg-[#a9ff3c] dark:bg-black transition-colors duration-300 overflow-hidden">
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden md:block fixed z-20 h-full">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    user={user}
                    userRole={user?.role}
                />
            </div>

            {/* Main Content Wrapper */}
            <div
                className={cn(
                    'h-screen transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] p-3 flex flex-col',
                    sidebarCollapsed ? 'md:ml-[60px]' : 'md:ml-[200px]'
                )}
            >
                {/* Floating Content Card */}
                <div className="flex-1 flex flex-col bg-white dark:bg-[#09090b] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm relative">
                    {/* Top Header */}
                    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center justify-between h-16 px-6">
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
                                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{title}</h1>
                                </div>
                            </div>

                            {/* Right side */}
                            <div className="flex items-center gap-3">
                                {user && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-gray-100 dark:hover:ring-white/10 transition-all">
                                                <Avatar className="h-9 w-9 cursor-pointer">
                                                    <AvatarImage src={user.avatarUrl} alt={user.email || ''} />
                                                    <AvatarFallback className="bg-gradient-to-br from-gray-700 to-black text-white font-medium">
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
                    <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div
                        className="fixed left-0 top-0 h-full w-[260px] bg-white dark:bg-black shadow-2xl"
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

