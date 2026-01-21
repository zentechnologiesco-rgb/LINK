'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
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
                        className="fixed left-0 top-0 h-full w-[240px] bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Sidebar
                            collapsed={false}
                            onToggle={onMobileClose}
                            userRole={userRole}
                            user={user}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            )}
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
                        className="fixed left-0 top-0 h-full w-[240px] bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Sidebar
                            collapsed={false}
                            onToggle={onMobileClose}
                            userRole={null}
                            user={null}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            )}
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
        <div className="min-h-screen bg-gray-100">
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

            {/* Mobile Header - Only shown on mobile for hamburger menu */}
            <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
                <div className="flex items-center h-14 px-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleMobileToggle}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Link href="/" className="flex items-center gap-2 ml-3">
                        <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">L</span>
                        </div>
                        <span className="font-semibold text-gray-900">LINK</span>
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <div
                className={cn(
                    'transition-all duration-300 ease-in-out min-h-screen p-4 md:p-6',
                    sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[240px]'
                )}
            >
                {/* Detached Content Panel */}
                <main className="bg-white rounded-2xl shadow-sm border border-gray-200/60 min-h-[calc(100vh-3rem)] md:min-h-[calc(100vh-3rem)] overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
