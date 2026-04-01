import type { LeaseStatus } from '@/constants/lease'

export type TenantLease = {
    _id: string
    status: LeaseStatus
    startDate: string
    endDate: string
    monthlyRent?: number | null
    property?: {
        title?: string | null
        address?: string | null
        imageUrl?: string | null
    } | null
}

export type LeaseSectionTone = 'default' | 'attention' | 'muted'
