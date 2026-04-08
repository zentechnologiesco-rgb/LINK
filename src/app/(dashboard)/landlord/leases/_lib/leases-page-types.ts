import type { LeaseStatus } from '@/constants/lease'

export type LandlordLease = {
    _id: string
    status: LeaseStatus
    startDate: string
    endDate: string
    monthlyRent?: number
    sentAt?: number
    signedAt?: number
    property?: {
        title?: string | null
        address?: string | null
        imageUrl?: string | null
    } | null
    tenant?: {
        fullName?: string | null
        email?: string | null
    } | null
}

export type FilterTab = 'all' | 'action' | 'progress' | 'active' | 'archive'

export type LeasesDashboardView = {
    totalCount: number
    filteredLeases: LandlordLease[]
    tabCounts: Record<FilterTab, number>
    actionRequiredCount: number
    activeCount: number
    totalMonthlyBooked: number
    renewalsSoonCount: number
}

