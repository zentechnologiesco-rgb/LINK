import { CheckCircle2, Clock, XCircle } from '@/components/ui/icons'
import type { LucideIcon } from '@/components/ui/icons'

export type LandlordRequestStatus = 'pending' | 'approved' | 'rejected'

export type LandlordRequestRecord = {
    _id: string
    _creationTime: number
    status: LandlordRequestStatus
    documents?: {
        businessName?: string | null
        idType?: string | null
        isResubmission?: boolean
    } | null
    user?: {
        fullName?: string | null
        email?: string | null
    } | null
}

export type LandlordRequestStats = {
    total: number
    pending: number
    approved: number
    rejected: number
}

export const landlordRequestStatusConfig: Record<
    LandlordRequestStatus,
    {
        label: string
        color: string
        icon: LucideIcon
    }
> = {
    pending: {
        label: 'Pending',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
    },
    approved: {
        label: 'Approved',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Rejected',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
    },
}

export function filterLandlordRequests(
    requests: LandlordRequestRecord[],
    searchQuery: string
) {
    if (!searchQuery) {
        return requests
    }

    const searchLower = searchQuery.toLowerCase()

    return requests.filter((request) => (
        request.user?.fullName?.toLowerCase().includes(searchLower) ||
        request.user?.email?.toLowerCase().includes(searchLower) ||
        request.documents?.businessName?.toLowerCase().includes(searchLower)
    ))
}
