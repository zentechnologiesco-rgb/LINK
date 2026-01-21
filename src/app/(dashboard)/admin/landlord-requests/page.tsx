'use client'

import Link from 'next/link'
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
import { Eye, ClipboardList, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
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

function LandlordRequestsContent() {
    const searchParams = useSearchParams()
    const statusFilter = (searchParams.get('status') as 'pending' | 'approved' | 'rejected') || undefined
    const searchQuery = searchParams.get('search') || ''

    const currentUser = useQuery(api.users.currentUser)
    const requests = useQuery(api.verification.getAll, { status: statusFilter })
    const stats = useQuery(api.verification.getStats)

    if (currentUser === undefined || requests === undefined || stats === undefined) {
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
    const filteredRequests = requests.filter((request: any) => {
        if (!searchQuery) return true
        const searchLower = searchQuery.toLowerCase()
        return (
            request.user?.fullName?.toLowerCase().includes(searchLower) ||
            request.user?.email?.toLowerCase().includes(searchLower) ||
            request.documents?.businessName?.toLowerCase().includes(searchLower)
        )
    })

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="h-6 w-6 text-purple-600" />
                    <h1 className="text-3xl font-bold tracking-tight">Landlord Requests</h1>
                </div>
                <p className="text-muted-foreground">Review and manage landlord verification applications.</p>
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

            {/* Requests Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {!statusFilter ? 'All Applications' : (
                                `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Applications`
                            )}
                        </CardTitle>
                        <Badge variant="secondary" className="text-sm font-normal">
                            {filteredRequests.length} {filteredRequests.length === 1 ? 'result' : 'results'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredRequests.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No requests found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? `No results matching "${searchQuery}"`
                                    : statusFilter
                                        ? `No ${statusFilter} verification requests at the moment.`
                                        : 'No verification requests have been submitted yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Applicant</TableHead>
                                        <TableHead>Business</TableHead>
                                        <TableHead>ID Type</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.map((request: any) => {
                                        const status = request.status as keyof typeof statusConfig
                                        const StatusIcon = statusConfig[status]?.icon || Clock

                                        return (
                                            <TableRow key={request._id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {request.user?.fullName || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {request.user?.email}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {request.documents?.businessName || '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {request.documents?.idType?.replace('_', ' ') || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">
                                                            {format(new Date(request._creationTime), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(request._creationTime), 'h:mm a')}
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
                                                    {request.documents?.isResubmission && (
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] ml-1">
                                                            Resubmit
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/admin/landlord-requests/${request._id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {request.status === 'pending' ? 'Review' : 'View'}
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

export default function LandlordRequestsPage() {
    return (
        <>
            <AuthLoading>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 w-64 bg-gray-200 rounded" />
                        <div className="h-96 bg-gray-100 rounded-xl" />
                    </div>
                </div>
            </AuthLoading>

            <Unauthenticated>
                <div className="p-6">
                    <div className="text-center py-16">
                        <p className="text-gray-500">Please sign in to access admin panel</p>
                        <Link href="/sign-in">
                            <Button className="mt-4 bg-gray-900 hover:bg-gray-800">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </Unauthenticated>

            <Authenticated>
                <Suspense fallback={
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-12 w-64 bg-gray-200 rounded" />
                            <div className="h-96 bg-gray-100 rounded-xl" />
                        </div>
                    </div>
                }>
                    <LandlordRequestsContent />
                </Suspense>
            </Authenticated>
        </>
    )
}
