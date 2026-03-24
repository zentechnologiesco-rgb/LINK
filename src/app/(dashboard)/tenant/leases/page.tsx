'use client'

import Link from 'next/link'
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
    Wallet2,
} from 'lucide-react'

import { api } from '../../../../../convex/_generated/api'
import { LEASE_STATUS_LABELS, type LeaseStatus } from '@/constants/lease'
import { cn } from '@/lib/utils'

type TenantLease = {
    _id: string
    status: LeaseStatus
    startDate: string
    endDate: string
    monthlyRent?: number | null
    property?: {
        title?: string | null
        address?: string | null
        imageUrl?: string | null
    } | null
}

const currency = new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
})

export default function TenantLeasesPage() {
    const leases = useQuery(api.leases.getForTenant, {}) as TenantLease[] | undefined

    if (leases === undefined) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm font-medium text-neutral-400">Loading leases...</p>
                </div>
            </div>
        )
    }

    const activeLease = leases.find((lease) => lease.status === 'approved') ?? null
    const actionRequired = leases.filter((lease) => ['sent_to_tenant', 'revision_requested'].includes(lease.status))
    const pendingLandlord = leases.filter((lease) => lease.status === 'tenant_signed')
    const history = leases.filter((lease) => ['expired', 'terminated', 'rejected'].includes(lease.status))

    const summaryItems = [
        {
            label: 'Active',
            value: activeLease ? '1' : '0',
            icon: CheckCircle2,
        },
        {
            label: 'Needs you',
            value: actionRequired.length.toString(),
            icon: AlertCircle,
        },
        {
            label: 'Waiting',
            value: pendingLandlord.length.toString(),
            icon: Clock3,
        },
        {
            label: 'History',
            value: history.length.toString(),
            icon: FileText,
        },
    ]

    return (
        <div className="mx-auto max-w-[760px] font-sans pb-10">
            <section className="border-b border-neutral-100 pb-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-sm font-medium text-neutral-500">Tenant leases</p>
                        <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-neutral-950 sm:text-[2.5rem]">
                            My leases
                        </h1>
                        <p className="mt-3 text-[15px] leading-7 text-neutral-600">
                            Track your current agreement, anything waiting on your signature, and past leases in one clean timeline.
                        </p>
                    </div>

                    <Link
                        href="/tenant/payments"
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                        <Wallet2 className="h-4 w-4" strokeWidth={2} />
                        Payments
                    </Link>
                </div>

                {leases.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {summaryItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <span
                                    key={item.label}
                                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700"
                                >
                                    <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} />
                                    <span className="font-semibold text-neutral-950">{item.value}</span>
                                    <span>{item.label}</span>
                                </span>
                            )
                        })}
                    </div>
                )}
            </section>

            {leases.length === 0 ? (
                <div className="py-20 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500">
                        <FileText className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                        No leases yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                        When a landlord sends you a lease agreement, it will appear here for review and signature.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                    >
                        Browse properties
                    </Link>
                </div>
            ) : (
                <div className="space-y-8 pt-6">
                    {activeLease && (
                        <section className="space-y-3">
                            <SectionHeader
                                title="Current lease"
                                description="Your active agreement and next timeline milestone."
                            />
                            <Link href={`/tenant/leases/${activeLease._id}`} className="block">
                                <article className="rounded-[28px] border border-neutral-200 bg-neutral-50/80 p-5 transition-colors hover:bg-neutral-50 sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                        <div className="h-24 w-full overflow-hidden rounded-[22px] bg-neutral-100 sm:h-24 sm:w-28">
                                            {activeLease.property?.imageUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={activeLease.property.imageUrl}
                                                    alt={activeLease.property.title || 'Property'}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-neutral-400">
                                                    <Building2 className="h-7 w-7" strokeWidth={1.8} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                                                    Active
                                                </span>
                                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
                                                    Lease overview
                                                </span>
                                            </div>
                                            <h2 className="mt-3 truncate text-[1.35rem] font-semibold tracking-[-0.04em] text-neutral-950">
                                                {activeLease.property?.title || 'Property'}
                                            </h2>
                                            <p className="mt-1 truncate text-sm text-neutral-500">
                                                {activeLease.property?.address || 'Address not available'}
                                            </p>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <InlineMeta
                                                    icon={Wallet2}
                                                    label={formatCurrency(activeLease.monthlyRent ?? 0)}
                                                />
                                                <InlineMeta
                                                    icon={CalendarRange}
                                                    label={`Ends ${format(new Date(activeLease.endDate), 'MMM d, yyyy')}`}
                                                />
                                                <InlineMeta
                                                    icon={Clock3}
                                                    label={`${Math.max(differenceInDays(new Date(activeLease.endDate), new Date()), 0)} days left`}
                                                />
                                            </div>
                                        </div>

                                        <ChevronRight className="hidden h-5 w-5 shrink-0 text-neutral-300 sm:block" strokeWidth={2} />
                                    </div>
                                </article>
                            </Link>
                        </section>
                    )}

                    <LeaseSection
                        title="Needs your action"
                        description="Agreements waiting on your review, documents, or signature."
                        emptyLabel="Nothing is waiting on you right now."
                        leases={actionRequired}
                        tone="attention"
                    />

                    <LeaseSection
                        title="Waiting on landlord"
                        description="Leases you already signed that are still being reviewed."
                        emptyLabel="No leases are waiting on landlord approval."
                        leases={pendingLandlord}
                        tone="default"
                    />

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
    )
}

function LeaseSection({
    title,
    description,
    emptyLabel,
    leases,
    tone,
}: {
    title: string
    description: string
    emptyLabel: string
    leases: TenantLease[]
    tone: 'default' | 'attention' | 'muted'
}) {
    return (
        <section className="space-y-3">
            <SectionHeader title={title} description={description} />
            {leases.length === 0 ? (
                <div className="border-y border-dashed border-neutral-200 py-5 text-sm text-neutral-500">
                    {emptyLabel}
                </div>
            ) : (
                <div className="divide-y divide-neutral-100 border-y border-neutral-200 bg-white">
                    {leases.map((lease) => (
                        <LeaseRow key={lease._id} lease={lease} tone={tone} />
                    ))}
                </div>
            )}
        </section>
    )
}

function LeaseRow({
    lease,
    tone,
}: {
    lease: TenantLease
    tone: 'default' | 'attention' | 'muted'
}) {
    const statusTone =
        tone === 'attention'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : tone === 'muted'
                ? 'border-neutral-200 bg-neutral-50 text-neutral-500'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700'

    return (
        <Link href={`/tenant/leases/${lease._id}`} className="block">
            <article className="flex items-center gap-4 py-4 transition-colors hover:bg-neutral-50">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-neutral-100">
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

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-neutral-950">
                            {lease.property?.title || 'Property'}
                        </h3>
                        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold', statusTone)}>
                            {LEASE_STATUS_LABELS[lease.status] || lease.status}
                        </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-neutral-500">
                        {lease.property?.address || 'Address not available'}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                        <span>{formatCurrency(lease.monthlyRent ?? 0)}/mo</span>
                        <span>•</span>
                        <span>Ends {format(new Date(lease.endDate), 'MMM d, yyyy')}</span>
                    </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" strokeWidth={2} />
            </article>
        </Link>
    )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-950">{title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
        </div>
    )
}

function InlineMeta({
    icon: Icon,
    label,
}: {
    icon: React.ElementType
    label: string
}) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700">
            <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} />
            {label}
        </span>
    )
}

function formatCurrency(value: number) {
    return currency.format(value || 0)
}
