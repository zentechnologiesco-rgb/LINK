'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusTimeline'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { FileText, Calendar, ChevronRight, Search, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { cn } from '@/lib/utils'

export default function TenantLeasesPage() {
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const leases = useQuery(api.leases.getForTenant, {})

    const handleRefresh = async () => {
        setIsRefreshing(true)
        router.refresh()
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsRefreshing(false)
    }

    if (leases === undefined) {
        return (
            <div className="font-sans text-neutral-900">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse mb-2" />
                            <div className="h-8 w-10 bg-neutral-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
                {/* List Skeleton */}
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-neutral-100 rounded-lg animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-neutral-100 rounded animate-pulse" />
                                    <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
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

    const stats = {
        pending: pendingLeases.length,
        signed: signedLeases.length,
        active: activeLeases.length,
        total: leases.length,
    }

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
            <div className="font-sans text-neutral-900">
                {/* Stats */}
                {leases.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <StatCard
                            label="Action Required"
                            value={stats.pending}
                            highlight={stats.pending > 0}
                        />
                        <StatCard label="Awaiting" value={stats.signed} />
                        <StatCard label="Active" value={stats.active} />
                        <StatCard label="Total" value={stats.total} />
                    </div>
                )}

                {/* Empty State */}
                {leases.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="h-14 w-14 rounded-xl bg-neutral-100 flex items-center justify-center mb-5">
                            <FileText className="h-6 w-6 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                            No leases yet
                        </h3>
                        <p className="text-sm text-neutral-500 max-w-xs mb-6">
                            When a landlord sends you a lease agreement, it will appear here.
                        </p>
                        <Link href="/">
                            <button className="h-10 px-5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors">
                                <Search className="w-4 h-4 mr-2 inline" />
                                Find a Home
                            </button>
                        </Link>
                    </div>
                )}

                {/* Lease Sections */}
                {leases.length > 0 && (
                    <div className="space-y-8">
                        {/* Action Required */}
                        {pendingLeases.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                                        Action Required
                                    </h2>
                                </div>
                                <div className="space-y-2">
                                    {pendingLeases.map((lease: any) => (
                                        <LeaseCard key={lease._id} lease={lease} highlight />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Awaiting Approval */}
                        {signedLeases.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
                                    Awaiting Approval
                                </h2>
                                <div className="space-y-2">
                                    {signedLeases.map((lease: any) => (
                                        <LeaseCard key={lease._id} lease={lease} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Active */}
                        {activeLeases.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wide mb-3">
                                    Active Leases
                                </h2>
                                <div className="space-y-2">
                                    {activeLeases.map((lease: any) => (
                                        <LeaseCard key={lease._id} lease={lease} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Archive */}
                        {otherLeases.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">
                                    Archive
                                </h2>
                                <div className="space-y-2 opacity-60">
                                    {otherLeases.map((lease: any) => (
                                        <LeaseCard key={lease._id} lease={lease} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </PullToRefresh>
    )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={cn(
            "p-4 rounded-xl border transition-all",
            highlight && value > 0
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white border-neutral-200"
        )}>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-wide mb-1",
                highlight && value > 0 ? "text-neutral-400" : "text-neutral-500"
            )}>
                {label}
            </p>
            <p className="text-2xl font-bold">
                {value}
            </p>
        </div>
    )
}

function LeaseCard({ lease, highlight }: { lease: any; highlight?: boolean }) {
    const startDate = format(new Date(lease.startDate), 'MMM d')
    const endDate = format(new Date(lease.endDate), 'MMM d, yyyy')

    return (
        <Link href={`/tenant/leases/${lease._id}`} className="block group">
            <div className={cn(
                "bg-white rounded-xl border p-4 transition-all",
                highlight
                    ? "border-orange-200 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300"
            )}>
                <div className="flex items-start gap-3">
                    {/* Property Image/Icon */}
                    <div className="h-12 w-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {lease.property?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={lease.property.imageUrl}
                                alt={lease.property?.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Building2 className="h-5 w-5 text-neutral-400" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-neutral-900 text-sm truncate">
                                {lease.property?.title || 'Untitled Property'}
                            </h3>
                            <LeaseStatusBadge status={lease.status} />
                        </div>

                        {/* Details Row */}
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {startDate} - {endDate}
                            </span>
                        </div>

                        {/* Rent and Action Row */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                            <div>
                                <span className="text-base font-bold text-neutral-900">
                                    N${lease.monthlyRent?.toLocaleString()}
                                </span>
                                <span className="text-xs text-neutral-400 ml-1">/mo</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors">
                                <span className="hidden sm:inline">View Details</span>
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
