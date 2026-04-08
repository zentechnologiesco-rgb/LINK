'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { api } from '@convex/_generated/api'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useUser } from '@/components/providers/UserProvider'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'

import { LeaseWorkspaceContent } from './LeaseWorkspaceContent'
import { LeaseWorkspaceHeader } from './LeaseWorkspaceHeader'
import { LeaseWorkspaceSecondaryNav } from './LeaseWorkspaceSecondaryNav'
import { LeaseWorkspaceSkeleton } from './LeaseWorkspaceSkeleton'
import { buildLeasesDashboardView } from '../_lib/leases-page-helpers'
import type {
    FilterTab,
    LandlordLease,
} from '../_lib/leases-page-types'

export function LandlordLeaseWorkspace() {
    const router = useRouter()
    const { user: currentUser } = useUser()
    const { data: leases } = useCachedQuery(
        api.leases.getForLandlord,
        {
            queryName: 'landlord_leases_v1',
            cacheKeySuffix: currentUser?._id,
            storage: 'session',
        },
        {},
    ) as { data: LandlordLease[] | undefined }
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

    const handleRefresh = async () => {
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (leases === undefined) {
        return <LeaseWorkspaceSkeleton />
    }

    const view = buildLeasesDashboardView({ leases, activeFilter })

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-white">
            <div className="mx-auto max-w-[820px] pb-24 font-sans sm:pb-10">
                <LeaseWorkspaceHeader
                    activeFilter={activeFilter}
                    view={view}
                    onFilterChange={setActiveFilter}
                />

                <div className="px-4 pt-4 sm:px-6">
                    <LeaseWorkspaceContent
                        totalCount={view.totalCount}
                        filteredLeases={view.filteredLeases}
                        activeFilter={activeFilter}
                    />
                </div>

                <LeaseWorkspaceSecondaryNav />
            </div>
        </PullToRefresh>
    )
}
