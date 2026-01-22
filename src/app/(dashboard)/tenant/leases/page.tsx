'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { FileText, Building2, DollarSign, Calendar, ArrowRight, Eye, PenTool } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"


function LeaseCard({
    lease,
    actionLabel,
    actionIcon: ActionIcon
}: {
    lease: any
    actionLabel: string
    actionIcon: React.ElementType
}) {
    return (
        <Link href={`/tenant/leases/${lease._id}`}>
            <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                        {/* Property Image Placeholder */}
                        <div className="relative w-full md:w-48 h-40 md:h-auto bg-gray-100 flex-shrink-0">
                            <div className="h-full w-full flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-gray-300" />
                            </div>
                        </div>

                        {/* Lease Info */}
                        <div className="flex-1 p-4 md:p-6">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                        {lease.property?.title || 'Untitled Property'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {lease.property?.address}
                                    </p>
                                </div>
                                <LeaseStatusBadge status={lease.status} />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="font-medium text-foreground">
                                        N$ {lease.monthlyRent?.toLocaleString()}
                                    </span>
                                    <span>/month</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {format(new Date(lease.startDate), 'MMM d, yyyy')} - {format(new Date(lease.endDate), 'MMM d, yyyy')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Landlord: <span className="text-foreground">{lease.landlord?.fullName || 'Unknown'}</span>
                                </p>
                                <Button size="sm" variant="ghost" className="gap-1 group-hover:bg-primary group-hover:text-white transition-colors">
                                    {actionLabel}
                                    <ActionIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

function TenantLeasesContent() {
    const leases = useQuery(api.leases.getForTenant, {})

    if (leases === undefined) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="h-40 bg-gray-100 rounded-xl" />
                    <div className="h-40 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    // Group leases by status
    const pendingLeases = leases.filter((l: any) =>
        ['sent_to_tenant', 'revision_requested'].includes(l.status)
    )
    const signedLeases = leases.filter((l: any) => l.status === 'tenant_signed')
    const activeLeases = leases.filter((l: any) => l.status === 'approved')
    const otherLeases = leases.filter((l: any) =>
        ['rejected', 'expired', 'terminated'].includes(l.status)
    )

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Leases</h1>
                <p className="text-muted-foreground">
                    View and manage your rental agreements
                </p>
            </div>

            {/* Empty State */}
            {leases.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Leases Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            When a landlord sends you a lease agreement, it will appear here.
                        </p>
                        <Link href="/search">
                            <Button>Browse Properties</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Pending Review Section */}
            {pendingLeases.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        <h2 className="text-lg font-semibold">Pending Your Review ({pendingLeases.length})</h2>
                    </div>
                    <div className="grid gap-4">
                        {pendingLeases.map((lease: any) => (
                            <LeaseCard key={lease._id} lease={lease} actionLabel="Review & Sign" actionIcon={PenTool} />
                        ))}
                    </div>
                </section>
            )}

            {/* Awaiting Landlord Approval */}
            {signedLeases.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <h2 className="text-lg font-semibold">Awaiting Landlord Approval ({signedLeases.length})</h2>
                    </div>
                    <div className="grid gap-4">
                        {signedLeases.map((lease: any) => (
                            <LeaseCard key={lease._id} lease={lease} actionLabel="View" actionIcon={Eye} />
                        ))}
                    </div>
                </section>
            )}

            {/* Active Leases */}
            {activeLeases.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <h2 className="text-lg font-semibold">Active Leases ({activeLeases.length})</h2>
                    </div>
                    <div className="grid gap-4">
                        {activeLeases.map((lease: any) => (
                            <LeaseCard key={lease._id} lease={lease} actionLabel="View Details" actionIcon={ArrowRight} />
                        ))}
                    </div>
                </section>
            )}

            {/* Past/Other Leases */}
            {otherLeases.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past Leases</h2>
                    <div className="grid gap-4 opacity-75">
                        {otherLeases.map((lease: any) => (
                            <LeaseCard key={lease._id} lease={lease} actionLabel="View" actionIcon={Eye} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

export default function TenantLeasesPage() {
    return <TenantLeasesContent />
}
