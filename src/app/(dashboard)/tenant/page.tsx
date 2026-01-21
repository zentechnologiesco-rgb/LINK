'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, Home, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
}

function TenantDashboardContent() {
    const leases = useQuery(api.leases.getForTenant, {})
    const inquiries = useQuery(api.inquiries.getForTenant, {})

    const isLoading = leases === undefined || inquiries === undefined

    if (isLoading) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="h-64 bg-gray-100 rounded-xl" />
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
                <p className="text-muted-foreground">Manage your rental journey from one place.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Leases */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> My Leases
                            </CardTitle>
                            <Badge variant="outline">{leases.length}</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {leases.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Home className="h-10 w-10 mb-4 opacity-20" />
                                    <p>No active leases yet.</p>
                                    <Link href="/" className="text-primary hover:underline text-sm mt-2">Browse Properties →</Link>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {leases.map((lease: any) => (
                                        <div key={lease._id} className="flex items-center gap-4 p-4">
                                            <div className="relative h-16 w-20 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <Home className="h-6 w-6 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{lease.property?.title || 'Property'}</p>
                                                <p className="text-sm text-muted-foreground">{lease.property?.address}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={statusColors[lease.status] || 'bg-gray-100'}>{lease.status}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        N$ {lease.monthlyRent?.toLocaleString()}/mo
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Inquiries */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" /> My Inquiries
                            </CardTitle>
                            <Badge variant="outline">{inquiries.length}</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {inquiries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                                    <p>No inquiries sent yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {inquiries.map((inquiry: any) => (
                                        <div key={inquiry._id} className="flex items-center gap-4 p-4">
                                            <div className="relative h-16 w-20 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <Home className="h-6 w-6 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{inquiry.property?.title || 'Property'}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{inquiry.message}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={statusColors[inquiry.status] || 'bg-gray-100'}>{inquiry.status}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {inquiry._creationTime && formatDistanceToNow(new Date(inquiry._creationTime), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Quick Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/" className="block">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Home className="h-4 w-4" /> Browse Properties
                                </Button>
                            </Link>
                            <Link href="/settings" className="block">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    Edit Profile
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Active Leases</span>
                                <span className="font-semibold">{leases.filter((l: any) => l.status === 'approved').length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Pending Inquiries</span>
                                <span className="font-semibold">{inquiries.filter((i: any) => i.status === 'pending').length}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function TenantDashboard() {
    return (
        <>
            <AuthLoading>
                <div className="p-6 lg:p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-48 bg-gray-200 rounded" />
                        <div className="h-64 bg-gray-100 rounded-xl" />
                    </div>
                </div>
            </AuthLoading>

            <Unauthenticated>
                <div className="p-6 lg:p-8">
                    <div className="text-center py-16">
                        <p className="text-gray-500">Please sign in to view your dashboard</p>
                        <Link href="/sign-in">
                            <Button className="mt-4 bg-gray-900 hover:bg-gray-800">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </Unauthenticated>

            <Authenticated>
                <TenantDashboardContent />
            </Authenticated>
        </>
    )
}
