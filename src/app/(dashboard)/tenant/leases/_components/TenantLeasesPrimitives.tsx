import type { ElementType } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
    Building2,
    ChevronRight,
} from '@/components/ui/icons'

import { LEASE_STATUS_LABELS } from '@/constants/lease'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { cn } from '@/lib/utils'

import { formatCurrency } from '../_lib/tenant-leases-helpers'
import type {
    LeaseSectionTone,
    TenantLease,
} from '../_lib/tenant-leases-types'

export function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="px-5 pb-3 sm:px-6">
            <h2 className="text-[17px] font-bold tracking-[-0.03em] text-neutral-950">{title}</h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>
        </div>
    )
}

export function MiniStat({
    icon: Icon,
    label,
    value,
}: {
    icon: ElementType
    label: string
    value: string
}) {
    return (
        <div className="flex items-center gap-3 rounded-[16px] bg-white px-4 py-3 ring-1 ring-inset ring-neutral-200/60">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100/80">
                <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2.2} />
            </div>
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">{label}</p>
                <p className="mt-0.5 text-[14px] font-semibold text-neutral-950">{value}</p>
            </div>
        </div>
    )
}

export function LeaseSection({
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
    tone: LeaseSectionTone
}) {
    if (leases.length === 0 && tone !== 'attention' && tone !== 'default') return null

    return (
        <section>
            <SectionHeader title={title} description={description} />
            <div className="px-4 sm:px-6">
                <div className="overflow-hidden rounded-[20px] border border-neutral-200/80 bg-white">
                    {leases.length === 0 ? (
                        <div className="px-5 py-6 text-center text-[13px] text-neutral-500">
                            {emptyLabel}
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100/60">
                            {leases.map((lease) => (
                                <LeaseRow key={lease._id} lease={lease} tone={tone} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export function LeaseRow({
    lease,
    tone,
}: {
    lease: TenantLease
    tone: LeaseSectionTone
}) {
    const statusTone =
        tone === 'attention'
            ? 'border-amber-200/80 bg-amber-50 text-amber-800'
            : tone === 'muted'
                ? 'border-neutral-200 bg-neutral-100/50 text-neutral-500'
                : 'border-blue-200/80 bg-blue-50 text-blue-800'

    return (
        <Link href={`/tenant/leases/${lease._id}`} className="group block focus:outline-none">
            <article className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-5">
                <div className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-neutral-100 ring-1 ring-inset ring-neutral-200/60">
                    {lease.property?.imageUrl ? (
                        <OptimizedImage
                            src={lease.property.imageUrl}
                            alt={lease.property?.title || 'Property'}
                            fill
                            sizes="60px"
                            qualityPreset="thumbnail"
                            showSkeleton={false}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <Building2 className="h-6 w-6 text-neutral-400" strokeWidth={1.8} />
                    )}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-neutral-950">
                            {lease.property?.title || 'Property'}
                        </h3>
                        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]', statusTone)}>
                            {LEASE_STATUS_LABELS[lease.status] || lease.status}
                        </span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                        {lease.property?.address || 'Address not available'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] font-medium text-neutral-400">
                        <span className="text-neutral-600">{formatCurrency(lease.monthlyRent ?? 0)}/mo</span>
                        <span>•</span>
                        <span>Ends {format(new Date(lease.endDate), 'MMM d, yyyy')}</span>
                    </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400" strokeWidth={2.2} />
            </article>
        </Link>
    )
}

export function TenantLeasesPageSkeleton() {
    return (
        <div className="mx-auto min-h-screen max-w-[820px] bg-white pb-16 font-sans">
            <div className="h-14 border-b border-neutral-100/60 bg-white" />
            <div className="px-4 pt-6 sm:px-6">
                <div className="h-10 w-48 rounded-[12px] bg-neutral-100" />
                <div className="mt-4 flex gap-2">
                    <div className="h-9 w-24 rounded-full bg-neutral-100" />
                    <div className="h-9 w-28 rounded-full bg-neutral-100" />
                    <div className="h-9 w-28 rounded-full bg-neutral-100" />
                </div>
            </div>
            <div className="mt-8 px-4 sm:px-6">
                <div className="h-[280px] w-full rounded-[24px] bg-neutral-100" />
                <div className="mt-8 space-y-4">
                    <div className="h-6 w-32 rounded-lg bg-neutral-100" />
                    <div className="h-[240px] w-full rounded-[20px] bg-neutral-100" />
                </div>
            </div>
        </div>
    )
}
