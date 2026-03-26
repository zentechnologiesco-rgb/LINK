'use client'

import { useState, type ElementType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { differenceInDays, format } from 'date-fns'
import {
    AlertCircle,
    Building2,
    CalendarRange,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    FolderArchive,
    Loader2,
    PencilLine,
    Plus,
    UserRound,
    Wallet2,
} from 'lucide-react'

import { api } from '../../../../../convex/_generated/api'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { LEASE_STATUS_LABELS, type LeaseStatus } from '@/constants/lease'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────── */

type LandlordLease = {
    _id: string
    status: LeaseStatus
    startDate: string
    endDate: string
    monthlyRent?: number
    sentAt?: number
    signedAt?: number
    property?: {
        title?: string | null
        address?: string | null
        imageUrl?: string | null
    } | null
    tenant?: {
        fullName?: string | null
        email?: string | null
    } | null
}

type FilterTab = 'all' | 'action' | 'progress' | 'active' | 'archive'

const FILTER_TABS: { key: FilterTab; label: string; icon: ElementType }[] = [
    { key: 'all', label: 'All', icon: FileText },
    { key: 'action', label: 'Action needed', icon: AlertCircle },
    { key: 'progress', label: 'In progress', icon: Clock3 },
    { key: 'active', label: 'Active', icon: CheckCircle2 },
    { key: 'archive', label: 'Archive', icon: FolderArchive },
]

/* ── Helpers ────────────────────────────────────────────── */

function formatCurrency(value?: number) {
    return `N$${(value ?? 0).toLocaleString()}`
}

function pluralize(word: string, count: number) {
    return count === 1 ? word : `${word}s`
}

function getStatusBadgeClasses(status: LeaseStatus) {
    switch (status) {
        case 'draft':
            return 'bg-neutral-100 text-neutral-600 border-neutral-200'
        case 'sent_to_tenant':
            return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'tenant_signed':
            return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'approved':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'rejected':
            return 'bg-red-50 text-red-700 border-red-200'
        case 'revision_requested':
            return 'bg-orange-50 text-orange-700 border-orange-200'
        case 'expired':
            return 'bg-neutral-100 text-neutral-500 border-neutral-200'
        case 'terminated':
            return 'bg-red-50 text-red-600 border-red-200'
    }
}

function getLeaseSubtitle(lease: LandlordLease) {
    switch (lease.status) {
        case 'draft':
            return 'Draft — ready to send'
        case 'sent_to_tenant':
            return lease.sentAt
                ? `Sent ${format(new Date(lease.sentAt), 'MMM d')}`
                : 'Waiting for tenant'
        case 'tenant_signed':
            return lease.signedAt
                ? `Signed ${format(new Date(lease.signedAt), 'MMM d')}`
                : 'Ready for your review'
        case 'approved': {
            const days = differenceInDays(new Date(lease.endDate), new Date())
            return days >= 0 ? `${days} ${pluralize('day', days)} remaining` : 'Term ended'
        }
        case 'revision_requested':
            return 'Waiting for tenant updates'
        case 'rejected':
            return 'Rejected'
        case 'expired':
            return `Expired ${format(new Date(lease.endDate), 'MMM d, yyyy')}`
        case 'terminated':
            return 'Terminated'
    }
}

/* ── Page ───────────────────────────────────────────────── */

export default function LandlordLeasesPage() {
    const router = useRouter()
    const leases = useQuery(api.leases.getForLandlord, {}) as LandlordLease[] | undefined
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

    const handleRefresh = async () => {
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (leases === undefined) {
        return <PageSkeleton />
    }

    /* Buckets */
    const actionRequired = leases.filter((l) => l.status === 'tenant_signed')
    const inProgress = leases.filter((l) =>
        ['draft', 'sent_to_tenant', 'revision_requested'].includes(l.status)
    )
    const active = leases.filter((l) => l.status === 'approved')
    const archived = leases.filter((l) =>
        ['rejected', 'expired', 'terminated'].includes(l.status)
    )

    const filtered = (() => {
        switch (activeFilter) {
            case 'action': return actionRequired
            case 'progress': return inProgress
            case 'active': return active
            case 'archive': return archived
            default: return leases
        }
    })()

    const totalMonthlyBooked = active.reduce((s, l) => s + (l.monthlyRent ?? 0), 0)
    const renewalsSoon = active.filter((l) => {
        const d = differenceInDays(new Date(l.endDate), new Date())
        return d >= 0 && d <= 45
    }).length

    const tabCounts: Record<FilterTab, number> = {
        all: leases.length,
        action: actionRequired.length,
        progress: inProgress.length,
        active: active.length,
        archive: archived.length,
    }

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-white">
            <div className="mx-auto max-w-[820px] pb-24 font-sans sm:pb-10">
                {/* ── Sticky header ── */}
                <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/80 backdrop-blur-2xl">
                    <div className="flex items-center justify-between px-5 pb-1 pt-4 sm:px-6">
                        <div>
                            <p className="text-[13px] font-medium text-neutral-500">Lease workspace</p>
                            <h1 className="mt-1 text-[1.75rem] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[2rem]">
                                Leases
                            </h1>
                        </div>
                        <Link
                            href="/landlord/leases/new"
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-white transition-all active:scale-95 hover:bg-neutral-800"
                            aria-label="Create new lease"
                        >
                            <Plus className="h-5 w-5" strokeWidth={2.2} />
                        </Link>
                    </div>

                    {/* Quick stats */}
                    {leases.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto px-5 py-2.5 no-scrollbar sm:px-6">
                            {actionRequired.length > 0 && (
                                <StatPill
                                    icon={AlertCircle}
                                    label={`${actionRequired.length} needs review`}
                                    tone="attention"
                                />
                            )}
                            <StatPill
                                icon={CheckCircle2}
                                label={`${active.length} active`}
                                tone="default"
                            />
                            <StatPill
                                icon={Wallet2}
                                label={`${formatCurrency(totalMonthlyBooked)}/mo`}
                                tone="default"
                            />
                            {renewalsSoon > 0 && (
                                <StatPill
                                    icon={CalendarRange}
                                    label={`${renewalsSoon} ending soon`}
                                    tone="attention"
                                />
                            )}
                        </div>
                    )}

                    {/* Filter tabs */}
                    <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 pt-1 no-scrollbar sm:px-6">
                        {FILTER_TABS.map((tab) => {
                            const isActive = activeFilter === tab.key
                            const count = tabCounts[tab.key]
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveFilter(tab.key)}
                                    className={cn(
                                        'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-200',
                                        isActive
                                            ? 'bg-neutral-950 text-white shadow-sm'
                                            : 'bg-white text-neutral-600 hover:bg-neutral-100'
                                    )}
                                >
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={cn(
                                            'ml-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none',
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-neutral-100 text-neutral-500'
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </header>

                {/* ── Content ── */}
                <div className="px-4 pt-4 sm:px-6">
                    {leases.length === 0 ? (
                        <GlobalEmptyState />
                    ) : filtered.length === 0 ? (
                        <FilterEmptyState filter={activeFilter} />
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
                            {filtered.map((lease, index) => (
                                <div key={lease._id}>
                                    <LeaseCard lease={lease} />
                                    {index < filtered.length - 1 && (
                                        <div className="ml-[76px] border-t border-neutral-100 sm:ml-[88px]" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop secondary nav */}
                <div className="mt-6 hidden px-6 sm:flex sm:gap-3">
                    <Link
                        href="/landlord/payments"
                        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                    >
                        <Wallet2 className="h-4 w-4" strokeWidth={2} />
                        Payments
                    </Link>
                    <Link
                        href="/landlord/properties"
                        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                    >
                        <Building2 className="h-4 w-4" strokeWidth={2} />
                        Properties
                    </Link>
                </div>
            </div>
        </PullToRefresh>
    )
}

/* ── Lease card ─────────────────────────────────────────── */

function LeaseCard({ lease }: { lease: LandlordLease }) {
    const subtitle = getLeaseSubtitle(lease)

    return (
        <Link href={`/landlord/leases/${lease._id}`} className="block">
            <article className="group flex items-center gap-3.5 px-4 py-3.5 transition-all duration-150 active:scale-[0.98] active:bg-neutral-50/80 hover:bg-neutral-50/60 sm:gap-4 sm:px-5 sm:py-4">
                {/* Thumbnail */}
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 sm:h-[58px] sm:w-[58px]">
                    {lease.property?.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={lease.property.imageUrl}
                            alt={lease.property?.title || 'Property'}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <Building2 className="h-5 w-5 text-neutral-400" strokeWidth={1.8} />
                    )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                            {lease.property?.title || 'Property'}
                        </h3>
                        <span className={cn(
                            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            getStatusBadgeClasses(lease.status)
                        )}>
                            {LEASE_STATUS_LABELS[lease.status]}
                        </span>
                    </div>

                    <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                        {lease.tenant?.fullName || 'Unassigned'} · {formatCurrency(lease.monthlyRent)}/mo
                    </p>

                    <p className="mt-1 text-[12px] font-medium text-neutral-400">
                        {subtitle}
                    </p>
                </div>

                {/* Chevron */}
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-500" strokeWidth={2} />
            </article>
        </Link>
    )
}

/* ── Stat pill ──────────────────────────────────────────── */

function StatPill({
    icon: Icon,
    label,
    tone,
}: {
    icon: ElementType
    label: string
    tone: 'default' | 'attention'
}) {
    return (
        <span className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold',
            tone === 'attention'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-neutral-200 bg-white text-neutral-600'
        )}>
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {label}
        </span>
    )
}

/* ── Empty states ───────────────────────────────────────── */

function GlobalEmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <FileText className="h-7 w-7 text-neutral-400" strokeWidth={1.6} />
            </div>
            <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                No leases yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                Create your first lease agreement, send it to a tenant, and manage everything from here.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/landlord/leases/new">
                    <button className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white shadow-lg shadow-neutral-950/15 transition-all active:scale-95 hover:bg-neutral-800">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Create first lease
                    </button>
                </Link>
                <Link href="/landlord/properties">
                    <button className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 transition-all active:scale-95 hover:bg-neutral-50">
                        View properties
                    </button>
                </Link>
            </div>
        </div>
    )
}

function FilterEmptyState({ filter }: { filter: FilterTab }) {
    const messages: Record<FilterTab, { title: string; description: string }> = {
        all: { title: 'No leases', description: 'Create your first lease to get started.' },
        action: { title: 'Nothing needs your action', description: 'You\'re all caught up. Leases waiting for your review will show here.' },
        progress: { title: 'No leases in progress', description: 'Drafts and leases awaiting signatures will appear here.' },
        active: { title: 'No active leases', description: 'Once a lease is approved, it will appear here.' },
        archive: { title: 'No archived leases', description: 'Expired, rejected, and terminated leases appear here for reference.' },
    }

    const msg = messages[filter]

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <FolderArchive className="h-5 w-5 text-neutral-400" strokeWidth={1.8} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-950">{msg.title}</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-neutral-500">{msg.description}</p>
        </div>
    )
}

/* ── Skeleton ───────────────────────────────────────────── */

function PageSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[820px] bg-white pb-16 font-sans">
            {/* Header skeleton */}
            <div className="border-b border-neutral-200/60 px-5 pt-4 sm:px-6">
                <div className="flex items-center justify-between pb-1">
                    <div>
                        <div className="h-3.5 w-24 rounded-full bg-neutral-200/70" />
                        <div className="mt-2.5 h-8 w-28 rounded-xl bg-neutral-200/70" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-neutral-200/70" />
                </div>

                {/* Stat pills skeleton */}
                <div className="flex gap-2 py-2.5">
                    {[80, 64, 96].map((w, i) => (
                        <div key={i} className="h-8 rounded-full bg-neutral-200/60" style={{ width: w }} />
                    ))}
                </div>

                {/* Filter tabs skeleton */}
                <div className="flex gap-1.5 pb-3 pt-1">
                    {[48, 110, 90, 64, 72].map((w, i) => (
                        <div key={i} className="h-9 rounded-full bg-neutral-200/60" style={{ width: w }} />
                    ))}
                </div>
            </div>

            {/* Card list skeleton */}
            <div className="px-4 pt-4 sm:px-6">
                <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i}>
                            <div className="flex items-center gap-3.5 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
                                <div className="h-[52px] w-[52px] shrink-0 rounded-2xl bg-neutral-100 sm:h-[58px] sm:w-[58px]" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-32 rounded-full bg-neutral-100" />
                                        <div className="h-4 w-14 rounded-full bg-neutral-100" />
                                    </div>
                                    <div className="h-3.5 w-48 rounded-full bg-neutral-100" />
                                    <div className="h-3 w-24 rounded-full bg-neutral-50" />
                                </div>
                                <div className="h-4 w-4 rounded-full bg-neutral-100" />
                            </div>
                            {i < 5 && <div className="ml-[76px] border-t border-neutral-100 sm:ml-[88px]" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Loading indicator */}
            <div className="flex justify-center pt-6">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
            </div>
        </div>
    )
}
