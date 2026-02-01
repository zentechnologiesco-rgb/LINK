"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { FileText, Plus, Users, Calendar, MoreHorizontal, Eye, ArrowRight, TrendingUp } from 'lucide-react'
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
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-6 w-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
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
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900 pb-24">
            <main className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">

                {/* Action Bar */}
                <div className="flex items-center justify-end gap-4 mb-12 border-b border-neutral-200/60 pb-8">
                    {leases.length > 0 && (
                        <Link href="/landlord/leases/new">
                            <Button className="h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-8 text-base font-bold tracking-wide shadow-xl shadow-neutral-900/10 transition-all hover:scale-[1.02]">
                                <Plus className="mr-2 h-5 w-5" />
                                Create New Lease
                            </Button>
                        </Link>
                    )}
                </div>

                {leases.length > 0 ? (
                    <div className="space-y-16">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <StatCard
                                label="Action Required"
                                value={actionRequired.length}
                                highlight={actionRequired.length > 0}
                            />
                            <StatCard label="In Progress" value={pendingLeases.length} />
                            <StatCard label="Active" value={activeLeases.length} />
                            <StatCard label="Total Leases" value={leases.length} />
                        </div>

                        <div className="space-y-16">
                            {/* Action Required */}
                            {actionRequired.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                                Action Required
                                            </h2>
                                            <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                                {actionRequired.length}
                                            </span>
                                        </div>
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
                                    <div className="flex items-center gap-3 mb-8 opacity-60 hover:opacity-100 transition-opacity">
                                        <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                            In Progress
                                        </h2>
                                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                            {pendingLeases.length}
                                        </span>
                                    </div>
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
                                    <div className="flex items-center gap-3 mb-8">
                                        <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                            Active Leases
                                        </h2>
                                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                            {activeLeases.length}
                                        </span>
                                    </div>
                                    <div className="grid gap-4">
                                        {activeLeases.map((lease: any) => (
                                            <LeaseRow key={lease._id} lease={lease} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Past Leases */}
                            {pastLeases.length > 0 && (
                                <section className="pt-8 border-t border-neutral-100">
                                    <div className="flex items-center gap-3 mb-8 opacity-40">
                                        <h2 className="text-xl font-bold font-[family-name:var(--font-anton)] tracking-wide text-neutral-900 uppercase">
                                            Past & Archived
                                        </h2>
                                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-mono font-medium">
                                            {pastLeases.length}
                                        </span>
                                    </div>
                                    <div className="grid gap-4 opacity-50 hover:opacity-100 transition-opacity duration-300">
                                        {pastLeases.map((lease: any) => (
                                            <LeaseRow key={lease._id} lease={lease} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 px-4 text-center border border-dashed border-neutral-200 rounded-3xl bg-white/50">
                        <div className="h-24 w-24 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center mb-8">
                            <TrendingUp className="h-10 w-10 text-neutral-300" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight">No leases active</h3>
                        <p className="text-neutral-500 mb-10 max-w-md text-lg font-light">
                            Start by creating a new lease agreement for your properties.
                        </p>
                        <Link href="/landlord/leases/new">
                            <Button className="h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-10 text-base font-bold shadow-xl shadow-neutral-900/10 transition-all hover:scale-[1.02]">
                                <Plus className="mr-2 h-5 w-5" />
                                Create First Lease
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={cn(
            "p-6 sm:p-8 rounded-2xl border transition-all duration-300",
            highlight && value > 0
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60 font-mono",
                highlight && value > 0 ? "text-white" : "text-neutral-500"
            )}>{label}</p>
            <p className="text-4xl sm:text-5xl font-[family-name:var(--font-anton)] tracking-wide">
                {value}
            </p>
        </div>
    )
}

function LeaseRow({ lease, highlight }: { lease: any; highlight?: boolean }) {
    return (
        <Link href={`/landlord/leases/${lease._id}`} className="group block">
            <div className={cn(
                "flex items-center gap-6 p-4 sm:p-5 rounded-2xl border transition-all duration-300",
                highlight
                    ? "bg-white border-neutral-900 shadow-md shadow-neutral-900/5 relative overflow-hidden"
                    : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5"
            )}>
                {highlight && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-900" />
                )}

                {/* Property Info */}
                <div className="flex-1 min-w-0 pl-2">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-neutral-900 truncate tracking-tight group-hover:text-neutral-700 transition-colors">
                            {lease.property?.title || 'Untitled Property'}
                        </h3>
                        <LeaseStatusBadge status={lease.status} />
                    </div>
                    <div className="flex items-center gap-6 text-xs text-neutral-500 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-neutral-400" />
                            {lease.tenant?.fullName || 'No tenant'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                            {format(new Date(lease.startDate), 'MMM d, yyyy')} — {format(new Date(lease.endDate), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>

                {/* Rent */}
                <div className="text-right shrink-0 px-4 sm:px-6 border-l border-neutral-100">
                    <p className="text-xl font-[family-name:var(--font-anton)] text-neutral-900 tracking-wide">
                        N${lease.monthlyRent?.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">per month</p>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2 pr-2">
                    <div className="h-10 w-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                    <div onClick={(e) => e.preventDefault()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-900"
                                >
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-56 p-2 rounded-2xl border border-neutral-100 bg-white shadow-xl shadow-neutral-900/10"
                            >
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={`/landlord/leases/${lease._id}`}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 focus:text-neutral-900 focus:bg-neutral-50 transition-colors cursor-pointer"
                                    >
                                        <Eye className="h-4 w-4 opacity-70" />
                                        View Details
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default function LandlordLeasesPage() {
    return <LandlordLeasesContent />
}
