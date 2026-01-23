'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { FileText, Users, Calendar, Eye, PenTool, Search, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function TenantLeasesContent() {
    const leases = useQuery(api.leases.getForTenant, {})

    if (leases === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading leases...</p>
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
        <div className="px-6 py-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">My Leases</h1>
                    <p className="text-muted-foreground mt-1">View and manage your rental agreements</p>
                </div>
            </div>

            {/* Stats */}
            {leases.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    <StatCard
                        label="Pending Review"
                        value={pendingLeases.length}
                        highlight={pendingLeases.length > 0}
                    />
                    <StatCard label="Awaiting Approval" value={signedLeases.length} />
                    <StatCard label="Active" value={activeLeases.length} />
                    <StatCard label="Total" value={leases.length} />
                </div>
            )}

            {/* Empty State */}
            {leases.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center rounded-xl bg-sidebar-accent/30">
                    <div className="h-16 w-16 rounded-2xl bg-sidebar-accent flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No leases yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        When a landlord sends you a lease agreement, it will appear here.
                    </p>
                    <Link href="/search">
                        <Button className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11 px-5 font-medium shadow-lg shadow-lime-500/20">
                            <Search className="mr-2 h-4 w-4" />
                            Browse Properties
                        </Button>
                    </Link>
                </div>
            )}

            {/* Pending Review Section */}
            {pendingLeases.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-2 w-2 rounded-full bg-lime-500 animate-pulse" />
                        <h2 className="text-lg font-medium text-foreground">
                            Pending Review ({pendingLeases.length})
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {pendingLeases.map((lease: any) => (
                            <LeaseRow key={lease._id} lease={lease} actionLabel="Review & Sign" highlight />
                        ))}
                    </div>
                </section>
            )}

            {/* Awaiting Landlord Approval */}
            {signedLeases.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-medium text-foreground mb-4">
                        Awaiting Landlord Approval ({signedLeases.length})
                    </h2>
                    <div className="space-y-2">
                        {signedLeases.map((lease: any) => (
                            <LeaseRow key={lease._id} lease={lease} actionLabel="View" />
                        ))}
                    </div>
                </section>
            )}

            {/* Active Leases */}
            {activeLeases.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-medium text-foreground mb-4">
                        Active Leases ({activeLeases.length})
                    </h2>
                    <div className="space-y-2">
                        {activeLeases.map((lease: any) => (
                            <LeaseRow key={lease._id} lease={lease} actionLabel="View Details" />
                        ))}
                    </div>
                </section>
            )}

            {/* Past Leases */}
            {otherLeases.length > 0 && (
                <section>
                    <h2 className="text-lg font-medium text-muted-foreground mb-4">
                        Past Leases ({otherLeases.length})
                    </h2>
                    <div className="space-y-2 opacity-70">
                        {otherLeases.map((lease: any) => (
                            <LeaseRow key={lease._id} lease={lease} actionLabel="View" />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

// Stat Card Component
function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={`p-4 rounded-xl ${highlight && value > 0 ? 'bg-lime-500/10 border border-lime-500/20' : 'bg-sidebar-accent/50'}`}>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={`text-2xl font-semibold mt-1 ${highlight && value > 0 ? 'text-lime-600' : 'text-foreground'}`}>
                {value}
            </p>
        </div>
    )
}

// Lease Row Component
function LeaseRow({ lease, actionLabel, highlight }: { lease: any; actionLabel: string; highlight?: boolean }) {
    return (
        <Link href={`/tenant/leases/${lease._id}`} className="block">
            <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${highlight
                    ? 'bg-lime-500/5 border border-lime-500/20 hover:bg-lime-500/10'
                    : 'bg-sidebar-accent/30 hover:bg-sidebar-accent/50'
                }`}>
                {/* Property Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h3 className="font-medium text-foreground truncate">
                            {lease.property?.title || 'Untitled Property'}
                        </h3>
                        <LeaseStatusBadge status={lease.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {lease.landlord?.fullName || 'Landlord'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(lease.startDate), 'MMM d, yyyy')} - {format(new Date(lease.endDate), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>

                {/* Rent */}
                <div className="text-right shrink-0">
                    <p className="font-semibold text-foreground">
                        N$ {lease.monthlyRent?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">per month</p>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-sidebar-accent transition-colors shrink-0"
                            onClick={(e) => e.preventDefault()}
                        >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/tenant/leases/${lease._id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                {actionLabel}
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Link>
    )
}

export default function TenantLeasesPage() {
    return <TenantLeasesContent />
}
