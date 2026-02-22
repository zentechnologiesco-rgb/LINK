'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Building2, FileText, MessageSquare, Shield, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"

import { Id } from "../../../../convex/_generated/dataModel"
import { toast } from 'sonner'

const roleColors: Record<string, string> = {
    tenant: 'bg-blue-100 text-blue-700',
    landlord: 'bg-green-100 text-green-700',
    admin: 'bg-purple-100 text-purple-700',
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

function AdminDashboardContent() {
    const isAdmin = useQuery(api.admin.isAdmin)
    const stats = useQuery(api.admin.getStats)
    const users = useQuery(api.admin.getAllUsers)
    const properties = useQuery(api.admin.getAllProperties)

    const updateUserRole = useMutation(api.admin.updateUserRole)
    const togglePropertyAvailability = useMutation(api.admin.togglePropertyAvailability)
    const deleteProperty = useMutation(api.admin.deleteProperty)

    const isLoading = isAdmin === undefined || stats === undefined || users === undefined || properties === undefined

    if (isLoading) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="p-6 lg:p-8">
                <div className="text-center py-16">
                    <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500">You do not have permission to access this page.</p>
                    <Link href="/">
                        <Button className="mt-4">Go Home</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const handleToggleRole = async (userId: Id<"users">, currentRole: string) => {
        try {
            const newRole = currentRole === 'tenant' ? 'landlord' : 'tenant'
            await updateUserRole({ userId, role: newRole as any })
            toast.success('User role updated')
        } catch (error) {
            toast.error('Failed to update role')
        }
    }

    const handleToggleAvailability = async (propertyId: Id<"properties">, isAvailable: boolean) => {
        try {
            await togglePropertyAvailability({ propertyId, isAvailable: !isAvailable })
            toast.success(isAvailable ? 'Property hidden' : 'Property shown')
        } catch (error) {
            toast.error('Failed to update property')
        }
    }

    const handleDeleteProperty = async (propertyId: Id<"properties">) => {
        if (!confirm('Are you sure you want to delete this property?')) return
        try {
            await deleteProperty({ propertyId })
            toast.success('Property deleted')
        } catch (error) {
            toast.error('Failed to delete property')
        }
    }

    return (
        <div className="p-6 lg:p-8">
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
                                        <th className="text-left p-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.slice(0, 10).map((u: any) => (
                                        <tr key={u._id} className="hover:bg-slate-50/50">
                                            <td className="p-3">
                                                <p className="font-medium">{u.fullName || 'Unnamed'}</p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </td>
                                            <td className="p-3">
                                                <Badge className={roleColors[u.role] || 'bg-gray-100'}>{u.role}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleRole(u._id, u.role)}
                                                >
                                                    Toggle Role
                                                </Button>
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
                                        <tr key={p._id} className="hover:bg-slate-50/50">
                                            <td className="p-3">
                                                <p className="font-medium truncate max-w-[150px]">{p.title}</p>
                                                <p className="text-xs text-muted-foreground">N$ {p.priceNad?.toLocaleString()}</p>
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {p.landlord?.fullName || p.landlord?.email || '-'}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant={p.isAvailable ? 'default' : 'secondary'}>
                                                    {p.isAvailable ? 'Active' : 'Hidden'}
                                                </Badge>
                                            </td>
                                            <td className="p-3 flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleAvailability(p._id, p.isAvailable)}
                                                >
                                                    {p.isAvailable ? 'Hide' : 'Show'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDeleteProperty(p._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function AdminDashboard() {
    return <AdminDashboardContent />
}
