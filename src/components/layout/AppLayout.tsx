'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

interface AppLayoutProps {
    children: React.ReactNode
}

// Inner component that handles authenticated state
function AuthenticatedLayout({ children, sidebarCollapsed, onToggle, mobileMenuOpen, onMobileClose, onMobileToggle }: {
    children: React.ReactNode
    sidebarCollapsed: boolean
    onToggle: () => void
    mobileMenuOpen: boolean
    onMobileClose: () => void
    onMobileToggle: () => void
}) {
    const user = useQuery(api.users.currentUser)
    const isLoading = user === undefined
    const userRole = user?.role || null

    return (
        <>
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={onToggle}
                    userRole={userRole}
                    user={user}
                    isLoading={isLoading}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 md:hidden"
                    onClick={onMobileClose}
                >
                    <div
                        className="fixed left-0 top-0 h-full w-[280px] bg-gray-50 sm:rounded-r-3xl shadow-2xl shadow-black/20 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Sidebar
                            collapsed={false}
                            onToggle={onMobileClose}
                            userRole={userRole}
                            user={user}
                            isLoading={isLoading}
                            onItemClick={onMobileClose}
                            showCollapseToggle={false}
                        />
                    </div>
                </div>
            )}
            <BottomNav userRole={userRole} user={user} />
        </>
    )
}

// Guest/Loading layout without user query
function GuestLayout({ sidebarCollapsed, onToggle, mobileMenuOpen, onMobileClose, isLoading }: {
    sidebarCollapsed: boolean
    onToggle: () => void
    mobileMenuOpen: boolean
    onMobileClose: () => void
    isLoading: boolean
}) {
    return (
        <>
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={onToggle}
                    userRole={null}
                    user={null}
                    isLoading={isLoading}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 md:hidden"
                    onClick={onMobileClose}
                >
                    <div
                        className="fixed left-0 top-0 h-full w-[280px] bg-gray-50 sm:rounded-r-3xl shadow-2xl shadow-black/20 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Sidebar
                            collapsed={false}
                            onToggle={onMobileClose}
                            userRole={null}
                            user={null}
                            isLoading={isLoading}
                            onItemClick={onMobileClose}
                            showCollapseToggle={false}
                        />
                    </div>
                </div>
            )}
            <BottomNav />
        </>
    )
}

export function AppLayout({ children }: AppLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    const handleToggle = () => setSidebarCollapsed(!sidebarCollapsed)
    const handleMobileClose = () => setMobileMenuOpen(false)
    const handleMobileToggle = () => setMobileMenuOpen(!mobileMenuOpen)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
            {/* Conditionally render sidebar based on auth state */}
            <Authenticated>
                <AuthenticatedLayout
                    sidebarCollapsed={sidebarCollapsed}
                    onToggle={handleToggle}
                    mobileMenuOpen={mobileMenuOpen}
                    onMobileClose={handleMobileClose}
                    onMobileToggle={handleMobileToggle}
                >
                    {null}
                </AuthenticatedLayout>
            </Authenticated>

            <Unauthenticated>
                <GuestLayout
                    sidebarCollapsed={sidebarCollapsed}
                    onToggle={handleToggle}
                    mobileMenuOpen={mobileMenuOpen}
                    onMobileClose={handleMobileClose}
                    isLoading={false}
                />
            </Unauthenticated>

            <AuthLoading>
                <GuestLayout
                    sidebarCollapsed={sidebarCollapsed}
                    onToggle={handleToggle}
                    mobileMenuOpen={mobileMenuOpen}
                    onMobileClose={handleMobileClose}
                    isLoading={true}
                />
            </AuthLoading>


            {/* Main Content Area */}
            <div
                className={cn(
                    'transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col',
                    'md:p-3 md:h-screen md:overflow-hidden',
                    'min-h-screen', // Ensure mobile takes full height
                    sidebarCollapsed ? 'md:ml-[60px]' : 'md:ml-[200px]'
                )}
            >
                {/* Floating Content Panel (Desktop) / Full Screen (Mobile) */}
                <main className="flex-1 bg-white md:rounded-3xl md:border md:border-gray-100 overflow-hidden relative shadow-none flex flex-col">
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 pb-24 md:pb-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

