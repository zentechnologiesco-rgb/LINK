'use client'

import Link from 'next/link'
import { differenceInDays, format } from 'date-fns'
import {
    AlertCircle,
    Building2,
    CalendarRange,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    Wallet2,
} from 'lucide-react'

import { api } from '@convex/_generated/api'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { cn } from '@/lib/utils'
import { useUser } from '@/components/providers/UserProvider'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'
import { OptimizedImage } from '@/components/ui/optimized-image'
import {
    LeaseSection,
    MiniStat,
    SectionHeader,
    TenantLeasesPageSkeleton,
} from './TenantLeasesPrimitives'
import { formatCurrency } from '../_lib/tenant-leases-helpers'
import type { TenantLease } from '../_lib/tenant-leases-types'

export function TenantLeasesWorkspace() {
    const { user: currentUser } = useUser()
    const { data: leases } = useCachedQuery(
        api.leases.getForTenant,
        {
            queryName: 'tenant_leases_v1',
            cacheKeySuffix: currentUser?._id ?? 'anonymous',
            storage: 'session',
        },
        {}
    ) as { data: TenantLease[] | undefined }

    // Handle pull to refresh
    const handleRefresh = async () => {
        // Simulate a small delay for UX, Convex handles live updates automatically
        await new Promise(resolve => setTimeout(resolve, 800))
    }

    if (leases === undefined) {
        return <TenantLeasesPageSkeleton />
    }

    const activeLease = leases.find((lease) => lease.status === 'approved') ?? null
    const actionRequired = leases.filter((lease) => ['sent_to_tenant', 'revision_requested'].includes(lease.status))
    const pendingLandlord = leases.filter((lease) => lease.status === 'tenant_signed')
    const history = leases.filter((lease) => ['expired', 'terminated', 'rejected'].includes(lease.status))

    const summaryItems = [
        { label: 'Active', value: activeLease ? '1' : '0', icon: CheckCircle2, active: !!activeLease },
        { label: 'Needs you', value: actionRequired.length.toString(), icon: AlertCircle, active: actionRequired.length > 0 },
        { label: 'Waiting', value: pendingLandlord.length.toString(), icon: Clock3, active: pendingLandlord.length > 0 },
        { label: 'History', value: history.length.toString(), icon: FileText, active: false },
    ]

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-white">
            <div className="mx-auto max-w-[820px] pb-32 font-sans">
                {/* ── Sticky Header ── */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-neutral-100/60">
                    <div className="flex h-14 items-center justify-between px-4 sm:px-6">
                        <p className="text-[15px] font-semibold tracking-[-0.02em] text-neutral-950">
                            Tenant Leases
                        </p>
                        <Link
                            href="/tenant/payments"
                            className="flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-neutral-100 px-3.5 text-[13px] font-semibold text-neutral-700 transition-colors active:scale-95 hover:bg-neutral-200/80"
                            aria-label="View payments"
                        >
                            <Wallet2 className="h-4 w-4" strokeWidth={2.2} />
                            <span className="hidden sm:inline">Payments</span>
                        </Link>
                    </div>
                </header>

                {/* ── Hero Title ── */}
                <div className="px-4 pt-6 sm:px-6">
                    <h1 className="text-[2.25rem] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[2.75rem]">
                        My Leases
                    </h1>
                </div>

                {leases.length > 0 && (
                    <div className="mt-4 overflow-x-auto px-4 pb-2 sm:px-6 hide-scrollbar">
                        <div className="flex w-max shrink-0 items-center justify-start gap-2">
                            {summaryItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <span
                                        key={item.label}
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                                            item.active 
                                                ? "border-neutral-200/80 bg-neutral-950 text-white" 
                                                : "border-neutral-200/60 bg-neutral-50 text-neutral-700"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", item.active ? "text-neutral-300" : "text-neutral-500")} strokeWidth={2.2} />
                                        <span className={item.active ? "text-white" : "text-neutral-950"}>{item.value}</span>
                                        <span>{item.label}</span>
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── Main Content Grid ── */}
                {leases.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
                        <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-neutral-50 ring-1 ring-inset ring-neutral-200/60">
                            <FileText className="h-10 w-10 text-neutral-400" strokeWidth={1.8} />
                        </div>
                        <h3 className="text-[22px] font-bold tracking-[-0.03em] text-neutral-950">
                            No leases yet
                        </h3>
                        <p className="mt-2.5 max-w-[320px] text-[15px] leading-relaxed text-neutral-500">
                            When a landlord sends you a lease agreement, it will appear here for review and signature.
                        </p>
                        <Link
                            href="/"
                            className="mt-8 flex h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-[15px] font-semibold text-white transition-all active:scale-95 hover:bg-neutral-800"
                        >
                            Browse Properties
                        </Link>
                    </div>
                ) : (
                    <div className="mt-6 flex flex-col gap-8">
                        
                        {/* ── Active Lease Hero Card ── */}
                        {activeLease && (
                            <section>
                                <SectionHeader title="Current Lease" description="Your active agreement and next milestone." />
                                <div className="px-4 sm:px-6">
                                    <Link href={`/tenant/leases/${activeLease._id}`} className="group block focus:outline-none">
                                        <article className="overflow-hidden rounded-[24px] border border-neutral-200/80 bg-neutral-50/50 transition-colors hover:bg-neutral-50 shadow-sm">
                                            {/* Property Hero Image */}
                                            <div className="relative aspect-[21/9] w-full shrink-0 bg-neutral-100 sm:aspect-[21/7]">
                                                {activeLease.property?.imageUrl ? (
                                                    <OptimizedImage
                                                        src={activeLease.property.imageUrl}
                                                        alt={activeLease.property.title || 'Property'}
                                                        fill
                                                        sizes="(max-width: 820px) 100vw, 772px"
                                                        qualityPreset="hero"
                                                        priority
                                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                                                        <Building2 className="h-8 w-8" strokeWidth={1.8} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                                                <div className="absolute left-4 top-4">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/90 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm backdrop-blur-md">
                                                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                        Active
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Details */}
                                            <div className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                                                            Lease overview
                                                        </span>
                                                        <h2 className="mt-1 truncate text-[22px] font-bold tracking-[-0.03em] text-neutral-950 sm:text-[24px]">
                                                            {activeLease.property?.title || 'Property'}
                                                        </h2>
                                                        <p className="mt-0.5 truncate text-[14px] text-neutral-500">
                                                            {activeLease.property?.address || 'Address not available'}
                                                        </p>
                                                    </div>
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm ring-1 ring-inset ring-neutral-200/60 transition-transform group-hover:bg-neutral-50 group-active:scale-95">
                                                        <ChevronRight className="h-5 w-5" strokeWidth={2} />
                                                    </div>
                                                </div>

                                                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                    <MiniStat icon={Wallet2} label="Rent" value={`${formatCurrency(activeLease.monthlyRent ?? 0)}/mo`} />
                                                    <MiniStat icon={CalendarRange} label="End Date" value={format(new Date(activeLease.endDate), 'MMM d, yyyy')} />
                                                    <MiniStat icon={Clock3} label="Remaining" value={`${Math.max(differenceInDays(new Date(activeLease.endDate), new Date()), 0)} days left`} />
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                </div>
                            </section>
                        )}

                        {/* ── Needs Action ── */}
                        <LeaseSection
                            title="Needs your action"
                            description="Agreements waiting on your review, documents, or signature."
                            emptyLabel="Nothing is waiting on you right now."
                            leases={actionRequired}
                            tone="attention"
                        />

                        {/* ── Waiting on Landlord ── */}
                        <LeaseSection
                            title="Waiting on landlord"
                            description="Leases you already signed that are still being reviewed."
                            emptyLabel="No leases are waiting on landlord approval."
                            leases={pendingLandlord}
                            tone="default"
                        />

                        {/* ── History ── */}
                        <LeaseSection
                            title="Past leases"
                            description="Ended, rejected, and archived agreements kept for reference."
                            emptyLabel="No past leases yet."
                            leases={history}
                            tone="muted"
                        />
                        
                    </div>
                )}
            </div>
        </PullToRefresh>
    )
}
