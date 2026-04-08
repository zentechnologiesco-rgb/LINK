import Link from 'next/link'
import { format } from 'date-fns'
import { AlertCircle, Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import {
    landlordRequestStatusConfig,
    type LandlordRequestRecord,
    type LandlordRequestStatus,
} from '../_lib/landlord-request-workspace'

export function LandlordRequestsTable({
    requests,
    searchQuery,
    statusFilter,
}: {
    requests: LandlordRequestRecord[]
    searchQuery: string
    statusFilter?: LandlordRequestStatus
}) {
    const title = statusFilter
        ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Applications`
        : 'All Applications'

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                    <Badge variant="secondary" className="text-sm font-normal">
                        {requests.length} {requests.length === 1 ? 'result' : 'results'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-1 text-lg font-medium">No requests found</h3>
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
                                {requests.map((request) => {
                                    const statusConfig =
                                        landlordRequestStatusConfig[request.status]
                                    const StatusIcon = statusConfig.icon

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
                                                    className={`${statusConfig.color} inline-flex items-center gap-1`}
                                                >
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusConfig.label}
                                                </Badge>
                                                {request.documents?.isResubmission ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="ml-1 bg-blue-50 text-[10px] text-blue-700"
                                                    >
                                                        Resubmit
                                                    </Badge>
                                                ) : null}
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
    )
}
