'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'

import { api } from '@convex/_generated/api'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useUser } from '@/components/providers/UserProvider'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'

import {
    PropertiesFilterEmptyState,
    PropertiesPortfolioEmptyState,
} from './PropertiesWorkspaceEmptyStates'
import { PropertiesWorkspaceHeader } from './PropertiesWorkspaceHeader'
import { PropertiesWorkspaceOverview } from './PropertiesWorkspaceOverview'
import { PropertyCard } from './PropertyCard'
import { PropertiesPageSkeleton } from './PropertiesPageSkeleton'
import {
    buildPropertiesDashboardView,
} from '../_lib/properties-page-helpers'
import {
    type FilterTab,
    type LandlordLease,
    type Property,
} from '../_lib/properties-page-types'

export function LandlordPropertiesWorkspace() {
    const router = useRouter()
    const { user: currentUser } = useUser()
    const { data: properties } = useCachedQuery(
        api.properties.getByLandlord,
        {
            queryName: 'landlord_properties_v1',
            cacheKeySuffix: currentUser?._id,
            storage: 'session',
        },
        {},
    )
    const leases = useQuery(api.leases.getForLandlord, {}) as LandlordLease[] | undefined
    const [activeTab, setActiveTab] = useState<FilterTab>('all')

    const handleRefresh = async () => {
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 800))
    }

    const { stats, filteredProperties } = useMemo(
        () => buildPropertiesDashboardView({
            properties: properties as Property[] | undefined,
            leases,
            activeTab,
        }),
        [activeTab, leases, properties],
    )

    if (properties === undefined) {
        return <PropertiesPageSkeleton />
    }

    const hasProperties = properties.length > 0

    return (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-white">
            <div className="mx-auto max-w-[1240px] pb-32 font-sans">
                <PropertiesWorkspaceHeader />
                <PropertiesWorkspaceOverview
                    activeTab={activeTab}
                    hasProperties={hasProperties}
                    onTabChange={setActiveTab}
                    stats={stats}
                />

                <div className="mt-6">
                    {!hasProperties ? (
                        <PropertiesPortfolioEmptyState />
                    ) : filteredProperties.length === 0 ? (
                        <PropertiesFilterEmptyState onReset={() => setActiveTab('all')} />
                    ) : (
                        <div className="grid grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-3 sm:px-6">
                            {filteredProperties.map((property) => (
                                <PropertyCard key={property._id} property={property} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PullToRefresh>
    )
}
