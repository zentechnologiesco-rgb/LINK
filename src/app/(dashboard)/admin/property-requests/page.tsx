import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPropertyApprovalRequests, getPropertyApprovalStats } from './actions'
import { RequestFilters } from './RequestFilters'
import { StatsCards } from './StatsCards'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Eye, Building2, CheckCircle2, XCircle, Clock, AlertCircle, MapPin, Bed, Bath, Home } from 'lucide-react'
import { format } from 'date-fns'

// Status badge variants
const statusConfig = {
    pending: {
        label: 'Pending',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
    },
    approved: {
        label: 'Approved',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Rejected',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
    },
}

interface PageProps {
    searchParams: Promise<{ status?: string; search?: string }>
}

export default async function PropertyRequestsPage({ searchParams }: PageProps) {
    const supabase = await createClient()
    const resolvedParams = await searchParams

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
        redirect('/')
    }

    const statusFilter = (resolvedParams.status as 'all' | 'pending' | 'approved' | 'rejected') || 'all'
    const searchQuery = resolvedParams.search || ''

    const [properties, stats] = await Promise.all([
        getPropertyApprovalRequests(statusFilter, searchQuery),
        getPropertyApprovalStats()
    ])

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-6 w-6 text-purple-600" />
                    <h1 className="text-3xl font-bold tracking-tight">Property Requests</h1>
                </div>
                <p className="text-muted-foreground">Review and approve property listings from landlords.</p>
            </div>

            {/* Stats Overview */}
            <StatsCards stats={stats} />

            {/* Filters */}
            <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded-md mb-6" />}>
                <RequestFilters
                    currentStatus={statusFilter}
                    currentSearch={searchQuery}
                />
            </Suspense>

            {/* Properties Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {statusFilter === 'all' ? 'All Properties' : (
                                `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Properties`
                            )}
                        </CardTitle>
                        <Badge variant="secondary" className="text-sm font-normal">
                            {properties.length} {properties.length === 1 ? 'result' : 'results'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {properties.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No properties found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? `No results matching "${searchQuery}"`
                                    : statusFilter !== 'all'
                                        ? `No ${statusFilter} property requests at the moment.`
                                        : 'No property requests have been submitted yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Property</TableHead>
                                        <TableHead>Landlord</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Specs</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {properties.map((property) => {
                                        const status = property.approval_status as keyof typeof statusConfig
                                        const StatusIcon = statusConfig[status]?.icon || Clock

                                        return (
                                            <TableRow key={property.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-12 w-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                            {property.images?.[0] ? (
                                                                <Image
                                                                    src={property.images[0]}
                                                                    alt={property.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center">
                                                                    <Home className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate max-w-[200px]">
                                                                {property.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground capitalize">
                                                                {property.property_type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {property.landlord?.full_name || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {property.landlord?.email}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span className="truncate max-w-[120px]">{property.city}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Bed className="h-3 w-3" /> {property.bedrooms}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Bath className="h-3 w-3" /> {property.bathrooms}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">
                                                            {property.approval_requested_at
                                                                ? format(new Date(property.approval_requested_at), 'MMM d, yyyy')
                                                                : format(new Date(property.created_at), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {property.approval_requested_at
                                                                ? format(new Date(property.approval_requested_at), 'h:mm a')
                                                                : format(new Date(property.created_at), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`${statusConfig[status]?.color || ''} inline-flex items-center gap-1`}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusConfig[status]?.label || status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/admin/property-requests/${property.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {property.approval_status === 'pending' ? 'Review' : 'View'}
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
