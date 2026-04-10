'use client'

import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Clock3,
    TrendingUp,
    type LucideIcon,
} from '@/components/ui/icons'

import { cn } from '@/lib/utils'

import type {
    FilterTab,
    PropertiesPageStats,
} from '../_lib/properties-page-types'

const SUMMARY_ITEMS: {
    id: FilterTab
    label: string
    valueKey: keyof PropertiesPageStats
    icon: LucideIcon
}[] = [
    { id: 'all', label: 'All', valueKey: 'total', icon: Building2 },
    { id: 'live', label: 'Live', valueKey: 'live', icon: CheckCircle2 },
    { id: 'review', label: 'Review', valueKey: 'review', icon: Clock3 },
    { id: 'changes', label: 'Changes', valueKey: 'changes', icon: AlertCircle },
    { id: 'reserved', label: 'Reserved', valueKey: 'reserved', icon: Clock3 },
    { id: 'leased', label: 'Leased', valueKey: 'leased', icon: Building2 },
    { id: 'off_market', label: 'Off Market', valueKey: 'offMarket', icon: TrendingUp },
]

export function PropertiesWorkspaceOverview({
    activeTab,
    hasProperties,
    onTabChange,
    stats,
}: {
    activeTab: FilterTab
    hasProperties: boolean
    onTabChange: (tab: FilterTab) => void
    stats: PropertiesPageStats
}) {
    return (
        <>
            <div className="px-4 pt-6 sm:px-6">
                <h1 className="text-[2.25rem] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[2.75rem]">
                    Portfolio
                </h1>
            </div>

            {hasProperties ? (
                <div className="mt-4 overflow-x-auto px-4 pb-2 sm:px-6 hide-scrollbar">
                    <div className="flex w-max shrink-0 items-center justify-start gap-2">
                        {SUMMARY_ITEMS.map((item) => {
                            const Icon = item.icon
                            const isActive = activeTab === item.id

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-95',
                                        isActive
                                            ? 'border-neutral-950 bg-neutral-950 text-white'
                                            : 'border-neutral-200/60 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                                    )}
                                >
                                    <Icon
                                        className={cn('h-4 w-4', isActive ? 'text-neutral-300' : 'text-neutral-500')}
                                        strokeWidth={2.2}
                                    />
                                    <span className={isActive ? 'text-white' : 'text-neutral-950'}>
                                        {stats[item.valueKey]}
                                    </span>
                                    <span>{item.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            ) : null}
        </>
    )
}
