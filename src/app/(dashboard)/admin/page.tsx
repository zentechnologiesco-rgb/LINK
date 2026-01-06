import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAdminStats, getAllUsers, getAllProperties, updateUserRole, togglePropertyAvailability, deleteProperty } from './actions'
import { Users, Building2, FileText, MessageSquare, Shield, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const roleColors: Record<string, string> = {
    tenant: 'bg-blue-100 text-blue-700',
    landlord: 'bg-green-100 text-green-700',
    admin: 'bg-purple-100 text-purple-700',
}

export default async function AdminDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/') // Non-admins can't access
    }

    const [stats, users, properties] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getAllProperties(),
    ])

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Header />

            <main className="flex-1 container max-w-screen-2xl py-8 px-4">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-6 w-6 text-purple-600" />
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    </div>
                    <p className="text-muted-foreground">Manage users, properties, and platform settings.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatsCard title="Total Users" value={stats.users} icon={Users} color="blue" />
                    <StatsCard title="Properties" value={stats.properties} icon={Building2} color="green" />
                    <StatsCard title="Active Leases" value={stats.leases} icon={FileText} color="orange" />
                    <StatsCard title="Inquiries" value={stats.inquiries} icon={MessageSquare} color="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Users Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" /> Recent Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-y">
                                        <tr>
                                            <th className="text-left p-3 font-medium">User</th>
                                            <th className="text-left p-3 font-medium">Role</th>
                                            <th className="text-left p-3 font-medium">Joined</th>
                                            <th className="text-left p-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {users.slice(0, 10).map((u: any) => (
                                            <tr key={u.id} className="hover:bg-slate-50/50">
                                                <td className="p-3">
                                                    <p className="font-medium">{u.full_name || 'Unnamed'}</p>
                                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                                </td>
                                                <td className="p-3">
                                                    <Badge className={roleColors[u.role] || 'bg-gray-100'}>{u.role}</Badge>
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '-'}
                                                </td>
                                                <td className="p-3">
                                                    <form action={async () => {
                                                        'use server'
                                                        const newRole = u.role === 'tenant' ? 'landlord' : 'tenant'
                                                        await updateUserRole(u.id, newRole)
                                                    }}>
                                                        <Button size="sm" variant="ghost" type="submit">Toggle Role</Button>
                                                    </form>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Properties Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" /> Recent Properties
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-y">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Property</th>
                                            <th className="text-left p-3 font-medium">Landlord</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {properties.slice(0, 10).map((p: any) => (
                                            <tr key={p.id} className="hover:bg-slate-50/50">
                                                <td className="p-3">
                                                    <p className="font-medium truncate max-w-[150px]">{p.title}</p>
                                                    <p className="text-xs text-muted-foreground">N$ {p.price_nad?.toLocaleString()}</p>
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    {p.landlord?.full_name || p.landlord?.email || '-'}
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant={p.is_available ? 'default' : 'secondary'}>
                                                        {p.is_available ? 'Active' : 'Hidden'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 flex gap-1">
                                                    <form action={async () => {
                                                        'use server'
                                                        await togglePropertyAvailability(p.id, !p.is_available)
                                                    }}>
                                                        <Button size="sm" variant="ghost" type="submit">
                                                            {p.is_available ? 'Hide' : 'Show'}
                                                        </Button>
                                                    </form>
                                                    <form action={async () => {
                                                        'use server'
                                                        await deleteProperty(p.id)
                                                    }}>
                                                        <Button size="sm" variant="ghost" type="submit" className="text-red-600 hover:text-red-700">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </form>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

function StatsCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
        purple: 'bg-purple-100 text-purple-600',
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
