'use client'

import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'

import { LEASE_STATUS_LABELS } from '@/constants/lease'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { cn } from '@/lib/utils'

import {
    formatCurrency,
    getLeaseSubtitle,
    getStatusBadgeClasses,
} from '../_lib/leases-page-helpers'
import type { LandlordLease } from '../_lib/leases-page-types'

export function LeaseListCard({ lease }: { lease: LandlordLease }) {
    const subtitle = getLeaseSubtitle(lease)

    return (
        <Link href={`/landlord/leases/${lease._id}`} className="block">
            <article className="group flex items-center gap-3.5 px-4 py-3.5 transition-all duration-150 hover:bg-neutral-50/60 active:scale-[0.98] active:bg-neutral-50/80 sm:gap-4 sm:px-5 sm:py-4">
                <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 sm:h-[58px] sm:w-[58px]">
                    {lease.property?.imageUrl ? (
                        <OptimizedImage
                            src={lease.property.imageUrl}
                            alt={lease.property?.title || 'Property'}
                            fill
                            sizes="(max-width: 640px) 52px, 58px"
                            qualityPreset="thumbnail"
                            showSkeleton={false}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <Building2
                            className="h-5 w-5 text-neutral-400"
                            strokeWidth={1.8}
                        />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                            {lease.property?.title || 'Property'}
                        </h3>
                        <span
                            className={cn(
                                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                getStatusBadgeClasses(lease.status),
                            )}
                        >
                            {LEASE_STATUS_LABELS[lease.status]}
                        </span>
                    </div>

                    <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                        {lease.tenant?.fullName || 'Unassigned'} ·{' '}
                        {formatCurrency(lease.monthlyRent)}/mo
                    </p>

                    <p className="mt-1 text-[12px] font-medium text-neutral-400">
                        {subtitle}
                    </p>
                </div>

                <ChevronRight
                    className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-500"
                    strokeWidth={2}
                />
            </article>
        </Link>
    )
}

