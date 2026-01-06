import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAllVerifications, getVerificationStats } from '@/lib/verification'
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
import { Eye, ClipboardList, CheckCircle2, XCircle, Clock, MoreHorizontal, AlertCircle } from 'lucide-react'
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

export default async function LandlordRequestsPage({ searchParams }: PageProps) {
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

    const [requests, stats] = await Promise.all([
        getAllVerifications(statusFilter, searchQuery),
        getVerificationStats()
    ])

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
                    currentStatus={statusFilter}
                    currentSearch={searchQuery}
                />
            </Suspense>

            {/* Requests Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {statusFilter === 'all' ? 'All Applications' : (
                                `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Applications`
                            )}
                        </CardTitle>
                        <Badge variant="secondary" className="text-sm font-normal">
                            {requests.length} {requests.length === 1 ? 'result' : 'results'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No requests found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? `No results matching "${searchQuery}"`
                                    : statusFilter !== 'all'
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
                                    {requests.map((request: any) => {
                                        const status = request.status as keyof typeof statusConfig
                                        const StatusIcon = statusConfig[status]?.icon || Clock

                                        return (
                                            <TableRow key={request.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {request.user?.full_name || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {request.user?.email}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {request.documents?.business_name || '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {request.documents?.id_type?.replace('_', ' ') || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">
                                                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(request.created_at), 'h:mm a')}
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
                                                    {request.documents?.is_resubmission && (
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] ml-1">
                                                            Resubmit
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/admin/landlord-requests/${request.id}`}>
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
