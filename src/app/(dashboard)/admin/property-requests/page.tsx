'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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

function PropertyRequestsContent() {
    const searchParams = useSearchParams()
    const statusFilter = (searchParams.get('status') as 'pending' | 'approved' | 'rejected') || undefined
    const searchQuery = searchParams.get('search') || ''

    const currentUser = useQuery(api.users.currentUser)
    const properties = useQuery(api.admin.getPropertyRequests, { status: statusFilter })
    const stats = useQuery(api.admin.getPropertyStats)

    if (currentUser === undefined || properties === undefined || stats === undefined) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 w-64 bg-gray-200 rounded" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                    <div className="h-96 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    // Check admin role
    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="text-center py-16">
                    <p className="text-gray-500">Access denied. Admin privileges required.</p>
                </div>
            </div>
        )
    }

    // Filter by search query (client-side)
    const filteredProperties = properties.filter((property: any) => {
        if (!searchQuery) return true
        const searchLower = searchQuery.toLowerCase()
        return (
            property.title?.toLowerCase().includes(searchLower) ||
            property.city?.toLowerCase().includes(searchLower) ||
            property.landlord?.fullName?.toLowerCase().includes(searchLower) ||
            property.landlord?.email?.toLowerCase().includes(searchLower)
        )
    })

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
                    currentStatus={statusFilter || 'all'}
                    currentSearch={searchQuery}
                />
            </Suspense>

            {/* Properties Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {!statusFilter ? 'All Properties' : (
                                `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Properties`
                            )}
                        </CardTitle>
                        <Badge variant="secondary" className="text-sm font-normal">
                            {filteredProperties.length} {filteredProperties.length === 1 ? 'result' : 'results'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredProperties.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No properties found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? `No results matching "${searchQuery}"`
                                    : statusFilter
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
                                    {filteredProperties.map((property: any) => {
                                        const status = property.approvalStatus as keyof typeof statusConfig
                                        const StatusIcon = statusConfig[status]?.icon || Clock

                                        return (
                                            <TableRow key={property._id}>
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
                                                                {property.propertyType}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {property.landlord?.fullName || 'Unknown'}
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
                                                            <Bed className="h-3 w-3" /> {property.bedrooms || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Bath className="h-3 w-3" /> {property.bathrooms || 0}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">
                                                            {property.approvalRequestedAt
                                                                ? format(new Date(property.approvalRequestedAt), 'MMM d, yyyy')
                                                                : format(new Date(property._creationTime), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {property.approvalRequestedAt
                                                                ? format(new Date(property.approvalRequestedAt), 'h:mm a')
                                                                : format(new Date(property._creationTime), 'h:mm a')}
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
                                                    <Link href={`/admin/property-requests/${property._id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {property.approvalStatus === 'pending' ? 'Review' : 'View'}
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

export default function PropertyRequestsPage() {
    return (
        <Suspense fallback={
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 w-64 bg-gray-200 rounded" />
                    <div className="h-96 bg-gray-100 rounded-xl" />
                </div>
            </div>
        }>
            <PropertyRequestsContent />
        </Suspense>
    )
}
