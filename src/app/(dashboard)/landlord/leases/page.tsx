'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { FileText, Plus, Users, Calendar, MoreHorizontal, Eye, ArrowRight } from 'lucide-react'
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

function LandlordLeasesContent() {
    const leases = useQuery(api.leases.getForLandlord, {})

    if (leases === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm font-medium text-black/40 uppercase tracking-wider">Loading leases...</p>
                </div>
            </div>
        )
    }

    // Group leases by status
    const actionRequired = leases.filter((l: any) => l.status === 'tenant_signed')
    const pendingLeases = leases.filter((l: any) =>
        ['draft', 'sent_to_tenant', 'revision_requested'].includes(l.status)
    )
    const activeLeases = leases.filter((l: any) => l.status === 'approved')
    const pastLeases = leases.filter((l: any) =>
        ['rejected', 'expired', 'terminated'].includes(l.status)
    )

    return (
        <div className="px-8 py-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-[family-name:var(--font-anton)] uppercase tracking-wide text-black mb-2">Leases</h1>
                    <p className="text-black/60 font-medium">Manage and track your rental agreements.</p>
                </div>
                {leases.length > 0 && (
                    <Link href="/landlord/leases/new">
                        <Button className="bg-black text-white hover:bg-black/80 rounded-full h-11 px-6 font-bold shadow-none transition-all hover:scale-105 active:scale-95">
                            <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                            Create Lease
                        </Button>
                    </Link>
                )}
            </div>

            {leases.length > 0 ? (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Need Approval"
                            value={actionRequired.length}
                            highlight={actionRequired.length > 0}
                        />
                        <StatCard label="In Progress" value={pendingLeases.length} />
                        <StatCard label="Active" value={activeLeases.length} />
                        <StatCard label="Total" value={leases.length} />
                    </div>

                    <div className="space-y-10">
                        {/* Action Required */}
                        {actionRequired.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-2 w-2 rounded-full bg-black animate-pulse" />
                                    <h2 className="text-lg font-bold uppercase tracking-wider text-black">
                                        Action Required ({actionRequired.length})
                                    </h2>
                                </div>
                                <div className="grid gap-4">
                                    {actionRequired.map((lease: any) => (
                                        <LeaseRow key={lease._id} lease={lease} highlight />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* In Progress */}
                        {pendingLeases.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-black/40 mb-6 flex items-center gap-3">
                                    In Progress <span className="text-black">({pendingLeases.length})</span>
                                </h2>
                                <div className="grid gap-4">
                                    {pendingLeases.map((lease: any) => (
                                        <LeaseRow key={lease._id} lease={lease} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Active Leases */}
                        {activeLeases.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-black/40 mb-6 flex items-center gap-3">
                                    Active Leases <span className="text-black">({activeLeases.length})</span>
                                </h2>
                                <div className="grid gap-4">
                                    {activeLeases.map((lease: any) => (
                                        <LeaseRow key={lease._id} lease={lease} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Past Leases */}
                        {pastLeases.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-black/40 mb-6">
                                    Past Leases ({pastLeases.length})
                                </h2>
                                <div className="grid gap-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
                                    {pastLeases.map((lease: any) => (
                                        <LeaseRow key={lease._id} lease={lease} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-black/5 rounded-3xl bg-gray-50/50">
                    <div className="h-20 w-20 rounded-full bg-white shadow-none border border-black/5 flex items-center justify-center mb-6">
                        <FileText className="h-8 w-8 text-black/40" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2 uppercase tracking-wide">No leases yet</h3>
                    <p className="text-black/60 mb-8 max-w-sm font-medium">
                        Create your first lease agreement to start tracking your properties.
                    </p>
                    <Link href="/landlord/leases/new">
                        <Button className="bg-black text-white hover:bg-black/80 rounded-full h-12 px-8 font-bold shadow-none transition-all hover:scale-105 active:scale-95">
                            <Plus className="mr-2 h-5 w-5" strokeWidth={3} />
                            Create First Lease
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}

// Stat Card Component
function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={cn(
            "p-6 rounded-2xl border transition-all duration-300",
            highlight && value > 0
                ? "bg-black text-white border-black shadow-none"
                : "bg-white border-black/5 text-black hover:border-black/10 shadow-none"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-1",
                highlight && value > 0 ? "text-white/60" : "text-black/40"
            )}>{label}</p>
            <p className="text-4xl font-[family-name:var(--font-anton)] tracking-wide">
                {value}
            </p>
        </div>
    )
}

// Lease Row Component - Clean list style
function LeaseRow({ lease, highlight }: { lease: any; highlight?: boolean }) {
    return (
        <Link href={`/landlord/leases/${lease._id}`} className="group block">
            <div className={cn(
                "flex items-center gap-6 p-5 rounded-2xl border transition-all duration-300",
                highlight
                    ? "bg-white border-black shadow-none scale-[1.01]"
                    : "bg-white border-black/5 hover:border-black/20 hover:scale-[1.01] shadow-none"
            )}>
                {/* Property Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-bold text-lg text-black truncate tracking-tight">
                            {lease.property?.title || 'Untitled Property'}
                        </h3>
                        <LeaseStatusBadge status={lease.status} />
                    </div>
                    <div className="flex items-center gap-6 text-xs font-medium text-black/60">
                        <span className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border border-black/5">
                            <Users className="h-3.5 w-3.5 text-black/40" />
                            {lease.tenant?.fullName || 'No tenant'}
                        </span>
                        <span className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border border-black/5">
                            <Calendar className="h-3.5 w-3.5 text-black/40" />
                            {format(new Date(lease.startDate), 'MMM d, yyyy')} - {format(new Date(lease.endDate), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>

                {/* Rent */}
                <div className="text-right shrink-0 px-4 border-l border-black/5">
                    <p className="text-xl font-[family-name:var(--font-anton)] text-black">
                        N$ {lease.monthlyRent?.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider">per month</p>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 group-hover:bg-black group-hover:text-white transition-all duration-300">
                        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors text-black/40 hover:text-black"
                                onClick={(e) => e.preventDefault()}
                            >
                                <MoreHorizontal className="h-5 w-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-48 p-2 rounded-2xl border border-black/5 bg-white shadow-none"
                        >
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/landlord/leases/${lease._id}`}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-black/70 focus:text-black focus:bg-black/5 transition-colors cursor-pointer"
                                >
                                    <Eye className="h-4 w-4 opacity-70" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </Link>
    )
}

export default function LandlordLeasesPage() {
    return <LandlordLeasesContent />
}
