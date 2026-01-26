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
                    <div className="h-5 w-32 bg-black/5 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-black/5 rounded animate-pulse" />
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
        <div className="px-6 py-8 max-w-5xl mx-auto space-y-12 pb-24">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="font-[family-name:var(--font-anton)] text-4xl uppercase tracking-wide text-black">
                    My Leases
                </h1>
                <p className="text-black/60 font-medium max-w-lg">
                    Manage your rental agreements, view status updates, and access lease documents.
                </p>
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
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center rounded-3xl border border-black/5 bg-gray-50/50">
                    <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                        <FileText className="h-8 w-8 text-black/20" />
                    </div>
                    <h3 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black mb-2">
                        No leases yet
                    </h3>
                    <p className="text-black/50 mb-8 max-w-sm">
                        When a landlord sends you a lease agreement, it will appear here.
                    </p>
                    <Link href="/search">
                        <Button className="bg-black hover:bg-black/80 text-white rounded-full h-12 px-8 font-bold uppercase tracking-wider text-xs shadow-lg shadow-black/5 transition-all hover:scale-105">
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
                        <div className="h-2 w-2 rounded-full bg-black animate-pulse" />
                        <h2 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black">
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
                    <h2 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black/40">
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
                    <h2 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black">
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
                    <h2 className="font-[family-name:var(--font-anton)] text-xl uppercase tracking-wide text-black/20">
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
            "p-5 rounded-2xl border transition-all duration-300",
            highlight && value > 0
                ? "bg-black border-black text-white shadow-xl shadow-black/10 scale-105"
                : "bg-white border-black/5 text-black hover:border-black/10"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-1",
                highlight && value > 0 ? "text-white/60" : "text-black/40"
            )}>
                {label}
            </p>
            <p className={cn(
                "font-[family-name:var(--font-anton)] text-3xl",
                highlight && value > 0 ? "text-white" : "text-black"
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
                "flex items-center gap-5 p-5 rounded-3xl border transition-all duration-300",
                highlight
                    ? "bg-white border-black ring-1 ring-black shadow-lg"
                    : "bg-white border-black/5 hover:border-black/20 hover:shadow-md"
            )}>
                {/* Icon/Image Placeholder */}
                <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    highlight ? "bg-black text-white" : "bg-black/5 text-black/40 group-hover:bg-black group-hover:text-white"
                )}>
                    <FileText className="h-5 w-5" />
                </div>

                {/* Property Info */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-black text-base truncate">
                            {lease.property?.title || 'Untitled Property'}
                        </h3>
                        <div className="scale-90 origin-left">
                            <LeaseStatusBadge status={lease.status} />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-black/50">
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
                    <p className="font-[family-name:var(--font-anton)] text-xl text-black">
                        N$ {lease.monthlyRent?.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">per month</p>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors shrink-0"
                            onClick={(e) => e.preventDefault()}
                        >
                            <MoreHorizontal className="h-4 w-4 text-black/40" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-black/5 shadow-xl">
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-black/5 cursor-pointer">
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
