'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Menu } from 'lucide-react'

interface AppLayoutProps {
    children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [userRole, setUserRole] = useState<'tenant' | 'landlord' | 'admin' | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const [authKey, setAuthKey] = useState(0) // Key to force sidebar re-render
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    // Fetch user role from profile
    const fetchUserRole = useCallback(async (userId: string, fallbackRole?: string) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        return profile?.role || fallbackRole || 'tenant'
    }, [supabase])

    // Unified user check logic
    const checkUser = useCallback(async () => {
        const { data: { user: sessionUser } } = await supabase.auth.getUser()

        // Check if user changed or if we are still initially loading
        // We compare IDs to detect login/logout/user switch
        if (sessionUser?.id !== user?.id || (isLoading && !user)) {
            if (sessionUser) {
                // Login detected or Initial Load with User
                setIsLoading(true)
                setUser(sessionUser)

                // Fetch role (Showing Skeletons while waiting)
                const role = await fetchUserRole(sessionUser.id, sessionUser.user_metadata?.role)
                setUserRole(role)
            } else {
                // Logout or Guest
                setUser(null)
                setUserRole(null)
            }

            setIsLoading(false)
            setAuthKey(prev => prev + 1)
        } else {
            // No change, just ensure loading stops if it was running
            if (isLoading) setIsLoading(false)
        }
    }, [supabase, fetchUserRole, user, isLoading])

    // Initial check and subscription
    useEffect(() => {
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                await checkUser()
                router.refresh()
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, checkUser, router])

    // Re-check on navigation (handles server action redirects)
    useEffect(() => {
        checkUser()
    }, [pathname, checkUser])

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar
                    key={`desktop-sidebar-${authKey}`}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    userRole={userRole}
                    user={user}
                    isLoading={isLoading}
                />
            </div>

            {/* Mobile Header - Only shown on mobile for hamburger menu */}
            <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
                <div className="flex items-center h-14 px-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Link href="/" className="flex items-center gap-2 ml-3">
                        <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Z</span>
                        </div>
                        <span className="font-semibold text-gray-900">ZEN</span>
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
                            key={`mobile-sidebar-${authKey}`}
                            collapsed={false}
                            onToggle={() => setMobileMenuOpen(false)}
                            userRole={userRole}
                            user={user}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
