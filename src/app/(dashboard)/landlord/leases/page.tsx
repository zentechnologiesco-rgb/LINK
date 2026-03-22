'use client'

import type { ElementType } from 'react'
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
import { Button } from '@/components/ui/button'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { LEASE_STATUS_LABELS, type LeaseStatus } from '@/constants/lease'
import { cn } from '@/lib/utils'

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

type SectionTone = 'default' | 'attention' | 'muted'

export default function LandlordLeasesPage() {
    const router = useRouter()
    const leases = useQuery(api.leases.getForLandlord, {}) as LandlordLease[] | undefined

    const handleRefresh = async () => {
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (leases === undefined) {
        return <LeasesPageSkeleton />
    }

    const actionRequired = leases.filter((lease) => lease.status === 'tenant_signed')
    const inProgress = leases.filter((lease) =>
        ['draft', 'sent_to_tenant', 'revision_requested'].includes(lease.status)
    )
    const active = leases.filter((lease) => lease.status === 'approved')
    const archived = leases.filter((lease) =>
        ['rejected', 'expired', 'terminated'].includes(lease.status)
    )

    const totalBookedMonthly = active.reduce((sum, lease) => sum + (lease.monthlyRent ?? 0), 0)
    const renewalsSoon = active.filter((lease) => {
        const daysRemaining = differenceInDays(new Date(lease.endDate), new Date())
        return daysRemaining >= 0 && daysRemaining <= 45
    }).length
    const draftCount = inProgress.filter((lease) => lease.status === 'draft').length

    const heroCopy = actionRequired.length > 0
        ? `${actionRequired.length} ${pluralize('lease', actionRequired.length)} ready for review.`
        : active.length > 0
            ? `${active.length} active ${pluralize('lease', active.length)} currently running across your portfolio.`
            : inProgress.length > 0
                ? `${inProgress.length} ${pluralize('lease', inProgress.length)} moving through drafting and signature.`
                : 'Create clean agreements, track signatures, and keep live terms organized in one place.'

    const summaryMetrics = [
        {
            label: 'Needs review',
            value: actionRequired.length.toLocaleString(),
            description: actionRequired.length > 0 ? 'Signed by tenant' : 'Nothing waiting',
            icon: AlertCircle,
            tone: 'attention' as const,
        },
        {
            label: 'In progress',
            value: inProgress.length.toLocaleString(),
            description: draftCount > 0 ? `${draftCount} ${pluralize('draft', draftCount)} open` : 'All non-final leases',
            icon: Clock3,
            tone: 'default' as const,
        },
        {
            label: 'Active leases',
            value: active.length.toLocaleString(),
            description: renewalsSoon > 0 ? `${renewalsSoon} ending soon` : 'No near renewals',
            icon: CheckCircle2,
            tone: 'default' as const,
        },
        {
            label: 'Monthly booked',
            value: formatCurrency(totalBookedMonthly),
            description: active.length > 0 ? 'Approved recurring rent' : 'No live rent yet',
            icon: Wallet2,
            tone: 'default' as const,
        },
    ]

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
            <div className="space-y-8 pb-16 font-sans text-neutral-900 sm:pb-10">
                <section className="px-4 pt-3 sm:px-2 sm:pt-2">
                    <div className="sm:hidden">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-medium text-neutral-500">
                                Lease workspace
                            </p>
                            <div className="flex items-center gap-2">
                                <TopIconLink href="/landlord/payments" icon={Wallet2} label="Payments" />
                                <TopIconLink href="/landlord/leases/new" icon={Plus} label="New lease" emphasized />
                            </div>
                        </div>
                        <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.05em] text-neutral-950">
                            Leases
                        </h1>
                        <p className="mt-2 text-[15px] leading-6 text-neutral-600">
                            {heroCopy}
                        </p>
                    </div>

                    <div className="hidden flex-col gap-6 sm:flex xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#fafafa] px-3 py-1 text-[11px] font-medium tracking-[0.02em] text-neutral-500">
                                <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                                Lease workspace
                            </div>
                            <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.04em] text-neutral-950 sm:text-[2.5rem]">
                                Lease portfolio
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-[15px]">
                                {heroCopy}
                            </p>
                        </div>

                        <div className="hidden sm:flex sm:flex-row sm:gap-3">
                            <Link href="/landlord/payments">
                                <Button
                                    variant="outline"
                                    className="h-11 rounded-full border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                                >
                                    <Wallet2 className="h-4 w-4" strokeWidth={2} />
                                    Payments
                                </Button>
                            </Link>
                            <Link href="/landlord/leases/new">
                                <Button className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800">
                                    <Plus className="h-4 w-4" strokeWidth={2} />
                                    New lease
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden">
                        {summaryMetrics.map((metric) => (
                            <SummaryMetric
                                key={metric.label}
                                label={metric.label}
                                value={metric.value}
                                description={metric.description}
                                icon={metric.icon}
                                tone={metric.tone}
                                mobileCompact
                            />
                        ))}
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[20px] border border-neutral-200 bg-white sm:hidden">
                        <CompactStatusRow
                            icon={AlertCircle}
                            label={actionRequired.length > 0 ? `${actionRequired.length} pending approval` : 'No approvals waiting on you'}
                            tone={actionRequired.length > 0 ? 'attention' : 'default'}
                        />
                        <CompactStatusRow
                            icon={PencilLine}
                            label={draftCount > 0 ? `${draftCount} draft ${pluralize('lease', draftCount)}` : 'No unsent drafts'}
                        />
                        <CompactStatusRow
                            icon={CheckCircle2}
                            label={renewalsSoon > 0 ? `${renewalsSoon} ending within 45 days` : 'No renewals due soon'}
                        />
                    </div>

                    <div className="mt-6 hidden sm:block">
                        <div className="grid sm:grid-cols-2 sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-neutral-200 sm:bg-[#fbfbfd] sm:divide-y sm:divide-neutral-200 xl:grid-cols-4 xl:divide-x xl:divide-y-0">
                            {summaryMetrics.map((metric) => (
                                <SummaryMetric
                                    key={metric.label}
                                    label={metric.label}
                                    value={metric.value}
                                    description={metric.description}
                                    icon={metric.icon}
                                    tone={metric.tone}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 hidden text-sm text-neutral-600 sm:flex sm:flex-wrap sm:gap-2">
                        <InlineInsight
                            icon={AlertCircle}
                            label={actionRequired.length > 0 ? `${actionRequired.length} pending approval` : 'No approvals waiting on you'}
                            tone={actionRequired.length > 0 ? 'attention' : 'default'}
                        />
                        <InlineInsight
                            icon={PencilLine}
                            label={draftCount > 0 ? `${draftCount} draft ${pluralize('lease', draftCount)}` : 'No unsent drafts'}
                        />
                        <InlineInsight
                            icon={CheckCircle2}
                            label={renewalsSoon > 0 ? `${renewalsSoon} ending within 45 days` : 'No renewals due soon'}
                        />
                    </div>
                </section>

                {leases.length === 0 ? (
                    <div className="px-4 sm:px-0">
                        <EmptyState />
                    </div>
                ) : (
                    <div className="space-y-7 px-4 sm:px-0">
                        <LeaseSection
                            title="Needs your action"
                            description="Tenant-complete agreements that are waiting for approval or a revision decision."
                            count={actionRequired.length}
                            icon={AlertCircle}
                            tone="attention"
                            leases={actionRequired}
                        />

                        <LeaseSection
                            title="In progress"
                            description="Drafts, sent agreements, and revision loops that are still moving toward activation."
                            count={inProgress.length}
                            icon={Clock3}
                            tone="default"
                            leases={inProgress}
                        />

                        <LeaseSection
                            title="Active leases"
                            description="Approved agreements currently generating rent and occupying properties."
                            count={active.length}
                            icon={CheckCircle2}
                            tone="default"
                            leases={active}
                        />

                        <LeaseSection
                            title="Archive"
                            description="Finished, rejected, expired, and terminated agreements kept for reference."
                            count={archived.length}
                            icon={FolderArchive}
                            tone="muted"
                            leases={archived}
                        />
                    </div>
                )}
            </div>
        </PullToRefresh>
    )
}

function LeaseSection({
    title,
    description,
    count,
    icon: Icon,
    leases,
    tone,
}: {
    title: string
    description: string
    count: number
    icon: ElementType
    leases: LandlordLease[]
    tone: SectionTone
}) {
    if (leases.length === 0) {
        return null
    }

    return (
        <section className="space-y-3">
            <div className="flex items-start justify-between gap-3 px-1 sm:flex-row sm:items-end sm:px-2">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border bg-white',
                        tone === 'attention'
                            ? 'border-amber-200 text-amber-700'
                            : tone === 'muted'
                                ? 'border-neutral-200 text-neutral-500'
                                : 'border-neutral-200 text-neutral-700'
                    )}>
                        <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                            {title}
                        </h2>
                        <p className="hidden text-sm text-neutral-500 sm:block">
                            {description}
                        </p>
                    </div>
                </div>

                <span className={cn(
                    'inline-flex h-8 items-center rounded-full border bg-white px-3 text-xs font-semibold',
                    tone === 'attention'
                        ? 'border-amber-200 text-amber-700'
                        : tone === 'muted'
                            ? 'border-neutral-200 text-neutral-500'
                            : 'border-neutral-200 text-neutral-700'
                )}>
                    {count} {pluralize('lease', count)}
                </span>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white sm:rounded-[28px]">
                {leases.map((lease, index) => (
                    <div key={lease._id}>
                        <LeaseRow lease={lease} tone={tone} />
                        {index < leases.length - 1 && (
                            <div className="ml-[78px] border-t border-neutral-100 sm:ml-[92px]" />
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}

function LeaseRow({ lease, tone }: { lease: LandlordLease; tone: SectionTone }) {
    const statusConfig = getStatusConfig(lease.status)
    const statusSummary = getStatusSummary(lease)

    return (
        <Link href={`/landlord/leases/${lease._id}`} className="block">
            <article className="group min-h-[118px] px-4 py-4 transition-[background-color,transform] active:scale-[0.995] active:bg-neutral-50 hover:bg-neutral-50 sm:min-h-0 sm:px-5">
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-neutral-100 sm:h-14 sm:w-14 sm:rounded-[18px]">
                        {lease.property?.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={lease.property.imageUrl}
                                alt={lease.property?.title || 'Lease property'}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Building2 className="h-5 w-5 text-neutral-400" strokeWidth={2} />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-neutral-950 sm:text-base">
                                        {lease.property?.title || 'Property'}
                                    </h3>
                                    <span className={cn(
                                        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                        statusConfig.badgeClassName
                                    )}>
                                        {LEASE_STATUS_LABELS[lease.status]}
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-sm text-neutral-500">
                                    {lease.property?.address || 'Property address unavailable'}
                                </p>
                            </div>
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-600" strokeWidth={2} />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-100 pt-3 sm:grid-cols-2 sm:gap-x-6 xl:grid-cols-4 xl:border-t-0 xl:pt-0">
                            <InlineDetail
                                icon={UserRound}
                                label="Tenant"
                                value={lease.tenant?.fullName || 'Tenant not assigned'}
                            />
                            <InlineDetail
                                icon={Wallet2}
                                label="Rent"
                                value={`${formatCurrency(lease.monthlyRent)} / month`}
                            />
                            <InlineDetail
                                icon={CalendarRange}
                                label="Lease term"
                                value={formatLeaseTerm(lease.startDate, lease.endDate)}
                            />
                            <InlineDetail
                                icon={statusSummary.icon}
                                label={statusSummary.label}
                                value={statusSummary.value}
                                tone={tone}
                            />
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    )
}

function SummaryMetric({
    label,
    value,
    description,
    icon: Icon,
    tone,
    mobileCompact = false,
}: {
    label: string
    value: string
    description: string
    icon: ElementType
    tone: 'default' | 'attention'
    mobileCompact?: boolean
}) {
    return (
        <div className={cn(
            'px-5 py-5 sm:px-6',
            mobileCompact && 'rounded-[20px] border border-neutral-200 bg-white px-4 py-4'
        )}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    {label}
                </p>
                <Icon
                    className={cn(
                        'h-4 w-4',
                        tone === 'attention' ? 'text-amber-700' : 'text-neutral-500'
                    )}
                    strokeWidth={2}
                />
            </div>
            <p className={cn(
                'mt-4 text-3xl font-semibold tracking-[-0.04em] text-neutral-950',
                mobileCompact && 'text-[1.75rem]'
            )}>
                {value}
            </p>
            <p className={cn(
                'mt-1 text-sm leading-6 text-neutral-500',
                mobileCompact && 'text-[13px] leading-5'
            )}>
                {description}
            </p>
        </div>
    )
}

function InlineDetail({
    icon: Icon,
    label,
    value,
    tone = 'default',
}: {
    icon: ElementType
    label: string
    value: string
    tone?: SectionTone | 'default'
}) {
    return (
        <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                <Icon
                    className={cn(
                        'h-3.5 w-3.5',
                        tone === 'attention' ? 'text-amber-600' : 'text-neutral-400'
                    )}
                    strokeWidth={2}
                />
                {label}
            </div>
            <p className="mt-1 truncate text-[15px] font-medium text-neutral-800">
                {value}
            </p>
        </div>
    )
}

function InlineInsight({
    icon: Icon,
    label,
    tone = 'default',
}: {
    icon: ElementType
    label: string
    tone?: 'default' | 'attention'
}) {
    return (
        <span className={cn(
            'inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2',
            tone === 'attention' ? 'text-amber-700' : 'text-neutral-600'
        )}>
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
        </span>
    )
}

function TopIconLink({
    href,
    icon: Icon,
    label,
    emphasized = false,
}: {
    href: string
    icon: ElementType
    label: string
    emphasized?: boolean
}) {
    return (
        <Link
            href={href}
            aria-label={label}
            className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border transition-colors active:scale-[0.98]',
                emphasized
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700'
            )}
        >
            <Icon className="h-4 w-4" strokeWidth={2} />
        </Link>
    )
}

function CompactStatusRow({
    icon: Icon,
    label,
    tone = 'default',
}: {
    icon: ElementType
    label: string
    tone?: 'default' | 'attention'
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 not-last:border-b not-last:border-neutral-100">
            <Icon className={cn('h-4 w-4 shrink-0', tone === 'attention' ? 'text-amber-700' : 'text-neutral-400')} strokeWidth={2} />
            <p className="text-[14px] text-neutral-700">
                {label}
            </p>
        </div>
    )
}

function EmptyState() {
    return (
        <section className="rounded-[24px] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center sm:rounded-[32px] sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <FileText className="h-7 w-7 text-neutral-400" strokeWidth={1.8} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">
                No leases yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
                Start with a polished draft, send it to your tenant, and this workspace will keep every approval and active agreement easy to scan.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/landlord/leases/new">
                    <Button className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Create first lease
                    </Button>
                </Link>
                <Link href="/landlord/properties">
                    <Button
                        variant="outline"
                        className="h-11 rounded-full border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                        View properties
                    </Button>
                </Link>
            </div>
        </section>
    )
}

function LeasesPageSkeleton() {
    return (
        <div className="space-y-8 pb-16 sm:pb-10">
            <section className="px-4 pt-3 sm:px-2 sm:pt-2">
                <div className="h-4 w-28 rounded-full bg-neutral-100 sm:h-6" />
                <div className="mt-4 h-12 w-52 rounded-2xl bg-neutral-100 sm:w-64" />
                <div className="mt-3 h-5 w-full max-w-2xl rounded-full bg-neutral-100" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="rounded-[20px] border border-neutral-200 bg-white px-4 py-4">
                            <div className="flex items-center justify-between">
                                <div className="h-3 w-20 rounded-full bg-neutral-100" />
                                <div className="h-4 w-4 rounded-full bg-neutral-100" />
                            </div>
                            <div className="mt-4 h-8 w-16 rounded-2xl bg-neutral-100" />
                            <div className="mt-2 h-4 w-24 rounded-full bg-neutral-100" />
                        </div>
                    ))}
                </div>
                <div className="mt-4 overflow-hidden rounded-[20px] border border-neutral-200 bg-white sm:hidden">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center gap-3 px-4 py-3 not-last:border-b not-last:border-neutral-100">
                            <div className="h-4 w-4 rounded-full bg-neutral-100" />
                            <div className="h-4 w-40 rounded-full bg-neutral-100" />
                        </div>
                    ))}
                </div>
                <div className="mt-6 hidden sm:block">
                    <div className="grid sm:grid-cols-2 sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-neutral-200 sm:bg-[#fbfbfd] sm:divide-y sm:divide-neutral-200 xl:grid-cols-4 xl:divide-x xl:divide-y-0">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="px-5 py-5 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="h-3 w-20 rounded-full bg-neutral-100" />
                                    <div className="h-4 w-4 rounded-full bg-neutral-100" />
                                </div>
                                <div className="mt-4 h-10 w-20 rounded-2xl bg-neutral-100" />
                                <div className="mt-2 h-4 w-28 rounded-full bg-neutral-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="space-y-3 px-4 sm:px-0">
                <div className="h-10 w-52 rounded-2xl bg-neutral-100" />
                <div className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white sm:rounded-[28px]">
                    {[1, 2, 3].map((item) => (
                        <div key={item}>
                            <div className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                                <div className="h-12 w-12 rounded-[16px] bg-neutral-100 sm:h-14 sm:w-14 sm:rounded-[18px]" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-44 rounded-full bg-neutral-100" />
                                    <div className="h-4 w-60 rounded-full bg-neutral-100" />
                                    <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3 sm:gap-4">
                                        <div className="h-8 rounded-xl bg-neutral-100" />
                                        <div className="h-8 rounded-xl bg-neutral-100" />
                                        <div className="h-8 rounded-xl bg-neutral-100" />
                                        <div className="flex items-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {item < 3 && <div className="ml-[78px] border-t border-neutral-100 sm:ml-[92px]" />}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

function getStatusConfig(status: LeaseStatus) {
    switch (status) {
        case 'draft':
            return {
                badgeClassName: 'border-neutral-200 bg-neutral-100 text-neutral-600',
            }
        case 'sent_to_tenant':
            return {
                badgeClassName: 'border-blue-200 bg-blue-50 text-blue-700',
            }
        case 'tenant_signed':
            return {
                badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
            }
        case 'approved':
            return {
                badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            }
        case 'rejected':
            return {
                badgeClassName: 'border-red-200 bg-red-50 text-red-700',
            }
        case 'revision_requested':
            return {
                badgeClassName: 'border-orange-200 bg-orange-50 text-orange-700',
            }
        case 'expired':
            return {
                badgeClassName: 'border-neutral-200 bg-neutral-100 text-neutral-500',
            }
        case 'terminated':
            return {
                badgeClassName: 'border-red-200 bg-red-50 text-red-600',
            }
    }
}

function getStatusSummary(lease: LandlordLease) {
    switch (lease.status) {
        case 'draft':
            return {
                label: 'Next step',
                value: 'Send to tenant',
                icon: PencilLine,
            }
        case 'sent_to_tenant':
            return {
                label: 'Sent on',
                value: lease.sentAt ? format(new Date(lease.sentAt), 'MMM d, yyyy') : 'Awaiting signature',
                icon: Clock3,
            }
        case 'tenant_signed':
            return {
                label: 'Signed on',
                value: lease.signedAt ? format(new Date(lease.signedAt), 'MMM d, yyyy') : 'Ready for review',
                icon: AlertCircle,
            }
        case 'approved': {
            const daysRemaining = differenceInDays(new Date(lease.endDate), new Date())
            return {
                label: 'Remaining',
                value: daysRemaining >= 0 ? `${daysRemaining} ${pluralize('day', daysRemaining)} left` : 'Ended',
                icon: CheckCircle2,
            }
        }
        case 'revision_requested':
            return {
                label: 'Status',
                value: 'Waiting for updates',
                icon: Clock3,
            }
        case 'rejected':
            return {
                label: 'Status',
                value: 'Rejected',
                icon: FolderArchive,
            }
        case 'expired':
            return {
                label: 'Ended on',
                value: format(new Date(lease.endDate), 'MMM d, yyyy'),
                icon: FolderArchive,
            }
        case 'terminated':
            return {
                label: 'Status',
                value: 'Terminated',
                icon: FolderArchive,
            }
    }
}

function formatLeaseTerm(startDate: string, endDate: string) {
    return `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`
}

function formatCurrency(value?: number) {
    return `N$${(value ?? 0).toLocaleString()}`
}

function pluralize(word: string, count: number) {
    return count === 1 ? word : `${word}s`
}
