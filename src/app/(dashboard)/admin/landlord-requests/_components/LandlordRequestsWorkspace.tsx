'use client'

import { useSearchParams } from 'next/navigation'
import { ClipboardList } from 'lucide-react'

import { useUser } from '@/components/providers/UserProvider'
import { useCachedQuery } from '@/hooks/useOptimisticQuery'
import { api } from '@convex/_generated/api'

import {
    AdminAccessDeniedState,
    AdminRequestWorkspaceLoadingState,
} from '../../_components/AdminPageStates'
import {
    filterLandlordRequests,
    type LandlordRequestRecord,
    type LandlordRequestStats,
    type LandlordRequestStatus,
} from '../_lib/landlord-request-workspace'
import { LandlordRequestFilters } from './LandlordRequestFilters'
import { LandlordRequestStatsCards } from './LandlordRequestStatsCards'
import { LandlordRequestsTable } from './LandlordRequestsTable'

function parseLandlordRequestStatus(
    value: string | null
): LandlordRequestStatus | undefined {
    return value === 'pending' || value === 'approved' || value === 'rejected'
        ? value
        : undefined
}

export function LandlordRequestsWorkspace() {
    const searchParams = useSearchParams()
    const statusFilter = parseLandlordRequestStatus(searchParams.get('status'))
    const searchQuery = searchParams.get('search') ?? ''

    const { user: currentUser, isLoading } = useUser()
    const { data: requests } = useCachedQuery(
        api.verification.getAll,
        {
            queryName: 'admin_landlord_requests_v1',
            cacheKeySuffix: currentUser?._id ?? 'anonymous',
            storage: 'session',
        },
        { status: statusFilter }
    ) as { data: LandlordRequestRecord[] | undefined }
    const { data: stats } = useCachedQuery(
        api.verification.getStats,
        {
            queryName: 'admin_landlord_stats_v1',
            cacheKeySuffix: currentUser?._id ?? 'anonymous',
            storage: 'session',
        }
    ) as { data: LandlordRequestStats | undefined }

    if (isLoading || requests === undefined || stats === undefined) {
        return <AdminRequestWorkspaceLoadingState />
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return <AdminAccessDeniedState />
    }

    const filteredRequests = filterLandlordRequests(requests, searchQuery)

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="mb-2 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-purple-600" />
                    <h1 className="text-3xl font-bold tracking-tight">
                        Landlord Requests
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Review and manage landlord verification applications.
                </p>
            </div>

            <LandlordRequestStatsCards stats={stats} />

            <LandlordRequestFilters
                currentStatus={statusFilter ?? 'all'}
                currentSearch={searchQuery}
            />

            <LandlordRequestsTable
                requests={filteredRequests}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
            />
        </div>
    )
}
