import { CheckCircle2, Clock, XCircle } from '@/components/ui/icons'
import type { LucideIcon } from '@/components/ui/icons'

export type PropertyRequestStatus = 'pending' | 'approved' | 'rejected'

export type PropertyRequestRecord = {
    _id: string
    _creationTime: number
    title: string
    propertyType: string
    city: string
    bedrooms?: number
    bathrooms?: number
    approvalStatus?: PropertyRequestStatus
    approvalRequestedAt?: number
    images?: string[]
    landlord?: {
        fullName?: string | null
        email?: string | null
    } | null
}

export type PropertyRequestStats = {
    total: number
    pending: number
    approved: number
    rejected: number
}

export const propertyRequestStatusConfig: Record<
    PropertyRequestStatus,
    {
        label: string
        color: string
        icon: LucideIcon
    }
> = {
    pending: {
        label: 'In Review',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
    },
    approved: {
        label: 'Approved',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Needs Changes',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
    },
}

export function filterPropertyRequests(
    properties: PropertyRequestRecord[],
    searchQuery: string
) {
    if (!searchQuery) {
        return properties
    }

    const searchLower = searchQuery.toLowerCase()

    return properties.filter((property) => (
        property.title?.toLowerCase().includes(searchLower) ||
        property.city?.toLowerCase().includes(searchLower) ||
        property.landlord?.fullName?.toLowerCase().includes(searchLower) ||
        property.landlord?.email?.toLowerCase().includes(searchLower)
    ))
}

export function getPropertyRequestSubmittedAt(property: PropertyRequestRecord) {
    return property.approvalRequestedAt ?? property._creationTime
}
