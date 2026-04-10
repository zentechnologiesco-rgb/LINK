import Link from 'next/link'
import { format } from 'date-fns'
import {
    AlertCircle,
    Bath,
    Bed,
    Eye,
    Home,
    MapPin,
} from '@/components/ui/icons'

import { OptimizedImage } from '@/components/ui/optimized-image'
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
    getPropertyRequestSubmittedAt,
    propertyRequestStatusConfig,
    type PropertyRequestRecord,
    type PropertyRequestStatus,
} from '../_lib/property-request-workspace'

export function PropertyRequestsTable({
    properties,
    searchQuery,
    statusFilter,
}: {
    properties: PropertyRequestRecord[]
    searchQuery: string
    statusFilter?: PropertyRequestStatus
}) {
    const title = statusFilter
        ? `${propertyRequestStatusConfig[statusFilter].label} Requests`
        : 'All Property Requests'

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                    <Badge variant="secondary" className="text-sm font-normal">
                        {properties.length} {properties.length === 1 ? 'result' : 'results'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {properties.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-1 text-lg font-medium">No properties found</h3>
                        <p className="text-muted-foreground">
                            {searchQuery
                                ? `No results matching "${searchQuery}"`
                                : statusFilter
                                  ? `No ${propertyRequestStatusConfig[statusFilter].label.toLowerCase()} property requests at the moment.`
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
                                    const status = property.approvalStatus ?? 'pending'
                                    const statusConfig = propertyRequestStatusConfig[status]
                                    const StatusIcon = statusConfig.icon
                                    const submittedAt = getPropertyRequestSubmittedAt(property)

                                    return (
                                        <TableRow key={property._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                                                        {property.images?.[0] ? (
                                                            <OptimizedImage
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
                                                        <p className="max-w-[200px] truncate font-medium">
                                                            {property.title}
                                                        </p>
                                                        <p className="text-xs capitalize text-muted-foreground">
                                                            {property.propertyType}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
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
                                                    <span className="max-w-[120px] truncate">
                                                        {property.city}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Bed className="h-3 w-3" />
                                                        {property.bedrooms || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Bath className="h-3 w-3" />
                                                        {property.bathrooms || 0}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {format(new Date(submittedAt), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(submittedAt), 'h:mm a')}
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
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/property-requests/${property._id}`}>
                                                    <Button size="sm" variant="outline">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {status === 'pending' ? 'Review' : 'View'}
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
