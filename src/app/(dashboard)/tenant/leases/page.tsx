'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { FileText, Users, Calendar, Eye, Search, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function TenantLeasesContent() {
    const leases = useQuery(api.leases.getForTenant, {})

    if (leases === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-6 w-32 bg-neutral-100 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
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
        <div className="px-4 py-8 md:px-6 max-w-[1400px] mx-auto space-y-12 pb-24">

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Lease Agreements</h1>
                <p className="text-neutral-500">Manage your active and pending lease agreements.</p>
            </div>

            {/* Stats */}
            {leases.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Pending"
                        value={pendingLeases.length}
                        highlight={pendingLeases.length > 0}
                    />
                    <StatCard label="Awaiting" value={signedLeases.length} />
                    <StatCard label="Active" value={activeLeases.length} />
                    <StatCard label="Total" value={leases.length} />
                </div>
            )}

            {/* Empty State */}
            {leases.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center rounded-2xl border border-neutral-200 bg-neutral-50/50">
                    <div className="h-16 w-16 rounded-full bg-white border border-neutral-100 flex items-center justify-center mb-6">
                        <FileText className="h-8 w-8 text-neutral-300" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                        No leases yet
                    </h3>
                    <p className="text-neutral-500 mb-8 max-w-sm text-sm leading-relaxed">
                        When a landlord sends you a lease agreement, it will appear here for you to review and sign.
                    </p>
                    <Link href="/">
                        <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl h-11 px-8 font-medium shadow-sm transition-all hover:scale-[1.01]">
                            <Search className="mr-2 h-4 w-4" />
                            Find a Home
                        </Button>
                    </Link>
                </div>
            )}

            {/* Pending Review Section */}
            {pendingLeases.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        <h2 className="text-lg font-bold text-neutral-900 uppercase tracking-wide">
                            Action Required
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {pendingLeases.map((lease: any) => (
                            <LeaseRow key={lease._id} lease={lease} actionLabel="Review & Sign" highlight />
                        ))}
                    </div>
                </section>
            )}

            {/* Awaiting Landlord Approval */}
            {signedLeases.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-lg font-bold text-neutral-400 uppercase tracking-wide">
                        Awaiting Approval
                    </h2>
                    <div className="space-y-3">
                        {signedLeases.map((lease: any) => (
                            <LeaseRow key={lease._id} lease={lease} actionLabel="View Status" />
                        ))}
                    </div>
                </section>
            )}

            {/* Active Leases */}
            {activeLeases.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-lg font-bold text-neutral-900 uppercase tracking-wide">
                        Active Leases
                    </h2>
                    <div className="space-y-3">
                        {activeLeases.map((lease: any) => (
                            <LeaseRow key={lease._id} lease={lease} actionLabel="View Details" />
                        ))}
                    </div>
                </section>
            )}

            {/* Past Leases */}
            {otherLeases.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-lg font-bold text-neutral-400 uppercase tracking-wide">
                        Archive
                    </h2>
                    <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                        {otherLeases.map((lease: any) => (
                            <LeaseRow key={lease._id} lease={lease} actionLabel="View Record" />
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
        <div className={cn(
            "p-5 rounded-xl border transition-all duration-300",
            highlight && value > 0
                ? "bg-neutral-900 border-neutral-900 text-white shadow-lg shadow-neutral-900/10"
                : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-1",
                highlight && value > 0 ? "text-neutral-400" : "text-neutral-400"
            )}>
                {label}
            </p>
            <p className={cn(
                "text-3xl font-bold tracking-tight",
                highlight && value > 0 ? "text-white" : "text-neutral-900"
            )}>
                {value}
            </p>
        </div>
    )
}

// Lease Row Component
function LeaseRow({ lease, actionLabel, highlight }: { lease: any; actionLabel: string; highlight?: boolean }) {
    return (
        <Link href={`/tenant/leases/${lease._id}`} className="block group">
            <div className={cn(
                "flex items-center gap-5 p-4 sm:p-5 rounded-xl border transition-all duration-300",
                highlight
                    ? "bg-white border-neutral-300 shadow-md shadow-neutral-100"
                    : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
            )}>
                {/* Icon/Image Placeholder */}
                <div className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    highlight ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200 group-hover:text-neutral-600"
                )}>
                    <FileText className="h-5 w-5" />
                </div>

                {/* Property Info */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-neutral-900 text-sm sm:text-base truncate">
                            {lease.property?.title || 'Untitled Property'}
                        </h3>
                        <div className="scale-90 origin-left">
                            <LeaseStatusBadge status={lease.status} />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-500">
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
                <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-bold text-lg text-neutral-900">
                        N$ {lease.monthlyRent?.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-medium text-neutral-400">per month</p>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors shrink-0"
                            onClick={(e) => e.preventDefault()}
                        >
                            <MoreHorizontal className="h-4 w-4 text-neutral-400" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-neutral-200 shadow-xl">
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-neutral-50 cursor-pointer">
                            <Link href={`/tenant/leases/${lease._id}`} className="flex items-center font-medium">
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
