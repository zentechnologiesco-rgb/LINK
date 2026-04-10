'use client'

import Link from 'next/link'
import type { ElementType } from 'react'
import {
    AlertCircle,
    CalendarRange,
    CheckCircle2,
    Plus,
    Wallet2,
} from '@/components/ui/icons'

import { cn } from '@/lib/utils'

import { formatCurrency } from '../_lib/leases-page-helpers'
import type {
    FilterTab,
    LeasesDashboardView,
} from '../_lib/leases-page-types'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'action', label: 'Action needed' },
    { key: 'progress', label: 'In progress' },
    { key: 'active', label: 'Active' },
    { key: 'archive', label: 'Archive' },
]

export function LeaseWorkspaceHeader({
    activeFilter,
    view,
    onFilterChange,
}: {
    activeFilter: FilterTab
    view: LeasesDashboardView
    onFilterChange: (filter: FilterTab) => void
}) {
    return (
        <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/80 backdrop-blur-2xl">
            <div className="flex items-center justify-between px-5 pb-1 pt-4 sm:px-6">
                <div>
                    <p className="text-[13px] font-medium text-neutral-500">
                        Lease workspace
                    </p>
                    <h1 className="mt-1 text-[1.75rem] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[2rem]">
                        Leases
                    </h1>
                </div>
                <Link
                    href="/landlord/leases/new"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-white transition-all hover:bg-neutral-800 active:scale-95"
                    aria-label="Create new lease"
                >
                    <Plus className="h-5 w-5" strokeWidth={2.2} />
                </Link>
            </div>

            {view.totalCount > 0 ? (
                <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-2.5 sm:px-6">
                    {view.actionRequiredCount > 0 ? (
                        <StatPill
                            icon={AlertCircle}
                            label={`${view.actionRequiredCount} needs review`}
                            tone="attention"
                        />
                    ) : null}
                    <StatPill
                        icon={CheckCircle2}
                        label={`${view.activeCount} active`}
                        tone="default"
                    />
                    <StatPill
                        icon={Wallet2}
                        label={`${formatCurrency(view.totalMonthlyBooked)}/mo`}
                        tone="default"
                    />
                    {view.renewalsSoonCount > 0 ? (
                        <StatPill
                            icon={CalendarRange}
                            label={`${view.renewalsSoonCount} ending soon`}
                            tone="attention"
                        />
                    ) : null}
                </div>
            ) : null}

            <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 pb-3 pt-1 sm:px-6">
                {FILTER_TABS.map((tab) => {
                    const isActive = activeFilter === tab.key
                    const count = view.tabCounts[tab.key]

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onFilterChange(tab.key)}
                            className={cn(
                                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-200',
                                isActive
                                    ? 'bg-neutral-950 text-white shadow-sm'
                                    : 'bg-white text-neutral-600 hover:bg-neutral-100',
                            )}
                        >
                            {tab.label}
                            {count > 0 ? (
                                <span
                                    className={cn(
                                        'ml-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none',
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-neutral-100 text-neutral-500',
                                    )}
                                >
                                    {count}
                                </span>
                            ) : null}
                        </button>
                    )
                })}
            </div>
        </header>
    )
}

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
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold',
                tone === 'attention'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-neutral-200 bg-white text-neutral-600',
            )}
        >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {label}
        </span>
    )
}
