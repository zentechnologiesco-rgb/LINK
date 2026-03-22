'use client'

import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import Link from 'next/link'
import {
    Building2,
    Calendar,
    ChevronRight,
    Loader2,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, differenceInDays } from 'date-fns'
import {
    LEASE_STATUS_LABELS,
    type LeaseStatus,
} from '@/constants/lease'

export default function TenantLeasesPage() {
    const leases = useQuery(api.leases.getForTenant, {})

    if (leases === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm text-neutral-400 font-medium">Loading leases...</p>
                </div>
            </div>
        )
    }

    // Active lease goes first, then action required, then history
    const activeLease = leases.find((l: any) => l.status === 'approved')
    const actionRequired = leases.filter((l: any) =>
        ['sent_to_tenant', 'revision_requested'].includes(l.status)
    )
    const pendingLandlord = leases.filter((l: any) => l.status === 'tenant_signed')
    const history = leases.filter((l: any) =>
        ['expired', 'terminated', 'rejected'].includes(l.status)
    )

    return (
        <div className="font-sans pb-6">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900">My Leases</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">Your current and past rental agreements</p>
                </div>
                <Link href="/tenant/payments">
                    <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
                        <Wallet className="h-4 w-4" />
                        Payments
                    </button>
                </Link>
            </div>

            {leases.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-7 w-7 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        No leases found
                    </h3>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto mb-6">
                        When a landlord sends you a lease agreement, it will appear here.
                    </p>
                    <Link href="/">
                        <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xl h-11 px-6 transition-colors">
                            Browse Properties
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Active Lease Highlight */}
                    {activeLease && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                                    Current Lease
                                </span>
                            </div>
                            <Link href={`/tenant/leases/${activeLease._id}`}>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 transition-all hover:shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-14 w-14 rounded-xl bg-white overflow-hidden shrink-0 border border-emerald-100">
                                            {activeLease.property?.imageUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={activeLease.property.imageUrl}
                                                    alt={activeLease.property.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                                                    <Building2 className="h-6 w-6 text-neutral-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-emerald-900 truncate">
                                                    {activeLease.property?.title}
                                                </h3>
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Active
                                                </span>
                                            </div>
                                            <p className="text-xs text-emerald-700/80 truncate">
                                                {activeLease.property?.address}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm pt-3 border-t border-emerald-100/60">
                                        <div>
                                            <p className="font-semibold text-emerald-900">
                                                N${activeLease.monthlyRent?.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-emerald-700/60 font-medium uppercase tracking-wide">Monthly Rent</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-emerald-900 font-semibold">
                                                <Calendar className="h-4 w-4 text-emerald-600" />
                                                {format(new Date(activeLease.endDate), 'MMM yyyy')}
                                            </div>
                                            <p className="text-xs text-emerald-700/60 font-medium uppercase tracking-wide">Ends At</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Needs Action */}
                    {actionRequired.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                                    Action Required
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                    {actionRequired.length}
                                </span>
                            </div>
                            {actionRequired.map((lease: any) => (
                                <LeaseCard key={lease._id} lease={lease} highlight />
                            ))}
                        </div>
                    )}

                    {/* Wait For Landlord */}
                    {pendingLandlord.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                                    Pending Landlord Approval
                                </span>
                            </div>
                            {pendingLandlord.map((lease: any) => (
                                <LeaseCard key={lease._id} lease={lease} />
                            ))}
                        </div>
                    )}

                    {/* Past Leases */}
                    {history.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                                    Past Leases
                                </span>
                            </div>
                            {history.map((lease: any) => (
                                <LeaseCard key={lease._id} lease={lease} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function LeaseCard({ lease, highlight }: { lease: any; highlight?: boolean }) {
    const statusStyles: Record<string, string> = {
        sent_to_tenant: 'bg-blue-50 text-blue-700',
        tenant_signed: 'bg-amber-50 text-amber-700',
        approved: 'bg-emerald-50 text-emerald-700',
        rejected: 'bg-red-50 text-red-700',
        revision_requested: 'bg-orange-50 text-orange-700',
        expired: 'bg-neutral-100 text-neutral-500',
        terminated: 'bg-red-50 text-red-600',
    }

    return (
        <Link href={`/tenant/leases/${lease._id}`}>
            <div className={cn(
                'flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm cursor-pointer',
                highlight
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
            )}>
                {/* Property Image */}
                <div className="h-12 w-12 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0">
                    {lease.property?.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={lease.property.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Building2 className="h-5 w-5 text-neutral-400" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate">
                            {lease.property?.title || 'Property'}
                        </h3>
                        {highlight && <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1 truncate">
                        <span className={cn(
                            'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
                            statusStyles[lease.status] || 'bg-neutral-100 text-neutral-600'
                        )}>
                            {LEASE_STATUS_LABELS[lease.status as LeaseStatus] || lease.status}
                        </span>
                        <span className="text-xs text-neutral-400 truncate">
                            N${lease.monthlyRent?.toLocaleString()}/mo
                        </span>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <ChevronRight className="h-4 w-4 text-neutral-300 ml-auto" />
                </div>
            </div>
        </Link>
    )
}
