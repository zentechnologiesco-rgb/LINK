import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getTenantLeases, getTenantInquiries } from './actions'
import { FileText, MessageSquare, Home, Clock, Check, AlertCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
}

export default async function TenantDashboard() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    const [leases, inquiries] = await Promise.all([
        getTenantLeases(),
        getTenantInquiries(),
    ])

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container max-w-screen-2xl py-8 px-4">
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
                                            <div key={lease.id} className="flex items-center gap-4 p-4">
                                                <div className="relative h-16 w-20 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                    <Image
                                                        src={lease.property?.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop'}
                                                        alt={lease.property?.title || 'Property'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{lease.property?.title}</p>
                                                    <p className="text-sm text-muted-foreground">{lease.property?.address}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge className={statusColors[lease.status] || 'bg-gray-100'}>{lease.status}</Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            N$ {lease.monthly_rent?.toLocaleString()}/mo
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
                                            <div key={inquiry.id} className="flex items-center gap-4 p-4">
                                                <div className="relative h-16 w-20 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                    <Image
                                                        src={inquiry.property?.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop'}
                                                        alt={inquiry.property?.title || 'Property'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{inquiry.property?.title}</p>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">{inquiry.message}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge className={statusColors[inquiry.status] || 'bg-gray-100'}>{inquiry.status}</Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
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
                                <Link href="/profile" className="block">
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
                                    <span className="font-semibold">{leases.filter((l: any) => l.status === 'active').length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Pending Inquiries</span>
                                    <span className="font-semibold">{inquiries.filter((i: any) => i.status === 'pending').length}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
