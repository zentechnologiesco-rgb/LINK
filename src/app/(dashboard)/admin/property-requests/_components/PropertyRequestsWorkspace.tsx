'use client'

import { useSearchParams } from 'next/navigation'
import { Building2 } from '@/components/ui/icons'

import { useUser } from '@/components/providers/UserProvider'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'
import { api } from '@convex/_generated/api'

import {
    AdminAccessDeniedState,
    AdminRequestWorkspaceLoadingState,
} from '../../_components/AdminPageStates'
import {
    filterPropertyRequests,
    type PropertyRequestRecord,
    type PropertyRequestStats,
    type PropertyRequestStatus,
} from '../_lib/property-request-workspace'
import { PropertyRequestFilters } from './PropertyRequestFilters'
import { PropertyRequestStatsCards } from './PropertyRequestStatsCards'
import { PropertyRequestsTable } from './PropertyRequestsTable'

function parsePropertyRequestStatus(
    value: string | null
): PropertyRequestStatus | undefined {
    return value === 'pending' || value === 'approved' || value === 'rejected'
        ? value
        : undefined
}

export function PropertyRequestsWorkspace() {
    const searchParams = useSearchParams()
    const statusFilter = parsePropertyRequestStatus(searchParams.get('status'))
    const searchQuery = searchParams.get('search') ?? ''

    const { user: currentUser, isLoading } = useUser()
    const { data: properties } = useCachedQuery(
        api.admin.getPropertyRequests,
        {
            queryName: 'admin_property_requests_v1',
            cacheKeySuffix: currentUser?._id ?? 'anonymous',
            storage: 'session',
        },
        { status: statusFilter }
    ) as { data: PropertyRequestRecord[] | undefined }
    const { data: stats } = useCachedQuery(
        api.admin.getPropertyStats,
        {
            queryName: 'admin_property_stats_v1',
            cacheKeySuffix: currentUser?._id ?? 'anonymous',
            storage: 'session',
        }
    ) as { data: PropertyRequestStats | undefined }

    if (isLoading || properties === undefined || stats === undefined) {
        return <AdminRequestWorkspaceLoadingState />
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return <AdminAccessDeniedState />
    }

    const filteredProperties = filterPropertyRequests(properties, searchQuery)

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="mb-2 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-purple-600" />
                    <h1 className="text-3xl font-bold tracking-tight">
                        Property Requests
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Review landlord submissions, approve what can go live later,
                    or send listings back with clear changes.
                </p>
            </div>

            <PropertyRequestStatsCards stats={stats} />

            <PropertyRequestFilters
                currentStatus={statusFilter ?? 'all'}
                currentSearch={searchQuery}
            />

            <PropertyRequestsTable
                properties={filteredProperties}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
            />
        </div>
    )
}
