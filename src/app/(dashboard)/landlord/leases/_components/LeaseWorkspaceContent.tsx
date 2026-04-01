'use client'

import { LeaseListCard } from './LeaseListCard'
import {
    FilterEmptyState,
    GlobalEmptyState,
} from './LeaseWorkspaceEmptyStates'
import type { FilterTab, LandlordLease } from '../_lib/leases-page-types'

export function LeaseWorkspaceContent({
    totalCount,
    filteredLeases,
    activeFilter,
}: {
    totalCount: number
    filteredLeases: LandlordLease[]
    activeFilter: FilterTab
}) {
    if (totalCount === 0) {
        return <GlobalEmptyState />
    }

    if (filteredLeases.length === 0) {
        return <FilterEmptyState filter={activeFilter} />
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
            {filteredLeases.map((lease, index) => (
                <div key={lease._id}>
                    <LeaseListCard lease={lease} />
                    {index < filteredLeases.length - 1 ? (
                        <div className="ml-[76px] border-t border-neutral-100 sm:ml-[88px]" />
                    ) : null}
                </div>
            ))}
        </div>
    )
}

